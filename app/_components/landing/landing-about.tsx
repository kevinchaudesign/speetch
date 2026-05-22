import { ScrollReveal } from "./scroll-reveal";

const STATS = [
  { value: "25", label: "ans d'expérience cumulée" },
  { value: "2026", label: "année de fondation" },
  { value: "01", label: "studio · Paris" },
  { value: "IA", label: "à chaque étape" },
];

export function LandingAbout() {
  return (
    <section
      id="a-propos"
      aria-labelledby="about-title"
      className="relative w-full overflow-hidden border-t border-cyan-200/10 px-6 py-32 md:px-12 md:py-48"
    >
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10 opacity-50"
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-16 md:gap-24">
        <ScrollReveal>
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            03 · À propos
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-5 md:gap-16">
          <ScrollReveal delay={0.1} className="md:col-span-3">
            <h2
              id="about-title"
              className="font-sans font-extralight leading-[0.92] tracking-[-0.04em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}
            >
              Un studio basé à{" "}
              <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
                Paris
              </span>
              , fondé par un duo DA-développeur.
            </h2>
          </ScrollReveal>

          <ScrollReveal
            delay={0.25}
            className="flex flex-col gap-6 md:col-span-2 md:pt-4"
          >
            <p className="font-serif text-lg italic leading-relaxed text-white/75">
              Vingt-cinq ans d&apos;expérience cumulée en direction artistique
              et ingénierie, dorénavant augmentés par l&apos;IA dans chaque
              décision. Speetch n&apos;est pas une agence qui fait du
              «&nbsp;numérique&nbsp;», c&apos;est un studio qui pense
              «&nbsp;numérique&nbsp;» par défaut.
            </p>
            <p className="text-[14px] leading-relaxed text-white/55">
              Du brief à la livraison, l&apos;IA est dans la boucle. Mais le
              jugement final, le geste, le ton — restent humains.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.35}>
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-cyan-200/[0.08] md:grid-cols-4">
            {STATS.map((s) => (
              <li
                key={s.label}
                className="flex flex-col gap-3 bg-black p-6 md:p-10"
              >
                <span
                  className="font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]"
                  style={{
                    fontSize: "clamp(2rem, 5vw, 4rem)",
                    textShadow:
                      "0 0 12px rgba(125, 211, 252, 0.18), 0 0 32px rgba(125, 211, 252, 0.08)",
                  }}
                >
                  {s.value}
                </span>
                <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/55">
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  );
}
