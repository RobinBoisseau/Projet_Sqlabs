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
            'mcd'        => $this->mcdPrompt($contexte, $studentJson, $correctionJson),
            'dictionary' => $this->dictionaryPrompt($contexte, $studentJson, $correctionJson),
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
- Si le champ diffère de la correction OU est un attribut calculé/dérivé : statut "invalide" + une seule question socratique courte, sans donner la réponse ni révéler la correction.

Ne mentionne jamais de noms ou valeurs précises issus de la correction. Utilise toujours "ce champ" pour désigner l'attribut concerné.

Exemples pour les invalides :
- type incorrect → "Le type choisi pour ce champ correspond-il bien à la nature des données qu'il doit stocker ?"
- clé primaire incorrecte → "Ce champ est-il vraiment celui qui identifie de façon unique chaque enregistrement ?"
- attribut calculé → "Ce champ peut-il être calculé depuis d'autres données ? Si oui, doit-il figurer dans le dictionnaire ?"
- champ en trop → "Ce champ est-il vraiment nécessaire dans le contexte de cet exercice ?"
- champ en moins → "Avez vous la certitude qu'il y a le bon nombre de champs"
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
}
