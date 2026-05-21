/**
 * Mode édition admin pour les pages `raw_html` — injecté dans l'iframe
 * UNIQUEMENT lorsqu'un admin Speetch est connecté en parallèle du cookie de
 * gate scrypt du client.
 *
 * **Activation explicite** : le script est chargé mais reste *armed=false*
 * tant que le parent ne lui a pas envoyé `{ type: "speetch-edit-mode", active: true }`.
 * Tant qu'il n'est pas armé, aucun outline ni handler de clic — la page se
 * comporte comme côté client. Le parent contrôle l'activation via le bouton
 * « Éditer » (cf. `EditModeToggle`).
 *
 * UX (en mode armé) :
 * - Hover sur une <img> ou un élément texte → outline turquoise + tag
 *   « Modifier » bas-droite (uppercase tracking 0.32em, style Speetch).
 * - Clic → postMessage parent { type: "speetch-edit-select", … } avec :
 *   - kind: "image" | "text"
 *   - original_src (images) — l'attribut src ORIGINAL, lu depuis
 *     `data-speetch-original-src` posé par injectOriginalsMarker.
 *   - current_src (images) — la valeur visible (après application des
 *     image_overrides), pour générer la miniature côté parent.
 *   - text (textes) — le contenu trimmed du nœud texte cliqué (clé exacte
 *     attendue par le mécanisme `text_overrides`).
 *
 * Le parent transmet ensuite la sélection à l'assistant via un CustomEvent
 * `speetch:assistant-prompt` (cf. AdminAssistant) ou ouvre le picker
 * médiathèque (cf. `MediaPickerModal`).
 */

const EDIT_CSS = `
*[data-speetch-edit-hover] {
  outline: 2px solid rgba(110, 231, 183, 0.85) !important;
  outline-offset: -2px !important;
  cursor: pointer !important;
  position: relative !important;
}
.speetch-edit-tag {
  position: absolute;
  bottom: 4px;
  right: 4px;
  z-index: 2147483646;
  font: 500 9px/1 -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #0a0a0a;
  background: rgba(110, 231, 183, 0.92);
  padding: 4px 8px;
  border-radius: 2px;
  pointer-events: none;
  white-space: nowrap;
}
img[data-speetch-edit-hover] {
  /* outline-offset négatif aux images aussi pour matcher leur cadre */
  box-shadow: 0 0 0 2px rgba(110, 231, 183, 0.85);
  outline: none !important;
}
`;

