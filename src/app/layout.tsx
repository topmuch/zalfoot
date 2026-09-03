import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zalfoot — Location de terrains de football à l'heure",
  description:
    "Réservez votre terrain de football en gazon synthétique à l'heure (Croisement Kaolack - Mbour, Sénégal) : horaires 08h–minuit, 25 000 FCFA/h, acompte Wave, disponibilités en temps réel.",
  keywords: [
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
  ],
  icons: {
    icon: "/logo.webp",
  },
};

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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
