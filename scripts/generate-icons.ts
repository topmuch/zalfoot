/**
 * Génération des icônes du site Zalfoot à partir de public/logo.svg (Z blanc sur carré arrondi).
 * Exécution : bun scripts/generate-icons.ts
 * Sorties dans public/ : favicon.ico, favicon-{16,32,48}.png, apple-touch-icon.png,
 * android-chrome-{192,512}.png, icon-maskable-512.png, og-image.png
 */
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const DARK = "#2D2D2D";

const original = await readFile("public/logo.svg", "utf8");

// Extraire les 3 paths du Z (on les réutilise dans les variantes)
const Z_PATHS = `
  <path fill="#FFFFFF" d="M15.47,7.1l-1.3,1.85c-0.2,0.29-0.54,0.47-0.9,0.47h-7.1V7.09C6.16,7.1,15.47,7.1,15.47,7.1z"/>
  <polygon fill="#FFFFFF" points="24.3,7.1 13.14,22.91 5.7,22.91 16.86,7.1"/>
  <path fill="#FFFFFF" d="M14.53,22.91l1.31-1.86c0.2-0.29,0.54-0.47,0.9-0.47h7.09v2.33H14.53z"/>`;

/** SVG d'origine (carré arrondi + contour, coins transparents) — favicon petits formats. */
const svgRounded = (size: number) =>
  Buffer.from(original.replace(/<\?xml[^>]*\?>/, ""));

/** Variant carré plein (sans coins transparents) — apple-touch, android-chrome. */
const svgSquare = (size: number) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="${size}" height="${size}">
  <rect x="0" y="0" width="30" height="30" rx="4.5" fill="${DARK}"/>
  ${Z_PATHS}
</svg>`);

/** Variant maskable : Z réduit à ~72 % (zone sûre = cercle central de 80 %). */
const svgMaskable = (size: number) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="${size}" height="${size}">
  <rect x="0" y="0" width="30" height="30" fill="${DARK}"/>
  <g transform="translate(15 15) scale(0.72) translate(-15.1 -15.005)">${Z_PATHS}</g>
</svg>`);

async function renderSvg(svg: Buffer, size: number): Promise<Buffer> {
  return sharp(svg, { density: Math.round(72 * (size / 30)) })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/** Conteneur ICO avec PNG embarqués (16, 32, 48 px). */
function buildIco(pngs: { size: number; data: Buffer }[]): Buffer {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // réservé
  header.writeUInt16LE(1, 2); // type = icône
  header.writeUInt16LE(count, 4);
  const dirs: Buffer[] = [];
  const blobs: Buffer[] = [];
  let offset = 6 + 16 * count; // les entrées de répertoire précèdent toutes les données
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // largeur
    e.writeUInt8(size >= 256 ? 0 : size, 1); // hauteur
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // réservé
    e.writeUInt16LE(1, 4); // plans
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(data.length, 8); // taille PNG
    e.writeUInt32LE(offset, 12); // offset
    dirs.push(e);
    blobs.push(data);
    offset += data.length;
  }
  return Buffer.concat([header, ...dirs, ...blobs]);
}

// ---- 1. Favicons (carré arrondi d'origine, coins transparents) ----
const png16 = await renderSvg(svgRounded(16), 16);
const png32 = await renderSvg(svgRounded(32), 32);
const png48 = await renderSvg(svgRounded(48), 48);
await writeFile("public/favicon-16x16.png", png16);
await writeFile("public/favicon-32x32.png", png32);
await writeFile("public/favicon-48x48.png", png48);
await writeFile("public/favicon.ico", buildIco([
  { size: 16, data: png16 },
  { size: 32, data: png32 },
  { size: 48, data: png48 },
]));
console.log("✓ favicon.ico + favicon-{16,32,48}.png");

// ---- 2. Carré plein : apple-touch (180) + android-chrome (192, 512) ----
await writeFile("public/apple-touch-icon.png", await renderSvg(svgSquare(180), 180));
await writeFile("public/android-chrome-192x192.png", await renderSvg(svgSquare(192), 192));
await writeFile("public/android-chrome-512x512.png", await renderSvg(svgSquare(512), 512));
await writeFile("public/icon-maskable-512.png", await renderSvg(svgMaskable(512), 512));
console.log("✓ apple-touch-icon.png + android-chrome-{192,512}.png + icon-maskable-512.png");

// ---- 3. Image Open Graph / Twitter 1200x630 ----
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ogSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#047857"/>
      <stop offset="0.55" stop-color="#065f46"/>
      <stop offset="1" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.03"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.10"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#sheen)"/>
  <circle cx="1050" cy="80" r="260" fill="#ffffff" opacity="0.05"/>
  <circle cx="120" cy="580" r="200" fill="#ffffff" opacity="0.05"/>
  <g transform="translate(525 92)">
    <rect x="0" y="0" width="150" height="150" rx="24" fill="#FFFFFF"/>
    <g transform="translate(75 75) scale(3.4) translate(-15.1 -15.005)">
      ${Z_PATHS.replace(/#FFFFFF/g, "#047857")}
    </g>
  </g>
  <text x="600" y="345" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="86" fill="#FFFFFF">Zalfoot</text>
  <text x="600" y="410" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="34" fill="#d1fae5">${esc("Location de terrains de football à l'heure")}</text>
  <text x="600" y="472" text-anchor="middle" font-family="DejaVu Sans" font-size="28" fill="#a7f3d0">${esc("⚽ Croisement Kaolack – Mbour · Sénégal")}</text>
  <text x="600" y="545" text-anchor="middle" font-family="DejaVu Sans" font-size="26" fill="#f0fdf4">${esc("Gazon synthétique · 25 000 FCFA/h · Réservation en ligne · Acompte Wave")}</text>
</svg>`);
await sharp(ogSvg).png({ compressionLevel: 9 }).toFile("public/og-image.png");
console.log("✓ og-image.png (1200x630)");

// ---- Vérification ----
for (const f of [
  "favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "favicon-48x48.png",
  "apple-touch-icon.png", "android-chrome-192x192.png", "android-chrome-512x512.png",
  "icon-maskable-512.png", "og-image.png",
]) {
  if (f.endsWith(".ico")) {
    const ico = await readFile(`public/${f}`);
    const count = ico.readUInt16LE(4);
    let ok = ico.readUInt16LE(2) === 1 && count === 3 && ico.length === 6 + 48 + 16 + 32 + 48;
    console.log(`  ${f} → ICO ${count} entrées (${ico.length} octets) ${ok ? "structure OK" : "⚠ vérifier"}`);
    continue;
  }
  const m = await sharp(`public/${f}`).metadata();
  console.log(`  ${f} → ${m.format} ${m.width}x${m.height}`);
}