const SCRIPT_BODY = `
(function() {
  if (window.__speetchEditModeActive) return;
  window.__speetchEditModeActive = true;

  var TAG_CLASS = 'speetch-edit-tag';
  var HOVER_ATTR = 'data-speetch-edit-hover';
  var TAG_NODE = null;
  var HOVER_NODE = null;
  /** Tant que ce flag est false, le script ne réagit ni au hover ni au clic. */
  var ARMED = false;

  function isSkippable(el) {
    if (!el || el.nodeType !== 1) return true;
    var tag = el.tagName;
    return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TITLE' ||
           tag === 'NOSCRIPT' || tag === 'HEAD' || tag === 'HTML' ||
           tag === 'BODY' || tag === 'MARK';
  }

  function isInsideAnnotation(el) {
    var n = el;
    while (n && n.nodeType === 1) {
      if (n.tagName === 'MARK' && n.classList && n.classList.contains('speetch-annotation')) {
        return true;
      }
      n = n.parentNode;
    }
    return false;
  }

  /**
   * Pour un élément donné, on cherche le « bloc » texte le plus proche :
   * - si l'élément contient UNIQUEMENT du texte (pas d'enfants élément),
   *   on prend l'élément lui-même.
   * - sinon, on remonte au plus petit ancêtre dont le textContent trimmed
   *   est identique au sien (= élément pur-texte enveloppé dans un parent).
   */
  function findTextBlock(el) {
    while (el && el.nodeType === 1) {
      if (isSkippable(el)) return null;
      var hasOnlyText = true;
      for (var i = 0; i < el.childNodes.length; i++) {
        var c = el.childNodes[i];
        if (c.nodeType === 1) {
          // Tolère <br>, <em>, <strong>, <a>, <span>, <mark>… s'ils ne contiennent
          // que du texte direct. Si l'enfant a lui-même des enfants éléments,
          // on n'est plus sur une feuille texte.
          var grandChildElements = 0;
          for (var j = 0; j < c.childNodes.length; j++) {
            if (c.childNodes[j].nodeType === 1) {
              grandChildElements += 1;
              break;
            }
          }
          if (grandChildElements > 0) {
            hasOnlyText = false;
            break;
          }
        }
      }
      if (hasOnlyText) {
        var t = (el.textContent || '').trim();
        if (t.length > 0 && t.length < 1500) return el;
      }
      el = el.parentNode;
    }
    return null;
  }

  function clearHover() {
    if (HOVER_NODE) {
      HOVER_NODE.removeAttribute(HOVER_ATTR);
      HOVER_NODE = null;
    }
    if (TAG_NODE && TAG_NODE.parentNode) {
      TAG_NODE.parentNode.removeChild(TAG_NODE);
    }
    TAG_NODE = null;
  }

  function setHover(node, label) {
    clearHover();
    HOVER_NODE = node;
    node.setAttribute(HOVER_ATTR, '');
    TAG_NODE = document.createElement('span');
    TAG_NODE.className = TAG_CLASS;
    TAG_NODE.textContent = label;
    // L'élément cible doit avoir un position non-static pour que le tag se
    // place dedans ; on s'assure de ça via le CSS (position: relative !important).
    node.appendChild(TAG_NODE);
  }

  /**
   * Renvoie une <img> empilée au point (x, y) si elle existe.
   * Utilisé pour traverser les overlays positionnés en absolute (cas
   * fréquent : overlays éditoriaux par-dessus une image publicitaire).
   * On itère du plus haut au plus bas et on ignore les <img> à
   * l'intérieur d'une annotation.
   */
  function findImgAtPoint(x, y) {
    if (typeof document.elementsFromPoint !== 'function') return null;
    try {
      var stack = document.elementsFromPoint(x, y);
      for (var i = 0; i < stack.length; i++) {
        var el = stack[i];
        if (el && el.tagName === 'IMG' && !isInsideAnnotation(el)) {
          return el;
        }
      }
    } catch (e) {
      /* swallow */
    }
    return null;
  }

  // Fallback quand elementsFromPoint ne retourne pas d'<img> — typiquement
  // parce que l'image est cassée (src relatif non résolu dans l'iframe
  // srcDoc) et a une bounding box nulle. On remonte alors le DOM depuis
  // target tant que le sous-arbre courant ne contient qu'une seule
  // <img> ; dès qu'on en trouve plusieurs (cas carrousel), on arrête
  // pour éviter de cibler une image arbitraire.
  function findImgNearTarget(target) {
    var n = target;
    var depth = 0;
    while (n && n.nodeType === 1 && depth < 8) {
      if (n.querySelectorAll) {
        var imgs = n.querySelectorAll('img');
        if (imgs.length === 1) {
          var img = imgs[0];
          if (!isInsideAnnotation(img)) return img;
          return null;
        }
        if (imgs.length > 1) return null;
      }
      n = n.parentNode;
      depth++;
    }
    return null;
  }

  function resolveImageTarget(target, x, y) {
    if (target && target.tagName === 'IMG' && !isInsideAnnotation(target)) {
      return target;
    }
    var img = findImgAtPoint(x, y);
    if (img) return img;
    return findImgNearTarget(target);
  }

  // Vrai si target est un nœud "feuille texte" — un élément qui contient
  // du texte direct et dont aucun descendant immédiat n'a lui-même
  // d'enfants éléments. Faux pour un container qui regroupe plusieurs
  // blocs (overlay éditorial, carrousel-card-overlay…). Permet de
  // distinguer un clic intentionnel sur du texte d'un clic sur un
  // container/overlay positionné par-dessus une image.
  function isDirectTextLeaf(target) {
    if (!target || target.nodeType !== 1) return false;
    if (isSkippable(target)) return false;
    if (target.tagName === 'IMG' || target.tagName === 'SVG') return false;
    for (var i = 0; i < target.childNodes.length; i++) {
      var c = target.childNodes[i];
      if (c.nodeType !== 1) continue;
      for (var j = 0; j < c.childNodes.length; j++) {
        if (c.childNodes[j].nodeType === 1) return false;
      }
    }
    var t = (target.textContent || '').trim();
    return t.length > 0 && t.length < 1500;
  }

  function onMouseMove(e) {
    if (!ARMED) return;
    var target = e.target;
    if (!target || target.nodeType !== 1) {
      clearHover();
      return;
    }
    if (isInsideAnnotation(target)) {
      clearHover();
      return;
    }
    // Si on est précisément sur un nœud feuille texte (<em>, <span>...,
    // pas un container), c'est un clic intentionnel sur texte → on
    // priorise la branche texte pour ne pas voler le clic au chatbot
    // d'édition. Sinon (target = container, overlay, ou élément vide),
    // on tente une <img> empilée puis fallback DOM-walk.
    if (isDirectTextLeaf(target)) {
      if (HOVER_NODE !== target) setHover(target, 'Modifier');
      return;
    }
    var imgUnder = resolveImageTarget(target, e.clientX, e.clientY);
    if (imgUnder) {
      if (HOVER_NODE !== imgUnder) setHover(imgUnder, 'Modifier');
      return;
    }
    var block = findTextBlock(target);
    if (block) {
      if (HOVER_NODE !== block) setHover(block, 'Modifier');
    } else {
      clearHover();
    }
  }

  function onMouseLeave() {
    clearHover();
  }

  function emit(payload) {
    try {
      parent.postMessage(payload, '*');
    } catch (e) {}
  }

  function onClick(e) {
    if (!ARMED) return;
    var target = e.target;
    if (!target || target.nodeType !== 1) return;
    if (isInsideAnnotation(target)) return;
    // Symétrique à onMouseMove : un clic direct sur un nœud feuille
    // texte ouvre le chatbot, pas le picker.
    if (isDirectTextLeaf(target)) {
      e.preventDefault();
      e.stopPropagation();
      var text = (target.textContent || '').trim();
      if (!text) return;
      emit({
        type: 'speetch-edit-select',
        kind: 'text',
        text: text,
      });
      return;
    }
    var imgUnder = resolveImageTarget(target, e.clientX, e.clientY);
    if (imgUnder) {
      e.preventDefault();
      e.stopPropagation();
      var originalSrc =
        imgUnder.getAttribute('data-speetch-original-src') ||
        imgUnder.getAttribute('src') || '';
      var currentSrc = imgUnder.getAttribute('src') || '';
      var alt = imgUnder.getAttribute('alt') || '';
      var imgId = imgUnder.getAttribute('data-speetch-img-id') || '';
      emit({
        type: 'speetch-edit-select',
        kind: 'image',
        original_src: originalSrc,
        current_src: currentSrc,
        alt: alt,
        img_id: imgId,
      });
      return;
    }
    var block = findTextBlock(target);
    if (block) {
      e.preventDefault();
      e.stopPropagation();
      var text = (block.textContent || '').trim();
      if (!text) return;
      emit({
        type: 'speetch-edit-select',
        kind: 'text',
        text: text,
      });
    }
  }

  function onParentMessage(e) {
    var d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'speetch-edit-mode') {
      ARMED = !!d.active;
      if (!ARMED) clearHover();
    }
  }

  function bootstrap() {
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mouseleave', onMouseLeave, true);
    document.addEventListener('click', onClick, true);
    window.addEventListener('message', onParentMessage);
    // Notifie le parent que le mode édition est chargé (mais désarmé).
    emit({ type: 'speetch-edit-ready' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
`;

