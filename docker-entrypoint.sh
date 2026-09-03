#!/bin/sh
# ============================================================
#  Zalfoot — point d'entrée du conteneur
#  1. Prépare les volumes (base SQLite + uploads)
#  2. Au premier démarrage : copie la base modèle intégrée à l'image
#  3. Lance le serveur Next.js (production, standalone)
# ============================================================
set -e

mkdir -p /app/data /app/public/uploads

# Premier démarrage : initialiser la base de données depuis la copie modèle
if [ ! -f /app/data/custom.db ]; then
  echo "📦 Premier démarrage : initialisation de la base de données Zalfoot…"
  cp /app/db/custom.db /app/data/custom.db
  echo "✅ Base de données initialisée dans /app/data (volume persistant)."
fi

echo "🚀 Démarrage du serveur Zalfoot sur le port ${PORT:-3000}…"
exec bun server.js
