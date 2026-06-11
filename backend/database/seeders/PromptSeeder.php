<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Prompt;
use App\Models\Test;

class PromptSeeder extends Seeder
{
    public function run(): void
    {
        // ── Tests (variables disponibles dans les prompts) ────────────────────
        $contexte     = Test::firstOrCreate(['nom' => 'contexte']);
        $studentJson  = Test::firstOrCreate(['nom' => 'student_json']);
        $correctionJson = Test::firstOrCreate(['nom' => 'correction_json']);

        // ── Prompts ───────────────────────────────────────────────────────────
        $prompts = [

            // ── DD standard ──────────────────────────────────────────────────
            [
                'nom'       => 'Dictionnaire standard',
                'categorie' => 'dd',
                'actif'     => true,
                'prompt'    => <<<'PROMPT'
Contexte de l'exercice :
{{contexte}}

Voici le dictionnaire de données soumis par l'étudiant :
{{student_json}}

Voici la correction attendue :
{{correction_json}}

Compare les deux dictionnaires. Tu DOIS générer une remarque pour CHAQUE champ du dictionnaire de l'étudiant, sans en omettre aucun.
- Si le champ correspond à la correction (nom technique, type) : statut "valide" + message d'encouragement court (ex : "Parfait !", "Correct !", "Très bien !"). NE pose PAS de question.
- Si le champ a un TYPE différent de la correction : statut "invalide" + question sur le type uniquement.
- Si le champ est un attribut CALCULÉ ou DÉRIVÉ (ex : un total, un âge) : statut "invalide" + question sur le fait qu'il puisse être calculé.
- Si le champ est en TROP par rapport à la correction : statut "invalide" + question sur sa nécessité.
- Si l'étudiant a MOINS de champs que la correction : ajoute UNE remarque supplémentaire à la fin avec champ "" (chaîne vide), statut "invalide", et une question du type de l'exemple ci-dessous.

RÈGLE ORDRE : L'ordre des champs dans le dictionnaire de l'étudiant n'a pas d'importance.
RÈGLE CLÉ PRIMAIRE : Ignore complètement le champ PrimaryKey dans ta comparaison. Ne commente jamais la clé primaire.
RÈGLE NOM : Le nom technique d'un champ n'a pas besoin d'être identique à la correction si sa signification est équivalente (ex : "id_play" et "id_playlist" désignent la même chose). Dans ce cas, si le type correspond, marque le champ VALIDE.
RÈGLE ABSOLUE : ne spécule jamais. Si le type et le nom technique d'un champ correspondent à la correction, marque-le VALIDE, même si son nom pourrait laisser penser qu'il est calculable. Ne signale jamais un champ comme potentiellement calculé si son type est déjà correct.

Ne mentionne jamais de noms ou valeurs précises issus de la correction. Utilise toujours "ce champ" pour désigner l'attribut concerné.

Exemples pour les invalides :
- type incorrect → "Es-tu sûr du type de ce champ ?"
- clé primaire incorrecte → "Ce champ est-il vraiment celui qui identifie de façon unique chaque enregistrement ?"
- attribut calculé → "Ce champ peut-il être calculé depuis d'autres données ? Si oui, doit-il figurer dans le dictionnaire ?"
- champ en trop → "Ce champ est-il vraiment nécessaire dans le contexte de cet exercice ?"
- champ en moins → "Avez vous la certitude qu'il y a le bon nombre de champs ?"
RÈGLE CHAMP : Dans ta réponse JSON, le champ "champ" doit toujours contenir le nom technique exact tel qu'écrit par l'étudiant, jamais celui de la correction.
Retourne uniquement ce JSON :
{
  "remarques": [
    {"champ": "NomTechnique", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT,
            ],

            // ── DD few-shot ───────────────────────────────────────────────────
            [
                'nom'       => 'Dictionnaire few-shot',
                'categorie' => 'dd',
                'actif'     => false,
                'prompt'    => <<<'PROMPT'
Contexte de l'exercice :
{{contexte}}

Voici le dictionnaire soumis par l'étudiant :
{{student_json}}

Voici la correction attendue :
{{correction_json}}

Compare les deux dictionnaires. Génère une remarque pour CHAQUE champ de l'étudiant, sans en omettre aucun.
- Champ correct (nom technique, type, clé primaire) : statut "valide" + encouragement court. NE pose PAS de question.
- Type incorrect : statut "invalide" + question sur le type.
- Clé primaire incorrecte : statut "invalide" + question sur l'identifiant.
- Champ calculé/dérivé : statut "invalide" + question sur la calculabilité.
- Champ en trop : statut "invalide" + question sur sa nécessité.
- Champs manquants : ajoute UNE remarque avec champ "" et une question sur le nombre de champs.

RÈGLE ORDRE : L'ordre des champs dans le dictionnaire de l'étudiant n'a pas d'importance.
RÈGLE CLÉ PRIMAIRE : Ignore complètement le champ PrimaryKey dans ta comparaison. Ne commente jamais la clé primaire.
RÈGLE NOM : Le nom technique d'un champ n'a pas besoin d'être identique à la correction si sa signification est équivalente (ex : "id_play" et "id_playlist" désignent la même chose). Dans ce cas, si le type correspond, marque le champ VALIDE.
RÈGLE ABSOLUE : si le type et le nom correspondent à la correction, marque VALIDE même si le nom pourrait laisser croire à un attribut calculé.
Ne mentionne jamais de valeurs précises issues de la correction. Utilise toujours "ce champ".

--- EXEMPLE 1 ---
Étudiant :
[
  {"TechnicalName": "id_produit", "Type": "Entier", "PrimaryKey": true},
  {"TechnicalName": "nom_produit", "Type": "Entier", "PrimaryKey": false},
  {"TechnicalName": "prix_ttc", "Type": "Décimal", "PrimaryKey": false}
]
Correction :
[
  {"TechnicalName": "id_produit", "Type": "Entier", "PrimaryKey": true},
  {"TechnicalName": "nom_produit", "Type": "AlphaNumérique", "PrimaryKey": false},
  {"TechnicalName": "prix_ht", "Type": "Décimal", "PrimaryKey": false}
]
Réponse :
{"remarques": [
  {"champ": "id_produit", "statut": "valide", "message": "Parfait !"},
  {"champ": "nom_produit", "statut": "invalide", "message": "Es-tu sûr du type de ce champ ?"},
  {"champ": "prix_ttc", "statut": "invalide", "message": "Ce champ est-il vraiment nécessaire dans le contexte de cet exercice ?"}
]}

--- EXEMPLE 2 ---
Étudiant :
[
  {"TechnicalName": "id_commande", "Type": "Entier", "PrimaryKey": true},
  {"TechnicalName": "date_commande", "Type": "Date", "PrimaryKey": false}
]
Correction :
[
  {"TechnicalName": "id_commande", "Type": "Entier", "PrimaryKey": true},
  {"TechnicalName": "date_commande", "Type": "Date", "PrimaryKey": false},
  {"TechnicalName": "montant_commande", "Type": "Décimal", "PrimaryKey": false}
]
Réponse :
{"remarques": [
  {"champ": "id_commande", "statut": "valide", "message": "Très bien !"},
  {"champ": "date_commande", "statut": "valide", "message": "Correct !"},
  {"champ": "", "statut": "invalide", "message": "Avez-vous la certitude qu'il y a le bon nombre de champs ?"}
]}
--- FIN DES EXEMPLES ---

RÈGLE CHAMP : Dans ta réponse JSON, le champ "champ" doit toujours contenir le nom technique exact tel qu'écrit par l'étudiant, jamais celui de la correction.
Retourne uniquement ce JSON :
{
  "remarques": [
    {"champ": "NomTechnique", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT,
            ],

            // ── DF standard ───────────────────────────────────────────────────
            [
                'nom'       => 'Dépendances standard',
                'categorie' => 'df',
                'actif'     => true,
                'prompt'    => <<<'PROMPT'
Contexte de l'exercice :
{{contexte}}

Voici les dépendances fonctionnelles élémentaires soumises par l'étudiant :
{{student_json}}

Voici la correction attendue :
{{correction_json}}

Compare les deux listes de dépendances élément par élément :
- Si la dépendance correspond à la correction (même source, mêmes attributs cibles) : statut "valide" + message d'encouragement court (ex : "Parfait !", "Correct !", "Très bien !"). NE pose PAS de question.
- Si la dépendance diffère de la correction : statut "invalide" + une seule question socratique courte, sans donner la réponse ni révéler la correction.

RÈGLE ORDRE : L'ordre des attributs cibles dans une dépendance n'a pas d'importance.
RÈGLE NOM : Le nom d'un attribut n'a pas besoin d'être identique à la correction si sa signification est équivalente (ex : "id_play" et "id_playlist" désignent la même chose). Dans ce cas, considère l'attribut comme correct.
Ne mentionne jamais de noms ou valeurs précises issus de la correction. Utilise toujours "cette dépendance" pour désigner la DFE.

Exemples pour les invalides :
- attributs cibles manquants → "Avez-vous bien identifié tous les attributs qui dépendent fonctionnellement de cette source ?"
- attributs cibles en trop → "Chacun des attributs cibles est-il vraiment déterminé uniquement par cette source ?"
- dépendance non attendue → "Cette dépendance est-elle vraiment élémentaire, ou peut-elle être déduite d'une autre ?"

RÈGLE SOURCE : Dans ta réponse JSON, le champ "source" doit toujours contenir les noms d'attributs exacts tels qu'écrits par l'étudiant, jamais ceux de la correction.
Retourne uniquement ce JSON :
{
  "remarques": [
    {"source": "attribut1,attribut2", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT,
            ],

            // ── DF few-shot ───────────────────────────────────────────────────
            [
                'nom'       => 'Dépendances few-shot',
                'categorie' => 'df',
                'actif'     => false,
                'prompt'    => <<<'PROMPT'
Contexte de l'exercice :
{{contexte}}

Voici les dépendances fonctionnelles soumises par l'étudiant :
{{student_json}}

Voici la correction attendue :
{{correction_json}}

Compare les deux listes de dépendances élément par élément :
- Si la dépendance correspond à la correction (même source, mêmes attributs cibles) : statut "valide" + message d'encouragement court. NE pose PAS de question.
- Si la dépendance diffère : statut "invalide" + une seule question socratique courte, sans révéler la correction.

RÈGLE ORDRE : L'ordre des attributs cibles dans une dépendance n'a pas d'importance.
RÈGLE NOM : Le nom d'un attribut n'a pas besoin d'être identique à la correction si sa signification est équivalente (ex : "id_play" et "id_playlist" désignent la même chose). Dans ce cas, considère l'attribut comme correct.
Ne mentionne jamais de noms ou valeurs précises issus de la correction. Utilise toujours "cette dépendance".

--- EXEMPLE 1 ---
Étudiant :
[
  {"source": ["id_client"], "cible": ["nom_client", "prenom_client"]},
  {"source": ["id_commande"], "cible": ["date_commande", "id_client", "montant_total"]}
]
Correction :
[
  {"source": ["id_client"], "cible": ["nom_client", "prenom_client"]},
  {"source": ["id_commande"], "cible": ["date_commande", "id_client"]}
]
Réponse :
{"remarques": [
  {"source": "id_client", "statut": "valide", "message": "Parfait !"},
  {"source": "id_commande", "statut": "invalide", "message": "Chacun des attributs cibles est-il vraiment déterminé uniquement par cette source ?"}
]}

--- EXEMPLE 2 ---
Étudiant :
[
  {"source": ["id_produit"], "cible": ["nom_produit", "prix_ht"]},
  {"source": ["id_commande", "id_produit"], "cible": ["quantite"]}
]
Correction :
[
  {"source": ["id_produit"], "cible": ["nom_produit", "prix_ht"]},
  {"source": ["id_commande", "id_produit"], "cible": ["quantite"]}
]
Réponse :
{"remarques": [
  {"source": "id_produit", "statut": "valide", "message": "Très bien !"},
  {"source": "id_commande,id_produit", "statut": "valide", "message": "Correct !"}
]}
--- FIN DES EXEMPLES ---

RÈGLE SOURCE : Dans ta réponse JSON, le champ "source" doit toujours contenir les noms d'attributs exacts tels qu'écrits par l'étudiant, jamais ceux de la correction.
Retourne uniquement ce JSON :
{
  "remarques": [
    {"source": "attribut1,attribut2", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT,
            ],

            // ── MCD standard ──────────────────────────────────────────────────
            [
                'nom'       => 'MCD standard',
                'categorie' => 'mcd',
                'actif'     => true,
                'prompt'    => <<<'PROMPT'
Contexte de l'exercice :
{{contexte}}

Voici le MCD soumis par l'étudiant :
{{student_json}}

Voici la correction attendue :
{{correction_json}}

Compare les deux MCD élément par élément. Pour chaque entité et association :
- Si l'élément correspond à la correction (nom, attributs, cardinalités, liens) : statut "valide" + message d'encouragement court (ex : "Parfait !", "Très bien !", "Correct !"). NE pose PAS de question.
- Si l'élément diffère de la correction OU contient un attribut calculé/dérivé : statut "invalide" + une seule question socratique courte, sans donner la réponse ni révéler la correction.

RÈGLE ORDRE : L'ordre des attributs dans une entité ou une association n'a pas d'importance.
RÈGLE VISUEL : La largeur, la hauteur, la position (x, y) et l'identifiant visuel (id) des entités et associations sont des propriétés graphiques sans rapport avec la correction — ignore-les entièrement.
RÈGLE NOM : Le nom d'un attribut n'a pas besoin d'être identique à la correction si sa signification est équivalente (ex : "id_play" et "id_playlist" désignent la même chose). Dans ce cas, considère l'attribut comme correct.
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
PROMPT,
            ],

            // ── MCD few-shot ──────────────────────────────────────────────────
            [
                'nom'       => 'MCD few-shot',
                'categorie' => 'mcd',
                'actif'     => false,
                'prompt'    => <<<'PROMPT'
Contexte de l'exercice :
{{contexte}}

Voici le MCD soumis par l'étudiant :
{{student_json}}

Voici la correction attendue :
{{correction_json}}

Compare les deux MCD élément par élément. Pour chaque entité et association :
- Si l'élément correspond à la correction (nom, attributs, cardinalités) : statut "valide" + message d'encouragement court. NE pose PAS de question.
- Si l'élément diffère : statut "invalide" + une seule question socratique courte, sans révéler la correction.

RÈGLE ORDRE : L'ordre des attributs dans une entité ou une association n'a pas d'importance.
RÈGLE VISUEL : La largeur, la hauteur, la position (x, y) et l'identifiant visuel (id) des entités et associations sont des propriétés graphiques sans rapport avec la correction — ignore-les entièrement.
RÈGLE NOM : Le nom d'un attribut n'a pas besoin d'être identique à la correction si sa signification est équivalente (ex : "id_play" et "id_playlist" désignent la même chose). Dans ce cas, considère l'attribut comme correct.
Chaque entité et association possède un champ "id". Utilise cet "id" dans ta réponse.
Ne mentionne jamais de noms ou valeurs précises issus de la correction.

--- EXEMPLE 1 ---
MCD étudiant :
{"Entities": [{"id": "e1", "name": "CLIENT", "fields": [{"TechnicalName": "id_client", "Type": "Entier", "PrimaryKey": true}]},{"id": "e2", "name": "PRODUIT", "fields": [{"TechnicalName": "id_produit", "Type": "Entier", "PrimaryKey": true}]}],"Associations": [{"id": "a1", "name": "ACHETER", "fields": [], "cardinalities": [{"entity": "CLIENT", "cardinality": "1,1"},{"entity": "PRODUIT", "cardinality": "0,N"}]}]}
Correction :
{"Entities": [{"id": "e1", "name": "CLIENT", "fields": [{"TechnicalName": "id_client", "Type": "Entier", "PrimaryKey": true}]},{"id": "e2", "name": "PRODUIT", "fields": [{"TechnicalName": "id_produit", "Type": "Entier", "PrimaryKey": true}]}],"Associations": [{"id": "a1", "name": "ACHETER", "fields": [], "cardinalities": [{"entity": "CLIENT", "cardinality": "0,N"},{"entity": "PRODUIT", "cardinality": "0,N"}]}]}
Réponse :
{"remarques": [{"id": "e1", "statut": "valide", "message": "Parfait !"},{"id": "e2", "statut": "valide", "message": "Très bien !"},{"id": "a1", "statut": "invalide", "message": "Combien d'occurrences de chaque entité peuvent réellement participer à cette association ?"}]}
--- FIN DES EXEMPLES ---

Retourne uniquement ce JSON :
{
  "remarques": [
    {"id": "id_exact_de_l_entite_ou_association", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT,
            ],
        ];

        foreach ($prompts as $data) {
            $prompt = Prompt::create($data);
            $prompt->tests()->sync([$contexte->id, $studentJson->id, $correctionJson->id]);
        }
    }
}
