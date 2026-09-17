/**
 * Thème Speetch « FWA grade » pour les documents raw_html de l'espace client.
 *
 * Palette data-viz validée avec le validateur de la skill dataviz contre la
 * surface réelle des documents (#0a0a0a), pas contre une surface de référence :
 *
 *   node scripts/validate_palette.js "#18a5c7,#d95926" --mode dark --surface "#0a0a0a"
 *     → lightness band PASS · chroma floor PASS · CVD ΔE 20.7 (deutan) PASS
 *       normal-vision ΔE 29.4 PASS · contrast ≥3:1 PASS
 *
 *   node scripts/validate_palette.js "#0e7d97,#18a5c7,#3fbcd8,#79d4e6" \
 *     --mode dark --surface "#0a0a0a" --ordinal
 *     → monotone PASS · ΔL gaps PASS · light-end 4.15:1 PASS · single hue 8° PASS
 *
 * Deux slots catégoriels seulement : le trio cyan+orange+violet échoue la
 * séparation CVD (ΔE 5.7 deutan). Au-delà de deux séries on passe donc en
 * emphase (une série accentuée, le reste en gris) ou en rampe ordinale.
 *
 * Les couleurs de statut sont fixes et ne sont jamais thémées. good ↔ critical
 * mesurent ΔE 4.1 en deutéranopie : elles ne portent JAMAIS le sens seules,
 * toujours accompagnées d'un glyphe + d'un libellé (règle icon+label).
 */

export const PALETTE = {
  surface: "#0a0a0a",
  surfaceRaised: "#111111",
  ink: "#F5F5F7",
  ink2: "rgba(245,245,247,0.62)",
  muted: "rgba(245,245,247,0.42)",
  faint: "rgba(245,245,247,0.26)",
  grid: "rgba(245,245,247,0.07)",
  axis: "rgba(245,245,247,0.16)",
  hairline: "rgba(245,245,247,0.10)",

  /** Slot catégoriel 1 — accent Speetch. */
  s1: "#18a5c7",
  /** Slot catégoriel 2 — seul second slot validé face au slot 1. */
  s2: "#d95926",
  /** Gris de désemphase pour les graphiques en emphase. */
  dim: "rgba(245,245,247,0.20)",
  dimStrong: "rgba(245,245,247,0.34)",

  /** Rampe ordinale cyan (catégories ordonnées : strates, paliers, phases). */
  ord: ["#0e7d97", "#18a5c7", "#3fbcd8", "#79d4e6"],

  /** Statuts — fixes, toujours avec glyphe + libellé. */
  stCritical: "#d03b3b",
  stWarning: "#fab219",
  stGood: "#0ca30c",
};

/** Glyphes de statut — le canal secondaire obligatoire à côté de la couleur. */
export const STATUS_GLYPH = {
  critical: "■",
  warning: "▲",
  good: "●",
};

export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Polices — `display=optional`, et c'est un choix structurant, pas un détail.
 *
 * Ces documents sont rendus dans une iframe que le parent redimensionne à la
 * hauteur du contenu, avec un garde-fou : il GÈLE le redimensionnement si la
 * hauteur croît de plus de 200 px deux fois de suite (parade à la boucle de
 * rétroaction des unités viewport).
 *
 * Avec `display=swap`, les deux familles arrivent l'une après l'autre et
 * refont couler le texte deux fois : mesuré sur le deck, le gel se
 * déclenchait à 15 063 px pour un document de 17 275 px — soit 2 212 px de
 * contenu devenus inatteignables, l'iframe n'ayant pas de scroll propre.
 *
 * `optional` supprime le swap tardif : soit la police est prête d'emblée,
 * soit le repli est conservé pour toute la vie de la page. Dans les deux cas
 * la hauteur ne bouge plus après le premier rendu. Les piles de repli sont
 * choisies proches en métriques pour limiter l'écart quand le repli sert.
 */
export const FONT_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&family=Fraunces:ital,opsz,wght@1,9..144,300;1,9..144,400&display=optional" rel="stylesheet">`;

