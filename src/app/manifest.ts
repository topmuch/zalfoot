import type { MetadataRoute } from "next"
import { BRAND_COLOR } from "@/lib/site"

/**
 * Manifest PWA servi sur /manifest.webmanifest (généré par Next.js).
 * Icônes générées à partir du logo (voir scripts/generate-icons.ts).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zalfoot — Location de terrains de football à l'heure",
    short_name: "Zalfoot",
    description:
      "Réservez votre terrain de football en gazon synthétique à l'heure (Croisement Kaolack - Mbour, Sénégal) : 25 000 FCFA/heure, acompte Wave, disponibilités en temps réel.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fr",
    dir: "ltr",
    background_color: "#ffffff",
    theme_color: BRAND_COLOR,
    categories: ["sports", "business", "shopping"],
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  }
}
