"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Hairline } from "@/lib/ds";
import { SPEETCH_OVERLAY_CSS } from "@/lib/speetch-overlay-css";
import { PagesDropdown, type PageNavItem } from "./pages-dropdown";
import {
  AnnotationsOverlay,
  type AnnotationData,
} from "./_annotations/annotations-overlay";
import { injectAnnotationsBundle } from "./_annotations/iframe-script";
import {
  injectEditModeBundle,
  injectOriginalsMarker,
} from "@/lib/admin/edit-mode-script";
import {
  MediaPickerModal,
  type ImagePickerTarget,
} from "@/app/clients/[slug]/_admin/media-picker-modal";

/**
 * Rendu "raw HTML" — utilisé pour les pages dont content.meta.style = "raw_html".
 * Le HTML d'origine est injecté tel quel dans un iframe sandbox, ce qui
 * préserve 100% de la mise en page (styles inline, tables, grilles, JS UI…).
 *
 * Sandbox : `allow-scripts allow-same-origin`. Le JS est nécessaire pour les
 * UIs interactives (onglets, accordéons, animations) typiques des documents
 * uploadés. La combinaison `scripts + same-origin` est ≈ équivalente à pas
 * de sandbox côté spec : c'est assumé car SEUL l'owner uploade du HTML, et
 * il fait confiance à son propre contenu. Le client final (qui visualise) ne
 * peut pas injecter de HTML. On garde le sandbox pour bloquer la navigation
 * top-level et les form submits.
 *
 * Auto-hauteur : on observe `document.body.scrollHeight` via un MutationObserver
 * dans l'iframe (injecté en post-load) puis on remonte la hauteur au parent
 * pour que l'iframe ne génère pas de scroll interne. Tombe en fallback sur
 * une hauteur min de 80vh si la mesure échoue.
 */
