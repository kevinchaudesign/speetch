/**
 * Runtime injecté dans chaque document Azul.
 *
 * Contrainte structurante : ces documents sont rendus par RawHtmlPageView
 * dans une iframe `srcDoc` que le parent redimensionne à la hauteur du
 * contenu. L'iframe n'a donc **pas de scrollport à elle** :
 *
 *  - `position: sticky` / `fixed` sont inertes (tout le document est « dans »
 *    le viewport de l'iframe) ;
 *  - un IntersectionObserver sur le viewport de l'iframe déclencherait tout
 *    en même temps au chargement.
 *
 * Le moteur ci-dessous lit donc le scroll du **parent** (l'iframe est
 * `allow-same-origin`, et le viewer lit déjà `window.parent.location.origin`)
 * et projette le viewport réel dans les coordonnées du document.
 *
 * Deuxième contrainte : le parent observe l'iframe avec un MutationObserver
 * et gèle le redimensionnement si la hauteur croît de plus de 200 px deux
 * fois de suite. On n'anime donc QUE `transform`, `opacity` et
 * `stroke-dashoffset` — jamais une propriété qui change la hauteur du
 * document. Les géométries SVG sont calculées au build, pas au runtime.
 */

export const RUNTIME_JS = `
(function () {
  "use strict";

  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  /* ── Accès au viewport réel (celui du parent) ───────────────────────── */

  var frame = null;
  try { frame = window.frameElement; } catch (e) { frame = null; }

  function viewport() {
    // Renvoie [haut, bas] de la zone visible, en coordonnées du document
    // de l'iframe. Null si on ne sait pas lire le parent (doc ouvert seul).
    if (!frame) return null;
    try {
      var top = frame.getBoundingClientRect().top;
      var ph = window.parent.innerHeight || 0;
      if (!ph) return null;
      // rect.top est relatif au viewport du parent : -rect.top est donc
      // déjà la position du haut visible dans le repère de l'iframe.
      return [-top, -top + ph];
    } catch (e) {
      return null;
    }
  }

  function selfViewport() {
    // Repli : document ouvert directement (hors iframe).
    return [window.scrollY, window.scrollY + window.innerHeight];
  }

  function currentViewport() {
    return viewport() || selfViewport();
  }

  /* ── Reveal au scroll ───────────────────────────────────────────────── */

  var pending = [].slice.call(document.querySelectorAll(".r"));

  function revealAll() {
    pending.forEach(function (el) { el.classList.add("in"); });
    pending = [];
  }

  function checkReveal() {
    if (!pending.length) return;
    var vp = currentViewport();
    var bottom = vp[1];
    var top = vp[0];
    var still = [];
    for (var i = 0; i < pending.length; i++) {
      var el = pending[i];
      var r = el.getBoundingClientRect();
      var y = r.top;
      // Déclenche quand le haut de l'élément entre dans le tiers bas du
      // viewport, ou s'il est déjà passé au-dessus.
      if (y < bottom - 90 && y + r.height > top - 400) {
        el.classList.add("in");
      } else if (y <= top - 400) {
        el.classList.add("in");
      } else {
        still.push(el);
      }
    }
    pending = still;
  }

  /* ── Rail de progression (suit le viewport réel) ─────────────────────── */

  var rail = document.querySelector(".rail");
  var railFill = rail ? rail.querySelector(".rail__fill") : null;
  var railPct = rail ? rail.querySelector(".rail__pct") : null;
  var lastTop = -1;
  var lastPct = -1;

  function updateRail() {
    if (!rail || !frame) return;
    var vp = currentViewport();
    var top = vp[0];
    var h = vp[1] - vp[0];
    var docH = document.documentElement.scrollHeight || 1;
    var railH = Math.max(120, h - 200);
    var y = Math.round(top + (h - railH) / 2);
    if (y !== lastTop) {
      rail.style.transform = "translateY(" + y + "px)";
      rail.style.height = railH + "px";
      lastTop = y;
    }
    var pct = Math.min(1, Math.max(0, (top + h) / docH));
    var p100 = Math.round(pct * 100);
    if (p100 !== lastPct) {
      if (railFill) railFill.style.height = (pct * 100).toFixed(2) + "%";
      if (railPct) railPct.textContent = (p100 < 10 ? "0" : "") + p100;
      lastPct = p100;
    }
    if (!rail.classList.contains("on")) rail.classList.add("on");
  }

  /* ── Boucle de suivi ─────────────────────────────────────────────────

     Deux constats mesurés dans ce contexte d'iframe très haute (~16 000 px),
     qui dictent toute la stratégie :

       1. Un listener "scroll" posé depuis l'iframe sur window.parent ne se
          déclenche JAMAIS (zéro appel, aucune exception).
       2. Chrome bride lourdement le rendu de l'iframe : requestAnimationFrame
          n'est servi qu'une fois puis s'arrête, et setInterval tombe à ~1 Hz.

     On combine donc les deux horloges — rAF quand il veut bien tourner,
     setInterval comme filet — et surtout le document reste lisible même si
     les deux s'arrêtent : le masquage n'est armé (classe .js-reveal) qu'une
     fois la boucle prouvée, et il est désarmé si elle meurt. */

  var root = document.documentElement;
  var armed = false;
  var ticks = 0;
  var lastOffset = null;
  var lastTickAt = 0;

  function offsetNow() {
    if (frame) {
      try { return frame.getBoundingClientRect().top; } catch (e) { return null; }
    }
    return -window.scrollY;
  }

  function arm() {
    // On masque le contenu seulement après avoir constaté que la boucle
    // tourne — sinon le document resterait invisible.
    if (armed || reduce) return;
    armed = true;
    root.classList.add("js-reveal");
    checkReveal();
  }

  function disarm() {
    // La boucle est morte : on rend tout visible plutôt que de laisser des
    // blocs à opacity 0.
    root.classList.remove("js-reveal");
    revealAll();
  }

  function pump() {
    ticks++;
    lastTickAt = Date.now();
    if (!armed && ticks >= 2) arm();
    var offset = offsetNow();
    if (offset !== lastOffset) {
      lastOffset = offset;
      if (armed) checkReveal();
      if (!reduce) updateRail();
    }
  }

  function rafLoop() {
    pump();
    if (pending.length || (rail && !reduce)) {
      window.requestAnimationFrame(rafLoop);
    }
  }

  function bind() {
    window.addEventListener("scroll", function () { lastOffset = null; pump(); }, { passive: true });
    window.addEventListener("resize", function () { lastOffset = null; pump(); }, { passive: true });
    window.requestAnimationFrame(rafLoop);
    // Filet : même bridé à ~1 Hz, cet intervalle garde la révélation vivante
    // quand rAF cesse d'être servi.
    var timer = window.setInterval(function () {
      pump();
      if (!pending.length && (!rail || reduce)) window.clearInterval(timer);
    }, 120);
    // Si aucune horloge n'a tourné après 2,5 s, on désarme : mieux vaut un
    // document sans animation qu'un document vide.
    window.setTimeout(function () {
      if (ticks < 2 || (armed && Date.now() - lastTickAt > 2000)) disarm();
    }, 2500);
  }

  /* ── Tooltips ───────────────────────────────────────────────────────── */

  function initTips() {
    var charts = document.querySelectorAll(".chart");
    Array.prototype.forEach.call(charts, function (chart) {
      var targets = chart.querySelectorAll("[data-tip]");
      if (!targets.length) return;

      var tip = document.createElement("div");
      tip.className = "tip";
      tip.setAttribute("role", "status");
      chart.appendChild(tip);

      function show(el) {
        var raw = el.getAttribute("data-tip") || "";
        var label = el.getAttribute("data-tip-label") || "";
        tip.innerHTML = (label ? "<s>" + label + "</s>" : "") + raw;
        var cb = chart.getBoundingClientRect();
        var rb = el.getBoundingClientRect();
        var x = rb.left - cb.left + rb.width / 2;
        var y = rb.top - cb.top;
        // On borne dans la boîte du graphique : un tooltip qui déborde
        // ferait grandir scrollHeight et relancerait le resize du parent.
        tip.style.left = Math.max(8, Math.min(cb.width - 8, x)) + "px";
        tip.style.top = Math.max(34, y - 8) + "px";
        tip.classList.add("on");
      }
      function hide() { tip.classList.remove("on"); }

      Array.prototype.forEach.call(targets, function (el) {
        el.addEventListener("mouseenter", function () { show(el); });
        el.addEventListener("mousemove", function () { show(el); });
        el.addEventListener("mouseleave", hide);
        // Clavier : le focus montre la même chose que le survol.
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
        el.addEventListener("focus", function () { show(el); });
        el.addEventListener("blur", hide);
      });
      chart.addEventListener("mouseleave", hide);
    });
  }

  /* ── Vue tableau (le jumeau accessible de chaque graphique) ──────────── */

  function initTableViews() {
    var btns = document.querySelectorAll(".tv__btn");
    Array.prototype.forEach.call(btns, function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      btn.addEventListener("click", function () {
        var open = panel.hasAttribute("hidden");
        if (open) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? btn.getAttribute("data-close") : btn.getAttribute("data-open");
      });
    });
  }

  /* ── Démarrage ──────────────────────────────────────────────────────── */

  function start() {
    initTips();
    initTableViews();
    if (reduce) { revealAll(); return; }
    if (!frame) {
      // Hors iframe : pas de bridage, on arme directement.
      root.classList.add("js-reveal");
      armed = true;
    }
    bind();
    // Quelques passages différés, le temps que le parent pose la hauteur
    // définitive de l'iframe avant qu'on mesure les positions.
    [60, 260, 700, 1600].forEach(function (t) { setTimeout(pump, t); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
`;
