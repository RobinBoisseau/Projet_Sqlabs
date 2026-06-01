<?php

namespace App\Services;

class PromptService
{
    private const BASE_SYSTEM = <<<SYSTEM
Tu es un professeur de bases de données bienveillant, spécialisé en modélisation Merise, qui enseigne à des étudiants de première année de BUT Informatique.
Pour les éléments INCORRECTS uniquement, tu pratiques le dialogue socratique : tu poses une courte question qui amène l'étudiant à trouver son erreur, sans jamais donner la réponse ni révéler le contenu de la correction.
Pour les éléments CORRECTS, tu valides avec un message d'encouragement court et positif, sans poser de question.
Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.
Lorsqu'un élément est manquant (un atribut par exemple), fait en sorte que tout les problèmes liés à cet élément soit relevés par l'IA.
SYSTEM;

    public function systemPrompt(string $type): string
    {
        $extra = match ($type) {
            'mcd'        => "Règle Merise : les attributs calculés ou dérivés (ex : âge calculé depuis une date de naissance, total calculé depuis prix × quantité) ne doivent JAMAIS apparaître dans un MCD.",
            'dictionary' => "Règle Merise : les attributs calculés ou dérivés (ex : âge calculé depuis une date de naissance, total calculé depuis prix × quantité) ne doivent JAMAIS figurer dans le dictionnaire de données.",
            default      => '',
        };

        return $extra ? self::BASE_SYSTEM . "\n" . $extra : self::BASE_SYSTEM;
    }

    public function userPrompt(string $type, string $contexte, string $studentJson, string $correctionJson): string
    {
        return match ($type) {
            'mcd'          => $this->mcdPrompt($contexte, $studentJson, $correctionJson),
            'dictionary'   => $this->dictionaryPrompt($contexte, $studentJson, $correctionJson),
            'dependencies' => $this->dependenciesPrompt($contexte, $studentJson, $correctionJson),
        };
    }

    private function mcdPrompt(string $contexte, string $studentJson, string $correctionJson): string
    {
        return <<<PROMPT
Contexte de l'exercice :
{$contexte}

Voici le MCD soumis par l'étudiant :
{$studentJson}

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
    }

