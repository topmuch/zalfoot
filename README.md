# ⚽ Zalfoot — Location de terrains de football à l'heure

Site web de réservation de terrains de football en gazon synthétique (Kaolack–Mbour, Sénégal).
Location à l'heure, acompte Wave, calendrier public, dashboard administrateur complet.

## Stack

- **Next.js 16** (App Router, TypeScript, sortie standalone)
- **Prisma + SQLite** (terrains, réservations, administrateurs, réglages)
- **Tailwind CSS 4 + shadcn/ui** (interface, mode sombre)
- **Docker** (image de production prête pour Coolify / Docker Compose)

## Fonctionnalités

- Accueil public : terrains actifs, présentation, guide de réservation
- Réservation en ligne : créneaux 08:00 → minuit 7j/7, 25 000 FCFA/h, acompte 5 000 F/h via Wave
- Calendrier public des réservations (auto-actualisation)
- Dashboard admin : réservations temps réel, terrains (activer/désactiver), calendrier,
  administrateurs, statistiques, paramètres (nom & logo, SEO, e-mails SMTP)
- Connexion sécurisée (sessions Bearer, mots de passe hachés scrypt)

## Démarrage rapide (développement)

```bash
bun install
cp .env.example .env        # DATABASE_URL pour Prisma
bun run db:push             # crée la base SQLite
bun run dev                 # http://localhost:3000
```

Compte de démonstration : `admin@zalfoot.com` / `admin123`.

## Déploiement (Docker / Coolify)

Voir le guide complet : **[DEPLOY.md](./DEPLOY.md)**

```bash
docker compose up -d --build
```

- Port : `3000` (modifiable via la variable `PORT` du compose)
- Volumes persistants : `/app/data` (base SQLite) et `/app/public/uploads` (logos)
