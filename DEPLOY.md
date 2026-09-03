# 🚀 Déploiement Zalfoot — Docker & Coolify

Application **Zalfoot** (location de terrains de football à l'heure) prête à déployer :
Next.js 16 + Prisma + SQLite, image Docker de production (sortie standalone), base de
données persistante et uploads persistants.

---

## 1. Fichiers Docker fournis

| Fichier                  | Rôle |
| ------------------------ | ---- |
| `Dockerfile`             | Image de production multi-étapes (bun → build Next.js standalone → image finale) |
| `docker-compose.yml`     | Orchestration : build, port, volumes persistants, healthcheck, redémarrage auto |
| `docker-entrypoint.sh`   | Premier démarrage : initialise la base SQLite puis lance le serveur |
| `scripts/healthcheck.js` | Sonde de santé utilisée par Docker/Coolify (HTTP `GET /`) |
| `.dockerignore`          | Limite le contexte de build aux fichiers utiles |
| `.env.example`           | Modèle de variables d'environnement pour le développement local |

**Volumes persistants** (les données survivent aux redéploiements) :

- `/app/data` → base SQLite (`custom.db`) — terrains, réservations, admins, réglages
- `/app/public/uploads` → logos uploadés depuis l'onglet Paramètres

Au **premier démarrage**, la base intégrée à l'image (données actuelles du site :
terrains, réservations, administrateurs, lien Wave, SEO) est copiée dans le volume.

---

## 2. Publier le code sur GitHub — `github.com/topmuch/zalfoot`

Sur votre machine (ou ici dans le dossier du projet) :

```bash
# 1. Créer le dépôt VIDE sur GitHub (sans README, sans .gitignore) :
#    https://github.com/new  ->  Owner: topmuch  ->  Name: zalfoot  ->  Create repository

# 2. Pousser le code (le remote est déjà configuré) :
git push -u origin main
```

> Si on vous demande des identifiants : utilisez un **Personal Access Token** GitHub
> (Settings → Developer settings → Personal access tokens) comme mot de passe.

---

## 3. Installation avec Coolify

Coolify déploie directement depuis le dépôt GitHub.

1. **Resources → New → GitHub App** (ou *Git repository*) 
2. Autoriser l'accès au dépôt `topmuch/zalfoot` (branche `main`).
3. **Build pack : Dockerfile** (le `Dockerfile` est à la racine, Coolify le détecte).
4. **Port du conteneur : 3000** (l'application écoute sur 3000).
5. Coolify détecte automatiquement les volumes déclarés (`/app/data`, `/app/public/uploads`)
   → les ajouter en **Persistent Storage** si besoin de les personnaliser.
6. Renseigner le **domaine** (ex. `zalfoot.votredomaine.sn`) puis **Deploy**.
7. Attendre le build (~2-4 min) : le conteneur passe en `healthy` après le healthcheck.

### Alternative : Docker Compose dans Coolify

Dans Coolify : **New → Docker Compose (Git)** en pointant sur `docker-compose.yml`,
ou simplement builder en ligne de commande sur le serveur :

```bash
git clone https://github.com/topmuch/zalfoot.git && cd zalfoot
docker compose up -d --build
```

---

## 4. Lancer en local avec Docker

```bash
docker compose up -d --build      # construit et démarre sur http://localhost:3000
docker compose logs -f            # suivi des logs
docker compose down               # arrêt (les volumes sont conservés)
```

Changer le port hôte : `PORT=8080 docker compose up -d`.

---

## 5. Première connexion

| Élément             | Valeur |
| ------------------- | ------ |
| Page de connexion   | bouton **Connexion** (header) |
| Compte principal    | `admin@zalfoot.com` / `admin123` (SUPER_ADMIN) |
| Compte secondaire   | `moussa@zalfoot.com` / `zalfoot123` (ADMIN) |

> ⚠️ **Changez ces mots de passe** dès la mise en production
> (dashboard → Administrateurs → menu ⋯ → modifier).

---

## 6. Mettre à jour l'application

```bash
git pull                      # récupérer les dernières modifications
docker compose up -d --build  # reconstruire et redémarrer (données conservées)
```

Les réservations, terrains, administrateurs et réglages sont conservés grâce aux volumes.
Pour repartir de la base d'origine : `docker compose down -v` (⚠️ efface les données)
puis `docker compose up -d --build`.

---

## 7. Dépannage

| Symptôme | Solution |
| -------- | -------- |
| Build échoue sur `bun install` | Vérifier la connexion réseau du serveur (téléchargement des dépendances) |
| Conteneur `unhealthy` | `docker logs zalfoot` — vérifier que le port 3000 est bien exposé |
| Erreur « base introuvable » | Vérifier que le volume `/app/data` existe et contient `custom.db` |
| Logo uploadé disparu | Le volume `/app/public/uploads` doit être persistant (Persistent Storage Coolify) |
| Changer le domaine | Coolify → application → Domain ; aucun réglage applicatif nécessaire |
