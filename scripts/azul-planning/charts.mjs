/**
 * Constructeurs de graphiques — sortie HTML/CSS, générée au build.
 *
 * Pourquoi pas de SVG à viewBox : ces documents vivent dans une iframe
 * redimensionnée à la hauteur de leur contenu. Un SVG en `width:100%` avec
 * viewBox rétrécit son texte avec lui (12 px deviennent 5 px sur mobile), et
 * sa hauteur dépend du ratio. En HTML/CSS le texte garde sa taille réelle à
 * toute largeur et la hauteur des figures est déterministe — elle ne bouge
 * plus après le chargement, ce qui évite de relancer l'auto-height du parent.
 *
 * Règles de marques appliquées (skill dataviz) :
 *  - barres ≤ 24 px, bout data arrondi à 4 px, carré à la ligne de base ;
 *  - écart de 2 px en couleur de surface entre segments empilés ;
 *  - anneau de surface de 2 px sur les points qui se chevauchent ;
 *  - grille et axes en hairline pleine, jamais pointillée, récessifs ;
 *  - étiquettes directes sélectives — jamais un nombre sur chaque point ;
 *  - le texte porte les tokens de texte, jamais la couleur de la série ;
 *  - légende dès deux séries, jumeau tableau pour chaque figure.
 */

import { PALETTE, STATUS_GLYPH } from "./theme.mjs";

const NBSP = " ";
const NNBSP = " "; // espace fine insécable — séparateur de milliers FR

export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Formatage FR : espace fine pour les milliers, virgule décimale. */
export function fr(n, digits = 0) {
  const neg = n < 0;
  const v = Math.abs(n).toFixed(digits);
  const [int, dec] = v.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
  return (neg ? "−" : "") + grouped + (dec ? "," + dec : "");
}

/** Décimale seulement si le nombre en a une — évite les « 60,0 % » sur l'axe. */
export const frSmart = (v) => fr(v, Number.isInteger(v) ? 0 : 1);

const pct = (x) => `${(x * 100).toFixed(4)}%`;
/** Position horizontale d'une fraction dans la piste (largeur = 100% − plot-pad). */
const posX = (f) => `calc((100% - var(--plot-pad)) * ${f.toFixed(5)})`;

/** Échelle linéaire → position en % dans la piste. */
function scaler(min, max) {
  const span = max - min || 1;
  return (v) => (v - min) / span;
}

/* ─── Enveloppe commune ────────────────────────────────────────────────── */

let figSeq = 0;

/**
 * Enveloppe une figure : titre, légende, graphique, note et vue tableau.
 * La vue tableau est le jumeau accessible — toute valeur reste atteignable
 * sans survol et sans distinction par la couleur seule.
 */
export function figure({
  kicker,
  title,
  sub,
  legend,
  chart,
  caption,
  table,
  aria,
}) {
  const id = `tv${++figSeq}`;
  const tableHtml = table
    ? `<div class="tv">
      <button class="tv__btn" type="button" aria-expanded="false" aria-controls="${id}"
        data-open="Voir les données" data-close="Masquer les données">Voir les données</button>
      <div class="tv__p" id="${id}" hidden>${table}</div>
    </div>`
    : "";

  return `<figure class="r">
  <div class="fig__head">
    ${kicker ? `<p class="fig__kicker">${kicker}</p>` : ""}
    <h3 class="fig__title">${title}</h3>
    ${sub ? `<p class="fig__sub">${sub}</p>` : ""}
  </div>
  ${legend ? `<div class="legend">${legend}</div>` : ""}
  <div class="chart"${aria ? ` role="img" aria-label="${esc(aria)}"` : ""}>${chart}</div>
  ${caption ? `<figcaption>${caption}</figcaption>` : ""}
  ${tableHtml}
</figure>`;
}

/** Légende — obligatoire dès deux séries. */
export function legend(items) {
  return items
    .map((it) => `<span class="${it.k}"><i></i><b>${it.label}</b></span>`)
    .join("");
}

function ticksRow(ticks, scale, fmt) {
  const cells = ticks
    .map((t, i) => {
      const cls = i === 0 ? " first" : i === ticks.length - 1 ? " last" : "";
      return `<span class="ch__tick${cls}" style="left:${posX(scale(t))}">${fmt(t, i)}</span>`;
    })
    .join("");
  return `<div class="ch__axis"><i></i><div class="ch__ticks">${cells}</div></div>`;
}

