import type { Metadata } from "next";
import { LandingHero } from "./_components/landing/landing-hero";
import { LandingApproach } from "./_components/landing/landing-approach";
import { LandingDisciplines } from "./_components/landing/landing-disciplines";
import { LandingAbout } from "./_components/landing/landing-about";
import { LandingContact } from "./_components/landing/landing-contact";
import { LandingFooter } from "./_components/landing/landing-footer";

const SITE_URL = "https://speetch.com";
const SITE_TITLE = "Speetch — Direction artistique à l'ère de l'IA · Paris";
const SITE_DESCRIPTION =
  "Studio de communication parisien. Direction artistique, marques, expériences numériques et outils sur-mesure pensés avec l'IA comme partenaire créatif.";

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
    "studio direction artistique IA",
    "design produit IA",
    "studio AI Paris",
    "branding IA",
    "Next.js studio",
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
    "Studio de communication parisien à l'ère de l'IA. Direction artistique, marques, produits digitaux et outils sur-mesure.",
  email: "hello@speetch.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Paris",
    addressCountry: "FR",
  },
  areaServed: { "@type": "Country", name: "France" },
  knowsAbout: [
    "Direction artistique",
    "Identité de marque",
    "Intelligence artificielle",
    "Design produit",
    "Plateformes numériques",
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
      <LandingAbout />
      <LandingContact />
      <LandingFooter />
    </main>
  );
}
