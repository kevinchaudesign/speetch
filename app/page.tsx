import type { Metadata } from "next";
import { LandingHero } from "./_components/landing/landing-hero";
import { LandingApproach } from "./_components/landing/landing-approach";
import { LandingDisciplines } from "./_components/landing/landing-disciplines";
import { LandingClients } from "./_components/landing/landing-clients";
import { LandingAbout } from "./_components/landing/landing-about";
import { LandingContact } from "./_components/landing/landing-contact";
import { LandingFooter } from "./_components/landing/landing-footer";
import { ContactAvatar } from "./_components/landing/contact-avatar";

const SITE_URL = "https://speetch.com";
const SITE_TITLE =
  "Speetch — Studio de communication à l'ère de l'IA · Paris";
const SITE_DESCRIPTION =
  "Studio parisien. Quatre disciplines — marque, produit, contenu, croissance — augmentées par l'IA (agents, MCP, GEO, brand voice, génération image/vidéo). Pour les founders, équipes produit et CMO qui veulent être présents dans Claude et ChatGPT autant que dans Google.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Speetch",
  authors: [{ name: "Speetch", url: SITE_URL }],
  creator: "Speetch",
  publisher: "Speetch",
  keywords: [
    "agence communication Paris",
    "studio IA Paris",
    "branding IA",
    "brand voice IA",
    "GEO Generative Engine Optimization",
    "MCP Model Context Protocol",
    "agents IA",
    "design produit Next.js Supabase",
    "agence transformation IA",
    "claude code studio",
    "Speetch",
  ],
  alternates: {
    canonical: "/",
    languages: { "fr-FR": "/" },
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Speetch",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speetch — DA à l'ère de l'IA",
    description: SITE_DESCRIPTION,
  },
};

/** Structured data Organization — alimente le Knowledge Graph Google. */
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Speetch",
  url: SITE_URL,
  description:
    "Studio de communication parisien à l'ère de l'IA. Quatre disciplines (marque, produit, contenu, croissance) augmentées par une couche IA transverse — agents, MCP, GEO, brand voice, génération image/vidéo.",
  email: "hello@speetch.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Paris",
    addressCountry: "FR",
  },
  areaServed: { "@type": "Country", name: "France" },
  knowsAbout: [
    "Intelligence artificielle",
    "Agents IA",
    "Model Context Protocol",
    "Generative Engine Optimization",
    "Brand voice IA",
    "Identité de marque",
    "Direction artistique",
    "Design produit",
    "Plateformes Next.js Supabase",
    "Contenu génératif",
    "Croissance digitale",
  ],
  foundingDate: "2026",
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Speetch",
  url: SITE_URL,
  inLanguage: "fr-FR",
  publisher: { "@type": "Organization", name: "Speetch" },
};

export default function HomePage() {
  return (
    <main className="relative w-full bg-black text-[#F5F5F7]" id="top">
      {/* JSON-LD pour les crawlers — schema.org Organization + WebSite */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
      />

      <a
        href="#approche"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-black focus:px-4 focus:py-2 focus:text-[11px] focus:uppercase focus:tracking-[0.32em] focus:text-cyan-100 focus:outline-cyan-200"
      >
        Aller au contenu
      </a>

      <LandingHero />
      <LandingApproach />
      <LandingDisciplines />
      <LandingClients />
      <LandingAbout />
      <LandingContact />
      <LandingFooter />

      {/* Avatar flottant Speetch — bottom-right, ouvre le chatbot
          concierge pour mise en relation visiteur ↔ studio.
          (La NavConstellation est désormais dans le root layout.) */}
      <ContactAvatar />
    </main>
  );
}
