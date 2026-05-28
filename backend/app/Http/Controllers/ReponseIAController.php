<?php

namespace App\Http\Controllers;

use App\Models\ReponseIA;
use App\Models\Tentative;
use App\Services\OllamaService;
use App\Services\PromptService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReponseIAController extends Controller
{
    public function __construct(private PromptService $prompts) {}

    // --- Helpers ---

    private function buildSemanticMcd(array $mcd): array
    {
        $entityIdToName = array_column($mcd['Entities'] ?? [], 'name', 'id');

        $entities = [];
        foreach ($mcd['Entities'] ?? [] as $entity) {
            $fields = array_map(fn($f) => [
                'TechnicalName' => $f['TechnicalName'] ?? '',
                'Type'          => $f['Type'] ?? '',
                'PrimaryKey'    => $f['PrimaryKey'] ?? false,
            ], $entity['fields'] ?? []);
            usort($fields, fn($a, $b) => strcmp($a['TechnicalName'], $b['TechnicalName']));
            $entities[] = ['name' => $entity['name'] ?? '', 'fields' => $fields];
        }
        usort($entities, fn($a, $b) => strcmp($a['name'], $b['name']));

        $associations = [];
        foreach ($mcd['Associations'] ?? [] as $assoc) {
            $links = [];
            foreach ($mcd['Links'] ?? [] as $link) {
                if ($link['assocId'] !== $assoc['id']) continue;
                $links[] = [
                    'entity'      => $entityIdToName[$link['entityId']] ?? '',
                    'cardinality' => $link['cardinality'] ?? '',
                ];
            }
            usort($links, fn($a, $b) => strcmp($a['entity'], $b['entity']));

            $fields = array_map(fn($f) => [
                'TechnicalName' => $f['TechnicalName'] ?? '',
                'Type'          => $f['Type'] ?? '',
            ], $assoc['fields'] ?? []);
            usort($fields, fn($a, $b) => strcmp($a['TechnicalName'], $b['TechnicalName']));

            $associations[] = ['name' => $assoc['name'] ?? '', 'fields' => $fields, 'links' => $links];
        }
        usort($associations, fn($a, $b) => strcmp($a['name'], $b['name']));

        return ['entities' => $entities, 'associations' => $associations];
    }

    private function semanticHashMcd(array $mcd): string
    {
        return hash('sha256', json_encode($this->buildSemanticMcd($mcd), JSON_UNESCAPED_UNICODE));
    }

    private function semanticHashDictionary(array $dictionary): string
    {
        $data = array_map(fn($f) => [
            'TechnicalName' => $f['TechnicalName'] ?? '',
            'Type'          => $f['Type'] ?? '',
            'PrimaryKey'    => $f['PrimaryKey'] ?? false,
        ], $dictionary);
        usort($data, fn($a, $b) => strcmp($a['TechnicalName'], $b['TechnicalName']));
        return hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    private function semanticHashDependencies(array $dependencies): string
    {
        $data = array_map(function ($dep) {
            $source = $dep['source'] ?? [];
            $cible  = $dep['cible']  ?? [];
            sort($source);
            sort($cible);
            return ['source' => $source, 'cible' => $cible];
        }, $dependencies);
        usort($data, fn($a, $b) => json_encode($a['source']) <=> json_encode($b['source']));
        return hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    private function loadContext(?int $tentativeId): array
    {
        if (!$tentativeId) return [null, null];

        $tentative  = Tentative::with('exercice')->find($tentativeId);
        $enonce     = $tentative?->exercice?->enonce;
        $exerciceId = $tentative?->exercice_id;

        $correction = $exerciceId
            ? Tentative::where('exercice_id', $exerciceId)->where('is_correction', true)->first()
            : null;

        return [$enonce, $correction];
    }

    private function saveReponse(?int $tentativeId, string $element, mixed $contenu, array $reponseJson): void
    {
        if (!$tentativeId) return;
        ReponseIA::updateOrCreate(
            ['tentative_id' => $tentativeId, 'element' => $element],
            ['contenuJson' => $contenu, 'reponseJson' => $reponseJson, 'dateHeureReponse' => now()]
        );
    }

    // --- Analyse MCD ---

    public function analyzeMcd(Request $request, OllamaService $ollama): JsonResponse
    {
        set_time_limit(0);
        ini_set('default_socket_timeout', -1);

        // Récupération et validation du MCD envoyé par l'étudiant
        $mcd = $request->input('mcd');
        if (!$mcd || empty($mcd['Entities'])) {
            return response()->json(['error' => 'MCD manquant ou vide'], 422);
        }

        // Chargement de l'énoncé et de la tentative-corrigé liés à la tentative courante
        [$enonce, $correctionTentative] = $this->loadContext($request->input('tentative_id'));
        $correction = $correctionTentative?->modele;

        // Auto-validation : pas de corrigé disponible, ou le hash sémantique de l'étudiant
        // correspond exactement à celui du corrigé → tout est valide, sans appel IA
        if (!$correction || $this->semanticHashMcd($mcd) === $this->semanticHashMcd($correction)) {
            $remarques = [];
            foreach ($mcd['Entities'] ?? [] as $entity) {
                $remarques[] = ['id' => $entity['id'], 'statut' => 'valide', 'message' => 'Parfait !'];
            }
            foreach ($mcd['Associations'] ?? [] as $assoc) {
                $remarques[] = ['id' => $assoc['id'], 'statut' => 'valide', 'message' => 'Parfait !'];
            }
            $reponseJson = ['remarques' => $remarques];
            $this->saveReponse($request->input('tentative_id'), 'mcd', $mcd, $reponseJson);
            return response()->json(array_merge(['mcd' => $mcd], $reponseJson));
        }

        // Le MCD diffère du corrigé : on demande à l'IA de comparer et de produire des remarques
        $contexte = $enonce ?? 'Contexte de l\'exercice non disponible.';
        $prompt   = $this->prompts->userPrompt(
            'mcd',
            $contexte,
            json_encode($mcd,        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            json_encode($correction,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        $data        = $ollama->generateJson($prompt, 500, $this->prompts->systemPrompt('mcd'));
        $reponseJson = ['remarques' => $data['remarques'] ?? []];
        // Sauvegarde de la réponse IA en base pour la mise en cache (évite de rappeler l'IA si le MCD n'a pas changé)
        $this->saveReponse($request->input('tentative_id'), 'mcd', $mcd, $reponseJson);
        return response()->json(array_merge(['mcd' => $mcd], $reponseJson));
    }

    // --- Analyse Dictionnaire ---

    public function analyzeDictionary(Request $request, OllamaService $ollama): JsonResponse
    {
        set_time_limit(0);
        ini_set('default_socket_timeout', -1);

        // Récupération et validation du dictionnaire envoyé par l'étudiant
        $dictionary = $request->input('dictionary');
        if (!$dictionary || !is_array($dictionary) || count($dictionary) === 0) {
            return response()->json(['error' => 'Dictionnaire manquant ou vide'], 422);
        }

        // Chargement de l'énoncé et du corrigé liés à la tentative courante
        [$enonce, $correctionTentative] = $this->loadContext($request->input('tentative_id'));
        $correction = $correctionTentative?->dictionnaire;

        // Auto-validation : pas de corrigé ou hash identique → tout valide, sans appel IA
        if (!$correction || $this->semanticHashDictionary($dictionary) === $this->semanticHashDictionary($correction)) {
            $remarques = [];
            foreach ($dictionary as $field) {
                $nom = $field['TechnicalName'] ?? $field['technicalName'] ?? '?';
                $remarques[] = ['champ' => $nom, 'statut' => 'valide', 'message' => 'Parfait !'];
            }
            $reponseJson = ['remarques' => $remarques];
            $this->saveReponse($request->input('tentative_id'), 'dico', $dictionary, $reponseJson);
            return response()->json(array_merge(['dictionary' => $dictionary], $reponseJson));
        }

        // Le dictionnaire diffère du corrigé : analyse par l'IA
        $contexte = $enonce ?? 'Contexte de l\'exercice non disponible.';
        $prompt   = $this->prompts->userPrompt(
            'dictionary',
            $contexte,
            json_encode($dictionary, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            json_encode($correction,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        $data        = $ollama->generateJson($prompt, 500, $this->prompts->systemPrompt('dictionary'));
        $reponseJson = ['remarques' => $data['remarques'] ?? []];
        // Sauvegarde pour mise en cache
        $this->saveReponse($request->input('tentative_id'), 'dico', $dictionary, $reponseJson);
        return response()->json(array_merge(['dictionary' => $dictionary], $reponseJson));
    }

    // --- Analyse Dépendances ---

    public function analyzeDependencies(Request $request, OllamaService $ollama): JsonResponse
    {
        set_time_limit(0);
        ini_set('default_socket_timeout', -1);

        // Récupération et validation des dépendances fonctionnelles envoyées par l'étudiant
        $dependencies = $request->input('dependencies');
        if (!$dependencies || !is_array($dependencies) || count($dependencies) === 0) {
            return response()->json(['error' => 'Dépendances manquantes ou vides'], 422);
        }

        // Chargement de l'énoncé et du corrigé liés à la tentative courante
        [$enonce, $correctionTentative] = $this->loadContext($request->input('tentative_id'));
        $correction = $correctionTentative?->dependance; // null si pas de corrigé, sinon les DF stockées dans la colonne `dependance` de la tentative-corrigé

        // Auto-validation : pas de corrigé ou hash identique → tout valide, sans appel IA
        if (!$correction || $this->semanticHashDependencies($dependencies) === $this->semanticHashDependencies($correction)) {
            $remarques = [];
            foreach ($dependencies as $dep) {
                // is_array() vérifie si `source` est un tableau ; le ?? null évite une erreur si la clé n'existe pas dans $dep
                // Si c'est un tableau → on joint les éléments avec une virgule pour l'affichage
                // Sinon → on prend la valeur telle quelle ; le ?? '?' met un point d'interrogation si la clé est absente
                $src = is_array($dep['source'] ?? null)
                    ? implode(',', $dep['source'])
                    : ($dep['source'] ?? '?');
                $remarques[] = ['source' => $src, 'statut' => 'valide', 'message' => 'Parfait !'];
            }
            $reponseJson = ['remarques' => $remarques];
            $this->saveReponse($request->input('tentative_id'), 'dep', $dependencies, $reponseJson);
            return response()->json(array_merge(['dependencies' => $dependencies], $reponseJson));
        }

        // Les dépendances diffèrent du corrigé : analyse par l'IA
        // L'énoncé de l'exercice sert de contexte à l'IA ; message par défaut si l'exercice n'en a pas
        $contexte = $enonce ?? 'Contexte de l\'exercice non disponible.';
        // Construction du prompt utilisateur : on passe le type d'analyse, le contexte, les DF de l'étudiant et celles du corrigé (en JSON lisible)
        $prompt   = $this->prompts->userPrompt(
            'dependencies',
            $contexte,
            json_encode($dependencies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            json_encode($correction,   JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        // Envoi du prompt à Mistral avec le prompt système adapté aux dépendances ; 500 = nombre max de tokens en réponse
        $data        = $ollama->generateJson($prompt, 500, $this->prompts->systemPrompt('dependencies'));
        // On extrait uniquement le tableau "remarques" de la réponse ; ?? [] évite une erreur si la clé est absente
        $reponseJson = ['remarques' => $data['remarques'] ?? []];
        // Sauvegarde en base pour la mise en cache : évite de rappeler l'IA si les mêmes DF sont soumises à nouveau
        $this->saveReponse($request->input('tentative_id'), 'dep', $dependencies, $reponseJson);
        // Retourne les dépendances originales + les remarques de l'IA au frontend
        return response()->json(array_merge(['dependencies' => $dependencies], $reponseJson));
    }

    // --- CRUD ReponseIA ---

    public function ask(Request $request, OllamaService $ollama): JsonResponse
    {
        $prompt  = $request->input('prompt', 'Est-ce qu\'il fait beau aujourd\'hui ?');
        $reponse = $ollama->generate($prompt);
        return response()->json(['prompt' => $prompt, 'reponse' => $reponse]);
    }

    public function index(): JsonResponse
    {
        return response()->json(ReponseIA::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'element'          => 'required|string|max:15',
            'contenuJson'      => 'required|array',
            'reponseJson'      => 'required|array',
            'dateHeureReponse' => 'required|date',
        ]);
        return response()->json(ReponseIA::create($validated), 201);
    }

    public function show(ReponseIA $reponseIA): JsonResponse
    {
        return response()->json($reponseIA);
    }

    public function update(Request $request, ReponseIA $reponseIA): JsonResponse
    {
        $validated = $request->validate([
            'element'          => 'sometimes|string|max:15',
            'contenuJson'      => 'sometimes|array',
            'reponseJson'      => 'sometimes|array',
            'dateHeureReponse' => 'sometimes|date',
        ]);
        $reponseIA->update($validated);
        return response()->json($reponseIA);
    }

    public function destroy(ReponseIA $reponseIA): JsonResponse
    {
        $reponseIA->delete();
        return response()->json(null, 204);
    }
}
