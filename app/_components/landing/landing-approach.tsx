import { ScrollReveal } from "./scroll-reveal";
import { WorkflowFlow } from "./workflow-flow";

/**
 * Section Approche / Manifeste — pose la thèse de Speetch.
 * Server component (statique), enveloppé dans ScrollReveal pour le fade-in.
 *
 * Le discours pivote sur la place de l'IA dans le workflow agence :
 * compagnon de travail au quotidien, pas démo ni gadget. Chaque carte
 * cite les outils concrets utilisés (Claude Code, MCP, Sora, GEO…)
 * pour ancrer le propos dans la stack IA-native de 2026.
 */

export function LandingApproach() {
  return (
    <section
      id="approche"
      aria-labelledby="approche-title"
      className="relative w-full overflow-hidden border-t border-cyan-200/10 px-6 py-32 md:px-12 md:py-48"
    >
      {/* Décor cosmique ténu */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10 opacity-60"
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-16 md:gap-24">
        <ScrollReveal delay={0}>
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            01 · Approche
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            id="approche-title"
            className="max-w-5xl font-sans font-extralight leading-[0.92] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 7vw, 6rem)" }}
          >
            L&apos;IA n&apos;est pas un raccourci.{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              C&apos;est un collaborateur.
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.12}>
          <p className="max-w-3xl font-serif text-lg italic leading-relaxed text-white/60 md:text-xl">
            Speetch outille chaque étape du flux agence — du brief au
            lancement — par une couche IA pensée comme un partenaire de
            travail. Pas un outil de démo, une stack quotidienne.
          </p>
        </ScrollReveal>

        {/* Flow horizontale visible sur md+ : ligne dashed + 3 nœuds +
            particule qui glisse → suggère le passage de Brief à
            Exécution comme un pipeline. */}
        <ScrollReveal delay={0.14}>
          <WorkflowFlow />
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
          <ScrollReveal delay={0.15} className="flex flex-col gap-5">
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
              Au brief
            </span>
            <p className="font-serif text-lg italic leading-relaxed text-white/75">
              Comprendre la marque, ses tensions, ses non-dits. L&apos;IA
              structure la matière brute — entretiens, audits, audiences —
              sans jamais inventer à la place de l&apos;humain.
            </p>
            <p className="text-[13px] leading-relaxed text-white/45">
              Agents de recherche, RAG sur vos archives, brand voice IA
              codifiée dès la phase de cadrage.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.25} className="flex flex-col gap-5">
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
              À la création
            </span>
            <p className="font-serif text-lg italic leading-relaxed text-white/75">
              Identité, design, contenu. L&apos;IA explore plus vite, casse
              les angles morts, propose ce qu&apos;on n&apos;aurait pas vu.
              Le geste créatif reste humain, l&apos;œil DA tranche.
            </p>
            <p className="text-[13px] leading-relaxed text-white/45">
              Midjourney v7, Nano Banana, Sora 2, Cartesia, ElevenLabs
              Realtime — orchestrés avec cohérence personnage.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.35} className="flex flex-col gap-5">
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
              À l&apos;exécution
            </span>
            <p className="font-serif text-lg italic leading-relaxed text-white/75">
              Code mergeable, serveurs MCP custom, évaluations en prod,
              GEO pour ChatGPT et Claude. L&apos;IA est intégrée dans les
              livrables — pas comme démo, comme stack de travail au
              quotidien.
            </p>
            <p className="text-[13px] leading-relaxed text-white/45">
              Claude Code, Cursor, MCP, Braintrust / Langfuse pour les
              évals, monitoring temps réel.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
