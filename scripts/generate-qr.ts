/**
 * Génération du QR code de réservation Zalfoot.
 * Exécution : bun scripts/generate-qr.ts
 * Sortie : public/qr-reservation.png — QR pointant sur {SITE_URL}/#reserver
 * (le hash #reserver ouvre directement la page de réservation, voir landing.tsx).
 *
 * URL personnalisable : SITE_URL=https://mon-domaine.sn bun scripts/generate-qr.ts
 */
import QRCode from "qrcode";
import { stat } from "node:fs/promises";

const SITE_URL = (process.env.SITE_URL ?? "https://zalfoot.com").replace(/\/+$/, "");
const TARGET = `${SITE_URL}/#reserver`;
const OUT = "public/qr-reservation.png";

const DARK = "#2D2D2D"; // même brun-noir que le logo (cohérence de marque)
const LIGHT = "#FFFFFF"; // fond blanc : contraste maximal pour les scanners

await QRCode.toFile(OUT, TARGET, {
  width: 560,
  margin: 2,
  errorCorrectionLevel: "H",
  color: { dark: DARK, light: LIGHT },
});

const info = await stat(OUT);
console.log(`QR généré → ${OUT} (${info.size} octets)`);
console.log(`Cible : ${TARGET}`);