const ORIGINAL_SRC_MARKER_SCRIPT = `
<script data-speetch-edit="originals">
(function() {
  // Compteur global incrémental — chaque <img> reçoit un id unique
  // dans l'ordre du document. Idempotent : si une img a déjà un id,
  // on le préserve (utile au re-render). Les imgs ajoutées dynamiquement
  // après le DOMContentLoaded continuent la numérotation.
  var IMG_COUNTER = 0;
  function tagImg(img) {
    if (!img.hasAttribute('data-speetch-original-src')) {
      img.setAttribute('data-speetch-original-src', img.getAttribute('src') || '');
    }
    if (!img.hasAttribute('data-speetch-img-id')) {
      img.setAttribute('data-speetch-img-id', String(IMG_COUNTER));
      IMG_COUNTER++;
    }
  }
  function tagAll(root) {
    if (!root) return;
    if (root.nodeType !== 1) return;
    if (root.tagName === 'IMG') tagImg(root);
    if (root.querySelectorAll) {
      var imgs = root.querySelectorAll('img');
      Array.prototype.forEach.call(imgs, tagImg);
    }
  }
  function init() {
    tagAll(document.body || document.documentElement);
    // Les pages "raw_html" peuvent injecter des <img> après DOMContentLoaded
    // (système d'onglets "directions", lazy mount, animations…). On tag
    // chaque nouvel <img> dès son insertion, de sorte que le mode édition
    // admin retrouve toujours le src d'origine via data-speetch-original-src.
    try {
      var obs = new MutationObserver(function(records) {
        for (var i = 0; i < records.length; i++) {
          var added = records[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            tagAll(added[j]);
          }
        }
      });
      obs.observe(document.body || document.documentElement, {
        subtree: true,
        childList: true,
      });
    } catch (e) {
      /* swallow */
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>`;

