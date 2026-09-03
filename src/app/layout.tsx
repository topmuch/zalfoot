import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getPublicSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { BRAND_COLOR, SITE_NAME_DEFAULT, SITE_URL } from "@/lib/site";

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
  "Location de terrain de football à l'heure au croisement Kaolack - Mbour (Sénégal) : gazon synthétique, créneaux de 8 h à 1 h du matin, 25 000 FCFA/heure, réservation en ligne et acompte Wave.";
const DEFAULT_KEYWORDS = [
  "Zalfoot",
  "terrain football",
  "location terrain football",
  "terrain football Kaolack",
  "terrain football Mbour",
  "location terrain football Sénégal",
  "louer terrain de football",
  "terrain de foot à l'heure",
  "réservation terrain football",
  "gazon synthétique Kaolack",
  "gazon synthétique Sénégal",
  "stade football Kaolack",
  "terrain foot pas cher Sénégal",
  "football Sénégal",
  "match football Kaolack",
  "réservation en ligne terrain",
  "acompte Wave",
  "Kaolack",
  "Mbour",
  "Sénégal",
];

/** Coordonnées du complexe (identiques à la page Contact / pied de page). */
const CONTACT_PHONE = "+221782784949";
const CONTACT_ADDRESS = {
  street: "Croisement Kaolack - Mbour",
  locality: "Kaolack",
  region: "Kaolack",
  country: "SN",
};
const GEO = { latitude: 14.1512, longitude: -16.0731 }; // Kaolack (croisement Kaolack-Mbour)
const OPENING = { opens: "08:00", closes: "01:00" }; // dernier match : 00:00 → 01:00

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** SEO dynamique : les balises <title>/<meta> viennent de l'onglet Paramètres du dashboard. */
export async function generateMetadata(): Promise<Metadata> {
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;
  let keywords = DEFAULT_KEYWORDS;
  let siteName = SITE_NAME_DEFAULT;
  let siteLogo: string | null = null;

  try {
    const settings = await getPublicSettings();
    if (settings.siteName) siteName = settings.siteName;
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
    if (settings.siteLogo) siteLogo = settings.siteLogo;
  } catch {
    // Base indisponible → valeurs par défaut
  }

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords,
    applicationName: siteName,
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    category: "sports",
    alternates: { canonical: "/" },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        ...(siteLogo ? [{ url: siteLogo }] : []),
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      ],
      shortcut: [{ url: "/favicon.ico" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: siteName,
      title,
      description,
      locale: "fr_SN",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${siteName} — Location de terrains de football à l'heure à Kaolack - Mbour, Sénégal`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: "default",
    },
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
    other: {
      "geo.region": "SN",
      "geo.placename": "Kaolack, Mbour, Sénégal",
      "geo.position": `${GEO.latitude};${GEO.longitude}`,
      ICBM: `${GEO.latitude}, ${GEO.longitude}`,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: BRAND_COLOR,
};

/** Données structurées JSON-LD (Google : établissement + offres de location). */
async function buildJsonLd() {
  let siteName = SITE_NAME_DEFAULT;
  let description = DEFAULT_DESCRIPTION;
  let siteLogo = "/logo.webp";
  let facilities: { name: string; description: string | null; pricePerHour: number }[] = [];

  try {
    const settings = await getPublicSettings();
    if (settings.siteName) siteName = settings.siteName;
    if (settings.seoDescription) description = settings.seoDescription;
    if (settings.siteLogo) siteLogo = settings.siteLogo;
    facilities = await db.facility.findMany({
      where: { active: true },
      select: { name: true, description: true, pricePerHour: true },
      orderBy: { pricePerHour: "asc" },
    });
  } catch {
    // Base indisponible → valeurs par défaut
  }

  const prices = facilities.map((f) => f.pricePerHour).filter((p) => p > 0);
  const priceRange = prices.length
    ? prices.length > 1 && prices[0] !== prices[prices.length - 1]
      ? `${prices[0]}-${prices[prices.length - 1]} XOF`
      : `${prices[0]} XOF`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": ["SportsActivityLocation", "LocalBusiness"],
    "@id": `${SITE_URL}/#business`,
    name: siteName,
    description,
    url: SITE_URL,
    telephone: CONTACT_PHONE,
    image: [`${SITE_URL}/og-image.png`, `${SITE_URL}/hero-football.png`],
    logo: `${SITE_URL}${siteLogo}`,
    ...(priceRange ? { priceRange } : {}),
    currenciesAccepted: "XOF",
    paymentAccepted: "Wave, espèces",
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT_ADDRESS.street,
      addressLocality: CONTACT_ADDRESS.locality,
      addressRegion: CONTACT_ADDRESS.region,
      addressCountry: CONTACT_ADDRESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    areaServed: [
      { "@type": "City", name: "Kaolack" },
      { "@type": "City", name: "Mbour" },
      { "@type": "Country", name: "Sénégal" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAYS,
        opens: OPENING.opens,
        closes: OPENING.closes,
      },
    ],
    ...(facilities.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Location de terrains de football",
            itemListElement: facilities.map((f) => ({
              "@type": "Offer",
              price: f.pricePerHour,
              priceCurrency: "XOF",
              availability: "https://schema.org/InStock",
              itemOffered: {
                "@type": "Service",
                name: f.name,
                ...(f.description ? { description: f.description } : {}),
              },
            })),
          },
        }
      : {}),
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: SITE_URL,
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      result: { "@type": "Reservation", name: "Réservation de terrain de football" },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = await buildJsonLd();
  // Échappement < → \u003c : empêche toute sortie prémature du <script> (injection)
  const jsonLdHtml = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
