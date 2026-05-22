import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Field, Kbd, KbdCombo, Snippet } from "@/lib/ds";

export const metadata: Metadata = {
  title: "Codex",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Swatch = {
  name: string;
  hex: string;
  role: string;
};

type TypeSpec = {
  family: string;
  variable: string;
  usage: string;
  weights: string;
  sample: string;
};

const SWATCHES: Swatch[] = [
  { name: "Noir absolu", hex: "#000000", role: "Background principal" },
  { name: "Blanc cassé", hex: "#F5F5F7", role: "Texte principal" },
  { name: "Tech", hex: "#222222", role: "Surfaces secondaires" },
  { name: "Muted", hex: "#6B6B70", role: "Texte tertiaire" },
  {
    name: "Hairline",
    hex: "rgba(245,245,247,0.10)",
    role: "Filets · séparateurs",
  },
];

const DOC_SWATCHES: Swatch[] = [
  { name: "Paper", hex: "#F8F1E0", role: "Fond document éditorial" },
  { name: "Cream", hex: "#F2E6C2", role: "Surface alt." },
  { name: "Bordeaux deep", hex: "#6E0410", role: "Titres / accents" },
  { name: "Bordeaux glow", hex: "#C61428", role: "Highlight" },
  { name: "Or", hex: "#C8A870", role: "Numéros de chapitre" },
  { name: "Ink", hex: "#1A0306", role: "Corps de texte" },
];

const TYPES: TypeSpec[] = [
  {
    family: "Inter",
    variable: "--font-sans",
    usage: "Display monumental + body — interface admin et espaces clients",
    weights: "200 / 300 / 400 / 500 / 600 / 700",
    sample: "Speetch",
  },
  {
    family: "Fraunces",
    variable: "--font-serif",
    usage: "Accents italiques sur titres, citations éditoriales",
    weights: "200–900 (variable) · optical size 9–144",
    sample: "italique",
  },
  {
    family: "Playfair Display",
    variable: "--font-doc-display",
    usage: "Titres mode document éditorial (cf. brief de production)",
    weights: "400 / 500 · italic",
    sample: "Brief",
  },
  {
    family: "Cormorant Garamond",
    variable: "--font-doc-italic",
    usage: "Voix éditoriale dans le mode document — italiques d'emphase",
    weights: "400 / 500 · italic",
    sample: "voix",
  },
];

const EASINGS = [
  {
    name: "out-expo (signature Speetch)",
    value: "cubic-bezier(0.22, 1, 0.36, 1)",
    usage: "Reveal sur scroll, transitions de page",
  },
  {
    name: "in-out-quart",
    value: "cubic-bezier(0.65, 0, 0.35, 1)",
    usage: "Transitions de hover sur interactions denses",
  },
];

const PRINCIPLES = [
  {
    label: "Minimalisme radical",
    body: "Pas de fioritures. Chaque élément a une fonction.",
  },
  {
    label: "Typographie monumentale",
    body: "Display 6–14vw, line-height < 1, letter-spacing -0.04em à -0.05em.",
  },
  {
    label: "Dark mode par défaut",
    body: "Background #000, texte #F5F5F7. Vignette + grain pour l'épaisseur.",
  },
  {
    label: "Micro-interactions soignées",
    body:
      "Hairlines qui s'étendent au hover (w-3 → w-12), transitions 500–1100ms, cursor custom.",
  },
  {
    label: "Grain de film",
    body: "Overlay SVG fractalNoise, opacity 0.08, mix-blend-mode overlay.",
  },
];

export default async function DesignSystemPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/settings/design-system");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field + scanlines + sabre vertical — cohérent thème Conseil Jedi */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-50"
      />
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-16 left-2 top-24 hidden w-[2px] rounded-full md:block"
      />

      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin/settings"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Forge
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Codex
        </span>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-16 pt-20">
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/55">
            <Link
              href="/admin"
              className="transition-colors hover:text-cyan-100"
            >
              Conseil Jedi
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href="/admin/settings"
              className="transition-colors hover:text-cyan-100"
            >
              Forge
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/85">Codex</span>
          </p>

          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            Le{" "}
            <span className="sw-hologram-text font-serif italic font-normal">
              Codex
            </span>
          </h1>

          <p className="max-w-xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            Grammaire visuelle de la Force — palette, typographies, easings,
            principes. Référence FWA Grade attendue sur tous les holocrons
            clients.
          </p>
        </div>

        {/* SOMMAIRE — index navigable */}
        <Summary />



        {/* ╔══ FAMILY: FONDATIONS ══╗ */}
        <section
          id="family-fondations"
          className="flex scroll-mt-24 flex-col gap-4 border-t-2 border-white/15 pt-12"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/35">
            Famille · Fondations
          </span>
          <h2
            className="font-serif font-extralight italic leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Fondations
          </h2>
          <p className="max-w-xl font-serif text-sm italic text-white/45 md:text-base">
            Palette · typographies · easings · principes · breakpoints · brand
          </p>
        </section>
        {/* PALETTE Speetch */}
        <Block
          eyebrow="01 · Palette"
          title="Speetch — Noir absolu"
          intro="Palette principale, utilisée sur tous les écrans Speetch et la majorité des espaces clients."
        >
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-3">
            {SWATCHES.map((s) => (
              <SwatchCard key={s.name} swatch={s} />
            ))}
          </ul>
        </Block>

        {/* PALETTE Document */}
        <Block
          eyebrow="01b · Palette alternative"
          title="Mode document éditorial"
          intro="Pour les pages issues d'un template HTML en mode “document” : papier crème, bordeaux profond, or pour les numéros."
        >
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-3">
            {DOC_SWATCHES.map((s) => (
              <SwatchCard key={s.name} swatch={s} dark />
            ))}
          </ul>
        </Block>

        {/* TYPOGRAPHIES */}
        <Block
          eyebrow="02 · Typographies"
          title="Inter + Fraunces — la dualité Speetch"
          intro="Inter pour les corps et les displays massifs en ExtraLight ; Fraunces / Playfair / Cormorant pour les italiques d'emphase qui adoucissent la rigueur."
        >
          <ul className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            {TYPES.map((t) => (
              <TypeRow key={t.family} type={t} />
            ))}
          </ul>
        </Block>

        {/* EASINGS */}
        <Block
          eyebrow="03 · Mouvement"
          title="Easings + durées"
          intro="Toutes les transitions Speetch passent par ces deux courbes. Durées standards : 400, 600, 800, 1100, 1200 ms."
        >
          <ul className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            {EASINGS.map((e) => (
              <li
                key={e.name}
                className="flex flex-col gap-2 bg-black px-6 py-5 md:flex-row md:items-baseline md:gap-12"
              >
                <span className="min-w-[16ch] text-[11px] uppercase tracking-[0.32em] text-white/70">
                  {e.name}
                </span>
                <span className="font-mono text-xs text-white/55">
                  {e.value}
                </span>
                <span className="font-serif text-sm italic text-white/55 md:ml-auto">
                  {e.usage}
                </span>
              </li>
            ))}
          </ul>
        </Block>

        {/* PRINCIPES */}
        <Block
          eyebrow="04 · Principes"
          title="FWA Grade — minimum requis"
          intro="Si un détail ne respecte pas ces cinq points, c'est qu'il faut y revenir."
        >
          <ol className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            {PRINCIPLES.map((p, i) => (
              <li
                key={p.label}
                className="flex flex-col gap-2 bg-black px-6 py-6 md:flex-row md:gap-12"
              >
                <span className="min-w-[3ch] font-serif text-xl italic text-white/55">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-[18ch] text-[12px] uppercase tracking-[0.32em] text-white/75">
                  {p.label}
                </span>
                <span className="font-serif text-sm italic text-white/55 md:text-base">
                  {p.body}
                </span>
              </li>
            ))}
          </ol>
        </Block>

        {/* BREAKPOINTS */}
        <Block
          eyebrow="24 · Breakpoints scale"
          title="Mobile-first · paliers · clamp fluide"
          intro="Speetch reste sur les défauts Tailwind (640/768/1024/1280/1536) mais n'en utilise vraiment que trois : md (768), lg (1024), xl (1280). La majorité des typos sont fluides via clamp() pour éviter de multiplier les overrides."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <BreakpointRow
              prefix="(base)"
              px="< 640px"
              label="Mobile"
              usage="Layout par défaut. Tout est en grid-cols-1, paddings réduits (px-6 py-10), headers compacts md:hidden."
              freq="Toujours utilisé"
            />
            <BreakpointRow
              prefix="sm:"
              px="640px"
              label="Tablette portrait"
              usage="Quasiment jamais utilisé en pratique — le saut mobile → tablette se fait à md. Réservé aux cas spécifiques."
              freq="Rare"
            />
            <BreakpointRow
              prefix="md:"
              px="768px"
              label="Tablette paysage / desktop minimal"
              usage="Switch principal. Sidebar admin apparaît (md:flex), header mobile disparaît (md:hidden), grids passent en 2 cols, padding desktop (md:px-12 md:py-14)."
              freq="Très fréquent"
              highlight
            />
            <BreakpointRow
              prefix="lg:"
              px="1024px"
              label="Desktop standard"
              usage="3 colonnes (lg:grid-cols-3), chapter grid asymétrique 200px/1fr, paddings monumentaux (lg:py-48)."
              freq="Fréquent"
              highlight
            />
            <BreakpointRow
              prefix="xl:"
              px="1280px"
              label="Wide"
              usage="Index sticky apparaît à gauche (xl:flex), titres hero atteignent leur taille max naturelle. Au-delà : layouts inchangés."
              freq="Sticky chrome"
              highlight
            />
            <BreakpointRow
              prefix="2xl:"
              px="1536px"
              label="Ultra-wide"
              usage="Pas d'usage en pratique. Les max-w-* (max-w-5xl, max-w-2xl) prennent le relais pour ne pas s'éparpiller sur très larges écrans."
              freq="Jamais"
            />
          </div>

          <div className="mt-8 flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Pattern responsive — page padding">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`<div class="px-6 py-10 md:px-16 md:py-14">
  {/* admin / settings */}
</div>

<section class="px-6 py-10 md:px-12 md:py-14">
  {/* public clients pages */}
</section>

<section class="px-6 py-32 md:px-12 md:py-48">
  {/* chapitre FWA monumental */}
</section>`}
              </pre>
              <Snippet>
                {`mobile : px-6 (24px)
desktop admin : md:px-16 (64px)
desktop public : md:px-12 (48px)
FWA chapter : md:py-48 (192px)
y standard : py-10 → md:py-14
y FWA : py-32 → md:py-48`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Visibility — mobile-only vs desktop-only">
              <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
                <span>
                  <span className="text-white/30">{"<header"}</span> class=
                  &quot;flex items-center justify-between{" "}
                  <span className="text-emerald-300/80">md:hidden</span>&quot;
                </span>
                <span>
                  <span className="text-white/30">{"<aside"}</span> class=
                  &quot;hidden{" "}
                  <span className="text-emerald-300/80">md:flex</span>{" "}
                  flex-col gap-3&quot;
                </span>
                <span>
                  <span className="text-white/30">{"<nav"}</span> class=
                  &quot;hidden{" "}
                  <span className="text-emerald-300/80">xl:flex</span> fixed
                  left-6&quot;
                </span>
              </div>
              <Snippet>
                {`md:hidden → visible uniquement mobile
hidden md:flex → visible uniquement desktop
hidden xl:flex → uniquement très large
duplique parfois le contenu (header mobile
vs sidebar desktop) mais évite le JS toggle`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Fluid typography — clamp() préféré aux media queries">
              <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
                <span>H1 hero : <span className="text-emerald-300/80">clamp(2.75rem, 9vw, 7rem)</span></span>
                <span>H1 FWA  : <span className="text-emerald-300/80">clamp(3.5rem, 14vw, 12rem)</span></span>
                <span>H2 chap : <span className="text-emerald-300/80">clamp(2rem, 5vw, 4rem)</span></span>
                <span>Body    : 14-15px static (lisibilité)</span>
                <span>Body+   : <span className="text-emerald-300/80">clamp(1rem, 1.8vw, 1.5rem)</span></span>
              </div>
              <Snippet>
                {`style={{ fontSize: 'clamp(min, fluid, max)' }}
- min = mobile lisible
- fluid = ratio viewport (vw ou %)
- max = cap pour ne pas démesurer
préféré aux media queries pour les titres
car ça interpole entre breakpoints`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Container query — viewport actuel">
              <ViewportPreview />
              <Snippet>
                {`useEffect(() => {
  const onResize = () =>
    setW(window.innerWidth);
  window.addEventListener('resize', onResize);
  onResize();
  return () => window.removeEventListener(...);
}, []);
debug uniquement — pas pour la prod`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Max-width — confinement plutôt que stretch">
              <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
                <span>max-w-md  · 28rem (448px)   — colonne édito étroite</span>
                <span>max-w-lg  · 32rem (512px)   — formulaire</span>
                <span>max-w-2xl · 42rem (672px)   — édito standard</span>
                <span>max-w-3xl · 48rem (768px)   — body article</span>
                <span>max-w-4xl · 56rem (896px)   — admin pages</span>
                <span>max-w-5xl · 64rem (1024px)  — settings / listes</span>
                <span>max-w-7xl · 80rem (1280px)  — landing / public</span>
              </div>
              <Snippet>
                {`mx-auto + max-w-* sur la section principale
préféré aux media queries pour
"arrêter d'élargir au-delà de X"
chaque page choisit son max-w selon
la densité de contenu`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* ICONOGRAPHIE */}
        <Block
          eyebrow="36 · Iconographie"
          title="SVG inline · stroke 1.25 · glyphes natifs"
          intro="Speetch n'utilise pas de librairie d'icônes externe. SVG inline ou caractères Unicode quand l'icône a un équivalent typographique. Règle stricte : viewBox 24×24, stroke='currentColor', strokeWidth='1.25', linecap+linejoin='round'. Pour ne pas charger une dépendance entière pour 12 picto."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Style guide — anatomie d'une icône Speetch">
              <div className="flex w-full max-w-md items-center gap-6">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#F5F5F7]"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.5" y2="16.5" />
                </svg>
                <ul className="flex flex-col gap-1 font-mono text-[10px] text-white/55">
                  <li>viewBox 24×24 (jamais 16, 20 ou 32)</li>
                  <li>fill=&quot;none&quot;</li>
                  <li>stroke=&quot;currentColor&quot;</li>
                  <li>strokeWidth=&quot;1.25&quot;</li>
                  <li>strokeLinecap=&quot;round&quot;</li>
                  <li>strokeLinejoin=&quot;round&quot;</li>
                </ul>
              </div>
              <Snippet>
                {`<svg width="20" height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.25"
  strokeLinecap="round"
  strokeLinejoin="round">
  <path d="..." />
</svg>
les coins arrondis + le 1.25 fin
font la signature douce des icônes`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Navigation — chevrons + arrows">
              <div className="grid w-full max-w-md grid-cols-4 gap-4 text-white/65">
                <IconCell label="chev-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M15 6 L9 12 L15 18" />
                  </svg>
                </IconCell>
                <IconCell label="chev-right">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 6 L15 12 L9 18" />
                  </svg>
                </IconCell>
                <IconCell label="chev-up">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 15 L12 9 L18 15" />
                  </svg>
                </IconCell>
                <IconCell label="chev-down">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M6 9 L12 15 L18 9" />
                  </svg>
                </IconCell>
                <IconCell label="arrow-right">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <polyline points="14 6 20 12 14 18" />
                  </svg>
                </IconCell>
                <IconCell label="arrow-left">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="20" y1="12" x2="4" y2="12" />
                    <polyline points="10 6 4 12 10 18" />
                  </svg>
                </IconCell>
                <IconCell label="ext-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 4 H20 V10" />
                    <line x1="20" y1="4" x2="11" y2="13" />
                    <path d="M19 14 V19 A1 1 0 0 1 18 20 H5 A1 1 0 0 1 4 19 V6 A1 1 0 0 1 5 5 H10" />
                  </svg>
                </IconCell>
                <IconCell label="close ×">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </IconCell>
              </div>
              <Snippet>
                {`chevrons : <path d="M9 6 L15 12 L9 18" />
arrow-right :
  <line x1="4" y1="12" x2="20" y2="12" />
  <polyline points="14 6 20 12 14 18" />
ext-link : carré + flèche diagonale
close : 2 lignes diagonales`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Actions — plus, check, edit, delete">
              <div className="grid w-full max-w-md grid-cols-4 gap-4 text-white/65">
                <IconCell label="plus">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </IconCell>
                <IconCell label="minus">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </IconCell>
                <IconCell label="check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="4 12 10 18 20 6" />
                  </svg>
                </IconCell>
                <IconCell label="edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 4 L20 10 L10 20 L4 20 L4 14 Z" />
                    <line x1="14" y1="4" x2="20" y2="10" />
                  </svg>
                </IconCell>
                <IconCell label="trash">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="4 7 20 7" />
                    <path d="M6 7 V19 A2 2 0 0 0 8 21 H16 A2 2 0 0 0 18 19 V7" />
                    <path d="M9 7 V5 A2 2 0 0 1 11 3 H13 A2 2 0 0 1 15 5 V7" />
                  </svg>
                </IconCell>
                <IconCell label="download">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="12" y1="4" x2="12" y2="16" />
                    <polyline points="6 11 12 17 18 11" />
                    <line x1="4" y1="20" x2="20" y2="20" />
                  </svg>
                </IconCell>
                <IconCell label="upload">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="12" y1="4" x2="12" y2="16" />
                    <polyline points="6 9 12 3 18 9" />
                    <line x1="4" y1="20" x2="20" y2="20" />
                  </svg>
                </IconCell>
                <IconCell label="search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                </IconCell>
              </div>
              <Snippet>
                {`check : <polyline points="4 12 10 18 20 6" />
trash : poubelle 3 parties (couvercle, corps,
  attache)
edit : pencil ferme un carré incliné
plus/minus : 2 / 1 lignes croisées
download/upload : flèche + base
search : circle + line`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Status — alerte, info, validation">
              <div className="grid w-full max-w-md grid-cols-4 gap-4 text-white/65">
                <IconCell label="check-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="8 12 11 15 16 9" />
                  </svg>
                </IconCell>
                <IconCell label="x-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <line x1="8" y1="8" x2="16" y2="16" />
                    <line x1="8" y1="16" x2="16" y2="8" />
                  </svg>
                </IconCell>
                <IconCell label="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 3 L22 20 L2 20 Z" />
                    <line x1="12" y1="10" x2="12" y2="14" />
                    <line x1="12" y1="17" x2="12" y2="17.5" />
                  </svg>
                </IconCell>
                <IconCell label="info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="12" y1="7" x2="12" y2="7.5" />
                  </svg>
                </IconCell>
                <IconCell label="lock">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="5" y="11" width="14" height="10" rx="1" />
                    <path d="M8 11 V7 A4 4 0 0 1 16 7 V11" />
                  </svg>
                </IconCell>
                <IconCell label="unlock">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="5" y="11" width="14" height="10" rx="1" />
                    <path d="M8 11 V7 A4 4 0 0 1 14 4" />
                  </svg>
                </IconCell>
                <IconCell label="eye">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M2 12 C5 7 9 5 12 5 C15 5 19 7 22 12 C19 17 15 19 12 19 C9 19 5 17 2 12 Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </IconCell>
                <IconCell label="eye-off">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M2 12 C5 7 9 5 12 5 C15 5 19 7 22 12 C19 17 15 19 12 19 C9 19 5 17 2 12 Z" />
                    <line x1="4" y1="4" x2="20" y2="20" />
                  </svg>
                </IconCell>
              </div>
              <Snippet>
                {`check-circle : success states
x-circle : error states
alert : triangle + ! pour warning
info : circle + i pour aide contextuelle
lock/unlock : protection contenu
eye/eye-off : visibility toggle`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Contenu — fichier, image, vidéo, lien">
              <div className="grid w-full max-w-md grid-cols-4 gap-4 text-white/65">
                <IconCell label="file">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 3 L20 9 V20 A1 1 0 0 1 19 21 H5 A1 1 0 0 1 4 20 V4 A1 1 0 0 1 5 3 Z" />
                    <polyline points="14 3 14 9 20 9" />
                  </svg>
                </IconCell>
                <IconCell label="image">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="1" />
                    <circle cx="9" cy="9" r="1.5" />
                    <polyline points="3 18 9 12 15 18 21 12" />
                  </svg>
                </IconCell>
                <IconCell label="video">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="6" width="14" height="12" rx="1" />
                    <polygon points="17 9 22 6 22 18 17 15" fill="currentColor" stroke="none" />
                  </svg>
                </IconCell>
                <IconCell label="folder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 6 A1 1 0 0 1 4 5 H9 L11 7 H20 A1 1 0 0 1 21 8 V18 A1 1 0 0 1 20 19 H4 A1 1 0 0 1 3 18 Z" />
                  </svg>
                </IconCell>
                <IconCell label="link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M10 14 A5 5 0 0 1 10 7 L13 4 A5 5 0 0 1 20 11 L18.5 12.5" />
                    <path d="M14 10 A5 5 0 0 1 14 17 L11 20 A5 5 0 0 1 4 13 L5.5 11.5" />
                  </svg>
                </IconCell>
                <IconCell label="globe">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <path d="M12 3 C15 7 15 17 12 21 C9 17 9 7 12 3 Z" />
                  </svg>
                </IconCell>
                <IconCell label="user">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21 C4 16 8 14 12 14 C16 14 20 16 20 21" />
                  </svg>
                </IconCell>
                <IconCell label="settings">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15 A1 1 0 0 0 20 14.1 L21.5 13 A0.5 0.5 0 0 0 21.5 12 A8.5 8.5 0 0 0 21 10 A0.5 0.5 0 0 0 20.5 9.5 L18.5 9 A1 1 0 0 0 18 8 L18.5 6 A0.5 0.5 0 0 0 18 5.5 L16.5 4.5 A0.5 0.5 0 0 0 16 4.5 L14.5 6 A1 1 0 0 0 13.5 6 L13 4 A0.5 0.5 0 0 0 12.5 3.5 L11.5 3.5 A0.5 0.5 0 0 0 11 4 L10.5 6 A1 1 0 0 0 9.5 6 L8 4.5 A0.5 0.5 0 0 0 7.5 4.5 L6 5.5 A0.5 0.5 0 0 0 6 6 L6.5 8 A1 1 0 0 0 6 9 L4 9.5 A0.5 0.5 0 0 0 3.5 10 A8.5 8.5 0 0 0 3 12 A0.5 0.5 0 0 0 3.5 12.5 L5 14.1 A1 1 0 0 0 5 15 L4.5 17 A0.5 0.5 0 0 0 5 17.5 L6.5 18.5 A0.5 0.5 0 0 0 7 18.5 L9 17 A1 1 0 0 0 10 17.5 L10.5 19.5 A0.5 0.5 0 0 0 11 20 L13 20 A0.5 0.5 0 0 0 13.5 19.5 L14 17.5 A1 1 0 0 0 15 17 L17 18.5 A0.5 0.5 0 0 0 17.5 18.5 L18.5 17.5 A0.5 0.5 0 0 0 19 17 Z" />
                  </svg>
                </IconCell>
              </div>
              <Snippet>
                {`file : carré avec coin replié
image : cadre + sun + montagnes
video : screen + triangle play extérieur
folder : trapèze classique
link : 2 chaînes croisées
globe : sphere + méridien + équateur
user : tête + buste
settings : crénelures circulaires`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Glyphes Unicode — préférés quand un caractère existe">
              <div className="grid w-full max-w-md grid-cols-1 gap-2 font-mono text-[11px] text-white/55">
                {[
                  { g: "·", u: "U+00B7", usage: "Séparateur inline (Paris · 2026)" },
                  { g: "→", u: "U+2192", usage: "Breadcrumb, chemin de lecture" },
                  { g: "←", u: "U+2190", usage: "Retour, navigation arrière" },
                  { g: "↑ ↓", u: "U+2191 / 93", usage: "Réordonner, tri" },
                  { g: "↵", u: "U+21B5", usage: "Submit, valider une combobox" },
                  { g: "⌘", u: "U+2318", usage: "Touche Cmd (macOS / cross-plat)" },
                  { g: "⇧", u: "U+21E7", usage: "Touche Shift" },
                  { g: "⌥", u: "U+2325", usage: "Touche Option / Alt" },
                  { g: "⌃", u: "U+2303", usage: "Touche Control" },
                  { g: "⋯", u: "U+22EF", usage: "Menu 3-dot horizontal" },
                  { g: "×", u: "U+00D7", usage: "Fermer / supprimer chip" },
                  { g: "✓", u: "U+2713", usage: "Confirmation rapide" },
                  { g: "❦", u: "U+2766", usage: "Floral séparateur (mode document)" },
                  { g: "●", u: "U+25CF", usage: "Bullet marquee" },
                  { g: "+ −", u: "U+002B / U+2212", usage: "Plus / vrai minus typographique" },
                ].map((row) => (
                  <span key={row.u} className="flex items-baseline gap-4">
                    <span className="inline-flex min-w-[3ch] justify-center text-lg text-[#F5F5F7]">
                      {row.g}
                    </span>
                    <span className="min-w-[12ch] text-white/40">
                      {row.u}
                    </span>
                    <span className="flex-1 text-white/65">{row.usage}</span>
                  </span>
                ))}
              </div>
              <Snippet>
                {`règle : un caractère Unicode existe ?
  → préférer le glyphe au SVG
  (· → ⌘ ↵ ⋯ × ❦ ●)
plus léger, copy-pasteable, accessible
+ s'adapte à la police active (italique etc.)
SVG réservé aux icônes complexes`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tailles canoniques — du body au monumental">
              <div className="flex w-full max-w-md items-center gap-6 text-white/65">
                <span className="flex flex-col items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <span className="font-mono text-[9px] text-white/35">12</span>
                </span>
                <span className="flex flex-col items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <span className="font-mono text-[9px] text-white/35">16</span>
                </span>
                <span className="flex flex-col items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <span className="font-mono text-[9px] text-white/35">20</span>
                </span>
                <span className="flex flex-col items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <span className="font-mono text-[9px] text-white/35">24</span>
                </span>
                <span className="flex flex-col items-center gap-2">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <span className="font-mono text-[9px] text-white/35">32</span>
                </span>
              </div>
              <Snippet>
                {`12px : inline avec texte 10-12px
16px : inline avec body 14-16px
20px : suffixe d'input search
24px : par défaut pour boutons
32px : illustrative dans card / hero
viewBox reste 24×24 — width/height
contrôle la taille rendue`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Couleur — hérite via currentColor">
              <div className="flex w-full max-w-md flex-col gap-4">
                <div className="flex items-center gap-6">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-white/30" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-white/45" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-white/65" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-[#F5F5F7]" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-300" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className="text-red-300/80" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                </div>
                <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                  white/30 · white/45 · white/65 · white · emerald · red
                </span>
              </div>
              <Snippet>
                {`<svg stroke="currentColor"
  class="text-white/45"> ...
le SVG hérite via currentColor
+ tailwind text-* contrôle la couleur
+ opacités graduelles 30/45/65/100
+ semantic : emerald-300 / red-300
jamais de fill ou stroke hardcodé`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Aria & accessibilité">
              <div className="flex w-full max-w-md flex-col gap-4 font-mono text-[10px] text-white/55">
                <span>
                  icône <em className="text-white/85">décorative</em> →{" "}
                  <span className="text-emerald-300/80">aria-hidden</span>
                </span>
                <span>
                  icône <em className="text-white/85">seule</em> avec sens →{" "}
                  <span className="text-emerald-300/80">aria-label=&quot;Fermer&quot;</span>
                </span>
                <span>
                  icône <em className="text-white/85">+ texte</em> → décorative,{" "}
                  <span className="text-emerald-300/80">aria-hidden</span>
                </span>
              </div>
              <Snippet>
                {`<button aria-label="Fermer">
  <svg aria-hidden>...</svg>
</button>
<button>
  <svg aria-hidden>...</svg>
  <span>Annuler</span>
</button>
règle : si l'icône duplique un label texte
visible → toujours aria-hidden
si seule → aria-label requis sur le parent`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* TYPOGRAPHY HIERARCHY */}
        <Block
          eyebrow="37 · Typography hierarchy"
          title="Échelle consolidée · clamp · usage"
          intro="Six paliers de display + trois corps + deux paliers techniques. Tous les titres en font-extralight tracking serré, avec dernier mot Fraunces italique pour adoucir. Les sizes fluides via clamp() évitent de multiplier les media queries — un seul style fait le mobile + le desktop."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <TypeLevelRow
              tier="Hero FWA"
              cssSize="clamp(3.5rem, 14vw, 12rem)"
              pxRange="56 → 192 px"
              tracking="-0.05em"
              leading="0.82"
              weight="200"
              sample="Brief"
              accent="de production."
              previewSize="clamp(2rem, 6vw, 3.5rem)"
              usage="Hero d'une page monumentale (FwaPageView, landing). Inter ExtraLight + accent Fraunces italique sur dernier mot."
            />
            <TypeLevelRow
              tier="Hero standard"
              cssSize="clamp(2.75rem, 9vw, 7rem)"
              pxRange="44 → 112 px"
              tracking="-0.05em"
              leading="0.86"
              weight="200"
              sample="Speetch"
              accent=""
              previewSize="clamp(1.75rem, 5vw, 3rem)"
              usage="Hero d'une page publique standard (/clients/[slug]). Inter ExtraLight, tracking serré."
            />
            <TypeLevelRow
              tier="Display 1 (admin landing)"
              cssSize="clamp(2.5rem, 8vw, 6rem)"
              pxRange="40 → 96 px"
              tracking="-0.05em"
              leading="0.85"
              weight="200"
              sample="Bienvenue,"
              accent="speetch"
              previewSize="clamp(1.5rem, 4vw, 2.5rem)"
              usage="Page d'accueil admin / dashboard. Plus calme qu'un hero, suffit pour ancrer."
            />
            <TypeLevelRow
              tier="Display 2 (chapter / settings)"
              cssSize="clamp(2.25rem, 6vw, 4.5rem)"
              pxRange="36 → 72 px"
              tracking="-0.04em"
              leading="0.85"
              weight="200"
              sample="Mon"
              accent="profil"
              previewSize="clamp(1.5rem, 3.5vw, 2.25rem)"
              usage="Chapitre FWA (chapter-title), titre de sous-page admin, formulaire principal."
            />
            <TypeLevelRow
              tier="H2 section"
              cssSize="clamp(1.5rem, 3vw, 2.25rem)"
              pxRange="24 → 36 px"
              tracking="-0.04em"
              leading="0.95"
              weight="200"
              sample="Brief visuel par"
              accent="direction."
              previewSize="clamp(1.25rem, 2.4vw, 1.75rem)"
              usage="Titre de bloc dans le design system (Block.title), section dans une page publique, modale."
            />
            <TypeLevelRow
              tier="H3 subsection"
              cssSize="clamp(1.25rem, 2vw, 1.625rem)"
              pxRange="20 → 26 px"
              tracking="-0.025em"
              leading="1.15"
              weight="200"
              sample="Test 01 · Phase notoriété"
              accent=""
              previewSize="clamp(1rem, 1.8vw, 1.25rem)"
              usage="Sous-titre de carte (ab-card, audience-card). Inter ExtraLight."
            />
            <TypeLevelRow
              tier="Body+ (intro / pitch)"
              cssSize="clamp(1.125rem, 1.8vw, 1.5rem)"
              pxRange="18 → 24 px"
              tracking="0"
              leading="1.4-1.5"
              weight="300 (italic)"
              sample="Speetch — agence parisienne, 25 ans d'expérience."
              accent=""
              previewSize="clamp(1rem, 1.4vw, 1.125rem)"
              usage="Intro de hero (pitch), légende d'image monumentale. Fraunces / Cormorant italique."
            />
            <TypeLevelRow
              tier="Body (corps de texte)"
              cssSize="15-16 px (fixed)"
              pxRange="15 → 16 px"
              tracking="0"
              leading="1.7-1.8"
              weight="300"
              sample="Le tunnel Club Abrazo enchaîne huit étapes…"
              accent=""
              previewSize="15px"
              usage="Paragraphes standards (chapter body, page editor). Inter Light 300, line-height 1.7."
            />
            <TypeLevelRow
              tier="Body small (notes, callouts)"
              cssSize="13-14 px"
              pxRange="13 → 14 px"
              tracking="0"
              leading="1.6-1.65"
              weight="300"
              sample="Plus minimaliste, pour les notes et legends."
              accent=""
              previewSize="13px"
              usage="Hint sous un input, légende d'audience-card, paragraphe condensé."
            />
            <TypeLevelRow
              tier="Caption / eyebrow"
              cssSize="11 px"
              pxRange="11 px (fixed)"
              tracking="0.32em / 0.4em"
              leading="1"
              weight="400"
              sample="Réglages · Design System"
              accent=""
              previewSize="11px"
              usage="Eyebrow de section, label d'input, breadcrumb. UPPERCASE, tracking 0.32em→0.4em."
              uppercase
            />
            <TypeLevelRow
              tier="Footnote / micro"
              cssSize="10 px"
              pxRange="10 px (fixed)"
              tracking="0.32em / 0.4em"
              leading="1"
              weight="400"
              sample="01 / 06 · Direction"
              accent=""
              previewSize="10px"
              usage="Numérotation, séparateur, label dans card hover. UPPERCASE tracking 0.32em+."
              uppercase
            />
            <TypeLevelRow
              tier="Mono technique"
              cssSize="10-11 px"
              pxRange="10 → 11 px"
              tracking="0"
              leading="1.5"
              weight="400"
              sample="/clients/clubabrazo · 050d8f9b"
              accent=""
              previewSize="11px"
              usage="Path, ID, valeurs hex, snippets. Font-mono."
              mono
            />
          </div>

          <div className="mt-8 flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Hauteurs de ligne canoniques">
              <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
                <span>0.82 — hero FWA monumental (très serré)</span>
                <span>0.85 — display 1-2 (titres landing)</span>
                <span>0.95 — h2 (Block title)</span>
                <span>1.0  — caption / eyebrow / footnote</span>
                <span>1.15 — h3 / titres compacts</span>
                <span>1.4-1.5 — body+ italic intro</span>
                <span>1.6-1.7 — body small</span>
                <span>1.7-1.8 — body standard (lecture longue)</span>
              </div>
              <Snippet>
                {`règles :
- plus le titre est gros, plus serré le leading
- en dessous de 1.4 : risque de collision
  entre lignes (ne pas descendre pour body)
- au-dessus de 1.8 : trop espacé,
  perd la cohésion de paragraphe`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Letter-spacing par taille">
              <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
                <span>-0.05em → display monumental (10rem+)</span>
                <span>-0.04em → display 2 (4-6rem)</span>
                <span>-0.03em → h2 (1.5-2.5rem)</span>
                <span>-0.025em → h3 (1.25-1.75rem)</span>
                <span>0 (normal) → body</span>
                <span>0.18em → kbd (uppercase petit)</span>
                <span>0.28em → chip / tag</span>
                <span>0.32em → caption / breadcrumb</span>
                <span>0.36em → footnote micro</span>
                <span>0.40em → eyebrow / topbar / index</span>
              </div>
              <Snippet>
                {`règle :
plus le texte est gros → plus serré (négatif)
plus le texte est petit → plus écarté (positif)
pour les caps : 0.28em min, sinon illisible
le clamp() ne touche pas le tracking,
qui reste cohérent à toutes les viewports`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Font weights utilisés">
              <div className="flex w-full max-w-md flex-col gap-3 text-[#F5F5F7]">
                <span className="font-light text-xl" style={{ fontWeight: 200 }}>
                  200 — display extralight (titres)
                </span>
                <span className="text-base font-light">
                  300 — body light (paragraphes, defaults)
                </span>
                <span className="text-base font-normal">
                  400 — caption, eyebrow, mono
                </span>
                <span className="text-base font-medium">
                  500 — strong, accents, headers de table
                </span>
                <span className="text-base font-semibold">
                  600 — rare, réservé aux KPIs critiques
                </span>
              </div>
              <Snippet>
                {`200 / 300 / 400 / 500 — c'est tout
600+ : à éviter (trop épais
  par rapport à la signature Speetch)
700+ : jamais
Inter loaded weights : 200/300/400/500/600/700
mais seuls les 4 premiers sont utilisés`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Patterns hybrides — Inter + Fraunces">
              <div className="flex w-full max-w-md flex-col gap-4">
                <span className="font-sans text-3xl font-extralight tracking-[-0.04em] text-[#F5F5F7]">
                  Brief de{" "}
                  <em className="font-serif italic font-light text-white/85">
                    production.
                  </em>
                </span>
                <span className="font-sans text-3xl font-extralight tracking-[-0.04em] text-[#F5F5F7]">
                  <em className="font-serif italic font-light text-white/85">
                    Avant
                  </em>{" "}
                  les mots.
                </span>
                <span className="font-sans text-3xl font-extralight tracking-[-0.04em] text-[#F5F5F7]">
                  Speetch{" "}
                  <em className="font-serif italic font-light text-white/55">
                    ×
                  </em>{" "}
                  Club Abrazo
                </span>
              </div>
              <Snippet>
                {`règle : 1 mot en Fraunces italique par titre
positionné selon la lecture :
- en début → ancre poétique
- au milieu → ponctuation rythmique
- en fin → respiration finale (le + courant)
+ couleur white/85 sur l'italique
  (volontairement atténué)`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* FRENCH TYPOGRAPHY */}
        <Block
          eyebrow="38 · French typography"
          title="Règles typographiques françaises"
          intro="Pour un site français FWA Grade, les détails comptent. Espaces insécables avant la double-ponctuation, guillemets « », apostrophes typographiques, tirets cadratins, formats de date et de nombre. Speetch applique ces règles partout — sinon ça sent l'amateur."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Espaces insécables — double-ponctuation">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Mauvais
                  </span>
                  <span className="font-serif text-base italic text-white/55">
                    Vraiment ? Oui : tout à fait ! Magnifique ;
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-emerald-300/80">
                    Correct
                  </span>
                  <span className="font-serif text-base italic text-white/85">
                    Vraiment&#8239;? Oui&#8239;: tout à fait&#8239;! Magnifique&#8239;;
                  </span>
                </div>
              </div>
              <Snippet>
                {`avant : ? ! ; : » → espace fine insécable
caractère U+202F (NARROW NO-BREAK SPACE)
en HTML : &#8239; ou &#x202F;
JSX : {"\\u202F?"} ou via helper
règles AFNOR / Imprimerie nationale
le " : " demande une vraie espace, pas une fine`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Guillemets français — « ... »">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Mauvais
                  </span>
                  <span className="font-serif text-base italic text-white/55">
                    "Brief de production" ou 'campagne intemporelle'
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-emerald-300/80">
                    Correct
                  </span>
                  <span className="font-serif text-base italic text-white/85">
                    «&#8239;Brief de production&#8239;» — toujours avec espaces insécables.
                  </span>
                </div>
              </div>
              <Snippet>
                {`U+00AB « guillemet ouvrant
U+00BB » guillemet fermant
+ espace fine insécable à l'intérieur :
  « \\u202F texte \\u202F »
JAMAIS les guillemets droits "
ni les guillemets anglais "  "
guillemets imbriqués : « ... ' ... » `}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Apostrophe typographique — ' vs '">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Mauvais (apostrophe droite)
                  </span>
                  <span className="font-serif text-base italic text-white/55">
                    L&apos;agence d&apos;Isis travaille à l&apos;abrazo.
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-emerald-300/80">
                    Correct (apostrophe typographique)
                  </span>
                  <span className="font-serif text-base italic text-white/85">
                    L’agence d’Isis travaille à l’abrazo.
                  </span>
                </div>
              </div>
              <Snippet>
                {`U+2019 ’ apostrophe typographique
remplacer systématiquement ' par ’
helper côté JS :
  text.replace(/'/g, '\\u2019')
ou pendant le typing → autocorrect input
les fontes serif rendent vraiment moche
l'apostrophe droite — différence flagrante`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tirets — — vs – vs -">
              <div className="flex w-full max-w-md flex-col gap-2 text-[15px] text-white/75">
                <span>
                  <span className="font-mono text-emerald-300/85">—</span>{" "}
                  (cadratin U+2014) : incise &mdash; <em className="font-serif italic">comme ceci</em> &mdash; ou point de césure.
                </span>
                <span>
                  <span className="font-mono text-emerald-300/85">–</span>{" "}
                  (demi-cadratin U+2013) : plage de valeurs 1995&#8211;2025, 30&#8211;65 ans.
                </span>
                <span>
                  <span className="font-mono text-emerald-300/85">-</span>{" "}
                  (trait d&apos;union U+002D) : mots composés sous-titre, demi-cadratin.
                </span>
                <span>
                  <span className="font-mono text-red-300/85">--</span>{" "}
                  jamais deux tirets — toujours le cadratin direct.
                </span>
              </div>
              <Snippet>
                {`— U+2014 EM DASH (cadratin)
  pour les incises, les coupures éditoriales
  espaces normales autour : « mot — mot »
– U+2013 EN DASH (demi-cadratin)
  pour les plages : "30–65", "1995–2025"
  pas d'espaces autour
- U+002D HYPHEN-MINUS (trait d'union)
  pour les mots composés`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Nombres — séparateur de milliers, unités">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Mauvais
                  </span>
                  <span className="font-mono text-base text-white/55">
                    1,200 € · 5% · 14h30 · 10km · 3.14
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-emerald-300/80">
                    Correct
                  </span>
                  <span className="font-mono text-base text-white/85">
                    1&#8239;200&#8239;€ · 5&#8239;% · 14&#8239;h&#8239;30 · 10&#8239;km · 3,14
                  </span>
                </div>
              </div>
              <Snippet>
                {`séparateur de milliers : espace fine insécable
  1 200, 1 200 000
JAMAIS la virgule (anglo-saxon)
séparateur décimal : virgule
  3,14 (pas 3.14)
unités : espace insécable avant
  10 km, 5 %, 1 200 €
heure : "14 h 30" avec espaces insécables
  ou "14:30" sans (technique)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Points de suspension — … en un seul caractère">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Mauvais
                  </span>
                  <span className="font-serif text-base italic text-white/55">
                    Et ensuite... la suite arrive.
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-emerald-300/80">
                    Correct
                  </span>
                  <span className="font-serif text-base italic text-white/85">
                    Et ensuite… la suite arrive.
                  </span>
                </div>
              </div>
              <Snippet>
                {`U+2026 … HORIZONTAL ELLIPSIS
en HTML : &hellip; ou &#8230;
jamais trois points séparés "..."
en JSX : "…"
crénage uniforme garanti par la fonte`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Capitalisation — minuscule par défaut">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Mauvais (Title Case anglo)
                  </span>
                  <span className="font-serif text-base italic text-white/55">
                    Brief De Production · Campagne Intemporelle
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-emerald-300/80">
                    Correct (français — capitale d&apos;ouverture seule)
                  </span>
                  <span className="font-serif text-base italic text-white/85">
                    Brief de production · Campagne intemporelle
                  </span>
                </div>
              </div>
              <Snippet>
                {`règle française :
seule la première lettre + noms propres
JAMAIS Title Case (style anglo-saxon)
+ majuscules avec accents (À, É, Î)
  pas À sans accent qui devient A
+ MAJ tracking 0.28em+ obligatoire
  pour ne pas écraser les lettres`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Date — formats canoniques">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex flex-col gap-1 text-base text-white/85">
                  <span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                      Long
                    </span>{" "}
                    13 mai 2026
                  </span>
                  <span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                      Court
                    </span>{" "}
                    13 mai
                  </span>
                  <span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                      Avec jour
                    </span>{" "}
                    mercredi 13 mai 2026
                  </span>
                  <span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                      ISO technique
                    </span>{" "}
                    <span className="font-mono">2026-05-13</span>
                  </span>
                </div>
              </div>
              <Snippet>
                {`new Date(...).toLocaleDateString("fr-FR", {
  year: "numeric",
  month: "long",   // "mai"
  day: "numeric",  // "13"
})
PAS de virgule "13 mai, 2026"
PAS Title Case "13 Mai 2026"
mois en minuscule, sans capitale`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pourcentages, ratios, intervalles">
              <div className="flex w-full max-w-md flex-col gap-2 text-[14px] text-white/85">
                <span>5&#8239;% (espace fine insécable avant %)</span>
                <span>5&#8239;–&#8239;10&#8239;% (range avec demi-cadratin)</span>
                <span>2/3 ratio · 1080×1080 dimensions · 16:9 aspect</span>
                <span>1&#8239;200&#8239;€/mois · 159&#8239;€/personne</span>
              </div>
              <Snippet>
                {`règles fines :
%       → espace fine avant
×       → U+00D7 (pas la lettre x)
÷       → U+00F7 (pas /)
:       → ratio "16:9" sans espaces
/       → fractions "2/3" sans espaces
–       → ranges "30–65" sans espaces`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Helper JavaScript — normalize FR">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`function normalizeFr(text: string): string {
  return text
    // Apostrophes droites → typographiques
    .replace(/'/g, '\\u2019')
    // Guillemets droits → français
    .replace(/"([^"]+)"/g, '«\\u202F$1\\u202F»')
    // Espace fine avant : ; ! ? %
    .replace(/\\s?([;!?%])/g, '\\u202F$1')
    .replace(/\\s?:/g, '\\u202F:')
    // Points de suspension
    .replace(/\\.{3,}/g, '\\u2026')
    // Tirets : -- → —
    .replace(/--/g, '\\u2014');
}`}
              </pre>
              <Snippet>
                {`à appliquer côté server (Server Action)
ou côté client (autocorrect dans textarea)
pour les contenus rédigés librement
(briefs, descriptions, intros)
+ remember : un seul passage suffit,
idempotent par construction`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Italique pour mots étrangers">
              <div className="flex w-full max-w-md flex-col gap-2 text-[14px] text-white/85">
                <span>
                  Le <em className="font-serif italic">briefing</em> initial.
                </span>
                <span>
                  Direction <em className="font-serif italic">below-the-line</em>{" "}
                  classique.
                </span>
                <span>
                  Format <em className="font-serif italic">in-stream</em>{" "}
                  vidéo.
                </span>
              </div>
              <Snippet>
                {`mots empruntés ou techniques d'autre langue :
  <em class="font-serif italic">briefing</em>
règle classique de l'imprimerie
+ aide le lecteur à signaler
"ce mot vient d'ailleurs"
préfère Fraunces / Cormorant italique
plus expressif que l'italique sans-serif`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Espaces fines — quand le navigateur les casse">
              <p className="w-full max-w-md text-[12px] text-white/55">
                Certains navigateurs / lignes courtes coupent les espaces fines
                insécables au retour de ligne. Solution : préférer{" "}
                <span className="font-mono text-emerald-300/80">U+00A0</span>{" "}
                (espace insécable classique) au lieu de{" "}
                <span className="font-mono text-amber-300/80">U+202F</span>{" "}
                quand la précision typo n&apos;est pas critique. Réserver la
                fine aux titres / display.
              </p>
              <Snippet>
                {`U+00A0   NO-BREAK SPACE (large)
U+202F   NARROW NO-BREAK SPACE (fine)
les deux : insécables (jamais coupées)
différence : largeur visuelle
- 00A0 = espace normale
- 202F = ~50% d'une espace
en pratique pour le code Speetch :
  display / titres → 202F (fine, plus joli)
  body / lecture → 00A0 (sécurité)`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* LOGO & BRAND */}
        <Block
          eyebrow="39 · Logo & brand"
          title="Wordmark · sceau · lockups · usages"
          intro="Speetch n'a pas de logogramme — uniquement un wordmark typographique. Inter ExtraLight (weight 200), tracking serré, accent serif italique sur la dernière lettre. Le sceau circulaire 'A' sert pour Club Abrazo et autres clients à initiale unique. Cohérence FWA Grade : moins c'est plus."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Wordmark — variantes de taille">
              <div className="flex w-full max-w-md flex-col gap-6 text-[#F5F5F7]">
                <span
                  className="font-sans font-extralight leading-none tracking-[-0.06em]"
                  style={{ fontSize: "4.5rem" }}
                >
                  Speetch
                </span>
                <span
                  className="font-sans font-extralight leading-none tracking-[-0.05em]"
                  style={{ fontSize: "2.25rem" }}
                >
                  Speetch
                </span>
                <span
                  className="font-sans font-extralight leading-none tracking-[-0.04em]"
                  style={{ fontSize: "1.25rem" }}
                >
                  Speetch
                </span>
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">
                  Speetch · Topbar / footer
                </span>
              </div>
              <Snippet>
                {`<span class="font-sans font-extralight
  leading-none tracking-[-0.06em]"
  style={{ fontSize: '4.5rem' }}>
  Speetch
</span>
weight 200 · tracking -0.06em à -0.04em
selon taille (plus gros → plus serré)
toujours leading-none pour ancrer`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Wordmark avec accent — variante éditoriale">
              <div className="flex w-full max-w-md flex-col gap-6 text-[#F5F5F7]">
                <span
                  className="font-sans font-extralight leading-none tracking-[-0.05em]"
                  style={{ fontSize: "3rem" }}
                >
                  Speet
                  <em
                    className="font-serif italic font-light text-white/85"
                    style={{ fontFamily: "var(--font-serif), Fraunces, serif" }}
                  >
                    ch
                  </em>
                </span>
                <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                  Pour les supports éditoriaux (covers, signatures)
                </span>
              </div>
              <Snippet>
                {`variant rare, à utiliser avec parcimonie :
les deux dernières lettres "ch" en
Fraunces italique font respirer
ne pas mélanger avec le wordmark
standard dans le même écran`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Lockup — Speetch × Client">
              <div className="flex w-full max-w-md flex-col gap-6 text-[#F5F5F7]">
                <span
                  className="font-serif italic font-light leading-tight tracking-[-0.04em]"
                  style={{
                    fontSize: "2.5rem",
                    fontFamily: "var(--font-serif), Fraunces, serif",
                  }}
                >
                  Speetch
                  <br />
                  <em className="text-white/65">×</em> Club Abrazo
                </span>
                <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                  Cover de brief · loader · signature de livraison
                </span>
              </div>
              <Snippet>
                {`Fraunces italique pour le lockup
× (U+00D7) en white/65 — pas un x
2 lignes : Speetch / × Client
ou inline : Speetch × Client
réservé aux moments importants
(intro de brief, signature finale)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Sceau — initiale circulaire">
              <div className="flex w-full max-w-md items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-flex h-24 w-24 items-center justify-center rounded-full border border-white/40 font-serif text-4xl italic text-[#F5F5F7]">
                    <em>A</em>
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/35">
                    96 px
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/40 font-serif text-2xl italic text-[#F5F5F7]">
                    <em>A</em>
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/35">
                    64 px
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 font-serif text-base italic text-[#F5F5F7]">
                    <em>A</em>
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/35">
                    40 px
                  </span>
                </div>
              </div>
              <Snippet>
                {`<span class="inline-flex
  h-N w-N rounded-full
  border border-white/40
  items-center justify-center
  font-serif italic text-[#F5F5F7]">
  <em>{initiale}</em>
</span>
règle : taille = w + h identiques
border-white/40 sur fond noir
ou border-white/85 sur fond clair
initiale en Fraunces italic light`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Sceau — variantes d'opacité par contexte">
              <div className="flex w-full max-w-md flex-wrap items-center gap-6">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/85 font-serif text-xl italic text-[#F5F5F7]">
                  <em>A</em>
                </span>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/40 font-serif text-xl italic text-[#F5F5F7]">
                  <em>A</em>
                </span>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 font-serif text-xl italic text-white/65">
                  <em>A</em>
                </span>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F7] font-serif text-xl italic text-black">
                  <em>A</em>
                </span>
              </div>
              <Snippet>
                {`border-white/85 : signature finale (vow)
border-white/40 : footer standard (current)
border-white/15 : variante atténuée
bg-[#F5F5F7] text-black : sceau inverse
choisir selon l'intensité du contexte`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Clear space — zone de protection">
              <div className="relative w-full max-w-md">
                <div
                  className="relative rounded-md border border-white/10 bg-black p-12"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, transparent 49%, rgba(245,245,247,0.04) 49%, rgba(245,245,247,0.04) 51%, transparent 51%)",
                    backgroundSize: "8px 8px",
                  }}
                >
                  <span className="absolute inset-12 border border-dashed border-emerald-300/30" />
                  <span
                    className="block text-center font-sans font-extralight leading-none tracking-[-0.05em] text-[#F5F5F7]"
                    style={{ fontSize: "2.5rem" }}
                  >
                    Speetch
                  </span>
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-[0.32em] text-white/35">
                  Zone protégée = hauteur de la lettre × 0.5 minimum
                </p>
              </div>
              <Snippet>
                {`règle de protection :
laisser au minimum
  hauteur_du_wordmark × 0.5
de vide autour du logo
ne JAMAIS placer un autre élément
(texte, image, bordure forte)
dans cette zone`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tailles minimum — lisibilité">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex items-baseline gap-4">
                  <span
                    className="font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Speetch
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    12 px · minimum favicon / OG
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span
                    className="font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]"
                    style={{ fontSize: "1rem" }}
                  >
                    Speetch
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    16 px · footer / topbar
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span
                    className="font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]"
                    style={{ fontSize: "1.5rem" }}
                  >
                    Speetch
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    24 px · sidebar admin
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span
                    className="font-sans font-extralight leading-none tracking-[-0.05em] text-[#F5F5F7]"
                    style={{ fontSize: "3rem" }}
                  >
                    Speetch
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    48 px+ · hero, splash, signature
                  </span>
                </div>
              </div>
              <Snippet>
                {`12 px = absolu minimum (favicon, signature)
16 px = footer / topbar / nav micro
24 px = sidebar admin, breadcrumb
48 px+ = expressif (hero, splash)
sous 12 px, l'oeil ne distingue plus
les liaisons entre les lettres`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Couleurs autorisées — palette stricte">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-black p-4">
                    <span
                      className="block font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]"
                      style={{ fontSize: "1.5rem" }}
                    >
                      Speetch
                    </span>
                    <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">
                      Blanc / Noir
                    </span>
                  </div>
                  <div className="rounded-md bg-[#F5F5F7] p-4">
                    <span
                      className="block font-sans font-extralight leading-none tracking-[-0.04em] text-black"
                      style={{ fontSize: "1.5rem" }}
                    >
                      Speetch
                    </span>
                    <span className="mt-2 block font-mono text-[9px] uppercase tracking-[0.32em] text-black/40">
                      Noir / Blanc
                    </span>
                  </div>
                </div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">
                  Deux variations uniquement — jamais colorées
                </p>
              </div>
              <Snippet>
                {`couleurs autorisées (strict) :
- #F5F5F7 sur #000000 (defaut Speetch)
- #000000 sur #F5F5F7 (inverse)
JAMAIS sur bordeaux / crème / autre
JAMAIS multicolore / dégradé
JAMAIS sur photo non controllée
si nécessaire : poser le wordmark
sur un overlay noir 0.85 d'abord`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Don't — usages interdits">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex items-center gap-3 rounded-md border border-red-400/20 bg-red-400/[0.04] p-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Non
                  </span>
                  <span
                    className="font-sans font-bold leading-none tracking-normal text-[#F5F5F7]"
                    style={{ fontSize: "1.5rem" }}
                  >
                    Speetch
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-white/40">
                    bold + tracking 0
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-red-400/20 bg-red-400/[0.04] p-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Non
                  </span>
                  <span
                    className="font-sans font-extralight italic leading-none tracking-[-0.05em] text-[#F5F5F7]"
                    style={{ fontSize: "1.5rem" }}
                  >
                    Speetch
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-white/40">
                    italic Inter (mauvais italique)
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-red-400/20 bg-red-400/[0.04] p-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Non
                  </span>
                  <span
                    className="font-sans font-extralight uppercase leading-none tracking-[0.2em] text-[#F5F5F7]"
                    style={{ fontSize: "1rem" }}
                  >
                    Speetch
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-white/40">
                    uppercase
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-red-400/20 bg-red-400/[0.04] p-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Non
                  </span>
                  <span
                    className="font-sans font-extralight leading-none tracking-[-0.04em] text-emerald-300"
                    style={{ fontSize: "1.5rem" }}
                  >
                    Speetch
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-white/40">
                    coloré
                  </span>
                </div>
              </div>
              <Snippet>
                {`interdits absolus :
- font-weight > 300 (jamais bold)
- italique sans-serif (utiliser Fraunces si italique)
- uppercase (Inter ExtraLight uniquement)
- couleurs hors palette
- distorsion (scaleX/Y, skew)
- contour / outline
- ombres marquées
- placement sur fond chargé`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="OG image · Favicon · Apple touch">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="aspect-[1.91/1] w-32 overflow-hidden rounded border border-white/10 bg-black p-3">
                    <span
                      className="block font-sans font-extralight leading-none tracking-[-0.05em] text-[#F5F5F7]"
                      style={{ fontSize: "1.25rem" }}
                    >
                      Speetch
                    </span>
                    <span className="mt-1 block text-[8px] uppercase tracking-[0.32em] text-white/55">
                      Paris · 2026
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white/45">
                    OG · 1200×630
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded border border-white/10 bg-black p-1.5">
                    <span
                      className="block text-center font-sans font-extralight leading-none tracking-[-0.06em] text-[#F5F5F7]"
                      style={{ fontSize: "0.625rem" }}
                    >
                      Speetch
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white/45">
                    Favicon · 32×32
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-black p-2">
                    <span
                      className="block text-center font-sans font-extralight leading-none tracking-[-0.06em] text-[#F5F5F7]"
                      style={{ fontSize: "0.5rem", paddingTop: "0.5rem" }}
                    >
                      Speetch
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-white/45">
                    Apple touch · 180×180
                  </span>
                </div>
              </div>
              <Snippet>
                {`OG image (1200×630) : wordmark + meta
  paddings généreux, fond #000000
Favicon (32×32) : wordmark plein cadre
  ou juste "S" si trop petit
Apple touch (180×180) : wordmark centré
  avec respiration verticale
exporter en SVG pour favicon (scalable)
ICO en fallback IE / vieux navigateurs`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Sceau client — règle d'attribution">
              <div className="flex w-full max-w-md flex-col gap-3">
                <p className="text-[12px] text-white/65">
                  Le sceau circulaire est{" "}
                  <em className="font-serif italic text-white/85">propriété de Speetch</em>{" "}
                  comme dispositif graphique mais l&apos;initiale change selon
                  le client :
                </p>
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/40 font-serif text-lg italic text-[#F5F5F7]">
                    <em>A</em>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Club Abrazo
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/40 font-serif text-lg italic text-[#F5F5F7]">
                    <em>V</em>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Valeosante
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/40 font-serif text-lg italic text-[#F5F5F7]">
                    <em>S</em>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Super Motion
                  </span>
                </div>
              </div>
              <Snippet>
                {`initiale du client (premier mot)
toujours Fraunces italique light
règle : un seul caractère
  - "Club Abrazo" → "A" (du nom propre)
  - "Super Motion" → "S" (premier mot)
  - "Le Bureau" → "B" (substantif, pas l'article)
si nom composé / sigle → discuter cas par cas`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Signature de livraison — pattern footer">
              <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-md border border-white/10 bg-black p-8 text-center">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/40 font-serif text-2xl italic text-[#F5F5F7]">
                  <em>A</em>
                </span>
                <span className="mt-2 text-[11px] uppercase tracking-[0.36em] text-white/45">
                  Club Abrazo · Paris
                </span>
                <span className="font-serif text-sm italic text-white/65">
                  <em>Brief tenu. Reste à le mettre en ondes.</em>
                </span>
              </div>
              <Snippet>
                {`pattern de clôture éditoriale :
1. sceau initiale (h-16 w-16)
2. lockup uppercase 0.36em white/45
   "{client} · Paris"
3. vow italique white/65
   phrase courte signée
toujours center-aligné, paddings y-12+`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Brand voice — règles d'écriture">
              <ul className="flex w-full max-w-md flex-col gap-3 text-[13px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>
                    Phrases courtes. Sujets directs. Pas de marketing-speak.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>
                    Vocabulaire de métier (DA, layout, brief, hairline) sans
                    pédagogie superflue.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>
                    Italiques rares, pour les <em className="font-serif italic">moments éditoriaux</em>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>
                    Pas d&apos;adjectifs gratuits (« exceptionnel », « unique »,
                    « innovant »).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>
                    Pas d&apos;émojis. Pas de point d&apos;exclamation
                    multiples.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>
                    Pas de capitales pour insister (uppercase = tracking 0.32em+ uniquement).
                  </span>
                </li>
              </ul>
              <Snippet>
                {`règles voix Speetch :
- précision > emphase
- noms > adjectifs
- détail concret > généralité
- silence > bavardage
si le texte sonne comme une slideware
agence à 50 personnes → réécrire
si le lecteur a l'impression de comprendre
en moins de 10s par paragraphe → c'est bon`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>


        {/* ╔══ FAMILY: LAYOUT ══╗ */}
        <section
          id="family-layout"
          className="flex scroll-mt-24 flex-col gap-4 border-t-2 border-white/15 pt-12"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/35">
            Famille · Layout
          </span>
          <h2
            className="font-serif font-extralight italic leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Layout
          </h2>
          <p className="max-w-xl font-serif text-sm italic text-white/45 md:text-base">
            Spacing · grilles · image grids · page chrome · footers · templates
          </p>
        </section>
        {/* SPACING */}
        <Block
          eyebrow="11 · Spacing scale"
          title="Rythme vertical · paddings · gaps"
          intro="Speetch utilise un sous-ensemble strict de la spacing scale Tailwind. Quatre paliers se répètent : inline, compact, medium, generous. Les valeurs en dehors trahissent souvent un design mal calé."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <SpacingRow
              tier="Inline · 2 / 3 / 4"
              values={["0.5rem", "0.75rem", "1rem"]}
              usage="Action item + hairline · label + icône · check + texte"
            />
            <SpacingRow
              tier="Compact · 5 / 6 / 8"
              values={["1.25rem", "1.5rem", "2rem"]}
              usage="Champs de formulaire empilés · padding intérieur de card · gap entre cartes"
            />
            <SpacingRow
              tier="Medium · 10 / 12 / 14"
              values={["2.5rem", "3rem", "3.5rem"]}
              usage="Padding de page mobile / desktop · gap entre blocs d'un même écran"
            />
            <SpacingRow
              tier="Generous · 16 / 20 / 24"
              values={["4rem", "5rem", "6rem"]}
              usage="Entre sections majeures d'un écran · padding hero"
            />
            <SpacingRow
              tier="Monumental · 32 / 40 / 48"
              values={["8rem", "10rem", "12rem"]}
              usage="Chapitres FWA Grade · respiration des landings"
            />
          </div>

          <div className="mt-8 flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Page padding — mobile vs desktop">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`px-6 py-10        // mobile
md:px-16 md:py-14 // desktop
section.chapter (FWA) :
  px-6 py-32 md:px-12 md:py-48`}
              </pre>
              <Snippet>
                {`mobile : px-6 (24px), py-10 (40px)
desktop admin : px-16 py-14
desktop public : px-12 py-14
chapters monumentaux : py-32 → py-48`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Gap inline — action + hairline">
              <div className="flex w-full max-w-md flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    gap-3 (12px)
                  </span>
                  <span className="inline-block h-px w-6 bg-current text-white/55" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    gap-4 (16px)
                  </span>
                  <span className="inline-block h-px w-6 bg-current text-white/55" />
                </div>
              </div>
              <Snippet>
                {`gap-3 : CTA standard
gap-4 : CTA large (landing)
inline-flex items-center gap-3`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Vertical rhythm — entre blocs d'une page">
              <div className="flex w-full max-w-md flex-col gap-1">
                <div className="border-t border-white/30 pt-2">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                    Section
                  </span>
                </div>
                <div className="h-12" />
                <div className="border-t border-white/30 pt-2">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                    Section
                  </span>
                </div>
                <div className="h-12" />
                <div className="border-t border-white/30 pt-2">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                    Section
                  </span>
                </div>
              </div>
              <Snippet>
                {`flex flex-col gap-12 md:gap-16
ou gap-20 md:gap-24 pour FWA Grade
chaque section : border-t border-white/10 pt-12`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* GRILLES */}
        <Block
          eyebrow="12 · Grilles"
          title="Layouts · cards · hairline-separator"
          intro="Speetch utilise rarement plus de 3 colonnes. Le pattern 'hairline grid' (gap-px sur fond bg-white/[0.08]) remplace les bordures latérales et donne le côté technique signature."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Cards responsive — 1 → 2 → 3 cols">
              <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex aspect-[5/4] flex-col justify-between rounded-md border border-white/10 bg-white/[0.02] p-4"
                  >
                    <span className="text-[10px] uppercase tracking-[0.32em] text-white/35">
                      0{i} / 03
                    </span>
                    <span className="font-sans text-base font-light text-white/80">
                      Card {i}
                    </span>
                  </div>
                ))}
              </div>
              <Snippet>
                {`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-px ou gap-3/4/6
breakpoints standard Speetch :
  md (768px) · lg (1024px) · xl (1280px)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hairline-separator grid — pattern signature">
              <ul className="grid w-full grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-3">
                {["Mon profil", "Design System", "Templates"].map((label) => (
                  <li
                    key={label}
                    className="flex h-20 items-center bg-black px-4 text-[11px] uppercase tracking-[0.32em] text-white/55"
                  >
                    {label}
                  </li>
                ))}
              </ul>
              <Snippet>
                {`<ul class="grid grid-cols-1 sm:grid-cols-2
  lg:grid-cols-3 gap-px overflow-hidden
  rounded-xl bg-white/[0.08]">
  <li class="bg-black p-...">...</li>
</ul>
le fond white/[0.08] devient le séparateur
quand chaque cell est bg-black`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Asymétrique [200px_1fr] — chapitre FWA">
              <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[200px_1fr] lg:gap-12">
                <span className="font-serif text-5xl font-extralight italic leading-none tracking-[-0.04em] text-white/85">
                  03
                </span>
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] uppercase tracking-[0.4em] text-white/40">
                    Chapitre
                  </span>
                  <span className="font-sans text-2xl font-extralight leading-tight tracking-[-0.04em] text-[#F5F5F7]">
                    Brief visuel par{" "}
                    <em className="font-serif italic text-white/85">
                      direction.
                    </em>
                  </span>
                </div>
              </div>
              <Snippet>
                {`grid grid-cols-1 gap-12
md:gap-24 lg:grid-cols-[200px_1fr]
le numéro à gauche, contenu à droite
sur mobile : empilement
sur desktop : 200px fixe + 1fr fluide`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Asymétrique [140px_1fr] — definition list dense">
              <dl className="grid w-full grid-cols-1 gap-3 md:grid-cols-[140px_1fr] md:gap-x-8 md:gap-y-4">
                <dt className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                  Cadrage
                </dt>
                <dd className="text-[15px] text-white/80">
                  Plan resserré buste & mains.
                </dd>
                <dt className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                  Lumière
                </dt>
                <dd className="text-[15px] text-white/80">
                  Tungstène chaud unilatéral.
                </dd>
              </dl>
              <Snippet>
                {`grid grid-cols-1 md:grid-cols-[140px_1fr]
gap-3 md:gap-x-8 md:gap-y-4
pour les dl spécifiques (champs courts)
pour les dl plus larges : [200px_1fr]`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Stats grid — 2/4 colonnes hero">
              <div className="grid w-full grid-cols-2 gap-x-8 gap-y-4 border-t border-white/10 pt-5 md:grid-cols-4">
                {["Durée · 30", "Budget · 1 200 €", "Directions · 03", "Phases · 03"].map(
                  (s) => (
                    <span
                      key={s}
                      className="text-[10px] uppercase tracking-[0.32em] text-white/55"
                    >
                      {s}
                    </span>
                  ),
                )}
              </div>
              <Snippet>
                {`grid grid-cols-2 md:grid-cols-4
gap-x-12 gap-y-6 border-t border-white/10 pt-6
pour les stats KPI sous un hero
toujours border-t en premier`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Bento à 3 colonnes égales — directions D1/D2/D3">
              <div className="grid w-full grid-cols-1 gap-px overflow-hidden rounded-md bg-white/[0.08] md:grid-cols-3">
                {["D1", "D2", "D3"].map((d) => (
                  <div key={d} className="flex flex-col gap-2 bg-black p-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-white/35">
                      {d}
                    </span>
                    <span className="font-serif text-lg font-light italic text-white/85">
                      Direction
                    </span>
                  </div>
                ))}
              </div>
              <Snippet>
                {`grid grid-cols-1 md:grid-cols-3
gap-px overflow-hidden rounded-md
bg-white/[0.08]
pour comparer 3 entités de même nature
(directions créatives, options, plans)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Storyboard 80px/1fr/80px — séquence temporelle">
              <div className="flex w-full flex-col">
                {[
                  { n: "01", t: "0:00 — 0:03", body: "Plan d'ouverture" },
                  { n: "02", t: "0:03 — 0:06", body: "Plan moyen serré" },
                ].map((s) => (
                  <div
                    key={s.n}
                    className="grid grid-cols-[60px_1fr_70px] items-baseline gap-3 border-b border-white/10 py-3 md:grid-cols-[80px_1fr_90px] md:gap-6"
                  >
                    <span className="font-serif text-2xl font-extralight italic text-white/85">
                      {s.n}
                    </span>
                    <span className="font-serif text-base italic text-white/85">
                      {s.body}
                    </span>
                    <span className="text-right font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                      {s.t}
                    </span>
                  </div>
                ))}
              </div>
              <Snippet>
                {`grid-cols-[80px_1fr_80px]
md:grid-cols-[120px_1fr_120px]
items-baseline gap-3 md:gap-6
pour les listes temporelles
(storyboard, timeline, étapes)`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* IMAGE GRIDS */}
        <Block
          eyebrow="22 · Image grids"
          title="Galerie · bento · mosaïque éditoriale"
          intro="Au-delà du 2-col classique : asymétries hiérarchiques (un visuel maître + satellites), bordures hairline qui composent, full-bleed pour les hero. Tous gardent le bg-white/[0.03] de fallback."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Bento — 1 maître + 2 satellites">
              <div className="grid w-full max-w-md grid-cols-3 grid-rows-2 gap-2">
                <div className="col-span-2 row-span-2 bg-gradient-to-br from-white/[0.10] via-white/[0.04] to-white/[0.02]" />
                <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
                <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
              </div>
              <Snippet>
                {`grid grid-cols-3 grid-rows-2 gap-2
+ master : col-span-2 row-span-2
hierarchy : 1 visuel dominant + 2 secondaires
ratio quasi-doré (2/3 vs 1/3)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Mosaïque éditoriale — 4 visuels asymétriques">
              <div className="grid w-full max-w-md grid-cols-4 grid-rows-3 gap-2">
                <div className="col-span-2 row-span-2 bg-gradient-to-br from-white/[0.10] to-white/[0.02]" />
                <div className="col-span-2 row-span-1 bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
                <div className="col-span-1 row-span-1 bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                <div className="col-span-1 row-span-1 bg-gradient-to-br from-white/[0.07] to-white/[0.02]" />
                <div className="col-span-2 row-span-1 bg-gradient-to-br from-white/[0.05] to-white/[0.02]" />
              </div>
              <Snippet>
                {`grid-cols-4 grid-rows-3 gap-2
chaque cellule choisit son span
manuellement (col-span-1, 2, row-span-1, 2)
pour une mosaïque éditoriale tenue
+ ratio doré + alternance horizontal/vertical`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Masonry CSS — 3 colonnes verticales">
              <div className="w-full max-w-md columns-3 gap-2 [column-fill:_balance]">
                {[
                  "aspect-[4/5]",
                  "aspect-square",
                  "aspect-[3/4]",
                  "aspect-[4/3]",
                  "aspect-[5/6]",
                  "aspect-[3/4]",
                ].map((cls, i) => (
                  <div
                    key={i}
                    className={`${cls} mb-2 w-full break-inside-avoid bg-gradient-to-br from-white/[0.06] to-white/[0.02]`}
                  />
                ))}
              </div>
              <Snippet>
                {`columns-3 gap-2
+ chaque enfant : break-inside-avoid mb-2
chaque image garde son aspect natif
les colonnes CSS s'équilibrent toutes seules
sans JS — bonus accessibilité`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hairline grid — séparé par bg-white/[0.08]">
              <div className="grid w-full max-w-md grid-cols-3 gap-px overflow-hidden bg-white/[0.08]">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square bg-black p-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/35">
                      {String(i).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
              <Snippet>
                {`grid grid-cols-3 gap-px
+ container : bg-white/[0.08] overflow-hidden
+ children : bg-black
le séparateur 1px vient du bg du parent
zéro bordure individuelle à gérer`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Image + texte côte-à-côte — éditorial">
              <div className="grid w-full max-w-md grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                <div className="aspect-[4/5] bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
                <div className="flex flex-col justify-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Direction 01
                  </span>
                  <span className="font-sans text-xl font-extralight leading-tight tracking-[-0.04em] text-[#F5F5F7]">
                    Avant{" "}
                    <em className="font-serif italic text-white/85">
                      les mots.
                    </em>
                  </span>
                  <span className="font-serif text-sm italic text-white/55">
                    Le silence qui précède le geste.
                  </span>
                </div>
              </div>
              <Snippet>
                {`grid grid-cols-1 md:grid-cols-2
gap-6 md:gap-8
image gauche + texte droite
ratio 4/5 (portrait) pour l'image
texte aligné verticalement (justify-center)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Full-bleed hero — image edge-to-edge">
              <div className="w-full max-w-md">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-white/[0.10] via-white/[0.04] to-white/[0.02]">
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <span className="text-[10px] uppercase tracking-[0.32em] text-white/70">
                      Direction artistique
                    </span>
                    <span className="mt-1 font-sans text-2xl font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]">
                      Speetch
                    </span>
                  </div>
                </div>
              </div>
              <Snippet>
                {`<div class="relative aspect-[16/9]
  overflow-hidden">
  <Image fill ... />
  <div class="absolute inset-0
    flex flex-col justify-end p-...">
    {/* overlay texte */}
  </div>
</div>
pour les heros monumentaux édge-to-edge
souvent + gradient noir 0 → 70% en bas`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Sticky companion — l'image reste, le texte file">
              <div className="grid w-full max-w-md grid-cols-[120px_1fr] gap-4 md:grid-cols-[140px_1fr] md:gap-6">
                <div className="aspect-[3/4] bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
                <div className="space-y-3">
                  <p className="text-[13px] text-white/70">
                    L&apos;image à gauche est{" "}
                    <span className="font-mono">sticky top-N</span> — elle
                    reste à l&apos;écran pendant qu&apos;on scrolle le texte
                    long à droite. Pattern classique pour les case studies.
                  </p>
                  <p className="text-[13px] text-white/55">
                    Paragraphe suivant qui rallonge le contenu pour démontrer
                    le décalage entre l&apos;image fixée et le texte qui scroll.
                  </p>
                </div>
              </div>
              <Snippet>
                {`<div class="grid grid-cols-[140px_1fr] gap-6">
  <div class="sticky top-24 self-start">
    <Image .../>
  </div>
  <div class="space-y-6">
    {/* long form text */}
  </div>
</div>
self-start essentiel sinon le sticky
prend la hauteur de la column entière`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Storyboard 5 plans — séquence verticale">
              <div className="flex w-full max-w-md flex-col gap-3">
                {[
                  { n: "01", t: "0:00 — 0:03", ar: "aspect-[16/9]" },
                  { n: "02", t: "0:03 — 0:06", ar: "aspect-[16/9]" },
                  { n: "03", t: "0:06 — 0:10", ar: "aspect-[16/9]" },
                ].map((s) => (
                  <div
                    key={s.n}
                    className="grid grid-cols-[40px_1fr_70px] items-center gap-3"
                  >
                    <span className="font-serif text-xl italic text-white/85">
                      {s.n}
                    </span>
                    <div className={`${s.ar} w-full bg-gradient-to-br from-white/[0.06] to-white/[0.02]`} />
                    <span className="text-right font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                      {s.t}
                    </span>
                  </div>
                ))}
              </div>
              <Snippet>
                {`grid-cols-[40px_1fr_70px] gap-3
num · plan · timecode
plus dense que le pattern texte-only
chaque cellule items-center
ratio 16/9 pour les plans vidéo`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* PAGE CHROME */}
        <Block
          eyebrow="31 · Page chrome"
          title="Topbar · sidebar · overlays globaux"
          intro="Les éléments fixes qui habillent toute l'app. Topbar avec progress bar, sidebar admin glassmorphism, vignette + grain en overlay full-screen, liseré technique en haut/bas. Tous gardent un z-index discret : 30 → 70."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Topbar sticky — brand + meta + progress">
              <div className="relative h-12 w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black">
                <header className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 text-[9px] uppercase tracking-[0.4em] text-white/40">
                  <span>Speetch · Brief</span>
                  <span className="hidden md:inline">
                    Campagne Meta · Mai 2026
                  </span>
                  <span>FWA</span>
                </header>
                <span
                  className="absolute left-0 top-0 h-px bg-[#F5F5F7]"
                  style={{ width: "42%" }}
                />
              </div>
              <Snippet>
                {`<header class="fixed inset-x-0 top-0 z-[60]
  flex items-center justify-between
  px-6 py-5 md:px-12
  text-[10px] uppercase tracking-[0.4em]
  text-white/45
  bg-gradient-to-b from-black/85 to-transparent
  pointer-events-none">
  {...pointer-events-auto children}
</header>
+ progress bar absolute en first child`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Sidebar admin — glassmorphism collapsible">
              <aside className="relative h-56 w-32 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.08] via-white/[0.025] to-white/[0.005] p-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),inset_1px_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/[0.06] blur-2xl"
                />
                <p className="relative text-base font-extralight tracking-[-0.04em] text-[#F5F5F7]">
                  Speetch
                </p>
                <p className="relative mt-1 text-[8px] uppercase tracking-[0.4em] text-white/40">
                  Admin
                </p>
                <nav className="relative mt-6 flex flex-col gap-3">
                  {["Dashboard", "Clients", "Réglages"].map((it, i) => (
                    <span
                      key={it}
                      className={`inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.32em] ${
                        i === 1 ? "text-[#F5F5F7]" : "text-white/45"
                      }`}
                    >
                      <span
                        className={`block h-px ${
                          i === 1 ? "w-6" : "w-2"
                        } bg-current`}
                      />
                      {it}
                    </span>
                  ))}
                </nav>
              </aside>
              <Snippet>
                {`fixed inset-y-4 left-4 z-20
flex-col rounded-2xl
border border-white/[0.08]
bg-gradient-to-br from-white/[0.08]
  via-white/[0.025] to-white/[0.005]
backdrop-blur-2xl
shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),
  inset_1px_1px_0_0_rgba(255,255,255,0.05)]
+ halo : -left-12 -top-12 h-40 w-40
  rounded-full bg-white/[0.06] blur-3xl
+ width : w-56 expanded / w-16 collapsed`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Vignette globale — radial gradient">
              <div className="relative h-32 w-full max-w-md overflow-hidden rounded-md bg-black">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-base italic text-white/85">
                    Speetch
                  </span>
                </div>
              </div>
              <Snippet>
                {`<div class="pointer-events-none fixed inset-0
  z-[55] bg-[radial-gradient(
    ellipse_at_center,
    transparent_0%,
    rgba(0,0,0,0.55)_100%
  )]" />
asseoit la composition en assombrissant
les bords sans toucher le centre`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Grain de film — overlay animé">
              <div className="relative h-32 w-full max-w-md overflow-hidden rounded-md bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
                <div className="grain pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-white/55">
                    avec grain · mix-blend-overlay
                  </span>
                </div>
              </div>
              <Snippet>
                {`<div class="grain pointer-events-none
  fixed inset-0 z-[60] opacity-[0.08]
  mix-blend-overlay" />
classe utilitaire dans globals.css :
.grain {
  background-image: url("data:image/svg+xml,...
    fractalNoise...");
  animation: grain 8s steps(8) infinite;
}
respecte prefers-reduced-motion`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Liseré technique — top/bottom hairlines">
              <div className="relative flex h-32 w-full max-w-md flex-col justify-between overflow-hidden rounded-md bg-black">
                <span className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="flex items-center justify-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/55">
                    contenu
                  </span>
                </div>
                <span className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              <Snippet>
                {`fixed inset-x-0 top-0 z-[65] h-px
  bg-gradient-to-r from-transparent
  via-white/10 to-transparent
+ même chose en bottom-0
détail FWA discret qui signale
"on est dans un cadre composé"
opacity 10% pour ne pas dominer`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Z-index scale — hiérarchie d'overlays">
              <ul className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
                <li>z-10 · contenu principal (main)</li>
                <li>z-20 · sidebar admin</li>
                <li>z-30 · sticky header public</li>
                <li>z-40 · index sticky FWA</li>
                <li>z-50 · topbar fixed</li>
                <li>z-55 · vignette</li>
                <li>z-60 · grain</li>
                <li>z-65 · liseré technique</li>
                <li>z-70 · progress bar (toujours visible)</li>
                <li>z-80 · modales / médiathèque</li>
                <li>z-100 · loader full-screen</li>
                <li>z-120 · custom cursor</li>
              </ul>
              <Snippet>
                {`z-10  : main relative
z-20  : sidebar
z-30  : sticky header
z-40  : index sticky
z-50  : topbar fixed
z-55  : vignette
z-60  : grain
z-65  : liseré
z-70  : progress bar
z-80  : modales
z-100 : loader
z-120 : cursor (top)`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* FOOTER PATTERNS */}
        <Block
          eyebrow="30 · Footer patterns"
          title="Confidentiel · sceau · admin signout"
          intro="Trois familles. Public : 'Paris · 2026' + 'Speetch · Confidentiel'. Sceau : circle 'A' + lockup + vow italique pour fermer une page éditoriale. Admin : email + signout discret."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Footer public — date + confidentiel">
              <footer className="flex w-full max-w-md items-end justify-between border-t border-white/10 px-4 py-6 text-[11px] uppercase tracking-[0.28em] text-white/40">
                <span>Paris · 2026</span>
                <span>Speetch · Confidentiel</span>
              </footer>
              <Snippet>
                {`<footer class="flex items-end justify-between
  border-t border-white/10 px-6 py-8
  text-[11px] uppercase tracking-[0.28em]
  text-white/40 md:px-12">
  <span>Paris · 2026</span>
  <span>Speetch · Confidentiel</span>
</footer>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Footer sceau — clôture d'un long contenu">
              <footer className="flex w-full max-w-md flex-col items-center gap-3 border-t border-white/10 px-4 py-12 text-center">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/40 font-serif text-2xl italic text-[#F5F5F7]">
                  <em>A</em>
                </span>
                <span className="mt-2 text-[11px] uppercase tracking-[0.36em] text-white/45">
                  Club Abrazo · Paris
                </span>
                <span className="max-w-[28ch] font-serif text-sm italic text-white/65">
                  <em>Brief tenu. Reste à le mettre en ondes.</em>
                </span>
              </footer>
              <Snippet>
                {`<footer class="flex flex-col items-center
  gap-4 border-t border-white/10
  px-6 py-32 text-center md:py-40">
  <span class="h-20 w-20 rounded-full
    border border-white/40
    inline-flex items-center justify-center
    font-serif text-3xl italic">
    <em>A</em>
  </span>
  <span class="lockup uppercase
    tracking-[0.36em] text-white/45">
  <span class="vow font-serif italic">
</footer>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Footer admin — session + signout">
              <footer className="flex w-full max-w-md flex-col gap-4 border-t border-white/[0.08] pt-5 text-[10px] uppercase tracking-[0.4em]">
                <div className="flex flex-col gap-1">
                  <span className="text-white/30">Session</span>
                  <span className="text-[13px] font-light normal-case tracking-normal text-white/70">
                    clubabrazo@gmail.com
                  </span>
                </div>
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 self-start text-[10px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
                >
                  <span className="inline-block h-px w-3 bg-current transition-all duration-500 ease-out group-hover:w-8" />
                  <span>Déconnexion</span>
                </button>
              </footer>
              <Snippet>
                {`<div class="flex flex-col gap-5
  border-t border-white/[0.08] pt-6">
  <div class="flex flex-col gap-1.5">
    <span class="text-[10px] uppercase
      tracking-[0.4em] text-white/30">
      Session
    </span>
    <span class="text-[13px] font-light
      text-white/70 break-all">{email}</span>
  </div>
  <form action="/auth/signout" method="post">
    <button>Déconnexion</button>
  </form>
</div>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Footer prev/next — navigation entre pages">
              <nav className="grid w-full max-w-md grid-cols-2 gap-px border-t border-white/10 bg-white/10">
                <div className="flex flex-col gap-2 bg-black p-4">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                    Précédent
                  </span>
                  <span className="font-sans text-base font-extralight leading-tight tracking-[-0.03em] text-[#F5F5F7]">
                    Brief shooting
                  </span>
                  <span className="inline-block h-px w-8 bg-white/40" />
                </div>
                <div className="flex flex-col items-end gap-2 bg-black p-4">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                    Suivant
                  </span>
                  <span className="font-sans text-base font-extralight leading-tight tracking-[-0.03em] text-[#F5F5F7]">
                    Plan média
                  </span>
                  <span className="inline-block h-px w-8 bg-white/40" />
                </div>
              </nav>
              <Snippet>
                {`<nav class="grid grid-cols-2 gap-px
  border-t border-white/10 bg-white/10">
  <Link class="flex flex-col gap-3 bg-black
    p-6 md:p-10 hover:bg-white/[0.03]">
    {/* Précédent à gauche */}
  </Link>
  <Link class="... items-end text-right">
    {/* Suivant à droite */}
  </Link>
</nav>`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* PROJECT TEMPLATES */}
        <Block
          eyebrow="53 · Project templates"
          title="Layouts complets · livrables clients réutilisables"
          intro="Six modèles de page entiers à instancier pour chaque nouveau livrable client. Pas de variations de composants mais des structures de page : ordre des blocs, proportions, rythmes de section. Quand tu démarres un livrable, choisis le template qui colle au type de contenu et fais-le tien."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Case study — récit projet">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-4">
                <span className="block h-2 w-20 bg-white/45" />
                <span className="block h-6 w-3/4 bg-white/85" />
                <span className="block h-3 w-1/2 bg-white/35" />
                <span className="mt-3 block aspect-[16/9] w-full bg-gradient-to-br from-white/[0.10] to-white/[0.02]" />
                <div className="space-y-1.5 pt-2">
                  <span className="block h-1 w-full bg-white/15" />
                  <span className="block h-1 w-11/12 bg-white/15" />
                  <span className="block h-1 w-10/12 bg-white/15" />
                </div>
                <span className="block h-2 w-16 bg-white/45 mt-3" />
                <div className="grid grid-cols-2 gap-1">
                  <span className="block aspect-square bg-white/[0.04]" />
                  <span className="block aspect-square bg-white/[0.04]" />
                </div>
              </div>
              <Snippet>
                {`structure :
1. eyebrow (client · type · année)
2. titre monumental
3. pitch / résumé italique
4. hero image full-bleed 16/9
5. corps "Contexte → Approche → Livrable"
6. galerie 2 cols
7. KPIs si applicable
8. signature sceau
url type : /clients/[slug]/projects/[slug]`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Brief de production — document éditorial">
              <div className="w-full max-w-md space-y-3 rounded-md border border-amber-300/20 bg-amber-300/[0.04] p-4">
                <span className="block h-2 w-16 bg-amber-200/55" />
                <span className="block h-6 w-2/3 bg-white/85" />
                <span className="block h-3 w-1/2 bg-amber-200/40 italic" />
                <div className="my-3 grid grid-cols-4 gap-1 border-t border-amber-200/10 pt-3">
                  <span className="block h-3 bg-white/30" />
                  <span className="block h-3 bg-white/30" />
                  <span className="block h-3 bg-white/30" />
                  <span className="block h-3 bg-white/30" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="grid grid-cols-[40px_1fr] gap-2">
                    <span className="block h-4 w-8 bg-amber-200/55" />
                    <div className="space-y-1">
                      <span className="block h-2 w-24 bg-white/55" />
                      <span className="block h-1 w-full bg-white/15" />
                      <span className="block h-1 w-5/6 bg-white/15" />
                    </div>
                  </div>
                ))}
              </div>
              <Snippet>
                {`structure (cf. ton brief Club Abrazo) :
1. eyebrow + titre (italique Fraunces)
2. sous-titre KPI inline (J/€/X directions)
3. stats grid (durée · budget · directions · phases)
4. chapitres numérotés (00 → 06)
5. callouts éditoriaux par chapitre
6. tables (budget, audiences)
7. storyboard / A/B / suites
mode "document" éditorial`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Moodboard — direction visuelle">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-4">
                <span className="block h-2 w-16 bg-white/45" />
                <span className="block h-5 w-1/2 bg-white/85" />
                <div className="grid grid-cols-3 grid-rows-2 gap-1 pt-2">
                  <span className="col-span-2 row-span-2 block bg-gradient-to-br from-white/[0.10] to-white/[0.02]" />
                  <span className="block bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
                  <span className="block bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                </div>
                <div className="grid grid-cols-4 gap-1 pt-1">
                  <span className="block aspect-square bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                  <span className="block aspect-square bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                  <span className="block aspect-square bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                  <span className="block aspect-square bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                </div>
                <div className="flex gap-2 pt-2">
                  {["#1A0306", "#C61428", "#F2E6C2", "#C8A870"].map((c) => (
                    <span
                      key={c}
                      className="block h-4 w-4 rounded-sm border border-white/10"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <Snippet>
                {`structure :
1. eyebrow + titre court
2. paragraphe d'intention (3-5 lignes)
3. bento maître + satellites (3-2)
4. grille 4 colonnes images secondaires
5. swatches palette (3-6 couleurs hex)
6. swatches typo (2-3 fontes test)
7. mots-clés tagués
8. références externes (liens optionnels)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Livrable final — vitrine projet">
              <div className="w-full max-w-md space-y-3 rounded-md border border-emerald-400/15 bg-black p-4">
                <div className="flex items-center justify-between">
                  <span className="block h-2 w-12 bg-emerald-300/65" />
                  <span className="block h-2 w-8 bg-white/35" />
                </div>
                <span className="block h-7 w-3/4 bg-white/85" />
                <span className="block aspect-[16/9] w-full bg-gradient-to-br from-white/[0.10] to-white/[0.02]" />
                <div className="space-y-1.5 py-2">
                  <span className="block h-1 w-full bg-white/15" />
                  <span className="block h-1 w-5/6 bg-white/15" />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="block aspect-video bg-white/[0.04]" />
                  <span className="block aspect-video bg-white/[0.04]" />
                </div>
                <span className="block h-2 w-1/2 bg-white/45" />
                <div className="flex flex-wrap gap-1 pt-1">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="block h-3 w-12 rounded-full border border-white/20"
                    />
                  ))}
                </div>
              </div>
              <Snippet>
                {`structure :
1. badge "Livré" emerald + date
2. titre du projet + sous-titre
3. hero média principal (image / vidéo)
4. note d'intention (3-4 lignes serif italique)
5. galerie déclinaisons (2 cols)
6. crédits / équipe
7. tags / catégories
8. CTA "Voir le projet en ligne" si applicable`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Plan média — tableau de bord campagne">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-4">
                <span className="block h-2 w-16 bg-white/45" />
                <span className="block h-5 w-1/2 bg-white/85" />
                <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1">
                      <span className="block h-2 w-12 bg-white/35" />
                      <span className="block h-4 w-16 bg-white/85" />
                      <span className="block h-2 w-10 bg-emerald-300/55" />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 pt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                      <span className="block h-2 w-20 bg-white/55" />
                      <span className="block h-2 w-12 bg-white/35" />
                      <span className="block h-2 w-8 bg-white/85" />
                    </div>
                  ))}
                </div>
                <div className="h-12 w-full bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
              </div>
              <Snippet>
                {`structure :
1. eyebrow client + période
2. titre campagne
3. KPIs principaux (3-4 stats avec delta)
4. table phases × budgets
5. sparkline / bar chart évolution
6. table A/B tests par ligne
7. notes & ajustements
mode FWA dark, data-dense`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Index client — landing /clients/[slug]">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-4">
                <span className="block h-2 w-16 bg-white/45" />
                <span className="block h-7 w-3/4 bg-white/85" />
                <span className="block h-2 w-1/2 bg-white/35" />
                <div className="my-3 flex justify-between border-t border-white/10 pt-3 text-[8px] uppercase tracking-[0.32em] text-white/40">
                  <span>Espace livré · 13 mai 2026</span>
                  <span>Paris</span>
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2 border-t border-white/10 pt-3">
                    <span className="block h-2 w-12 bg-white/35" />
                    <span className="block h-4 w-2/3 bg-white/85" />
                    <span className="block h-2 w-1/3 bg-white/45" />
                    <div className="space-y-1 pl-2 pt-1">
                      <span className="flex h-3 items-center gap-2">
                        <span className="block h-px w-4 bg-white/35" />
                        <span className="block h-1.5 w-24 bg-white/65" />
                      </span>
                      <span className="flex h-3 items-center gap-2">
                        <span className="block h-px w-4 bg-white/35" />
                        <span className="block h-1.5 w-20 bg-white/65" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Snippet>
                {`pattern actuel /clients/[slug] (déjà en code) :
1. header sticky verrouiller
2. hero client name + avatar
3. metadata strip (date · ville · projets)
4. projects list : nom + nb pages + liens
url : /clients/[slug]
chaque page → /clients/[slug]/[project]/[page]`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tableau de bord projet — admin">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-4">
                <div className="flex items-baseline justify-between">
                  <div className="space-y-1">
                    <span className="block h-2 w-20 bg-white/35" />
                    <span className="block h-5 w-32 bg-white/85" />
                  </div>
                  <span className="block h-3 w-12 rounded-full border border-emerald-400/30 bg-emerald-400/[0.05]" />
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
                  <div className="space-y-1">
                    <span className="block h-2 w-10 bg-white/35" />
                    <span className="block h-3 w-14 bg-white/85" />
                  </div>
                  <div className="space-y-1">
                    <span className="block h-2 w-10 bg-white/35" />
                    <span className="block h-3 w-14 bg-white/85" />
                  </div>
                </div>
                <div className="space-y-1.5 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="block h-2 w-32 bg-white/55" />
                      <span className="block h-2 w-12 bg-white/35" />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 block h-3 w-24 rounded-full border border-white/20"
                />
              </div>
              <Snippet>
                {`pattern actuel admin (déjà en code) :
1. breadcrumb (Espaces clients → Client)
2. titre projet + badge publié
3. sous-titre + meta (type · date)
4. liste de pages (cliquables)
5. CTA "Nouvelle page" (large)
url : /admin/clients/[id]/projects/[id]`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Proposition / pitch — commercial">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-4">
                <div className="flex items-center justify-center py-2">
                  <span className="block h-10 w-10 rounded-full border border-white/40" />
                </div>
                <span className="mx-auto block h-3 w-16 bg-white/45" />
                <span className="mx-auto block h-7 w-2/3 bg-white/85" />
                <span className="mx-auto block h-3 w-1/2 bg-white/35" />
                <div className="my-3 flex justify-center">
                  <span className="block h-px w-12 bg-white/30" />
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-[24px_1fr] gap-3 pt-1">
                    <span className="block h-5 w-5 bg-white/45" />
                    <div className="space-y-1">
                      <span className="block h-2 w-20 bg-white/55" />
                      <span className="block h-1 w-full bg-white/15" />
                      <span className="block h-1 w-5/6 bg-white/15" />
                    </div>
                  </div>
                ))}
                <div className="flex justify-center pt-3">
                  <span className="block h-4 w-32 rounded-full border border-white/40" />
                </div>
              </div>
              <Snippet>
                {`structure éditoriale centrée :
1. sceau client (initiale)
2. eyebrow ("Proposition pour …")
3. titre monumental
4. sous-titre italique
5. divider hairline central
6. 3 points-clés numérotés
7. budget + planning condensés
8. CTA "Programmer un échange"
+ peut inclure une vidéo Loom
mode "document" centré, vertical`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Comment instancier un template">
              <ul className="flex w-full max-w-md flex-col gap-2 text-[12px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-white/45">1.</span>
                  <span>
                    Choisir le template qui correspond au type de contenu (pas
                    l&apos;esthétique souhaitée — l&apos;esthétique est verrouillée
                    par Speetch).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-white/45">2.</span>
                  <span>
                    Remplir les blocs structurels obligatoires (titre, eyebrow,
                    intro, sections-clés).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-white/45">3.</span>
                  <span>
                    Garder les proportions et l&apos;ordre — ne pas réorganiser
                    le squelette, sinon on perd la signature.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-white/45">4.</span>
                  <span>
                    Ajouter des sections custom uniquement en complément, jamais
                    en remplacement.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-white/45">5.</span>
                  <span>
                    Vérifier que le template choisi correspond toujours en fin
                    de remplissage — sinon refactor en changeant de template.
                  </span>
                </li>
              </ul>
              <Snippet>
                {`règle : le template décide de la grammaire
de la page (où vivent les blocs).
le contenu décide du sens.
ne pas mélanger les deux —
si le contenu déborde du template,
changer de template plutôt que
de l'étirer.`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* HERO PATTERNS */}
        <Block
          eyebrow="54 · Hero patterns"
          title="Variantes consolidées · 7 patterns"
          intro="Les hero Speetch éclatés dans les sections précédentes (admin landing, FwaPageView, PublicPageView, design system, settings…) sont en fait 7 patterns récurrents. Consolidation ci-dessous pour pouvoir s'y référer directement quand on en crée un nouveau."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Hero monumental texte-only — FWA Grade">
              <div className="w-full max-w-md space-y-4 rounded-md border border-white/10 bg-black p-5">
                <span className="block h-2 w-12 bg-white/45" />
                <span
                  className="block font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
                  style={{ fontSize: "2.5rem" }}
                >
                  Brief
                  <br />
                  <em className="font-serif italic font-light text-white/85">
                    de production.
                  </em>
                </span>
                <span className="block max-w-[20ch] font-serif text-xs italic text-white/55">
                  Campagne Meta intemporelle — trois directions séquencées.
                </span>
              </div>
              <Snippet>
                {`pattern FWA Grade (FwaPageView) :
1. eyebrow tracking 0.4em white/45
2. titre clamp(3.5rem, 14vw, 12rem)
   font-extralight tracking-[-0.05em]
   leading-[0.82]
   + dernière partie Fraunces italique
3. pitch font-serif italic white/75
   clamp(1.125rem, 1.8vw, 1.5rem)
4. KPI grid border-t en bas
5. scroll cue animate-pulse`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hero standard — PublicPageView">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-5">
                <span className="block h-2 w-16 bg-white/45" />
                <span
                  className="block font-sans font-extralight leading-[0.86] tracking-[-0.05em] text-[#F5F5F7]"
                  style={{ fontSize: "2rem" }}
                >
                  Club Abrazo
                </span>
                <div className="mt-4 flex gap-3 border-t border-white/10 pt-3 text-[9px] uppercase tracking-[0.32em] text-white/45">
                  <span>Espace livré · 13 mai 2026</span>
                  <span>·</span>
                  <span>Paris</span>
                </div>
              </div>
              <Snippet>
                {`pattern PublicPageView :
1. eyebrow "Espace client"
2. titre clamp(2.75rem, 9vw, 7rem)
   font-extralight tracking-[-0.05em]
   leading-[0.86]
3. metadata strip border-t
   tracking-[0.32em] white/45
   (date · ville · projets count)
4. avatar full-bleed dessous (optionnel)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hero admin landing — dashboard">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-5">
                <span className="block h-2 w-16 bg-white/45" />
                <span
                  className="block font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
                  style={{ fontSize: "1.875rem" }}
                >
                  Bienvenue,{" "}
                  <em className="font-serif italic font-light text-white/85">
                    clubabrazo
                  </em>
                </span>
                <div className="mt-3 space-y-1 text-[9px] uppercase tracking-[0.32em] text-white/45">
                  <div className="flex items-center gap-2">
                    <span className="block h-1 w-1 rounded-full bg-emerald-300" />
                    Session active
                  </div>
                  <div>clubabrazo@gmail.com</div>
                </div>
              </div>
              <Snippet>
                {`pattern /admin landing :
1. eyebrow "Administration"
2. titre clamp(2.5rem, 8vw, 6rem)
   "Bienvenue, " + Fraunces italique
3. status active (dot emerald + label)
4. email du user
5. dropdown rapide d'actions en dessous
plus calme qu'un hero public`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hero KPI grid — stats au-dessous">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-5">
                <span className="block h-2 w-16 bg-white/45" />
                <span
                  className="block font-sans font-extralight leading-[0.86] tracking-[-0.05em] text-[#F5F5F7]"
                  style={{ fontSize: "2rem" }}
                >
                  Brief
                </span>
                <div className="mt-4 grid grid-cols-4 gap-3 border-t border-white/10 pt-3">
                  {[
                    { label: "Durée", value: "30j" },
                    { label: "Budget", value: "1 200€" },
                    { label: "Directions", value: "03" },
                    { label: "Phases", value: "03" },
                  ].map((s) => (
                    <div key={s.label} className="space-y-1">
                      <span className="block text-[8px] uppercase tracking-[0.36em] text-white/45">
                        {s.label}
                      </span>
                      <span className="block text-base font-extralight text-[#F5F5F7]">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Snippet>
                {`pattern KPI grid (FwaPageView) :
1. eyebrow + titre standard
2. border-t white/10 séparateur
3. grid-cols-2 md:grid-cols-4
   gap-x-12 gap-y-6
4. chaque stat :
   - label uppercase white/45
   - value font-extralight clamp(1.5rem, 3vw, 2.5rem)
   - unité font-serif italique en suffixe
pour les pages data-driven`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hero split — texte + image">
              <div className="w-full max-w-md rounded-md border border-white/10 bg-black p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <span className="block h-2 w-12 bg-white/45" />
                    <span
                      className="block font-sans font-extralight leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
                      style={{ fontSize: "1.25rem" }}
                    >
                      Direction{" "}
                      <em className="font-serif italic font-light text-white/85">
                        01
                      </em>
                    </span>
                    <span className="block text-[9px] font-serif italic text-white/55">
                      Avant les mots. Le silence du début.
                    </span>
                  </div>
                  <div className="block aspect-[4/5] bg-gradient-to-br from-white/[0.10] to-white/[0.02]" />
                </div>
              </div>
              <Snippet>
                {`grid grid-cols-1 md:grid-cols-2
gap-6 md:gap-12
items-center
1. colonne gauche :
   eyebrow + titre + pitch
2. colonne droite :
   image portrait aspect-[4/5]
   ou vidéo
pour les pages case study, brief, présentation`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hero full-bleed cover + overlay">
              <div className="w-full max-w-md">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border border-white/10 bg-gradient-to-br from-white/[0.10] via-white/[0.04] to-white/[0.02]">
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
                    <span className="block text-[8px] uppercase tracking-[0.4em] text-white/65">
                      Direction artistique
                    </span>
                    <span
                      className="mt-1 block font-sans font-extralight leading-none tracking-[-0.05em] text-[#F5F5F7]"
                      style={{ fontSize: "1.5rem" }}
                    >
                      Speetch
                    </span>
                  </div>
                </div>
              </div>
              <Snippet>
                {`<div class="relative aspect-[16/9]
  overflow-hidden">
  <Image fill class="object-cover" />
  <div class="absolute inset-x-0 bottom-0
    bg-gradient-to-t from-black/85
    via-black/40 to-transparent
    p-6 md:p-10">
    <p class="eyebrow">{type}</p>
    <h1 class="text-monumental">{title}</h1>
  </div>
</div>
pour les heros visuels (case study, projet)
gradient noir 85% → 40% → 0
+ texte ancré bas-gauche`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hero centré — mode document éditorial">
              <div className="w-full max-w-md space-y-3 rounded-md border border-amber-200/15 bg-amber-200/[0.03] p-5 text-center">
                <span className="block h-2 w-16 mx-auto bg-amber-200/55" />
                <span
                  className="mx-auto block font-serif italic font-extralight leading-tight tracking-[-0.04em] text-[#F5F5F7]"
                  style={{ fontSize: "1.875rem" }}
                >
                  Brief de production
                </span>
                <span className="mx-auto block max-w-[20ch] font-serif text-xs italic text-white/55">
                  Campagne intemporelle · trois directions
                </span>
                <div className="flex justify-center pt-2">
                  <span className="block h-px w-12 bg-amber-200/40" />
                </div>
              </div>
              <Snippet>
                {`pattern mode "document" (raw_html doc style)
+ FwaPageView centré rare :
1. eyebrow centré tracking-[0.4em]
2. titre Fraunces italique centré
3. pitch serif italic centré
4. divider hairline central
inspiration faire-part de théâtre 30s
réservé aux pages éditoriales fortes`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hero avec sceau client">
              <div className="w-full max-w-md space-y-3 rounded-md border border-white/10 bg-black p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 font-serif text-base italic text-[#F5F5F7]">
                    <em>A</em>
                  </span>
                  <div className="space-y-0.5">
                    <span className="block h-2 w-16 bg-white/45" />
                    <span className="block h-1.5 w-12 bg-white/35" />
                  </div>
                </div>
                <span
                  className="block font-sans font-extralight leading-[0.86] tracking-[-0.05em] text-[#F5F5F7]"
                  style={{ fontSize: "1.875rem" }}
                >
                  Brief{" "}
                  <em className="font-serif italic font-light text-white/85">
                    Club Abrazo
                  </em>
                </span>
              </div>
              <Snippet>
                {`1. sceau initiale + nom client + meta
2. titre standard ExtraLight + Fraunces accent
3. metadata + KPIs en option
le sceau ancre l'identité du client
au sommet de la page
réservé aux livrables explicitement signés`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hero minimaliste landing">
              <div className="w-full max-w-md rounded-md border border-white/10 bg-black p-6">
                <div className="space-y-4 text-center">
                  <span
                    className="block font-sans font-extralight leading-none tracking-[-0.06em] text-[#F5F5F7]"
                    style={{ fontSize: "3rem" }}
                  >
                    Speetch
                  </span>
                  <span className="block font-serif text-xs italic text-white/55">
                    Paris · 25 ans d&apos;expérience
                  </span>
                  <div className="flex justify-center pt-3">
                    <button
                      type="button"
                      className="group inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-white/75 hover:text-white"
                    >
                      <span>Entrer</span>
                      <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                    </button>
                  </div>
                </div>
              </div>
              <Snippet>
                {`pattern Coming Soon / landing :
1. wordmark Speetch monumental centré
2. pitch court une ligne
3. CTA primary "Entrer"
+ background = grain + vignette globaux
+ marquee facultatif en bas
under-construction state`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Comment choisir un hero">
              <ul className="flex w-full max-w-md flex-col gap-3 text-[12px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[14ch]">
                    Page lue
                  </span>
                  <span>monumental texte-only (Brief de production, case study)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[14ch]">
                    Vitrine
                  </span>
                  <span>full-bleed cover ou split avec image (livrable, portfolio)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[14ch]">
                    Data-driven
                  </span>
                  <span>standard + KPI grid (campagne, rapport, dashboard)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[14ch]">
                    Espace client
                  </span>
                  <span>standard PublicPageView avec metadata strip</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[14ch]">
                    Éditorial
                  </span>
                  <span>centré mode document (faire-part, proposition)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[14ch]">
                    Admin
                  </span>
                  <span>plus calme, dashboard avec status + email</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[14ch]">
                    Landing public
                  </span>
                  <span>minimaliste wordmark centré (Speetch coming soon)</span>
                </li>
              </ul>
              <Snippet>
                {`règle de choix :
1. quel est le contenu principal du hero ?
   texte → monumental ou centré
   image → full-bleed ou split
   data → KPI grid
2. quel est le contexte ?
   public → standard / minimaliste
   admin → dashboard ou case study
   éditorial → centré document
3. respecter UN seul hero par page`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>


        {/* ╔══ FAMILY: COMPOSANTS ══╗ */}
        <section
          id="family-composants"
          className="flex scroll-mt-24 flex-col gap-4 border-t-2 border-white/15 pt-12"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/35">
            Famille · Composants
          </span>
          <h2
            className="font-serif font-extralight italic leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Composants
          </h2>
          <p className="max-w-xl font-serif text-sm italic text-white/45 md:text-base">
            Boutons · formulaires · badges · modales · dropdowns · sound · kbd
          </p>
        </section>
        {/* COMPOSANTS */}
        <Block
          eyebrow="05 · Composants"
          title="Boutons, cards, hairlines"
          intro="Patterns récurrents de l'app — chacun avec preview, usage et classe Tailwind canonique. Survole pour voir les micro-interactions."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Bouton primaire — ligne qui s'étend">
              <button
                type="button"
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors duration-300 hover:text-white"
              >
                <span>Action principale</span>
                <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
              </button>
              <Snippet>
                {`group inline-flex items-center gap-3
text-[11px] uppercase tracking-[0.32em]
text-white/75 hover:text-white
+ <span class="h-px w-6 group-hover:w-12 transition-all duration-500" />`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Bouton large — landing primaire">
              <button
                type="button"
                className="group inline-flex items-center gap-4 text-2xl font-light text-[#F5F5F7] transition-colors md:text-3xl"
              >
                <span>Créer un nouvel espace</span>
                <span className="inline-block h-px w-10 bg-current transition-all duration-500 ease-out group-hover:w-20" />
              </button>
              <Snippet>
                {`group inline-flex items-center gap-4
text-2xl md:text-3xl font-light text-[#F5F5F7]
+ <span class="h-px w-10 group-hover:w-20" />`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Bouton retour — ligne préfixe">
              <button
                type="button"
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors duration-300 hover:text-white"
              >
                <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10" />
                <span>Retour</span>
              </button>
              <Snippet>
                {`group inline-flex items-center gap-3
+ <span class="h-px w-6 group-hover:w-10" /> (en préfixe)
text-[11px] uppercase tracking-[0.28em] text-white/55`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Bouton ghost — minuscule, utilitaire">
              <button
                type="button"
                className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
              >
                Annuler
              </button>
              <Snippet>
                {`text-[11px] uppercase tracking-[0.32em]
text-white/40 hover:text-white
transition-colors`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Bouton danger — destruction confirmée">
              <button
                type="button"
                className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-red-300/80"
              >
                Supprimer
              </button>
              <Snippet>
                {`text-white/40 hover:text-red-300/80
text-[11px] uppercase tracking-[0.32em]`}
              </Snippet>
            </ComponentRow>
          </div>

          <div className="mt-8 flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Card hover-fill — élément cliquable d'une grille">
              <button
                type="button"
                className="group relative flex w-full max-w-sm flex-col gap-4 bg-black p-6 text-left transition-colors duration-500 ease-out hover:bg-white/[0.03] md:p-7"
              >
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 transition-colors duration-500 group-hover:text-white/55">
                  01 / 06
                </span>
                <span className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7] text-2xl">
                  Title
                </span>
                <span className="font-serif text-sm italic text-white/55">
                  Tagline en serif italique.
                </span>
                <span className="mt-auto inline-flex items-center gap-3 pt-4 text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors duration-500 group-hover:text-white">
                  <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                  <span>Ouvrir</span>
                </span>
              </button>
              <Snippet>
                {`group bg-black hover:bg-white/[0.03]
transition-colors duration-500 ease-out
+ inside : eyebrow 10px, title font-extralight,
  tagline serif italic, action group-hover line`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card pleine — info statique avec hairline en haut">
              <div className="w-full max-w-sm border-t border-white/10 pt-6">
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/40">
                  Section
                </p>
                <p className="mt-3 font-serif text-base italic text-white/65">
                  Une carte sans bordure complète — uniquement marquée par sa
                  hairline supérieure.
                </p>
              </div>
              <Snippet>
                {`border-t border-white/10 pt-6
eyebrow + serif italic body
(approche "moins c'est plus")`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card admin glassmorphism — sidebar / panels">
              <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.08] via-white/[0.025] to-white/[0.005] p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),inset_1px_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-white/[0.06] blur-3xl"
                />
                <p className="relative text-[10px] uppercase tracking-[0.4em] text-white/40">
                  Admin
                </p>
                <p className="relative mt-3 font-sans text-lg font-extralight tracking-[-0.04em] text-[#F5F5F7]">
                  Speetch
                </p>
                <p className="relative mt-1 text-[13px] font-light text-white/70">
                  clubabrazo@gmail.com
                </p>
              </div>
              <Snippet>
                {`rounded-2xl border border-white/[0.08]
bg-gradient-to-br from-white/[0.08]
  via-white/[0.025] to-white/[0.005]
backdrop-blur-2xl
+ halo: -left-12 -top-12 w-40 h-40 rounded-full
  bg-white/[0.06] blur-3xl`}
              </Snippet>
            </ComponentRow>
          </div>

          <div className="mt-8 flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Hairline horizontale — séparateur de section">
              <div className="w-full max-w-md">
                <hr className="border-t border-white/10" />
                <p className="mt-3 font-mono text-[10px] text-white/30">
                  border-t border-white/10
                </p>
              </div>
              <Snippet>
                {`border-t border-white/10
ou border-b border-white/10
opacity 10% — assez visible, jamais agressif`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hairline dégradée — bord d'écran technique">
              <div className="w-full max-w-md space-y-1">
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <p className="font-mono text-[10px] text-white/30">
                  bg-gradient-to-r from-transparent via-white/10 to-transparent
                </p>
              </div>
              <Snippet>
                {`h-px bg-gradient-to-r
from-transparent via-white/10 to-transparent
(utilisé en bordure top/bottom du layout root)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hairline pleine — séparation forte">
              <div className="w-full max-w-md">
                <div className="h-px bg-white/40" />
                <p className="mt-3 font-mono text-[10px] text-white/30">
                  h-px bg-white/40
                </p>
              </div>
              <Snippet>
                {`h-px bg-white/40
pour signaler une coupure structurelle
(ex: total dans un tableau budget)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hairline qui s'étend au hover — pattern phare">
              <button
                type="button"
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
              >
                <span>Survole-moi</span>
                <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-16" />
              </button>
              <Snippet>
                {`h-px w-6 bg-current
transition-all duration-500 ease-out
group-hover:w-16
(la signature visuelle Speetch sur tous les CTAs)`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* BOUTONS */}
        <Block
          eyebrow="52 · Boutons"
          title="Toutes les variantes · primary → icon → magnétique"
          intro="Récapitulatif complet des boutons Speetch. La signature : pas de fond plein (sauf rares cas), pas de bordure rectangulaire — un label uppercase + une hairline qui s'étend au hover. Quand le contexte demande un bouton plus présent, on enrichit, mais sans casser la sobriété."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Primary — CTA standard">
              <button
                type="button"
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors duration-300 hover:text-white"
              >
                <span>Action principale</span>
                <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
              </button>
              <Snippet>
                {`group inline-flex items-center gap-3
text-[11px] uppercase tracking-[0.32em]
text-white/75 hover:text-white
+ <span class="h-px w-6 group-hover:w-12
  transition-all duration-500 ease-out" />`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Large — CTA monumental">
              <button
                type="button"
                className="group inline-flex items-center gap-4 text-2xl font-light text-[#F5F5F7] transition-colors md:text-3xl"
              >
                <span>Créer un nouvel espace</span>
                <span className="inline-block h-px w-10 bg-current transition-all duration-500 ease-out group-hover:w-20" />
              </button>
              <Snippet>
                {`text-2xl md:text-3xl font-light
text-[#F5F5F7]
+ ligne w-10 group-hover:w-20
pour les CTAs structurants (landing, empty)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Return — préfixe ligne">
              <button
                type="button"
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors duration-300 hover:text-white"
              >
                <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10" />
                <span>Retour</span>
              </button>
              <Snippet>
                {`même squelette mais hairline AVANT le label
text-white/55 (atténué — c'est un retour)
+ tracking 0.28em (un cran plus serré)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Ghost — utilitaire discret">
              <button
                type="button"
                className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
              >
                Annuler
              </button>
              <Snippet>
                {`text-[11px] uppercase tracking-[0.32em]
text-white/40 hover:text-white
pas de hairline, pas d'icône
pour les actions "marche arrière" sans accent`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Danger — destruction">
              <button
                type="button"
                className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-red-300/80"
              >
                Supprimer
              </button>
              <Snippet>
                {`text-white/40 hover:text-red-300/80
même squelette que ghost
juste hover passe en red
+ window.confirm() obligatoire avant`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Filled — rare, accent fort">
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-full bg-[#F5F5F7] px-5 py-2 text-[11px] uppercase tracking-[0.32em] text-black transition-colors hover:bg-white"
              >
                <span>Valider</span>
                <span className="inline-block h-px w-4 bg-current" />
              </button>
              <Snippet>
                {`rounded-full bg-[#F5F5F7] text-black
px-5 py-2
hover:bg-white (un peu plus blanc)
réservé aux écrans qui demandent
un seul CTA très visible (modale,
confirmation, paywall)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Secondary filled — moins prominent">
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-[11px] uppercase tracking-[0.32em] text-white/85 transition-colors hover:border-white/40 hover:bg-white/[0.08]"
              >
                <span>Suivant</span>
                <span className="inline-block h-px w-4 bg-current" />
              </button>
              <Snippet>
                {`rounded-full border border-white/15
bg-white/[0.04] px-5 py-2
text-white/85
hover:border-white/40 hover:bg-white/[0.08]
alternative au filled blanc
quand le contexte est déjà dense`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Icon-only — carré avec aria-label">
              <div className="flex w-full max-w-md items-center gap-4">
                <button
                  type="button"
                  aria-label="Fermer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-white/55 transition-colors hover:border-white/40 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Recherche"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/55 transition-colors hover:border-white/40 hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Paramètres"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-white/55 transition-colors hover:border-white/40 hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M5 19 L7 17 M17 7 L19 5" />
                  </svg>
                </button>
              </div>
              <Snippet>
                {`<button aria-label="Action"
  class="inline-flex h-8 w-8
    items-center justify-center
    rounded-md border border-white/10
    text-white/55
    hover:border-white/40 hover:text-white">
  <Icon aria-hidden />
</button>
tailles : h-8 w-8 (compact) ou h-10 w-10
rounded-md (carré) ou rounded-full
aria-label OBLIGATOIRE`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Icon + label — combo expressif">
              <button
                type="button"
                className="group inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-white/75 transition-colors hover:border-white/40 hover:text-white"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Nouveau</span>
              </button>
              <Snippet>
                {`<button class="group inline-flex items-center
  gap-2 rounded-md border border-white/10
  px-3 py-2
  text-[11px] uppercase tracking-[0.28em]
  text-white/75
  hover:border-white/40 hover:text-white">
  <Icon aria-hidden />
  <span>{label}</span>
</button>
icon TRÈS petit (h-3 w-3 ou 12×12)
pour ne pas concurrencer le label`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Round — bouton cercle (FAB style)">
              <button
                type="button"
                aria-label="Ajouter"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-[#0a0a0a] text-[#F5F5F7] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.7)] transition-all hover:border-white/85 hover:scale-105"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <Snippet>
                {`<button aria-label="..." class="h-12 w-12
  rounded-full border border-white/40
  bg-[#0a0a0a]
  shadow-[0_8px_30px_-8px_rgba(0,0,0,0.7)]
  hover:border-white/85 hover:scale-105
  transition-all duration-300">
position fixed bottom-6 right-6 pour
le pattern Floating Action Button
réservé aux pages mobiles ou
quand le main CTA reste accessible`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Avec badge — compteur attaché">
              <button
                type="button"
                className="group relative inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
              >
                <span>Notifications</span>
                <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-300/20 px-1.5 font-mono text-[9px] text-emerald-200/85">
                  3
                </span>
              </button>
              <Snippet>
                {`<button class="relative inline-flex
  items-center gap-3 ...">
  <span>{label}</span>
  <span class="inline-flex h-4 min-w-[1rem]
    rounded-full bg-emerald-300/20
    px-1.5 font-mono text-[9px]
    text-emerald-200/85">
    {count}
  </span>
</button>
masquer le badge si count === 0`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Avec raccourci kbd — power user hint">
              <button
                type="button"
                className="group inline-flex items-center justify-between gap-6 rounded-md border border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:border-white/40 hover:text-white"
              >
                <span>Recherche globale</span>
                <span className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </button>
              <Snippet>
                {`<button class="flex items-center
  justify-between gap-6
  border border-white/10 rounded-md
  px-4 py-3 text-[11px] uppercase
  tracking-[0.32em]">
  <span>{label}</span>
  <span class="flex gap-1">
    <Kbd>⌘</Kbd>
    <Kbd>K</Kbd>
  </span>
</button>
le kbd a aussi un effet utilitaire :
signale "tu peux invoquer au clavier"`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Link — comme un texte sous-ligné">
              <p className="w-full max-w-md text-[13px] leading-relaxed text-white/75">
                Voir tous les{" "}
                <button
                  type="button"
                  className="border-b border-dotted border-white/40 text-white/85 transition-colors hover:border-white hover:text-white"
                >
                  templates HTML
                </button>{" "}
                disponibles.
              </p>
              <Snippet>
                {`<button class="border-b border-dotted
  border-white/40 text-white/85
  hover:border-white hover:text-white
  transition-colors">
  {label inline}
</button>
pour les actions inline dans un paragraphe
border-b dotted (sub-style)
+ couleur plus chaude que le body autour`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Chip avec × — filtre actif">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/85">
                Campagne Meta
                <button
                  type="button"
                  aria-label="Retirer ce filtre"
                  className="text-white/45 transition-colors hover:text-white"
                >
                  ×
                </button>
              </span>
              <Snippet>
                {`<span class="inline-flex items-center
  gap-2 rounded-full border border-white/40
  bg-white/[0.04] px-3 py-1
  text-[10px] uppercase tracking-[0.28em]
  text-white/85">
  {label}
  <button aria-label="Retirer"
    class="text-white/45 hover:text-white">
    ×
  </button>
</span>
le × est dans le chip — clic = remove`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Group — segmented control">
              <div className="inline-flex w-fit gap-px overflow-hidden rounded-full bg-white/[0.08] p-px">
                {[
                  { label: "Mois", active: true },
                  { label: "Année", active: false },
                  { label: "Tout", active: false },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    className={`rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.28em] transition-colors ${
                      b.active
                        ? "bg-white/[0.06] text-[#F5F5F7]"
                        : "bg-black text-white/55 hover:text-white"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <Snippet>
                {`inline-flex w-fit gap-px p-px
rounded-full bg-white/[0.08]
chaque bouton :
  rounded-full px-4 py-1.5
  active : bg-white/[0.06] text-[#F5F5F7]
  inactive : bg-black text-white/55
pour les sélections exclusives 2-4 options
(filtres date, vue, segment)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Avec dropdown — bouton + chevron">
              <button
                type="button"
                className="group inline-flex items-center gap-3 rounded-md border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:border-white/40 hover:text-white"
              >
                <span>Trier par date</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9 L12 15 L18 9" />
                </svg>
              </button>
              <Snippet>
                {`<button class="inline-flex items-center gap-3
  rounded-md border border-white/10
  px-3 py-2 ...">
  <span>{currentValue}</span>
  <ChevronDown class="h-2.5 w-2.5" />
</button>
+ ouvre un menu en-dessous au click
ou un <select> custom-styled
chevron pivote au open (rotate-180)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pending — loading + disabled">
              <button
                type="button"
                disabled
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white disabled:cursor-wait disabled:opacity-50"
              >
                <span>Enregistrement…</span>
                <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
              </button>
              <Snippet>
                {`<button disabled={pending}
  class="disabled:cursor-wait
    disabled:opacity-50">
  {pending ? "Enregistrement…" : "Enregistrer"}
</button>
texte au présent continu (Speetch convention)
opacity-50 + cursor-wait
JAMAIS de spinner — la sobriété fait l'effet`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Success — état après save">
              <button
                type="button"
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-emerald-300/85 transition-colors hover:text-emerald-200"
              >
                <span className="inline-flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="4 12 10 18 20 6" />
                  </svg>
                  <span>Enregistré</span>
                </span>
              </button>
              <Snippet>
                {`text-emerald-300/85 hover:text-emerald-200
+ icône check à gauche
état transitoire (2s puis revient à idle)
ou persistant si le contexte le justifie`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Disabled — désactivé">
              <button
                type="button"
                disabled
                className="text-[11px] uppercase tracking-[0.32em] text-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Action indisponible
              </button>
              <Snippet>
                {`<button disabled
  class="disabled:cursor-not-allowed
    disabled:opacity-50">
  {label}
</button>
opacity-50 + cursor-not-allowed
préférer afficher un tooltip
  expliquant pourquoi c'est disabled
plutôt que laisser l'user deviner`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Active / selected — état persistant">
              <div className="flex w-full max-w-md gap-3">
                <button
                  type="button"
                  className="rounded-md border border-[#F5F5F7]/85 bg-white/[0.06] px-3 py-2 text-[11px] uppercase tracking-[0.32em] text-[#F5F5F7] ring-1 ring-inset ring-white/40"
                >
                  Sélectionné
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:border-white/40 hover:text-white"
                >
                  Non
                </button>
              </div>
              <Snippet>
                {`active : border-[#F5F5F7]/85
+ bg-white/[0.06]
+ ring-1 ring-inset ring-white/40
+ text-[#F5F5F7]
pour les choix multiples qui restent
allumés tant que l'user ne les retire pas
(filtres, options de visualisation)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="More — menu 3-dots">
              <button
                type="button"
                aria-label="Plus d'actions"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <span className="font-mono text-base tracking-[0.1em]">⋯</span>
              </button>
              <Snippet>
                {`<button aria-label="Plus d'actions"
  class="h-7 w-7 rounded-md
    flex items-center justify-center
    text-white/55
    hover:bg-white/[0.04] hover:text-white">
  ⋯
</button>
caractère U+22EF (horizontal ellipsis)
plus aérien que "..."
ouvre un dropdown menu au click`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Magnétique — hover qui suit le curseur">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`function MagneticButton({ children, strength = 0.3 }) {
  const ref = useRef<HTMLButtonElement>(null);
  function onMove(e: MouseEvent) {
    const btn = ref.current; if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width / 2) * strength;
    const dy = (e.clientY - rect.top - rect.height / 2) * strength;
    btn.style.transform = \`translate(\${dx}px, \${dy}px)\`;
  }
  function onLeave() {
    if (ref.current) ref.current.style.transform = '';
  }
  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      class="transition-transform duration-300 ease-out"
    >{children}</button>
  );
}`}
              </pre>
              <Snippet>
                {`pattern FWA :
le bouton "attire" le curseur quand
il s'en approche.
strength 0.2-0.4 — au-delà devient gimmick
réservé aux CTAs uniques de page (hero)
+ transition au mouse leave pour
  un retour fluide`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Ghost border — hover qui dessine la border">
              <button
                type="button"
                className="group relative inline-flex items-center gap-3 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-white/65 transition-colors hover:text-white"
              >
                <span className="absolute inset-0 rounded-md border border-white/10 transition-colors group-hover:border-white/85" />
                <span className="relative">Survole pour border</span>
                <span className="relative inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-8" />
              </button>
              <Snippet>
                {`<button class="group relative px-4 py-2">
  <span class="absolute inset-0 rounded-md
    border border-white/10
    group-hover:border-white/85
    transition-colors duration-500" />
  <span class="relative">{label}</span>
</button>
border qui s'éclaircit au hover
plus expressif qu'un simple text-shift
pour les actions "principales secondaires"`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Submit avec confirm — destructive">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`function handleDelete(e: React.MouseEvent) {
  e.preventDefault();
  if (!window.confirm(
    \`Supprimer "\${name}" ? Cette action
    est définitive — \${usage} pages l'utilisent.\`
  )) return;
  startTransition(() => deleteAction(id));
}

<button onClick={handleDelete}
  className="text-white/40 hover:text-red-300/80">
  Supprimer
</button>`}
              </pre>
              <Snippet>
                {`window.confirm avec message complet :
- action en clair ("Supprimer X")
- conséquence ("définitive")
- impact ("N éléments touchés")
+ startTransition pour le state pending
règle Speetch : pas de modal custom
pour les confirms simples — le native suffit`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Anatomie complète — checklist par bouton">
              <ul className="flex w-full max-w-md flex-col gap-2 text-[12px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Type
                  </span>
                  <span>button (par défaut) — submit / reset si dans form</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Label
                  </span>
                  <span>verbe à l&apos;impératif court (« Enregistrer », « Supprimer », « Suivant »)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Aria
                  </span>
                  <span>aria-label si icon-only · aria-describedby si tooltip</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Focus
                  </span>
                  <span>focus-visible:outline avec couleur palette</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    States
                  </span>
                  <span>idle / hover / pending / success / disabled — chacun documenté</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Transition
                  </span>
                  <span>colors 300ms + hairline 500ms (décalage signature)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Cursor
                  </span>
                  <span>default sur button · cursor-wait pendant pending · cursor-not-allowed disabled</span>
                </li>
              </ul>
              <Snippet>
                {`avant de coder un bouton, valider :
1. quelle action (verbe précis) ?
2. quelle hiérarchie (primary / secondary / ghost) ?
3. icône nécessaire (oui = label visible aussi) ?
4. quels états (au moins idle + hover + disabled) ?
5. raccourci clavier disponible ?
6. confirm requis si destructif ?
+ aria-label si le contenu visible ne suffit pas`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Don't — usages à éviter">
              <ul className="flex w-full max-w-md flex-col gap-3 text-[12px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>Couleurs vives (bleu, orange, jaune) — palette stricte.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>Bouton sans label visible (sauf icon-only avec aria-label).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>Plus d&apos;un bouton primary par section.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>Verbes vagues («&#8239;OK&#8239;», «&#8239;Action&#8239;»).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>Bouton avec font-weight &gt; 400 (toujours light / extralight).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>
                    Spinner / loader rotatif — préférer le présent continu en texte.
                  </span>
                </li>
              </ul>
              <Snippet>
                {`règle d'or : un écran a 1 primary max,
1-3 secondaires, autant de ghost que nécessaire
pour le reste, suivre les patterns
documentés ici. si un design demande
quelque chose hors de la grille,
remettre en question le besoin
plutôt que d'ajouter une variante.`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* CARD VARIANTS */}
        <Block
          eyebrow="55 · Card variants"
          title="Toutes les cards · cover · KPI · expandable · link"
          intro="Récapitulatif complet des cards Speetch — au-delà des 3 variantes de la section 05. Toutes partagent le même squelette de base (bg-black ou bg-white/[0.02], rounded-md, padding p-6/p-7). C'est leur intérieur qui change selon l'usage."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Card hover-fill — pattern de base">
              <button
                type="button"
                className="group relative flex w-full max-w-sm flex-col gap-4 bg-black p-5 text-left transition-colors duration-500 ease-out hover:bg-white/[0.03]"
              >
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 transition-colors duration-500 group-hover:text-white/55">
                  01 / 06
                </span>
                <span className="font-sans text-xl font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                  Title
                </span>
                <span className="font-serif text-sm italic text-white/55">
                  Tagline en italique éditoriale.
                </span>
                <span className="mt-auto inline-flex items-center gap-3 pt-3 text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors duration-500 group-hover:text-white">
                  <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                  <span>Ouvrir</span>
                </span>
              </button>
              <Snippet>
                {`group bg-black hover:bg-white/[0.03]
transition-colors duration-500 ease-out
+ eyebrow + titre + tagline + action`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card avec image cover — top media">
              <div className="w-full max-w-sm overflow-hidden rounded-md border border-white/10 bg-black">
                <div className="aspect-[16/9] w-full bg-gradient-to-br from-white/[0.10] via-white/[0.04] to-white/[0.02]" />
                <div className="flex flex-col gap-2 p-4">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                    Case study
                  </span>
                  <span className="font-sans text-lg font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    Club Abrazo · Brief
                  </span>
                  <span className="font-serif text-sm italic text-white/55">
                    Campagne intemporelle, trois directions.
                  </span>
                </div>
              </div>
              <Snippet>
                {`<div class="rounded-md border border-white/10
  bg-black overflow-hidden">
  <div class="aspect-[16/9]">
    <Image fill class="object-cover" />
  </div>
  <div class="p-4 flex flex-col gap-2">
    {eyebrow + title + tagline}
  </div>
</div>
pour les listes visuelles (projets,
livrables, références)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card stat KPI — valeur + delta">
              <div className="grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-md bg-white/[0.08]">
                <div className="flex flex-col gap-2 bg-black p-4">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                    Candidatures · 30j
                  </span>
                  <span className="font-sans text-3xl font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    142
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-emerald-300/80">
                    + 12% · vs 30j
                  </span>
                </div>
                <div className="flex flex-col gap-2 bg-black p-4">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                    CPM moyen
                  </span>
                  <span className="font-sans text-3xl font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    17<em className="font-serif italic font-light">€</em>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                    − 5% · vs 30j
                  </span>
                </div>
              </div>
              <Snippet>
                {`pattern stat (déjà en 29 · Charts) :
- label uppercase white/45
- value font-extralight tracking-[-0.03em]
- delta : emerald si +, red si −
+ unité en font-serif italique en suffixe
gridé en colonnes pour dashboard`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card avec footer action — CTA en bas">
              <div className="flex w-full max-w-sm flex-col gap-3 rounded-md border border-white/10 bg-black p-5">
                <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                  Template
                </span>
                <span className="font-sans text-lg font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                  Brief production
                </span>
                <p className="font-serif text-sm italic text-white/55">
                  Page document éditoriale type Club Abrazo.
                </p>
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                    7 sections
                  </span>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-white/75 hover:text-white"
                  >
                    <span>Utiliser</span>
                    <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-10" />
                  </button>
                </div>
              </div>
              <Snippet>
                {`<div class="rounded-md border border-white/10
  bg-black p-5 flex flex-col gap-3">
  {eyebrow + title + body}
  <div class="border-t border-white/10
    pt-3 flex justify-between">
    <span>{meta}</span>
    <button>Action →</button>
  </div>
</div>
le footer ancre l'action principale
le reste de la card devient lisible`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card horizontale — image gauche + texte droite">
              <div className="grid w-full max-w-md grid-cols-[80px_1fr] gap-4 rounded-md border border-white/10 bg-black p-3">
                <div className="aspect-square bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
                <div className="flex flex-col justify-center gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Direction 01
                  </span>
                  <span className="font-sans text-base font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    Avant les mots
                  </span>
                  <span className="font-serif text-xs italic text-white/55">
                    Le silence du début.
                  </span>
                </div>
              </div>
              <Snippet>
                {`grid grid-cols-[80px_1fr] gap-4
+ image aspect-square à gauche
+ contenu vertically centered à droite
pour les listes denses (mini-livrables,
items de médiathèque, références)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card expandable — accordion natif">
              <details className="w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black [&[open]>summary>span:last-child]:rotate-180">
                <summary className="flex cursor-pointer list-none items-center justify-between p-4 transition-colors hover:bg-white/[0.02]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                      Phase 02
                    </span>
                    <span className="font-sans text-base font-extralight tracking-[-0.02em] text-[#F5F5F7]">
                      Candidatures
                    </span>
                  </div>
                  <span className="text-white/40 transition-transform duration-300">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M6 9 L12 15 L18 9" />
                    </svg>
                  </span>
                </summary>
                <div className="border-t border-white/10 p-4">
                  <p className="font-serif text-sm italic text-white/55">
                    J–18 → J–3 · 660 €. A/B D1 vs D2 sur 15 jours, basculement
                    automatique vers la direction la plus performante.
                  </p>
                </div>
              </details>
              <Snippet>
                {`<details class="rounded-md border border-white/10
  bg-black overflow-hidden
  [&[open]>summary>span:last-child]:rotate-180">
  <summary class="cursor-pointer list-none
    flex justify-between p-4">
    <div>{eyebrow + title}</div>
    <ChevronDown class="transition-transform" />
  </summary>
  <div class="border-t p-4">{body}</div>
</details>
chevron pivote au open
border-t pour séparer le body du header`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card link référence externe">
              <div
                role="link"
                className="group flex w-full max-w-md items-center gap-3 rounded-md border border-white/10 bg-black p-3 transition-colors hover:border-white/40"
              >
                <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-white/15 bg-white/[0.02]">
                  <span className="font-mono text-[10px] text-white/55">
                    A
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[12px] text-white/85">
                    clubabrazo.com
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    https://clubabrazo.com/candidater
                  </span>
                </div>
                <span className="text-white/40 transition-colors group-hover:text-white">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M14 4 H20 V10" />
                    <line x1="20" y1="4" x2="11" y2="13" />
                  </svg>
                </span>
              </div>
              <Snippet>
                {`<a class="group flex items-center gap-3
  rounded-md border border-white/10 p-3
  hover:border-white/40">
  <Favicon class="h-8 w-8 rounded-sm" />
  <div class="flex flex-col">
    <span>{site name}</span>
    <span class="font-mono text-[10px]
      text-white/40">{full url}</span>
  </div>
  <ExternalLink aria-hidden />
</a>
pour les liens vers le site client, doc externe`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card list item — compact dans une liste">
              <ul className="flex w-full max-w-md flex-col">
                {[
                  { name: "Brief de production", time: "il y a 2h" },
                  { name: "Brief shooting", time: "hier" },
                  { name: "Plan média Meta", time: "il y a 3 jours" },
                ].map((p) => (
                  <li
                    key={p.name}
                    className="flex items-baseline justify-between gap-4 border-b border-white/10 py-3 last:border-b-0"
                  >
                    <span className="text-[13px] font-light text-white/85">
                      {p.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
                      {p.time}
                    </span>
                  </li>
                ))}
              </ul>
              <Snippet>
                {`<li class="flex justify-between
  border-b border-white/10 py-3
  last:border-b-0">
  <span>{name}</span>
  <span class="font-mono text-[10px]
    uppercase tracking-[0.32em]
    text-white/40">{meta}</span>
</li>
pour les listes verticales denses
(pages d'un projet, activités récentes)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card avec hover overlay — image + caption au survol">
              <div className="group relative aspect-[5/4] w-full max-w-sm overflow-hidden rounded-md border border-white/10 bg-gradient-to-br from-white/[0.10] to-white/[0.02]">
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 transition-transform duration-500 ease-out group-hover:translate-y-0">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/65">
                    Direction 01
                  </span>
                  <p className="mt-1 font-sans text-base font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    Avant les mots
                  </p>
                </div>
              </div>
              <Snippet>
                {`<div class="group relative aspect-[5/4]
  overflow-hidden">
  <Image fill class="object-cover" />
  <div class="absolute inset-x-0 bottom-0
    translate-y-full
    group-hover:translate-y-0
    bg-gradient-to-t from-black/85
    transition-transform duration-500
    ease-out p-4">
    {caption}
  </div>
</div>
texte révélé au survol
+ gradient noir 85% pour lisibilité`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card avec status badge + timestamp">
              <div className="flex w-full max-w-md flex-col gap-3 rounded-md border border-white/10 bg-black p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-sans text-base font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    Campagne mai juin 2026
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-emerald-300/85">
                    <span className="block h-1 w-1 rounded-full bg-emerald-300" />
                    Publié
                  </span>
                </div>
                <span className="font-serif text-xs italic text-white/55">
                  Brief de production · 7 sections · livré.
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                  Modifié il y a 12 min
                </span>
              </div>
              <Snippet>
                {`flex flex-col gap-3 rounded-md p-4
1. titre + status badge (top right)
2. body court (font-serif italic)
3. timestamp footer (font-mono caps)
+ status colorable : emerald / amber / red
pour les listes denses avec contexte
(pages d'un projet, items de tableau)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card avec progress bar">
              <div className="flex w-full max-w-md flex-col gap-3 rounded-md border border-white/10 bg-black p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Phase 2 candidatures
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                    18 / 30j
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <span
                    className="block h-full bg-[#F5F5F7]"
                    style={{ width: "60%" }}
                  />
                </div>
                <span className="font-serif text-xs italic text-white/55">
                  60% du temps écoulé · ratio dans la cible.
                </span>
              </div>
              <Snippet>
                {`flex flex-col gap-3 p-4
1. label + ratio mono (top)
2. <div class="h-1 rounded-full bg-white/[0.08]">
     <span class="h-full bg-[#F5F5F7]"
       style="width: X%" />
   </div>
3. note interprétative (serif italic)
pour signaler une progression
au sein d'une liste de projets`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card avec sceau / avatar">
              <div className="flex w-full max-w-md gap-4 rounded-md border border-white/10 bg-black p-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/40 font-serif text-base italic text-[#F5F5F7]">
                  <em>A</em>
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Espace client
                  </span>
                  <span className="font-sans text-lg font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    Club Abrazo
                  </span>
                  <span className="font-serif text-xs italic text-white/55">
                    2 projets actifs · publié
                  </span>
                </div>
              </div>
              <Snippet>
                {`flex gap-4 rounded-md p-4
1. sceau (initiale Fraunces italique)
2. eyebrow + nom + meta inline
pour les listes de clients
ou les références dans les briefs`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card empty placeholder — état avant chargement">
              <div className="flex w-full max-w-md flex-col gap-3 rounded-md border border-dashed border-white/15 bg-white/[0.02] p-6">
                <span className="block h-2 w-16 bg-white/15" />
                <span className="block h-5 w-2/3 bg-white/15" />
                <span className="block h-1 w-full bg-white/10" />
                <span className="block h-1 w-5/6 bg-white/10" />
                <span className="block h-1 w-4/6 bg-white/10" />
              </div>
              <Snippet>
                {`border-dashed border-white/15
bg-white/[0.02] p-6
+ shapes en blocs : block h-N w-N bg-white/15
pas de shimmer animé — la sobriété fait
suffisamment l'effet d'attente
peut aussi être un état "pas encore" édité`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card admin glassmorphism — sidebar / panels">
              <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.08] via-white/[0.025] to-white/[0.005] p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),inset_1px_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/[0.06] blur-3xl"
                />
                <p className="relative text-[10px] uppercase tracking-[0.4em] text-white/40">
                  Admin
                </p>
                <p className="relative mt-2 font-sans text-lg font-extralight tracking-[-0.04em] text-[#F5F5F7]">
                  Speetch
                </p>
                <p className="relative mt-1 text-[12px] font-light text-white/70">
                  clubabrazo@gmail.com
                </p>
              </div>
              <Snippet>
                {`pattern de la sidebar admin :
rounded-2xl border-white/[0.08]
bg-gradient-to-br + backdrop-blur-2xl
+ halo blur en arrière-plan
+ shadow inset pour le grain de verre
réservé aux UI utilitaires
(sidebar, panels, popovers de mode admin)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card panel pleine — admin paneau de détail">
              <div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Détails du template
                  </span>
                  <button
                    type="button"
                    aria-label="Fermer"
                    className="text-white/45 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/45">Type</span>
                    <span className="text-white/85">Édition libre</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/45">Sections</span>
                    <span className="font-mono text-white/85">7</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/45">Créé</span>
                    <span className="text-white/85">13 mai 2026</span>
                  </div>
                </div>
              </div>
              <Snippet>
                {`rounded-md border-white/10 bg-white/[0.02]
1. header label + close
2. border-t + flex flex-col gap-2
3. chaque ligne : flex justify-between
   label white/45 + value white/85
pour les détails inline d'un item
(détail d'un template, métadata d'un projet)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Anatomie de toutes les cards">
              <ul className="flex w-full max-w-md flex-col gap-3 text-[12px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Background
                  </span>
                  <span>bg-black (sur fond noir) ou bg-white/[0.02] (sur fond moins sombre)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Bordure
                  </span>
                  <span>border-white/10 par défaut · border-white/40 si active</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Radius
                  </span>
                  <span>rounded-md (cards) · rounded-2xl (sidebar / glassmorphism) · rounded-full (chips)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Padding
                  </span>
                  <span>p-3 (compact) · p-4 (standard) · p-5/p-6 (large) · p-7 (cards FWA)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Hover
                  </span>
                  <span>bg-white/[0.03] (clicable) ou border-white/40 (panel passif)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Contenu
                  </span>
                  <span>eyebrow + titre + body + footer/action (4 zones max)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[12ch]">
                    Transition
                  </span>
                  <span>duration-500 ease-out sur bg, border, et children</span>
                </li>
              </ul>
              <Snippet>
                {`règle :
toutes les cards Speetch ont
4 zones visuelles MAX :
1. eyebrow (méta)
2. titre principal
3. body (1-3 lignes)
4. footer ou action
au-delà, on parle d'un panel
ou d'une page entière`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* FORMULAIRES */}
        <Block
          eyebrow="06 · Formulaires"
          title="Inputs · textarea · select · file"
          intro="Tous les champs Speetch partagent le même squelette : label en uppercase tracking 0.32em, input border-b minimaliste sur fond transparent. Pas de bordure complète sauf pour les textarea longues et les fichiers."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Input texte — pattern principal">
              <Field label="Nom du client" hint="obligatoire">
                <input
                  type="text"
                  defaultValue="Club Abrazo"
                  className="w-full border-b border-white/20 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none md:text-2xl"
                />
              </Field>
              <Snippet>
                {`border-b border-white/20 bg-transparent pb-3
font-sans text-xl font-light text-[#F5F5F7]
focus:border-white/80 focus:outline-none
caret-[#F5F5F7] placeholder:text-white/25`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Textarea — texte long structuré">
              <Field label="Description" hint="optionnel">
                <textarea
                  rows={3}
                  defaultValue="Quelques mots sur ce template. Quand l'utiliser, ce qu'il contient…"
                  className="w-full resize-y rounded-md border border-white/10 bg-white/[0.02] p-4 font-serif text-base text-[#F5F5F7]/90 placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Snippet>
                {`w-full resize-y rounded-md
border border-white/10 bg-white/[0.02]
p-4 font-serif text-base
focus:border-white/40 focus:outline-none`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Select — même border-b que les inputs">
              <Field label="Type de projet" hint="aucun = tous types">
                <select
                  defaultValue="campagne_meta"
                  className="border-b border-white/20 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-[#F5F5F7] focus:border-white/80 focus:outline-none"
                >
                  <option value="" className="bg-black text-white/80">
                    Tous types de projet
                  </option>
                  <option value="campagne_meta" className="bg-black text-white/80">
                    Campagne Meta
                  </option>
                  <option value="branding" className="bg-black text-white/80">
                    Branding
                  </option>
                </select>
              </Field>
              <Snippet>
                {`border-b border-white/20 bg-transparent pb-3
font-sans text-lg font-light text-[#F5F5F7]
focus:border-white/80 focus:outline-none
+ <option class="bg-black text-white/80">`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Input fichier — file: pseudo-elements">
              <Field label="Page HTML" hint="max 2 MB">
                <input
                  type="file"
                  className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-white/80 hover:file:bg-white/20"
                />
              </Field>
              <Snippet>
                {`file:mr-4 file:rounded-md file:border-0
file:bg-white/10 file:px-4 file:py-2
file:text-[11px] file:uppercase
file:tracking-[0.32em] hover:file:bg-white/20`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Checkbox — accent natif">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 cursor-pointer accent-[#F5F5F7]"
                />
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  Publier cette page immédiatement
                </span>
              </label>
              <Snippet>
                {`h-4 w-4 cursor-pointer accent-[#F5F5F7]
+ label uppercase tracking-[0.32em]
  text-white/55`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Field — wrapper standard label + champ">
              <Field
                label="Hint à droite"
                hint="100 caractères max"
              >
                <input
                  type="text"
                  placeholder="Ton texte ici"
                  className="border-b border-white/20 bg-transparent pb-2 font-sans text-base font-light text-[#F5F5F7] caret-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none"
                />
              </Field>
              <Snippet>
                {`<label class="flex flex-col gap-3">
  <span class="flex justify-between
    text-[11px] uppercase
    tracking-[0.32em] text-white/45">
    <span>Label</span>
    <span class="text-white/25">Hint</span>
  </span>
  <input ... />
</label>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Toggle Publier — bouton avec dot d'état">
              <button
                type="button"
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] transition-colors hover:text-white"
              >
                <span className="block h-1 w-1 rounded-full bg-emerald-300" />
                <span className="text-emerald-300/80">Publiée</span>
                <span className="text-white/40">·</span>
                <span className="text-white/55">Dépublier</span>
              </button>
              <Snippet>
                {`<span class="block h-1 w-1 rounded-full
  bg-emerald-300" />
+ état · séparateur "·" · action`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* BADGES */}
        <Block
          eyebrow="07 · Badges"
          title="Status pills + chips"
          intro="Petits indicateurs en uppercase tracking 0.28em / 0.32em. Trois familles : status (couleur + dot), tags (neutres), action chips (hover-extending)."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Status — Publié (emerald)">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-emerald-300/75">
                <span className="block h-1 w-1 rounded-full bg-emerald-300" />
                Publiée
              </span>
              <Snippet>
                {`inline-flex items-center gap-1.5
text-[10px] uppercase tracking-[0.32em]
text-emerald-300/75
+ dot: h-1 w-1 rounded-full bg-emerald-300`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Status — Brouillon (amber)">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-amber-300/75">
                <span className="block h-1 w-1 rounded-full bg-amber-300" />
                Brouillon
              </span>
              <Snippet>
                {`text-amber-300/75 + dot bg-amber-300
même squelette que emerald
dot 1px × 1px = vie minimaliste`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Status — Erreur (rouge)">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                <span className="block h-1 w-1 rounded-full bg-red-300" />
                En échec
              </span>
              <Snippet>
                {`text-red-300/80 + dot bg-red-300
réservé aux erreurs explicites`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Chip neutre — type / catégorie">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.28em] text-white/70">
                Branding
              </span>
              <Snippet>
                {`inline-flex items-center rounded-full
border border-white/15 bg-white/[0.04]
px-2.5 py-0.5
text-[10px] uppercase tracking-[0.28em]
text-white/70`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Chip atténué — état neutre / vide">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.28em] text-white/45">
                Tous types
              </span>
              <Snippet>
                {`border-white/10 bg-white/[0.02]
text-white/45
pour les valeurs neutres / non-définies`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Chip amber — Reproduction fidèle, attention">
              <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-300/[0.04] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.28em] text-amber-200/80">
                Reproduction fidèle
              </span>
              <Snippet>
                {`border-amber-300/30
bg-amber-300/[0.04]
text-amber-200/80
mode spécial / attention douce`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Chip emerald — confirmation positive">
              <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/[0.04] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.28em] text-emerald-200/85">
                Enregistré
              </span>
              <Snippet>
                {`border-emerald-400/30
bg-emerald-400/[0.04]
text-emerald-200/85
succès, validation`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tag éditorial — minuscule, dense (audience cards)">
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/75">
                  Théâtre
                </span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/75">
                  Pina Bausch
                </span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/75">
                  Festival d&apos;Avignon
                </span>
              </div>
              <Snippet>
                {`rounded-full border border-white/10
px-2 py-1 text-[11px] text-white/75
sans uppercase — tags lisibles
(usage : audience-card, mots-clés)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Numéro de séquence — mono techie">
              <span className="font-mono text-[10px] uppercase tracking-[0.36em] text-white/30">
                03 / 06
              </span>
              <Snippet>
                {`font-mono text-[10px] uppercase
tracking-[0.36em] text-white/30
référence : numéro de chapitre,
indexation FWA`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Compteur d'usage — sobre, en suffixe">
              <span className="font-mono text-[11px] text-white/35">
                <span>2 pages</span>
                <span className="text-white/20"> · </span>
                <span>3 sections</span>
              </span>
              <Snippet>
                {`font-mono text-[11px] text-white/35
+ séparateur "·" en text-white/20
pattern pour stats inline`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* TABLEAUX */}
        <Block
          eyebrow="08 · Tableaux"
          title="Tables · listes · définitions"
          intro="Toujours sans cadre extérieur : juste des hairlines horizontales et un header en uppercase tracking 0.36em. Le total ou la ligne distincte se signale par une hairline plus dense (white/25)."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Tableau budget — hairlines + total">
              <table className="w-full max-w-md border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-white/10 pb-3 pt-0 text-left text-[10px] font-normal uppercase tracking-[0.36em] text-white/45">
                      Phase
                    </th>
                    <th className="border-b border-white/10 pb-3 pt-0 text-right text-[10px] font-normal uppercase tracking-[0.36em] text-white/45">
                      Budget
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-white/10 py-4 align-top font-serif text-base italic text-white/85">
                      Notoriété
                    </td>
                    <td className="border-b border-white/10 py-4 text-right font-sans text-lg font-extralight tracking-[-0.02em] text-[#F5F5F7]">
                      300 €
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-white/10 py-4 align-top font-serif text-base italic text-white/85">
                      Candidatures
                    </td>
                    <td className="border-b border-white/10 py-4 text-right font-sans text-lg font-extralight tracking-[-0.02em] text-[#F5F5F7]">
                      660 €
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-white/10 py-4 align-top font-serif text-base italic text-white/85">
                      Retargeting
                    </td>
                    <td className="border-b border-white/10 py-4 text-right font-sans text-lg font-extralight tracking-[-0.02em] text-[#F5F5F7]">
                      240 €
                    </td>
                  </tr>
                  <tr>
                    <td className="border-t border-white/25 pt-5 align-top text-[11px] uppercase tracking-[0.32em] text-[#F5F5F7]">
                      Total
                    </td>
                    <td className="border-t border-white/25 pt-5 text-right font-sans text-xl font-light tracking-[-0.02em] text-[#F5F5F7]">
                      1 200 €
                    </td>
                  </tr>
                </tbody>
              </table>
              <Snippet>
                {`thead th : text-[10px] uppercase
  tracking-[0.36em] text-white/45
  border-b border-white/10
tbody td : border-b border-white/10 py-4
  + font-serif italic / font-light extralight
total tr : border-t border-white/25 (plus dense)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Liste de pages — pattern projet">
              <ul className="flex w-full max-w-md flex-col border-t border-white/10">
                <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-white/10 py-5">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-lg font-light text-white/80">
                      Brief de production
                    </span>
                    <span className="font-mono text-[11px] text-white/35">
                      /brief-de-production · 13 mai 2026
                    </span>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/45">
                    Éditer
                  </span>
                </li>
                <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-white/10 py-5">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-lg font-light text-white/80">
                      Brief shooting
                    </span>
                    <span className="font-mono text-[11px] text-white/35">
                      /brief-shooting · 13 mai 2026
                    </span>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/45">
                    Éditer
                  </span>
                </li>
              </ul>
              <Snippet>
                {`<ul class="flex flex-col border-t border-white/10">
  <li class="border-b border-white/10 py-5
    flex flex-wrap items-baseline
    justify-between gap-x-6 gap-y-2">
    ...
  </li>
</ul>
pas de bordure latérale, juste hairlines top/bottom`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Définition (dl) — Label : valeur">
              <dl className="grid w-full max-w-md grid-cols-1 gap-3 border-t border-white/10 pt-4 md:grid-cols-[140px_1fr] md:gap-x-8 md:gap-y-4">
                <dt className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                  Cadrage
                </dt>
                <dd className="text-[15px] leading-relaxed text-white/80">
                  Plan resserré buste & mains. Pas de visage entier de face.
                </dd>

                <dt className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                  Lumière
                </dt>
                <dd className="text-[15px] leading-relaxed text-white/80">
                  Tungstène chaud unilatéral.
                </dd>

                <dt className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                  Palette
                </dt>
                <dd className="text-[15px] leading-relaxed text-white/80">
                  Noir mat dominant · accent bordeaux textuel.
                </dd>
              </dl>
              <Snippet>
                {`<dl class="grid grid-cols-1
  md:grid-cols-[140px_1fr]
  gap-3 md:gap-x-8 md:gap-y-4
  border-t border-white/10 pt-4">
  <dt class="text-[10px] uppercase
    tracking-[0.36em] text-white/45" />
  <dd class="text-[15px] text-white/80" />
</dl>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Métadonnées inline — Stats hero">
              <div className="grid w-full max-w-md grid-cols-2 gap-x-8 gap-y-4 border-t border-white/10 pt-5">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                    Durée
                  </span>
                  <span className="font-sans text-2xl font-extralight leading-none tracking-[-0.03em] text-[#F5F5F7]">
                    30
                    <em className="font-serif italic font-light">j</em>
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                    Budget
                  </span>
                  <span className="font-sans text-2xl font-extralight leading-none tracking-[-0.03em] text-[#F5F5F7]">
                    1 200
                    <em className="font-serif italic font-light">€</em>
                  </span>
                </div>
              </div>
              <Snippet>
                {`grid grid-cols-2 md:grid-cols-4
gap-x-12 gap-y-6 border-t pt-6
label : 10px uppercase tracking 0.36em white/45
value : font-extralight tracking -0.03em
unité : font-serif italic en suffixe`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* BREADCRUMBS */}
        <Block
          eyebrow="09 · Breadcrumbs"
          title="Fils d'Ariane Speetch"
          intro="Tracking 0.4em, séparateur '→' en white/20, liens hover white. Item courant en white/55, jamais en lien."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="2 niveaux — Admin → Section">
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
                <span className="cursor-pointer transition-colors hover:text-white">
                  Administration
                </span>
                <span className="mx-3 text-white/20">→</span>
                <span className="text-white/55">Réglages</span>
              </p>
              <Snippet>
                {`text-[11px] uppercase tracking-[0.4em]
text-white/40
<Link>hover:text-white</Link>
<span class="mx-3 text-white/20">→</span>
<span class="text-white/55">current</span>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="3 niveaux — sous-rubrique">
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
                <span className="cursor-pointer transition-colors hover:text-white">
                  Administration
                </span>
                <span className="mx-3 text-white/20">→</span>
                <span className="cursor-pointer transition-colors hover:text-white">
                  Réglages
                </span>
                <span className="mx-3 text-white/20">→</span>
                <span className="text-white/55">Templates</span>
              </p>
              <Snippet>
                {`même squelette, chaque niveau cliquable
sauf le dernier
mx-3 entre items, white/20 sur le '→'`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="4 niveaux — éditeur de page">
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
                <span className="cursor-pointer transition-colors hover:text-white">
                  Espaces clients
                </span>
                <span className="mx-3 text-white/20">→</span>
                <span className="text-white/55">Club Abrazo</span>
                <span className="mx-3 text-white/20">→</span>
                <span className="cursor-pointer transition-colors hover:text-white">
                  Campagne mai juin 2026
                </span>
                <span className="mx-3 text-white/20">→</span>
                <span className="text-white/55">Brief de production</span>
              </p>
              <Snippet>
                {`profondeur max usuelle : 4 niveaux
au-delà, repenser la hiérarchie
le client/projet courant peut être
non-cliquable même au milieu`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Avec type de projet — méta inline">
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
                <span className="cursor-pointer transition-colors hover:text-white">
                  Espaces clients
                </span>
                <span className="mx-3 text-white/20">→</span>
                <span className="text-white/55">Club Abrazo</span>
                <span className="mx-3 text-white/20">·</span>
                <span className="text-white/55">Campagne Meta</span>
              </p>
              <Snippet>
                {`variante : '·' (text-white/20) pour les meta
plutôt que '→' pour distinguer
hiérarchie (→) vs attribut (·)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Mobile compact — retour seul">
              <button
                type="button"
                className="text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
              >
                ← Réglages
              </button>
              <Snippet>
                {`text-[11px] uppercase tracking-[0.28em]
text-white/55 hover:text-white
'← Parent' (caractère "←" littéral)
visible md:hidden — desktop a la sidebar`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Retour Réglages — bouton bas de page">
              <button
                type="button"
                className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
              >
                ← Retour Réglages
              </button>
              <Snippet>
                {`tracking-[0.32em] text-white/40
hover:text-white
à placer en bas de page comme sortie
de secours (escape hatch)`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* MODALES */}
        <Block
          eyebrow="10 · Modales"
          title="Overlays · médiathèque · confirmations"
          intro="Backdrop noir 85% + blur-sm, panel rounded-2xl bg-[#0a0a0a] border white/10. Plein écran sur mobile, centré max-5xl sur desktop. Entrée framer-motion y:18 → 0. Fermeture : Escape ou click hors panel."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Modale médiathèque — pattern principal">
              <div className="relative h-[280px] w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black/85 backdrop-blur-sm">
                {/* Faux backdrop atténué */}
                <div className="absolute inset-0 bg-black/30" aria-hidden />
                {/* Modal panel scaled-down */}
                <div className="absolute inset-3 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
                  <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase tracking-[0.32em] text-white/45">
                        Médiathèque
                      </span>
                      <span className="text-[11px] text-white/55">
                        4 médias
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] uppercase tracking-[0.32em] text-white/75">
                        + Téléverser
                      </span>
                      <span className="text-[9px] uppercase tracking-[0.32em] text-white/40">
                        Fermer
                      </span>
                    </div>
                  </header>
                  <div className="grid flex-1 grid-cols-3 gap-2 p-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-sm border border-white/10 bg-white/[0.04]"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <Snippet>
                {`backdrop : fixed inset-0 z-[80]
  bg-black/85 backdrop-blur-sm
panel : rounded-2xl border border-white/10
  bg-[#0a0a0a] h-[85vh] md:max-w-5xl
header : border-b border-white/10
  px-6 md:px-8 py-5
fermeture : Escape (keydown) + click backdrop`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Confirm natif — window.confirm">
              <div className="w-full max-w-md rounded-md border border-amber-300/20 bg-amber-300/[0.04] px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-amber-200/80">
                  Confirmation requise
                </p>
                <p className="mt-2 font-serif text-sm italic text-white/70 md:text-base">
                  Supprimer ce template ? 2 pages l&apos;utilisent déjà — elles
                  garderont leur contenu mais perdront le lien vers le template.
                </p>
              </div>
              <Snippet>
                {`window.confirm(message)
+ pour actions destructives sans rollback
+ message structuré :
  "Action ? Conséquence détaillée."
pas de modale custom pour les confirms`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Bandeau de mode — info contextuelle">
              <div className="w-full max-w-md rounded-md border border-white/15 bg-white/[0.03] px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/65">
                  Reproduction fidèle
                </p>
                <p className="mt-2 font-serif text-sm italic text-white/55 md:text-base">
                  Le contenu de cette page provient du HTML brut. L&apos;intro
                  et les sections ne sont pas rendues sur la page publique.
                </p>
              </div>
              <Snippet>
                {`rounded-md border border-white/15
bg-white/[0.03] px-5 py-4
eyebrow uppercase tracking-[0.32em] white/65
body font-serif italic white/55
pour signaler un mode d'édition`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Toast — succès enregistrement (sticky bar)">
              <div className="flex w-full max-w-md items-center justify-between gap-6 rounded-2xl border border-white/10 bg-black/65 px-5 py-3 backdrop-blur-md">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/55">
                    3 textes remplacés
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.32em] text-emerald-300/80">
                    Enregistré
                  </span>
                </div>
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white"
                >
                  <span>Enregistrer</span>
                  <span className="inline-block h-px w-5 bg-current transition-all duration-500 ease-out group-hover:w-10" />
                </button>
              </div>
              <Snippet>
                {`sticky bottom-4 z-20
rounded-2xl border border-white/10
bg-black/65 backdrop-blur-md
px-6 py-4
+ contenu : compteur + état + CTA
animation : opacity 0→1 + y -2 → 0
durée : 2s d'affichage success`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Banner erreur — feedback formulaire">
              <p className="w-full max-w-md border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                Le nom du template doit faire au moins 2 caractères.
              </p>
              <Snippet>
                {`border-l-2 border-red-400/40 pl-4
text-[11px] uppercase tracking-[0.32em]
text-red-300/80
pas de fond, pas de cadre :
seule la barre verticale + tracking`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* DROPDOWNS */}
        <Block
          eyebrow="19 · Dropdowns"
          title="Selects · disclosure · tabs · menus"
          intro="Speetch privilégie les composants natifs (select, details) restylés. Les vrais dropdowns custom ne sont utilisés que pour les médiathèques. Tabs en barre segmentée (pattern des directions raw_html)."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Select natif — border-b restylé">
              <Field label="Type de projet" hint="aucun = tous types">
                <select
                  defaultValue="branding"
                  className="border-b border-white/20 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-[#F5F5F7] focus:border-white/80 focus:outline-none"
                >
                  <option value="" className="bg-black text-white/80">
                    Tous types
                  </option>
                  <option value="branding" className="bg-black text-white/80">
                    Branding
                  </option>
                  <option value="campagne_meta" className="bg-black text-white/80">
                    Campagne Meta
                  </option>
                </select>
              </Field>
              <Snippet>
                {`<select class="border-b border-white/20
  bg-transparent pb-3
  font-sans text-lg font-light
  focus:border-white/80 focus:outline-none">
  <option class="bg-black text-white/80">
restyle visuel sans casser l'accessibilité
native (keyboard, screen-reader OK)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Disclosure — details/summary natif">
              <details className="w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-white/[0.02]">
                <summary className="cursor-pointer list-none px-4 py-3 text-[11px] uppercase tracking-[0.32em] text-white/65 transition-colors hover:text-white">
                  <span className="inline-flex w-full items-center justify-between">
                    <span>En savoir plus</span>
                    <span className="text-white/30">+</span>
                  </span>
                </summary>
                <div className="border-t border-white/10 px-4 py-3 font-serif text-sm italic text-white/55">
                  Contenu replié. L&apos;élément <code>&lt;details&gt;</code>
                  {" "}est natif, ouvert/fermé sans JS, accessible par défaut.
                </div>
              </details>
              <Snippet>
                {`<details>
  <summary class="list-none cursor-pointer
    px-4 py-3 text-[11px] uppercase
    tracking-[0.32em] text-white/65">
    <span class="flex justify-between">
      <span>Label</span>
      <span>+</span>
    </span>
  </summary>
  <div class="border-t px-4 py-3">...</div>
</details>
remplace l'accordion JS quand le cas le permet`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tabs segmentés — pattern directions">
              <div className="w-full max-w-md">
                <div
                  role="tablist"
                  className="flex gap-px overflow-hidden rounded-2xl bg-white/[0.08]"
                >
                  {[
                    { id: 1, label: "Avant les mots", active: true },
                    { id: 2, label: "Aveu", active: false },
                    { id: 3, label: "Faire-part", active: false },
                  ].map((t) => (
                    <button
                      key={t.id}
                      role="tab"
                      type="button"
                      aria-selected={t.active}
                      className={`flex-1 px-3 py-3 text-left transition-colors ${
                        t.active
                          ? "bg-white/[0.06] text-[#F5F5F7]"
                          : "bg-black text-white/55 hover:bg-white/[0.02] hover:text-white"
                      }`}
                    >
                      <span className="block text-[9px] uppercase tracking-[0.32em] text-white/40">
                        D{String(t.id).padStart(2, "0")}
                      </span>
                      <span className="mt-1 block text-xs font-light tracking-tight">
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <Snippet>
                {`role="tablist" + flex gap-px
+ chaque tab : flex-1 bg-black
  hover:bg-white/[0.02]
+ active : bg-white/[0.06]
  + text-[#F5F5F7]
+ aria-selected={active}
container rounded-2xl bg-white/[0.08]
(le bg fait le séparateur)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pill switcher — mode ON/OFF horizontal">
              <div className="inline-flex w-fit gap-px overflow-hidden rounded-full bg-white/[0.08] p-px">
                <button
                  type="button"
                  className="rounded-full bg-white/[0.06] px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-[#F5F5F7]"
                >
                  Édition libre
                </button>
                <button
                  type="button"
                  className="rounded-full bg-black px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
                >
                  Reproduction fidèle
                </button>
              </div>
              <Snippet>
                {`inline-flex w-fit gap-px p-px
rounded-full bg-white/[0.08]
chaque option : rounded-full px-4 py-2
active : bg-white/[0.06] text-[#F5F5F7]
inactive : bg-black text-white/55
pour les choix binaires importants`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Menu actions — 3-dot dropdown (pattern)">
              <div className="relative w-full max-w-md">
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-black p-3">
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/70">
                    Brief de production
                  </span>
                  <span
                    aria-label="Actions"
                    className="text-[14px] tracking-[0.2em] text-white/40"
                  >
                    ⋯
                  </span>
                </div>
                <div className="mt-2 flex w-fit flex-col gap-px overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a] py-1">
                  <button
                    type="button"
                    className="px-4 py-2 text-left text-[11px] uppercase tracking-[0.32em] text-white/65 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    Éditer
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-left text-[11px] uppercase tracking-[0.32em] text-white/65 transition-colors hover:bg-white/[0.04] hover:text-white"
                  >
                    Détacher
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-left text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:bg-red-400/[0.04] hover:text-red-300/80"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              <Snippet>
                {`<div class="rounded-md border border-white/10
  bg-[#0a0a0a] py-1 flex flex-col gap-px">
  <button class="px-4 py-2 text-left
    text-[11px] uppercase tracking-[0.32em]
    text-white/65 hover:bg-white/[0.04]
    hover:text-white">
caractère "⋯" U+22EF horizontal ellipsis
plus aérien que trois points "..."`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Listbox modal — médiathèque (custom)">
              <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Sélectionner
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                    4 disponibles
                  </span>
                </div>
                <ul className="grid grid-cols-3 gap-2 p-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <li
                      key={i}
                      className={
                        "aspect-square rounded-sm border bg-white/[0.04] " +
                        (i === 2
                          ? "border-white/70 ring-2 ring-white/40"
                          : "border-white/10 hover:border-white/40")
                      }
                    />
                  ))}
                </ul>
              </div>
              <Snippet>
                {`pour les listes visuelles (images, vidéos)
plutôt que select natif :
- modal avec grille
- onSelect callback côté parent
- onClose via Escape / click backdrop
- highlight ring-2 sur l'item actuel`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Combobox — recherche + résultats">
              <div className="w-full max-w-md space-y-2">
                <Field label="Filtrer par mot-clé">
                  <input
                    type="text"
                    placeholder="Tape pour filtrer…"
                    className="w-full border-b border-white/20 bg-transparent pb-2 font-sans text-base font-light text-[#F5F5F7] focus:border-white/80 focus:outline-none"
                  />
                </Field>
                <ul className="flex flex-col gap-px overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a]">
                  {["Brief de production", "Brief shooting", "Brief direction"].map(
                    (item) => (
                      <li
                        key={item}
                        className="flex items-center justify-between bg-black px-3 py-2 text-[12px] text-white/65 transition-colors hover:bg-white/[0.04] hover:text-white"
                      >
                        <span>{item}</span>
                        <span className="text-[9px] uppercase tracking-[0.32em] text-white/30">
                          ↵
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <Snippet>
                {`input border-b standard
+ <ul> rounded-md border bg-[#0a0a0a]
  flex flex-col gap-px
<li> bg-black hover:bg-white/[0.04]
indicateur "↵" pour signal "valider"
filtrage côté client (input → state)`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* PAGINATION */}
        <Block
          eyebrow="48 · Pagination"
          title="Numéros · prev/next · charger plus · scroll"
          intro="Speetch préfère les listes courtes (≤ 30 items) sans pagination. Au-delà, trois patterns : numéros classiques (peu utilisé), prev/next compact, ou cursor 'Charger plus' (infinite scroll lazy)."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Pagination numérique — page courante highlight">
              <nav
                aria-label="Pagination"
                className="flex w-full max-w-md items-center justify-center gap-2"
              >
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-[0.32em] text-white/45 transition-colors hover:text-white"
                >
                  ← Préc.
                </button>
                <span className="mx-2 text-white/15">·</span>
                {[1, 2, 3].map((n) => {
                  const active = n === 2;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] transition-colors ${
                        active
                          ? "bg-[#F5F5F7] text-black"
                          : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
                <span className="px-1 font-mono text-[11px] text-white/30">
                  …
                </span>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-[11px] text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  12
                </button>
                <span className="mx-2 text-white/15">·</span>
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
                >
                  Suiv. →
                </button>
              </nav>
              <Snippet>
                {`<nav aria-label="Pagination"
  class="flex items-center justify-center gap-2">
  <button>← Préc.</button>
  {pages.map(n => (
    <button class="h-7 w-7 rounded-full"
      aria-current={active ? 'page' : undefined}>
      {n}
    </button>
  ))}
  <span>…</span>
  <button>Suiv. →</button>
</nav>
active : bg-[#F5F5F7] text-black
inactive : text-white/55 hover:bg-white/[0.04]`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Prev/Next compact — ratio inline">
              <nav className="flex w-full max-w-md items-center justify-between border-t border-white/10 pt-4">
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
                >
                  <span className="inline-block h-px w-5 bg-current transition-all duration-500 ease-out group-hover:w-10" />
                  <span>Précédent</span>
                </button>
                <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
                  2 / 8
                </span>
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
                >
                  <span>Suivant</span>
                  <span className="inline-block h-px w-5 bg-current transition-all duration-500 ease-out group-hover:w-10" />
                </button>
              </nav>
              <Snippet>
                {`<nav class="flex items-center
  justify-between border-t pt-4">
  <button>← Précédent</button>
  <span class="font-mono uppercase
    tracking-[0.32em]">N / total</span>
  <button>Suivant →</button>
</nav>
hairlines qui s'étendent au hover
ratio en mono au centre (compact)
pour les listes longues mais
navigables séquentiellement (pages, médias)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Charger plus — cursor-based">
              <div className="flex w-full max-w-md flex-col items-center gap-4 border-t border-white/10 pt-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
                  30 sur 142
                </span>
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white"
                >
                  <span>Charger 30 de plus</span>
                  <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                </button>
              </div>
              <Snippet>
                {`<div class="flex flex-col items-center gap-4
  border-t pt-6">
  <span class="font-mono text-[10px]
    uppercase tracking-[0.32em] text-white/40">
    {loaded} sur {total}
  </span>
  <button>Charger N de plus →</button>
</div>
préféré au numérotage pour les listes
sans navigation séquentielle nécessaire
(activités, médias)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Infinite scroll — sentinel IntersectionObserver">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`useEffect(() => {
  const target = sentinelRef.current;
  if (!target) return;
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && hasMore) {
        loadMore();
      }
    },
    { rootMargin: '200px' }
  );
  observer.observe(target);
  return () => observer.disconnect();
}, [hasMore, loadMore]);`}
              </pre>
              <Snippet>
                {`Pattern infinite scroll silencieux :
- <div ref={sentinelRef} class="h-1" />
  en fin de liste
- observer rootMargin '200px' déclenche
  le fetch 200px avant la fin
- état loading entre 2 fetchs :
  <span class="font-serif italic
    text-white/40">Chargement…</span>
pas de scroll-restoration custom`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Compteur d'items — header de liste">
              <div className="flex w-full max-w-md items-baseline justify-between border-b border-white/10 pb-3">
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  Pages
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/40">
                  12 résultats · page 2
                </span>
              </div>
              <Snippet>
                {`header de liste, à coupler avec pagination
- label de la liste à gauche
- compteur précis à droite (avec page courante)
"12 résultats · page 2"
+ filtres / tri inline si besoin`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pagination cards — grille paginée">
              <div className="flex w-full max-w-md flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-md border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-2"
                    >
                      <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/35">
                        0{i}
                      </span>
                    </div>
                  ))}
                </div>
                <nav className="flex items-center justify-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Page 1 / 4
                  </span>
                  <span className="text-white/15">·</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`block h-1 rounded-full ${
                          i === 1 ? "w-6 bg-[#F5F5F7]" : "w-1 bg-white/25"
                        }`}
                      />
                    ))}
                  </div>
                </nav>
              </div>
              <Snippet>
                {`pour les grilles de cards :
- grille N items par page (3 / 6 / 9)
- nav en dessous : "Page X / Y"
  + dots pagination (w-6 actif, w-1 inactif)
plus FWA-like que les chiffres
préférer pour : moodboards, médias`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pattern actuel Speetch — listes sans pagination">
              <ul className="flex w-full max-w-md flex-col gap-2 text-[13px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>Liste &lt; 30 items : tout afficher d&apos;un coup.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>
                    Liste 30-100 items : limite à 50 + bouton « Charger plus ».
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>
                    Liste &gt; 100 items : pagination numérique ou infinite
                    scroll (selon l&apos;usage).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>
                    Jamais de pagination sur les listes admin (clients, projets,
                    pages) — elles restent en-dessous de 30 dans 99% des cas.
                  </span>
                </li>
              </ul>
              <Snippet>
                {`règle :
- pagination = signal "il y a beaucoup"
- Speetch est plus orienté édito que catalogue
- préférer le scroll vertical court
- la pagination apparaît quand la liste
  dépasse l'horizon naturel de l'écran
+ Supabase limit/range pour les vraies listes longues
  (médiathèque > 500 items par exemple)`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* TABS DÉDIÉ */}
        <Block
          eyebrow="49 · Tabs dédié"
          title="Underline · pill · segmented · vertical"
          intro="Section complète sur les tabs (mention rapide en 19 Dropdowns). Quatre variantes Speetch : underline sobre, pill rounded-full pour les choix binaires, segmented hairline-separator (DirectionsEditor), vertical pour les listes longues."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Underline tabs — sobre, dénombrable">
              <div className="w-full max-w-md">
                <nav role="tablist" className="flex items-center gap-8 border-b border-white/10">
                  {[
                    { label: "Tous", count: 12, active: true },
                    { label: "Publiés", count: 8 },
                    { label: "Brouillons", count: 4 },
                  ].map((t) => (
                    <button
                      key={t.label}
                      role="tab"
                      type="button"
                      aria-selected={t.active}
                      className={`relative inline-flex items-baseline gap-2 pb-3 text-[11px] uppercase tracking-[0.32em] transition-colors ${
                        t.active
                          ? "text-[#F5F5F7]"
                          : "text-white/45 hover:text-white"
                      }`}
                    >
                      <span>{t.label}</span>
                      <span
                        className={`font-mono text-[10px] ${
                          t.active ? "text-white/65" : "text-white/30"
                        }`}
                      >
                        {t.count}
                      </span>
                      {t.active && (
                        <span className="absolute -bottom-px left-0 h-px w-full bg-[#F5F5F7]" />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
              <Snippet>
                {`<nav role="tablist" class="flex gap-8
  border-b border-white/10">
  <button role="tab" aria-selected
    class="relative pb-3 text-[11px]
      uppercase tracking-[0.32em]">
    {label}
    <span class="font-mono text-[10px]">{count}</span>
    {active && <span class="absolute
      -bottom-px h-px w-full bg-[#F5F5F7]" />}
  </button>
</nav>
underline qui chevauche la border-b parent
pattern pour filtres de liste / sections`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pill tabs — binaire ou ternaire">
              <div className="inline-flex w-fit gap-px overflow-hidden rounded-full bg-white/[0.08] p-px">
                {[
                  { label: "Édition libre", active: true },
                  { label: "Reproduction fidèle", active: false },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.32em] transition-colors ${
                      t.active
                        ? "bg-white/[0.06] text-[#F5F5F7]"
                        : "bg-black text-white/55 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Snippet>
                {`inline-flex w-fit p-px gap-px
rounded-full bg-white/[0.08]
chaque pill : rounded-full px-4 py-2
active : bg-white/[0.06] text-[#F5F5F7]
inactive : bg-black text-white/55
pour les choix binaires importants
(édition libre vs reproduction fidèle,
mode clair vs sombre, on/off)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Segmented — directions / sections (pattern raw_html)">
              <div className="flex w-full max-w-md flex-wrap gap-px overflow-hidden rounded-2xl bg-white/[0.08]">
                {[
                  { id: "01", label: "Avant les mots", active: true },
                  { id: "02", label: "La danse comme aveu" },
                  { id: "03", label: "Le faire-part" },
                ].map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    type="button"
                    aria-selected={t.active}
                    className={`flex-1 px-4 py-3 text-left transition-colors ${
                      t.active
                        ? "bg-white/[0.06] text-[#F5F5F7]"
                        : "bg-black text-white/55 hover:bg-white/[0.02] hover:text-white"
                    }`}
                  >
                    <span className="block text-[9px] uppercase tracking-[0.32em] text-white/40">
                      Direction {t.id}
                    </span>
                    <span className="mt-1 block text-xs font-light tracking-tight">
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
              <Snippet>
                {`<nav role="tablist" class="flex gap-px
  overflow-hidden rounded-2xl
  bg-white/[0.08]">
  <button role="tab" aria-selected
    class="flex-1 px-4 py-3 text-left">
    <span class="text-[9px] uppercase
      tracking-[0.32em] white/40">
      {prefix}
    </span>
    <span class="mt-1 text-xs font-light">
      {label}
    </span>
  </button>
</nav>
pattern de DirectionsEditor (raw_html)
chaque tab : 2 lignes (eyebrow + label)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tabs verticaux — sidebar style">
              <div className="grid w-full max-w-md grid-cols-[140px_1fr] gap-6">
                <nav role="tablist" className="flex flex-col gap-2">
                  {[
                    { label: "Mon profil", active: true },
                    { label: "Design System" },
                    { label: "Templates" },
                    { label: "API" },
                    { label: "Sécurité" },
                  ].map((t) => (
                    <button
                      key={t.label}
                      role="tab"
                      type="button"
                      aria-selected={t.active}
                      className={`group inline-flex items-center gap-3 text-left text-[11px] uppercase tracking-[0.32em] transition-colors ${
                        t.active
                          ? "text-[#F5F5F7]"
                          : "text-white/45 hover:text-white"
                      }`}
                    >
                      <span
                        className={`inline-block h-px transition-all duration-500 ease-out ${
                          t.active
                            ? "w-8 bg-[#F5F5F7]"
                            : "w-3 bg-current group-hover:w-6"
                        }`}
                      />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </nav>
                <div className="rounded-md border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Contenu de l&apos;onglet
                  </span>
                  <p className="mt-2 font-serif text-sm italic text-white/55">
                    Le contenu actif se rend à droite. Pas d&apos;animation
                    franche entre tabs — juste un fade léger via key&nbsp;=
                    activeTab.
                  </p>
                </div>
              </div>
              <Snippet>
                {`grid grid-cols-[140px_1fr] gap-6
gauche : <nav role="tablist" flex-col gap-2>
  hairlines qui s'étendent au hover
  active : w-8 bg-[#F5F5F7] white text
droite : panel rounded-md border
pour les pages de réglages avec
beaucoup de sections (à venir)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tabs avec icône — option visuelle">
              <nav role="tablist" className="flex w-full max-w-md items-center gap-2 border-b border-white/10 pb-3">
                {[
                  { label: "Texte", icon: "type", active: true },
                  { label: "Image", icon: "image" },
                  { label: "Vidéo", icon: "video" },
                  { label: "Embed", icon: "link" },
                ].map((t) => (
                  <button
                    key={t.label}
                    role="tab"
                    type="button"
                    aria-selected={t.active}
                    className={`relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-[11px] uppercase tracking-[0.28em] transition-colors ${
                      t.active
                        ? "bg-white/[0.06] text-[#F5F5F7]"
                        : "text-white/55 hover:bg-white/[0.02] hover:text-white"
                    }`}
                  >
                    <span aria-hidden className="block h-3 w-3 rounded-sm border border-current opacity-70" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </nav>
              <Snippet>
                {`<button class="rounded-md px-3 py-2
  flex items-center gap-2">
  <Icon aria-hidden />
  <span>{label}</span>
</button>
icône + label
active : bg-white/[0.06]
pour les sélecteurs de type
(text / image / video / embed)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tabs avec badge — compteur d'activité">
              <nav role="tablist" className="flex w-full max-w-md items-center gap-6 border-b border-white/10">
                {[
                  { label: "Inbox", count: 3, urgent: true, active: true },
                  { label: "Brouillons", count: 12 },
                  { label: "Envoyés" },
                ].map((t) => (
                  <button
                    key={t.label}
                    role="tab"
                    type="button"
                    aria-selected={t.active}
                    className={`relative inline-flex items-center gap-2 pb-3 text-[11px] uppercase tracking-[0.32em] transition-colors ${
                      t.active
                        ? "text-[#F5F5F7]"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    <span>{t.label}</span>
                    {typeof t.count === "number" && (
                      <span
                        className={`inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1.5 font-mono text-[9px] ${
                          t.urgent
                            ? "bg-emerald-300/20 text-emerald-200/85"
                            : "bg-white/[0.06] text-white/55"
                        }`}
                      >
                        {t.count}
                      </span>
                    )}
                    {t.active && (
                      <span className="absolute -bottom-px left-0 h-px w-full bg-[#F5F5F7]" />
                    )}
                  </button>
                ))}
              </nav>
              <Snippet>
                {`<span class="inline-flex h-4 min-w-[1rem]
  rounded-full px-1.5 font-mono text-[9px]
  bg-emerald-300/20 text-emerald-200/85">
  {count}
</span>
badge inline à droite du label
emerald si compteur "actif" (à voir)
white si compteur neutre
masqué si 0`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tabs avec overflow — scroll horizontal">
              <nav
                role="tablist"
                className="flex w-full max-w-md items-center gap-6 overflow-x-auto border-b border-white/10 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {[
                  "Vue d'ensemble",
                  "Audiences",
                  "Budget",
                  "Directions",
                  "Storyboard",
                  "A/B Tests",
                  "Suites",
                ].map((label, i) => (
                  <button
                    key={label}
                    role="tab"
                    type="button"
                    aria-selected={i === 0}
                    className={`relative shrink-0 pb-3 text-[11px] uppercase tracking-[0.32em] transition-colors ${
                      i === 0
                        ? "text-[#F5F5F7]"
                        : "text-white/45 hover:text-white"
                    }`}
                  >
                    <span>{label}</span>
                    {i === 0 && (
                      <span className="absolute -bottom-px left-0 h-px w-full bg-[#F5F5F7]" />
                    )}
                  </button>
                ))}
              </nav>
              <Snippet>
                {`overflow-x-auto + shrink-0 sur chaque tab
+ [scrollbar-width:none]
+ [&::-webkit-scrollbar]:hidden
pour les longues listes de tabs
(rapport multi-chapitres, dashboard
multi-métriques)
swipe natif sur mobile`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tabs avec disabled — étape verrouillée">
              <nav role="tablist" className="flex w-full max-w-md items-center gap-6 border-b border-white/10 pb-3">
                {[
                  { label: "Brief", active: true },
                  { label: "Design" },
                  { label: "Production", disabled: true },
                  { label: "Livraison", disabled: true },
                ].map((t) => (
                  <button
                    key={t.label}
                    role="tab"
                    type="button"
                    aria-selected={t.active}
                    disabled={t.disabled}
                    className={`relative pb-3 text-[11px] uppercase tracking-[0.32em] transition-colors ${
                      t.active
                        ? "text-[#F5F5F7]"
                        : t.disabled
                          ? "cursor-not-allowed text-white/20"
                          : "text-white/55 hover:text-white"
                    }`}
                  >
                    {t.label}
                    {t.active && (
                      <span className="absolute -bottom-px left-0 h-px w-full bg-[#F5F5F7]" />
                    )}
                  </button>
                ))}
              </nav>
              <Snippet>
                {`<button disabled
  class="cursor-not-allowed text-white/20">
  {label}
</button>
opacity 20 (très atténué)
pour les onglets verrouillés
(étapes à venir, fonctions premium…)
+ tooltip sur disabled pour expliquer`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tabs ARIA — pattern accessibilité">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`<nav role="tablist" aria-label="Sections">
  <button
    role="tab"
    id="tab-1"
    aria-selected={isActive}
    aria-controls="panel-1"
    tabIndex={isActive ? 0 : -1}
  >Label</button>
</nav>

<div
  role="tabpanel"
  id="panel-1"
  aria-labelledby="tab-1"
  hidden={!isActive}
>...</div>`}
              </pre>
              <Snippet>
                {`règles a11y stricts :
- role="tablist" sur le wrapper
- role="tab" + aria-selected sur chaque tab
- aria-controls pointe vers le panel
- role="tabpanel" + aria-labelledby
  sur le contenu correspondant
- tabIndex={active ? 0 : -1}
  (1 seul tab focusable, arrow keys
  pour naviguer entre tabs)
+ Home / End pour sauter au 1er / dernier`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* KBD SHORTCUTS */}
        <Block
          eyebrow="25 · Kbd shortcuts"
          title="Raccourcis clavier · combos · helpers"
          intro="Speetch est sobre côté raccourcis : Escape pour fermer les modales, Cmd+S pour sauver (à venir), Tab/Shift+Tab via focus-visible standard. Visuellement, les touches s'affichent via `<kbd>` restylé : border 1px, mono, padding compact."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Kbd élément — touche unique">
              <div className="flex w-full max-w-md flex-wrap items-center gap-3">
                <Kbd>Esc</Kbd>
                <Kbd>Tab</Kbd>
                <Kbd>↵</Kbd>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <Kbd>Space</Kbd>
              </div>
              <Snippet>
                {`<kbd class="inline-flex items-center
  rounded-md border border-white/15
  bg-white/[0.04]
  px-2 py-1
  font-mono text-[10px]
  uppercase tracking-[0.18em]
  text-white/75">
  Esc
</kbd>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Combo — modificateurs + touche">
              <div className="flex w-full max-w-md flex-wrap items-center gap-3">
                <KbdCombo keys={["⌘", "S"]} />
                <KbdCombo keys={["⌘", "K"]} />
                <KbdCombo keys={["⌘", "↵"]} />
                <KbdCombo keys={["⇧", "Tab"]} />
                <KbdCombo keys={["⌥", "F"]} />
              </div>
              <Snippet>
                {`<span class="inline-flex items-center gap-1">
  <Kbd>⌘</Kbd>
  <span class="text-white/30">+</span>
  <Kbd>S</Kbd>
</span>
symboles glyphes natifs :
  ⌘ Cmd · ⇧ Shift · ⌥ Option · ⌃ Ctrl
plus élégant que "Cmd + S"`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Raccourcis Speetch — référence">
              <ul className="flex w-full max-w-md flex-col gap-2 text-[12px] text-white/65">
                <li className="flex items-center justify-between">
                  <KbdCombo keys={["Esc"]} />
                  <span className="text-right text-white/55">
                    Fermer une modale
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <KbdCombo keys={["Tab"]} />
                  <span className="text-right text-white/55">
                    Navigation au clavier
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <KbdCombo keys={["⌘", "S"]} />
                  <span className="text-right text-white/40">
                    Sauver (à venir)
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <KbdCombo keys={["⌘", "K"]} />
                  <span className="text-right text-white/40">
                    Command palette (à venir)
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <KbdCombo keys={["⌘", "↵"]} />
                  <span className="text-right text-white/40">
                    Valider un formulaire (à venir)
                  </span>
                </li>
              </ul>
              <Snippet>
                {`actuels : Esc, Tab
à venir :
  ⌘S → save form (override Cmd+S browser)
  ⌘K → palette de commandes
  ⌘↵ → submit
préférer les combos universels macOS
+ équivalents Ctrl côté Windows`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hook useKeydown — pattern recommandé">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  }
  document.addEventListener('keydown', onKey);
  return () =>
    document.removeEventListener('keydown', onKey);
}, [onClose, onSave]);`}
              </pre>
              <Snippet>
                {`pattern dans le composant qui possède
l'action (modale, éditeur).
e.metaKey || e.ctrlKey → cross-platform
e.preventDefault() pour les combos
qui collident avec le browser (⌘S, ⌘K, ⌘P)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hint inline — afficher le raccourci">
              <div className="flex w-full max-w-md items-center justify-between rounded-md border border-white/10 bg-black px-4 py-3">
                <span className="font-serif italic text-white/65">
                  Tape pour filtrer…
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </div>
              <Snippet>
                {`<div class="flex items-center justify-between">
  <input ... />
  <span class="flex items-center gap-1">
    <Kbd>⌘</Kbd>
    <Kbd>K</Kbd>
  </span>
</div>
hint discret à droite de la zone d'input
pour signaler "tu peux invoquer ça par
raccourci" sans alourdir le label`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Footer modale — actions + raccourcis">
              <div className="flex w-full max-w-md items-center justify-between border-t border-white/10 px-4 py-3 text-[10px] uppercase tracking-[0.32em] text-white/45">
                <span className="flex items-center gap-2">
                  <Kbd>Esc</Kbd>
                  <span>Fermer</span>
                </span>
                <span className="flex items-center gap-2">
                  <span>Valider</span>
                  <Kbd>↵</Kbd>
                </span>
              </div>
              <Snippet>
                {`barre du bas de modale :
gauche : Esc · Fermer
droite : Valider · ↵
les utilisateurs avancés gagnent du temps
sans alourdir l'UI pour les autres`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pas de raccourci pour les actions destructives">
              <p className="w-full max-w-md text-[12px] text-white/55">
                Règle Speetch : <em className="font-serif italic text-white/80">aucun raccourci clavier</em>{" "}
                pour les actions destructives (delete, detach, drop). Toujours
                un click conscient sur un bouton, avec confirmation modale.
              </p>
              <Snippet>
                {`éviter ⌘D, Delete, etc. pour les actions
qui détruisent du contenu sans rollback
+ toujours window.confirm() en garde
asymétrie volontaire : c'est rapide
de créer, c'est lent de détruire`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* SOUND ICONS */}
        <Block
          eyebrow="28 · Sound icons"
          title="Speaker · waveform · equalizer"
          intro="Icônes SVG inline, stroke 1.25, sharp corners. Speetch reste cohérent : 24×24 viewBox, stroke='currentColor' pour hériter de la couleur du texte. Pas de bibliothèque externe — chaque icône fait ~10 lignes JSX."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Speaker — 4 états (mute → high)">
              <div className="flex w-full max-w-md flex-wrap items-center gap-6 text-white/65">
                <SpeakerIcon level={0} />
                <SpeakerIcon level={1} />
                <SpeakerIcon level={2} />
                <SpeakerIcon level={3} />
              </div>
              <Snippet>
                {`<svg width="24" height="24"
  viewBox="0 0 24 24" fill="none"
  stroke="currentColor"
  strokeWidth="1.25"
  strokeLinecap="round"
  strokeLinejoin="round">
  <path d="M3 10v4 ..." />
  {level >= 1 && <path d="M16 ..." />}
  {level >= 2 && <path d="M18 ..." />}
  {level >= 3 && <path d="M20 ..." />}
</svg>
arcs progressifs selon le niveau`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Waveform statique — pattern audio">
              <Waveform bars={32} />
              <Snippet>
                {`<svg viewBox="0 0 200 60">
  {bars.map((h, i) => (
    <rect
      x={i * step} y={30 - h/2}
      width={3} height={h}
      fill="currentColor"
    />
  ))}
</svg>
heights pseudo-random ou samples réels
3px de width + gap CSS naturel`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Equalizer live — barres animées">
              <div className="flex h-12 w-full max-w-md items-end gap-1">
                {[14, 36, 22, 48, 32, 28, 40, 18, 30, 24, 38, 26].map(
                  (h, i) => (
                    <span
                      key={i}
                      className="block w-1 origin-bottom bg-[#F5F5F7]/85 animate-pulse"
                      style={{
                        height: `${h}px`,
                        animationDelay: `${i * 80}ms`,
                        animationDuration: `${800 + (i % 3) * 200}ms`,
                      }}
                    />
                  ),
                )}
              </div>
              <Snippet>
                {`{heights.map((h, i) => (
  <span class="block w-1 origin-bottom
    bg-[#F5F5F7]/85 animate-pulse"
    style={{
      height: \`\${h}px\`,
      animationDelay: \`\${i * 80}ms\`,
      animationDuration: '...'
    }}
  />
))}
décalages : evoque la respiration sonore
sans tracker un vrai audio context`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Play / pause / stop — controls minimalistes">
              <div className="flex w-full max-w-md items-center gap-6 text-white/65">
                <button
                  type="button"
                  aria-label="Play"
                  className="transition-colors hover:text-white"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M7 4 L20 12 L7 20 Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Pause"
                  className="transition-colors hover:text-white"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Stop"
                  className="transition-colors hover:text-white"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <rect x="5" y="5" width="14" height="14" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Skip back"
                  className="transition-colors hover:text-white"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <rect x="5" y="5" width="2" height="14" />
                    <path d="M19 5 L9 12 L19 19 Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Skip forward"
                  className="transition-colors hover:text-white"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M5 5 L15 12 L5 19 Z" />
                    <rect x="17" y="5" width="2" height="14" />
                  </svg>
                </button>
              </div>
              <Snippet>
                {`SVG fill="currentColor" + viewBox 24×24
play  : path d="M7 4 L20 12 L7 20 Z"
pause : 2 × rect (x:6,14 y:4 w:4 h:16)
stop  : rect 14×14 centré
skip  : rect 2×14 + triangle
boutons : hover:text-white (300ms)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Volume slider — barre + dot positionnable">
              <div className="flex w-full max-w-md items-center gap-4">
                <SpeakerIcon level={2} />
                <div className="relative h-1 flex-1 rounded-full bg-white/[0.08]">
                  <span
                    className="absolute left-0 top-0 h-full rounded-full bg-[#F5F5F7]"
                    style={{ width: "62%" }}
                  />
                  <span
                    className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F5F5F7]"
                    style={{ left: "62%" }}
                  />
                </div>
                <span className="font-mono text-[10px] text-white/45">62</span>
              </div>
              <Snippet>
                {`<div class="relative h-1 rounded-full
  bg-white/[0.08] flex-1">
  <span class="absolute h-full
    bg-[#F5F5F7]" style="width: X%" />
  <span class="absolute -translate-y-1/2
    top-1/2 -translate-x-1/2
    h-3 w-3 rounded-full bg-[#F5F5F7]"
    style="left: X%" />
</div>
input[type=range] custom-styled
ou native restylé selon contexte`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Audio level meter — VU vertical">
              <div className="flex h-16 w-full max-w-md items-end gap-1">
                {[
                  85, 90, 78, 60, 92, 70, 55, 88, 95, 80, 65, 50, 75, 88,
                ].map((pct, i) => (
                  <span
                    key={i}
                    className="block w-2 origin-bottom"
                    style={{
                      height: `${pct}%`,
                      background:
                        pct > 85
                          ? "rgba(248,113,113,0.85)"
                          : pct > 70
                            ? "rgba(245,158,11,0.85)"
                            : "rgba(245,245,247,0.85)",
                    }}
                  />
                ))}
              </div>
              <Snippet>
                {`hauteur 100% → 16 (4rem)
chaque barre w-2 + gap-1
couleur conditionnelle :
  > 85% → rgba(248,113,113) (rouge clip)
  > 70% → rgba(245,158,11) (orange high)
  sinon → rgba(245,245,247) (white)
en live : AudioContext.AnalyserNode`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Mute / unmute — toggle simple">
              <div className="flex w-full max-w-md items-center gap-6">
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
                >
                  <SpeakerIcon level={2} />
                  <span>Activer le son</span>
                </button>
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
                >
                  <SpeakerIcon level={0} />
                  <span>Couper</span>
                </button>
              </div>
              <Snippet>
                {`level={muted ? 0 : 2}
+ label qui bascule "Activer / Couper"
plus explicite que ne montrer que l'icône
respect WCAG (texte visible accompagne l'icône)`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>


        {/* ╔══ FAMILY: MOTION & MICRO-INTERACTIONS ══╗ */}
        <section
          id="family-motion-et-micro-interactions"
          className="flex scroll-mt-24 flex-col gap-4 border-t-2 border-white/15 pt-12"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/35">
            Famille · Motion & micro-interactions
          </span>
          <h2
            className="font-serif font-extralight italic leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            Motion & micro-interactions
          </h2>
          <p className="max-w-xl font-serif text-sm italic text-white/45 md:text-base">
            Animations · scroll · marquees · drag · presence
          </p>
        </section>
        {/* MOTION TIMING */}
        <Block
          eyebrow="13 · Motion timing"
          title="Durées · easings · stagger"
          intro="Quatre durées et deux easings couvrent 95% des animations Speetch. Tout sort en cubic-bezier(0.22, 1, 0.36, 1) — l'out-expo signature. Les hover passent par 300/500 ms, les reveals par 900–1200 ms."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Durées canoniques">
              <div className="flex w-full max-w-md flex-col gap-3">
                {[
                  { d: "300 ms", usage: "Hover de couleur (text-white/40 → text-white)" },
                  { d: "400 ms", usage: "Fade-in modale, AnimatePresence" },
                  { d: "500 ms", usage: "Hairline qui s'étend (w-6 → w-12)" },
                  { d: "800 ms", usage: "Reveal de hero / opacity initial" },
                  { d: "900-1200 ms", usage: "whileInView reveal de section" },
                ].map((row) => (
                  <div key={row.d} className="flex items-baseline gap-4">
                    <span className="min-w-[6rem] font-mono text-[11px] text-white/65">
                      {row.d}
                    </span>
                    <span className="text-[12px] text-white/55">
                      {row.usage}
                    </span>
                  </div>
                ))}
              </div>
              <Snippet>
                {`durations Tailwind : 300, 400, 500, 800
durations framer-motion (s) :
  0.4, 0.9, 1.1, 1.2
au-delà de 1500ms, l'animation traîne`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Easings — out-expo (signature)">
              <div className="flex w-full max-w-md flex-col gap-3">
                <span className="font-mono text-[11px] text-white/65">
                  cubic-bezier(0.22, 1, 0.36, 1)
                </span>
                <span className="text-[12px] text-white/55">
                  ease-out exponentiel — sortie rapide puis ralentissement très
                  doux. Donne la sensation de relâchement raffinée.
                </span>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full w-1/2 origin-left scale-x-100 bg-[#F5F5F7]/85 transition-transform duration-[1100ms]" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                  Tailwind alias : <span className="font-mono">ease-out-expo</span>
                </span>
              </div>
              <Snippet>
                {`framer-motion :
  transition: { ease: [0.22, 1, 0.36, 1] }
CSS :
  transition-timing-function:
    cubic-bezier(0.22, 1, 0.36, 1)
Tailwind : ease-out-expo (configuré)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Easings — in-out-quart (interactions denses)">
              <div className="flex w-full max-w-md flex-col gap-3">
                <span className="font-mono text-[11px] text-white/65">
                  cubic-bezier(0.65, 0, 0.35, 1)
                </span>
                <span className="text-[12px] text-white/55">
                  Symétrique, accélération + décélération. Réservé aux
                  transitions courtes où la symétrie compte (toggle, slider).
                </span>
                <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                  Tailwind alias : <span className="font-mono">ease-in-out-quart</span>
                </span>
              </div>
              <Snippet>
                {`cubic-bezier(0.65, 0, 0.35, 1)
usages limités :
  toggles, sliders, sticky reveals
sinon par défaut : out-expo`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Initial state — opacity + translateY">
              <div className="flex w-full max-w-md flex-col gap-3">
                {[
                  { state: "y: 8", usage: "Mini-reveal (paragraphe, hint)" },
                  { state: "y: 12", usage: "Reveal standard (hero stats, intro)" },
                  { state: "y: 16", usage: "Reveal hero principal (H1)" },
                  { state: "y: 24", usage: "Reveal de chapitre (whileInView)" },
                ].map((row) => (
                  <div key={row.state} className="flex items-baseline gap-4">
                    <span className="min-w-[5rem] font-mono text-[11px] text-white/65">
                      {row.state}
                    </span>
                    <span className="text-[12px] text-white/55">
                      {row.usage}
                    </span>
                  </div>
                ))}
              </div>
              <Snippet>
                {`initial: { opacity: 0, y: 8/12/16/24 }
animate: { opacity: 1, y: 0 }
exit:    { opacity: 0 }   (souvent y reste)
4 paliers, jamais d'autres valeurs`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Stagger — séquence des reveals hero">
              <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[11px] text-white/65">
                <span>0.0s   → eyebrow</span>
                <span>0.15s  → h1</span>
                <span>0.30s  → pitch / intro</span>
                <span>0.45s  → form / KPIs</span>
                <span>0.70s  → scroll cue</span>
                <span>1.10s  → décoration finale</span>
              </div>
              <Snippet>
                {`delays standards (en secondes) :
0, 0.15, 0.3, 0.45, 0.7, 1.1
suffisamment spacé pour suivre l'œil
sans donner la sensation de "tout d'un coup"`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="whileInView — révélation au scroll">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`<motion.section
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-10%" }}
  transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
/>`}
              </pre>
              <Snippet>
                {`once: true → reveal uniquement la 1ère fois
margin: "-10%" → déclenche un peu avant
  d'entrer dans le viewport
duration 1.1s + ease out-expo (signature)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hover micro-interactions">
              <div className="flex w-full max-w-md flex-col gap-3">
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors duration-300 hover:text-white"
                >
                  <span>Color shift (300ms)</span>
                  <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                </button>
                <span className="text-[11px] text-white/45">
                  La couleur passe en 300ms, la hairline en 500ms (ease-out-expo).
                </span>
              </div>
              <Snippet>
                {`transition-colors duration-300
+ child:
  transition-all duration-500 ease-out
  group-hover:w-12
deux durées qui se décalent légèrement
donnent un effet "respiration" subtil`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* SCROLL PROGRESS */}
        <Block
          eyebrow="16 · Scroll progress"
          title="Indicateurs de défilement · index · cues"
          intro="Speetch utilise framer-motion useScroll + useSpring (stiffness 200, damping 40) pour amortir la bar. Index sticky qui surligne la section active. Toujours discret : 1px de hauteur max, opacity contrôlée."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Top progress bar — 1px qui suit le scroll">
              <div className="w-full max-w-md space-y-3">
                <div className="relative h-px w-full bg-white/10">
                  <span
                    className="absolute left-0 top-0 h-px bg-[#F5F5F7]"
                    style={{ width: "62%" }}
                  />
                </div>
                <span className="block font-mono text-[10px] text-white/40">
                  scaleX: useSpring(scrollYProgress)  ·  62%
                </span>
              </div>
              <Snippet>
                {`import { useScroll, useSpring, motion } from 'framer-motion';
const { scrollYProgress } = useScroll();
const x = useSpring(scrollYProgress, {
  stiffness: 200, damping: 40, restDelta: 0.001
});

<motion.div
  className="fixed left-0 top-0 z-[70]
    h-px bg-[#F5F5F7] origin-left w-full"
  style={{ scaleX: x }}
/>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Index sticky — surligne la section active">
              <nav className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.28em]">
                {[
                  { id: "00", label: "Tunnel", active: false },
                  { id: "01", label: "Audiences", active: false },
                  { id: "02", label: "Budget", active: true },
                  { id: "03", label: "Directions", active: false },
                  { id: "04", label: "Storyboard", active: false },
                ].map((it) => (
                  <span
                    key={it.id}
                    className={`group inline-flex items-center gap-3 ${
                      it.active ? "text-[#F5F5F7]" : "text-white/30"
                    }`}
                  >
                    <span
                      className={`inline-block h-px bg-current transition-all duration-500 ease-out ${
                        it.active ? "w-10" : "w-4"
                      }`}
                    />
                    <span className="font-mono">{it.id}</span>
                    <span>{it.label}</span>
                  </span>
                ))}
              </nav>
              <Snippet>
                {`useEffect avec onScroll passive :
const probe = window.scrollY
  + window.innerHeight * 0.35;
for (let i = 0; i < refs.length; i++) {
  if (refs[i].offsetTop <= probe) active = i;
}
+ class active : text-[#F5F5F7] + w-10
+ inactive : text-white/30 + w-4
transition 500ms ease-out`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pourcentage discret — variante numérique">
              <div className="flex w-full max-w-md items-center justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                <span>Brief de production</span>
                <span>062 / 100</span>
              </div>
              <Snippet>
                {`useTransform(scrollYProgress, (v) =>
  Math.round(v * 100).toString().padStart(3, '0')
)

<motion.span>{pct}</motion.span>
indication chiffrée pour les pages longues
plus FWA que la barre seule`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Scroll cue — hairline qui pulse">
              <div className="flex w-full max-w-md items-center gap-4 text-[10px] uppercase tracking-[0.36em] text-white/40">
                <span className="block h-px w-12 animate-pulse bg-current" />
                <span>Faire défiler</span>
              </div>
              <Snippet>
                {`@keyframes scrollLine {
  0%, 100% {
    transform: scaleX(0.45);
    transform-origin: left;
    opacity: 0.3;
  }
  50% { transform: scaleX(1); opacity: 0.75; }
}
animation: scrollLine 2.4s
  ease-in-out infinite;`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Section reveal au scroll — whileInView">
              <div className="w-full max-w-md space-y-2 font-mono text-[10px] text-white/45">
                <span className="block">initial : opacity 0 · y 24</span>
                <span className="block">whileInView : opacity 1 · y 0</span>
                <span className="block">
                  viewport : once true · margin -10%
                </span>
                <span className="block">transition : 1.1s ease-out-expo</span>
              </div>
              <Snippet>
                {`<motion.section
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-10%" }}
  transition={{
    duration: 1.1,
    ease: [0.22, 1, 0.36, 1]
  }}
/>`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* MARQUEES */}
        <Block
          eyebrow="18 · Marquees"
          title="Bandeaux défilants · ribbons éditoriaux"
          intro="Outils classiques FWA Grade : un ruban horizontal qui boucle indéfiniment, sépare des phrases par des bullets, ou affiche les KPIs. Animation Tailwind native (translateX 0 → -50% sur contenu dupliqué). Toujours en linear, jamais d'easing."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Ribbon classique — phrases séparées par bullets">
              <div className="w-full max-w-md overflow-hidden">
                <div className="flex w-fit animate-marquee whitespace-nowrap text-[12px] uppercase tracking-[0.32em] text-white/55">
                  {[1, 2].map((dup) => (
                    <span key={dup} className="flex items-center">
                      <span className="px-4">Paris</span>
                      <span className="text-white/20">●</span>
                      <span className="px-4">25 ans d&apos;expérience</span>
                      <span className="text-white/20">●</span>
                      <span className="px-4">Direction artistique</span>
                      <span className="text-white/20">●</span>
                      <span className="px-4">FWA Grade</span>
                      <span className="text-white/20">●</span>
                    </span>
                  ))}
                </div>
              </div>
              <Snippet>
                {`<div class="overflow-hidden">
  <div class="flex w-fit whitespace-nowrap
    animate-marquee">
    {/* contenu dupliqué × 2 */}
    {[1, 2].map(() => (...))}
  </div>
</div>
keyframes :
  0% { translateX(0%) }
  100% { translateX(-50%) }`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Ribbon monumental — typographie display">
              <div className="w-full max-w-md overflow-hidden">
                <div className="flex w-fit animate-marquee whitespace-nowrap font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]">
                  {[1, 2].map((dup) => (
                    <span key={dup} className="flex items-baseline">
                      <span className="px-4" style={{ fontSize: "2.5rem" }}>
                        Speetch
                      </span>
                      <span
                        className="px-4 font-serif font-light italic text-white/55"
                        style={{ fontSize: "2.5rem" }}
                      >
                        ×
                      </span>
                      <span className="px-4" style={{ fontSize: "2.5rem" }}>
                        Brief
                      </span>
                      <span
                        className="px-4 font-serif font-light italic text-white/55"
                        style={{ fontSize: "2.5rem" }}
                      >
                        ·
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <Snippet>
                {`même structure que ribbon
mais font-extralight tracking-[-0.04em]
+ alternance regular / italic Fraunces
duration plus longue pour grosse typo :
animation: marquee 60s linear infinite`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pause au hover — ralentir l'attention">
              <div className="group w-full max-w-md overflow-hidden">
                <div className="flex w-fit animate-marquee whitespace-nowrap text-[12px] uppercase tracking-[0.32em] text-white/55 group-hover:[animation-play-state:paused]">
                  {[1, 2].map((dup) => (
                    <span key={dup} className="flex items-center">
                      <span className="px-4">Survole-moi</span>
                      <span className="text-white/20">●</span>
                      <span className="px-4">le ruban pause</span>
                      <span className="text-white/20">●</span>
                      <span className="px-4">re-démarre au leave</span>
                      <span className="text-white/20">●</span>
                    </span>
                  ))}
                </div>
              </div>
              <Snippet>
                {`<div class="group ...">
  <div class="animate-marquee
    group-hover:[animation-play-state:paused]">
    ...
  </div>
</div>
permet à l'utilisateur de lire un fragment
sans casser la boucle`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Vitesses canoniques">
              <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
                <span>30s · standard (lecture confortable)</span>
                <span>45s · lent (typo plus grande)</span>
                <span>60s · monumental (display 2-4rem)</span>
                <span>20s · rapide (KPIs, données)</span>
              </div>
              <Snippet>
                {`tailwind.config.ts
animation: {
  marquee: "marquee 30s linear infinite",
}
ou via arbitrary :
animate-[marquee_45s_linear_infinite]
jamais inférieur à 18s — devient nerveux`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Marquee à 2 niveaux — vitesses opposées">
              <div className="w-full max-w-md space-y-1">
                <div className="overflow-hidden">
                  <div className="flex w-fit animate-marquee whitespace-nowrap text-[10px] uppercase tracking-[0.32em] text-white/55">
                    {[1, 2].map((d) => (
                      <span key={d} className="flex">
                        <span className="px-3">Direction artistique</span>
                        <span className="text-white/20">·</span>
                        <span className="px-3">Identité de marque</span>
                        <span className="text-white/20">·</span>
                        <span className="px-3">Édition numérique</span>
                        <span className="text-white/20">·</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="overflow-hidden">
                  <div
                    className="flex w-fit animate-marquee whitespace-nowrap text-[10px] uppercase tracking-[0.32em] text-white/30"
                    style={{ animationDirection: "reverse", animationDuration: "45s" }}
                  >
                    {[1, 2].map((d) => (
                      <span key={d} className="flex">
                        <span className="px-3">Paris 2026</span>
                        <span className="text-white/20">·</span>
                        <span className="px-3">FWA Grade</span>
                        <span className="text-white/20">·</span>
                        <span className="px-3">25 ans</span>
                        <span className="text-white/20">·</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Snippet>
                {`deux marquees superposés :
- direction normale, 30s, opacity 55
- direction reverse, 45s, opacity 30
crée une profondeur kinétique
sans surcharger`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* INDICATEURS VIVANTS */}
        <Block
          eyebrow="20 · Indicateurs vivants"
          title="Dots pulsants · curseurs · live counters"
          intro="Petits signaux qui rappellent que le site est habité — ping-soft sur les status, blink sur les carets, marqueurs de session active. Toujours 1×1px ou 2×2px, jamais plus gros : la subtilité fait l'effet."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Dot pulsant — session active">
              <div className="flex w-full max-w-md items-center gap-3">
                <span className="relative inline-flex h-2 w-2 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping-soft" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </span>
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  Session active
                </span>
              </div>
              <Snippet>
                {`<span class="relative inline-flex
  h-2 w-2 items-center justify-center">
  <span class="absolute inset-0 rounded-full
    bg-emerald-300 animate-ping-soft" />
  <span class="relative inline-flex
    h-1.5 w-1.5 rounded-full bg-emerald-300" />
</span>
double dot : un pulse + un solide centré
keyframe ping-soft : scale 1 → 2, opacity 1 → 0`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Dot recording — pulsation rouge">
              <div className="flex w-full max-w-md items-center gap-3">
                <span className="relative inline-flex h-2 w-2 items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-red-400/70 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                </span>
                <span className="text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                  Live · 03 visiteurs
                </span>
              </div>
              <Snippet>
                {`animate-ping (Tailwind built-in)
ou animate-ping-soft (config Speetch)
bg-red-400 / 70 atténué pour le ping
+ couleur du label en text-red-300/80
réservé aux actions live réelles`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Caret blink — input focus, terminal">
              <span className="inline-flex items-baseline gap-1 font-mono text-[14px] text-white/85">
                <span>speetch.com</span>
                <span className="inline-block h-4 w-px animate-pulse bg-[#F5F5F7]" />
              </span>
              <Snippet>
                {`<span class="inline-block h-4 w-px
  animate-pulse bg-[#F5F5F7]" />
animate-pulse (built-in)
ou caret-pulse personnalisé :
  0%, 100% { opacity: 1 }
  50% { opacity: 0 }`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Compteur live — value qui change">
              <div className="flex w-full max-w-md items-baseline justify-between border-t border-white/10 pt-4">
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/45">
                  Candidatures · 24h
                </span>
                <span className="flex items-center gap-2 font-mono tabular-nums text-2xl font-light text-[#F5F5F7]">
                  <span>062</span>
                  <span className="relative inline-flex h-1.5 w-1.5">
                    <span className="absolute inset-0 rounded-full bg-emerald-300/70 animate-ping-soft" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </span>
                </span>
              </div>
              <Snippet>
                {`font-mono tabular-nums
font-light tracking-[-0.02em]
+ dot pulsant à côté du chiffre
tabular-nums évite que les chiffres
"bougent" quand la valeur change
(0.5em différence entre 1 et 0)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Indicateur de connexion — Wi-Fi style">
              <div className="flex w-full max-w-md items-center gap-3">
                <span className="inline-flex items-end gap-0.5">
                  <span className="block h-1 w-0.5 bg-emerald-300/50" />
                  <span className="block h-2 w-0.5 bg-emerald-300/75" />
                  <span className="block h-3 w-0.5 bg-emerald-300" />
                  <span className="block h-4 w-0.5 bg-emerald-300" />
                </span>
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  Sync · temps réel
                </span>
              </div>
              <Snippet>
                {`4 barres verticales (h-1, h-2, h-3, h-4)
chacune w-0.5 (2px)
opacités progressives :
  50, 75, 100, 100
pour signaler la qualité d'une connexion
ou la force d'un signal Supabase realtime`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Heartbeat — battement régulier">
              <div className="flex w-full max-w-md items-center gap-3">
                <span className="block h-1.5 w-1.5 rounded-full bg-[#F5F5F7] animate-pulse [animation-duration:1.6s]" />
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  Service · OK
                </span>
              </div>
              <Snippet>
                {`animate-pulse + [animation-duration:1.6s]
ralenti exprès — un battement de cœur
plus calme que le pulse par défaut (2s)
plutôt utiliser pour les services
de fond (health-check, queue worker)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Activity log — ligne qui parcourt">
              <div className="relative h-1 w-full max-w-md overflow-hidden bg-white/[0.04]">
                <span className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#F5F5F7] to-transparent animate-marquee" />
              </div>
              <Snippet>
                {`<div class="relative h-1 overflow-hidden
  bg-white/[0.04]">
  <span class="absolute h-full w-1/3
    bg-gradient-to-r from-transparent
    via-[#F5F5F7] to-transparent
    animate-marquee" />
</div>
pour indiquer "quelque chose s'execute"
sans donner de pourcentage`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Compteur de session — durée écoulée">
              <div className="flex w-full max-w-md items-center justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                <span>Session ouverte</span>
                <span className="tabular-nums text-white/75">
                  00:14:32
                </span>
              </div>
              <Snippet>
                {`useEffect(() => {
  const start = Date.now();
  const id = setInterval(() =>
    setEl(formatDuration(Date.now() - start)),
  1000);
  return () => clearInterval(id);
}, []);
format hh:mm:ss tabular-nums`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* SCROLL SNAP */}
        <Block
          eyebrow="21 · Scroll snap"
          title="Carousels · sections séquentielles · stories"
          intro="CSS scroll-snap-type natif, sans JS. Trois variantes Speetch : horizontal carousel (formats publicitaires), vertical section-by-section (présentations FWA), proximity (lâche, pour le scroll libre)."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Horizontal mandatory — formats publicitaires">
              <div className="w-full max-w-md">
                <div className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-[4/5] w-2/3 shrink-0 snap-center rounded-md border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                        Format {i}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 font-mono text-[10px] text-white/30">
                  Glisse horizontalement →
                </p>
              </div>
              <Snippet>
                {`<div class="flex overflow-x-auto
  snap-x snap-mandatory gap-3">
  <div class="shrink-0 snap-center w-2/3">
    ...
  </div>
</div>
chaque enfant : snap-center | snap-start
shrink-0 pour ne pas écraser le width
parent : snap-mandatory (force le snap)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Snap proximity — moins strict">
              <div className="w-full max-w-md">
                <div className="flex w-full snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square w-32 shrink-0 snap-start rounded-md border border-white/10 bg-white/[0.04] p-3"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                        {String(i).padStart(2, "0")}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 font-mono text-[10px] text-white/30">
                  Le snap n&apos;est pas forcé — scroll libre puis recadrage
                </p>
              </div>
              <Snippet>
                {`<div class="flex snap-x overflow-x-auto">
  (pas de snap-mandatory)
  <div class="snap-start w-32">
</div>
snap-proximity (par défaut quand on omet)
le scroll libre est permis, le snap n'intervient
qu'à proximité d'un point d'ancrage`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Snap-stop · always — un par geste">
              <div className="w-full max-w-md">
                <div className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="aspect-square w-2/3 shrink-0 snap-center snap-always rounded-md border border-white/10 bg-white/[0.04] p-4"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                        Slide {i}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 font-mono text-[10px] text-white/30">
                  Une slide par flick — comme un carousel manuel
                </p>
              </div>
              <Snippet>
                {`<div class="snap-x snap-mandatory">
  <div class="snap-center snap-always">
</div>
snap-always (= scroll-snap-stop: always)
empêche de "passer outre" un point d'ancrage
pour les présentations type stories Instagram`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Vertical snap — chapitres FWA pleine page">
              <div className="w-full max-w-md">
                <div className="flex h-48 snap-y snap-mandatory flex-col overflow-y-auto pr-2 [scrollbar-width:thin]">
                  {[
                    { num: "00", label: "Tunnel" },
                    { num: "01", label: "Audiences" },
                    { num: "02", label: "Budget" },
                  ].map((c) => (
                    <section
                      key={c.num}
                      className="flex h-48 shrink-0 snap-start flex-col justify-end border-b border-white/10 p-4"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                        {c.num}
                      </span>
                      <span className="mt-1 text-base font-light text-[#F5F5F7]">
                        {c.label}
                      </span>
                    </section>
                  ))}
                </div>
              </div>
              <Snippet>
                {`<main class="snap-y snap-mandatory
  overflow-y-auto h-screen">
  <section class="snap-start h-screen">
</main>
pour les présentations FWA Grade
où chaque section = un écran complet
attention : casse le scroll naturel
à n'utiliser qu'en mode présentation`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Snap + pagination dots">
              <div className="w-full max-w-md">
                <div className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-[5/4] w-full shrink-0 snap-center rounded-md border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                        Slide {i}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="h-1 w-6 rounded-full bg-[#F5F5F7]" />
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                </div>
              </div>
              <Snippet>
                {`Indicateurs sous le carousel :
  active : w-6 bg-[#F5F5F7]
  inactive : w-1 bg-white/30
hauteur 1px, gap-2
animation onScroll vers indicateur correspondant :
  IntersectionObserver dans le snap container`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Smooth scroll + snap combiné">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`html {
  scroll-behavior: smooth;
}
.snap-container {
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
}
button onClick → scrollIntoView({
  behavior: 'smooth',
  block: 'start',
  inline: 'center'
})`}
              </pre>
              <Snippet>
                {`Speetch active scroll-behavior: smooth
sur <html> dans globals.css
+ scroll-snap au container
+ pour navigation manuelle : scrollIntoView
combo cohérent partout`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* TRANSITIONS DE PAGE */}
        <Block
          eyebrow="23 · Transitions de page"
          title="Mount · staggers · AnimatePresence"
          intro="Speetch ne fait pas de routing animé custom (App Router rend chaque page indépendamment). Mais chaque page orchestre son entrée : hero stagger 0/0.15/0.3/0.45s, sections whileInView, exits via AnimatePresence sur les sub-views."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Mount hero — stagger choreographié">
              <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
                <span>0.00s · eyebrow (y:0, opacity:1)</span>
                <span>0.15s · h1 monumental (y:16 → 0)</span>
                <span>0.30s · pitch (y:8 → 0)</span>
                <span>0.45s · KPIs / form</span>
                <span>0.70s · scroll cue (opacity)</span>
                <span>1.10s · footer décoratif</span>
              </div>
              <Snippet>
                {`<motion.h1
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 1.2,
    delay: 0.15,
    ease: [0.22, 1, 0.36, 1]
  }}
/>
delays décalés de 0.15s pour suivre l'œil`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Section reveal au scroll — whileInView">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`<motion.section
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-10%" }}
  transition={{
    duration: 1.1,
    ease: [0.22, 1, 0.36, 1]
  }}
/>`}
              </pre>
              <Snippet>
                {`whileInView remplace IntersectionObserver
viewport.once : reveal une seule fois
viewport.margin : -10% déclenche un peu avant
duration 1.1s = sweet spot
plus long = traîne, plus court = nerveux`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="AnimatePresence — sortie de feedback">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`<AnimatePresence>
  {state.error && (
    <motion.p
      key={state.error}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >{state.error}</motion.p>
  )}
</AnimatePresence>`}
              </pre>
              <Snippet>
                {`pour erreurs, succès, toasts
key={message} force unmount au changement
exit animation gérée par AnimatePresence
durée typique : 0.3-0.4s (rapide)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Loader → contenu — overlay qui se retire">
              <div className="w-full max-w-md space-y-2">
                <div className="relative h-24 overflow-hidden rounded-md border border-white/10 bg-black">
                  <div className="absolute inset-0 flex items-end justify-between bg-black px-4 py-3">
                    <span className="font-serif text-lg italic font-extralight text-[#F5F5F7]">
                      Speetch
                      <em className="ml-1 text-white/60">×</em>
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                      082
                    </span>
                  </div>
                  <div className="absolute inset-x-0 top-0 h-px bg-[#F5F5F7]" />
                </div>
                <p className="font-mono text-[10px] text-white/30">
                  Loader auto-dismiss CSS : translateY(0 → -101%) à 1.2s
                </p>
              </div>
              <Snippet>
                {`.loader {
  position: fixed; inset: 0;
  background: var(--bg);
  z-index: 100;
  animation: loader-out 1.4s
    cubic-bezier(0.22, 1, 0.36, 1)
    1.2s forwards;
}
@keyframes loader-out {
  to { transform: translateY(-101%); }
}
CSS-driven, indépendant du JS
fail-safe si quoi que ce soit cale`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Crossfade entre vues — switch interne">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`<motion.div
  key={activeTab}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: 0.4,
    ease: [0.22, 1, 0.36, 1]
  }}
>
  {/* contenu de l'onglet courant */}
</motion.div>`}
              </pre>
              <Snippet>
                {`key={activeTab} force le remount
quand l'utilisateur change d'onglet
animation rapide (0.4s) pour ne pas
ralentir l'interaction
y:8 → 0 + opacity (subtil)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Route change — Next App Router natif">
              <p className="w-full max-w-md text-[13px] text-white/55">
                App Router rend chaque <code>page.tsx</code> en parallèle. Pas
                de transition globale — chaque page orchestre son propre mount
                via <span className="font-mono">motion.initial / animate</span>
                . Pour des transitions plus avancées :{" "}
                <span className="font-mono">view-transition-name</span> côté
                CSS (support partiel).
              </p>
              <Snippet>
                {`pas d'AnimatePresence sur layout.tsx
chaque page : initial / animate au mount
loader CSS-only si entrée plus marquée
view-transition-name (CSS) optionnel
pour les transitions de hero shared`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Page exit — verrouillage avant signout">
              <div className="w-full max-w-md space-y-2 font-mono text-[10px] text-white/55">
                <span>1. setLocked(true) — bloque les interactions</span>
                <span>2. await router.push(...) </span>
                <span>3. fade-out optionnel via opacity</span>
                <span>4. Next gère le swap de DOM</span>
              </div>
              <Snippet>
                {`const [exiting, setExiting] = useState(false);
async function handleSignout() {
  setExiting(true);
  await new Promise(r => setTimeout(r, 250));
  await signOut();
  router.push('/login');
}
+ motion.div : animate={{ opacity: exiting ? 0 : 1 }}
sortie graceful avant remplacement`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* PRESENCE INDICATORS */}
        <Block
          eyebrow="26 · Presence indicators"
          title="Avatars · cursors live · typing"
          intro="Pour les outils collab à venir (Supabase Realtime). Signaux discrets : dot d'état sur avatar, curseurs nommés des autres, indicateur de saisie. Tout reste à l'échelle FWA — jamais un Slack qui crie."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Avatar + status dot — online/offline">
              <div className="flex w-full max-w-md items-center gap-4">
                <div className="relative">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/40 font-serif text-lg italic text-[#F5F5F7]">
                    <em>S</em>
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full border-2 border-black bg-emerald-300" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-white/85">Speetch</span>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-emerald-300/80">
                    En ligne
                  </span>
                </div>
              </div>
              <Snippet>
                {`<div class="relative">
  <Avatar />
  <span class="absolute -bottom-0.5
    -right-0.5 h-2.5 w-2.5 rounded-full
    border-2 border-black
    bg-emerald-300" />
</div>
border-2 border-black crée le "trou" autour
du dot pour qu'il flotte au-dessus de l'avatar`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Stack avatars — co-éditeurs présents">
              <div className="flex w-full max-w-md items-center gap-4">
                <div className="flex -space-x-3">
                  {[
                    { letter: "S", bg: "rgba(245,245,247,0.12)" },
                    { letter: "C", bg: "rgba(245,245,247,0.18)" },
                    { letter: "I", bg: "rgba(245,245,247,0.24)" },
                  ].map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-black font-serif text-sm italic text-[#F5F5F7]"
                      style={{ background: a.bg }}
                    >
                      <em>{a.letter}</em>
                    </span>
                  ))}
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white/[0.06] font-mono text-[10px] text-white/55">
                    +2
                  </span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  5 sur la page
                </span>
              </div>
              <Snippet>
                {`<div class="flex -space-x-3">
  <Avatar class="border-2 border-black" />
  <Avatar class="border-2 border-black" />
  <Avatar class="border-2 border-black" />
  <span>+N</span>
</div>
-space-x-3 superpose avec recouvrement
chaque avatar : border-2 border-black
crée la séparation visuelle`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Cursor distant — Realtime nommé">
              <div className="relative h-24 w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black/40">
                {/* Curseur 1 */}
                <div
                  className="absolute"
                  style={{ left: "28%", top: "40%" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 2 L11 7 L7 8 L6 12 Z"
                      fill="#F5F5F7"
                    />
                  </svg>
                  <span className="absolute left-3 top-3 whitespace-nowrap rounded-sm bg-[#F5F5F7] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.32em] text-black">
                    Isis
                  </span>
                </div>
                {/* Curseur 2 */}
                <div
                  className="absolute"
                  style={{ left: "62%", top: "60%" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 2 L11 7 L7 8 L6 12 Z"
                      fill="rgba(245, 245, 247, 0.55)"
                    />
                  </svg>
                  <span className="absolute left-3 top-3 whitespace-nowrap rounded-sm bg-white/[0.55] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.32em] text-black">
                    Ayana
                  </span>
                </div>
              </div>
              <Snippet>
                {`<div class="absolute"
  style={{ left: x, top: y }}>
  <svg ...><path d="M2 2 L11 7 L7 8 L6 12 Z" /></svg>
  <span class="absolute left-3 top-3
    bg-[#F5F5F7] text-black
    px-1.5 py-0.5 text-[9px]
    uppercase tracking-[0.32em]">
    {userName}
  </span>
</div>
position absolue mise à jour via
Supabase Realtime presence + RAF`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Typing indicator — 3 dots animés">
              <div className="flex w-full max-w-md items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  Isis tape
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="block h-1 w-1 rounded-full bg-[#F5F5F7] animate-pulse"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="block h-1 w-1 rounded-full bg-[#F5F5F7] animate-pulse"
                    style={{ animationDelay: "180ms" }}
                  />
                  <span
                    className="block h-1 w-1 rounded-full bg-[#F5F5F7] animate-pulse"
                    style={{ animationDelay: "360ms" }}
                  />
                </span>
              </div>
              <Snippet>
                {`3 dots h-1 w-1 rounded-full bg-[#F5F5F7]
animate-pulse + animationDelay décalé
  0ms · 180ms · 360ms
fait apparaître un mini-rythme
sans nécessiter une keyframe custom`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Dernière activité — timestamp relatif">
              <ul className="flex w-full max-w-md flex-col gap-2 text-[12px] text-white/65">
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>Speetch</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    En ligne
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="block h-1.5 w-1.5 rounded-full bg-white/30" />
                    <span>Isis</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Il y a 2 min
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="block h-1.5 w-1.5 rounded-full bg-white/20" />
                    <span>Ayana</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                    Il y a 1 h
                  </span>
                </li>
              </ul>
              <Snippet>
                {`dot bg-emerald-300 : online
dot bg-white/30 : récent (< 5min)
dot bg-white/20 : ancien (< 1h)
dot caché : > 1h
formatRelative(timestamp) : "Il y a 2 min"
helper à mettre dans lib/datetime.ts`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Section en édition — qui édite quoi">
              <div className="w-full max-w-md rounded-md border border-emerald-400/20 bg-emerald-400/[0.04] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className="relative inline-flex h-2 w-2 items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping-soft" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.32em] text-emerald-200/85">
                      Isis édite cette section
                    </span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                    Verrouillé
                  </span>
                </div>
              </div>
              <Snippet>
                {`bandeau emerald-400/20 sur la section
+ dot pulsant + nom de l'éditeur
+ état "Verrouillé" à droite
empêche l'écriture concurrente
patterns CRDT ou simple lock optimiste`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* DRAG INTERACTIONS */}
        <Block
          eyebrow="27 · Drag interactions"
          title="Handles · drop zones · reorder"
          intro="Drag handles à 6 points, drop zones avec border dashed qui se réactive à dragenter, indicateur de drop entre items. Visuellement sobre : pas d'effet 3D, juste un changement de border et de bg."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Handle 6-dots — drag to reorder">
              <div className="flex w-full max-w-md flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-md border border-white/10 bg-black px-3 py-2"
                  >
                    <span
                      aria-label="Drag handle"
                      className="grid cursor-grab grid-cols-2 gap-0.5 text-white/35 hover:text-white/65"
                    >
                      {[0, 1, 2, 3, 4, 5].map((d) => (
                        <span
                          key={d}
                          className="block h-1 w-1 rounded-full bg-current"
                        />
                      ))}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                      0{i}
                    </span>
                    <span className="text-[13px] text-white/65">
                      Section {i}
                    </span>
                  </div>
                ))}
              </div>
              <Snippet>
                {`<span class="grid grid-cols-2 gap-0.5
  cursor-grab text-white/35
  hover:text-white/65">
  {[0,1,2,3,4,5].map(d => (
    <span class="block h-1 w-1
      rounded-full bg-current" />
  ))}
</span>
6 points en 2×3, plus discret que ☰`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Drag handle vertical — bars empilées">
              <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black px-3 py-3">
                <span
                  aria-label="Drag handle"
                  className="flex cursor-grab flex-col gap-0.5 text-white/35 hover:text-white/65"
                >
                  <span className="block h-px w-3 bg-current" />
                  <span className="block h-px w-3 bg-current" />
                  <span className="block h-px w-3 bg-current" />
                </span>
                <span className="text-[13px] text-white/65">
                  Plus minimaliste (3 hairlines)
                </span>
              </div>
              <Snippet>
                {`flex flex-col gap-0.5
+ 3 × <span class="block h-px w-3 bg-current">
variante "burger" 3 lignes simples
encore plus discret que les 6 dots
préféré quand l'élément est petit`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Drop zone — état idle">
              <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  Glisser-déposer
                </span>
                <span className="font-serif text-sm italic text-white/45">
                  ou cliquer pour parcourir
                </span>
              </div>
              <Snippet>
                {`border-2 border-dashed border-white/15
bg-white/[0.02]
rounded-xl px-6 py-10
+ label uppercase + hint serif italic
état neutre — invite sans agresser`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Drop zone — état hover/dragenter">
              <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[#F5F5F7]/60 bg-white/[0.06] px-6 py-10 text-center">
                <span className="text-[11px] uppercase tracking-[0.32em] text-[#F5F5F7]">
                  Lâcher pour téléverser
                </span>
                <span className="font-serif text-sm italic text-white/65">
                  trois fichiers détectés
                </span>
              </div>
              <Snippet>
                {`onDragEnter → setActive(true)
classes :
  border-[#F5F5F7]/60 (au lieu de white/15)
  bg-white/[0.06]
  text-[#F5F5F7]
transition-colors 200ms
état actif = palette pleine`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Drop zone — état erreur">
              <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-xl border-2 border-dashed border-red-400/40 bg-red-400/[0.04] px-6 py-10 text-center">
                <span className="text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                  Format non supporté
                </span>
                <span className="font-serif text-sm italic text-white/55">
                  PNG, JPG, MP4 uniquement (max 50 MB)
                </span>
              </div>
              <Snippet>
                {`onDragEnter avec mauvais type :
  border-red-400/40 bg-red-400/[0.04]
  text-red-300/80
hint en blanc pour les contraintes
revient à idle après 1.5s ou dragleave`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Drop indicator — ligne entre items">
              <div className="flex w-full max-w-md flex-col gap-2">
                <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black px-3 py-2 text-[13px] text-white/65">
                  Section 01
                </div>
                <div className="relative -my-1 h-0.5">
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-[#F5F5F7]" />
                  <span className="absolute -left-1 -top-1 block h-2.5 w-2.5 rounded-full bg-[#F5F5F7]" />
                </div>
                <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black px-3 py-2 text-[13px] text-white/65">
                  Section 02
                </div>
                <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black px-3 py-2 text-[13px] text-white/65">
                  Section 03
                </div>
              </div>
              <Snippet>
                {`entre 2 items à drag-over :
<div class="relative -my-1 h-0.5">
  <span class="absolute inset-x-0
    top-0 h-0.5 bg-[#F5F5F7]" />
  <span class="absolute -left-1 -top-1
    h-2.5 w-2.5 rounded-full
    bg-[#F5F5F7]" />
</div>
ligne + pastille à gauche
visuel "ici, l'item va s'insérer"`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Ghost — élément en cours de drag">
              <div className="flex w-full max-w-md flex-col gap-2">
                <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black px-3 py-2 text-[13px] text-white/35">
                  <span className="grid grid-cols-2 gap-0.5 text-white/20">
                    {[0, 1, 2, 3, 4, 5].map((d) => (
                      <span
                        key={d}
                        className="block h-1 w-1 rounded-full bg-current"
                      />
                    ))}
                  </span>
                  <span>Section 01</span>
                  <span className="ml-auto text-[10px] uppercase tracking-[0.32em] text-white/30">
                    placeholder
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 rounded-md border border-[#F5F5F7]/40 bg-white/[0.04] px-3 py-2 text-[13px] text-white/85 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md"
                  style={{ transform: "translate(8px, -4px) rotate(-1.5deg)" }}
                >
                  <span className="grid grid-cols-2 gap-0.5 text-white/65">
                    {[0, 1, 2, 3, 4, 5].map((d) => (
                      <span
                        key={d}
                        className="block h-1 w-1 rounded-full bg-current"
                      />
                    ))}
                  </span>
                  <span>Section 01 (drag)</span>
                </div>
              </div>
              <Snippet>
                {`placeholder à la position originale :
  opacity -50% via text-white/35
  + chip "placeholder" à droite
ghost qui suit le curseur :
  border-[#F5F5F7]/40 bg-white/[0.04]
  shadow + backdrop-blur
  rotation -1.5deg (touche organique)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Curseurs CSS — grab / grabbing">
              <div className="flex w-full max-w-md flex-col gap-3 font-mono text-[10px] text-white/55">
                <span>
                  <span className="cursor-grab text-white/85">
                    cursor-grab
                  </span>{" "}
                  · au repos sur un handle
                </span>
                <span>
                  <span className="cursor-grabbing text-white/85">
                    cursor-grabbing
                  </span>{" "}
                  · pendant le drag actif
                </span>
                <span>
                  <span className="cursor-move text-white/85">
                    cursor-move
                  </span>{" "}
                  · alternative générique
                </span>
                <span>
                  <span className="cursor-not-allowed text-white/85">
                    cursor-not-allowed
                  </span>{" "}
                  · zone non droppable
                </span>
              </div>
              <Snippet>
                {`cursor-grab → cursor-grabbing au mousedown
ou via JS : classList.toggle('cursor-grabbing')
cursor-not-allowed sur les zones bloquées
+ Safari demande cursor: -webkit-grab parfois`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Toolbar drag — move section actuel (boutons)">
              <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-md border border-white/10 bg-black px-3 py-2">
                <span className="flex items-center gap-3 text-[13px] text-white/65">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                    02
                  </span>
                  Section
                </span>
                <span className="flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55">
                  <button
                    type="button"
                    className="transition-colors hover:text-white"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="transition-colors hover:text-white"
                  >
                    ↓
                  </button>
                </span>
              </div>
              <Snippet>
                {`pattern actuel Speetch (page-editor) :
boutons ↑ / ↓ pour réordonner
plus simple à coder, plus accessible
le drag est un nice-to-have plus tard
fallback toujours présent`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>


        {/* ╔══ FAMILY: ÉTATS & PATTERNS ══╗ */}
        <section
          id="family-états-et-patterns"
          className="flex scroll-mt-24 flex-col gap-4 border-t-2 border-white/15 pt-12"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/35">
            Famille · États & patterns
          </span>
          <h2
            className="font-serif font-extralight italic leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
          >
            États & patterns
          </h2>
          <p className="max-w-xl font-serif text-sm italic text-white/45 md:text-base">
            Focus · chargement · erreurs · vides · search · splash · éditorial
          </p>
        </section>
        {/* MEDIA PATTERNS */}
        <Block
          eyebrow="14 · Media patterns"
          title="Images · vidéos · embeds · galeries"
          intro="Toujours un fond bg-white/[0.03] derrière les médias (atterrissage doux pendant le chargement). Ratio explicite via aspect-* utilities ou width/height sur next/image. Caption en uppercase tracking 0.32em white/40."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Image — cover hero 16/9">
              <figure className="w-full max-w-md space-y-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-white/[0.03]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.02]" />
                  <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.32em] text-white/40">
                    aspect-[16/9]
                  </span>
                </div>
                <figcaption className="text-[11px] uppercase tracking-[0.32em] text-white/40">
                  Légende sous l&apos;image — uppercase tracking 0.32em
                </figcaption>
              </figure>
              <Snippet>
                {`<figure>
  <div class="relative aspect-[16/9] w-full
    overflow-hidden bg-white/[0.03]">
    <Image fill priority sizes="..." />
  </div>
  <figcaption class="mt-4 text-[11px]
    uppercase tracking-[0.32em] text-white/40">
</figure>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Image — content 1280×960 width/height">
              <figure className="w-full max-w-md space-y-3">
                <div className="relative w-full overflow-hidden bg-white/[0.03]">
                  <div className="aspect-[4/3] w-full bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                  <span className="absolute bottom-3 right-3 font-mono text-[10px] text-white/40">
                    1280 × 960
                  </span>
                </div>
                <figcaption className="text-[11px] uppercase tracking-[0.32em] text-white/40">
                  width/height conserve le ratio natif
                </figcaption>
              </figure>
              <Snippet>
                {`<Image
  src={m.url}
  alt={m.caption ?? section.title ?? ""}
  width={m.width ?? 1920}
  height={m.height ?? 1080}
  className="h-auto w-full object-cover"
  sizes="(min-width: 1280px) 1280px, 100vw"
/>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Video — contrôles natifs + preload metadata">
              <figure className="w-full max-w-md space-y-3">
                <div className="relative aspect-video w-full bg-white/[0.03]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] uppercase tracking-[0.36em] text-white/35">
                      Video player
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </figure>
              <Snippet>
                {`<video
  src={m.url}
  controls
  playsInline
  preload="metadata"
  className="aspect-video w-full
    bg-white/[0.03]"
/>
preload="metadata" pour la première frame
sans charger toute la vidéo`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Embed — iframe sandboxé responsive">
              <div className="relative aspect-video w-full max-w-md overflow-hidden bg-white/[0.03]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-[0.36em] text-white/35">
                    iframe sandbox
                  </span>
                </div>
              </div>
              <Snippet>
                {`<div class="relative aspect-video w-full
  overflow-hidden bg-white/[0.03]">
  <iframe
    src={section.embedUrl}
    allow="autoplay; encrypted-media;
      picture-in-picture; fullscreen"
    allowFullScreen
    referrerPolicy="strict-origin-when-cross-origin"
    sandbox="allow-scripts
      allow-same-origin allow-presentation"
    class="absolute inset-0 h-full w-full"
  />
</div>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Galerie — 1 → 2 cols, gap-5/6">
              <div className="grid w-full max-w-md grid-cols-1 gap-5 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <figure key={i} className="space-y-2">
                    <div className="aspect-[5/4] w-full bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                    <figcaption className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                      Image {i}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Snippet>
                {`grid grid-cols-1 md:grid-cols-2 gap-5
ou gap-6 pour plus d'air
chaque figure : bg-white/[0.03]
  + figcaption uppercase tracking 0.32em`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Avatar — cercle au sceau">
              <div className="flex w-full max-w-md items-center gap-5">
                <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/40 font-serif text-3xl italic text-[#F5F5F7]">
                  <em>A</em>
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Sceau
                  </span>
                  <span className="font-serif text-base italic text-white/65">
                    Initiale du client en Fraunces italique
                  </span>
                </div>
              </div>
              <Snippet>
                {`inline-flex h-20 w-20 items-center
justify-center rounded-full
border border-white/40
font-serif text-3xl italic text-[#F5F5F7]
ou border-white/15 + opacity selon contexte`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Placeholder — état avant chargement">
              <div className="grid w-full max-w-md grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-sm border border-white/10 bg-white/[0.03]"
                  />
                ))}
              </div>
              <Snippet>
                {`aspect-square rounded-sm
border border-white/10 bg-white/[0.03]
toujours visible — pas d'effet shimmer
le grain de film fait office de "vivant"`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* FOCUS RINGS */}
        <Block
          eyebrow="15 · Focus & accessibilité"
          title="Focus rings · sélection · accent"
          intro="Focus sobre, jamais le ring bleu par défaut du browser. Inputs : border-b qui passe en white/80. Cards sélectionnées : ring-1 ring-inset white/40. Toujours focus-visible plutôt que focus brut pour ne pas activer au click souris."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Input focus — border-b passe en white/80">
              <Field label="Au focus, la hairline s'éclaircit">
                <input
                  type="text"
                  defaultValue="Tape ici · focus le champ"
                  className="w-full border-b border-white/20 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-[#F5F5F7] focus:border-white/80 focus:outline-none"
                />
              </Field>
              <Snippet>
                {`border-b border-white/20
focus:border-white/80
focus:outline-none
pas de ring custom, juste la border qui change
de white/20 → white/80 (3.5× plus visible)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Textarea focus — border full passe en white/40">
              <Field label="Textarea : la border-complète s'éclaircit">
                <textarea
                  rows={3}
                  defaultValue="Focus dans cette zone pour voir la border passer de white/10 à white/40"
                  className="w-full resize-y rounded-md border border-white/10 bg-white/[0.02] p-4 font-serif text-base text-[#F5F5F7]/90 focus:border-white/40 focus:outline-none"
                />
              </Field>
              <Snippet>
                {`border border-white/10
focus:border-white/40
les textareas ont un cadre complet
donc le ratio est plus doux (4×)
même logique : pas de ring, juste la border`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card sélectionnée — ring-1 ring-inset">
              <div className="grid w-full max-w-md grid-cols-2 gap-3">
                <button
                  type="button"
                  className="rounded-md border border-white/10 bg-black p-4 text-left ring-1 ring-inset ring-white/40 transition"
                >
                  <span className="text-[10px] uppercase tracking-[0.4em] text-white/85">
                    Sélectionné
                  </span>
                  <span className="mt-2 block font-sans text-base font-light text-[#F5F5F7]">
                    Option A
                  </span>
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/10 bg-black p-4 text-left transition hover:border-white/40"
                >
                  <span className="text-[10px] uppercase tracking-[0.4em] text-white/30">
                    Non
                  </span>
                  <span className="mt-2 block font-sans text-base font-light text-white/70">
                    Option B
                  </span>
                </button>
              </div>
              <Snippet>
                {`ring-1 ring-inset ring-white/40
sans changer la border externe
permet de superposer "border + ring"
sans double épaisseur visible
inset → pas de débordement hors box`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Card média sélectionnée — ring-2 ring-white/40">
              <div className="grid w-full max-w-md grid-cols-3 gap-2">
                <div className="relative aspect-square overflow-hidden rounded-md border border-white/70 bg-white/[0.04] ring-2 ring-white/40">
                  <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[9px] uppercase tracking-[0.3em] text-black">
                    Actuel
                  </span>
                </div>
                <div className="aspect-square overflow-hidden rounded-md border border-white/10 bg-white/[0.02]" />
                <div className="aspect-square overflow-hidden rounded-md border border-white/10 bg-white/[0.02]" />
              </div>
              <Snippet>
                {`border-white/70 + ring-2 ring-white/40
pour signaler l'item actuel d'une grille
+ chip "Actuel" en absolute (top-left)
double signal : border forte + ring extérieur`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Bouton focus-visible — keyboard nav">
              <button
                type="button"
                className="group inline-flex items-center gap-3 rounded-md px-3 py-2 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                <span>Tab vers moi</span>
                <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
              </button>
              <Snippet>
                {`focus-visible:outline-2
focus-visible:outline-offset-2
focus-visible:outline-white/70
focus-visible s'active uniquement
au clavier, pas au click souris
(WAI-ARIA best practice)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Checkbox / radio — accent white/87">
              <div className="flex w-full max-w-md flex-col gap-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 cursor-pointer accent-[#F5F5F7]"
                  />
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    accent-[#F5F5F7]
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="ds-radio"
                    defaultChecked
                    className="h-4 w-4 cursor-pointer accent-[#F5F5F7]"
                  />
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Radio même règle
                  </span>
                </label>
              </div>
              <Snippet>
                {`accent-[#F5F5F7]
remplace la couleur OS native
par le blanc cassé Speetch
fonctionne sur checkbox, radio,
progress, range`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Selection — ::selection custom">
              <p className="w-full max-w-md text-[14px] text-white/75 [&::selection]:bg-[#F5F5F7] [&::selection]:text-black">
                Survole et sélectionne ce texte : la sélection passe en blanc
                cassé avec texte noir, par contraste avec la palette globale.
              </p>
              <Snippet>
                {`globals.css :
::selection {
  background-color: var(--color-fg);
  color: var(--color-bg);
}
mode document :
::selection {
  background-color: #6E0410;
  color: #F8F1E0;
}`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tap highlight mobile — désactivé">
              <p className="w-full max-w-md text-[12px] text-white/55">
                <span className="font-mono text-white/65">
                  -webkit-tap-highlight-color: transparent
                </span>
                <br />
                Pas de halo bleu au tap sur mobile. Le hover/active styles
                Speetch reprennent la main.
              </p>
              <Snippet>
                {`globals.css :
* { -webkit-tap-highlight-color: transparent; }
sinon iOS et Android ajoutent leur halo
qui ne respecte pas la palette`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* ÉTATS DE CHARGEMENT */}
        <Block
          eyebrow="17 · États de chargement"
          title="Pending · saving · feedback"
          intro="Speetch ne montre jamais de spinner — uniquement du texte qui change. La règle : passe au présent continu (« Enregistrement… ») + disabled + opacity-50. Le grain et la sobriété font le reste."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Bouton pending — texte qui change + disabled">
              <div className="flex w-full max-w-md flex-col gap-3">
                <button
                  type="button"
                  className="group inline-flex w-fit items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors duration-300 hover:text-white"
                >
                  <span>Enregistrer</span>
                  <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                </button>
                <button
                  type="button"
                  disabled
                  className="group inline-flex w-fit items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors duration-300 hover:text-white disabled:cursor-wait disabled:opacity-50"
                >
                  <span>Enregistrement…</span>
                  <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                </button>
              </div>
              <Snippet>
                {`const { pending } = useFormStatus();
<button
  type="submit"
  disabled={pending}
  className="disabled:cursor-wait
    disabled:opacity-50"
>
  {pending ? "Enregistrement…" : "Enregistrer"}
</button>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Submit form — variantes par mode">
              <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
                <span>idle  : « Convertir et enregistrer »</span>
                <span>busy  : « Conversion en cours… »</span>
                <span>idle  : « Importer en l&apos;état »</span>
                <span>busy  : « Import en cours… »</span>
                <span>idle  : « Importer et créer la page »</span>
                <span>busy  : « Import en cours… »</span>
              </div>
              <Snippet>
                {`const idle = mode === "raw"
  ? "Importer en l'état"
  : "Convertir et enregistrer";
const busy = mode === "raw"
  ? "Import en cours…"
  : "Conversion en cours…";
{pending ? busy : idle}
le présent continu " en cours… " est plus chaud
que " loading " qui sonne technique`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Modale — Chargement intérieur">
              <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a0a0a]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Médiathèque
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.32em] text-white/40">
                    Fermer
                  </span>
                </div>
                <div className="flex items-center justify-center px-4 py-12">
                  <span className="font-serif italic text-white/40">
                    Chargement…
                  </span>
                </div>
              </div>
              <Snippet>
                {`<p class="font-serif italic text-white/40">
  Chargement…
</p>
italique Fraunces — moins agressif
qu'un texte sans-serif standard
+ pas de spinner, pas de skeleton`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Toast succès — sticky bottom + fade out">
              <div className="flex w-full max-w-md items-center justify-between gap-6 rounded-2xl border border-white/10 bg-black/65 px-5 py-3 backdrop-blur-md">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/55">
                    3 textes remplacés · 1 image
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.32em] text-emerald-300/80">
                    Enregistré
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                  ✓
                </span>
              </div>
              <Snippet>
                {`useEffect(() => {
  if (!success) return;
  const t = window.setTimeout(
    () => setSuccess(false), 2000
  );
  return () => window.clearTimeout(t);
}, [success]);

<AnimatePresence>
  {success && <motion.span
    initial={{ opacity: 0, y: -2 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
  >Enregistré</motion.span>}
</AnimatePresence>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Banner erreur — feedback formulaire">
              <p className="w-full max-w-md border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                ANTHROPIC_API_KEY manquante dans .env.local
              </p>
              <Snippet>
                {`<AnimatePresence>
  {state.status === "error" && state.error && (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="border-l-2 border-red-400/40 pl-4
        text-[11px] uppercase tracking-[0.32em]
        text-red-300/80"
    >{state.error}</motion.p>
  )}
</AnimatePresence>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Optimistic UI — la valeur a déjà bougé">
              <div className="flex w-full max-w-md items-center gap-3">
                <span className="block h-1 w-1 rounded-full bg-emerald-300" />
                <span className="text-emerald-300/80 text-[11px] uppercase tracking-[0.32em]">
                  Publiée
                </span>
                <span className="text-white/30 text-[10px] uppercase tracking-[0.32em]">
                  · sync…
                </span>
              </div>
              <Snippet>
                {`startTransition(async () => {
  const result = await updatePublished(...);
  if (!result.ok) setPage(prev); // rollback
});
// l'UI passe en "Publiée" instantanément
// l'attente serveur ne bloque pas le visuel`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Loader décoratif — counter typographique">
              <div className="flex w-full max-w-md flex-col gap-3 rounded-md border border-white/10 bg-black p-5">
                <div className="flex items-end justify-between gap-6">
                  <span className="font-serif text-3xl font-extralight italic leading-none tracking-[-0.04em] text-[#F5F5F7]">
                    Speetch
                    <br />
                    <em className="text-white/60">×</em> Brief
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                    062
                  </span>
                </div>
              </div>
              <Snippet>
                {`useEffect(() => {
  let pct = 0;
  const tick = () => {
    pct += Math.floor(Math.random() * 12) + 6;
    if (pct >= 100) { pct = 100; return; }
    setPct(pct.toString().padStart(3, '0'));
    setTimeout(tick, 80 + Math.random() * 80);
  };
  setTimeout(tick, 200);
}, []);
auto-dismiss via animation CSS (1.4s + 1.2s delay)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Disabled — visuellement quasi-identique">
              <div className="flex w-full max-w-md flex-col gap-2">
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-[0.32em] text-white/55 hover:text-white"
                >
                  Actif
                </button>
                <button
                  type="button"
                  disabled
                  className="text-[11px] uppercase tracking-[0.32em] text-white/55 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Désactivé · opacity-50
                </button>
              </div>
              <Snippet>
                {`disabled:opacity-50
disabled:cursor-not-allowed
ou disabled:cursor-wait (pour pending)
pas de fond grisé, pas de "barre" visible
juste l'opacité`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* CHARTS / DATA VIZ */}
        <Block
          eyebrow="29 · Charts / data viz"
          title="Bars · sparklines · donut · stats"
          intro="Speetch fait du data viz inline, sans librairie. SVG + Tailwind suffisent pour 80% des cas (bar, sparkline, donut). Couleur unique #F5F5F7 + opacités graduelles plutôt qu'arc-en-ciel coloré. Stat cards avec deltas en emerald/red."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Bar chart vertical — budget par phase">
              <div className="w-full max-w-md">
                <div className="flex h-32 items-end gap-3">
                  {[
                    { label: "Notoriété", value: 300, h: 25 },
                    { label: "Candidatures", value: 660, h: 55 },
                    { label: "Retargeting", value: 240, h: 20 },
                  ].map((b) => (
                    <div
                      key={b.label}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full origin-bottom bg-[#F5F5F7]"
                          style={{ height: `${b.h * 1.6}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-white/45">
                        {b.value}€
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-3 text-[9px] uppercase tracking-[0.32em] text-white/35">
                  <span className="flex-1 text-center">Notoriété</span>
                  <span className="flex-1 text-center">Candidatures</span>
                  <span className="flex-1 text-center">Retargeting</span>
                </div>
              </div>
              <Snippet>
                {`<div class="flex items-end gap-3 h-32">
  {data.map(b => (
    <div class="flex-1">
      <div class="w-full bg-[#F5F5F7]"
        style={{ height: \`\${pct}%\` }} />
    </div>
  ))}
</div>
+ axe X en-dessous (uppercase 0.32em white/35)
+ valeurs au-dessus de chaque barre`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Bar chart horizontal — répartition">
              <ul className="flex w-full max-w-md flex-col gap-3">
                {[
                  { label: "Édition libre", value: 64 },
                  { label: "Reproduction fidèle", value: 28 },
                  { label: "Autres", value: 8 },
                ].map((row) => (
                  <li key={row.label} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.32em] text-white/55">
                      <span>{row.label}</span>
                      <span className="font-mono text-white/45">
                        {row.value}%
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <span
                        className="block h-full bg-[#F5F5F7]"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <Snippet>
                {`<li class="flex flex-col gap-1">
  <header class="flex justify-between
    text-[11px] uppercase tracking-[0.32em]">
    <span>{label}</span>
    <span>{value}%</span>
  </header>
  <div class="h-1 rounded-full bg-white/[0.08]">
    <span class="block h-full bg-[#F5F5F7]"
      style={{ width: \`\${v}%\` }} />
  </div>
</li>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Sparkline — micro-tendance inline">
              <div className="flex w-full max-w-md items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  CPM · 7 derniers jours
                </span>
                <svg
                  width="120"
                  height="32"
                  viewBox="0 0 120 32"
                  fill="none"
                  className="text-[#F5F5F7]"
                >
                  <polyline
                    points="0,22 20,18 40,24 60,12 80,16 100,8 120,14"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="120" cy="14" r="2" fill="currentColor" />
                </svg>
                <span className="font-mono text-[12px] tabular-nums text-white/75">
                  17€
                </span>
              </div>
              <Snippet>
                {`<svg viewBox="0 0 120 32">
  <polyline points="0,22 20,18 40,24 ..."
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round" />
  <circle cx="120" cy="14" r="2"
    fill="currentColor" />
</svg>
+ pastille de fin pour ancrer le regard
inline avec label + valeur courante`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Donut — répartition simple en SVG">
              <div className="flex w-full max-w-md items-center gap-6">
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 100 100"
                  className="-rotate-90"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="rgba(245,245,247,0.10)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#F5F5F7"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.65} ${2 * Math.PI * 40}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="flex flex-col gap-2">
                  <span className="font-sans text-3xl font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    65<em className="font-serif italic font-light">%</em>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Pages publiées
                  </span>
                </div>
              </div>
              <Snippet>
                {`<svg class="-rotate-90" viewBox="0 0 100 100">
  <circle r="40" stroke="white/10" /> {/* track */}
  <circle r="40"
    stroke="#F5F5F7"
    stroke-dasharray={\`\${C * pct} \${C}\`}
    stroke-linecap="round"
  /> {/* progress */}
</svg>
C = 2πr ; on alloue C × pct en dash
rotate -90 pour démarrer en haut`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Stat card — valeur + delta vs période précédente">
              <div className="grid w-full max-w-md grid-cols-2 gap-px overflow-hidden rounded-md bg-white/[0.08]">
                <div className="flex flex-col gap-2 bg-black p-4">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Candidatures · 30j
                  </span>
                  <span className="font-sans text-3xl font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    142
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-emerald-300/80">
                    + 12% · vs 30j
                  </span>
                </div>
                <div className="flex flex-col gap-2 bg-black p-4">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    CPM moyen
                  </span>
                  <span className="font-sans text-3xl font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    17<em className="font-serif italic font-light">€</em>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                    − 5% · vs 30j
                  </span>
                </div>
              </div>
              <Snippet>
                {`<div class="flex flex-col gap-2 p-4">
  <span class="text-[10px] uppercase
    tracking-[0.32em] text-white/45">
    Label
  </span>
  <span class="font-sans text-3xl
    font-extralight tracking-[-0.03em]">
    {value}<em class="font-serif italic">€</em>
  </span>
  <span class="text-emerald-300/80
    or text-red-300/80">
    {sign}{delta}% · vs {period}
  </span>
</div>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Progress bar — étape sur N">
              <div className="flex w-full max-w-md flex-col gap-2">
                <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.32em] text-white/55">
                  <span>Tunnel candidature</span>
                  <span className="font-mono text-white/45">5 / 8</span>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full ${
                        i < 5 ? "bg-[#F5F5F7]" : "bg-white/[0.08]"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Snippet>
                {`grid grid-cols-N gap-1
+ {N segments} chacun h-1 rounded-full
  active : bg-[#F5F5F7]
  inactive : bg-white/[0.08]
plus narratif qu'une seule barre continue
pour les tunnels à étapes discrètes`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Heatmap — densité hebdomadaire">
              <div className="flex w-full max-w-md flex-col gap-2">
                <div className="grid grid-cols-12 gap-1">
                  {[
                    0.1, 0.3, 0.55, 0.2, 0.8, 0.4, 0.7, 0.9, 0.5, 0.2, 0.6, 0.3,
                    0.5, 0.7, 0.2, 0.1, 0.4, 0.6, 0.85, 0.95, 0.7, 0.3, 0.4, 0.5,
                    0.6, 0.8, 0.5, 0.4, 0.3, 0.65, 0.7, 0.85, 0.5, 0.2, 0.3, 0.4,
                  ].map((v, i) => (
                    <span
                      key={i}
                      className="block aspect-square w-full rounded-sm"
                      style={{
                        background: `rgba(245, 245, 247, ${0.05 + v * 0.55})`,
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-white/35">
                  <span>Moins</span>
                  <span className="flex gap-1">
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
                      <span
                        key={i}
                        className="block h-2 w-2 rounded-sm"
                        style={{
                          background: `rgba(245, 245, 247, ${0.05 + v * 0.55})`,
                        }}
                      />
                    ))}
                  </span>
                  <span>Plus</span>
                </div>
              </div>
              <Snippet>
                {`grid grid-cols-N (12, 14, 24 selon période)
+ {data.map(v => (
  <span style={{
    background: \`rgba(245,245,247, \${base + v*0.55})\`
  }} />
))}
opacité 0.05 → 0.6 selon valeur normalisée
légende discrète sous la grille`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Trend area — sparkline avec fill">
              <div className="flex w-full max-w-md flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Vues vidéo · 14j
                  </span>
                  <span className="font-sans text-2xl font-extralight tracking-[-0.03em] text-[#F5F5F7]">
                    12 480
                  </span>
                </div>
                <svg
                  width="100%"
                  height="48"
                  viewBox="0 0 240 48"
                  preserveAspectRatio="none"
                  className="text-[#F5F5F7]"
                >
                  <defs>
                    <linearGradient id="ds-trend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,38 L20,34 L40,30 L60,28 L80,18 L100,22 L120,14 L140,18 L160,10 L180,16 L200,8 L220,12 L240,6 L240,48 L0,48 Z"
                    fill="url(#ds-trend)"
                  />
                  <polyline
                    points="0,38 20,34 40,30 60,28 80,18 100,22 120,14 140,18 160,10 180,16 200,8 220,12 240,6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <Snippet>
                {`<svg viewBox="0 0 240 48" preserveAspectRatio="none">
  <defs><linearGradient id="..."
    x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopOpacity="0.35" />
    <stop offset="100%" stopOpacity="0" />
  </linearGradient></defs>
  <path d="...Z" fill="url(#...)" /> {/* aire */}
  <polyline points="..." stroke="currentColor" />
</svg>
gradient vertical white/0.35 → 0
+ polyline 1.25 stroke par-dessus`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* ERROR STATES */}
        <Block
          eyebrow="32 · Error states"
          title="404 · 500 · permission · inline"
          intro="Pas de page d'erreur clownesque. Texte sobre, éventuellement un sceau ou un large numéro Fraunces italique. Toujours un escape hatch (retour accueil, retour parent). Inline : border-l-2 + tracking 0.32em."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="404 — page introuvable">
              <div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-white/10 bg-black p-6">
                <span
                  className="font-serif italic font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]"
                  style={{ fontSize: "clamp(3rem, 8vw, 4.5rem)" }}
                >
                  404
                </span>
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                  Page introuvable
                </span>
                <span className="font-serif text-sm italic text-white/45">
                  La ressource demandée n&apos;existe pas ou a été déplacée.
                </span>
                <button
                  type="button"
                  className="group inline-flex w-fit items-center gap-3 pt-2 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white"
                >
                  <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                  <span>Retour accueil</span>
                </button>
              </div>
              <Snippet>
                {`404 monumental en Fraunces italique
+ label uppercase + body serif italic
+ CTA "Retour accueil"
créer app/not-found.tsx
+ next/navigation : notFound() pour trigger`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="500 — erreur serveur">
              <div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-red-400/20 bg-red-400/[0.04] p-6">
                <span
                  className="font-serif italic font-extralight leading-none tracking-[-0.04em] text-red-300"
                  style={{ fontSize: "clamp(3rem, 8vw, 4.5rem)" }}
                >
                  500
                </span>
                <span className="text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                  Erreur serveur
                </span>
                <span className="font-serif text-sm italic text-white/55">
                  Quelque chose s&apos;est mal passé. L&apos;équipe est
                  prévenue.
                </span>
                <button
                  type="button"
                  className="group inline-flex w-fit items-center gap-3 pt-2 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white"
                >
                  <span>Réessayer</span>
                  <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                </button>
              </div>
              <Snippet>
                {`app/error.tsx (route-level error boundary)
ou app/global-error.tsx
border-red-400/20 + bg-red-400/[0.04]
text-red-300 / red-300/80
+ digest exposé en dev pour debugging`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Permission refusée — soft redirect">
              <div className="flex w-full max-w-md flex-col gap-3 border-l-2 border-amber-300/40 pl-4">
                <span className="text-[11px] uppercase tracking-[0.32em] text-amber-200/80">
                  Accès réservé
                </span>
                <span className="font-serif text-sm italic text-white/65">
                  Cette section est réservée au propriétaire Speetch. Tu vas
                  être redirigé vers /admin.
                </span>
              </div>
              <Snippet>
                {`pattern actuel :
const ownerEmail = process.env
  .SPEETCH_OWNER_EMAIL?.toLowerCase();
if (ownerEmail
  && user.email?.toLowerCase() !== ownerEmail) {
  redirect("/admin");
}
hard redirect côté server :
silencieux, l'utilisateur arrive sur /admin`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Inline — erreur de formulaire">
              <p className="w-full max-w-md border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                Le nom du template doit faire au moins 2 caractères.
              </p>
              <Snippet>
                {`border-l-2 border-red-400/40 pl-4
text-[11px] uppercase tracking-[0.32em]
text-red-300/80
pas de fond, pas de cadre, juste la barre`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Inline — erreur de chargement (modale)">
              <p className="w-full max-w-md border-b border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                Erreur Storage · bucket page-media indisponible
              </p>
              <Snippet>
                {`pour les modales et zones défilantes :
border-b + bg léger
plus persistant qu'une simple barre
préfixe contextuel : "Erreur Storage · "
+ message technique court`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Catch-all — erreur inattendue">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/55">
                {`try {
  await action();
} catch (err) {
  if (err instanceof Anthropic.APIError) {
    return { status: "error",
      error: \`Erreur API Claude
        (\${err.status}) : \${err.message}\` };
  }
  console.error("[ctx] unexpected:", err);
  return { status: "error",
    error: "Erreur inattendue." };
}`}
              </pre>
              <Snippet>
                {`pattern serveur :
1. typed error (APIError, PostgrestError)
2. fallback générique avec message court
3. console.error avec préfixe [context]
4. retourne { status, error } stable
jamais d'erreur brute exposée à l'user`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* EMPTY STATES */}
        <Block
          eyebrow="33 · Empty states"
          title="Aucun · pas encore · invitation à créer"
          intro="Pareils aux erreurs : sobres, jamais d'illustration cute. Toujours un CTA pour la prochaine action. Petite phrase serif italique en explication, puis appel à l'action en bold-extralight."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Liste vide — pattern principal">
              <div className="flex w-full max-w-md flex-col items-start gap-6 border-t border-white/10 p-6">
                <p className="max-w-md text-balance font-serif text-base italic text-white/40">
                  Aucun template personnalisé en BDD. Les 5 presets code
                  restent toujours disponibles à la création.
                </p>
                <button
                  type="button"
                  className="group inline-flex items-center gap-4 text-xl font-light text-[#F5F5F7] transition-colors md:text-2xl"
                >
                  <span>Importer le premier HTML</span>
                  <span className="inline-block h-px w-8 bg-current transition-all duration-500 ease-out group-hover:w-16" />
                </button>
              </div>
              <Snippet>
                {`<div class="flex flex-col items-start gap-8
  border-t border-white/10 pt-16">
  <p class="max-w-md text-balance
    font-serif italic text-white/40">
    Description du vide + contexte
  </p>
  <Link class="group ... text-2xl font-light">
    <span>Action principale</span>
    <span class="h-px w-10 group-hover:w-20" />
  </Link>
</div>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Projet sans pages">
              <div className="flex w-full max-w-md flex-col items-start gap-4 border-t border-white/10 p-6">
                <p className="max-w-md text-balance font-serif text-base italic text-white/40">
                  Ce projet n&apos;a encore aucune page. Démarre avec un
                  template pour poser une première mise en forme.
                </p>
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 text-2xl font-light text-[#F5F5F7] transition-colors md:text-3xl"
                >
                  <span>Créer la première page</span>
                  <span className="inline-block h-px w-10 bg-current transition-all duration-500 ease-out group-hover:w-20" />
                </button>
              </div>
              <Snippet>
                {`même squelette
mais le CTA est plus monumental (3xl)
parce qu'il invite à un acte structurant
(création d'une entité enfant)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Médiathèque vide — au sein d'une modale">
              <div className="flex w-full max-w-md flex-col items-start gap-4 rounded-md border border-white/10 bg-[#0a0a0a] p-6">
                <p className="font-serif italic text-white/40">
                  Aucun média pour ce projet. Téléverse une image ou une vidéo
                  pour démarrer.
                </p>
              </div>
              <Snippet>
                {`pour les vides "passagers" (modales) :
juste une phrase serif italic
pas de CTA (le bouton est ailleurs
  dans le header de la modale)
texte uniquement, pas d'illustration`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Recherche sans résultat">
              <div className="flex w-full max-w-md flex-col gap-3">
                <Field label="Filtrer">
                  <input
                    type="text"
                    defaultValue="xyz123"
                    className="border-b border-white/20 bg-transparent pb-2 text-base font-light text-[#F5F5F7] focus:border-white/80 focus:outline-none"
                  />
                </Field>
                <p className="font-serif text-sm italic text-white/45">
                  Aucun résultat pour <em className="text-white/65">xyz123</em>
                  . Essaie un autre terme ou efface pour tout afficher.
                </p>
              </div>
              <Snippet>
                {`<p class="font-serif italic text-white/45">
  Aucun résultat pour
  <em class="text-white/65">{query}</em>.
  Essaie un autre terme...
</p>
+ option : bouton "Effacer le filtre"`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Stat à zéro — pas encore d'activité">
              <div className="flex w-full max-w-md flex-col gap-2 border-t border-white/10 pt-4">
                <span className="text-[10px] uppercase tracking-[0.36em] text-white/45">
                  Candidatures · 30j
                </span>
                <span className="font-sans text-3xl font-extralight tracking-[-0.03em] text-white/30">
                  0
                </span>
                <span className="text-[11px] uppercase tracking-[0.32em] text-white/35">
                  Aucune activité — la campagne n&apos;a pas démarré
                </span>
              </div>
              <Snippet>
                {`value text-white/30 (opacity-50 du standard)
+ explication tracking-[0.32em] white/35
fait passer l'absence comme un fait
plutôt que comme un échec`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* SEARCH INPUTS */}
        <Block
          eyebrow="34 · Search inputs"
          title="Filtres · recherche · combobox"
          intro="Pas de loupe en préfixe — Speetch préfère l'icône en suffixe à droite ou pas d'icône du tout, juste un placeholder italique. Quand il y a un raccourci (⌘K), il s'affiche à droite en kbd."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Recherche simple — input + placeholder italic">
              <Field label="Filtrer">
                <input
                  type="search"
                  placeholder="Tape pour filtrer la liste…"
                  className="w-full border-b border-white/20 bg-transparent pb-2 font-sans text-base font-light text-[#F5F5F7] placeholder:font-serif placeholder:italic placeholder:text-white/30 focus:border-white/80 focus:outline-none"
                />
              </Field>
              <Snippet>
                {`<input type="search" placeholder="…"
  class="border-b border-white/20
    placeholder:font-serif
    placeholder:italic
    placeholder:text-white/30
    focus:border-white/80
    focus:outline-none">
italique sur le placeholder pour adoucir
disparaît au focus`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Avec icône suffixe + raccourci">
              <div className="flex w-full max-w-md items-center justify-between rounded-md border border-white/10 bg-black px-4 py-3">
                <span className="font-serif italic text-white/40">
                  Recherche globale
                </span>
                <div className="flex items-center gap-3">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/40"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                  </svg>
                  <span className="flex items-center gap-1">
                    <Kbd>⌘</Kbd>
                    <Kbd>K</Kbd>
                  </span>
                </div>
              </div>
              <Snippet>
                {`<div class="flex items-center justify-between
  rounded-md border border-white/10 bg-black
  px-4 py-3">
  <input class="bg-transparent" />
  <div class="flex items-center gap-3">
    <SearchIcon class="text-white/40" />
    <KbdCombo keys={['⌘', 'K']} />
  </div>
</div>
trigger ⌘K → focus l'input ou ouvre la palette`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Recherche avec bouton clear">
              <Field label="Filtrer">
                <div className="flex items-center gap-3 border-b border-white/20 pb-2 focus-within:border-white/80">
                  <input
                    type="search"
                    defaultValue="brief"
                    className="flex-1 bg-transparent font-sans text-base font-light text-[#F5F5F7] placeholder:text-white/25 focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Effacer"
                    className="text-[14px] text-white/45 transition-colors hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </Field>
              <Snippet>
                {`wrapper border-b
  focus-within:border-white/80
+ input flex-1 bg-transparent
+ bouton × quand value.length > 0
le wrapper gère le focus, pas l'input seul`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Filtres en chips — facettes">
              <div className="flex w-full max-w-md flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/85">
                  Campagne Meta
                  <button
                    type="button"
                    aria-label="Retirer"
                    className="text-white/45 hover:text-white"
                  >
                    ×
                  </button>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/85">
                  Publié
                  <button
                    type="button"
                    aria-label="Retirer"
                    className="text-white/45 hover:text-white"
                  >
                    ×
                  </button>
                </span>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-dashed border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:border-white/40 hover:text-white"
                >
                  + Ajouter un filtre
                </button>
              </div>
              <Snippet>
                {`chip actif :
  border-white/40 (au lieu de white/15)
  text-white/85 (au lieu de white/70)
+ bouton × intégré
chip ajout :
  border-dashed border-white/20`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Combobox — résultats en live">
              <div className="w-full max-w-md space-y-2">
                <Field label="Tape pour chercher">
                  <input
                    type="search"
                    defaultValue="brief"
                    className="border-b border-white/20 bg-transparent pb-2 font-sans text-base font-light text-[#F5F5F7] focus:border-white/80 focus:outline-none"
                  />
                </Field>
                <ul className="flex flex-col gap-px overflow-hidden rounded-md border border-white/10 bg-[#0a0a0a]">
                  {[
                    "Brief de production",
                    "Brief shooting",
                    "Brief direction",
                  ].map((item, i) => (
                    <li
                      key={item}
                      className={`flex items-center justify-between px-3 py-2 text-[12px] transition-colors ${
                        i === 0
                          ? "bg-white/[0.06] text-white/85"
                          : "bg-black text-white/65 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span>
                        <span className="text-[#F5F5F7]">Brief</span>
                        {item.slice(5)}
                      </span>
                      {i === 0 && (
                        <span className="text-[9px] uppercase tracking-[0.32em] text-white/45">
                          ↵
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <Snippet>
                {`liste : rounded-md border-white/10
  bg-[#0a0a0a] gap-px
item actif : bg-white/[0.06]
+ highlight du match dans le texte :
  <span class="text-[#F5F5F7]">{matched}</span>
+ indicateur ↵ à droite du focused`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* SPLASH SCREENS */}
        <Block
          eyebrow="35 · Splash screens"
          title="Loaders · transitions d'entrée"
          intro="Splash CSS-driven (pas dépendant de JS), counter typographique optionnel, dismiss via animation auto. Toujours sous z-100 et fond noir absolu. Sortie : translateY(-101%) en 1.4s cubic-bezier(0.22, 1, 0.36, 1)."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Splash principal — Speetch × Client">
              <div className="relative h-48 w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black">
                <div className="absolute inset-0 flex items-end justify-between p-5">
                  <span className="font-serif text-2xl font-extralight italic leading-tight tracking-[-0.04em] text-[#F5F5F7]">
                    Speetch
                    <br />
                    <em className="text-white/65">×</em> Club Abrazo
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                    082
                  </span>
                </div>
              </div>
              <Snippet>
                {`<div class="fixed inset-0 z-[100]
  bg-black flex items-end justify-between
  p-8 pointer-events-none
  animation: loader-out 1.4s cubic-bezier(...)
    1.2s forwards">
  <div class="font-serif italic
    text-[clamp(2.5rem, 8vw, 5rem)]">
    Speetch <em>×</em> {clientName}
  </div>
  <span class="font-mono text-[11px]
    uppercase tracking-[0.32em]
    text-white/45">{pct}</span>
</div>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Splash sortie — translateY(-101%)">
              <div className="w-full max-w-md space-y-2 font-mono text-[10px] text-white/55">
                <span>animation : loader-out</span>
                <span>duration : 1.4s</span>
                <span>delay : 1.2s</span>
                <span>easing : cubic-bezier(0.22, 1, 0.36, 1)</span>
                <span>fill-mode : forwards</span>
                <span>transform : translateY(0) → translateY(-101%)</span>
              </div>
              <Snippet>
                {`@keyframes loader-out {
  to { transform: translateY(-101%); }
}
.loader {
  animation: loader-out 1.4s
    cubic-bezier(0.22, 1, 0.36, 1)
    1.2s forwards;
}
-101% pour ne pas laisser de pixel
visible au-dessus du viewport`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Splash auth — pre-loader vide">
              <div className="relative h-32 w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="font-sans font-extralight tracking-[-0.06em] text-[#F5F5F7]"
                    style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
                  >
                    Speetch
                  </span>
                </div>
              </div>
              <Snippet>
                {`fond noir + nom centré
ni counter, ni timestamp
pour les "trous" courts :
  vérification session,
  redirection,
  loading initial
disparition opacity 0 sans translate`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Splash route — entre 2 navigations">
              <div className="relative h-32 w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black">
                <div className="absolute left-0 top-0 h-px w-1/3 bg-[#F5F5F7]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/45">
                    Chargement…
                  </span>
                </div>
              </div>
              <Snippet>
                {`loading.tsx au niveau de la route
+ progress bar fine au top
+ texte minimal centré
Next App Router le déclenche automatiquement
quand une page se charge`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Splash avec counter — variante FWA">
              <div className="relative h-48 w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                  <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">
                    Loading
                  </span>
                  <span
                    className="font-mono text-[#F5F5F7]"
                    style={{ fontSize: "clamp(3rem, 8vw, 5rem)" }}
                  >
                    082
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                    Préparation des assets
                  </span>
                </div>
              </div>
              <Snippet>
                {`compteur géant en font-mono
+ eyebrow "Loading" + sous-titre statut
useEffect avec increment pseudo-random :
  setInterval(() => setPct(p =>
    Math.min(100, p + Math.random() * 12 + 6)),
  100);
dismiss à 100% via CSS animation`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Splash signout — sortie graceful">
              <div className="relative h-32 w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-serif text-base italic text-white/65">
                    <em>À bientôt.</em>
                  </span>
                </div>
              </div>
              <Snippet>
                {`onClick signout :
1. setExiting(true)
2. attendre 250ms (transition opacity)
3. supabase.auth.signOut()
4. router.push('/login')
splash optionnel pendant l'étape 3-4
texte serif italic chaud`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* CALLOUTS ÉDITORIAUX */}
        <Block
          eyebrow="40 · Callouts éditoriaux"
          title="Encarts · citations courtes · notices"
          intro="Les callouts cassent le rythme d'un long texte pour mettre en relief une phrase, une règle, ou une mise en garde. Toujours un fond ultra-léger + une border-left de 2px qui les ancre visuellement. Italique Fraunces pour la voix éditoriale, sans-serif pour les notices techniques."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Quote callout — citation éditoriale">
              <div className="w-full max-w-md border-l border-white/15 py-2 pl-6">
                <p
                  className="font-serif font-light italic text-white/85"
                  style={{
                    fontSize: "clamp(1.125rem, 1.8vw, 1.375rem)",
                    lineHeight: "1.45",
                    fontFamily: "var(--font-serif), Fraunces, serif",
                  }}
                >
                  La campagne est <em className="text-white">conçue intemporelle.</em>{" "}
                  Les visuels et copies tournent identiquement quelle que soit
                  la prochaine soirée.
                </p>
              </div>
              <Snippet>
                {`<div class="border-l border-white/15
  py-2 pl-6">
  <p class="font-serif font-light italic
    text-white/85
    leading-[1.45]"
    style={{ fontSize: 'clamp(...)' }}>
    Citation avec <em>accent</em>.
  </p>
</div>
border-l 1px white/15 ancre sans agresser
fraunces italique pour la voix éditoriale`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Info callout — notice neutre">
              <div className="w-full max-w-md rounded-md border border-white/10 bg-white/[0.03] px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/65">
                  Info
                </p>
                <p className="mt-2 font-serif text-sm italic text-white/55 md:text-base">
                  Les pages créées depuis ce template gardent leur contenu —
                  l&apos;édition du template n&apos;affecte que les futures
                  pages.
                </p>
              </div>
              <Snippet>
                {`<div class="rounded-md border border-white/10
  bg-white/[0.03] px-5 py-4">
  <p class="text-[11px] uppercase
    tracking-[0.32em] text-white/65">Info</p>
  <p class="mt-2 font-serif italic
    text-white/55">{body}</p>
</div>
pas de border-left, fond doux
pour les informations contextuelles
sans urgence`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Warning — amber, attention requise">
              <div className="w-full max-w-md rounded-md border border-amber-300/20 bg-amber-300/[0.04] px-5 py-4">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-amber-200/80">
                  <span className="block h-1 w-1 rounded-full bg-amber-300" />
                  Attention
                </p>
                <p className="mt-2 font-serif text-sm italic text-white/65 md:text-base">
                  Changer de niveau de fidélité requiert un nouveau fichier
                  HTML — sinon le contenu actuel ne correspondrait plus.
                </p>
              </div>
              <Snippet>
                {`border-amber-300/20 bg-amber-300/[0.04]
+ dot bg-amber-300 dans le label
+ label text-amber-200/80
+ body white/65 (plus chaud que /55)
pour les pré-requis, garde-fous,
limites importantes à connaître`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Success — emerald, confirmation">
              <div className="w-full max-w-md rounded-md border border-emerald-400/20 bg-emerald-400/[0.04] px-5 py-4">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-emerald-200/85">
                  <span className="block h-1 w-1 rounded-full bg-emerald-300" />
                  Enregistré
                </p>
                <p className="mt-2 font-serif text-sm italic text-white/65 md:text-base">
                  3 textes remplacés · 1 image · Le rendu public sera à jour au
                  prochain chargement.
                </p>
              </div>
              <Snippet>
                {`border-emerald-400/20
bg-emerald-400/[0.04]
text-emerald-200/85 (label)
+ dot bg-emerald-300
pour les confirmations d'action
auto-dismiss au bout de 2-3s
ou persistant si état durable`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Error — red, échec / blocage">
              <div className="w-full max-w-md rounded-md border border-red-400/20 bg-red-400/[0.04] px-5 py-4">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
                  <span className="block h-1 w-1 rounded-full bg-red-300" />
                  Erreur
                </p>
                <p className="mt-2 font-serif text-sm italic text-white/65 md:text-base">
                  ANTHROPIC_API_KEY manquante dans <span className="font-mono">.env.local</span>
                  {" "}— impossible d&apos;appeler Claude.
                </p>
              </div>
              <Snippet>
                {`border-red-400/20 bg-red-400/[0.04]
text-red-300/80 + dot bg-red-300
pour les échecs serveur, blocages
toujours expliciter le pourquoi
+ si possible : que faire pour résoudre`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Reproduction fidèle — bandeau de mode">
              <div className="w-full max-w-md rounded-md border border-amber-300/20 bg-amber-300/[0.04] px-5 py-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-amber-200/80">
                  Reproduction fidèle
                </p>
                <p className="mt-2 font-serif text-sm italic text-white/55 md:text-base">
                  Le contenu de cette page provient du HTML brut.
                  L&apos;intro et les sections ci-dessous ne sont pas rendues
                  sur la page publique.
                </p>
              </div>
              <Snippet>
                {`même squelette que Warning
mais sans dot — c'est un statut
pas une alerte
pour signaler un mode d'édition spécial
contexte permanent sur la page concernée`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Numbered callout — encart avec numéro géant">
              <div className="grid w-full max-w-md grid-cols-[60px_1fr] gap-4 border-t border-white/10 pt-5">
                <span
                  className="font-serif font-extralight italic leading-none tracking-[-0.04em] text-white/85"
                  style={{
                    fontFamily: "var(--font-serif), Fraunces, serif",
                    fontSize: "3rem",
                  }}
                >
                  03
                </span>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/65">
                    Brief visuel par direction
                  </span>
                  <p className="font-serif text-sm italic text-white/55 md:text-base">
                    Trois récits, trois grammaires. D1 sans mots, D2 dans la
                    danse, D3 en faire-part typographique.
                  </p>
                </div>
              </div>
              <Snippet>
                {`grid grid-cols-[60px_1fr] gap-4
+ numéro Fraunces italique 3rem white/85
+ label uppercase white/65
+ body serif italique white/55
pour les listes éditoriales hiérarchiques
(chapitres, étapes, principes)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Bordeaux callout — mode document éditorial">
              <div className="w-full max-w-md rounded-md border-l-2 border-[#C61428] bg-[#6E0410]/[0.05] py-3 pl-5 pr-4">
                <p
                  className="font-serif font-light italic"
                  style={{
                    fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
                    color: "#C61428",
                    lineHeight: "1.5",
                    fontFamily: "var(--font-doc-italic), Cormorant Garamond, serif",
                  }}
                >
                  Stratégie d&apos;enchères : commencer en{" "}
                  <em style={{ fontStyle: "italic" }}>Conversions</em> dès que
                  50 candidatures sont remontées.
                </p>
              </div>
              <Snippet>
                {`mode document (palette crème/bordeaux) :
border-l-2 border-[#C61428]
bg-[#6E0410]/[0.05]
text-[#C61428]
Cormorant Garamond italique
pour les pages en meta.style = "document"
pas utilisé dans Speetch noir`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Inline callout — phrase mise en évidence">
              <p className="w-full max-w-md text-[15px] leading-relaxed text-white/75">
                Le tunnel Club Abrazo enchaîne huit étapes.{" "}
                <span className="bg-[#F5F5F7]/[0.08] px-1 py-0.5 font-serif italic text-white/85">
                  Meta n&apos;intervient que sur la première marche.
                </span>{" "}
                Tout ce qui suit relève du tunnel manuel.
              </p>
              <Snippet>
                {`<span class="bg-[#F5F5F7]/[0.08]
  px-1 py-0.5
  font-serif italic text-white/85">
  {phrase à surligner}
</span>
discret "highlight" inline
pour souligner une assertion clé
sans casser le flux de paragraphe`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hint inline — note tech petite">
              <p className="w-full max-w-md text-[12px] italic text-white/45">
                <em className="not-italic font-mono text-white/65">
                  rate limit ·
                </em>{" "}
                30 requêtes / minute en mode édition libre. Les uploads larges
                consomment plus.
              </p>
              <Snippet>
                {`<p class="text-[12px] italic text-white/45">
  <em class="not-italic font-mono text-white/65">
    {label} ·
  </em>
  {explanation}
</p>
pour les détails techniques inline
sous une action, en footer d'un input
plus discret que les callouts boxés`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* PULL QUOTES */}
        <Block
          eyebrow="41 · Pull quotes"
          title="Citations monumentales · attribution · enchâssement"
          intro="Le pull quote sort le lecteur de sa lecture pour lui faire entendre une voix forte. Plus grand que le corps, Fraunces italique, jamais d'image décorative autour. Le guillemet « » peut être affiché XL pour ancrer visuellement, sinon le retrait suffit."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Pull quote standard — Fraunces italique centré">
              <blockquote className="flex w-full max-w-md flex-col items-start gap-4 py-4">
                <p
                  className="font-serif font-light italic leading-[1.25] tracking-[-0.02em] text-[#F5F5F7]"
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                    fontFamily: "var(--font-serif), Fraunces, serif",
                  }}
                >
                  Trois minutes d&apos;étreinte en disent plus que six mois
                  d&apos;échanges écrits.
                </p>
              </blockquote>
              <Snippet>
                {`<blockquote class="flex flex-col gap-4 py-8">
  <p class="font-serif font-light italic
    leading-[1.25] tracking-[-0.02em]
    text-[#F5F5F7]"
    style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
    {citation}
  </p>
</blockquote>
Fraunces italique, weight 300
leading 1.25 (très serré)
text-[#F5F5F7] (intensité max)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Avec guillemet géant — décoration FWA">
              <blockquote className="relative flex w-full max-w-md flex-col items-start gap-4 py-4 pl-12">
                <span
                  className="absolute left-0 top-0 font-serif font-light italic leading-none text-white/15"
                  style={{
                    fontFamily: "var(--font-serif), Fraunces, serif",
                    fontSize: "5rem",
                  }}
                  aria-hidden
                >
                  «
                </span>
                <p
                  className="font-serif font-light italic leading-[1.25] tracking-[-0.02em] text-[#F5F5F7]"
                  style={{
                    fontSize: "clamp(1.25rem, 2.4vw, 1.75rem)",
                    fontFamily: "var(--font-serif), Fraunces, serif",
                  }}
                >
                  Vous êtes passé·e par notre antichambre. La porte reste
                  entrouverte.
                </p>
              </blockquote>
              <Snippet>
                {`<blockquote class="relative pl-12 py-8">
  <span class="absolute left-0 top-0
    font-serif italic font-light
    text-white/15 leading-none
    text-[5rem]" aria-hidden>«</span>
  <p>...</p>
</blockquote>
guillemet décoratif XL en white/15
aria-hidden : ne lit pas le glyphe
le retrait pl-12 dégage l'espace`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Avec attribution — auteur + contexte">
              <figure className="flex w-full max-w-md flex-col gap-4 border-l border-white/15 py-3 pl-6">
                <blockquote>
                  <p
                    className="font-serif font-light italic leading-[1.3] tracking-[-0.02em] text-[#F5F5F7]"
                    style={{
                      fontSize: "clamp(1.125rem, 2vw, 1.5rem)",
                      fontFamily: "var(--font-serif), Fraunces, serif",
                    }}
                  >
                    On a oublié comment se taire ensemble.
                  </p>
                </blockquote>
                <figcaption className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Isis Sylvestre
                  </span>
                  <span className="font-serif text-xs italic text-white/40">
                    Fondatrice du Club Abrazo
                  </span>
                </figcaption>
              </figure>
              <Snippet>
                {`<figure class="flex flex-col gap-4
  border-l border-white/15 py-3 pl-6">
  <blockquote>
    <p class="font-serif italic font-light">
      {quote}
    </p>
  </blockquote>
  <figcaption class="flex flex-col gap-1">
    <span class="text-[11px] uppercase
      tracking-[0.32em] text-white/55">
      {author}
    </span>
    <span class="font-serif italic
      text-xs text-white/40">{role}</span>
  </figcaption>
</figure>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pull quote monumental — page éditoriale">
              <blockquote className="flex w-full max-w-md flex-col items-center gap-3 py-6 text-center">
                <p
                  className="font-serif font-extralight italic leading-[1.05] tracking-[-0.04em] text-[#F5F5F7]"
                  style={{
                    fontSize: "clamp(2rem, 5vw, 3.5rem)",
                    fontFamily: "var(--font-serif), Fraunces, serif",
                  }}
                >
                  Avant les mots.
                </p>
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/40">
                  Direction 01
                </span>
              </blockquote>
              <Snippet>
                {`Fraunces ExtraLight italic
leading 1.05, tracking -0.04em
fontSize clamp(2rem, 5vw, 3.5rem)
+ eyebrow tracking 0.4em white/40
+ center align (rare ailleurs)
pour les heros de chapitre poétiques`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Asymétrique — pull margin (édition longue)">
              <div className="grid w-full max-w-md grid-cols-[1fr_2fr] gap-6">
                <blockquote className="border-r border-white/15 pr-4">
                  <p
                    className="font-serif font-light italic leading-[1.2] tracking-[-0.02em] text-[#F5F5F7]"
                    style={{
                      fontSize: "clamp(0.95rem, 1.4vw, 1.125rem)",
                      fontFamily: "var(--font-serif), Fraunces, serif",
                    }}
                  >
                    L&apos;abrazo s&apos;amorce.
                  </p>
                </blockquote>
                <p className="text-[14px] leading-relaxed text-white/65">
                  Deux silhouettes qui se rapprochent dans la pénombre.
                  L&apos;épaule de l&apos;une touche le bras de l&apos;autre.
                  Caméra fixe. Sous-titre : « les ». Trois secondes seulement
                  mais tout commence là.
                </p>
              </div>
              <Snippet>
                {`grid grid-cols-[1fr_2fr] gap-6
+ blockquote dans colonne gauche
  avec border-r blanche/15
+ paragraphe long à droite
permet de faire respirer la citation
sans interrompre le flux du texte
inspiration : magazine layout`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Multi-ligne — coupe rythmée">
              <blockquote className="flex w-full max-w-md flex-col items-start gap-2 py-4">
                <p
                  className="font-serif font-light italic leading-[1.1] tracking-[-0.04em] text-[#F5F5F7]"
                  style={{
                    fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                    fontFamily: "var(--font-serif), Fraunces, serif",
                  }}
                >
                  Trois minutes
                  <br />
                  d&apos;étreinte
                  <br />
                  en disent plus
                  <br />
                  que six mois.
                </p>
              </blockquote>
              <Snippet>
                {`<p>...
  <br />
  ...
</p>
casser manuellement les lignes
selon la respiration souhaitée
chaque rupture = un battement
réservé aux citations FWA monumentales
qui veulent un effet typographique`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Citation bloc — référence longue">
              <figure className="flex w-full max-w-md flex-col gap-3 rounded-md border border-white/10 bg-white/[0.02] p-5">
                <blockquote>
                  <p className="font-serif text-base italic leading-relaxed text-white/85">
                    Ce que la pub Meta vend : une candidature au club, pas un
                    billet daté. La création ne mentionne ni la date, ni le
                    prix, ni le déroulé de la soirée. Tout cela se dévoile après
                    la sélection d&apos;Isis, dans le parcours email et
                    l&apos;entretien physique.
                  </p>
                </blockquote>
                <figcaption className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-white/45">
                  <span>Extrait · brief production V2</span>
                  <span>2026-05-13</span>
                </figcaption>
              </figure>
              <Snippet>
                {`<figure class="rounded-md
  border border-white/10
  bg-white/[0.02] p-5
  flex flex-col gap-3">
  <blockquote class="font-serif italic
    text-base leading-relaxed white/85">
    {passage long}
  </blockquote>
  <figcaption class="flex justify-between
    text-[10px] uppercase tracking-[0.32em]
    text-white/45">
    <span>{source}</span>
    <span>{date}</span>
  </figcaption>
</figure>
plus institutionnel — pour références
de documents externes, citations longues`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Voix — Brand callout (mode document)">
              <blockquote
                className="w-full max-w-md border-l-2 py-3 pl-5"
                style={{ borderColor: "#C61428" }}
              >
                <p
                  className="font-light italic leading-[1.4]"
                  style={{
                    fontSize: "clamp(1.125rem, 1.8vw, 1.375rem)",
                    color: "#6E0410",
                    fontFamily: "var(--font-doc-italic), Cormorant Garamond, serif",
                  }}
                >
                  La rareté comme posture, l&apos;attention comme luxe.
                </p>
              </blockquote>
              <Snippet>
                {`mode document (page raw_html style="document") :
border-l-2 [#C61428] (bordeaux glow)
text-[#6E0410] (bordeaux deep)
Cormorant Garamond italique
pour les pull quotes dans les briefs
de production, propositions éditoriales`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tip — quand utiliser une pull quote">
              <ul className="flex w-full max-w-md flex-col gap-2 text-[13px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>
                    1 fois par page longue, pas plus. La rareté fait sa force.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>
                    Phrase courte, autoportante, qui condense l&apos;idée.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>
                    Reformulation possible — pas obligé de citer textuellement.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>
                    Ne pas recopier une phrase qui apparaît telle quelle juste
                    au-dessus (déjà lue).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>Pas dans les listes / contenu très structuré.</span>
                </li>
              </ul>
              <Snippet>
                {`règle "une page = une pull quote max"
positionnement : après le 1er ou 2e
paragraphe utile (pas au tout début)
fonction : créer un point de respiration
entre 2 passages denses`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* DROPCAP */}
        <Block
          eyebrow="42 · Dropcap"
          title="Lettrines · première lettre monumentale"
          intro="La lettrine ancre un long paragraphe avec une initiale Fraunces italique étirée sur 2 à 4 lignes. Elle signale au lecteur qu'il entre dans un texte sérieux et long. À utiliser une fois par page max — généralement après le hero, sur le premier vrai paragraphe."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Dropcap 3 lignes — standard">
              <p className="w-full max-w-md text-[15px] leading-[1.7] text-white/75">
                <span
                  className="float-left mr-3 mt-1 font-serif font-light italic leading-[0.85] tracking-[-0.04em] text-[#F5F5F7]"
                  style={{
                    fontFamily: "var(--font-serif), Fraunces, serif",
                    fontSize: "4rem",
                  }}
                >
                  L
                </span>
                e tunnel Club Abrazo enchaîne huit étapes. Meta n&apos;intervient
                que sur la première marche, sa mission unique étant d&apos;envoyer
                à clubabrazo.com des profils suffisamment qualitatifs pour que
                le taux de conversion en candidature reste élevé.
              </p>
              <Snippet>
                {`<p class="leading-[1.7]">
  <span class="float-left mr-3 mt-1
    font-serif italic font-light
    leading-[0.85] tracking-[-0.04em]
    text-[#F5F5F7]"
    style={{ fontSize: '4rem' }}>
    {firstLetter}
  </span>
  {rest of paragraph}
</p>
float-left + mr-3 (espacement)
mt-1 pour aligner la baseline`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Dropcap 4 lignes — monumental">
              <p className="w-full max-w-md text-[15px] leading-[1.7] text-white/75">
                <span
                  className="float-left mr-4 mt-1 font-serif font-light italic leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
                  style={{
                    fontFamily: "var(--font-serif), Fraunces, serif",
                    fontSize: "5.5rem",
                  }}
                >
                  A
                </span>
                vant les mots. Cette suspension d&apos;une seconde, juste avant
                que la main se pose, où tout se sait déjà. Le silence du début.
                Ce que la pub Meta vend, c&apos;est cet instant. Une candidature
                au club, pas un billet daté.
              </p>
              <Snippet>
                {`fontSize: '5.5rem'
mr-4 (plus d'espacement)
tracking -0.05em (plus serré)
pour les ouvertures FWA monumentales
attention : nécessite 4+ lignes de texte
sinon la lettre flotte sans ancrage`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Dropcap 2 lignes — compact">
              <p className="w-full max-w-md text-[14px] leading-[1.65] text-white/75">
                <span
                  className="float-left mr-2 mt-0.5 font-serif font-light italic leading-[0.85] text-[#F5F5F7]"
                  style={{
                    fontFamily: "var(--font-serif), Fraunces, serif",
                    fontSize: "2.5rem",
                  }}
                >
                  D
                </span>
                eux silhouettes qui se rapprochent dans la pénombre. L&apos;épaule
                de l&apos;une touche le bras de l&apos;autre, l&apos;abrazo
                s&apos;amorce.
              </p>
              <Snippet>
                {`fontSize: '2.5rem'
mr-2 (espacement réduit)
mt-0.5 (alignement plus fin)
pour les paragraphes courts
ou la deuxième moitié d'une page éditée`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Dropcap CSS — via ::first-letter">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`.dropcap::first-letter {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-weight: 300;
  font-size: 4rem;
  line-height: 0.85;
  letter-spacing: -0.04em;
  color: #F5F5F7;
  float: left;
  margin: 0.25rem 0.75rem 0 0;
}`}
              </pre>
              <Snippet>
                {`alternative à <span> inline :
si on contrôle pas le contenu (CMS, Claude),
::first-letter applique au premier caractère
+ aucune intervention sur le HTML
- moins flexible (pas de modulation par lettre)
- certains contextes ne supportent pas
  ::first-letter (cellules de tableau)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Dropcap accent — accentué avec hairline">
              <div className="w-full max-w-md">
                <p className="text-[15px] leading-[1.7] text-white/75">
                  <span className="float-left mr-3 mt-1 flex flex-col items-center gap-1">
                    <span
                      className="font-serif font-light italic leading-[0.85] tracking-[-0.04em] text-[#F5F5F7]"
                      style={{
                        fontFamily: "var(--font-serif), Fraunces, serif",
                        fontSize: "4rem",
                      }}
                    >
                      C
                    </span>
                    <span className="inline-block h-px w-8 bg-[#F5F5F7]/40" />
                  </span>
                  ette suspension d&apos;une seconde, juste avant que la main se
                  pose, où tout se sait déjà. Le silence du début, conçu
                  intemporel.
                </p>
              </div>
              <Snippet>
                {`<span class="float-left mr-3 mt-1
  flex flex-col items-center gap-1">
  <span class="font-serif italic ...">
    {first letter}
  </span>
  <span class="h-px w-8 bg-[#F5F5F7]/40" />
</span>
hairline horizontale sous la lettre
pour ancrer plus fortement le départ
réservé aux ouvertures importantes`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Dropcap bordeaux — mode document">
              <p
                className="w-full max-w-md text-[15px] leading-[1.7]"
                style={{ color: "#1A0306" }}
              >
                <span
                  className="float-left mr-3 mt-1 font-light italic leading-[0.85] tracking-[-0.04em]"
                  style={{
                    fontFamily: "var(--font-doc-display), Playfair Display, serif",
                    fontSize: "4rem",
                    color: "#6E0410",
                  }}
                >
                  B
                </span>
                <span style={{ color: "rgba(245, 245, 247, 0.75)" }}>
                  rief production V2 pour la campagne Meta intemporelle du Club
                  Abrazo. Trois directions séquencées autour de la première
                  Soirée Découverte du 13 juin.
                </span>
              </p>
              <Snippet>
                {`mode document (style="document") :
fontFamily: 'Playfair Display'
color: '#6E0410' (bordeaux deep)
même structure que dropcap Speetch
juste palette adaptée à la page
réservé aux pages /clients/[slug]/...
en meta.style = "document"`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tip — règle d'usage">
              <ul className="flex w-full max-w-md flex-col gap-2 text-[13px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>1 dropcap par page maximum.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>
                    Sur le premier paragraphe utile (souvent après hero / intro).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-emerald-300/80">
                    ✓
                  </span>
                  <span>Paragraphe d&apos;au moins 4 lignes.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>
                    Pas sur une liste, un titre, un caption.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>Pas de dropcap sur une lettre accentuée (É, À, Î).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-red-300/80">
                    ✗
                  </span>
                  <span>
                    Pas de dropcap avec apostrophe («&#8239;L&apos;agence&#8239;» → choisir un autre mot).
                  </span>
                </li>
              </ul>
              <Snippet>
                {`règles tirées de l'imprimerie traditionnelle :
- pas accentuée car visuellement bancal
- pas de glyphe complexe en première position
- nécessite assez de chair (4+ lignes)
le DA décide à la main quels paragraphes
méritent la lettrine — c'est un acte éditorial`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* CODE BLOCKS */}
        <Block
          eyebrow="43 · Code blocks"
          title="Inline · pre · syntax · terminal"
          intro="Speetch écrit beaucoup de snippets de code dans le design system et les briefs. Tous suivent le même squelette : font-mono, 11px, white/65, rounded-md border-white/10, fond bg-black/40. Pas de coloration syntaxique riche — juste 3 tokens (keyword, string, comment) en opacités graduelles."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Code inline — dans le texte">
              <p className="w-full max-w-md text-[14px] leading-relaxed text-white/75">
                Pour générer un nouveau slug, utilise{" "}
                <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-[#F5F5F7]">
                  ensureUniqueSlug(base, exists)
                </code>{" "}
                — il appelle la lookup BDD passée en deuxième argument.
              </p>
              <Snippet>
                {`<code class="rounded bg-white/[0.08]
  px-1.5 py-0.5
  font-mono text-[12px]
  text-[#F5F5F7]">
  {snippet}
</code>
rounded sans -md (subtle)
px-1.5 py-0.5 — chip compact
text-[12px] = 1 cran sous le body 14`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Code block — pre simple">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-white/65">
                {`function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}`}
              </pre>
              <Snippet>
                {`<pre class="whitespace-pre-wrap
  rounded-md border border-white/10
  bg-black/40 p-3 md:p-4
  font-mono text-[11px]
  leading-relaxed text-white/65">
  {code}
</pre>
whitespace-pre-wrap = respecte les sauts
mais wrap si trop large
leading-relaxed = lisibilité`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Code block — avec syntax 3 tokens">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-white/65">
                <span className="text-white/35">
                  {`// Convertit un eyebrow en id slugifié`}
                </span>
                {"\n"}
                <span className="text-emerald-300/80">{`function`}</span>{" "}
                <span className="text-[#F5F5F7]">slugifyEyebrow</span>
                <span className="text-white/55">{`(`}</span>
                <span className="text-amber-200/75">{`eyebrow`}</span>
                <span className="text-white/55">{`:`}</span>{" "}
                <span className="text-emerald-300/80">string</span>
                <span className="text-white/55">{`):`}</span>{" "}
                <span className="text-emerald-300/80">string</span>{" "}
                <span className="text-white/55">{`{`}</span>
                {"\n  "}
                <span className="text-emerald-300/80">{`return`}</span>{" "}
                eyebrow.normalize
                <span className="text-white/55">{`(`}</span>
                <span className="text-amber-200/75">{`"NFKD"`}</span>
                <span className="text-white/55">{`)`}</span>;
                {"\n"}
                <span className="text-white/55">{`}`}</span>
              </pre>
              <Snippet>
                {`3 tokens uniquement :
- keyword : text-emerald-300/80
- string : text-amber-200/75
- comment : text-white/35
- default : text-white/65
- punctuation : text-white/55
- identifier nommé : text-[#F5F5F7]
pas de librairie shiki/prism
applique tokens manuels ou via <Highlight />`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Code block — avec file path header">
              <div className="w-full max-w-md overflow-hidden rounded-md border border-white/10">
                <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="font-mono text-[10px] text-white/55">
                    lib/page-templates.ts
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                    Copier
                  </span>
                </header>
                <pre className="whitespace-pre-wrap bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                  {`export const CUSTOM_TEMPLATE_ID = "_custom";
export function isStandaloneTemplateId(v: string) {
  return v === RAW_HTML_VIRTUAL_TEMPLATE_ID
    || v === CUSTOM_TEMPLATE_ID;
}`}
                </pre>
              </div>
              <Snippet>
                {`<div class="rounded-md border border-white/10
  overflow-hidden">
  <header class="border-b border-white/10
    bg-white/[0.03] px-3 py-2 flex justify-between">
    <span class="font-mono text-[10px]
      text-white/55">{path}</span>
    <button class="text-[10px] uppercase
      tracking-[0.32em] text-white/40">
      Copier
    </button>
  </header>
  <pre class="bg-black/40 p-3 ...">
    {code}
  </pre>
</div>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Diff — additions et suppressions">
              <pre className="w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black/40 font-mono text-[11px] leading-relaxed">
                <span className="block bg-emerald-400/[0.05] px-4 py-0.5 text-emerald-300/80">
                  + export const CUSTOM_TEMPLATE_ID = &quot;_custom&quot;;
                </span>
                <span className="block bg-red-400/[0.05] px-4 py-0.5 text-red-300/80">
                  - export const CUSTOM_TEMPLATE_ID = &quot;_detached&quot;;
                </span>
                <span className="block px-4 py-0.5 text-white/65">
                  {"  export function isStandaloneTemplateId(v) {"}
                </span>
                <span className="block px-4 py-0.5 text-white/65">
                  &nbsp;&nbsp;&nbsp;&nbsp;return v === RAW_HTML_VIRTUAL_TEMPLATE_ID
                </span>
                <span className="block bg-emerald-400/[0.05] px-4 py-0.5 text-emerald-300/80">
                  +&nbsp;&nbsp;&nbsp;&nbsp;|| v === CUSTOM_TEMPLATE_ID;
                </span>
              </pre>
              <Snippet>
                {`<pre>
  <span class="block bg-emerald-400/[0.05]
    text-emerald-300/80 px-4">+ {line}</span>
  <span class="block bg-red-400/[0.05]
    text-red-300/80 px-4">- {line}</span>
  <span class="block px-4 text-white/65">
    &nbsp;&nbsp;{line}</span>
</pre>
préfixe "+ " ou "- " explicite
ne pas se reposer uniquement
sur la couleur (a11y)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Terminal output — preset shell">
              <pre className="w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black/60 font-mono text-[11px] leading-relaxed">
                <span className="block border-b border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[10px] uppercase tracking-[0.32em] text-white/35">
                  zsh · ~/dev/speetch
                </span>
                <div className="space-y-1 p-3">
                  <p>
                    <span className="text-emerald-300/85">$</span>{" "}
                    <span className="text-[#F5F5F7]">npx tsc --noEmit</span>
                  </p>
                  <p className="text-white/50">  (no output — clean)</p>
                  <p>
                    <span className="text-emerald-300/85">$</span>{" "}
                    <span className="text-[#F5F5F7]">npm run dev</span>
                  </p>
                  <p className="text-white/55">  ▲ Next.js 15.5.18 (dev)</p>
                  <p className="text-white/55">  - Local:        http://localhost:3000</p>
                  <p className="text-emerald-300/80">  ✓ Ready in 1.2s</p>
                </div>
              </pre>
              <Snippet>
                {`<pre class="border border-white/10
  bg-black/60 rounded-md overflow-hidden">
  <header class="border-b bg-white/[0.02]
    uppercase text-white/35">
    {shell} · {cwd}
  </header>
  <div class="p-3 space-y-1">
    <p><span class="text-emerald-300/85">$</span>
      {command}</p>
    <p class="text-white/55">  {output}</p>
  </div>
</pre>
prompt $ en emerald, command blanche
output white/55, success white/85`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Inline path / variable">
              <p className="w-full max-w-md text-[14px] leading-relaxed text-white/75">
                Le bucket{" "}
                <code className="font-mono text-[12px] text-emerald-300/85">
                  page-media
                </code>{" "}
                vit dans{" "}
                <code className="font-mono text-[12px] text-white/85">
                  supabase/migrations/20260513170000_create_page_media_bucket.sql
                </code>
                .
              </p>
              <Snippet>
                {`<code class="font-mono text-[12px]
  text-white/85">
  {path / filename}
</code>
<code class="font-mono text-[12px]
  text-emerald-300/85">
  {keyword / nom propre du système}
</code>
pas de fond, juste mono + couleur
pour les chemins inline et noms tech`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Variable env — masquage">
              <pre className="w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`SUPABASE_SERVICE_ROLE_KEY = `}
                <span className="text-white/40">●●●●●●●●●●●●●</span>
                {"\n"}
                {`ANTHROPIC_API_KEY = `}
                <span className="text-white/40">●●●●●●●●●●●●●</span>
                {"\n"}
                {`SPEETCH_OWNER_EMAIL = `}
                <span className="text-emerald-300/85">clubabrazo@gmail.com</span>
              </pre>
              <Snippet>
                {`pour les secrets / variables sensibles :
remplacer la valeur par "●●●●" (white/40)
ou "…" mais pattern dot plus parlant
ne JAMAIS montrer la vraie clé même en debug
emerald pour les valeurs publiques visibles`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Code block — line numbers en gutter">
              <pre className="w-full max-w-md overflow-hidden rounded-md border border-white/10 bg-black/40 font-mono text-[11px] leading-relaxed">
                <div className="grid grid-cols-[2rem_1fr] gap-x-3 px-3 py-3">
                  {[
                    { n: "1", line: 'import { redirect } from "next/navigation";' },
                    { n: "2", line: 'import { revalidatePath } from "next/cache";' },
                    { n: "3", line: "" },
                    { n: "4", line: "async function requireOwner() {" },
                    { n: "5", line: "  // auth check" },
                    { n: "6", line: "}" },
                  ].map((row) => (
                    <span key={row.n} className="contents">
                      <span className="text-right font-mono text-[10px] text-white/25 tabular-nums">
                        {row.n}
                      </span>
                      <span className="text-white/65">{row.line || " "}</span>
                    </span>
                  ))}
                </div>
              </pre>
              <Snippet>
                {`<div class="grid grid-cols-[2rem_1fr]
  gap-x-3 px-3 py-3">
  {lines.map((line, i) => (
    <>
      <span class="text-right text-[10px]
        text-white/25 tabular-nums">
        {i + 1}
      </span>
      <span class="text-white/65">{line}</span>
    </>
  ))}
</div>
+ contents pour que le grid s'applique
tabular-nums pour aligner les chiffres`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Snippets dans le design system — usage actuel">
              <p className="w-full max-w-md text-[12px] leading-relaxed text-white/55">
                Le composant{" "}
                <code className="font-mono text-[11px] text-[#F5F5F7]">
                  &lt;Snippet&gt;
                </code>{" "}
                utilisé partout dans le design system suit la règle minimale :
                pre + whitespace-pre-wrap + border-white/10 + bg-black/40 +
                font-mono 11px + text-white/55. Pas de coloration syntaxique
                (volontaire — c&apos;est de la doc, pas un éditeur).
              </p>
              <Snippet>
                {`function Snippet({ children }) {
  return (
    <pre class="w-full max-w-md
      whitespace-pre-wrap
      rounded-md border border-white/10
      bg-black/40 p-3
      font-mono text-[11px]
      leading-relaxed text-white/55
      md:w-auto md:min-w-[260px]">
      {children}
    </pre>
  );
}`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* NUMBERED STEPS */}
        <Block
          eyebrow="44 · Numbered steps"
          title="Tunnels · process · wizards"
          intro="Séquences d'étapes numérotées : Speetch les utilise pour les tunnels (Campagne → candidature → entretien…), les process créatifs, les wizards admin. Toujours mono-couleur, numéros Fraunces italique ou typographie technique tracking 0.36em, ligne de connexion entre étapes."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Tunnel horizontal — étapes pleine largeur">
              <ol className="grid w-full max-w-md grid-cols-4 gap-px overflow-hidden rounded-md bg-white/[0.08]">
                {[
                  { n: "01", label: "Pub Meta" },
                  { n: "02", label: "Landing" },
                  { n: "03", label: "Sélection" },
                  { n: "04", label: "Entretien" },
                ].map((s) => (
                  <li
                    key={s.n}
                    className="flex h-24 flex-col justify-between bg-black p-3"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                      {s.n}
                    </span>
                    <span className="text-[12px] font-light text-white/85">
                      {s.label}
                    </span>
                  </li>
                ))}
              </ol>
              <Snippet>
                {`<ol class="grid grid-cols-N gap-px
  overflow-hidden rounded-md
  bg-white/[0.08]">
  <li class="bg-black p-3
    flex flex-col justify-between
    min-h-[6rem]">
    <span>{n}</span>
    <span>{label}</span>
  </li>
</ol>
gap-px + bg parent = séparateur hairline
flex justify-between = num haut, label bas`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tunnel avec étape mise en avant">
              <ol className="grid w-full max-w-md grid-cols-3 gap-px overflow-hidden rounded-md bg-white/[0.08]">
                {[
                  { n: "01", label: "Pub Meta", active: true, sub: "Marche actuelle" },
                  { n: "02", label: "Landing", active: false },
                  { n: "03", label: "Sélection", active: false },
                ].map((s) => (
                  <li
                    key={s.n}
                    className={`flex min-h-[6rem] flex-col justify-between p-3 ${
                      s.active ? "bg-white/[0.06]" : "bg-black"
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.32em] ${
                        s.active ? "text-[#F5F5F7]" : "text-white/35"
                      }`}
                    >
                      {s.n}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`text-[12px] font-light ${
                          s.active ? "text-[#F5F5F7]" : "text-white/65"
                        }`}
                      >
                        {s.label}
                      </span>
                      {s.sub && (
                        <span className="text-[9px] uppercase tracking-[0.32em] text-white/55">
                          {s.sub}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              <Snippet>
                {`active : bg-white/[0.06]
  + num text-[#F5F5F7]
  + label text-[#F5F5F7]
  + sub-label uppercase 0.32em white/55
inactive : bg-black
  + num text-white/35
  + label text-white/65
pour signaler l'étape courante`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Steps verticaux — phases avec body">
              <ol className="flex w-full max-w-md flex-col gap-6">
                {[
                  {
                    n: "01",
                    label: "Notoriété & Vues vidéo",
                    body: "J–30 → J–18 · 300 €",
                  },
                  {
                    n: "02",
                    label: "Candidatures (cœur)",
                    body: "J–18 → J–3 · 660 €",
                  },
                  {
                    n: "03",
                    label: "Retargeting",
                    body: "J–10 → J–1 · 240 €",
                  },
                ].map((s) => (
                  <li
                    key={s.n}
                    className="grid grid-cols-[60px_1fr] items-start gap-4"
                  >
                    <span
                      className="font-serif font-extralight italic leading-none tracking-[-0.04em] text-white/85"
                      style={{
                        fontFamily: "var(--font-serif), Fraunces, serif",
                        fontSize: "2.5rem",
                      }}
                    >
                      {s.n}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase tracking-[0.32em] text-white/65">
                        {s.label}
                      </span>
                      <span className="font-serif text-sm italic text-white/55">
                        {s.body}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
              <Snippet>
                {`grid grid-cols-[60px_1fr] gap-4
+ num Fraunces italique 2.5rem white/85
+ label uppercase tracking-[0.32em] white/65
+ body serif italic white/55
pour les listes de phases / chapitres
verticales (storyboard, process créatif)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Step avec ligne de connexion verticale">
              <ol className="flex w-full max-w-md flex-col">
                {[
                  { n: "01", label: "Brief reçu", status: "done" },
                  { n: "02", label: "Analyse stratégique", status: "done" },
                  { n: "03", label: "Direction créative", status: "current" },
                  { n: "04", label: "Production", status: "pending" },
                  { n: "05", label: "Livraison", status: "pending" },
                ].map((s, i, arr) => {
                  const isLast = i === arr.length - 1;
                  const isCurrent = s.status === "current";
                  const isDone = s.status === "done";
                  return (
                    <li
                      key={s.n}
                      className="relative flex items-start gap-4 pb-6"
                    >
                      {!isLast && (
                        <span className="absolute left-[14px] top-7 h-full w-px bg-white/15" />
                      )}
                      <span
                        className={`relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          isDone
                            ? "border-[#F5F5F7]/85 bg-[#F5F5F7]/85 text-black"
                            : isCurrent
                              ? "border-[#F5F5F7] bg-black text-[#F5F5F7]"
                              : "border-white/20 bg-black text-white/40"
                        }`}
                      >
                        <span className="font-mono text-[9px] tabular-nums">
                          {isDone ? "✓" : s.n}
                        </span>
                      </span>
                      <div className="flex-1 pt-1">
                        <span
                          className={`text-[12px] uppercase tracking-[0.32em] ${
                            isCurrent
                              ? "text-[#F5F5F7]"
                              : isDone
                                ? "text-white/65"
                                : "text-white/35"
                          }`}
                        >
                          {s.label}
                        </span>
                        {isCurrent && (
                          <p className="mt-1 font-serif text-sm italic text-white/55">
                            Étape en cours · D2 validée, exploration D3
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Snippet>
                {`<li class="relative flex gap-4 pb-6">
  {!isLast && <span class="absolute
    left-[14px] top-7 h-full w-px
    bg-white/15" />}
  <span class="relative z-10 h-7 w-7
    rounded-full border ...
    flex items-center justify-center">
    {done ? '✓' : n}
  </span>
  <div>{label + optional body}</div>
</li>
3 états : done (rempli) / current (creux fort)
/ pending (creux atténué)
ligne de connexion absolute derrière les ronds`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Wizard horizontal — étapes avec dots">
              <ol className="flex w-full max-w-md items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => {
                  const active = i === 3;
                  const done = i < 3;
                  return (
                    <li key={i} className="flex flex-1 items-center gap-2">
                      <span
                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          done
                            ? "border-[#F5F5F7]/85 bg-[#F5F5F7]/85 text-black"
                            : active
                              ? "border-[#F5F5F7] bg-black text-[#F5F5F7]"
                              : "border-white/20 bg-black text-white/35"
                        }`}
                      >
                        <span className="font-mono text-[9px]">
                          {done ? "✓" : i}
                        </span>
                      </span>
                      {i < 5 && (
                        <span
                          className={`h-px flex-1 ${
                            i < 3 ? "bg-[#F5F5F7]/60" : "bg-white/15"
                          }`}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
              <Snippet>
                {`<ol class="flex items-center gap-2">
  <li class="flex-1 flex items-center gap-2">
    <span class="h-6 w-6 rounded-full ...">{i}</span>
    <span class="h-px flex-1 bg-..." />
  </li>
</ol>
les segments de ligne entre dots
prennent la couleur de l'état atteint
(brillante avant le current, atténuée après)
pour les flows multi-étapes admin`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Numéros XL — process créatif">
              <ol className="grid w-full max-w-md grid-cols-3 gap-px overflow-hidden rounded-md bg-white/[0.08]">
                {[
                  { n: "01", label: "Discovery", body: "Cadrage du besoin" },
                  { n: "02", label: "Concept", body: "Exploration créative" },
                  { n: "03", label: "Production", body: "Finalisation" },
                ].map((s) => (
                  <li
                    key={s.n}
                    className="flex h-32 flex-col items-start justify-between bg-black p-4"
                  >
                    <span
                      className="font-serif font-extralight italic leading-none tracking-[-0.04em] text-[#F5F5F7]"
                      style={{
                        fontFamily: "var(--font-serif), Fraunces, serif",
                        fontSize: "2.5rem",
                      }}
                    >
                      {s.n}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-[0.32em] text-white/65">
                        {s.label}
                      </span>
                      <span className="font-serif text-xs italic text-white/45">
                        {s.body}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
              <Snippet>
                {`pour les présentations FWA Grade :
- num en Fraunces italique 2.5rem
- label uppercase 0.32em white/65
- body serif italique white/45
- card h-32 avec justify-between
plus expressif que les puces texte
réservé aux pages publiques`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Mini-stepper — formulaire 3/5">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.32em]">
                  <span className="text-white/55">Étape 3 sur 5</span>
                  <span className="font-mono text-white/45">60 %</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full ${
                        i < 3 ? "bg-[#F5F5F7]" : "bg-white/[0.08]"
                      }`}
                    />
                  ))}
                </div>
                <p className="font-serif text-sm italic text-white/55">
                  Direction visuelle. Tu choisis l&apos;une des trois pistes
                  proposées avant de passer à la production.
                </p>
              </div>
              <Snippet>
                {`pour les multi-step forms :
- header "Étape N sur M" + %
- 5 segments grid-cols-5 gap-1
  actifs bg-[#F5F5F7], inactifs bg-white/[0.08]
- description en serif italique white/55
plus discret qu'un vrai stepper visuel
quand on n'a pas besoin des labels`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* TIMELINE */}
        <Block
          eyebrow="45 · Timeline"
          title="Chronologie · milestones · phases datées"
          intro="Différent du storyboard (séquence narrative en plans). La timeline ancre des événements dans le temps : phases de campagne, livraisons, historique. Vertical pour les détails, horizontal pour la vue d'ensemble. Toujours date à gauche en mono, contenu à droite."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Timeline verticale — phases datées">
              <ol className="flex w-full max-w-md flex-col">
                {[
                  {
                    date: "14 mai",
                    phase: "Phase 1",
                    title: "Notoriété & vues vidéo",
                    body: "Direction D1 vidéo + image · 300 €",
                  },
                  {
                    date: "26 mai",
                    phase: "Phase 2",
                    title: "Candidatures (cœur)",
                    body: "D1 + D2 en A/B · 660 €",
                  },
                  {
                    date: "3 juin",
                    phase: "Phase 3",
                    title: "Retargeting",
                    body: "D3 faire-part · 240 €",
                  },
                  {
                    date: "13 juin",
                    phase: "Soirée Découverte",
                    title: "Première session",
                    body: "Soirée à Paris · tunnel manuel Isis",
                  },
                ].map((e, i, arr) => {
                  const isLast = i === arr.length - 1;
                  return (
                    <li
                      key={e.date}
                      className="relative grid grid-cols-[70px_1fr] gap-4 pb-6"
                    >
                      {!isLast && (
                        <span className="absolute left-[74px] top-2 h-full w-px bg-white/15" />
                      )}
                      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/55 tabular-nums">
                        {e.date}
                      </span>
                      <div className="relative flex flex-col gap-1 pl-4">
                        <span className="absolute -left-px top-1.5 block h-1.5 w-1.5 rounded-full bg-[#F5F5F7]" />
                        <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                          {e.phase}
                        </span>
                        <span className="text-[15px] font-light text-[#F5F5F7]">
                          {e.title}
                        </span>
                        <span className="font-serif text-sm italic text-white/55">
                          {e.body}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Snippet>
                {`<ol class="flex flex-col">
  <li class="relative grid grid-cols-[70px_1fr]
    gap-4 pb-6">
    {!isLast && <span class="absolute
      left-[74px] top-2 h-full w-px bg-white/15" />}
    <span class="font-mono text-[10px]
      tracking-[0.32em] text-white/55">
      {date}
    </span>
    <div class="relative flex flex-col gap-1 pl-4">
      <span class="absolute -left-px top-1.5
        h-1.5 w-1.5 rounded-full bg-[#F5F5F7]" />
      ...
    </div>
  </li>
</ol>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Timeline avec marqueurs d'état">
              <ol className="flex w-full max-w-md flex-col">
                {[
                  {
                    date: "13 mai",
                    title: "Brief reçu",
                    status: "done",
                  },
                  {
                    date: "14 mai",
                    title: "Première réunion stratégie",
                    status: "done",
                  },
                  {
                    date: "Aujourd&apos;hui",
                    title: "Validation des directions visuelles",
                    status: "current",
                    body: "D1 validée · D2/D3 en revue",
                  },
                  {
                    date: "20 mai",
                    title: "Shooting",
                    status: "pending",
                  },
                  {
                    date: "26 mai",
                    title: "Mise en production",
                    status: "pending",
                  },
                ].map((e, i, arr) => {
                  const isLast = i === arr.length - 1;
                  const isCurrent = e.status === "current";
                  const isDone = e.status === "done";
                  return (
                    <li
                      key={`${e.date}-${i}`}
                      className="relative grid grid-cols-[90px_1fr] gap-4 pb-5"
                    >
                      {!isLast && (
                        <span className="absolute left-[97px] top-3 h-full w-px bg-white/15" />
                      )}
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.32em] tabular-nums ${
                          isCurrent
                            ? "text-[#F5F5F7]"
                            : isDone
                              ? "text-white/55"
                              : "text-white/30"
                        }`}
                      >
                        <span dangerouslySetInnerHTML={{ __html: e.date }} />
                      </span>
                      <div className="relative flex flex-col gap-1 pl-4">
                        <span
                          className={`absolute -left-[3px] top-1 block h-2 w-2 rounded-full border ${
                            isDone
                              ? "border-[#F5F5F7]/85 bg-[#F5F5F7]/85"
                              : isCurrent
                                ? "border-[#F5F5F7] bg-black"
                                : "border-white/25 bg-black"
                          }`}
                        />
                        <span
                          className={`text-[13px] ${
                            isCurrent
                              ? "font-light text-[#F5F5F7]"
                              : isDone
                                ? "text-white/55 line-through decoration-white/15"
                                : "text-white/35"
                          }`}
                        >
                          {e.title}
                        </span>
                        {e.body && (
                          <span className="font-serif text-xs italic text-white/55">
                            {e.body}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Snippet>
                {`3 états :
- done : titre line-through decoration-white/15
  dot rempli bg-[#F5F5F7]/85
- current : titre white, body italique
  dot creux border-[#F5F5F7]
- pending : titre white/35
  dot creux border-white/25
+ position relative absolute pour la connecting line`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Timeline horizontale — vue d'ensemble">
              <div className="w-full max-w-md space-y-3">
                <div className="relative flex items-center justify-between pt-3">
                  <span className="absolute left-0 right-0 top-[18px] h-px bg-white/15" />
                  {[
                    { d: "14/05", label: "Phase 1" },
                    { d: "26/05", label: "Phase 2" },
                    { d: "03/06", label: "Phase 3" },
                    { d: "13/06", label: "Soirée" },
                  ].map((e, i) => (
                    <div key={e.d} className="relative z-10 flex flex-col items-center gap-2">
                      <span className="font-mono text-[10px] text-white/45 tabular-nums">
                        {e.d}
                      </span>
                      <span
                        className={`block h-2 w-2 rounded-full ${
                          i < 2
                            ? "bg-[#F5F5F7]/85"
                            : i === 2
                              ? "bg-[#F5F5F7] ring-2 ring-[#F5F5F7]/25"
                              : "border border-white/25 bg-black"
                        }`}
                      />
                      <span className="text-[9px] uppercase tracking-[0.32em] text-white/55">
                        {e.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Snippet>
                {`relative + ligne absolute top-N h-px
+ flex justify-between
chaque step : flex-col items-center
- date mono au-dessus
- dot d'état centré
- label uppercase en-dessous
ring-2 sur le dot courant pour halo`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Phase block — bloc de période">
              <div className="grid w-full max-w-md grid-cols-1 gap-px overflow-hidden rounded-md bg-white/[0.08] md:grid-cols-3">
                {[
                  {
                    period: "J–30 → J–18",
                    range: "14 → 26 mai",
                    label: "Notoriété",
                  },
                  {
                    period: "J–18 → J–3",
                    range: "26 mai → 10 juin",
                    label: "Candidatures",
                  },
                  {
                    period: "J–10 → J–1",
                    range: "3 → 12 juin",
                    label: "Retargeting",
                  },
                ].map((p) => (
                  <div key={p.period} className="flex flex-col gap-1 bg-black p-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                      {p.period}
                    </span>
                    <span className="text-[13px] font-light text-[#F5F5F7]">
                      {p.label}
                    </span>
                    <span className="font-serif text-xs italic text-white/55">
                      {p.range}
                    </span>
                  </div>
                ))}
              </div>
              <Snippet>
                {`grid-cols-1 md:grid-cols-3 gap-px
+ chaque phase : bg-black p-4
- period (J–N) en font-mono
- label en font-light
- range concret en serif italique
pour visualiser un planning à 3 phases
sans chronologie continue`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Activity log — historique récent">
              <ol className="flex w-full max-w-md flex-col gap-3">
                {[
                  {
                    time: "il y a 2 min",
                    actor: "Speetch",
                    action: "a modifié 3 textes",
                    target: "Brief de production",
                  },
                  {
                    time: "il y a 12 min",
                    actor: "Isis",
                    action: "a uploadé un visuel",
                    target: "Brief shooting",
                  },
                  {
                    time: "il y a 1 h",
                    actor: "Speetch",
                    action: "a publié une page",
                    target: "Tableau interactif",
                  },
                  {
                    time: "il y a 3 h",
                    actor: "Speetch",
                    action: "a créé un projet",
                    target: "Campagne mai juin 2026",
                  },
                ].map((entry, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] text-white/75">
                        <em className="font-serif italic text-white/85">
                          {entry.actor}
                        </em>{" "}
                        {entry.action}{" "}
                        <em className="font-serif italic text-white/65">
                          {entry.target}
                        </em>
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                      {entry.time}
                    </span>
                  </li>
                ))}
              </ol>
              <Snippet>
                {`<ol class="flex flex-col gap-3">
  <li class="flex justify-between
    border-b border-white/10 pb-3
    last:border-b-0">
    <p>
      <em>{actor}</em> {action} <em>{target}</em>
    </p>
    <span class="font-mono text-[10px]
      uppercase tracking-[0.32em]
      text-white/35">
      {time}
    </span>
  </li>
</ol>
acteur + cible en Fraunces italique
verbe en sans, temps en mono`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Now · Next · Future — vue à 3 horizons">
              <div className="grid w-full max-w-md grid-cols-1 gap-px overflow-hidden rounded-md bg-white/[0.08] md:grid-cols-3">
                <div className="flex flex-col gap-2 bg-black p-4">
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-emerald-200/80">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping-soft" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    </span>
                    Now
                  </span>
                  <span className="text-[13px] font-light text-[#F5F5F7]">
                    Phase 2 candidatures
                  </span>
                  <span className="font-serif text-xs italic text-white/55">
                    A/B D1 vs D2 en cours
                  </span>
                </div>
                <div className="flex flex-col gap-2 bg-black p-4">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-amber-200/80">
                    Next · 3 juin
                  </span>
                  <span className="text-[13px] font-light text-white/85">
                    Phase 3 retargeting
                  </span>
                  <span className="font-serif text-xs italic text-white/55">
                    D3 faire-part visuel
                  </span>
                </div>
                <div className="flex flex-col gap-2 bg-black p-4">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
                    Future · 13 juin
                  </span>
                  <span className="text-[13px] font-light text-white/65">
                    Soirée Découverte
                  </span>
                  <span className="font-serif text-xs italic text-white/55">
                    Tunnel manuel Isis
                  </span>
                </div>
              </div>
              <Snippet>
                {`Now : emerald (dot pulsant) + white/85
Next : amber + white/85
Future : white/40 (label) + white/65 (titre)
+ contenu pareil mais opacité dégressive
pour montrer 3 horizons d'action
sans chronologie linéaire`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Storyboard vs Timeline — différence d'usage">
              <ul className="flex w-full max-w-md flex-col gap-3 text-[13px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Storyboard
                  </span>
                  <span>
                    séquence narrative en plans (plan 01 → plan 05). Vide de
                    dates absolues, ancrée sur des timecodes (0:00 — 0:15).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Timeline
                  </span>
                  <span>
                    événements ancrés sur des dates ou périodes (14 mai, J–30,
                    Phase 2). Pour le planning et l&apos;historique.
                  </span>
                </li>
              </ul>
              <Snippet>
                {`règles :
- storyboard → quand il y a un récit
  (script vidéo, séquence d'actions)
- timeline → quand il y a un calendrier
  (campagne, projet, milestones)
les deux structures se ressemblent
mais l'intention diffère
ne pas mélanger temporal et narratif`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* TOOLTIPS */}
        <Block
          eyebrow="46 · Tooltips"
          title="Hover hint · context · keyboard shortcut"
          intro="Tooltip Speetch : pill rounded-full bg-[#0a0a0a], texte 10-11px uppercase tracking-[0.32em] white/85, ouverture au hover via CSS group-hover (pas de JS), une flèche optionnelle. Apparaît au-dessus par défaut, ailleurs si pas de place."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Tooltip top — default hover">
              <div className="flex w-full max-w-md justify-center py-10">
                <span className="group relative inline-flex items-center">
                  <button
                    type="button"
                    aria-label="Aide"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/65 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="9" />
                      <line x1="12" y1="11" x2="12" y2="17" />
                      <line x1="12" y1="7" x2="12" y2="7.5" />
                    </svg>
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-white/15 bg-[#0a0a0a] px-3 py-1.5 text-[10px] uppercase tracking-[0.32em] text-white/85 opacity-100 transition-opacity"
                  >
                    Survole le picto
                  </span>
                </span>
              </div>
              <Snippet>
                {`<span class="group relative inline-flex">
  <button>{icon}</button>
  <span role="tooltip" class="pointer-events-none
    absolute -top-2 left-1/2
    -translate-x-1/2 -translate-y-full
    whitespace-nowrap
    rounded-full border border-white/15
    bg-[#0a0a0a] px-3 py-1.5
    text-[10px] uppercase tracking-[0.32em]
    text-white/85
    opacity-0 group-hover:opacity-100
    transition-opacity duration-300">
    {label}
  </span>
</span>`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tooltip avec flèche pointante">
              <div className="flex w-full max-w-md justify-center py-10">
                <span className="relative inline-flex items-center">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/65"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="4 12 10 18 20 6" />
                    </svg>
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-[#0a0a0a] px-3 py-1.5 text-[10px] uppercase tracking-[0.32em] text-white/85"
                  >
                    Action validée
                    <span
                      aria-hidden
                      className="absolute left-1/2 top-full block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/15 bg-[#0a0a0a]"
                    />
                  </span>
                </span>
              </div>
              <Snippet>
                {`la flèche = un carré 8×8 pivoté 45°
positionné top-full -translate-y-1/2
avec border-b + border-r seulement
+ même bg que le tooltip
le viewport CSS gère le clipping
pas besoin de SVG path`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Placements — top / bottom / left / right">
              <div className="grid w-full max-w-md grid-cols-2 gap-8 py-12">
                <div className="flex flex-col items-center gap-3">
                  <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15">
                    <span className="text-white/65">·</span>
                    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#0a0a0a] px-2.5 py-1 text-[9px] uppercase tracking-[0.32em] text-white/85">
                      Top
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    bottom-full mb-2
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15">
                    <span className="text-white/65">·</span>
                    <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#0a0a0a] px-2.5 py-1 text-[9px] uppercase tracking-[0.32em] text-white/85">
                      Right
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    left-full ml-2
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15">
                    <span className="text-white/65">·</span>
                    <span className="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#0a0a0a] px-2.5 py-1 text-[9px] uppercase tracking-[0.32em] text-white/85">
                      Bottom
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    top-full mt-2
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15">
                    <span className="text-white/65">·</span>
                    <span className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/15 bg-[#0a0a0a] px-2.5 py-1 text-[9px] uppercase tracking-[0.32em] text-white/85">
                      Left
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-white/40">
                    right-full mr-2
                  </span>
                </div>
              </div>
              <Snippet>
                {`top    : bottom-full left-1/2 mb-2
        + -translate-x-1/2
right  : left-full top-1/2 ml-2
        + -translate-y-1/2
bottom : top-full left-1/2 mt-2
        + -translate-x-1/2
left   : right-full top-1/2 mr-2
        + -translate-y-1/2
défaut Speetch : top
ailleurs si pas la place (overflow viewport)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Avec raccourci clavier — kbd dans tooltip">
              <div className="flex w-full max-w-md justify-center py-10">
                <span className="relative inline-flex">
                  <button
                    type="button"
                    className="text-[11px] uppercase tracking-[0.32em] text-white/65 transition-colors hover:text-white"
                  >
                    Rechercher
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/15 bg-[#0a0a0a] px-3 py-2"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-[0.32em] text-white/65">
                        Recherche globale
                      </span>
                      <span className="flex items-center gap-1">
                        <Kbd>⌘</Kbd>
                        <Kbd>K</Kbd>
                      </span>
                    </span>
                  </span>
                </span>
              </div>
              <Snippet>
                {`<span class="flex items-center gap-3">
  <span class="text-[10px] uppercase
    tracking-[0.32em] text-white/65">
    {label}
  </span>
  <span class="flex items-center gap-1">
    <Kbd>⌘</Kbd>
    <Kbd>K</Kbd>
  </span>
</span>
pattern indispensable pour les buttons
de la sidebar / topbar quand le shortcut
existe vraiment`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tooltip riche — body multi-ligne">
              <div className="flex w-full max-w-md justify-center py-10">
                <span className="relative inline-flex">
                  <button
                    type="button"
                    className="text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
                  >
                    Reproduction fidèle
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 rounded-md border border-white/10 bg-[#0a0a0a] p-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.32em] text-white/85">
                      Reproduction fidèle
                    </p>
                    <p className="mt-2 font-serif text-xs italic leading-relaxed text-white/55">
                      Le HTML est conservé tel quel et rendu dans un iframe
                      sandbox. Pas d&apos;édition section par section.
                    </p>
                  </span>
                </span>
              </div>
              <Snippet>
                {`tooltip riche (w-64 fixed) :
- label uppercase white/85
- body font-serif italique white/55 leading-relaxed
- padding p-3 au lieu de px-3 py-1.5
réservé aux fonctionnalités qui méritent
une explication (boutons amer ou complexes)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tooltip sur disabled — explique pourquoi">
              <div className="flex w-full max-w-md justify-center py-10">
                <span className="relative inline-flex">
                  <button
                    type="button"
                    disabled
                    className="text-[11px] uppercase tracking-[0.32em] text-white/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-amber-300/20 bg-[#0a0a0a] px-3 py-1.5 text-[10px] uppercase tracking-[0.32em] text-amber-200/80"
                  >
                    2 pages l&apos;utilisent encore
                  </span>
                </span>
              </div>
              <Snippet>
                {`border-amber-300/20 + text-amber-200/80
sur l'élément désactivé :
  expliquer la raison du disabled
sinon l'user clique 3 fois en cherchant
+ wrapper relative pour permettre
  le tooltip même si button disabled
  (le pointer-events:none est sur le tooltip
  pas sur le wrapper)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Inline mention — info au survol d'un mot">
              <p className="w-full max-w-md text-[14px] leading-relaxed text-white/75">
                Le tunnel passe par{" "}
                <span className="relative inline-flex cursor-help border-b border-dotted border-white/40">
                  <span>Isis</span>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded-md border border-white/15 bg-[#0a0a0a] p-2.5"
                  >
                    <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/45">
                      Personne
                    </span>
                    <span className="mt-1 block font-serif text-xs italic text-white/85">
                      Isis Sylvestre — fondatrice du Club Abrazo
                    </span>
                  </span>
                </span>
                {" "}qui sélectionne manuellement les candidats.
              </p>
              <Snippet>
                {`<span class="relative inline-flex cursor-help
  border-b border-dotted border-white/40">
  {word}
  <span role="tooltip">{rich content}</span>
</span>
le border-b dotted signale "passe la souris"
cursor-help (curseur ? système)
similaire au titre HTML mais stylé`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Accessibilité — aria-describedby et focus">
              <pre className="w-full max-w-md whitespace-pre-wrap rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/65">
                {`<span class="group relative">
  <button
    aria-describedby="tip-1"
    onFocus={...} onBlur={...}
  >Action</button>
  <span
    id="tip-1"
    role="tooltip"
    class="opacity-0
      group-hover:opacity-100
      group-focus-within:opacity-100"
  >Explication</span>
</span>`}
              </pre>
              <Snippet>
                {`règles a11y :
- role="tooltip" sur le tooltip
- aria-describedby="{id}" sur le trigger
- visible au keyboard focus :
  group-focus-within:opacity-100
- jamais en aria-hidden
- ne JAMAIS mettre l'info essentielle
  uniquement dans un tooltip
  (mobile, screen-reader, low-vision)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tooltip sticky — toujours visible (mode étiquette)">
              <div className="flex w-full max-w-md justify-around py-6">
                {[
                  { letter: "S", label: "Speetch", role: "owner" },
                  { letter: "I", label: "Isis", role: "Club Abrazo" },
                ].map((p) => (
                  <span key={p.label} className="flex flex-col items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/40 font-serif text-lg italic text-[#F5F5F7]">
                      <em>{p.letter}</em>
                    </span>
                    <span className="rounded-full border border-white/15 bg-[#0a0a0a] px-2.5 py-1 text-[9px] uppercase tracking-[0.32em] text-white/85">
                      {p.label}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/40">
                      {p.role}
                    </span>
                  </span>
                ))}
              </div>
              <Snippet>
                {`mode "tag permanent" sous un avatar
pas de hover, pas d'ouverture
juste un pill toujours présent
même style que tooltip mais
  position relative (pas absolute)
pour les présence indicators`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* STEPPER */}
        <Block
          eyebrow="47 · Stepper"
          title="Multi-step forms · wizards · onboarding"
          intro="Le stepper guide l'utilisateur à travers un flow long (création de client, upload + édition + publication). Indique où il en est, ce qui reste, et permet (parfois) de revenir en arrière. Speetch préfère le pattern minimaliste : header de progression + contenu de l'étape + boutons précédent/suivant."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Stepper segmenté — barre fine">
              <div className="flex w-full max-w-md flex-col gap-3">
                <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.32em]">
                  <span className="text-white/55">Étape 3 sur 5</span>
                  <span className="font-mono text-white/45">60 %</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full ${
                        i <= 3 ? "bg-[#F5F5F7]" : "bg-white/[0.08]"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Snippet>
                {`pattern minimaliste :
- "Étape N sur M" + pourcentage à droite
- N segments grid-cols-N gap-1
  passés : bg-[#F5F5F7]
  futurs : bg-white/[0.08]
- pas de labels par segment (gain de place)
pour les formulaires longs (>3 steps)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Stepper labellisé — chaque étape nommée">
              <ol className="flex w-full max-w-md items-start gap-2">
                {[
                  { n: 1, label: "Identité", state: "done" },
                  { n: 2, label: "Avatar", state: "done" },
                  { n: 3, label: "Sécurité", state: "current" },
                  { n: 4, label: "Confirm", state: "pending" },
                ].map((s, i, arr) => {
                  const isLast = i === arr.length - 1;
                  return (
                    <li key={s.n} className="flex flex-1 flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            s.state === "done"
                              ? "border-[#F5F5F7]/85 bg-[#F5F5F7]/85 text-black"
                              : s.state === "current"
                                ? "border-[#F5F5F7] bg-black text-[#F5F5F7]"
                                : "border-white/20 bg-black text-white/35"
                          }`}
                        >
                          <span className="font-mono text-[9px]">
                            {s.state === "done" ? "✓" : s.n}
                          </span>
                        </span>
                        {!isLast && (
                          <span
                            className={`h-px flex-1 ${
                              s.state === "done"
                                ? "bg-[#F5F5F7]/60"
                                : "bg-white/15"
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-[0.32em] ${
                          s.state === "current"
                            ? "text-[#F5F5F7]"
                            : s.state === "done"
                              ? "text-white/55"
                              : "text-white/35"
                        }`}
                      >
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <Snippet>
                {`<ol class="flex gap-2">
  <li class="flex-1 flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <span class="h-6 w-6 rounded-full ...">{n}</span>
      {!isLast && <span class="h-px flex-1 bg-..." />}
    </div>
    <span class="text-[10px] uppercase
      tracking-[0.32em]">{label}</span>
  </li>
</ol>
chaque step occupe flex-1
ligne de connexion à droite du dot
label en uppercase sous le dot`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Stepper vertical — étape + body + actions">
              <ol className="flex w-full max-w-md flex-col">
                {[
                  {
                    n: 1,
                    label: "Identité",
                    body: "Nom et email du contact principal renseignés.",
                    state: "done",
                  },
                  {
                    n: 2,
                    label: "Sélection des médias",
                    body: "Upload de 3 visuels au format 1080×1080.",
                    state: "current",
                    showActions: true,
                  },
                  {
                    n: 3,
                    label: "Validation",
                    state: "pending",
                  },
                ].map((s, i, arr) => {
                  const isLast = i === arr.length - 1;
                  return (
                    <li
                      key={s.n}
                      className="relative grid grid-cols-[40px_1fr] gap-4 pb-6"
                    >
                      {!isLast && (
                        <span className="absolute left-[14px] top-7 h-full w-px bg-white/15" />
                      )}
                      <span
                        className={`relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          s.state === "done"
                            ? "border-[#F5F5F7]/85 bg-[#F5F5F7]/85 text-black"
                            : s.state === "current"
                              ? "border-[#F5F5F7] bg-black text-[#F5F5F7]"
                              : "border-white/20 bg-black text-white/35"
                        }`}
                      >
                        <span className="font-mono text-[10px]">
                          {s.state === "done" ? "✓" : s.n}
                        </span>
                      </span>
                      <div className="flex flex-col gap-2 pt-1">
                        <span
                          className={`text-[12px] uppercase tracking-[0.32em] ${
                            s.state === "current"
                              ? "text-[#F5F5F7]"
                              : s.state === "done"
                                ? "text-white/55"
                                : "text-white/35"
                          }`}
                        >
                          {s.label}
                        </span>
                        {s.body && (
                          <p className="font-serif text-sm italic text-white/55">
                            {s.body}
                          </p>
                        )}
                        {s.showActions && (
                          <div className="mt-2 flex items-center gap-6">
                            <button
                              type="button"
                              className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white"
                            >
                              <span>Continuer</span>
                              <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                            </button>
                            <button
                              type="button"
                              className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
                            >
                              Retour
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Snippet>
                {`étape verticale avec son contenu et actions
visibles uniquement sur l'étape courante
les autres ne montrent que le label + état
permet de scanner toute la procédure
sans cliquer pour découvrir`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Stepper avec validation — input + check">
              <div className="flex w-full max-w-md flex-col gap-5">
                <Field label="Titre du brief" hint="obligatoire">
                  <div className="flex items-center gap-3 border-b border-white/20 pb-2">
                    <input
                      type="text"
                      defaultValue="Brief de production V2"
                      className="flex-1 bg-transparent font-sans text-lg font-light text-[#F5F5F7] focus:outline-none"
                    />
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-emerald-300/85"
                      aria-hidden
                    >
                      <polyline points="4 12 10 18 20 6" />
                    </svg>
                  </div>
                </Field>
                <Field label="Date de livraison" hint="obligatoire">
                  <div className="flex items-center gap-3 border-b border-red-400/40 pb-2">
                    <input
                      type="text"
                      placeholder="13 juin 2026"
                      className="flex-1 bg-transparent font-sans text-lg font-light text-[#F5F5F7] placeholder:text-white/25 focus:outline-none"
                    />
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-300/85"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="9" />
                      <line x1="12" y1="8" x2="12" y2="13" />
                      <line x1="12" y1="16" x2="12" y2="16.5" />
                    </svg>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
                    Champ requis pour passer à la suite
                  </span>
                </Field>
              </div>
              <Snippet>
                {`pattern par champ :
- border-b white/20 par défaut
- border-b emerald/40 si valide + check
- border-b red/40 si erreur + alert
- message d'erreur sous le champ
+ permet de bloquer le "Continuer"
  jusqu'à validation`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Stepper avec preview — résumé en parallèle">
              <div className="grid w-full max-w-md grid-cols-1 gap-px overflow-hidden rounded-md bg-white/[0.08] md:grid-cols-2">
                <div className="flex flex-col gap-4 bg-black p-4">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                    Étape 2 sur 3
                  </span>
                  <span className="text-[13px] font-light text-white/85">
                    Personnalise le visuel
                  </span>
                  <input
                    type="text"
                    defaultValue="Avant les mots"
                    className="border-b border-white/20 bg-transparent pb-1 text-[14px] font-light text-[#F5F5F7] focus:border-white/80 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2 bg-[#0a0a0a] p-4">
                  <span className="text-[9px] uppercase tracking-[0.32em] text-white/35">
                    Aperçu
                  </span>
                  <div className="aspect-square w-full bg-gradient-to-br from-white/[0.06] to-white/[0.02]" />
                  <span className="font-serif text-xs italic text-white/65">
                    Avant les mots
                  </span>
                </div>
              </div>
              <Snippet>
                {`split horizontal :
gauche : formulaire de l'étape
droite : preview live du résultat
permet à l'user de voir l'impact
de ses changements en temps réel
utilisé pour création de visuel,
template, page raw_html`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="État de complétion — récap final">
              <div className="flex w-full max-w-md flex-col gap-4 rounded-md border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
                <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-emerald-200/85">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping-soft" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  </span>
                  Espace créé
                </span>
                <p className="font-serif text-sm italic text-white/65">
                  L&apos;espace client de <em>Club Abrazo</em> est prêt à
                  recevoir ses projets. Le mot de passe a été envoyé à
                  l&apos;adresse renseignée.
                </p>
                <div className="flex items-center justify-between gap-6 pt-2">
                  <button
                    type="button"
                    className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
                  >
                    Créer un autre
                  </button>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white"
                  >
                    <span>Voir l&apos;espace</span>
                    <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
                  </button>
                </div>
              </div>
              <Snippet>
                {`fin du wizard :
- bandeau emerald avec dot pulsant
- récap éditorial (font-serif italic)
- 2 actions : "Recommencer" et "Voir"
le récap remplace le stepper
pour signaler la complétion
sans charger d'étape suivante`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pattern actuel Speetch — sans stepper visuel">
              <ul className="flex w-full max-w-md flex-col gap-2 text-[13px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-white/45">
                    1.
                  </span>
                  <span>
                    Speetch préfère les flows linéaires sans stepper visuel —
                    une page = une étape (création client, création projet,
                    création page).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-white/45">
                    2.
                  </span>
                  <span>
                    Chaque page renvoie à la liste parente après succès, plutôt
                    qu&apos;à la « step suivante ».
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] text-white/45">
                    3.
                  </span>
                  <span>
                    Le stepper devient utile quand le flow dépasse 3 étapes
                    obligatoires non commutables (onboarding initial,
                    paiement…).
                  </span>
                </li>
              </ul>
              <Snippet>
                {`règle Speetch :
- < 3 étapes → routes séparées
  (créer client → créer projet → créer page)
- ≥ 3 étapes verrouillées → stepper
- les flows à étapes optionnelles
  (réorganiser sections, modifier visuel)
  ne sont jamais un stepper`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* SECTION DIVIDERS */}
        <Block
          eyebrow="50 · Section dividers"
          title="Hairlines · sceaux · ornements éditoriaux"
          intro="Le séparateur Speetch reste 90 % du temps une hairline simple (border-t white/10). Les variantes décoratives (sceau central, glyphe floral, marquee) sont réservées aux pages éditoriales — un par page max, sinon c'est trop bavard."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Hairline simple — pattern par défaut">
              <div className="w-full max-w-md py-8">
                <div className="border-t border-white/10" />
              </div>
              <Snippet>
                {`<div class="border-t border-white/10" />
ou plus court : <hr class="border-white/10" />
opacité 10% : suffisamment visible
sans dominer
toujours horizontal, jamais vertical
(pour les verticaux : préférer une grid
gap-px avec bg parent)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Hairline dégradée — bord d'écran technique">
              <div className="w-full max-w-md py-8">
                <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </div>
              <Snippet>
                {`<div class="h-px bg-gradient-to-r
  from-transparent via-white/15
  to-transparent" />
pour les bords de viewport
(top/bottom du layout root)
ou pour clore une page sans appuyer
plus poétique que la border simple`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Divider avec sceau central — fin de chapitre">
              <div className="flex w-full max-w-md flex-col items-center gap-4 py-8">
                <div className="flex w-full items-center gap-4">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 font-serif text-sm italic text-[#F5F5F7]">
                    <em>S</em>
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
              </div>
              <Snippet>
                {`<div class="flex items-center gap-4">
  <span class="h-px flex-1 bg-white/10" />
  <span class="h-8 w-8 rounded-full
    border border-white/40
    font-serif italic">
    {initiale}
  </span>
  <span class="h-px flex-1 bg-white/10" />
</div>
pour clore un long chapitre éditorial
le sceau (S ou initiale client) ancre`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Divider glyphe — fleuron éditorial">
              <div className="flex w-full max-w-md items-center justify-center gap-4 py-8">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-base text-white/40">❦</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <Snippet>
                {`<span class="text-base text-white/40">❦</span>
glyphe U+2766 FLORAL HEART
+ deux hairlines de chaque côté
réservé au mode document éditorial
(brief de production en style "document")
respire le 18ème siècle typographique`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Divider numéro — passage entre chapitres">
              <div className="flex w-full max-w-md items-center justify-center gap-6 py-8">
                <span className="h-px flex-1 bg-white/10" />
                <span
                  className="font-serif font-extralight italic leading-none tracking-[-0.04em] text-white/85"
                  style={{
                    fontFamily: "var(--font-serif), Fraunces, serif",
                    fontSize: "1.75rem",
                  }}
                >
                  03
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <Snippet>
                {`<span class="h-px flex-1 bg-white/10" />
<span class="font-serif italic
  font-extralight tracking-[-0.04em]
  text-white/85"
  style={{ fontSize: '1.75rem' }}>
  {chapterNum}
</span>
<span class="h-px flex-1 bg-white/10" />
pour annoncer le prochain chapitre
sans afficher son titre complet`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Divider point — séparateur minimaliste">
              <div className="flex w-full max-w-md items-center justify-center gap-3 py-8">
                <span className="block h-1 w-1 rounded-full bg-white/30" />
                <span className="block h-1 w-1 rounded-full bg-white/30" />
                <span className="block h-1 w-1 rounded-full bg-white/30" />
              </div>
              <Snippet>
                {`<div class="flex items-center
  justify-center gap-3">
  <span class="h-1 w-1 rounded-full
    bg-white/30" />
  <span class="h-1 w-1 rounded-full
    bg-white/30" />
  <span class="h-1 w-1 rounded-full
    bg-white/30" />
</div>
3 points centrés
plus discret que la hairline
parfait dans le corps d'un long texte
quand le saut de paragraphe ne suffit pas`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Divider eyebrow — séparateur avec label">
              <div className="flex w-full max-w-md items-center gap-4 py-8">
                <span className="h-px w-8 bg-white/30" />
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/45">
                  Annexe
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <Snippet>
                {`<span class="h-px w-8 bg-white/30" />
<span class="text-[10px] uppercase
  tracking-[0.4em] text-white/45">
  {label}
</span>
<span class="h-px flex-1 bg-white/10" />
pour annoncer une section secondaire
(annexe, notes, références)
label à gauche, ligne longue à droite`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Divider marquee — animé, page éditoriale">
              <div className="w-full max-w-md overflow-hidden py-6">
                <div className="flex w-fit animate-marquee whitespace-nowrap text-[10px] uppercase tracking-[0.32em] text-white/40">
                  {[1, 2].map((dup) => (
                    <span key={dup} className="flex">
                      <span className="px-4">●</span>
                      <span className="px-4">●</span>
                      <span className="px-4">●</span>
                      <span className="px-4">●</span>
                      <span className="px-4">●</span>
                      <span className="px-4">●</span>
                    </span>
                  ))}
                </div>
              </div>
              <Snippet>
                {`overflow-hidden + animate-marquee
chaîne de bullets ●
défile indéfiniment
remplace le séparateur statique
sur les pages FWA Grade
(rare, à doser)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Mode document — divider crème/bordeaux">
              <div
                className="flex w-full max-w-md items-center gap-4 py-8"
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                }}
              >
                <span
                  className="h-px flex-1"
                  style={{ background: "rgba(110, 4, 16, 0.25)" }}
                />
                <span style={{ color: "#C61428", fontSize: "1.25rem" }}>❦</span>
                <span
                  className="h-px flex-1"
                  style={{ background: "rgba(110, 4, 16, 0.25)" }}
                />
              </div>
              <Snippet>
                {`<span style={{ background:
  'rgba(110, 4, 16, 0.25)' }} class="h-px flex-1" />
<span style={{ color: '#C61428' }}>❦</span>
même pattern qu'au-dessus
mais dans la palette mode document
(bordeaux deep / bordeaux glow)
réservé aux pages meta.style = "document"`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Quand utiliser quel divider">
              <ul className="flex w-full max-w-md flex-col gap-3 text-[12px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[8ch]">
                    Hairline
                  </span>
                  <span>90% des cas — fin de section, début de groupe.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[8ch]">
                    Dégradée
                  </span>
                  <span>Bords de viewport, top/bottom du layout root.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[8ch]">
                    Sceau
                  </span>
                  <span>
                    Fin de page éditoriale longue (1 par page max).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[8ch]">
                    Numéro
                  </span>
                  <span>Entre chapitres FWA pour annoncer la suite.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[8ch]">
                    Glyphe
                  </span>
                  <span>Mode document éditorial uniquement.</span>
                </li>
              </ul>
              <Snippet>
                {`règle : à chaque divider décoratif,
se demander "est-ce que la hairline simple
suffirait ?". 9 fois sur 10, oui.
réserver l'ornement pour les moments
qui le méritent vraiment.`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* STICKY BANNERS */}
        <Block
          eyebrow="51 · Sticky banners"
          title="Cookies · maintenance · trial · état système"
          intro="Bandeaux fixés haut ou bas de viewport pour des messages globaux (consentement, alerte système, info de session). Spec Speetch : 100% width, height 40-56px, position fixed, dismissable via × ou action — jamais persistant si l'utilisateur l'a fermé."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Cookies — consentement RGPD">
              <div className="w-full max-w-md">
                <div className="flex flex-col gap-3 rounded-md border border-white/15 bg-[#0a0a0a] px-5 py-4 backdrop-blur-md md:flex-row md:items-center md:gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.32em] text-white/65">
                      Confidentialité
                    </span>
                    <span className="font-serif text-sm italic text-white/55">
                      Speetch utilise uniquement les cookies essentiels
                      (session). Aucun tracker.
                    </span>
                  </div>
                  <div className="flex items-center gap-4 md:ml-auto">
                    <button
                      type="button"
                      className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
                    >
                      En savoir plus
                    </button>
                    <button
                      type="button"
                      className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white"
                    >
                      <span>OK</span>
                      <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-8" />
                    </button>
                  </div>
                </div>
              </div>
              <Snippet>
                {`<div class="fixed inset-x-4 bottom-4
  z-[80] rounded-md border border-white/15
  bg-[#0a0a0a]/95 px-5 py-4 backdrop-blur-md
  shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
  ...
</div>
position fixed bottom-4 (pas tout collé en bas)
+ dismissible — stocker l'état localStorage
pour ne pas re-afficher à chaque visite`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Maintenance — info temporaire">
              <div className="flex w-full max-w-md items-center justify-between gap-4 border-b border-amber-300/20 bg-amber-300/[0.04] px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="block h-1 w-1 rounded-full bg-amber-300" />
                  <span className="text-[11px] uppercase tracking-[0.32em] text-amber-200/85">
                    Maintenance · 22 h → 23 h
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Fermer"
                  className="text-[14px] text-amber-200/55 transition-colors hover:text-amber-200"
                >
                  ×
                </button>
              </div>
              <Snippet>
                {`<div class="fixed inset-x-0 top-0 z-[80]
  border-b border-amber-300/20
  bg-amber-300/[0.04]
  px-5 py-3 backdrop-blur-md
  flex items-center justify-between">
  <span class="flex items-center gap-3">
    <span class="h-1 w-1 rounded-full bg-amber-300" />
    <span class="text-amber-200/85">{message}</span>
  </span>
  <button aria-label="Fermer">×</button>
</div>
top fixed pleine largeur
border-b plutôt que ombre`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Erreur système — connexion perdue">
              <div className="flex w-full max-w-md items-center justify-between gap-4 border-b border-red-400/20 bg-red-400/[0.04] px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-red-400/70 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-red-300/85">
                    Connexion perdue · tentative dans 3 s
                  </span>
                </div>
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-[0.32em] text-red-200/75 transition-colors hover:text-red-200"
                >
                  Réessayer
                </button>
              </div>
              <Snippet>
                {`pareil mais en red-400 avec dot ping
+ countdown auto-retry ("dans Ns")
+ bouton "Réessayer" (red-200/75)
fixed top, jamais dismissible
disparaît automatiquement à la reconnexion`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Beta / preview — fonctionnalité en test">
              <div className="flex w-full max-w-md items-center justify-between gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-white/20 px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-white/75">
                    Beta
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Reproduction fidèle · feedback bienvenu
                  </span>
                </div>
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
                >
                  Donner un avis
                </button>
              </div>
              <Snippet>
                {`chip "Beta" rounded-full
+ message uppercase 0.32em
+ CTA pour donner du feedback
même squelette que maintenance
juste avec border-white/10 (sobre)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Mode hors-ligne — offline / draft saved">
              <div className="flex w-full max-w-md items-center justify-between gap-4 border-b border-white/10 bg-[#0a0a0a] px-5 py-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="block h-1 w-1 rounded-full bg-white/65" />
                  <span className="text-[11px] uppercase tracking-[0.32em] text-white/65">
                    Hors-ligne · brouillon enregistré localement
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
                  Synchro à la reconnexion
                </span>
              </div>
              <Snippet>
                {`dot bg-white/65 (neutre, pas alarmant)
+ message pédagogique
+ statut technique à droite (mono)
indicate qu'on est conscient de l'état
mais pas en alerte
seul cas où le banner n'est pas dismissible`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Trial / upgrade — prompt monétaire">
              <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-md border border-emerald-400/20 bg-emerald-400/[0.04] px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span className="text-[11px] uppercase tracking-[0.32em] text-emerald-200/85">
                    Essai gratuit · 12 jours restants
                  </span>
                </div>
                <button
                  type="button"
                  className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white"
                >
                  <span>Passer pro</span>
                  <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-8" />
                </button>
              </div>
              <Snippet>
                {`pour Speetch SaaS plus tard :
emerald si offre encore valide
amber si imminent (< 3 jours)
red si expiré
toujours un CTA clair pour upgrade`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Notification push — sticky alert">
              <div className="relative w-full max-w-md">
                <div className="flex items-start gap-3 rounded-md border border-white/10 bg-[#0a0a0a] p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md">
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/40 font-serif text-xs italic text-[#F5F5F7]">
                    <em>I</em>
                  </span>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.32em] text-white/65">
                      Nouveau message · Isis
                    </span>
                    <span className="font-serif text-sm italic text-white/55">
                      &laquo; J&apos;ai mis à jour le brief avec la nouvelle
                      direction D3. Tu peux jeter un œil ? &raquo;
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="Fermer"
                    className="text-white/40 transition-colors hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>
              <Snippet>
                {`<div class="fixed top-4 right-4 z-[80]
  w-80 rounded-md border border-white/10
  bg-[#0a0a0a] p-4 backdrop-blur-md
  shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]">
  <Avatar />
  <div>{label + body}</div>
  <button>×</button>
</div>
position top-right par défaut
auto-dismiss après 5-8s
ou persistant si action requise`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Anatomie d'un banner Speetch">
              <ul className="flex w-full max-w-md flex-col gap-3 text-[12px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Position
                  </span>
                  <span>fixed top-0 (urgent) ou bottom-4 (passif).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Hauteur
                  </span>
                  <span>40-56 px (top), libre pour les notifs (bottom-right).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Couleurs
                  </span>
                  <span>amber pour info, red pour erreur, emerald pour succès, white/10 pour neutre.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Dismiss
                  </span>
                  <span>× à droite + persistence localStorage (pas re-afficher si fermé).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Z-index
                  </span>
                  <span>z-[80] (au-dessus des modales si critique).</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Animation
                  </span>
                  <span>slide-down depuis top (0.4s ease-out-expo), opacity à l&apos;exit.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Max
                  </span>
                  <span>1 banner par catégorie visible à la fois — la pile en bottom-right.</span>
                </li>
              </ul>
              <Snippet>
                {`régle d'or : ne jamais empiler
deux banners de la même nature
si l'app a vraiment besoin d'en afficher
plusieurs, les rassembler en un panel
"3 alertes" à droite (cf. Cmd+K)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Pattern actuel Speetch — minimaliste">
              <p className="w-full max-w-md text-[13px] text-white/65">
                Speetch n&apos;utilise actuellement{" "}
                <em className="font-serif italic text-white/85">aucun banner</em>{" "}
                en production. Tous les feedbacks passent par : toast bas (in-page),
                AnimatePresence error (in-form), ou redirect silencieux. Les
                banners arrivent quand on aura du multi-user / réseau temps réel /
                modèle d&apos;abonnement.
              </p>
              <Snippet>
                {`Speetch v1 : aucun banner
  → toast bottom-4 sticky
  → AnimatePresence error
  → notifications in-page
Speetch v2 (avec collab) :
  banner top pour incidents
  notification top-right pour mentions`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        {/* VOICE & TONE DEEP-DIVE */}
        <Block
          eyebrow="56 · Voice & tone"
          title="Bon copy / mauvais copy · exemples concrets"
          intro="Section 39 pose les 6 règles. Ici, on les applique sur les UI courantes — boutons, erreurs, vides, micro-copy admin, notifications, dates. Chaque ligne montre un côté Speetch vs un côté générique."
        >
          <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white/[0.08]">
            <ComponentRow title="Boutons — verbes précis à l'impératif">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={["OK", "Continuer", "Soumettre"]}
                  good={["Enregistrer", "Publier la page", "Créer l'espace"]}
                />
              </div>
              <Snippet>
                {`règle : verbe à l'impératif + objet précis
"OK" → "Enregistrer"
"Continuer" → "Publier la page"
"Soumettre" → "Envoyer l'invitation"
le verbe DOIT décrire ce qui va se passer
au click — pas un acquiescement vague`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Confirmations destructives">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Êtes-vous sûr de vouloir supprimer cet élément ?",
                    "Voulez-vous confirmer cette action irréversible ?",
                  ]}
                  good={[
                    "Supprimer ce template ? 2 pages l'utilisent — elles garderont leur contenu mais perdront le lien.",
                    "Supprimer définitivement « Brief de production » et ses 14 médias ?",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : action + conséquence concrète
"Êtes-vous sûr ?" → trop vague
mieux :
- nommer l'item (en clair)
- expliquer ce qui sera affecté
- préciser si c'est réversible ou non`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Erreurs — utile, jamais technique brut">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Une erreur est survenue.",
                    "Error 500 — Internal Server Error",
                    "Failed to fetch resource",
                  ]}
                  good={[
                    "ANTHROPIC_API_KEY manquante dans .env.local — impossible d'appeler Claude.",
                    "Le nom du template doit faire au moins 2 caractères.",
                    "Fichier HTML trop volumineux (max 2 MB).",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : quoi a échoué + comment réparer
"Une erreur est survenue" → useless
mieux :
- pointer la cause précise (clé manquante,
  format invalide, taille dépassée)
- indiquer la solution si évidente
- pas de stack trace exposée à l'user`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Empty states — invitant, jamais lapidaire">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Aucune donnée.",
                    "Liste vide.",
                    "No items found.",
                  ]}
                  good={[
                    "Ce projet n'a encore aucune page. Démarre avec un template pour poser une première mise en forme.",
                    "Aucun template personnalisé en BDD. Les 5 presets code restent toujours disponibles à la création.",
                    "Aucun média pour ce projet. Téléverse une image ou une vidéo pour démarrer.",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : contexte + invitation à agir
"Aucune donnée" → mort de chez mort
mieux :
- expliquer pourquoi c'est vide
- indiquer la prochaine action possible
- ton serif italique chaud (font-serif)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Micro-copy admin — labels et hints">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Nom (obligatoire)",
                    "Description (peut être vide)",
                    "Cliquez pour télécharger",
                  ]}
                  good={[
                    "Nom du template · obligatoire",
                    "Description · optionnel",
                    "+ Téléverser ou glisser-déposer",
                  ]}
                />
              </div>
              <Snippet>
                {`label uppercase 0.32em + hint à droite
"Nom (obligatoire)" → label seul
mieux : <Field label="Nom du template"
  hint="obligatoire"> qui les sépare
visuellement (white/45 vs white/25)
+ "+" et "→" Unicode plutôt que mots`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Status & feedbacks — sobre, descriptif">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Succès !!! 🎉",
                    "Loading...",
                    "Done.",
                  ]}
                  good={[
                    "Enregistré · 3 textes remplacés · 1 image",
                    "Conversion en cours…",
                    "Espace créé · L'invitation a été envoyée.",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : descriptif, sans émoji, sobriété
"Loading..." → trop générique
mieux :
- présent continu ("Enregistrement…")
- préciser ce qui a marché (compteur)
- ponctuation soignée ("…" plutôt que "...")
JAMAIS d'émoji ni d'! d'enthousiasme`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Page titles & breadcrumbs">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Page de création d'un nouveau projet pour ce client",
                    "Settings",
                    "Mes Projets",
                  ]}
                  good={[
                    "Nouveau projet",
                    "Réglages",
                    "Projets",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : court, en français, capitale d'ouverture seule
"Page de création..." → décrit le composant
mieux : décrit le contenu
- "Nouveau projet" (action implicite)
- "Réglages" (la rubrique)
- "Projets" (la liste)
+ jamais Title Case (anglo-saxon)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Brand & signatures — voix Speetch">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Speetch — votre partenaire créatif d'exception !",
                    "Une agence innovante au service de votre marque.",
                    "Nous transformons vos idées en réalité.",
                  ]}
                  good={[
                    "Speetch · Paris · 25 ans d'expérience",
                    "Brief tenu. Reste à le mettre en ondes.",
                    "Direction artistique · identité de marque · édition numérique",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : précision > emphase
"Votre partenaire créatif d'exception" → vide
mieux :
- des faits ("25 ans d'expérience")
- des spécialités précises (DA · identité)
- des phrases courtes avec point final
pas de "vous" qui flatte
pas d'adjectifs gratuits ("exceptionnel",
"unique", "innovant")`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Dates relatives — éviter les ratios faux">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Modifié à l'instant",
                    "Updated 2 hours ago",
                    "01/15/26",
                  ]}
                  good={[
                    "Modifié il y a 2 min",
                    "Hier · 14 h 30",
                    "13 mai 2026",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : format français lisible
"À l'instant" → vague (= 5s ? 5 min ?)
mieux :
- < 1 min → "à l'instant"
- < 60 min → "il y a N min"
- aujourd'hui → "Aujourd'hui · 14 h 30"
- hier → "Hier · 14 h 30"
- cette semaine → "lundi · 14 h 30"
- plus loin → "13 mai 2026"
format heure : "14 h 30" avec espaces`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Onboarding & invitations">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Bienvenue ! Pour commencer, créez votre premier projet en cliquant ici.",
                    "Get started by adding a client to your dashboard.",
                  ]}
                  good={[
                    "Crée ton premier espace client. Speetch génère un lien unique avec mot de passe.",
                    "Aucun client encore — commence par en créer un.",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : tutoiement, action concrète
"Bienvenue ! Pour commencer..." → bavard
mieux :
- impératif "Crée ton premier..."
- explication courte du résultat
- ne pas dire "ici" (préfère le bouton
  comme contexte)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Tutoiement vs vouvoiement">
              <p className="w-full max-w-md text-[12px] leading-relaxed text-white/65">
                Speetch utilise{" "}
                <em className="font-serif italic text-white/85">le tutoiement</em>{" "}
                partout — admin, public, briefs, callouts. Cohérent avec le ton
                FWA Grade direct et le fait que les outils s&apos;adressent
                soit à l&apos;owner, soit à des clients qui ont déjà signé.
                Pour les copies publiques (Coming Soon, signature), le ton peut
                glisser vers du{" "}
                <em className="font-serif italic text-white/85">on</em> /{" "}
                <em className="font-serif italic text-white/85">nous</em>{" "}
                impersonnel.
              </p>
              <Snippet>
                {`tutoiement par défaut :
- "Crée ton espace"
- "Tu peux éditer plus tard"
on impersonnel pour les phrases publiques :
- "Brief tenu. Reste à le mettre en ondes."
- "Paris · 2026"
JAMAIS de vouvoiement
(sauf cas spécifique demandé par un client)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Capitalisation française stricte">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Nouveau Projet",
                    "Brief De Production",
                    "Réglages > Mon Profil",
                  ]}
                  good={[
                    "Nouveau projet",
                    "Brief de production",
                    "Réglages → Mon profil",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : capitale d'ouverture seule
+ noms propres
"Nouveau Projet" (Title Case) → anglo-saxon
"Nouveau projet" → français correct
+ ">" → "→" U+2192 (breadcrumb)
règle qui vaut partout : labels,
titres, breadcrumbs, headers de section`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Quantification — toujours précise">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Plusieurs erreurs",
                    "Beaucoup de pages",
                    "Récemment publié",
                  ]}
                  good={[
                    "3 erreurs · clique pour voir le détail",
                    "12 pages · 8 publiées",
                    "Publié il y a 2 jours",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : un chiffre exact > un adjectif vague
"Plusieurs" → combien ?
"Beaucoup" → combien ?
"Récemment" → quand ?
quand le chiffre existe, l'afficher
sinon, le calculer (timestamps)`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="404 / erreurs système — sobres, pas drôles">
              <div className="flex w-full max-w-md flex-col gap-3">
                <CopyExample
                  bad={[
                    "Oups ! Cette page s'est perdue 🙈",
                    "Ce n'est pas vous, c'est nous.",
                  ]}
                  good={[
                    "Page introuvable. La ressource demandée n'existe pas ou a été déplacée.",
                    "Erreur serveur. Quelque chose s'est mal passé. L'équipe est prévenue.",
                  ]}
                />
              </div>
              <Snippet>
                {`règle : factuel, pas blagueur
"Oups ! 🙈" → infantile + émoji interdit
"Ce n'est pas vous c'est nous" → marketing-speak
mieux :
- numéro d'erreur Fraunces italique
- explication factuelle 1-2 phrases
- CTA "Retour accueil"`}
              </Snippet>
            </ComponentRow>

            <ComponentRow title="Anatomie d'un bon micro-copy Speetch">
              <ul className="flex w-full max-w-md flex-col gap-3 text-[12px] text-white/65">
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Précis
                  </span>
                  <span>un chiffre, un nom, une action — jamais "des éléments"</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Court
                  </span>
                  <span>15 mots max pour les boutons et labels · 30 max pour les hints</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Tutoie
                  </span>
                  <span>"toi" / "tu" partout, sauf signatures publiques</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Présent
                  </span>
                  <span>impératif présent ("Crée", "Enregistre"), pas futur</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Français
                  </span>
                  <span>règles strictes (cf. 38 · French typography)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Sans EMOJI
                  </span>
                  <span>jamais d&apos;émoji. Les glyphes Unicode (→ ↵ ⌘) restent OK.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/45 min-w-[10ch]">
                    Italique
                  </span>
                  <span>réservé aux phrases éditoriales en Fraunces, pas pour insister</span>
                </li>
              </ul>
              <Snippet>
                {`avant de finaliser un texte, vérifier :
1. peut-on supprimer la moitié des mots ?
2. y a-t-il un chiffre / nom propre concret ?
3. le verbe est-il à l'impératif présent ?
4. la ponctuation française est-elle correcte ?
5. zéro émoji ?
6. zéro adjectif vague (exceptionnel, unique) ?
si "oui" partout → c'est bon.`}
              </Snippet>
            </ComponentRow>
          </div>
        </Block>

        <div className="flex items-center pt-4">
          <Link
            href="/admin/settings"
            className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
          >
            ← Retour Réglages
          </Link>
        </div>
      </section>
    </div>
  );
}

function CopyExample({
  bad,
  good,
}: {
  bad: string[];
  good: string[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-md border border-red-400/20 bg-red-400/[0.03] p-3">
        <span className="text-[10px] uppercase tracking-[0.32em] text-red-300/70">
          Mauvais
        </span>
        <ul className="flex flex-col gap-1.5 text-[12px] italic text-white/55">
          {bad.map((line, i) => (
            <li key={i} className="border-l border-red-400/20 pl-3">
              {line}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/[0.03] p-3">
        <span className="text-[10px] uppercase tracking-[0.32em] text-emerald-200/80">
          Speetch
        </span>
        <ul className="flex flex-col gap-1.5 text-[12px] text-white/85">
          {good.map((line, i) => (
            <li key={i} className="border-l border-emerald-400/30 pl-3">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TypeLevelRow({
  tier,
  cssSize,
  pxRange,
  tracking,
  leading,
  weight,
  sample,
  accent,
  previewSize,
  usage,
  uppercase,
  mono,
}: {
  tier: string;
  cssSize: string;
  pxRange: string;
  tracking: string;
  leading: string;
  weight: string;
  sample: string;
  accent: string;
  previewSize: string;
  usage: string;
  uppercase?: boolean;
  mono?: boolean;
}) {
  const fontFamily = mono
    ? "ui-monospace, SFMono-Regular, Menlo, monospace"
    : "var(--font-sans), Inter, sans-serif";
  return (
    <div className="flex flex-col gap-4 bg-black px-6 py-7 md:flex-row md:items-baseline md:gap-12">
      <div className="flex min-w-[16ch] flex-col gap-1 md:max-w-[20ch]">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/75">
          {tier}
        </span>
        <span className="font-mono text-[10px] text-white/40">{pxRange}</span>
        <span className="font-mono text-[10px] text-white/30">
          {weight} · ls {tracking} · lh {leading}
        </span>
      </div>
      <span
        className={`flex-1 text-[#F5F5F7] ${uppercase ? "uppercase" : ""}`}
        style={{
          fontFamily,
          fontSize: previewSize,
          fontWeight: 200,
          letterSpacing: tracking,
          lineHeight: leading,
        }}
      >
        {sample}
        {accent && (
          <>
            {" "}
            <em
              className="font-light italic text-white/85"
              style={{ fontFamily: "var(--font-serif), Fraunces, serif" }}
            >
              {accent}
            </em>
          </>
        )}
      </span>
      <div className="flex min-w-[16ch] flex-col gap-1 md:max-w-[28ch] md:text-right">
        <span className="font-mono text-[10px] text-white/40">{cssSize}</span>
        <span className="font-serif text-xs italic text-white/55">{usage}</span>
      </div>
    </div>
  );
}

function IconCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex flex-col items-center gap-2">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-black">
        <span className="inline-block h-5 w-5 text-[#F5F5F7]">
          <span className="block h-full w-full [&_svg]:h-full [&_svg]:w-full">
            {children}
          </span>
        </span>
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/40">
        {label}
      </span>
    </span>
  );
}

function SpeakerIcon({ level }: { level: 0 | 1 | 2 | 3 }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 10 L3 14 L7 14 L12 18 L12 6 L7 10 Z" />
      {level === 0 && <path d="M16 9 L20 13 M20 9 L16 13" />}
      {level >= 1 && <path d="M16 10 Q17.5 12 16 14" opacity="0.7" />}
      {level >= 2 && <path d="M18 8 Q21 12 18 16" opacity="0.55" />}
      {level >= 3 && <path d="M20 6 Q24 12 20 18" opacity="0.4" />}
    </svg>
  );
}

function Waveform({ bars = 32 }: { bars?: number }) {
  // Heights pseudo-randomisées avec une seed déterministe pour le SSR
  const heights = Array.from({ length: bars }, (_, i) => {
    const seed = Math.sin(i * 7.3) * 0.5 + 0.5;
    return 4 + seed * 28;
  });
  const step = 200 / bars;
  return (
    <svg
      width="100%"
      height="48"
      viewBox="0 0 200 48"
      preserveAspectRatio="none"
      className="w-full max-w-md text-[#F5F5F7]/80"
      aria-hidden
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * step + 1}
          y={(48 - h) / 2}
          width={Math.max(1.5, step - 1.5)}
          height={h}
          fill="currentColor"
          rx="0.5"
        />
      ))}
    </svg>
  );
}

function BreakpointRow({
  prefix,
  px,
  label,
  usage,
  freq,
  highlight,
}: {
  prefix: string;
  px: string;
  label: string;
  usage: string;
  freq: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 bg-black px-6 py-5 md:flex-row md:items-baseline md:gap-8">
      <div className="flex min-w-[8ch] flex-col gap-1">
        <span
          className={`font-mono text-base font-light ${
            highlight ? "text-[#F5F5F7]" : "text-white/55"
          }`}
        >
          {prefix}
        </span>
        <span className="font-mono text-[10px] text-white/35">{px}</span>
      </div>
      <div className="flex min-w-[18ch] flex-col gap-1 md:max-w-[24ch]">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/70">
          {label}
        </span>
        <span className="text-[10px] uppercase tracking-[0.28em] text-white/35">
          {freq}
        </span>
      </div>
      <span className="font-serif text-sm italic text-white/55 md:flex-1 md:text-base">
        {usage}
      </span>
    </div>
  );
}

function ViewportPreview() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2 font-mono text-[10px] text-white/55">
      <span>Container queries Tailwind (@container) :</span>
      <pre className="rounded-md border border-white/10 bg-black/40 p-3 leading-relaxed text-white/65">
        {`<div class="@container">
  <div class="grid grid-cols-1
    @md:grid-cols-2
    @lg:grid-cols-3">
  </div>
</div>
plugin @tailwindcss/container-queries
réagit à la taille du parent, pas du viewport`}
      </pre>
    </div>
  );
}

function SpacingRow({
  tier,
  values,
  usage,
}: {
  tier: string;
  values: string[];
  usage: string;
}) {
  // Convertit chaque valeur "1rem" en px pour afficher une barre visuelle.
  const remToPx = (v: string) => {
    const n = parseFloat(v);
    return v.endsWith("rem") ? n * 16 : n;
  };
  return (
    <div className="flex flex-col gap-4 bg-black px-6 py-6 md:flex-row md:items-center md:gap-12">
      <div className="flex min-w-[20ch] flex-col gap-2 md:max-w-[24ch]">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/65">
          {tier}
        </span>
        <span className="font-mono text-[10px] text-white/35">
          {values.join(" · ")}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {values.map((v) => (
          <div key={v} className="flex items-center gap-3">
            <span
              className="block h-1 bg-[#F5F5F7]/85"
              style={{ width: `${remToPx(v) * 1.5}px` }}
            />
            <span className="font-mono text-[10px] text-white/40">{v}</span>
          </div>
        ))}
      </div>
      <span className="max-w-[32ch] font-serif text-sm italic text-white/55 md:ml-auto md:text-right">
        {usage}
      </span>
    </div>
  );
}

/**
 * Slugifie un eyebrow ("01 · Palette" → "01-palette") pour générer l'id
 * du `<section>` correspondant. Utilisé pour les ancres du sommaire.
 */
function slugifyEyebrow(eyebrow: string): string {
  return eyebrow
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function Block({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  const id = slugifyEyebrow(eyebrow);
  return (
    <section
      id={id}
      className="flex scroll-mt-24 flex-col gap-6 border-t border-white/10 pt-12"
    >
      <div className="flex flex-col gap-3">
        <span className="text-[11px] uppercase tracking-[0.4em] text-white/40">
          {eyebrow}
        </span>
        <h2
          className="font-sans font-extralight leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
        >
          {title}
        </h2>
        <p className="max-w-2xl font-serif text-sm italic text-white/45 md:text-base">
          {intro}
        </p>
      </div>
      {children}
    </section>
  );
}

/**
 * Sommaire navigable groupé en 5 catégories. Chaque entrée pointe vers
 * l'ancre #slugifyEyebrow(eyebrow) du Block correspondant.
 */
type SummaryItem = { num: string; label: string };
type SummaryCategory = { name: string; tagline: string; items: SummaryItem[] };

const SUMMARY: SummaryCategory[] = [
  {
    name: "Fondations",
    tagline: "Palette, typo, easings, principes, breakpoints",
    items: [
      { num: "01", label: "Palette" },
      { num: "01b", label: "Palette alternative" },
      { num: "02", label: "Typographies" },
      { num: "03", label: "Mouvement" },
      { num: "04", label: "Principes" },
      { num: "24", label: "Breakpoints scale" },
      { num: "36", label: "Iconographie" },
      { num: "37", label: "Typography hierarchy" },
      { num: "38", label: "French typography" },
      { num: "39", label: "Logo & brand" },
      { num: "40", label: "Callouts éditoriaux" },
      { num: "41", label: "Pull quotes" },
      { num: "42", label: "Dropcap" },
      { num: "43", label: "Code blocks" },
      { num: "44", label: "Numbered steps" },
      { num: "45", label: "Timeline" },
      { num: "46", label: "Tooltips" },
      { num: "47", label: "Stepper" },
      { num: "48", label: "Pagination" },
      { num: "49", label: "Tabs dédié" },
      { num: "52", label: "Boutons" },
      { num: "53", label: "Project templates" },
      { num: "54", label: "Hero patterns" },
      { num: "55", label: "Card variants" },
      { num: "56", label: "Voice & tone" },
      { num: "50", label: "Section dividers" },
      { num: "51", label: "Sticky banners" },
    ],
  },
  {
    name: "Layout",
    tagline: "Spacing, grilles, page chrome, footers",
    items: [
      { num: "11", label: "Spacing scale" },
      { num: "12", label: "Grilles" },
      { num: "22", label: "Image grids" },
      { num: "31", label: "Page chrome" },
      { num: "30", label: "Footer patterns" },
    ],
  },
  {
    name: "Composants",
    tagline: "Boutons, formulaires, badges, modales, sound, kbd",
    items: [
      { num: "05", label: "Composants" },
      { num: "06", label: "Formulaires" },
      { num: "07", label: "Badges" },
      { num: "08", label: "Tableaux" },
      { num: "09", label: "Breadcrumbs" },
      { num: "10", label: "Modales" },
      { num: "19", label: "Dropdowns" },
      { num: "25", label: "Kbd shortcuts" },
      { num: "28", label: "Sound icons" },
    ],
  },
  {
    name: "Motion & micro-interactions",
    tagline: "Animations, scroll, marquees, drag, presence",
    items: [
      { num: "13", label: "Motion timing" },
      { num: "16", label: "Scroll progress" },
      { num: "18", label: "Marquees" },
      { num: "20", label: "Indicateurs vivants" },
      { num: "21", label: "Scroll snap" },
      { num: "23", label: "Transitions de page" },
      { num: "26", label: "Presence indicators" },
      { num: "27", label: "Drag interactions" },
    ],
  },
  {
    name: "États & patterns",
    tagline: "Focus, chargement, erreurs, vides, splash, search, media, charts",
    items: [
      { num: "14", label: "Media patterns" },
      { num: "15", label: "Focus & accessibilité" },
      { num: "17", label: "États de chargement" },
      { num: "29", label: "Charts / data viz" },
      { num: "32", label: "Error states" },
      { num: "33", label: "Empty states" },
      { num: "34", label: "Search inputs" },
      { num: "35", label: "Splash screens" },
    ],
  },
];

function Summary() {
  // Reconstruit le slug à partir du num + label pour matcher les ids
  // générés par slugifyEyebrow(eyebrow). Eyebrow format : "{num} · {label}".
  function hrefFor(item: SummaryItem): string {
    const eyebrow = `${item.num} · ${item.label}`;
    return `#${slugifyEyebrow(eyebrow)}`;
  }

  const totalItems = SUMMARY.reduce((n, c) => n + c.items.length, 0);

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            Sommaire
          </span>
          <h2
            className="font-sans font-extralight leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.5rem, 2.6vw, 2rem)" }}
          >
            {totalItems}{" "}
            <span className="font-serif italic font-normal text-white/65">
              composants
            </span>
          </h2>
        </div>
        <span className="text-[10px] uppercase tracking-[0.32em] text-white/35">
          Groupés en {SUMMARY.length} familles
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SUMMARY.map((cat) => (
          <li key={cat.name} className="flex flex-col gap-4 border-t border-white/10 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-[0.32em] text-white/65">
                {cat.name}
              </span>
              <span className="text-[10px] font-light italic text-white/40">
                {cat.tagline}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {cat.items.map((item) => (
                <li key={`${item.num}-${item.label}`}>
                  <a
                    href={hrefFor(item)}
                    className="group inline-flex items-baseline gap-3 text-[12px] text-white/55 transition-colors hover:text-white"
                  >
                    <span className="inline-block h-px w-3 bg-current transition-all duration-500 ease-out group-hover:w-6" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35 group-hover:text-white/55">
                      {item.num}
                    </span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SwatchCard({ swatch, dark = false }: { swatch: Swatch; dark?: boolean }) {
  const isLight = swatch.hex === "#F5F5F7" || swatch.hex === "#F8F1E0" || swatch.hex === "#F2E6C2";
  return (
    <li className="flex flex-col gap-4 bg-black p-6">
      <div
        className="relative h-28 w-full overflow-hidden rounded-md border border-white/10"
        style={{ background: swatch.hex }}
      >
        {dark && (
          <span
            className="absolute bottom-3 left-3 font-serif text-xl italic"
            style={{ color: isLight ? "#1A0306" : "#F5F5F7" }}
          >
            Aa
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/75">
          {swatch.name}
        </span>
        <span className="font-mono text-xs text-white/50">{swatch.hex}</span>
        <span className="font-serif text-sm italic text-white/45">
          {swatch.role}
        </span>
      </div>
    </li>
  );
}

function ComponentRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // Sépare preview (premier enfant) et snippet (second enfant)
  const arr = Array.isArray(children) ? children : [children];
  const preview = arr[0];
  const snippet = arr[1];
  return (
    <div className="flex flex-col gap-6 bg-black px-6 py-8 md:flex-row md:items-start md:gap-12">
      <div className="flex min-w-[16ch] flex-col gap-2 md:max-w-[24ch]">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/65">
          {title}
        </span>
      </div>
      <div className="flex flex-1 flex-wrap items-start gap-6 md:flex-nowrap">
        <div className="flex min-h-[60px] flex-1 items-center">
          {preview}
        </div>
        {snippet}
      </div>
    </div>
  );
}

function TypeRow({ type }: { type: TypeSpec }) {
  const fontFamily =
    type.variable === "--font-doc-display"
      ? "var(--font-doc-display), 'Playfair Display', serif"
      : type.variable === "--font-doc-italic"
        ? "var(--font-doc-italic), 'Cormorant Garamond', serif"
        : type.variable === "--font-serif"
          ? "var(--font-serif), 'Fraunces', serif"
          : "var(--font-sans), 'Inter', sans-serif";

  return (
    <li className="flex flex-col gap-4 bg-black px-6 py-7 md:flex-row md:items-center md:gap-10">
      <div className="flex min-w-[20ch] flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/75">
          {type.family}
        </span>
        <span className="font-mono text-xs text-white/45">{type.variable}</span>
        <span className="font-mono text-[10px] text-white/35">
          {type.weights}
        </span>
      </div>
      <span
        className="flex-1 truncate text-[#F5F5F7]"
        style={{
          fontFamily,
          fontStyle:
            type.variable === "--font-doc-italic" ||
            type.variable === "--font-doc-display"
              ? "italic"
              : "normal",
          fontWeight: 300,
          fontSize: "clamp(2rem, 4vw, 3.5rem)",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {type.sample}
      </span>
      <span className="max-w-[28ch] font-serif text-sm italic text-white/55 md:ml-auto md:text-right">
        {type.usage}
      </span>
    </li>
  );
}
