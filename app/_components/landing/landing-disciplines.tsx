import { ScrollReveal } from "./scroll-reveal";
import { DisciplineGlyph } from "./discipline-glyph";

/**
 * Section Disciplines — la grille des 4 domaines satellites de Speetch,
 * augmentés par une couche IA transverse (cf. <LandingHero> orbe central).
 *
 * Chaque carte cible un type de client avec son besoin actuel : founders,
 * équipes produit, brand managers, CMO/growth. Les outils IA mentionnés
 * (Midjourney, Sora, MCP, GEO, Claude Code) ancrent le discours dans
 * la stack IA-native 2026, en miroir des skills définis dans
 * lib/domains.ts (source de vérité unique avec la constellation hero).
 */

const DISCIPLINES = [
  {
    num: "01",
    title: "Marque",
    tagline: "Identité, voix, storytelling",
    audience: "Founders qui partent de zéro · marques en refonte",
    description:
      "Logo, identité, typographie, voix de marque humaine ET IA. On code la voix de marque pour qu'elle survive dans Claude, ChatGPT, Perplexity — pas juste sur votre site. Pour ceux qui partent de zéro comme pour ceux qui refondent en gardant leur âme.",
  },
  {
    num: "02",
    title: "Produit",
    tagline: "UX, design system, plateformes Next + Supabase",
    audience: "Heads of product · équipes en build",
    description:
      "Conception et build de plateformes typées, performantes, accessibles. Stack Next.js, TypeScript, Supabase, design tokens. Code décuplé par Claude Code et Cursor, serveurs MCP custom pour exposer vos données aux LLMs. Pour les équipes qui veulent shipper vite et bien.",
  },
  {
    num: "03",
    title: "Contenu",
    tagline: "Création visuelle, éditoriale, motion, social",
    audience: "Brand teams · directions content · marques scale",
    description:
      "Production à l'échelle (Midjourney v7, Sora 2, Cartesia, ElevenLabs Realtime) augmentée par production humaine. Image-to-image pour la cohérence personnage, voix temps réel, copy multi-canal. Pour les équipes qui nourrissent tous leurs canaux sans diluer la voix.",
  },
  {
    num: "04",
    title: "Croissance",
    tagline: "Distribution, RP, SEO/GEO, analytics, lancement",
    audience: "CMO · heads of growth · directions communication",
    description:
      "Lancement multicanal, GEO (optimisation pour ChatGPT, Claude, Perplexity — le nouveau SEO), A/B tests, analytics privacy-first, monitoring perf. Pour les CMO qui veulent être cités par les LLMs autant que par Google.",
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
            Quatre disciplines,{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              augmentées par l&apos;IA
            </span>
            .
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.13}>
          <p className="max-w-3xl font-serif text-lg italic leading-relaxed text-white/60 md:text-xl">
            Marque, Produit, Contenu, Croissance — irriguées par une
            couche IA transverse (agents, MCP, GEO, brand voice, modèles
            arbitrés). Chaque livrable embarque l&apos;intelligence comme
            stack quotidienne, pas comme démo.
          </p>
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
                <div className="flex items-start justify-between gap-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
                    {d.num} / 04
                  </span>
                  <DisciplineGlyph
                    variant={Number(d.num) as 1 | 2 | 3 | 4}
                  />
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

                {/* Type de client ciblé — eyebrow discret pour aider le
                    visiteur à se reconnaître au premier coup d'œil. */}
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-200/65">
                  Pour : {d.audience}
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
