import { ScrollReveal } from "./scroll-reveal";

/**
 * Section Approche / Manifeste — pose la thèse de Speetch.
 * Server component (statique), enveloppé dans ScrollReveal pour le fade-in.
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

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
          <ScrollReveal delay={0.15} className="flex flex-col gap-5">
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
              Au brief
            </span>
            <p className="font-serif text-lg italic leading-relaxed text-white/75">
              Comprendre la marque, ses tensions, ses non-dits. L&apos;IA aide
              à structurer la matière brute, jamais à inventer.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.25} className="flex flex-col gap-5">
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
              À la conception
            </span>
            <p className="font-serif text-lg italic leading-relaxed text-white/75">
              Le geste créatif reste humain. Mais l&apos;IA accélère
              l&apos;exploration des pistes, casse les angles morts, propose
              ce qu&apos;on n&apos;aurait pas vu.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.35} className="flex flex-col gap-5">
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
              À l&apos;exécution
            </span>
            <p className="font-serif text-lg italic leading-relaxed text-white/75">
              Code, design système, produit fini. L&apos;IA est intégrée dans
              les livrables — pas comme gadget, comme partenaire de travail
              au quotidien.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
