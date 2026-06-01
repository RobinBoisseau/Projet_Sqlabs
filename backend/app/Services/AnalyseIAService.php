<?php

namespace App\Services;

use App\Models\ReponseIA;
use App\Models\Tentative;

class AnalyseIAService
{
    public function __construct(private PromptService $prompts) {}

    // ── Point d'entrée : analyse les 3 composants et retourne les résultats ──

    public function analyseAll(
        Tentative $current,  // tentative qui vient d'être stockée
        ?Tentative $last,    // dernière tentative de l'étudiant en BD
        array $mcd,
        array $dictionary,
        array $dependencies,
        array $hashes,       // hash DD, DF, MCD de la tentative courante
        OllamaService $ollama
    ): array {
        // 1. DD — toujours analysé en premier
        $resDico = $this->analyseComponent('dico', $dictionary, $current->id, $last, $hashes['dico'], 'hash_dico', $ollama);

        // 2. DF — analysé uniquement si le DD est entièrement valide
        $resDep = null;
        if ($this->isFullyValid($resDico)) {
            $resDep = $this->analyseComponent('dep', $dependencies, $current->id, $last, $hashes['dep'], 'hash_dep', $ollama);
        }

        // 3. MCD — analysé uniquement si les DF sont entièrement valides
        $resMcd = null;
        if ($this->isFullyValid($resDep)) {
            $resMcd = $this->analyseComponent('mcd', $mcd, $current->id, $last, $hashes['mcd'], 'hash_mcd', $ollama);
        }

        return [
            'mcd'          => $resMcd,
            'dictionary'   => $resDico,
            'dependencies' => $resDep,
            'succes'       => [
                'DD'      => $this->isFullyValid($resDico),
                'DF'      => $this->isFullyValid($resDep),
                'MCD'     => $this->isFullyValid($resMcd),
                'message' => ($this->isFullyValid($resDico) && $this->isFullyValid($resDep) && $this->isFullyValid($resMcd))
                             ? 'Félicitations, tout est correct !'
                             : '',
            ],
        ];
    }

    // ── Décide pour un composant : cache ou appel IA (logique du flowchart) ──

    public function analyseComponent(
        string $element,         // 'mcd', 'dico' ou 'dep'
        mixed $data,             // données du composant (MCD, dictionnaire ou dépendances)
        int $currentTentativeId, // ID de la tentative courante (pour sauvegarder la réponse IA)
        ?Tentative $last,        // dernière tentative en BD
        string $currentHash,     // hash du composant dans la tentative courante
        string $hashCol,         // colonne de hash à comparer dans la dernière tentative
        OllamaService $ollama
    ): array {
        if ($last && $last->{$hashCol} === $currentHash) {
            $cached = $this->getCachedResponse($last->id, $element);

            if ($cached) {
                if ($this->isFullyValid($cached)) {
                    // Niveau 1 : hash identique ET validé → renvoie le cache (chemin succès)
                    return $cached;
                }
                // Niveau 2 : hash identique ET non validé → renvoie la dernière réponse en cache
                return $cached;
            }
        }

        // Niveau 3 : hash différent ou pas de cache → appel à l'IA
        return $this->callAI($element, $data, $currentTentativeId, $ollama);
    }

    // ── Helpers publics ──

    // Récupère la réponse IA mise en cache pour une tentative et un composant donnés
    public function getCachedResponse(int $tentativeId, string $element): ?array
    {
        $reponse = ReponseIA::where('tentative_id', $tentativeId)
            ->where('element', $element)
            ->latest('id')
            ->first();

        return $reponse?->reponseJson;
    }

    // Vérifie si toutes les remarques d'une réponse IA ont le statut "valide"
    public function isFullyValid(?array $reponseJson): bool
    {
        if (!$reponseJson || empty($reponseJson['remarques'])) return false;

        foreach ($reponseJson['remarques'] as $remarque) {
            if (($remarque['statut'] ?? '') !== 'valide') return false;
        }

        return true;
    }

    // Récupère les 3 dernières réponses IA en cache pour une tentative (cas "tentative identique")
    // Applique la même logique séquentielle : DF seulement si DD valide, MCD seulement si DF valide
    public function getAllLastResponses(Tentative $tentative): array
    {
        $dico = $this->getCachedResponse($tentative->id, 'dico');
        $dep  = $this->isFullyValid($dico) ? $this->getCachedResponse($tentative->id, 'dep') : null;
        $mcd  = $this->isFullyValid($dep)  ? $this->getCachedResponse($tentative->id, 'mcd') : null;

        return [
            'mcd'          => $mcd,
            'dictionary'   => $dico,
            'dependencies' => $dep,
        ];
    }

    // ── Appel IA : charge le contexte et redirige vers la bonne méthode d'analyse ──

