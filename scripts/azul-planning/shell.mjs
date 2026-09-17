/**
 * Assemblage d'un document complet : <head> + couverture + corps + clôture.
 *
 * Aucune unité `vh` n'est utilisée pour dimensionner quoi que ce soit : le
 * viewer injecte un script qui fige en pixels toute hauteur proche de
 * `100vh` (parade à la boucle de rétroaction entre l'auto-height de l'iframe
 * et les unités viewport). Les hauteurs sont donc en `rem` / `clamp()` avec
 * une composante `vh` uniquement sur des marges, jamais sur une hauteur
 * d'élément structurant.
 */

import { CSS, FONT_LINK } from "./theme.mjs";
import { RUNTIME_JS } from "./runtime.mjs";
import { esc } from "./charts.mjs";

export function chapter({ num, title, body }) {
  return `<section class="chapter" id="ch${num}">
  <div class="chapter__head r">
    <span class="chapter__num">${num}</span>
    <h2>${title}</h2>
  </div>
  ${body}
</section>`;
}

export function buildDoc({
  title,
  eyebrow,
  h1,
  lede,
  meta,
  body,
  endLeft = "Speetch · Paris",
  endRight = "Confidentiel — Azul",
}) {
  const metaHtml = meta
    .map((m) => `<div><dt>${m.k}</dt><dd>${m.v}</dd></div>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${FONT_LINK}
<style>${CSS}</style>
</head>
<body>
<div class="bg-grain" aria-hidden="true"></div>

<div class="rail" aria-hidden="true">
  <div class="rail__fill"></div>
  <div class="rail__pct">00</div>
</div>

<div class="wrap">
  <section class="cover">
    <div class="cover__halo" aria-hidden="true"></div>
    <p class="eyebrow r">${eyebrow}</p>
    <h1 class="r r-d1">${h1}</h1>
    <p class="lede r r-d2">${lede}</p>
    <dl class="cover__meta r r-d3">${metaHtml}</dl>
  </section>

  ${body}

  <section>
    <div class="end">
      <span>${endLeft}</span>
      <span>${endRight}</span>
    </div>
  </section>
</div>

<script>${RUNTIME_JS}</script>
</body>
</html>`;
}
