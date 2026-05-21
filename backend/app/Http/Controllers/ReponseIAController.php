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

        foreach ($mcd['Associations'] ?? [] as $assoc) {
            $links = [];
            foreach ($mcd['Links'] ?? [] as $link) {
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

            $systemPrompt = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Tu pratiques exclusivement le dialogue socratique : tu ne donnes jamais la réponse, tu poses une courte question qui amène l'étudiant à trouver son erreur par lui-même.
Ton ton est pédagogique, encourageant et positif.
Tu ne réponds qu'aux questions liées à la correction de MCD (entités, associations, cardinalités, attributs).
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
SYSTEM;

            $prompt = <<<PROMPT
Voici les problèmes détectés dans le MCD de l'étudiant :
{$erreursJson}

Pour chaque élément, génère une courte question socratique (une seule phrase).
Le champ "type" indique si c'est une entité ou une association — utilise le bon mot dans ta question.
Le champ "categories" liste les catégories de problèmes — oriente ta question vers ces catégories.
Ne mentionne jamais de noms ou valeurs précises. Utilise "cette entité" ou "cette association" selon le type.

Exemples :
- "un ou plusieurs attributs manquants" → "Avez-vous bien listé tous les attributs nécessaires pour cette entité ?"
- "un ou plusieurs attributs en trop" → "Tous les attributs de cette entité sont-ils vraiment nécessaires ?"
- "un type d'attribut incorrect" → "Quel type de données est le plus adapté pour représenter cette information dans cette entité ?"
- "une clé primaire incorrecte" → "Quel attribut permet d'identifier de manière unique chaque occurrence de cette entité ?"
- "un ou plusieurs liens manquants entre cette association et ses entités" → "Cette association est-elle bien reliée à toutes les entités concernées ?"
- "une ou plusieurs cardinalités incorrectes" → "Combien d'occurrences de chaque entité peuvent participer à cette association ?"

Retourne uniquement cet objet JSON où les clés sont les noms des entités/associations :
{"questions": {"NomEntite": "question...", "NomAssociation": "question..."}}
PROMPT;

            $data = $ollama->generateJson($prompt, 300, $systemPrompt);
            foreach ($avecErreurs as $nom => $_) {
                $question    = $data['questions'][$nom] ?? "Avez-vous bien vérifié tous les éléments de $nom ?";
                $remarques[] = [
                    'entite'  => $nom,
                    'statut'  => 'invalide',
                    'message' => $question,
                ];
            }
        }

        $reponseJson = ['erreurs' => $erreurs, 'remarques' => $remarques];

        if ($request->input('tentative_id')) {
            ReponseIA::updateOrCreate(
                ['tentative_id' => $request->input('tentative_id'), 'element' => 'mcd'],
                ['contenuJson' => $mcd, 'reponseJson' => $reponseJson, 'dateHeureReponse' => now()]
            );
        }

        return response()->json(array_merge(['mcd' => $mcd], $reponseJson));
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

            $systemPrompt = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Tu pratiques exclusivement le dialogue socratique : tu ne donnes jamais la réponse, tu poses une courte question qui amène l'étudiant à trouver son erreur par lui-même.
Ton ton est pédagogique, encourageant et positif.
Tu ne réponds qu'aux questions liées à la correction de dictionnaires de données (type, clé primaire, attributs manquants ou en trop).
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
SYSTEM;

            $prompt = <<<PROMPT
Voici les problèmes détectés dans le dictionnaire de données de l'étudiant :
{$erreursJson}

Pour chaque champ, génère une courte question socratique (une seule phrase).
Le champ "type" indique que c'est un champ du dictionnaire — utilise "ce champ" dans ta question.
Le champ "categories" liste les catégories de problèmes — oriente ta question vers ces catégories.
Ne mentionne jamais de noms ou valeurs précises. Utilise toujours "ce champ" pour désigner l'attribut.

Exemples :
- "un type d'attribut incorrect" → "Le type choisi pour ce champ correspond-il bien à la nature des données qu'il doit stocker ?"
- "une clé primaire incorrecte" → "Ce champ est-il vraiment celui qui identifie de façon unique chaque enregistrement ?"
- "un champ manquant" → "Avez-vous bien recensé tous les attributs nécessaires dans votre dictionnaire ?"
- "un champ en trop" → "Ce champ est-il vraiment utile et demandé dans le contexte de cet exercice ?"

Retourne uniquement cet objet JSON où les clés sont les noms techniques des champs :
{"questions": {"NomTechnique": "question..."}}
PROMPT;

            $data = $ollama->generateJson($prompt, 300, $systemPrompt);
            foreach ($avecErreurs as $nom => $_) {
                $question    = $data['questions'][$nom] ?? "Avez-vous bien vérifié tous les éléments du champ $nom ?";
                $remarques[] = [
                    'champ'   => $nom,
                    'statut'  => 'invalide',
                    'message' => $question,
                ];
            }
        }

        $reponseJson = ['erreurs' => $erreurs, 'remarques' => $remarques];

        if ($request->input('tentative_id')) {
            ReponseIA::updateOrCreate(
                ['tentative_id' => $request->input('tentative_id'), 'element' => 'dico'],
                ['contenuJson' => $dictionary, 'reponseJson' => $reponseJson, 'dateHeureReponse' => now()]
            );
        }

        return response()->json(array_merge(['dictionary' => $dictionary], $reponseJson));
    }

    public function analyzeDependencies(Request $request, OllamaService $ollama): JsonResponse
    {
        set_time_limit(0);
        ini_set('default_socket_timeout', -1);

        $dependencies = $request->input('dependencies');

        if (!$dependencies || !is_array($dependencies) || count($dependencies) === 0) {
            return response()->json(['error' => 'Dépendances manquantes ou vides'], 422);
        }

        // Dépendances attendues — placeholder, sera remplacé par la solution de l'exercice
        // On indexe par la clé source (triée et concaténée) pour identifier chaque DFE
        $attendu = [];
        foreach ($dependencies as $dep) {
            $source = $dep['source'] ?? [];
            sort($source);
            $cleSource = implode(',', $source);
            $attendu[$cleSource] = $dep['cible'] ?? [];
        }

        $erreurs = [];

        foreach ($dependencies as $dep) {
            $source = $dep['source'] ?? [];
            $cible  = $dep['cible']  ?? [];
            sort($source);
            $cleSource     = implode(',', $source);
            $erreursDep    = [];
            $cibleAttendue = $attendu[$cleSource] ?? null;

            if ($cibleAttendue === null) {
                $erreursDep[] = 'dépendance non attendue';
            } else {
                $manquants = array_diff($cibleAttendue, $cible);
                $enTrop    = array_diff($cible, $cibleAttendue);
                foreach ($manquants as $champ) {
                    $erreursDep[] = "attribut cible '$champ' manquant";
                }
                foreach ($enTrop as $champ) {
                    $erreursDep[] = "attribut cible '$champ' en trop";
                }
            }

            $erreurs[$cleSource] = $erreursDep;
        }

        // Dépendances attendues non soumises
        $sourcesSoumises = [];
        foreach ($dependencies as $dep) {
            $s = $dep['source'] ?? [];
            sort($s);
            $sourcesSoumises[] = implode(',', $s);
        }
        foreach ($attendu as $cleSource => $_) {
            if (!in_array($cleSource, $sourcesSoumises)) {
                $erreurs[$cleSource] = ["dépendance fonctionnelle manquante"];
            }
        }

        $avecErreurs = array_filter($erreurs, fn($e) => count($e) > 0);
        $remarques   = [];

        foreach ($erreurs as $cleSource => $liste) {
            if (count($liste) === 0) {
                $remarques[] = [
                    'source'  => $cleSource,
                    'statut'  => 'valide',
                    'message' => "La dépendance $cleSource est correcte, bien joué !",
                ];
            }
        }

        if (count($avecErreurs) > 0) {
            $erreursAbstraites = [];
            foreach ($avecErreurs as $cleSource => $liste) {
                $categories = [];
                foreach ($liste as $erreur) {
                    if (str_contains($erreur, 'manquant'))     $categories[] = 'un ou plusieurs attributs cibles manquants';
                    elseif (str_contains($erreur, 'en trop'))  $categories[] = 'un ou plusieurs attributs cibles en trop';
                    elseif (str_contains($erreur, 'non attendue')) $categories[] = 'une dépendance non attendue';
                }
                $erreursAbstraites[$cleSource] = [
                    'type'       => 'dépendance',
                    'categories' => array_unique($categories),
                ];
            }
            $erreursJson = json_encode($erreursAbstraites, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            $systemPrompt = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Tu pratiques exclusivement le dialogue socratique : tu ne donnes jamais la réponse, tu poses une courte question qui amène l'étudiant à trouver son erreur par lui-même.
Ton ton est pédagogique, encourageant et positif.
Tu ne réponds qu'aux questions liées à la correction de dépendances fonctionnelles élémentaires (attributs cibles manquants, en trop, ou dépendance non attendue).
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
SYSTEM;

            $prompt = <<<PROMPT
Voici les problèmes détectés dans les dépendances fonctionnelles élémentaires de l'étudiant :
{$erreursJson}

Pour chaque dépendance (identifiée par sa source), génère une courte question socratique (une seule phrase).
Le champ "type" vaut "dépendance" — utilise "cette dépendance" dans ta question.
Le champ "categories" liste les catégories de problèmes — oriente ta question vers ces catégories.
Ne mentionne jamais de noms ou valeurs précises. Utilise toujours "cette dépendance" pour désigner la DFE.

Exemples :
- "un ou plusieurs attributs cibles manquants" → "Avez-vous bien identifié tous les attributs qui dépendent fonctionnellement de cette source ?"
- "un ou plusieurs attributs cibles en trop" → "Chacun des attributs cibles de cette dépendance est-il vraiment déterminé uniquement par cette source ?"
- "une dépendance non attendue" → "Cette dépendance est-elle vraiment élémentaire, ou peut-elle être déduite d'une autre ?"

Retourne uniquement cet objet JSON où les clés sont les sources (telles que fournies) :
{"questions": {"source1,source2": "question..."}}
PROMPT;

            $data = $ollama->generateJson($prompt, 300, $systemPrompt);
            foreach ($avecErreurs as $cleSource => $_) {
                $question    = $data['questions'][$cleSource] ?? "Avez-vous bien vérifié tous les attributs de cette dépendance ?";
                $remarques[] = [
                    'source'  => $cleSource,
                    'statut'  => 'invalide',
                    'message' => $question,
                ];
            }
        }

        $reponseJson = ['erreurs' => $erreurs, 'remarques' => $remarques];

        if ($request->input('tentative_id')) {
            ReponseIA::updateOrCreate(
                ['tentative_id' => $request->input('tentative_id'), 'element' => 'dep'],
                ['contenuJson' => $dependencies, 'reponseJson' => $reponseJson, 'dateHeureReponse' => now()]
            );
        }

        return response()->json(array_merge(['dependencies' => $dependencies], $reponseJson));
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