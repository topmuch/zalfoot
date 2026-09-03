/**
 * URL publique du site — utilisée pour le SEO (canonical, OpenGraph, JSON-LD,
 * sitemap, robots). Configurable via la variable d'environnement SITE_URL :
 *   - en production (Coolify) : onglet Environment → SITE_URL=https://votre-domaine.tld
 *   - en local : .env → SITE_URL=http://localhost:3000
 * Par défaut : le domaine de la marque.
 */
export const SITE_URL = (process.env.SITE_URL ?? "https://zalfoot.com").replace(/\/+$/, "")

/** Nom du site par défaut (peut être surchargé dans le dashboard → Paramètres). */
export const SITE_NAME_DEFAULT = "Zalfoot"

/** Couleur de marque (emerald-700) — manifest, thème, balises. */
export const BRAND_COLOR = "#047857"