export function RawHtmlPageView({
  clientSlug,
  clientName,
  projectSlug,
  projectName,
  pageName,
  pageSlug,
  pageId,
  rawHtml,
  textOverrides,
  imageOverrides,
  imageOverridesById,
  applySpeetchDs,
  pages,
  initialAnnotations,
}: {
  clientSlug: string;
  clientName: string;
  projectSlug: string;
  projectName: string;
  pageName: string;
  pageSlug: string;
  pageId: string;
  rawHtml: string;
  textOverrides?: Record<string, string>;
  imageOverrides?: Record<string, string>;
  imageOverridesById?: Record<string, string>;
  applySpeetchDs?: boolean;
  pages: PageNavItem[];
  initialAnnotations: AnnotationData[];
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<ImagePickerTarget | null>(
    null,
  );

  // Détecte le flag posé par AdminEditModeFlag (layout) au montage et sur
  // changement (admin se logge/déconnecte → le flag bouge).
  useEffect(() => {
    const root = document.documentElement;
    const check = () => setIsAdmin(root.dataset.speetchAdmin === "true");
    check();
    const obs = new MutationObserver(check);
    obs.observe(root, { attributes: true, attributeFilter: ["data-speetch-admin"] });
    return () => obs.disconnect();
  }, []);

  // Écoute le toggle « Éditer » du layout et forward à l'iframe.
  useEffect(() => {
    function onToggle(e: Event) {
      const detail = (e as CustomEvent<{ active?: boolean }>).detail;
      setEditMode(Boolean(detail?.active));
    }
    window.addEventListener("speetch:edit-mode", onToggle);
    // État initial : lit le flag root au montage (utile si l'iframe est
    // monté APRÈS un toggle déjà actif).
    setEditMode(document.documentElement.dataset.speetchEditMode === "true");
    return () => window.removeEventListener("speetch:edit-mode", onToggle);
  }, []);

  // Forward l'état edit-mode à l'iframe via postMessage à chaque changement
  // (et au load de l'iframe si on est déjà actif).
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const post = () => {
      iframe.contentWindow?.postMessage(
        { type: "speetch-edit-mode", active: editMode },
        "*",
      );
    };
    post();
  }, [editMode]);

  const srcDoc = useMemo(() => {
    // Marker du src d'origine ET de l'id (index DOM) pour TOUS les <img>.
    // Doit tourner avant les overrides et avant le mode édition pour que
    // ce dernier connaisse l'id exact à utiliser dans `image_overrides_by_id`.
    // En mode public (non-admin), on tag aussi pour que `image_overrides_by_id`
    // puisse cibler par index.
    let result = injectOriginalsMarker(rawHtml);
    result = injectOverridesScript(
      result,
      textOverrides,
      imageOverrides,
      imageOverridesById,
    );
    if (applySpeetchDs) {
      result = injectSpeetchOverlay(result);
    }
    result = injectExternalLinksScript(result);
    result = injectAnnotationsBundle(result);
    if (isAdmin) {
      result = injectEditModeBundle(result);
    }
    return result;
  }, [rawHtml, textOverrides, imageOverrides, imageOverridesById, applySpeetchDs, isAdmin]);

  // Reçoit les demandes d'ouverture de lien depuis l'iframe (cf.
  // injectExternalLinksScript) et ouvre dans un nouvel onglet depuis
  // le parent.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as
        | {
            type?: string;
            href?: string;
            kind?: "image" | "text";
            original_src?: string;
            current_src?: string;
            alt?: string;
            text?: string;
            img_id?: string;
          }
        | null;
      if (!data) return;

      if (data.type === "speetch-open-link" && data.href) {
        const href = String(data.href);
        const lower = href.toLowerCase();
        if (lower.startsWith("javascript:")) return;
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }

      // L'iframe vient de booter son edit-mode script (mais désarmé) :
      // on lui renvoie l'état courant pour qu'il s'arme si déjà ON.
      if (data.type === "speetch-edit-ready") {
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "speetch-edit-mode",
            active:
              document.documentElement.dataset.speetchEditMode === "true",
          },
          "*",
        );
        return;
      }

      // Sélection admin depuis le mode édition de l'iframe.
      if (data.type === "speetch-edit-select" && data.kind) {
        if (data.kind === "image") {
          // Click sur une image → ouvre directement le picker médiathèque
          // (UX rapide pour tester des formats publicitaires).
          setPickerTarget({
            clientSlug,
            pageId,
            pageName,
            originalSrc: data.original_src ?? "",
            currentSrc: data.current_src ?? "",
            alt: data.alt ?? "",
            imgId: data.img_id ?? "",
          });
        } else {
          // Click sur un texte → passe par le chatbot (réécriture éditoriale).
          window.dispatchEvent(
            new CustomEvent("speetch:assistant-prompt", {
              detail: {
                kind: "text",
                page_kind: "raw_html",
                page_id: pageId,
                page_name: pageName,
                project_slug: projectSlug,
                project_name: projectName,
                original_text: data.text ?? "",
              },
            }),
          );
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [clientSlug, pageId, pageName, projectName, projectSlug]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function measure() {
      try {
        const doc = iframe?.contentDocument;
        if (!doc) return;
        const body = doc.body;
        const html = doc.documentElement;
        const next = Math.max(
          body?.scrollHeight ?? 0,
          body?.offsetHeight ?? 0,
          html?.scrollHeight ?? 0,
          html?.offsetHeight ?? 0,
        );
        if (next > 0) {
          setHeight(next);
        }
      } catch {
        // Cross-origin guard — ne devrait pas arriver avec allow-same-origin
        // sur srcDoc, mais on capture par sécurité.
      }
    }

    function onLoad() {
      measure();
      try {
        const doc = iframe?.contentDocument;
        if (!doc) return;
        const observer = new MutationObserver(() => measure());
        observer.observe(doc.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
        // Quelques re-mesures espacées pour rattraper le chargement async
        // (fonts Google, images).
        const timers: number[] = [
          window.setTimeout(measure, 250),
          window.setTimeout(measure, 750),
          window.setTimeout(measure, 1500),
          window.setTimeout(measure, 3000),
        ];

        // Cleanup au cas où le composant unmount
        iframe.addEventListener(
          "beforeunload",
          () => {
            observer.disconnect();
            timers.forEach((t) => window.clearTimeout(t));
          },
          { once: true },
        );
      } catch {
        // ignore
      }
    }

    iframe.addEventListener("load", onLoad);
    // Si l'iframe est déjà chargé (srcDoc sync), force un measure
    if (iframe.contentDocument?.readyState === "complete") {
      onLoad();
    }

    return () => {
      iframe.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div className="relative min-h-svh w-full bg-[#0a0a0a]">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-6 border-b border-white/5 bg-black/65 px-6 py-5 backdrop-blur-md md:px-12">
        <Link
          href={`/clients/${clientSlug}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          <Hairline width="md" hover="lg" />
          <span>{clientName}</span>
        </Link>
        <span className="hidden text-[11px] uppercase tracking-[0.28em] text-white/40 md:inline">
          {projectName}
          <span className="mx-3 text-white/20">·</span>
          {pageName}
        </span>
        <PagesDropdown
          clientSlug={clientSlug}
          projectSlug={projectSlug}
          currentSlug={pageSlug}
          pages={pages}
        />
      </header>

      {/* Document */}
      <div className="w-full">
        <iframe
          ref={iframeRef}
          title={pageName}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          loading="lazy"
          style={{
            width: "100%",
            height: height > 0 ? `${height}px` : "80vh",
            border: "none",
            background: "white",
            display: "block",
          }}
        />
        <AnnotationsOverlay
          clientSlug={clientSlug}
          targetKind="page"
          targetId={pageId}
          iframeRef={iframeRef}
          initialAnnotations={initialAnnotations}
        />
      </div>

      {/* Footer */}
      <footer className="flex items-end justify-between border-t border-white/5 bg-black px-6 py-8 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Paris · 2026</span>
        <span>Speetch · Confidentiel</span>
      </footer>

      {/* Picker médiathèque admin — ouvert au clic sur une image de l'iframe */}
      {isAdmin && (
        <MediaPickerModal
          target={pickerTarget}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}

/**
 * Injecte un <script> avant </body> qui applique les overrides texte/image
 * au DOMContentLoaded de l'iframe. Si aucun override n'est défini, renvoie
 * le HTML tel quel.
 *
 * Sécurité : on encode les maps via JSON.stringify + escape de </script.
 * Le script tourne dans l'iframe, qui a `allow-scripts allow-same-origin`.
 */
function injectOverridesScript(
  html: string,
  textOverrides: Record<string, string> | undefined,
  imageOverrides: Record<string, string> | undefined,
  imageOverridesById: Record<string, string> | undefined,
): string {
  const texts = textOverrides ?? {};
  const images = imageOverrides ?? {};
  const imagesById = imageOverridesById ?? {};
  // On injecte toujours le script : même sans override, il pose un
  // placeholder neutre sur les <img> au src cassé (chemins relatifs non
  // résolus dans srcDoc).

  const escape = (obj: Record<string, string>) =>
    JSON.stringify(obj).replace(/<\/script/gi, "<\\/script");

  const script = `
<script>
(function() {
  try {
    var TEXTS = ${escape(texts)};
    var IMAGES = ${escape(images)};
    var IMAGES_BY_ID = ${escape(imagesById)};

    // Optimisation AVIF/WebP via /_next/image.
    // On garde l'URL Supabase brute dans le payload (BDD) et on la
    // transforme côté client en URL /_next/image?w=<deviceSize>&q=75
    // calée sur la dimension d'affichage réelle de chaque <img>.
    // L'iframe srcDoc a allow-same-origin → on peut lire l'origin du parent.
    var ORIGIN = '';
    try { ORIGIN = window.parent && window.parent.location && window.parent.location.origin || ''; } catch (e) {}
    var DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

    // Placeholder pour les <img> dont le src ne résout pas (chemins
    // relatifs cassés dans l'iframe srcDoc). SVG 80×80 blanc avec une
    // icône d'image au centre. preserveAspectRatio=xMidYMid meet pour
    // s'adapter au container.
    var PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80' preserveAspectRatio='xMidYMid meet'><rect width='80' height='80' fill='%23ffffff'/><g stroke='%23bdbdbd' stroke-width='1.4' fill='none' stroke-linecap='round' stroke-linejoin='round'><rect x='22' y='26' width='36' height='28' rx='1.5'/><circle cx='32' cy='35.5' r='2.8' fill='%23bdbdbd' stroke='none'/><path d='M24 50 L34 40 L42 48 L50 40 L56 46'/></g></svg>";

    function optimizedUrl(url, img) {
      if (!url) return url;
      // Skip si déjà optimisé, non-http, ou si on n'a pas d'origin.
      if (url.indexOf('/_next/image') !== -1) return url;
      if (!/^https?:\\/\\//i.test(url)) return url;
      if (!ORIGIN) return url;
      var width = 0;
      if (img) {
        if (img.parentElement) {
          width = img.parentElement.getBoundingClientRect().width;
        }
        if (!width) width = img.getBoundingClientRect().width;
      }
      if (!width || width < 1) width = 1080;
      var dpr = window.devicePixelRatio || 1;
      var target = Math.ceil(width * dpr);
      var w = 0;
      for (var i = 0; i < DEVICE_SIZES.length; i++) {
        if (DEVICE_SIZES[i] >= target) { w = DEVICE_SIZES[i]; break; }
      }
      if (!w) w = DEVICE_SIZES[DEVICE_SIZES.length - 1];
      return ORIGIN + '/_next/image?url=' + encodeURIComponent(url) + '&w=' + w + '&q=75';
    }

    function applyTexts() {
      if (!Object.keys(TEXTS).length) return;
      var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
          var p = node.parentNode;
          while (p) {
            if (p.nodeType === 1) {
              var t = p.tagName;
              if (t === 'SCRIPT' || t === 'STYLE' || t === 'TITLE') return NodeFilter.FILTER_REJECT;
            }
            p = p.parentNode;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      var nodes = [];
      var n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function(node) {
        var raw = node.nodeValue || '';
        var trimmed = raw.trim();
        if (!trimmed) return;
        if (Object.prototype.hasOwnProperty.call(TEXTS, trimmed)) {
          var lead = (raw.match(/^\\s*/) || [''])[0];
          var trail = (raw.match(/\\s*$/) || [''])[0];
          node.nodeValue = lead + TEXTS[trimmed] + trail;
        }
      });
    }

    function applyImageEl(img) {
      if (!img || img.nodeType !== 1 || img.tagName !== 'IMG') return;
      var src = img.getAttribute('src') || '';
      // Priorité 1 : override par img_id (cible une instance précise).
      var imgId = img.getAttribute('data-speetch-img-id') || '';
      if (imgId && Object.prototype.hasOwnProperty.call(IMAGES_BY_ID, imgId)) {
        var byId = optimizedUrl(IMAGES_BY_ID[imgId], img);
        if (byId && src !== byId) {
          img.setAttribute('src', byId);
          if (img.hasAttribute('srcset')) img.removeAttribute('srcset');
        }
        return;
      }
      // Priorité 2 : override par src d'origine (legacy, affecte toutes
      // les <img> ayant ce src).
      var orig = img.getAttribute('data-speetch-original-src') || '';
      var rawTarget = null;
      if (src && Object.prototype.hasOwnProperty.call(IMAGES, src)) {
        rawTarget = IMAGES[src];
      } else if (orig && Object.prototype.hasOwnProperty.call(IMAGES, orig)) {
        rawTarget = IMAGES[orig];
      }
      if (rawTarget) {
        var target = optimizedUrl(rawTarget, img);
        if (target && src !== target) {
          img.setAttribute('src', target);
          if (img.hasAttribute('srcset')) img.removeAttribute('srcset');
        }
        return;
      }
      // Aucun override : si le src n'est ni une URL absolue (http/data),
      // l'image est cassée (chemin relatif non résolu dans srcDoc).
      // On affiche un placeholder neutre — le data-speetch-original-src
      // et data-speetch-img-id restent intacts pour permettre à l'admin
      // de cliquer dessus et poser un override.
      if (!/^(https?:|data:)/i.test(src)) {
        if (src !== PLACEHOLDER) {
          img.setAttribute('src', PLACEHOLDER);
          if (img.hasAttribute('srcset')) img.removeAttribute('srcset');
        }
      }
    }

    function applyImagesInTree(root) {
      if (!root || root.nodeType !== 1) return;
      if (root.tagName === 'IMG') applyImageEl(root);
      if (root.querySelectorAll) {
        var imgs = root.querySelectorAll('img');
        Array.prototype.forEach.call(imgs, applyImageEl);
      }
    }

    function applyImages() {
      // Tourne systématiquement : même sans override, on doit pouvoir
      // poser le placeholder sur les <img> au src cassé.
      applyImagesInTree(document.body || document.documentElement);
    }

    // Réapplique les image_overrides aux <img> ajoutées après DOMContentLoaded
    // (système d'onglets "directions", lazy mount…) ainsi qu'aux <img>
    // existantes dont le src est remplacé dynamiquement par le JS d'origine.
    function watchImages() {
      // Idem : on observe systématiquement, même sans override, pour
      // attraper les nouvelles <img> ajoutées dynamiquement.
      try {
        var obs = new MutationObserver(function(records) {
          for (var i = 0; i < records.length; i++) {
            var r = records[i];
            if (r.type === 'childList') {
              for (var j = 0; j < r.addedNodes.length; j++) {
                applyImagesInTree(r.addedNodes[j]);
              }
            } else if (r.type === 'attributes' && r.target && r.target.tagName === 'IMG') {
              applyImageEl(r.target);
            }
          }
        });
        obs.observe(document.body || document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['src'],
        });
      } catch (e) {
        /* swallow */
      }
    }

    function run() {
      applyTexts();
      applyImages();
      watchImages();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  } catch (e) {
    console.error('[speetch-overrides] error:', e);
  }
})();
</script>`;

  // Injecte avant </body> (ou en fin si pas trouvé)
  const idx = html.toLowerCase().lastIndexOf("</body>");
  if (idx >= 0) {
    return html.slice(0, idx) + script + html.slice(idx);
  }
  return html + script;
}

/**
 * Intercepte les clics sur les liens dans l'iframe et délègue
 * l'ouverture au parent via postMessage. Sans cette interception, un
 * clic sur un <a> navigue l'iframe elle-même → page blanche.
 */
function injectExternalLinksScript(html: string): string {
  const script = `
<script data-speetch-external-links="true">
(function() {
  try {
    document.addEventListener('click', function(e) {
      var node = e.target;
      var a = null;
      while (node && node.nodeType === 1) {
        if (node.tagName === 'A') { a = node; break; }
        node = node.parentNode;
      }
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (!href) return;
      if (href.charAt(0) === '#') return;
      var lower = href.toLowerCase();
      if (lower.indexOf('javascript:') === 0) return;
      if (lower.indexOf('mailto:') === 0 || lower.indexOf('tel:') === 0) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        parent.postMessage({ type: 'speetch-open-link', href: href }, '*');
      } catch (err) {
        try { window.open(href, '_blank', 'noopener,noreferrer'); } catch (e2) {}
      }
    }, true);
  } catch (e) {
    /* swallow */
  }
})();
</script>`;
  const idx = html.toLowerCase().lastIndexOf("</body>");
  if (idx >= 0) {
    return html.slice(0, idx) + script + html.slice(idx);
  }
  return html + script;
}

/**
 * Injecte la feuille de style Speetch en toute fin de <head> pour outre-passer
 * le CSS source. Même logique que le viewer admin — partage la constante
 * SPEETCH_OVERLAY_CSS définie dans lib/.
 */
function injectSpeetchOverlay(html: string): string {
  const escaped = SPEETCH_OVERLAY_CSS.replace(/<\/style/gi, "<\\/style");
  const styleBlock = `\n<style data-speetch-overlay="true">\n${escaped}\n</style>\n`;
  const headCloseIdx = html.toLowerCase().lastIndexOf("</head>");
  if (headCloseIdx >= 0) {
    return html.slice(0, headCloseIdx) + styleBlock + html.slice(headCloseIdx);
  }
  const bodyOpenIdx = html.toLowerCase().indexOf("<body");
  if (bodyOpenIdx >= 0) {
    const bodyTagEnd = html.indexOf(">", bodyOpenIdx);
    if (bodyTagEnd >= 0) {
      return (
        html.slice(0, bodyTagEnd + 1) +
        styleBlock +
        html.slice(bodyTagEnd + 1)
      );
    }
  }
  return styleBlock + html;
}
