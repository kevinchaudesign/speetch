import type { Metadata, Viewport } from "next";
import {
  Inter,
  Fraunces,
  Playfair_Display,
  Cormorant_Garamond,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});

// Typographies du mode "document" (pages issues d'un template HTML).
// Chargées globalement pour éviter un re-fetch sur la première vue document.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-doc-display",
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-doc-italic",
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://speetch.com"),
  title: {
    default: "Speetch — Agence de Communication · Paris",
    template: "%s · Speetch",
  },
  description:
    "Speetch — Agence de communication parisienne. Direction artistique, identité de marque et expériences numériques haut de gamme. 25 ans d'expertise.",
  applicationName: "Speetch",
  authors: [{ name: "Speetch" }],
  creator: "Speetch",
  publisher: "Speetch",
  openGraph: {
    title: "Speetch — Agence de Communication",
    description: "Paris · 25 ans d'expérience.",
    url: "https://speetch.com",
    siteName: "Speetch",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speetch — Agence de Communication",
    description: "Paris · 25 ans d'expérience.",
  },
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} ${playfair.variable} ${cormorant.variable} dark`}
      suppressHydrationWarning
    >
      <body className="relative min-h-screen bg-black font-sans text-[#F5F5F7] antialiased selection:bg-[#F5F5F7] selection:text-black overflow-x-hidden">
        {/* Vignette douce — masquée en mode document via .doc-mode-active */}
        <div
          aria-hidden
          className="overlay-default pointer-events-none fixed inset-0 z-[55] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)]"
        />

        {/* Grain de film — overlay animé */}
        <div
          aria-hidden
          className="overlay-default grain pointer-events-none fixed inset-0 z-[60] opacity-[0.08] mix-blend-overlay"
        />

        {/* Liseré technique — détail FWA */}
        <div
          aria-hidden
          className="overlay-default pointer-events-none fixed inset-x-0 top-0 z-[65] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
        <div
          aria-hidden
          className="overlay-default pointer-events-none fixed inset-x-0 bottom-0 z-[65] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />

        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
