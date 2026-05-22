import { ScrollReveal } from "./scroll-reveal";

const DISCIPLINES = [
  {
    num: "01",
    title: "Direction artistique",
    tagline: "DA augmentée par l'IA",
    description:
      "Du moodboard au layout final. Recherche visuelle, identité, exécution print et digitale. L'IA accélère, l'œil tranche.",
  },
  {
    num: "02",
    title: "Identité de marque",
    tagline: "Naming, logo, charte, ton de voix",
    description:
      "Construction de marques distinctives — du concept au système graphique vivant. Avec une touche d'IA dans la phase d'exploration créative.",
  },
  {
    num: "03",
    title: "Produits digitaux",
    tagline: "Sites, apps, prototypes",
    description:
      "Stack moderne (Next.js, TypeScript, Supabase) et IA intégrée aux interfaces — agents, copilotes, génération assistée. Conçu pour scaler.",
  },
  {
    num: "04",
    title: "Outils sur-mesure",
    tagline: "Back-offices, dashboards, internal tools",
    description:
      "Plateformes admin où l'équipe gère son contenu, ses clients, ses livrables — avec un assistant IA contextuel qui comprend la donnée.",
  },
];

export function LandingDisciplines() {
  return (
    <section
      id="disciplines"
      aria-labelledby="disciplines-title"
      className="relative w-full overflow-hidden border-t border-cyan-200/10 px-6 py-32 md:px-12 md:py-48"
    >
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-30"
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-16 md:gap-24">
        <ScrollReveal>
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            02 · Disciplines
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            id="disciplines-title"
            className="max-w-4xl font-sans font-extralight leading-[0.92] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 7vw, 6rem)" }}
          >
            Quatre terrains,{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              une méthode
            </span>
            .
          </h2>
        </ScrollReveal>

        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-cyan-200/[0.1] md:grid-cols-2">
          {DISCIPLINES.map((d, i) => (
            <ScrollReveal
              key={d.num}
              as="article"
              delay={0.05 + i * 0.08}
              className="bg-black"
            >
              <div className="flex h-full flex-col gap-6 p-8 transition-colors duration-500 ease-out hover:bg-cyan-200/[0.04] md:p-12">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
                    {d.num} / 04
                  </span>
                  <span className="inline-block h-px w-12 bg-cyan-200/30" />
                </div>

                <h3
                  className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7]"
                  style={{ fontSize: "clamp(1.75rem, 3vw, 2.75rem)" }}
                >
                  {d.title}
                </h3>

                <p className="font-serif text-base italic text-cyan-200/80">
                  {d.tagline}
                </p>

                <p className="text-[14px] leading-relaxed text-white/65">
                  {d.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