    private function callAI(string $element, mixed $data, int $tentativeId, OllamaService $ollama): array
    {
        set_time_limit(0);
        ini_set('default_socket_timeout', -1);

        // Charge l'énoncé de l'exercice et la tentative-corrigé associés
        [$enonce, $correction] = $this->loadContext($tentativeId);

        // Redirige vers la méthode d'analyse selon le composant
        return match ($element) {
            'mcd'  => $this->analyseMcd($data, $tentativeId, $enonce, $correction?->modele, $ollama),
            'dico' => $this->analyseDictionary($data, $tentativeId, $enonce, $correction?->dictionnaire, $ollama),
            'dep'  => $this->analyseDependencies($data, $tentativeId, $enonce, $correction?->dependance, $ollama),
        };
    }

    // Charge l'énoncé et la tentative-corrigé liés à la tentative courante
    private function loadContext(int $tentativeId): array
    {
        $tentative  = Tentative::with('exercice')->find($tentativeId);
        $enonce     = $tentative?->exercice?->enonce ?? 'Contexte de l\'exercice non disponible.';
        $exerciceId = $tentative?->exercice_id;

        // Récupère la tentative marquée comme correction pour cet exercice
        $correction = $exerciceId
            ? Tentative::where('exercice_id', $exerciceId)->where('is_correction', true)->first()
            : null;

        return [$enonce, $correction];
    }

    // Sauvegarde (ou met à jour) la réponse IA en BD pour la mise en cache
    private function saveReponse(int $tentativeId, string $element, mixed $contenu, array $reponseJson): void
    {
        ReponseIA::updateOrCreate(
            ['tentative_id' => $tentativeId, 'element' => $element],
            ['contenuJson' => $contenu, 'reponseJson' => $reponseJson, 'dateHeureReponse' => now()]
        );
    }

    // ── Analyse MCD ──

