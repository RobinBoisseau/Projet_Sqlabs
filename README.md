# Sqlabs

Application Laravel (API) + Angular (Frontend) conteneurisée avec Docker.

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- WSL2 (sous Windows)

## Lancer le projet

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

## Initialiser la base de données

A effectuer une seule fois après le premier lancement :

```bash
# Créer les tables
docker compose exec backend php artisan migrate

# Insérer les données exemples
docker compose exec backend php artisan db:seed

# Créer le compte administrateur
docker compose exec backend php artisan db:seed --class=AdminSeeder
```

> Le seeder admin est séparé du seeder principal car il ne doit pas être réexécuté lors d'un `db:seed` global (il utilise `firstOrCreate` et ne crée pas de doublon si relancé).

**Identifiants du compte administrateur :**

| Champ | Valeur |
|---|---|
| E-mail | `admin@sqlabs.fr` |
| Mot de passe | `admin1234` |

## Arrêter le projet

```bash
docker compose down
```
