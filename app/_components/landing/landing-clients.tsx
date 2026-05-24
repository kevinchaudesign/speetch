import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

/**
 * Section Clients — mur de logos SVG des marques accompagnées.
 *
 * Server component async : charge à build/render le manifest
 * /public/brands/_manifest.json + chaque SVG individuel pour les
 * inliner dans la grille. Même source que la page complète
 * `/clients`, mais adapté en section embarquée (grid compact + CTA
 * vers la page détail).
 *
 * SVGs inlinés via dangerouslySetInnerHTML pour bénéficier de la
 * cascade CSS (currentColor pour le hover, sizing via [&>svg]).
 */

type Brand = { name: string; slug: string };

async function loadBrands(): Promise<Array<Brand & { svg: string }>> {
  const dir = path.join(process.cwd(), "public", "brands");
  const manifest: Brand[] = JSON.parse(
    await fs.readFile(path.join(dir, "_manifest.json"), "utf-8"),
  );
  return Promise.all(
    manifest.map(async (b) => ({
      ...b,
      svg: await fs.readFile(path.join(dir, `${b.slug}.svg`), "utf-8"),
    })),
  );
}

export async function LandingClients() {
  const brands = await loadBrands();

  return (
    <section
      id="clients"
      aria-labelledby="clients-title"
      className="relative w-full overflow-hidden border-t border-cyan-200/10 px-6 py-32 md:px-12 md:py-48"
    >
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10 opacity-50"
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-16 md:gap-24">
        <ScrollReveal>
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            03 · Clients
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
          <ScrollReveal delay={0.1} className="md:col-span-2">
            <h2
              id="clients-title"
              className="font-sans font-extralight leading-[0.92] tracking-[-0.04em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2.25rem, 7vw, 6rem)" }}
            >
              Vingt-cinq ans,{" "}
              <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
                {brands.length} marques
              </span>
              .
            </h2>
          </ScrollReveal>

          <ScrollReveal
            delay={0.2}
            className="flex flex-col gap-4 md:col-span-1 md:pt-4"
          >
            <p className="font-serif text-lg italic leading-relaxed text-white/65">
              Directions artistiques cumulées aux côtés de la presse, du
              luxe, de la grande distribution, du service public et des
              médias. Voici la sélection.
            </p>
          </ScrollReveal>
        </div>

        {/* Nuage de logos universel : 2 marquees infinies qui défilent
            en sens opposés sur tous les viewports. Mask gradient sur
            les bords pour un fade-in/out propre. Tailles des chips
            adaptées au breakpoint via Tailwind responsive. */}
        <ScrollReveal delay={0.15}>
          <BrandsMarquee
            brands={brands.slice(0, Math.ceil(brands.length / 2))}
            direction="left"
          />
          <BrandsMarquee
            brands={brands.slice(Math.ceil(brands.length / 2))}
            direction="right"
          />
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <Link
            href="/clients"
            className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/85 transition-colors duration-300 hover:text-cyan-100"
          >
            <span>Voir la sélection complète</span>
            <span className="inline-block h-px w-8 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-16 group-hover:bg-cyan-100" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────
 * <BrandsMarquee> — rangée de logos qui défile en boucle infinie.
 * Pour un loop sans saut, on duplique la liste : translateX 0 → -50%
 * équivaut exactement à un demi-tour, le contenu est identique des
 * deux côtés. Mask gradient sur les bords pour le fade-in/out propre.
 * Pause au prefers-reduced-motion.
 * ────────────────────────────────────────────────────────────────── */
function BrandsMarquee({
  brands,
  direction,
}: {
  brands: Array<{ name: string; slug: string; svg: string }>;
  direction: "left" | "right";
}) {
  const animationClass =
    direction === "left" ? "speetch-marquee-left" : "speetch-marquee-right";
  return (
    <div
      className="speetch-brand-marquee relative w-full overflow-hidden py-3"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div
        className={`${animationClass} flex w-max items-center gap-3`}
        aria-hidden
      >
        {/* Liste dupliquée pour un loop sans saut visible */}
        {[...brands, ...brands].map((b, i) => (
          <div
            key={`${b.slug}-${i}`}
            title={b.name}
            className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg border border-cyan-200/15 bg-cyan-200/[0.02] px-4 text-white/55 md:h-20 md:w-36 md:px-5 lg:h-24 lg:w-44 lg:px-6 [&>svg]:h-auto [&>svg]:w-auto [&>svg]:max-h-[55%] [&>svg]:max-w-[80%]"
            dangerouslySetInnerHTML={{ __html: b.svg }}
          />
        ))}
      </div>

      <style>{`
        @keyframes speetch-marquee-left  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes speetch-marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .speetch-brand-marquee .speetch-marquee-left  { animation: speetch-marquee-left  60s linear infinite; }
        .speetch-brand-marquee .speetch-marquee-right { animation: speetch-marquee-right 60s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .speetch-brand-marquee .speetch-marquee-left,
          .speetch-brand-marquee .speetch-marquee-right {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
