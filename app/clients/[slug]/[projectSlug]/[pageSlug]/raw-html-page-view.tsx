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
    // Marker du src d'origine pour TOUS les <img> — doit tourner avant les
    // overrides et avant le mode édition pour que ce dernier connaisse la clé
    // exacte à utiliser dans `image_overrides`.
    let result = isAdmin ? injectOriginalsMarker(rawHtml) : rawHtml;
    result = injectOverridesScript(result, textOverrides, imageOverrides);
    if (applySpeetchDs) {
      result = injectSpeetchOverlay(result);
    }
    result = injectExternalLinksScript(result);
    result = injectAnnotationsBundle(result);
    if (isAdmin) {
      result = injectEditModeBundle(result);
    }
    return result;
  }, [rawHtml, textOverrides, imageOverrides, applySpeetchDs, isAdmin]);

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
): string {
  const texts = textOverrides ?? {};
  const images = imageOverrides ?? {};
  if (Object.keys(texts).length === 0 && Object.keys(images).length === 0) {
    return html;
  }

  const escape = (obj: Record<string, string>) =>
    JSON.stringify(obj).replace(/<\/script/gi, "<\\/script");

  const script = `
<script>
(function() {
  try {
    var TEXTS = ${escape(texts)};
    var IMAGES = ${escape(images)};

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

    function applyImages() {
      if (!Object.keys(IMAGES).length) return;
      var imgs = document.querySelectorAll('img');
      Array.prototype.forEach.call(imgs, function(img) {
        var src = img.getAttribute('src');
        if (src && Object.prototype.hasOwnProperty.call(IMAGES, src)) {
          img.setAttribute('src', IMAGES[src]);
          // Recharge srcset si présent (sinon le browser garde l'ancienne)
          if (img.hasAttribute('srcset')) img.removeAttribute('srcset');
        }
      });
    }

    function run() {
      applyTexts();
      applyImages();
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