    private function dictionaryPrompt(string $contexte, string $studentJson, string $correctionJson): string
    {
        return <<<PROMPT
Contexte de l'exercice :
{$contexte}

Voici le dictionnaire de données soumis par l'étudiant :
{$studentJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux dictionnaires. Tu DOIS générer une remarque pour CHAQUE champ du dictionnaire de l'étudiant, sans en omettre aucun.
- Si le champ correspond à la correction (nom technique, type, clé primaire) : statut "valide" + message d'encouragement court (ex : "Parfait !", "Correct !", "Très bien !"). NE pose PAS de question.
- Si le champ a un TYPE différent de la correction : statut "invalide" + question sur le type uniquement.
- Si le champ a une CLEF PRIMAIRE incorrecte : statut "invalide" + question sur l'identifiant.
- Si le champ est un attribut CALCULÉ ou DÉRIVÉ (ex : un total, un âge) : statut "invalide" + question sur le fait qu'il puisse être calculé.
- Si le champ est en TROP par rapport à la correction : statut "invalide" + question sur sa nécessité.
- Si l'étudiant a MOINS de champs que la correction : ajoute UNE remarque supplémentaire à la fin avec champ "" (chaîne vide), statut "invalide", et une question du type de l'exemple ci-dessous.

RÈGLE ABSOLUE : ne spécule jamais. Si le type et le nom technique d'un champ correspondent à la correction, marque-le VALIDE, même si son nom pourrait laisser penser qu'il est calculable. Ne signale jamais un champ comme potentiellement calculé si son type est déjà correct.

Ne mentionne jamais de noms ou valeurs précises issus de la correction. Utilise toujours "ce champ" pour désigner l'attribut concerné.

Exemples pour les invalides :
- type incorrect → "Es-tu sûr du type de ce champ ?"
- clé primaire incorrecte → "Ce champ est-il vraiment celui qui identifie de façon unique chaque enregistrement ?"
- attribut calculé → "Ce champ peut-il être calculé depuis d'autres données ? Si oui, doit-il figurer dans le dictionnaire ?"
- champ en trop → "Ce champ est-il vraiment nécessaire dans le contexte de cet exercice ?"
- champ en moins → "Avez vous la certitude qu'il y a le bon nombre de champs ?"
Retourne uniquement ce JSON :
{
  "remarques": [
    {"champ": "NomTechnique", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT;
    }

    private function dependenciesPrompt(string $contexte, string $studentJson, string $correctionJson): string
    {
        return <<<PROMPT
Contexte de l'exercice :
{$contexte}

Voici les dépendances fonctionnelles élémentaires soumises par l'étudiant :
{$studentJson}

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
    }

    // ══════════════════════════════════════════════════════════════════
    // VERSIONS FEW-SHOT (exemples concrets inclus dans le prompt)
    // ══════════════════════════════════════════════════════════════════

    public function mcdPromptFewShot(string $contexte, string $studentJson, string $correctionJson): string
    {
        return <<<PROMPT
Contexte de l'exercice :
{$contexte}

Voici le MCD soumis par l'étudiant :
{$studentJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux MCD élément par élément. Pour chaque entité et association :
- Si l'élément correspond à la correction (nom, attributs, cardinalités) : statut "valide" + message d'encouragement court. NE pose PAS de question.
- Si l'élément diffère : statut "invalide" + une seule question socratique courte, sans révéler la correction.

Chaque entité et association possède un champ "id". Utilise cet "id" dans ta réponse.
Ne mentionne jamais de noms ou valeurs précises issus de la correction.

--- EXEMPLE 1 ---
MCD étudiant :
{
  "Entities": [
    {"id": "e1", "name": "CLIENT", "fields": [{"TechnicalName": "id_client", "Type": "Entier", "PrimaryKey": true}, {"TechnicalName": "nom_client", "Type": "AlphaNumérique", "PrimaryKey": false}]},
    {"id": "e2", "name": "PRODUIT", "fields": [{"TechnicalName": "id_produit", "Type": "Entier", "PrimaryKey": true}]}
  ],
  "Associations": [
    {"id": "a1", "name": "ACHETER", "fields": [], "cardinalities": [{"entity": "CLIENT", "cardinality": "1,1"}, {"entity": "PRODUIT", "cardinality": "0,N"}]}
  ]
}
Correction :
{
  "Entities": [
    {"id": "e1", "name": "CLIENT", "fields": [{"TechnicalName": "id_client", "Type": "Entier", "PrimaryKey": true}, {"TechnicalName": "nom_client", "Type": "AlphaNumérique", "PrimaryKey": false}]},
    {"id": "e2", "name": "PRODUIT", "fields": [{"TechnicalName": "id_produit", "Type": "Entier", "PrimaryKey": true}]}
  ],
  "Associations": [
    {"id": "a1", "name": "ACHETER", "fields": [], "cardinalities": [{"entity": "CLIENT", "cardinality": "0,N"}, {"entity": "PRODUIT", "cardinality": "0,N"}]}
  ]
}
Réponse :
{"remarques": [
  {"id": "e1", "statut": "valide", "message": "Parfait !"},
  {"id": "e2", "statut": "valide", "message": "Très bien !"},
  {"id": "a1", "statut": "invalide", "message": "Combien d'occurrences de chaque entité peuvent réellement participer à cette association ?"}
]}

--- EXEMPLE 2 ---
MCD étudiant :
{
  "Entities": [
    {"id": "e3", "name": "EMPLOYE", "fields": [{"TechnicalName": "id_employe", "Type": "Entier", "PrimaryKey": true}, {"TechnicalName": "nom", "Type": "AlphaNumérique", "PrimaryKey": false}, {"TechnicalName": "age", "Type": "Entier", "PrimaryKey": false}]},
    {"id": "e4", "name": "SERVICE", "fields": [{"TechnicalName": "id_service", "Type": "Entier", "PrimaryKey": true}]}
  ],
  "Associations": [
    {"id": "a2", "name": "APPARTENIR", "fields": [], "cardinalities": [{"entity": "EMPLOYE", "cardinality": "1,1"}, {"entity": "SERVICE", "cardinality": "1,N"}]}
  ]
}
Correction :
{
  "Entities": [
    {"id": "e3", "name": "EMPLOYE", "fields": [{"TechnicalName": "id_employe", "Type": "Entier", "PrimaryKey": true}, {"TechnicalName": "nom", "Type": "AlphaNumérique", "PrimaryKey": false}]},
    {"id": "e4", "name": "SERVICE", "fields": [{"TechnicalName": "id_service", "Type": "Entier", "PrimaryKey": true}]}
  ],
  "Associations": [
    {"id": "a2", "name": "APPARTENIR", "fields": [], "cardinalities": [{"entity": "EMPLOYE", "cardinality": "1,1"}, {"entity": "SERVICE", "cardinality": "1,N"}]}
  ]
}
Réponse :
{"remarques": [
  {"id": "e3", "statut": "invalide", "message": "Tous les attributs de cette entité sont-ils vraiment nécessaires, ou l'un d'eux peut-il être calculé depuis d'autres données ?"},
  {"id": "e4", "statut": "valide", "message": "Correct !"},
  {"id": "a2", "statut": "valide", "message": "Parfait !"}
]}
--- FIN DES EXEMPLES ---

Retourne uniquement ce JSON :
{
  "remarques": [
    {"id": "id_exact_de_l_entite_ou_association", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT;
    }

    public function dictionaryPromptFewShot(string $contexte, string $studentJson, string $correctionJson): string
    {
        return <<<PROMPT
Contexte de l'exercice :
{$contexte}

Voici le dictionnaire soumis par l'étudiant :
{$studentJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux dictionnaires. Génère une remarque pour CHAQUE champ de l'étudiant, sans en omettre aucun.
- Champ correct (nom technique, type, clé primaire) : statut "valide" + encouragement court. NE pose PAS de question.
- Type incorrect : statut "invalide" + question sur le type.
- Clé primaire incorrecte : statut "invalide" + question sur l'identifiant.
- Champ calculé/dérivé : statut "invalide" + question sur la calculabilité.
- Champ en trop : statut "invalide" + question sur sa nécessité.
- Champs manquants : ajoute UNE remarque avec champ "" et une question sur le nombre de champs.

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

Retourne uniquement ce JSON :
{
  "remarques": [
    {"champ": "NomTechnique", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT;
    }

    public function dependenciesPromptFewShot(string $contexte, string $studentJson, string $correctionJson): string
    {
        return <<<PROMPT
Contexte de l'exercice :
{$contexte}

Voici les dépendances fonctionnelles soumises par l'étudiant :
{$studentJson}

Voici la correction attendue :
{$correctionJson}

Compare les deux listes de dépendances élément par élément :
- Si la dépendance correspond à la correction (même source, mêmes attributs cibles) : statut "valide" + message d'encouragement court. NE pose PAS de question.
- Si la dépendance diffère : statut "invalide" + une seule question socratique courte, sans révéler la correction.

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

Retourne uniquement ce JSON :
{
  "remarques": [
    {"source": "attribut1,attribut2", "statut": "valide|invalide", "message": "message de validation ou question socratique"}
  ]
}
PROMPT;
    }
}
