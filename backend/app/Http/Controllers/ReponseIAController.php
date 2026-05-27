<?php
// app/Http/Controllers/ReponseIAController.php

namespace App\Http\Controllers;

use App\Models\ReponseIA;
use App\Models\Tentative;
use App\Services\OllamaService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReponseIAController extends Controller
{
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

        $mcd = $request->input('mcd');

        if (!$mcd || empty($mcd['Entities'])) {
            return response()->json(['error' => 'MCD manquant ou vide'], 422);
        }

        [$enonce, $correctionTentative] = $this->loadContext($request->input('tentative_id'));

        if (!$correctionTentative) {
            $remarques = [];
            foreach ($mcd['Entities'] ?? [] as $entity) {
                $remarques[] = ['id' => $entity['id'], 'statut' => 'valide', 'message' => 'Parfait !'];
            }
            foreach ($mcd['Associations'] ?? [] as $assoc) {
                $remarques[] = ['id' => $assoc['id'], 'statut' => 'valide', 'message' => 'Parfait !'];
            }
            $reponseJson = ['remarques' => $remarques];
            if ($request->input('tentative_id')) {
                ReponseIA::updateOrCreate(
                    ['tentative_id' => $request->input('tentative_id'), 'element' => 'mcd'],
                    ['contenuJson' => $mcd, 'reponseJson' => $reponseJson, 'dateHeureReponse' => now()]
                );
            }
            return response()->json(array_merge(['mcd' => $mcd], $reponseJson));
        }

        $contexte   = $enonce ?? 'Contexte de l\'exercice non disponible.';
        $correction = $correctionTentative->modele;

        $mcdJson        = json_encode($mcd,        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $correctionJson = json_encode($correction,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $systemPrompt = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Pour les éléments INCORRECTS uniquement, tu pratiques le dialogue socratique : tu poses une courte question qui amène l'étudiant à trouver son erreur, sans jamais donner la réponse ni révéler le contenu de la correction.
Pour les éléments CORRECTS, tu valides avec un message d'encouragement court et positif, sans poser de question.
Règle Merise : les attributs calculés ou dérivés (ex : âge calculé depuis une date de naissance, total calculé depuis prix × quantité) ne doivent JAMAIS apparaître dans un MCD.
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
SYSTEM;

        $prompt = <<<PROMPT
Contexte de l'exercice :
{$contexte}

Voici le MCD soumis par l'étudiant :
{$mcdJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux MCD élément par élément. Pour chaque entité et association :
- Si l'élément correspond à la correction (nom, attributs, cardinalités, liens) : statut "valide" + message d'encouragement court (ex : "Parfait !", "Très bien !", "Correct !"). NE pose PAS de question.
- Si l'élément diffère de la correction OU contient un attribut calculé/dérivé : statut "invalide" + une seule question socratique courte, sans donner la réponse ni révéler la correction.

Chaque entité et association possède un champ "id" unique. Utilise cet "id" dans ta réponse.
Ne mentionne jamais de noms ou valeurs précises issus de la correction.
Utilise "cette entité" ou "cette association" selon le type d'élément concerné.

Exemples pour les invalides :
- attributs manquants → "Avez-vous bien listé tous les attributs nécessaires pour cette entité ?"
- attributs en trop → "Tous les attributs de cette entité sont-ils vraiment nécessaires ?"
- attribut calculé → "Cet attribut peut-il être calculé depuis d'autres données ? Si oui, doit-il figurer dans le MCD ?"
- cardinalité incorrecte → "Combien d'occurrences de chaque entité peuvent participer à cette association ?"

Retourne uniquement ce JSON :
{
  "remarques": [
    {"id": "id_exact_de_l_entite_ou_association", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT;

        $data     = $ollama->generateJson($prompt, 500, $systemPrompt);
        $remarques = $data['remarques'] ?? [];

        $reponseJson = ['remarques' => $remarques];

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

        [$enonce, $correctionTentative] = $this->loadContext($request->input('tentative_id'));

        if (!$correctionTentative) {
            $remarques = [];
            foreach ($dictionary as $field) {
                $nom = $field['TechnicalName'] ?? $field['technicalName'] ?? '?';
                $remarques[] = ['champ' => $nom, 'statut' => 'valide', 'message' => 'Parfait !'];
            }
            $reponseJson = ['remarques' => $remarques];
            if ($request->input('tentative_id')) {
                ReponseIA::updateOrCreate(
                    ['tentative_id' => $request->input('tentative_id'), 'element' => 'dico'],
                    ['contenuJson' => $dictionary, 'reponseJson' => $reponseJson, 'dateHeureReponse' => now()]
                );
            }
            return response()->json(array_merge(['dictionary' => $dictionary], $reponseJson));
        }

        $contexte   = $enonce ?? 'Contexte de l\'exercice non disponible.';
        $correction = $correctionTentative->dictionnaire;

        $dictionnaireJson = json_encode($dictionary,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $correctionJson   = json_encode($correction,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $systemPrompt = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Pour les champs INCORRECTS uniquement, tu pratiques le dialogue socratique : tu poses une courte question qui amène l'étudiant à trouver son erreur, sans jamais donner la réponse ni révéler le contenu de la correction.
Pour les champs CORRECTS, tu valides avec un message d'encouragement court et positif, sans poser de question.
Règle Merise : les attributs calculés ou dérivés (ex : âge calculé depuis une date de naissance, total calculé depuis prix × quantité) ne doivent JAMAIS figurer dans le dictionnaire de données.
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
SYSTEM;

        $prompt = <<<PROMPT
Contexte de l'exercice :
{$contexte}

Voici le dictionnaire de données soumis par l'étudiant :
{$dictionnaireJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux dictionnaires. Tu DOIS générer une remarque pour CHAQUE champ du dictionnaire de l'étudiant, sans en omettre aucun.
- Si le champ correspond à la correction (nom technique, type, clé primaire) : statut "valide" + message d'encouragement court (ex : "Parfait !", "Correct !", "Très bien !"). NE pose PAS de question.
- Si le champ diffère de la correction OU est un attribut calculé/dérivé : statut "invalide" + une seule question socratique courte, sans donner la réponse ni révéler la correction.

Ne mentionne jamais de noms ou valeurs précises issus de la correction. Utilise toujours "ce champ" pour désigner l'attribut concerné.

Exemples pour les invalides :
- type incorrect → "Le type choisi pour ce champ correspond-il bien à la nature des données qu'il doit stocker ?"
- clé primaire incorrecte → "Ce champ est-il vraiment celui qui identifie de façon unique chaque enregistrement ?"
- attribut calculé → "Ce champ peut-il être calculé depuis d'autres données ? Si oui, doit-il figurer dans le dictionnaire ?"
- champ en trop → "Ce champ est-il vraiment nécessaire dans le contexte de cet exercice ?"

Retourne uniquement ce JSON :
{
  "remarques": [
    {"champ": "NomTechnique", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT;

        $data      = $ollama->generateJson($prompt, 500, $systemPrompt);
        $remarques = $data['remarques'] ?? [];

        $reponseJson = ['remarques' => $remarques];

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

        [$enonce, $correctionTentative] = $this->loadContext($request->input('tentative_id'));

        if (!$correctionTentative) {
            $remarques = [];
            foreach ($dependencies as $dep) {
                $src = is_array($dep['source'] ?? null)
                    ? implode(',', $dep['source'])
                    : ($dep['source'] ?? '?');
                $remarques[] = ['source' => $src, 'statut' => 'valide', 'message' => 'Parfait !'];
            }
            $reponseJson = ['remarques' => $remarques];
            if ($request->input('tentative_id')) {
                ReponseIA::updateOrCreate(
                    ['tentative_id' => $request->input('tentative_id'), 'element' => 'dep'],
                    ['contenuJson' => $dependencies, 'reponseJson' => $reponseJson, 'dateHeureReponse' => now()]
                );
            }
            return response()->json(array_merge(['dependencies' => $dependencies], $reponseJson));
        }

        $contexte   = $enonce ?? 'Contexte de l\'exercice non disponible.';
        $correction = $correctionTentative->dependance;

        $dependencesJson = json_encode($dependencies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $correctionJson  = json_encode($correction,   JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $systemPrompt = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Pour les dépendances INCORRECTES uniquement, tu pratiques le dialogue socratique : tu poses une courte question qui amène l'étudiant à trouver son erreur, sans jamais donner la réponse ni révéler le contenu de la correction.
Pour les dépendances CORRECTES, tu valides avec un message d'encouragement court et positif, sans poser de question.
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
SYSTEM;

        $prompt = <<<PROMPT
Contexte de l'exercice :
{$contexte}

Voici les dépendances fonctionnelles élémentaires soumises par l'étudiant :
{$dependencesJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux listes de dépendances élément par élément :
- Si la dépendance correspond à la correction (même source, mêmes attributs cibles) : statut "valide" + message d'encouragement court (ex : "Parfait !", "Correct !", "Très bien !"). NE pose PAS de question.
- Si la dépendance diffère de la correction : statut "invalide" + une seule question socratique courte, sans donner la réponse ni révéler la correction.

Ne mentionne jamais de noms ou valeurs précises issus de la correction. Utilise toujours "cette dépendance" pour désigner la DFE.

Exemples pour les invalides :
- attributs cibles manquants → "Avez-vous bien identifié tous les attributs qui dépendent fonctionnellement de cette source ?"
- attributs cibles en trop → "Chacun des attributs cibles est-il vraiment déterminé uniquement par cette source ?"
- dépendance non attendue → "Cette dépendance est-elle vraiment élémentaire, ou peut-elle être déduite d'une autre ?"

Retourne uniquement ce JSON :
{
  "remarques": [
    {"source": "attribut1,attribut2", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT;

        $data      = $ollama->generateJson($prompt, 500, $systemPrompt);
        $remarques = $data['remarques'] ?? [];

        $reponseJson = ['remarques' => $remarques];

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