/**
 * Renvoie le `<style>` + `<script>` du mode édition admin, à injecter
 * juste avant </body>. À n'utiliser QUE quand un admin Supabase est
 * connecté en parallèle du cookie de gate scrypt.
 */
export function buildEditModeBundle(): string {
  const escapedCss = EDIT_CSS.replace(/<\/style/gi, "<\\/style");
  const escapedJs = SCRIPT_BODY.replace(/<\/script/gi, "<\\/script");
  return `
<style data-speetch-edit="true">${escapedCss}</style>
<script data-speetch-edit="true">${escapedJs}</script>`;
}

/**
 * Tag chaque <img> avec son src d'origine (`data-speetch-original-src`) AVANT
 * que les image_overrides n'aient l'occasion de remplacer le src. Idempotent.
 * À injecter en HEAD ou en début de body pour s'exécuter tôt.
 */
export function injectOriginalsMarker(html: string): string {
  // Place le marker tout de suite après l'ouverture du body s'il existe,
  // sinon en tête de document.
  const lower = html.toLowerCase();
  const idx = lower.indexOf("<body");
  if (idx >= 0) {
    const after = lower.indexOf(">", idx);
    if (after >= 0) {
      return (
        html.slice(0, after + 1) +
        ORIGINAL_SRC_MARKER_SCRIPT +
        html.slice(after + 1)
      );
    }
  }
  return ORIGINAL_SRC_MARKER_SCRIPT + html;
}

export function injectEditModeBundle(html: string): string {
  const bundle = buildEditModeBundle();
  const idx = html.toLowerCase().lastIndexOf("</body>");
  if (idx >= 0) {
    return html.slice(0, idx) + bundle + html.slice(idx);
  }
  return html + bundle;
}
