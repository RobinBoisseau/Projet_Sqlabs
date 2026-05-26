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

        $mcd = $request->input('mcd');

        if (!$mcd || empty($mcd['Entities'])) {
            return response()->json(['error' => 'MCD manquant ou vide'], 422);
        }

        // Correction — placeholder : sera remplacé par la correction du prof en BD
        $correction = $mcd;

        $mcdJson        = json_encode($mcd,        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $correctionJson = json_encode($correction,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $systemPrompt = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Tu pratiques exclusivement le dialogue socratique : tu ne donnes jamais la réponse, tu poses une courte question qui amène l'étudiant à trouver son erreur par lui-même.
Tu ne révèles jamais le contenu de la correction, même partiellement.
Ton ton est pédagogique, encourageant et positif.
Tu ne réponds qu'aux questions liées à la correction de MCD (entités, associations, cardinalités, attributs).
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
SYSTEM;

        $prompt = <<<PROMPT
Contexte de l'exercice :
Une entreprise souhaite gérer ses commandes en ligne.
- Un CLIENT possède un identifiant, un nom, un prénom et un email.
- Une COMMANDE possède un identifiant, une date et un montant total. Elle est passée par un seul client, mais un client peut passer plusieurs commandes.
- Un PRODUIT possède un identifiant, un libellé et un prix unitaire.
- Une commande peut contenir plusieurs produits et un produit peut apparaître dans plusieurs commandes. La quantité commandée pour chaque produit est stockée dans l'association CONTIENT.

Voici le MCD soumis par l'étudiant :
{$mcdJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux MCD. Pour chaque entité ou association qui diffère de la correction, génère une courte question socratique (une seule phrase) qui aide l'étudiant à trouver son erreur sans lui donner la réponse.
Pour les entités/associations correctes, indique le statut "valide".
Ne mentionne jamais de noms ou valeurs précises issus de la correction.
Utilise "cette entité" ou "cette association" selon le type d'élément concerné.

Chaque entité et association possède un champ "id" unique. Tu dois utiliser cet "id" dans le champ "id" de ta réponse pour identifier l'élément concerné.

Exemples de questions :
- attributs manquants → "Avez-vous bien listé tous les attributs nécessaires pour cette entité ?"
- attributs en trop → "Tous les attributs de cette entité sont-ils vraiment nécessaires ?"
- type incorrect → "Quel type de données est le plus adapté pour représenter cette information ?"
- clé primaire incorrecte → "Quel attribut permet d'identifier de manière unique chaque occurrence de cette entité ?"
- lien manquant → "Cette association est-elle bien reliée à toutes les entités concernées ?"
- cardinalité incorrecte → "Combien d'occurrences de chaque entité peuvent participer à cette association ?"

Retourne uniquement ce JSON :
{
  "remarques": [
    {"id": "id_exact_de_l_entite_ou_association", "statut": "valide|invalide", "message": "question ou message de validation"}
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

        // Correction — placeholder : sera remplacé par la correction du prof en BD
        $correction = $dictionary;

        $dictionnaireJson = json_encode($dictionary,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $correctionJson   = json_encode($correction,  JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $systemPrompt = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Tu pratiques exclusivement le dialogue socratique : tu ne donnes jamais la réponse, tu poses une courte question qui amène l'étudiant à trouver son erreur par lui-même.
Tu ne révèles jamais le contenu de la correction, même partiellement.
Ton ton est pédagogique, encourageant et positif.
Tu ne réponds qu'aux questions liées à la correction de dictionnaires de données (nom métier, nom technique, type, clé primaire).
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
SYSTEM;

        $prompt = <<<PROMPT
Contexte de l'exercice :
Une entreprise souhaite gérer ses commandes en ligne.
- Un CLIENT possède un identifiant, un nom, un prénom et un email.
- Une COMMANDE possède un identifiant, une date et un montant total. Elle est passée par un seul client, mais un client peut passer plusieurs commandes.
- Un PRODUIT possède un identifiant, un libellé et un prix unitaire.
- Une commande peut contenir plusieurs produits et un produit peut apparaître dans plusieurs commandes. La quantité commandée pour chaque produit est stockée dans l'association CONTIENT.

Voici le dictionnaire de données soumis par l'étudiant :
{$dictionnaireJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux dictionnaires. Tu DOIS générer une remarque pour CHAQUE champ du dictionnaire de l'étudiant, sans en omettre aucun.
- Si le champ est correct : statut "valide" avec un message d'encouragement court (ex: "Parfait, ce champ est correct !").
- Si le champ diffère de la correction : statut "invalide" avec une courte question socratique (une seule phrase) sans donner la réponse.
Ne mentionne jamais de noms ou valeurs précises issus de la correction. Utilise toujours "ce champ" pour désigner l'attribut concerné.

Exemples de questions :
- type incorrect → "Le type choisi pour ce champ correspond-il bien à la nature des données qu'il doit stocker ?"
- clé primaire incorrecte → "Ce champ est-il vraiment celui qui identifie de façon unique chaque enregistrement ?"
- champ manquant → "Avez-vous bien recensé tous les attributs nécessaires dans votre dictionnaire ?"
- champ en trop → "Ce champ est-il vraiment utile et demandé dans le contexte de cet exercice ?"

Retourne uniquement ce JSON :
{
  "remarques": [
    {"champ": "NomTechnique", "statut": "valide|invalide", "message": "question ou message de validation"}
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

        // Correction — placeholder : sera remplacé par la correction du prof en BD
        $correction = $dependencies;

        $dependencesJson = json_encode($dependencies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $correctionJson  = json_encode($correction,   JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $systemPrompt = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Tu pratiques exclusivement le dialogue socratique : tu ne donnes jamais la réponse, tu poses une courte question qui amène l'étudiant à trouver son erreur par lui-même.
Tu ne révèles jamais le contenu de la correction, même partiellement.
Ton ton est pédagogique, encourageant et positif.
Tu ne réponds qu'aux questions liées à la correction de dépendances fonctionnelles élémentaires (source, attributs cibles manquants ou en trop, dépendance manquante ou non attendue).
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
SYSTEM;

        $prompt = <<<PROMPT
Contexte de l'exercice :
Une entreprise souhaite gérer ses commandes en ligne.
- Un CLIENT possède un identifiant (id_client), un nom, un prénom et un email.
- Une COMMANDE possède un identifiant (id_commande), une date et un montant total. Une commande est passée par un seul client.
- Un PRODUIT possède un identifiant (id_produit), un libellé et un prix unitaire.
- Une commande peut contenir plusieurs produits avec une quantité par produit.
Les dépendances fonctionnelles élémentaires attendues portent sur ces attributs.

Voici les dépendances fonctionnelles élémentaires soumises par l'étudiant :
{$dependencesJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux listes de dépendances. Pour chaque dépendance qui diffère de la correction, génère une courte question socratique (une seule phrase) qui aide l'étudiant à trouver son erreur sans lui donner la réponse.
Pour les dépendances correctes, indique le statut "valide".
Ne mentionne jamais de noms ou valeurs précises issus de la correction. Utilise toujours "cette dépendance" pour désigner la DFE.

Exemples de questions :
- attributs cibles manquants → "Avez-vous bien identifié tous les attributs qui dépendent fonctionnellement de cette source ?"
- attributs cibles en trop → "Chacun des attributs cibles de cette dépendance est-il vraiment déterminé uniquement par cette source ?"
- dépendance non attendue → "Cette dépendance est-elle vraiment élémentaire, ou peut-elle être déduite d'une autre ?"
- dépendance manquante → "Avez-vous recensé toutes les dépendances fonctionnelles élémentaires de votre relation ?"

Retourne uniquement ce JSON :
{
  "remarques": [
    {"source": "attribut1,attribut2", "statut": "valide|invalide", "message": "question ou message de validation"}
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