    private function analyseMcd(array $mcd, int $tentativeId, string $enonce, ?array $correction, OllamaService $ollama): array
    {
        // Auto-validation : pas de corrigé ou hash sémantique identique → tout est valide sans appel IA
        if (!$correction || $this->semanticHashMcd($mcd) === $this->semanticHashMcd($correction)) {
            $remarques = [];
            foreach ($mcd['Entities']     ?? [] as $e) $remarques[] = ['id' => $e['id'], 'statut' => 'valide', 'message' => 'Parfait !'];
            foreach ($mcd['Associations'] ?? [] as $a) $remarques[] = ['id' => $a['id'], 'statut' => 'valide', 'message' => 'Parfait !'];
            $reponseJson = ['remarques' => $remarques];
            $this->saveReponse($tentativeId, 'mcd', $mcd, $reponseJson);
            return $reponseJson;
        }

        // MCD différent du corrigé → envoie à l'IA pour analyse
        $prompt      = $this->prompts->userPrompt('mcd', $enonce, json_encode($this->flattenMcd($mcd), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), json_encode($this->flattenMcd($correction), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $data        = $ollama->generateJson($prompt, 500, $this->prompts->systemPrompt('mcd')); // ← APPEL IA
        $reponseJson = ['remarques' => $data['remarques'] ?? []];
        $this->saveReponse($tentativeId, 'mcd', $mcd, $reponseJson);
        return $reponseJson;
    }

    // ── Analyse Dictionnaire ──

    private function analyseDictionary(array $dictionary, int $tentativeId, string $enonce, ?array $correction, OllamaService $ollama): array
    {
        // Auto-validation : pas de corrigé ou hash sémantique identique → tout est valide sans appel IA
        if (!$correction || $this->semanticHashDictionary($dictionary) === $this->semanticHashDictionary($correction)) {
            $remarques   = array_map(fn($f) => ['champ' => $f['TechnicalName'] ?? '', 'statut' => 'valide', 'message' => 'Parfait !'], $dictionary);
            $reponseJson = ['remarques' => $remarques];
            $this->saveReponse($tentativeId, 'dico', $dictionary, $reponseJson);
            return $reponseJson;
        }

        // Dictionnaire différent du corrigé → envoie à l'IA pour analyse
        $prompt      = $this->prompts->userPrompt('dictionary', $enonce, json_encode($dictionary, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), json_encode($correction, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $data        = $ollama->generateJson($prompt, 500, $this->prompts->systemPrompt('dictionary')); // ← APPEL IA
        $reponseJson = ['remarques' => $data['remarques'] ?? []];
        $this->saveReponse($tentativeId, 'dico', $dictionary, $reponseJson);
        return $reponseJson;
    }

    // ── Analyse Dépendances ──

    private function analyseDependencies(array $dependencies, int $tentativeId, string $enonce, ?array $correction, OllamaService $ollama): array
    {
        // Auto-validation : pas de corrigé ou hash sémantique identique → tout est valide sans appel IA
        if (!$correction || $this->semanticHashDependencies($dependencies) === $this->semanticHashDependencies($correction)) {
            $remarques = array_map(function ($dep) {
                // source peut être un tableau → on joint avec une virgule pour l'affichage
                $src = is_array($dep['source'] ?? null) ? implode(',', $dep['source']) : ($dep['source'] ?? '?');
                return ['source' => $src, 'statut' => 'valide', 'message' => 'Parfait !'];
            }, $dependencies);
            $reponseJson = ['remarques' => $remarques];
            $this->saveReponse($tentativeId, 'dep', $dependencies, $reponseJson);
            return $reponseJson;
        }

        // Dépendances différentes du corrigé → envoie à l'IA pour analyse
        $prompt      = $this->prompts->userPrompt('dependencies', $enonce, json_encode($dependencies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), json_encode($correction, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $data        = $ollama->generateJson($prompt, 500, $this->prompts->systemPrompt('dependencies')); // ← APPEL IA
        $reponseJson = ['remarques' => $data['remarques'] ?? []];
        $this->saveReponse($tentativeId, 'dep', $dependencies, $reponseJson);
        return $reponseJson;
    }

    // ── Transforme le MCD pour l'IA : intègre les cardinalités directement dans chaque association ──

    private function flattenMcd(array $mcd): array
    {
        $entityIdToName = array_column($mcd['Entities'] ?? [], 'name', 'id');

        $entities = array_map(fn($e) => [
            'id'     => $e['id'],
            'name'   => $e['name'] ?? '',
            'fields' => $e['fields'] ?? [],
        ], $mcd['Entities'] ?? []);

        $associations = [];
        foreach ($mcd['Associations'] ?? [] as $assoc) {
            $cardinalities = [];
            foreach ($mcd['Links'] ?? [] as $link) {
                if ((string)$link['assocId'] !== (string)$assoc['id']) continue;
                $entityName = $entityIdToName[(string)$link['entityId']] ?? $link['entityId'];
                $cardinalities[] = ['entity' => $entityName, 'cardinality' => $link['cardinality'] ?? ''];
            }
            $associations[] = [
                'id'            => $assoc['id'],
                'name'          => $assoc['name'] ?? '',
                'fields'        => $assoc['fields'] ?? [],
                'cardinalities' => $cardinalities,
            ];
        }

        return ['Entities' => $entities, 'Associations' => $associations];
    }

    // ── Hash sémantiques : ignorent positions, IDs et ordre pour comparer uniquement le contenu ──

    // Hash du MCD : compare entités/associations par nom et attributs (ignore IDs et positions)
    private function semanticHashMcd(array $mcd): string
    {
        $entityIdToName = array_column($mcd['Entities'] ?? [], 'name', 'id');

        $entities = [];
        foreach ($mcd['Entities'] ?? [] as $entity) {
            // Trie les attributs de l'entité par nom technique pour ignorer l'ordre de saisie
            $fields = array_map(fn($f) => ['TechnicalName' => $f['TechnicalName'] ?? '', 'Type' => $f['Type'] ?? '', 'PrimaryKey' => $f['PrimaryKey'] ?? false], $entity['fields'] ?? []);
            usort($fields, fn($a, $b) => strcmp($a['TechnicalName'], $b['TechnicalName']));
            $entities[] = ['name' => $entity['name'] ?? '', 'fields' => $fields];
        }
        usort($entities, fn($a, $b) => strcmp($a['name'], $b['name'])); // trie les entités par nom

        $associations = [];
        foreach ($mcd['Associations'] ?? [] as $assoc) {
            // Récupère les liens (cardinalités) de l'association en remplaçant les IDs par les noms
            $links = [];
            foreach ($mcd['Links'] ?? [] as $link) {
                if ($link['assocId'] !== $assoc['id']) continue;
                $links[] = ['entity' => $entityIdToName[$link['entityId']] ?? '', 'cardinality' => $link['cardinality'] ?? ''];
            }
            usort($links, fn($a, $b) => strcmp($a['entity'], $b['entity']));
            $fields = array_map(fn($f) => ['TechnicalName' => $f['TechnicalName'] ?? '', 'Type' => $f['Type'] ?? ''], $assoc['fields'] ?? []);
            usort($fields, fn($a, $b) => strcmp($a['TechnicalName'], $b['TechnicalName']));
            $associations[] = ['name' => $assoc['name'] ?? '', 'fields' => $fields, 'links' => $links];
        }
        usort($associations, fn($a, $b) => strcmp($a['name'], $b['name']));

        return hash('sha256', json_encode(['entities' => $entities, 'associations' => $associations], JSON_UNESCAPED_UNICODE));
    }

    // Hash du dictionnaire : compare uniquement nom technique, type et clé primaire (ignore l'ordre)
    private function semanticHashDictionary(array $dictionary): string
    {
        $data = array_map(fn($f) => ['TechnicalName' => $f['TechnicalName'] ?? '', 'Type' => $f['Type'] ?? '', 'PrimaryKey' => $f['PrimaryKey'] ?? false], $dictionary);
        usort($data, fn($a, $b) => strcmp($a['TechnicalName'], $b['TechnicalName']));
        return hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    // Hash des dépendances : trie source et cible pour ignorer l'ordre de saisie
    private function semanticHashDependencies(array $dependencies): string
    {
        $data = array_map(function ($dep) {
            $source = $dep['source'] ?? []; $cible = $dep['cible'] ?? [];
            sort($source); sort($cible);
            return ['source' => $source, 'cible' => $cible];
        }, $dependencies);
        usort($data, fn($a, $b) => json_encode($a['source']) <=> json_encode($b['source']));
        return hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
    }
}
