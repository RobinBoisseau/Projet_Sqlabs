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

    public function analyzeMcd(OllamaService $ollama): JsonResponse
    {
        set_time_limit(0);
        ini_set('default_socket_timeout', -1);

        // MCD soumis par l'étudiant
        $mcd = [
            'entites' => [
                [
                    'nom'      => 'Personne',
                    'attributs' => [
                        ['nom' => 'id',     'type' => 'INT',     'cle_primaire' => true],
                        //['nom' => 'nom',    'type' => 'VARCHAR',     'cle_primaire' => false],
                        ['nom' => 'prenom', 'type' => 'VARCHAR', 'cle_primaire' => false],
                    ],
                ],
                [
                    'nom'      => 'Voiture',
                    'attributs' => [
                        ['nom' => 'id',     'type' => 'INT',     'cle_primaire' => true],
                        ['nom' => 'marque', 'type' => 'VARCHAR', 'cle_primaire' => false],
                        ['nom' => 'modele', 'type' => 'VARCHAR', 'cle_primaire' => false],
                    ],
                ],
            ],
            'associations' => [
                [
                    'nom'     => 'Conduire',
                    'entites' => [
                        //['nom' => 'Personne', 'cardinalite' => '1,N'],
                        ['nom' => 'Voiture',  'cardinalite' => '1,N'],
                    ],
                ],
            ],
        ];

        // MCD attendu (correction de référence)
        $attendu = [
            'entites' => [
                'Personne' => [
                    'id'     => ['type' => 'INT',     'cle_primaire' => true],
                    'nom'    => ['type' => 'VARCHAR', 'cle_primaire' => false],
                    'prenom' => ['type' => 'VARCHAR', 'cle_primaire' => false],
                ],
                'Voiture' => [
                    'id'     => ['type' => 'INT',     'cle_primaire' => true],
                    'marque' => ['type' => 'VARCHAR', 'cle_primaire' => false],
                    'modele' => ['type' => 'VARCHAR', 'cle_primaire' => false],
                ],
            ],
            'associations' => [
                'Conduire' => [
                    'Personne' => '1,N',
                    'Voiture'  => '1,N',
                ],
            ],
        ];

        // Comparaison PHP — détection des erreurs exactes
        $erreurs = [];

        foreach ($mcd['entites'] as $entite) {
            $nom     = $entite['nom'];
            $erreursEntite = [];
            $attenduAttrs  = $attendu['entites'][$nom] ?? [];
            $soumisAttrs   = array_column($entite['attributs'], null, 'nom');

            foreach ($attenduAttrs as $attrNom => $attrAttendu) {
                if (!isset($soumisAttrs[$attrNom])) {
                    $erreursEntite[] = "attribut '$attrNom' manquant";
                } else {
                    if (strtoupper($soumisAttrs[$attrNom]['type']) !== strtoupper($attrAttendu['type'])) {
                        $erreursEntite[] = "attribut '$attrNom' : type '{$soumisAttrs[$attrNom]['type']}' au lieu de '{$attrAttendu['type']}'";
                    }
                    if ((bool)$soumisAttrs[$attrNom]['cle_primaire'] !== (bool)$attrAttendu['cle_primaire']) {
                        $etat = $attrAttendu['cle_primaire'] ? 'devrait être clé primaire' : 'ne devrait pas être clé primaire';
                        $erreursEntite[] = "attribut '$attrNom' : $etat";
                    }
                }
            }
            foreach ($soumisAttrs as $attrNom => $_) {
                if (!isset($attenduAttrs[$attrNom])) {
                    $erreursEntite[] = "attribut '$attrNom' en trop (non demandé)";
                }
            }

            $erreurs[$nom] = $erreursEntite;
        }

        foreach ($mcd['associations'] as $assoc) {
            $nom           = $assoc['nom'];
            $erreursAssoc  = [];
            $attenduCards  = $attendu['associations'][$nom] ?? [];
            $soumisCards   = array_column($assoc['entites'], 'cardinalite', 'nom');

            foreach ($attenduCards as $entiteNom => $cardAttendue) {
                if (!isset($soumisCards[$entiteNom])) {
                    $erreursAssoc[] = "cardinalité de '$entiteNom' manquante";
                } elseif ($soumisCards[$entiteNom] !== $cardAttendue) {
                    $erreursAssoc[] = "cardinalité de '$entiteNom' : '{$soumisCards[$entiteNom]}' au lieu de '$cardAttendue'";
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
                $type = isset($attendu['associations'][$nom]) ? "L'association" : "L'entité";
                $remarques[] = ['entite' => $nom, 'message' => "$type $nom est correcte, bien joué !"];
            }
        }

        if (count($avecErreurs) > 0) {
            // Abstraire les erreurs : on envoie uniquement la catégorie, jamais les noms précis
            $erreursAbstraites = [];
            foreach ($avecErreurs as $nom => $liste) {
                $categories = [];
                foreach ($liste as $erreur) {
                    if (str_contains($erreur, 'cardinalité'))      $categories[] = 'une ou plusieurs cardinalités incorrectes ou manquantes';
                    elseif (str_contains($erreur, 'clé primaire')) $categories[] = 'une clé primaire incorrecte';
                    elseif (str_contains($erreur, 'type'))         $categories[] = 'un type d\'attribut incorrect';
                    elseif (str_contains($erreur, 'manquant'))     $categories[] = 'un ou plusieurs attributs manquants';
                    elseif (str_contains($erreur, 'en trop'))      $categories[] = 'un ou plusieurs attributs en trop';
                }
                $estAssociation = isset($attendu['associations'][$nom]);
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
* Exemples : "Avez-vous bien vérifié les attributs de cette entité ?", "Avez vous bien défini toutes les cardinalités pour cette association ?"

Retourne uniquement cet objet JSON où les clés sont les noms des entités/associations :
{"questions": {"NomEntite": "question...", "NomAssociation": "question..."}}
PROMPT;

            $data = $ollama->generateJson($prompt, 300);
            foreach ($avecErreurs as $nom => $_) {
                $question    = $data['questions'][$nom] ?? "Avez-vous bien vérifié tous les éléments de $nom ?";
                $remarques[] = ['entite' => $nom, 'message' => $question];
            }
        }

        return response()->json([
            'mcd'      => $mcd,
            'erreurs'  => $erreurs,
            'remarques' => $remarques,
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