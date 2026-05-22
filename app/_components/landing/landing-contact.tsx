import { ScrollReveal } from "./scroll-reveal";

const CONTACT_EMAIL = "hello@speetch.com";

export function LandingContact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative w-full overflow-hidden border-t border-cyan-200/10 px-6 py-32 md:px-12 md:py-56"
    >
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-25"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-start gap-16 md:gap-20">
        <ScrollReveal>
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            04 · Contact
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            id="contact-title"
            className="font-sans font-extralight leading-[0.88] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 9vw, 8rem)" }}
          >
            Travaillons{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              ensemble
            </span>
            .
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="max-w-2xl font-serif text-lg italic leading-relaxed text-white/65 md:text-xl">
            Brief, prototype, refonte, plateforme sur-mesure — un mail suffit
            pour démarrer la conversation. Premier appel sous 48h.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3} className="w-full">
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Brief%20Speetch`}
            aria-label={`Écrire à ${CONTACT_EMAIL}`}
            className="group inline-flex w-full flex-col gap-4 border-y border-cyan-200/20 py-10 transition-colors duration-500 hover:border-cyan-200/55 md:py-16"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55 transition-colors group-hover:text-cyan-100/85">
              ↗ Envoyer un brief
            </span>
            <span
              className="font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7] transition-colors duration-500 group-hover:text-cyan-100"
              style={{
                fontSize: "clamp(2rem, 7vw, 5.5rem)",
                textShadow:
                  "0 0 18px rgba(125, 211, 252, 0.18), 0 0 48px rgba(125, 211, 252, 0.08)",
              }}
            >
              {CONTACT_EMAIL}
            </span>
          </a>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <p className="max-w-xl text-[11px] uppercase tracking-[0.32em] text-cyan-200/45">
            Disponibilité actuelle ·{" "}
            <span className="text-cyan-200/85">
              Prises de brief Q2 / Q3 2026
            </span>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
