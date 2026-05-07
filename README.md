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
```

## Arrêter le projet

```bash
docker compose down
```
