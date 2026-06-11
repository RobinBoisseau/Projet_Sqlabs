# Sqlabs

Application pédagogique de modélisation de bases de données (Merise).  
Stack : Laravel 11 (API REST) + Angular 18 (Frontend), conteneurisée avec Docker.

**Rôles utilisateurs :** `admin` · `professeur` · `étudiant`

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- WSL2 (sous Windows)

## Installation

### 1. Configurer les variables d'environnement

```bash
cp backend/.env.example backend/.env
```

Ouvrez `backend/.env` et remplacez la valeur de `MISTRAL_API_KEY` par votre clé API Mistral (obtenable sur [console.mistral.ai](https://console.mistral.ai/)) :

```
MISTRAL_API_KEY=votre_clé_api_mistral
```

> Toutes les autres variables sont déjà configurées pour Docker, vous n'avez rien d'autre à modifier.

### 2. Lancer le projet

Au **premier lancement**, pour construire les images Docker :

```bash
docker compose up --build
```

Les lancements suivants :

```bash
docker compose up -d
```

Les services démarrent automatiquement :

| Service | URL |
|---|---|
| Angular (Frontend) | http://localhost:4200 |
| Laravel (API) | http://localhost:8000 |
| phpMyAdmin | http://localhost:8080 |
| MySQL | port 3306 |

### 3. Initialiser la base de données

Dans un **nouveau terminal**, ouvrez un shell dans le conteneur backend :

```bash
docker exec -it laravel_api bash
```

Vous êtes maintenant à l'intérieur du conteneur. Lancez ces deux commandes :

```bash
php artisan key:generate
php artisan migrate:fresh --seed
```

Puis quittez le conteneur :

```bash
exit
```

Cela génère la clé d'application, crée toutes les tables et insère les données d'exemple (utilisateurs, exercices, classes, prompts IA…).

**Identifiants du compte administrateur (par défaut) :**

| Champ | Valeur |
|---|---|
| E-mail | `admin@sqlabs.fr` |
| Mot de passe | `admin1234` |

> **Sécurité :** Pensez à changer le mot de passe admin dès la première connexion via la page **Mon profil**.

## Arrêter le projet

```bash
docker compose down
```

## IA — Mistral API

Le projet utilise l'API Mistral en ligne pour analyser les tentatives des étudiants.  
Créez un compte sur [console.mistral.ai](https://console.mistral.ai/) pour obtenir une clé API.

> **Alternative locale (Ollama) :** Si vous souhaitez utiliser un modèle local, installez [Ollama](https://ollama.com/), décommentez les variables `OLLAMA_URL` et `OLLAMA_MODEL` dans `backend/.env`, et adaptez le service IA en conséquence.
