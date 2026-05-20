<?php
// app/Http/Controllers/ReponseIAController.php

namespace App\Http\Controllers;

use App\Models\ReponseIA;
use App\Services\OllamaService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReponseIAController extends Controller
{
    public function ask(Request $request, OllamaService $ollama): JsonResponse
    {
        set_time_limit(0);
        ini_set('default_socket_timeout', -1);
        $prompt = $request->input('prompt', 'Est-ce qu\'il fait beau aujourd\'hui ?');
        $reponse = $ollama->generate($prompt);
        return response()->json(['prompt' => $prompt, 'reponse' => $reponse]);
    }

    public function analyzeMcd(Request $request, OllamaService $ollama): JsonResponse
    {
        set_time_limit(0);
        ini_set('default_socket_timeout', -1);

        // MCD soumis — reçu depuis la BD (sauvegardé par le TentativeController)
        $mcd = $request->input('mcd');

        if (!$mcd || empty($mcd['Entities'])) {
            return response()->json(['error' => 'MCD manquant ou vide'], 422);
        }

        // Table de correspondance id → name pour les entités soumises
        $entityIdToName = array_column($mcd['Entities'], 'name', 'id');

        // MCD attendu construit dynamiquement depuis le MCD soumis
        // (placeholder : sera remplacé par le MCD solution de l'exercice)
        $attendu = ['Entities' => [], 'Associations' => []];

        foreach ($mcd['Entities'] as $entity) {
            $attendu['Entities'][$entity['name']] = ['fields' => $entity['fields'] ?? []];
        }

        foreach ($mcd['Associations'] as $assoc) {
            $links = [];
            foreach ($mcd['Links'] as $link) {
                if ($link['assocId'] !== $assoc['id']) continue;
                $entityName = $entityIdToName[$link['entityId']] ?? null;
                if ($entityName) {
                    $links[] = ['entityName' => $entityName, 'cardinality' => $link['cardinality']];
                }
            }
            $attendu['Associations'][$assoc['name']] = ['links' => $links];
        }

        // Comparaison PHP — détection des erreurs exactes
        $erreurs = [];

        // Comparaison des entités
        foreach ($mcd['Entities'] as $entity) {
            $nom           = $entity['name'];
            $erreursEntite = [];
            $attenduFields = array_column($attendu['Entities'][$nom]['fields'] ?? [], null, 'name');
            $soumisFields  = array_column($entity['fields'], null, 'name');

            foreach ($attenduFields as $fieldName => $fieldAttendu) {
                if (!isset($soumisFields[$fieldName])) {
                    $erreursEntite[] = "attribut '$fieldName' manquant";
                } else {
                    if (strtoupper($soumisFields[$fieldName]['Type']) !== strtoupper($fieldAttendu['Type'])) {
                        $erreursEntite[] = "attribut '$fieldName' : type '{$soumisFields[$fieldName]['Type']}' au lieu de '{$fieldAttendu['Type']}'";
                    }
                    if ((bool)$soumisFields[$fieldName]['PrimaryKey'] !== (bool)$fieldAttendu['PrimaryKey']) {
                        $etat = $fieldAttendu['PrimaryKey'] ? 'devrait être clé primaire' : 'ne devrait pas être clé primaire';
                        $erreursEntite[] = "attribut '$fieldName' : $etat";
                    }
                }
            }
            foreach ($soumisFields as $fieldName => $_) {
                if (!isset($attenduFields[$fieldName])) {
                    $erreursEntite[] = "attribut '$fieldName' en trop (non demandé)";
                }
            }

            $erreurs[$nom] = $erreursEntite;
        }

        // Comparaison des associations via les Links
        foreach ($mcd['Associations'] as $assoc) {
            $nom          = $assoc['name'];
            $erreursAssoc = [];

            // Construire la map entityName → cardinality depuis les links soumis
            $soumisLinks = array_filter($mcd['Links'], fn($l) => $l['assocId'] === $assoc['id']);
            $soumisCards = [];
            foreach ($soumisLinks as $link) {
                $entityName = $entityIdToName[$link['entityId']] ?? null;
                if ($entityName) {
                    $soumisCards[$entityName] = $link['cardinality'];
                }
            }

            foreach ($attendu['Associations'][$nom]['links'] ?? [] as $linkAttendu) {
                $entityName   = $linkAttendu['entityName'];
                $cardAttendue = $linkAttendu['cardinality'];
                if (!isset($soumisCards[$entityName])) {
                    $erreursAssoc[] = "lien avec '$entityName' manquant";
                } elseif ($soumisCards[$entityName] !== $cardAttendue) {
                    $erreursAssoc[] = "cardinalité de '$entityName' : '{$soumisCards[$entityName]}' au lieu de '$cardAttendue'";
                }
            }

            $erreurs[$nom] = $erreursAssoc;
        }

        // PHP gère les messages "correct" directement
        // L'IA ne reçoit que les entités avec des erreurs pour générer les questions socratiques
        $avecErreurs = array_filter($erreurs, fn($e) => count($e) > 0);
        $remarques   = [];

        foreach ($erreurs as $nom => $liste) {
            if (count($liste) === 0) {
                $type = isset($attendu['Associations'][$nom]) ? "L'association" : "L'entité";
                $remarques[] = [
                    'entite'  => $nom,
                    'statut'  => 'valide',
                    'message' => "$type $nom est correcte, bien joué !",
                ];
            }
        }

        if (count($avecErreurs) > 0) {
            // Abstraire les erreurs : on envoie uniquement la catégorie, jamais les noms précis
            $erreursAbstraites = [];
            foreach ($avecErreurs as $nom => $liste) {
                $categories = [];
                foreach ($liste as $erreur) {
                    if (str_contains($erreur, 'lien') && str_contains($erreur, 'manquant')) $categories[] = 'un ou plusieurs liens manquants entre cette association et ses entités';
                    elseif (str_contains($erreur, 'cardinalité'))  $categories[] = 'une ou plusieurs cardinalités incorrectes';
                    elseif (str_contains($erreur, 'clé primaire')) $categories[] = 'une clé primaire incorrecte';
                    elseif (str_contains($erreur, 'type'))         $categories[] = 'un type d\'attribut incorrect';
                    elseif (str_contains($erreur, 'manquant'))     $categories[] = 'un ou plusieurs attributs manquants';
                    elseif (str_contains($erreur, 'en trop'))      $categories[] = 'un ou plusieurs attributs en trop';
                }
                $estAssociation = isset($attendu['Associations'][$nom]);
                $erreursAbstraites[$nom] = [
                    'type'       => $estAssociation ? 'association' : 'entité',
                    'categories' => array_unique($categories),
                ];
            }
            $erreursJson = json_encode($erreursAbstraites, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            $prompt = <<<PROMPT
Rôle : Tu es un professeur de bases de données pour des étudiants de première année de BUT Informatique. Tu pratiques le dialogue socratique : tu ne donnes jamais directement la réponse, tu poses des questions bienveillantes qui amènent l'étudiant à trouver ses erreurs par lui-même.

Voici les problèmes détectés dans le MCD de l'étudiant :
{$erreursJson}

Pour chaque élément, génère une courte question socratique (une seule phrase).
Le champ "type" indique si c'est une entité ou une association — utilise le bon mot dans ta question.
Le champ "categories" liste les catégories de problèmes — oriente la question vers ces catégories.
Règles :
* Ne jamais mentionner de noms ou valeurs précises
* Ne pas expliquer ce qui est faux
* Utiliser "cette entité" ou "cette association" selon le type
* Exemples : "Avez-vous bien vérifié les attributs de cette entité ?", "Avez vous bien défini tous les liens pour cette association ?"

Retourne uniquement cet objet JSON où les clés sont les noms des entités/associations :
{"questions": {"NomEntite": "question...", "NomAssociation": "question..."}}
PROMPT;

            $data = $ollama->generateJson($prompt, 300);
            foreach ($avecErreurs as $nom => $_) {
                $question    = $data['questions'][$nom] ?? "Avez-vous bien vérifié tous les éléments de $nom ?";
                $remarques[] = [
                    'entite'  => $nom,
                    'statut'  => 'invalide',
                    'message' => $question,
                ];
            }
        }

        return response()->json([
            'mcd'      => $mcd,
            'erreurs'  => $erreurs,
            'remarques' => $remarques,
        ]);
    }

    public function analyzeDictionary(Request $request, OllamaService $ollama): JsonResponse
    {
        set_time_limit(0);
        ini_set('default_socket_timeout', -1);

        $dictionary = $request->input('dictionary');

        if (!$dictionary || !is_array($dictionary) || count($dictionary) === 0) {
            return response()->json(['error' => 'Dictionnaire manquant ou vide'], 422);
        }

        // Dictionnaire attendu — placeholder, sera remplacé par la solution de l'exercice
        $attendu = array_column($dictionary, null, 'TechnicalName');

        $erreurs = [];
        $soumisNames = array_column($dictionary, 'TechnicalName');

        foreach ($dictionary as $field) {
            $technicalName = $field['TechnicalName'] ?? null;
            if (!$technicalName) continue;

            $erreursChamp  = [];
            $attenduChamp  = $attendu[$technicalName] ?? null;

            if (!$attenduChamp) {
                $erreursChamp[] = "champ '$technicalName' non attendu";
            } else {
                if (strtoupper($field['Type'] ?? '') !== strtoupper($attenduChamp['Type'] ?? '')) {
                    $erreursChamp[] = "type '{$field['Type']}' au lieu de '{$attenduChamp['Type']}'";
                }
                if ((bool)($field['PrimaryKey'] ?? false) !== (bool)($attenduChamp['PrimaryKey'] ?? false)) {
                    $etat = $attenduChamp['PrimaryKey'] ? 'devrait être clé primaire' : 'ne devrait pas être clé primaire';
                    $erreursChamp[] = $etat;
                }
            }

            $erreurs[$technicalName] = $erreursChamp;
        }

        foreach ($attendu as $technicalName => $_) {
            if (!in_array($technicalName, $soumisNames)) {
                $erreurs[$technicalName] = ["champ '$technicalName' manquant"];
            }
        }

        $avecErreurs = array_filter($erreurs, fn($e) => count($e) > 0);
        $remarques   = [];

        foreach ($erreurs as $nom => $liste) {
            if (count($liste) === 0) {
                $remarques[] = [
                    'champ'   => $nom,
                    'statut'  => 'valide',
                    'message' => "Le champ $nom est correct, bien joué !",
                ];
            }
        }

        if (count($avecErreurs) > 0) {
            $erreursAbstraites = [];
            foreach ($avecErreurs as $nom => $liste) {
                $categories = [];
                foreach ($liste as $erreur) {
                    if (str_contains($erreur, 'type'))           $categories[] = "un type d'attribut incorrect";
                    elseif (str_contains($erreur, 'clé primaire')) $categories[] = 'une clé primaire incorrecte';
                    elseif (str_contains($erreur, 'manquant'))   $categories[] = 'un champ manquant';
                    elseif (str_contains($erreur, 'non attendu')) $categories[] = 'un champ en trop';
                }
                $erreursAbstraites[$nom] = [
                    'type'       => 'champ',
                    'categories' => array_unique($categories),
                ];
            }
            $erreursJson = json_encode($erreursAbstraites, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            $prompt = <<<PROMPT
Rôle : Tu es un professeur de bases de données pour des étudiants de première année de BUT Informatique. Tu pratiques le dialogue socratique : tu ne donnes jamais directement la réponse, tu poses des questions bienveillantes qui amènent l'étudiant à trouver ses erreurs par lui-même.

Voici les problèmes détectés dans le dictionnaire de données de l'étudiant :
{$erreursJson}

Pour chaque champ, génère une courte question socratique (une seule phrase).
Le champ "type" indique que c'est un champ du dictionnaire — utilise "ce champ" dans ta question.
Le champ "categories" liste les catégories de problèmes — oriente la question vers ces catégories.
Règles :
* Ne jamais mentionner de noms ou valeurs précises
* Ne pas expliquer ce qui est faux
* Utiliser "ce champ" pour désigner l'attribut
* Exemples : "Avez-vous bien vérifié le type de ce champ ?", "Ce champ devrait-il être une clé primaire ?"

Retourne uniquement cet objet JSON où les clés sont les noms techniques des champs :
{"questions": {"NomTechnique": "question..."}}
PROMPT;

            $data = $ollama->generateJson($prompt, 300);
            foreach ($avecErreurs as $nom => $_) {
                $question    = $data['questions'][$nom] ?? "Avez-vous bien vérifié tous les éléments du champ $nom ?";
                $remarques[] = [
                    'champ'   => $nom,
                    'statut'  => 'invalide',
                    'message' => $question,
                ];
            }
        }

        return response()->json([
            'dictionary' => $dictionary,
            'erreurs'    => $erreurs,
            'remarques'  => $remarques,
        ]);
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

        $reponse = ReponseIA::create($validated);

        return response()->json($reponse, 201);
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