import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getPublicSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Zalfoot — Location de terrains de football à l'heure";
const DEFAULT_DESCRIPTION =
  "Réservez votre terrain de football en gazon synthétique à l'heure (Croisement Kaolack - Mbour, Sénégal) : horaires 08h–01h du matin, 25 000 FCFA/h, acompte Wave, disponibilités en temps réel.";
const DEFAULT_KEYWORDS = [
  "Zalfoot",
  "football",
  "terrain",
  "gazon synthétique",
  "location",
  "réservation",
  "Kaolack",
  "Mbour",
  "Sénégal",
  "à l'heure",
];

/** SEO dynamique : les balises <title>/<meta> viennent de l'onglet Paramètres du dashboard. */
export async function generateMetadata(): Promise<Metadata> {
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;
  let keywords = DEFAULT_KEYWORDS;
  let icon = "/logo.webp";

  try {
    const settings = await getPublicSettings();
    if (settings.siteName && settings.seoTitle) {
      title = `${settings.siteName} — ${settings.seoTitle}`;
    } else if (settings.seoTitle) {
      title = settings.seoTitle;
    } else if (settings.siteName) {
      title = `${settings.siteName} — Location de terrains de football à l'heure`;
    }
    if (settings.seoDescription) description = settings.seoDescription;
    if (settings.seoKeywords) {
      keywords = settings.seoKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
    }
    if (settings.siteLogo) icon = settings.siteLogo;
  } catch {
    // Base indisponible → valeurs par défaut
  }

  return { title, description, keywords, icons: { icon } };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