function gridLayer(ticks, scale) {
  return `<div class="ch__grid">${ticks
    .map(
      (t, i) =>
        `<div class="ch__gl${i === 0 ? " zero" : ""}" style="left:${pct(scale(t))}"></div>`,
    )
    .join("")}</div>`;
}

function tableOf(head, rows) {
  return `<table><thead><tr>${head
    .map((h, i) => `<th${i ? ' class="num"' : ""}>${h}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map(
      (r) =>
        `<tr>${r
          .map((c, i) => `<td${i ? ' class="num"' : ""}>${c}</td>`)
          .join("")}</tr>`,
    )
    .join("")}</tbody></table>`;
}

/* ─── 1. Barres horizontales (magnitude, une série) ────────────────────── */

/**
 * `emphasis` met une ligne en avant et désature les autres — la forme à
 * préférer quand l'histoire tient à une seule valeur (plutôt que huit
 * teintes catégorielles).
 */
export function barsH({
  rows,
  max,
  min = 0,
  ticks,
  fmt = (v) => fr(v),
  unit = "",
  height = 26,
}) {
  const scale = scaler(min, max);
  const body = rows
    .map((r, i) => {
      const tone = r.tone || (r.em ? "" : "dim");
      const w = scale(r.value);
      const tip = `${esc(r.label)} — <b>${fmt(r.value)}${unit}</b>${r.note ? `<br>${esc(r.note)}` : ""}`;
      return `<div class="ch__row${r.em ? " em" : ""}">
      <div class="ch__lab">${r.em ? `<b>${r.label}</b>` : r.label}${r.sub ? `<s>${r.sub}</s>` : ""}</div>
      <div class="ch__plot" style="height:${height}px">
        <div class="ch__track">
          <div class="ch__bar g-bar dly${Math.min(i, 11)} ${tone}"
               style="left:0;width:${pct(w)}"></div>
          <div class="ch__hit" data-tip="${tip}" data-tip-label="${esc(r.tipLabel || "")}"
               style="left:0;width:${pct(Math.max(w, 0.04))}"></div>
        </div>
        <div class="ch__val${r.em ? "" : " mut"} g-fade dly${Math.min(i, 11)}"
             style="left:${posX(scale(r.value))}">${fmt(r.value)}${unit}</div>
      </div>
    </div>`;
    })
    .join("");

  const chart = `<div class="ch">${gridWrap(ticks, scale, body)}${ticksRow(ticks, scale, fmt)}</div>`;
  const table = tableOf(
    ["", "Valeur"],
    rows.map((r) => [esc(r.label), fmt(r.value) + unit]),
  );
  return { chart, table };
}

function gridWrap(ticks, scale, body) {
  // La grille est posée dans une couche absolue derrière les lignes.
  return `<div style="position:relative">
    <div style="position:absolute;inset:0;display:grid;grid-template-columns:var(--lab) 1fr;gap:0 1.5rem;pointer-events:none">
      <i></i><div style="position:relative">${gridLayer(ticks, scale)}</div>
    </div>
    ${body}
  </div>`;
}

/* ─── 2. Barres d'intervalle (fourchettes min–max) ─────────────────────── */

export function rangeBars({
  rows,
  min,
  max,
  ticks,
  fmt = frSmart,
  unit = "",
  /** Réserve à droite pour l'étiquette de bout, en rem. */
  pad = 5.5,
}) {
  const scale = scaler(min, max);
  const body = rows
    .map((r, i) => {
      const l = scale(r.lo);
      const w = scale(r.hi) - scale(r.lo);
      const tone = r.tone || (r.em ? "" : "dim");
      const tip = `<b>${fmt(r.lo)}${unit} – ${fmt(r.hi)}${unit}</b>${r.note ? `<br>${esc(r.note)}` : ""}`;
      return `<div class="ch__row${r.em ? " em" : ""}">
      <div class="ch__lab">${r.em ? `<b>${r.label}</b>` : r.label}${r.sub ? `<s>${r.sub}</s>` : ""}</div>
      <div class="ch__plot">
        <div class="ch__track">
          <div class="ch__bar both g-bar dly${Math.min(i, 11)} ${tone}"
               style="left:${pct(l)};width:${pct(w)}"></div>
          <div class="ch__hit" data-tip="${tip}" data-tip-label="${esc(r.label)}"
               style="left:${pct(l)};width:${pct(Math.max(w, 0.04))}"></div>
        </div>
        <div class="ch__val${r.em ? "" : " mut"} g-fade dly${Math.min(i, 11)}"
             style="left:${posX(scale(r.hi))}">${fmt(r.lo)}–${fmt(r.hi)}${unit}</div>
      </div>
    </div>`;
    })
    .join("");

  const chart = `<div class="ch" style="--plot-pad:${pad}rem">${gridWrap(ticks, scale, body)}${ticksRow(ticks, scale, fmt)}</div>`;
  const table = tableOf(
    ["", "Bas", "Haut"],
    rows.map((r) => [esc(r.label), fmt(r.lo) + unit, fmt(r.hi) + unit]),
  );
  return { chart, table };
}

/* ─── 3. Intervalles de confiance (deux séries) ────────────────────────── */

/**
 * Trait + capuchons + point central, deux séries superposées par ligne.
 * Étiquetage sélectif : seule la ligne mise en avant porte ses valeurs,
 * l'axe, le survol et la vue tableau portent le reste.
 */
export function intervals({
  rows,
  series,
  min,
  max,
  ticks,
  fmt = frSmart,
  unit = "",
}) {
  const scale = scaler(min, max);
  const rowH = 20 + series.length * 16;

  const body = rows
    .map((r, i) => {
      const marks = series
        .map((s, si) => {
          const d = r.values[s.key];
          const lo = scale(d.lo);
          const hi = scale(d.hi);
          const mid = scale(d.mid);
          const off = (si - (series.length - 1) / 2) * 15;
          const tip = `<b>${fmt(d.mid)}${unit}</b> — IC 95${NBSP}% [${fmt(d.lo)} ; ${fmt(d.hi)}]<br>largeur ${fmt(d.hi - d.lo)}${unit}`;
          return `<div class="${s.k} g-fade dly${Math.min(i, 11)}" style="position:absolute;inset:0;transform:translateY(${off}px)">
          <div class="ch__ci" style="left:${pct(lo)};width:${pct(hi - lo)}"></div>
          <div class="ch__cap" style="left:${pct(lo)}"></div>
          <div class="ch__cap" style="left:calc(${pct(hi)} - 2px)"></div>
          <div class="ch__dot" style="left:${pct(mid)}"></div>
          <div class="ch__hit" data-tip="${tip}" data-tip-label="${esc(r.label + " · " + s.label)}"
               style="left:${pct(lo)};width:${pct(Math.max(hi - lo, 0.03))}"></div>
        </div>`;
        })
        .join("");

      const direct = r.em
        ? series
            .map((s, si) => {
              const d = r.values[s.key];
              const off = (si - (series.length - 1) / 2) * 15;
              return `<div class="ch__val g-fade dly${Math.min(i, 11)}" style="transform:translateY(calc(-50% + ${off}px));left:${posX(scale(d.hi))}">±${fmt((d.hi - d.lo) / 2)}</div>`;
            })
            .join("")
        : "";

      return `<div class="ch__row${r.em ? " em" : ""}">
      <div class="ch__lab">${r.em ? `<b>${r.label}</b>` : r.label}${r.sub ? `<s>${r.sub}</s>` : ""}</div>
      <div class="ch__plot" style="height:${rowH}px">
        <div class="ch__track">${marks}</div>
        ${direct}
      </div>
    </div>`;
    })
    .join("");

  const chart = `<div class="ch">${gridWrap(ticks, scale, body)}${ticksRow(
    ticks,
    scale,
    (t, i) => fmt(t) + (i === ticks.length - 1 ? unit : ""),
  )}</div>`;

  const table = tableOf(
    ["Taille du jeu", ...series.flatMap((s) => [`${s.label} — bas`, `${s.label} — haut`])],
    rows.map((r) => [
      esc(r.label),
      ...series.flatMap((s) => [fmt(r.values[s.key].lo), fmt(r.values[s.key].hi)]),
    ]),
  );
  return { chart, table };
}

/* ─── 4. Empilement part-à-tout (rampe ordinale) ───────────────────────── */

export function stack({ rows, unit = `${NBSP}%` }) {
  const ramp = PALETTE.ord;
  const body = rows
    .map((r, ri) => {
      const total = r.segs.reduce((a, s) => a + s.value, 0) || 1;
      const segs = r.segs
        .map((s, i) => {
          const share = s.value / total;
          const color = ramp[Math.min(i, ramp.length - 1)];
          // Étiquette à l'intérieur seulement si elle tient : on exige un
          // segment d'au moins 14 % avant d'y poser du texte, sinon c'est la
          // légende et le survol qui portent (jamais de texte rogné).
          const fits = share >= 0.14;
          // Encre choisie sur la luminance du fond, pour rester lisible.
          const darkFill = i <= 1;
          const ink = darkFill ? "#F5F5F7" : "#08222a";
          const tip = `${esc(s.label)} — <b>${fr(s.value)}${unit}</b>`;
          return `<div class="ch__seg g-bar dly${Math.min(i, 11)}" style="width:${pct(share)};background:${color}"
            data-tip="${tip}" data-tip-label="${esc(r.label)}">
          ${fits ? `<span class="ch__seg__in g-fade dly${Math.min(i + 2, 11)}" style="color:${ink}">${fr(s.value)}${unit}</span>` : ""}
        </div>`;
        })
        .join("");
      return `<div class="ch__row" style="padding:0.45rem 0">
      <div class="ch__lab">${r.label}${r.sub ? `<s>${r.sub}</s>` : ""}</div>
      <div class="ch__plot" style="height:30px;padding-right:0">
        <div class="ch__stack" style="right:0">${segs}</div>
      </div>
    </div>`;
    })
    .join("");

  const widest = rows.reduce((a, b) => (b.segs.length > a.segs.length ? b : a), rows[0]);
  const keys = widest.segs.map(
    (s, i) =>
      `<span style="color:${ramp[Math.min(i, ramp.length - 1)]}"><i></i><b>${esc(s.key || s.label)}</b></span>`,
  );

  const table = tableOf(
    ["", ...widest.segs.map((s) => esc(s.key || s.label))],
    rows.map((r) => [esc(r.label), ...r.segs.map((s) => fr(s.value) + unit)]),
  );
  return { chart: `<div class="ch">${body}</div>`, legendHtml: keys.join(""), table };
}

/* ─── 5. Bandes de seuil (statut : glyphe + libellé obligatoires) ──────── */

/**
 * La couleur de statut ne porte jamais le sens seule : chaque cellule
 * embarque son glyphe et son libellé (good ↔ critical mesurent ΔE 4.1 en
 * deutéranopie — indiscernables sans ce second canal).
 */
export function bands({ rows }) {
  const order = [
    { tone: "crit", key: "critical", label: "Blocage" },
    { tone: "warn", key: "warning", label: "Lancement restreint" },
    { tone: "good", key: "good", label: "Lancement" },
  ];
  const body = rows
    .map(
      (r, i) => `<div class="band r r-d${Math.min(i, 3)}">
    <div class="ch__lab"><b>${r.label}</b>${r.sub ? `<s>${r.sub}</s>` : ""}</div>
    <div class="band__seg">${order
      .map(
        (o) =>
          `<div class="band__c ${o.tone}"><i>${STATUS_GLYPH[o.key]}</i>${o.label}<b>${r[o.key]}</b></div>`,
      )
      .join("")}</div>
  </div>`,
    )
    .join("");

  const table = tableOf(
    ["Métrique", "Blocage", "Lancement restreint", "Lancement"],
    rows.map((r) => [esc(r.label), r.critical, r.warning, r.good]),
  );
  return { chart: `<div class="bands">${body}</div>`, table };
}

/* ─── 6. Frise chronologique ───────────────────────────────────────────── */

export function timeline({ items }) {
  const body = items
    .map(
      (it, i) => `<div class="tl__i r r-d${Math.min(i, 3)}${it.on ? " on" : ""}">
    <div class="tl__d">${it.date}</div>
    <div class="tl__t">${it.title}</div>
    ${it.body ? `<div class="tl__b">${it.body}</div>` : ""}
  </div>`,
    )
    .join("");
  const table = tableOf(
    ["Date", "Jalon"],
    items.map((it) => [it.date, esc(String(it.title).replace(/<[^>]+>/g, ""))]),
  );
  return { chart: `<div class="tl">${body}</div>`, table };
}

/* ─── 7. Jauges (ratio contre une limite) ──────────────────────────────── */

export function meters({ rows, fmt = (v) => fr(v) }) {
  const body = rows
    .map(
      (r, i) => `<div class="ch__row" style="padding:0.55rem 0">
    <div class="ch__lab">${r.label}${r.sub ? `<s>${r.sub}</s>` : ""}</div>
    <div class="ch__plot" style="height:30px">
      <div class="ch__track">
        <div class="meter"><div class="meter__t">
          <div class="meter__f g-bar dly${Math.min(i, 11)}${r.tone ? " " + r.tone : ""}" style="width:${pct(r.value / r.max)}"></div>
        </div></div>
        <div class="ch__hit" data-tip="<b>${fmt(r.value)}</b> sur ${fmt(r.max)}" data-tip-label="${esc(r.label)}" style="left:0;width:100%"></div>
      </div>
      <div class="ch__val g-fade dly${Math.min(i, 11)}" style="right:0;left:auto;padding-left:0">${fmt(r.value)}<span style="color:var(--faint)">/${fmt(r.max)}</span></div>
    </div>
  </div>`,
    )
    .join("");
  const table = tableOf(
    ["", "Valeur", "Total"],
    rows.map((r) => [esc(r.label), fmt(r.value), fmt(r.max)]),
  );
  return { chart: `<div class="ch">${body}</div>`, table };
}

/* ─── Figures non graphiques ───────────────────────────────────────────── */

export function kpis(items) {
  return `<div class="kpis r">${items
    .map(
      (k) => `<div class="kpi${k.accent ? " kpi--accent" : ""}">
    <p class="kpi__l">${k.label}</p>
    <p class="kpi__v">${k.value}${k.unit ? `<span class="u">${k.unit}</span>` : ""}</p>
    ${k.note ? `<p class="kpi__n">${k.note}</p>` : ""}
  </div>`,
    )
    .join("")}</div>`;
}

/** Le chiffre que le document met en tête — un seul par document. */
export function heroFig({ value, unit, caption }) {
  return `<div class="hero-fig r">
    <p class="hero-fig__v">${value}${unit ? `<span class="u">${unit}</span>` : ""}</p>
    <p class="hero-fig__c">${caption}</p>
  </div>`;
}

/* ─── 8. Empilement à échelle absolue ──────────────────────────────────── */

/**
 * Barres empilées partageant une échelle absolue (contrairement à `stack`,
 * qui normalise chaque ligne à 100 %). Sert à montrer une magnitude ET sa
 * composition — ici : champs à compléter, dont critiques.
 *
 * Deux segments au plus : c'est la limite de slots catégoriels validée face
 * à la surface (le trio échoue la séparation CVD).
 */
export function stackAbs({ rows, max, ticks, segLabels, unit = "" }) {
  const scale = scaler(0, max);
  const body = rows
    .map((r, i) => {
      const total = r.segs.reduce((a, v) => a + v, 0);
      let acc = 0;
      const marks = r.segs
        .map((v, si) => {
          const left = scale(acc);
          acc += v;
          const w = scale(v);
          const tone = si === 0 ? "" : "dim";
          const round = si === r.segs.length - 1 ? "" : " sq";
          const tip = `${esc(segLabels[si])} — <b>${fr(v)}${unit}</b>`;
          return `<div class="ch__bar g-bar dly${Math.min(i, 11)} ${tone}${round}"
            style="left:${pct(left)};width:${pct(w)};${si === 0 ? "border-radius:4px 0 0 4px" : ""}"
            data-tip="${tip}" data-tip-label="${esc(r.label)}"></div>`;
        })
        .join("");
      return `<div class="ch__row${r.em ? " em" : ""}">
      <div class="ch__lab">${r.em ? `<b>${r.label}</b>` : r.label}${r.sub ? `<s>${r.sub}</s>` : ""}</div>
      <div class="ch__plot">
        <div class="ch__track">${marks}</div>
        <div class="ch__val${r.em ? "" : " mut"} g-fade dly${Math.min(i, 11)}"
             style="left:${posX(scale(total))}">${fr(total)}${unit}</div>
      </div>
    </div>`;
    })
    .join("");

  const chart = `<div class="ch">${gridWrap(ticks, scale, body)}${ticksRow(ticks, scale, (t) => fr(t))}</div>`;
  const table = tableOf(
    ["Section", ...segLabels.map(esc), "Total"],
    rows.map((r) => [
      esc(r.label),
      ...r.segs.map((v) => fr(v)),
      fr(r.segs.reduce((a, v) => a + v, 0)),
    ]),
  );
  return { chart, table };
}
