# syntax=docker/dockerfile:1

# ============================================================
#  Zalfoot — Location de terrains de football à l'heure
#  Image de production : Next.js 16 (sortie standalone) + Prisma + SQLite
#  Compatible Docker / Docker Compose / Coolify
#
#  Construction :   docker build -t zalfoot .
#  Démarrage :      docker compose up -d
#  Données persistantes :
#    /app/data              -> base SQLite (custom.db)
#    /app/public/uploads    -> logos uploadés depuis le dashboard
# ============================================================

# ---------- Étape 1 : installation des dépendances ----------
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- Étape 2 : construction de l'application ----------
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# BD utilisée uniquement pendant le build (métadonnées SEO lues en base)
ENV DATABASE_URL=file:/app/db/custom.db

# Client Prisma généré puis build Next.js (sortie standalone + static + public)
RUN bunx prisma generate
RUN bun run build

# ---------- Étape 3 : image finale (runtime) ----------
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production \
    DATABASE_URL=file:/app/data/custom.db \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Serveur Next.js standalone (server.js + node_modules tracés + .next + public)
COPY --from=builder /app/.next/standalone ./
# Copies de sécurité (statiques + fichiers publics : logos, images du site)
COPY --from=builder /app/public ./public
# Base SQLite modèle (données actuelles du site) -> copiée dans le volume au 1er démarrage
COPY --from=builder /app/db ./db
# Script de démarrage (initialisation BD + lancement serveur) — fichiers racine uniquement,
# les sous-dossiers ne sont pas toujours inclus dans le contexte de build (Coolify…)
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh && mkdir -p /app/data /app/public/uploads

EXPOSE 3000

# Volumes persistants (détectés automatiquement par Coolify)
VOLUME ["/app/data", "/app/public/uploads"]

# Healthcheck intégré (aucun fichier externe requis) — sonde HTTP GET /
HEALTHCHECK --interval=30s --timeout=10s --start-period=25s --retries=3 \
  CMD ["bun", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

ENTRYPOINT ["./docker-entrypoint.sh"]