/**
 * Aucune unité `vh` dans cette feuille, et c'est délibéré.
 *
 * L'iframe est redimensionnée par le parent à la hauteur de son contenu.
 * Toute marge exprimée en vh grandit donc avec elle : mesuré sur le deck,
 * le passage de 660 px à 15 063 px faisait bondir les marges de +2 212 px,
 * ce qui déclenchait le gel anti-boucle du viewer et rendait la fin du
 * document inatteignable. La largeur, elle, est stable → on n'utilise que
 * `vw` et `rem`.
 */
export const CSS = `
:root {
  --surface: ${PALETTE.surface};
  --raised: ${PALETTE.surfaceRaised};
  --ink: ${PALETTE.ink};
  --ink-2: ${PALETTE.ink2};
  --muted: ${PALETTE.muted};
  --faint: ${PALETTE.faint};
  --grid: ${PALETTE.grid};
  --axis: ${PALETTE.axis};
  --hairline: ${PALETTE.hairline};
  --s1: ${PALETTE.s1};
  --s2: ${PALETTE.s2};
  --dim: ${PALETTE.dim};
  --st-critical: ${PALETTE.stCritical};
  --st-warning: ${PALETTE.stWarning};
  --st-good: ${PALETTE.stGood};
  --ease: ${EASE};
  --gutter: clamp(1.25rem, 5vw, 7rem);
  --measure: 34rem;
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--surface);
  color: var(--ink);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-weight: 300;
  font-size: 17px;
  line-height: 1.68;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}

::selection { background: var(--ink); color: #000; }

/* ── Grain + halo : la texture de fond, purement décorative ─────────── */
.bg-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.32;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.42'/></svg>");
  mix-blend-mode: overlay;
}

.wrap { position: relative; z-index: 1; }

/* ── Rail de progression — suit le viewport réel du parent ──────────── */
.rail {
  position: absolute;
  left: max(0.75rem, calc(var(--gutter) / 3));
  top: 0;
  width: 1px;
  height: 0;
  background: var(--hairline);
  z-index: 40;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.9s var(--ease), transform 0.25s linear, height 0.25s linear;
}
.rail.on { opacity: 1; }
.rail__fill {
  position: absolute;
  inset: 0 0 auto 0;
  height: 0;
  background: linear-gradient(to bottom, transparent, var(--s1));
  transform-origin: top;
}
.rail__pct {
  position: absolute;
  left: 8px;
  top: 0;
  font-size: 9px;
  letter-spacing: 0.32em;
  color: var(--faint);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
@media (max-width: 900px) { .rail { display: none; } }

/* ── Sections ───────────────────────────────────────────────────────── */
section { padding: 0 var(--gutter); }

.cover {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: clamp(4.5rem, 9vw, 11rem);
  padding-bottom: clamp(4rem, 7.5vw, 9rem);
  position: relative;
}
.cover__halo {
  position: absolute;
  left: 8%;
  top: 4%;
  width: min(62rem, 88%);
  aspect-ratio: 1.6;
  background: radial-gradient(ellipse at 30% 40%, rgba(24,165,199,0.17), transparent 62%);
  filter: blur(46px);
  pointer-events: none;
  z-index: -1;
}

.eyebrow {
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 clamp(1.75rem, 3.2vw, 3.25rem);
}
.eyebrow b { color: var(--s1); font-weight: 400; }
.eyebrow .sep { color: rgba(245,245,247,0.16); margin: 0 0.85em; }

h1 {
  font-weight: 200;
  font-size: clamp(2.65rem, 8.2vw, 7.5rem);
  line-height: 0.88;
  letter-spacing: -0.052em;
  margin: 0;
  max-width: 17ch;
  text-wrap: balance;
}
h1 .it {
  font-family: "Fraunces", ui-serif, Georgia, serif;
  font-style: italic;
  font-weight: 300;
  letter-spacing: -0.03em;
}

.lede {
  font-family: "Fraunces", ui-serif, Georgia, serif;
  font-style: italic;
  font-weight: 300;
  font-size: clamp(1.15rem, 2.1vw, 1.6rem);
  line-height: 1.5;
  color: var(--ink-2);
  max-width: 40rem;
  margin: clamp(1.75rem, 2.5vw, 2.75rem) 0 0;
  text-wrap: pretty;
}

.cover__meta {
  margin-top: clamp(2.75rem, 5vw, 5rem);
  padding-top: 1.5rem;
  border-top: 1px solid var(--hairline);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 1.75rem 2.5rem;
  max-width: 62rem;
}
.cover__meta dt {
  font-size: 9.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--faint);
  margin: 0 0 0.5rem;
}
.cover__meta dd { margin: 0; font-size: 14px; color: var(--ink-2); font-weight: 300; }

/* ── Chapitres ──────────────────────────────────────────────────────── */
.chapter { padding-top: clamp(4.5rem, 8vw, 9.5rem); padding-bottom: clamp(1rem, 2vw, 2rem); }
.chapter__head {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  border-top: 1px solid var(--hairline);
  padding-top: 1.5rem;
  margin-bottom: clamp(2rem, 3.2vw, 3.5rem);
}
.chapter__num {
  font-size: 10px;
  letter-spacing: 0.32em;
  color: var(--s1);
  font-variant-numeric: tabular-nums;
  flex: none;
  padding-top: 0.55rem;
}
h2 {
  font-weight: 200;
  font-size: clamp(1.75rem, 4.4vw, 3.4rem);
  line-height: 1.02;
  letter-spacing: -0.04em;
  margin: 0;
  max-width: 22ch;
  text-wrap: balance;
}
h2 .it { font-family: "Fraunces", ui-serif, Georgia, serif; font-style: italic; font-weight: 300; }

h3 {
  font-weight: 400;
  font-size: clamp(1.02rem, 1.6vw, 1.2rem);
  letter-spacing: -0.01em;
  line-height: 1.32;
  margin: clamp(2.5rem, 3.8vw, 4rem) 0 1rem;
  color: var(--ink);
  max-width: 34ch;
}
h4 {
  font-weight: 400;
  font-size: 10px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 2.25rem 0 0.9rem;
}

p { margin: 0 0 1.15rem; max-width: var(--measure); color: var(--ink-2); }
p.wide { max-width: 48rem; }
p strong, li strong { color: var(--ink); font-weight: 500; }
em { font-family: "Fraunces", ui-serif, Georgia, serif; font-style: italic; }
a { color: var(--s1); text-underline-offset: 3px; text-decoration-thickness: 1px; }

ul, ol { max-width: var(--measure); padding-left: 1.15rem; margin: 0 0 1.35rem; color: var(--ink-2); }
li { margin: 0 0 0.55rem; }
li::marker { color: var(--faint); }

code, .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.86em;
  color: var(--s1);
  background: rgba(24,165,199,0.08);
  padding: 0.1em 0.38em;
  border-radius: 3px;
}

/* ── Citation / pull quote ──────────────────────────────────────────── */
.pull {
  margin: clamp(2.5rem, 3.8vw, 4rem) 0;
  padding-left: clamp(1.25rem, 3vw, 2.25rem);
  border-left: 1px solid var(--s1);
  max-width: 44rem;
}
.pull p {
  font-family: "Fraunces", ui-serif, Georgia, serif;
  font-style: italic;
  font-weight: 300;
  font-size: clamp(1.25rem, 2.6vw, 1.95rem);
  line-height: 1.34;
  color: var(--ink);
  margin: 0;
  max-width: none;
  text-wrap: pretty;
}
.pull cite {
  display: block;
  margin-top: 1.1rem;
  font-family: "Inter", sans-serif;
  font-style: normal;
  font-size: 10px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--faint);
}

/* ── Encarts ────────────────────────────────────────────────────────── */
.note {
  margin: clamp(1.75rem, 2.5vw, 2.75rem) 0;
  padding: 1.5rem clamp(1.25rem, 2.5vw, 2rem);
  background: var(--raised);
  border: 1px solid var(--hairline);
  border-radius: 2px;
  max-width: 48rem;
}
.note > :last-child { margin-bottom: 0; }
.note__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 9.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  margin-bottom: 0.9rem;
  color: var(--muted);
}
.note__tag::before {
  content: "";
  width: 14px;
  height: 1px;
  background: currentColor;
}
.note--critical { border-left: 2px solid var(--st-critical); }
.note--critical .note__tag { color: var(--st-critical); }
.note--warning { border-left: 2px solid var(--st-warning); }
.note--warning .note__tag { color: var(--st-warning); }
.note--accent { border-left: 2px solid var(--s1); }
.note--accent .note__tag { color: var(--s1); }

/* Badge « champ critique » — glyphe + libellé, jamais la couleur seule.
   Nommé .flag et non .crit : .crit est déjà un ton de marque (bandes, barres). */
.flag {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  font-size: 9.5px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--st-critical);
  border: 1px solid rgba(208,59,59,0.4);
  border-radius: 999px;
  padding: 0.15em 0.6em;
  white-space: nowrap;
  vertical-align: middle;
}

/* ── Tableaux ───────────────────────────────────────────────────────── */
.tw { margin: clamp(1.75rem, 2.5vw, 2.75rem) 0; overflow-x: auto; }
table {
  border-collapse: collapse;
  width: 100%;
  min-width: 30rem;
  font-size: 14px;
}
caption {
  text-align: left;
  font-size: 9.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--faint);
  padding-bottom: 0.9rem;
}
th, td {
  text-align: left;
  vertical-align: top;
  padding: 0.85rem 1.25rem 0.85rem 0;
  border-bottom: 1px solid var(--hairline);
}
th {
  font-weight: 400;
  font-size: 9.5px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom-color: var(--axis);
  white-space: nowrap;
}
td { color: var(--ink-2); }
td:first-child { color: var(--ink); font-weight: 400; }
tbody tr:last-child td { border-bottom: none; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; padding-right: 0; }

/* ── Figures & graphiques ───────────────────────────────────────────── */
figure { margin: clamp(2.5rem, 4.4vw, 4.5rem) 0; }
.fig__head { margin-bottom: 1.5rem; max-width: 44rem; }
.fig__kicker {
  font-size: 9.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--s1);
  margin: 0 0 0.6rem;
}
.fig__title {
  font-weight: 300;
  font-size: clamp(1.05rem, 2vw, 1.45rem);
  letter-spacing: -0.02em;
  line-height: 1.26;
  margin: 0;
  color: var(--ink);
  max-width: 30ch;
}
.fig__sub {
  margin: 0.6rem 0 0;
  font-size: 13.5px;
  color: var(--muted);
  max-width: 42rem;
  line-height: 1.55;
}
.chart { position: relative; width: 100%; }
.chart svg { display: block; width: 100%; height: auto; overflow: visible; }

figcaption {
  margin-top: 1.1rem;
  font-size: 12px;
  color: var(--faint);
  max-width: 42rem;
  line-height: 1.6;
}
figcaption b { color: var(--muted); font-weight: 400; }

/* Légende — toujours présente dès 2 séries. */
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1.75rem;
  margin: 0 0 1.35rem;
  font-size: 11.5px;
  color: var(--ink-2);
  letter-spacing: 0.02em;
}
.legend span { display: inline-flex; align-items: center; gap: 0.55rem; }
.legend i {
  width: 14px;
  height: 3px;
  border-radius: 2px;
  background: currentColor;
  flex: none;
}
.legend .k1 { color: var(--s1); }
.legend .k2 { color: var(--s2); }
.legend .kd { color: var(--dim); }
.legend .kc { color: var(--st-critical); }
.legend .kw { color: var(--st-warning); }
.legend .kg { color: var(--st-good); }
.legend b { color: var(--ink-2); font-weight: 300; }

/* Texte SVG — jamais la couleur de la série (règle text tokens). */
.t-lab { fill: ${PALETTE.ink2}; font-size: 12.5px; font-weight: 300; }
.t-val { fill: ${PALETTE.ink}; font-size: 12.5px; font-weight: 400; font-variant-numeric: tabular-nums; }
.t-ax  { fill: ${PALETTE.muted}; font-size: 10.5px; font-weight: 300; font-variant-numeric: tabular-nums; letter-spacing: 0.04em; }
.t-mut { fill: ${PALETTE.faint}; font-size: 10.5px; font-weight: 300; }
.t-em  { fill: ${PALETTE.ink}; font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; }

/* ── Stat tiles & hero figure ───────────────────────────────────────── */
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 1px;
  background: var(--hairline);
  border: 1px solid var(--hairline);
  margin: clamp(2rem, 3.2vw, 3.5rem) 0;
}
.kpi { background: var(--surface); padding: 1.6rem clamp(1.1rem, 2vw, 1.6rem); }
.kpi__l {
  font-size: 9.5px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--faint);
  margin: 0 0 0.85rem;
  line-height: 1.5;
}
.kpi__v {
  font-size: clamp(1.9rem, 3.6vw, 2.9rem);
  font-weight: 200;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--ink);
  margin: 0;
}
.kpi__v .u { font-size: 0.42em; font-weight: 300; letter-spacing: 0.02em; color: var(--muted); margin-left: 0.25em; }
.kpi__n { margin: 0.75rem 0 0; font-size: 12px; color: var(--muted); line-height: 1.55; }
.kpi--accent .kpi__v { color: var(--s1); }

.hero-fig {
  margin: clamp(2.5rem, 4.4vw, 4.5rem) 0;
  max-width: 44rem;
}
.hero-fig__v {
  font-family: "Inter", sans-serif;
  font-size: clamp(4rem, 13vw, 10rem);
  font-weight: 200;
  letter-spacing: -0.06em;
  line-height: 0.86;
  margin: 0;
  color: var(--ink);
}
.hero-fig__v .u { font-size: 0.3em; letter-spacing: -0.01em; color: var(--s1); margin-left: 0.1em; }
.hero-fig__c { margin: 1.25rem 0 0; font-size: 14px; color: var(--muted); max-width: 32rem; }

/* ── Table view (le jumeau accessible de chaque graphique) ──────────── */
.tv { margin-top: 1.25rem; }
.tv__btn {
  appearance: none;
  background: none;
  border: 0;
  border-bottom: 1px solid var(--hairline);
  color: var(--faint);
  font: inherit;
  font-size: 9.5px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  padding: 0 0 0.35rem;
  cursor: pointer;
  transition: color 0.4s var(--ease), border-color 0.4s var(--ease);
}
.tv__btn:hover { color: var(--ink-2); border-color: var(--axis); }
.tv__p[hidden] { display: none; }
.tv__p { margin-top: 1.1rem; }
.tv__p table { font-size: 13px; min-width: 22rem; }

/* ── Tooltip ────────────────────────────────────────────────────────── */
.tip {
  position: absolute;
  z-index: 20;
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, -100%);
  background: #16181a;
  border: 1px solid rgba(245,245,247,0.14);
  border-radius: 3px;
  padding: 0.6rem 0.8rem;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink);
  white-space: nowrap;
  box-shadow: 0 10px 34px rgba(0,0,0,0.6);
  transition: opacity 0.18s ease;
}
.tip.on { opacity: 1; }
.tip b { font-weight: 500; font-variant-numeric: tabular-nums; }
.tip s { display: block; text-decoration: none; color: var(--muted); font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 0.25rem; }
.hit { fill: transparent; cursor: crosshair; }

/* ── Reveal ──────────────────────────────────────────────────────────
   Amélioration progressive : par défaut le contenu est VISIBLE. Le moteur
   n'arme le masquage (.js-reveal sur <html>) qu'après avoir prouvé qu'il
   sait piloter la boucle. Sans JS, ou si le navigateur bride l'iframe au
   point de tuer la boucle, le document reste intégralement lisible. */
.r { opacity: 1; transform: none; }
.js-reveal .r { opacity: 0; transform: translateY(18px); }
.js-reveal .r.in { opacity: 1; transform: none; transition: opacity 1.05s var(--ease), transform 1.05s var(--ease); }
.js-reveal .r-d1.in { transition-delay: 0.08s; }
.js-reveal .r-d2.in { transition-delay: 0.16s; }
.js-reveal .r-d3.in { transition-delay: 0.24s; }

/* Animation des marques : géométrie réservée au build, on n'anime que
   transform / opacity / stroke-dashoffset → jamais la hauteur du document. */
.js-reveal .g-bar { transform: scaleX(0); transform-origin: left center; }
.js-reveal .g-barR { transform: scaleX(0); transform-origin: right center; }
.js-reveal .in .g-bar { transform: scaleX(1); transition: transform 1.15s var(--ease); }
.js-reveal .g-col { transform: scaleY(0); transform-origin: center bottom; }
.js-reveal .in .g-col { transform: scaleY(1); transition: transform 1.15s var(--ease); }
.g-line { stroke-dasharray: var(--len); stroke-dashoffset: var(--len); }
.in .g-line { stroke-dashoffset: 0; transition: stroke-dashoffset 1.6s var(--ease); }
.js-reveal .g-fade { opacity: 0; }
.js-reveal .in .g-fade { opacity: 1; transition: opacity 0.9s var(--ease) 0.35s; }
.js-reveal .g-pop { opacity: 0; transform: scale(0.7); }
.js-reveal .in .g-pop { opacity: 1; transform: none; transition: opacity 0.6s var(--ease), transform 0.7s var(--ease); }

/* Cascade : chaque marque part légèrement après la précédente.
   Préfixe 'dly' et non 's' : .s1 et .s2 sont déjà les classes de couleur. */
.js-reveal .in .dly0 { transition-delay: 0.00s; }
.js-reveal .in .dly1 { transition-delay: 0.07s; }
.js-reveal .in .dly2 { transition-delay: 0.14s; }
.js-reveal .in .dly3 { transition-delay: 0.21s; }
.js-reveal .in .dly4 { transition-delay: 0.28s; }
.js-reveal .in .dly5 { transition-delay: 0.35s; }
.js-reveal .in .dly6 { transition-delay: 0.42s; }
.js-reveal .in .dly7 { transition-delay: 0.49s; }
.js-reveal .in .dly8 { transition-delay: 0.56s; }
.js-reveal .in .dly9 { transition-delay: 0.63s; }
.js-reveal .in .dly10 { transition-delay: 0.70s; }
.js-reveal .in .dly11 { transition-delay: 0.77s; }

@media (prefers-reduced-motion: reduce) {
  .r, .r.in { opacity: 1; transform: none; transition: none; }
  .g-bar, .in .g-bar, .g-col, .in .g-col { transform: none; transition: none; }
  .g-line, .in .g-line { stroke-dashoffset: 0; transition: none; }
  .g-fade, .in .g-fade, .g-pop, .in .g-pop { opacity: 1; transform: none; transition: none; }
  .rail { display: none; }
}

/* ── Clôture ────────────────────────────────────────────────────────── */
.end {
  margin-top: clamp(5rem, 9vw, 10rem);
  padding-top: 2rem;
  padding-bottom: clamp(4rem, 6.3vw, 7rem);
  border-top: 1px solid var(--hairline);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.5rem;
  font-size: 9.5px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--faint);
}

@media (max-width: 640px) {
  body { font-size: 16px; }
  th, td { padding-right: 0.9rem; }
}

/* ═══ Graphiques — HTML/CSS plutôt que SVG à viewBox ═══════════════════
   Le texte reste net à toute largeur, la hauteur est déterministe (elle ne
   bouge plus après le chargement, ce qui est vital vu l'auto-height de
   l'iframe), et les marques s'animent en transform pur.              */

.ch { margin: 0; --lab: 13rem; --plot-pad: 3.25rem; }
.ch__row {
  display: grid;
  grid-template-columns: var(--lab) 1fr;
  align-items: center;
  gap: 0 1.5rem;
  padding: 0.3rem 0;
}
.ch__lab {
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.35;
  text-align: right;
  hyphens: auto;
}
.ch__lab b { color: var(--ink); font-weight: 500; }
.ch__lab s { display: block; text-decoration: none; font-size: 10.5px; color: var(--faint); letter-spacing: 0.08em; margin-top: 0.12rem; }

/* Piste : conteneur de positionnement. Padding droit = place pour la
   valeur en bout de barre, pour qu'aucun label ne soit jamais rogné. */
.ch__plot { position: relative; height: 26px; padding-right: var(--plot-pad); }
.ch__track { position: absolute; inset: 0 var(--plot-pad) 0 0; }

.ch__bar {
  position: absolute;
  top: 50%;
  height: 14px;
  margin-top: -7px;
  background: var(--s1);
  border-radius: 0 4px 4px 0;   /* 4px sur le bout data, carré à la base */
  will-change: transform;
}
.ch__bar.neg { border-radius: 4px 0 0 4px; }
.ch__bar.both { border-radius: 4px; }  /* barre flottante : deux bouts data */
.ch__bar.sq { border-radius: 0; border-right: 2px solid var(--surface); }
.ch__bar.dim { background: var(--dim); }
.ch__bar.s2 { background: var(--s2); }
.ch__bar.crit { background: var(--st-critical); }
.ch__bar.warn { background: var(--st-warning); }
.ch__bar.good { background: var(--st-good); }

/* Valeur en bout de barre — hors de la marque, jamais rognée. */
.ch__val {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
  white-space: nowrap;
  padding-left: 0.6rem;
}
.ch__val.mut { color: var(--muted); font-weight: 300; }

/* Grille — hairlines solides, récessives, sous les marques. */
.ch__grid { position: absolute; inset: 0 var(--plot-pad) 0 0; pointer-events: none; }
.ch__gl { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--grid); }
.ch__gl.zero { background: var(--axis); }

.ch__axis {
  display: grid;
  grid-template-columns: var(--lab) 1fr;
  gap: 0 1.5rem;
  margin-top: 0.6rem;
  padding-top: 0.7rem;
}
.ch__axis > i { display: block; }
.ch__ticks { position: relative; height: 1.1rem; padding-right: var(--plot-pad); border-top: 1px solid var(--axis); }
.ch__tick {
  position: absolute;
  top: 0.4rem;
  font-size: 10.5px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  transform: translateX(-50%);
  white-space: nowrap;
}
.ch__tick.first { transform: none; }
.ch__tick.last { transform: translateX(-100%); }

/* Empilement part-à-tout : écart de 2px en couleur de surface. */
.ch__stack { position: absolute; inset: 0 var(--plot-pad) 0 0; display: flex; }
.ch__seg {
  position: relative;
  height: 20px;
  align-self: center;
  border-right: 2px solid var(--surface);
  background: var(--s1);
  transform-origin: left center;
}
.ch__seg:last-child { border-right: 0; border-radius: 0 4px 4px 0; }
.ch__seg:first-child { border-radius: 4px 0 0 4px; }
.ch__seg__in {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

/* Intervalle de confiance : trait + capuchons + point central. */
.ch__ci { position: absolute; top: 50%; height: 2px; margin-top: -1px; background: currentColor; border-radius: 1px; }
.ch__cap { position: absolute; top: 50%; width: 2px; height: 11px; margin-top: -5.5px; background: currentColor; border-radius: 1px; }
.ch__dot {
  position: absolute;
  top: 50%;
  width: 9px;
  height: 9px;
  margin: -4.5px 0 0 -4.5px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 2px var(--surface);  /* anneau de surface, pas un contour */
}
.k1 { color: var(--s1); }
.k2 { color: var(--s2); }
.kd { color: var(--dim); }

/* Zone de survol : cible généreuse (≥24px) au-delà de la marque. */
.ch__hit { position: absolute; top: 0; bottom: 0; min-width: 24px; cursor: crosshair; z-index: 5; }
.ch__row:hover .ch__lab { color: var(--ink); }

/* Ligne mise en avant. */
.ch__row.em .ch__lab { color: var(--ink); }
.ch__row.em .ch__val { color: var(--ink); font-weight: 500; }
/* Bandes de seuil — la couleur ne porte jamais seule : glyphe + libellé. */
.bands { --lab: 13rem; display: grid; gap: 1px; background: var(--hairline); border: 1px solid var(--hairline); }
.band { background: var(--surface); display: grid; grid-template-columns: var(--lab) 1fr; gap: 0 1.5rem; align-items: center; padding: 0.9rem 0; }
.band__seg { display: flex; gap: 2px; }
.band__c { flex: 1; padding: 0.55rem 0.7rem; font-size: 11.5px; line-height: 1.3; }
.band__c i { font-style: normal; margin-right: 0.45em; }
.band__c b { display: block; font-variant-numeric: tabular-nums; font-weight: 500; color: var(--ink); margin-top: 0.2rem; }
.band__c.crit { background: rgba(208,59,59,0.13); color: var(--st-critical); }
.band__c.warn { background: rgba(250,178,25,0.12); color: var(--st-warning); }
.band__c.good { background: rgba(12,163,12,0.13); color: var(--st-good); }

/* Frise chronologique. */
.tl { position: relative; padding-left: 1.5rem; }
.tl::before { content: ""; position: absolute; left: 3px; top: 6px; bottom: 6px; width: 1px; background: var(--axis); }
.tl__i { position: relative; padding: 0 0 1.6rem; }
.tl__i:last-child { padding-bottom: 0; }
.tl__i::before {
  content: "";
  position: absolute;
  left: -1.5rem;
  top: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--dimStrong, rgba(245,245,247,0.34));
  box-shadow: 0 0 0 2px var(--surface);
}
.tl__i.on::before { background: var(--s1); }
.tl__d { font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: var(--s1); margin-bottom: 0.3rem; }
.tl__t { font-size: 14.5px; color: var(--ink); font-weight: 400; margin-bottom: 0.25rem; }
.tl__b { font-size: 13px; color: var(--muted); max-width: 34rem; line-height: 1.55; }

/* Jauge (ratio vs limite) : piste = pas plus clair de la même rampe. */
.meter { margin: 0.35rem 0 0; }
.meter__t { position: relative; height: 8px; background: rgba(24,165,199,0.16); border-radius: 4px; overflow: hidden; }
.meter__f { position: absolute; inset: 0 auto 0 0; background: var(--s1); border-radius: 4px; transform-origin: left center; }
.meter__f.warn { background: var(--st-warning); }
.meter__f.crit { background: var(--st-critical); }

@media (max-width: 760px) {
  .ch { --lab: 7.5rem; --plot-pad: 2.6rem; }
  .bands { --lab: 7.5rem; }
  .ch__row, .ch__axis, .band { grid-template-columns: var(--lab) 1fr; gap: 0 0.85rem; }
  /* Trois cellules de seuil côte à côte débordent sous ~640 px : on passe
     la bande en pile, libellé au-dessus. */
  .band { grid-template-columns: 1fr; gap: 0.7rem 0; padding: 1.1rem 0.9rem; }
  .band .ch__lab { text-align: left; }
  .band__seg { flex-direction: column; gap: 2px; }
  .band__c { padding: 0.5rem 0.65rem; }
  .band__c b { display: inline; margin-left: 0.5em; }
  .ch__lab { font-size: 11.5px; }
  .ch__val { font-size: 11px; padding-left: 0.45rem; }
  .ch__tick { font-size: 9.5px; }
}

`;
