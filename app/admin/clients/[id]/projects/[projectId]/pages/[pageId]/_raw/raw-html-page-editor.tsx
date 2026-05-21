"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Page, PageContent } from "@/types/database";
import { Button, ConfirmDialog, Eyebrow, StatusBadge } from "@/lib/ds";
import { AutosaveField, type AutosaveResult } from "../autosave-input";
import {
  deletePage,
  updatePageName,
  updatePagePublished,
} from "../actions";
import { saveRawHtmlOverrides } from "./actions";
import { MediaLibraryModal } from "./media-library-modal";
import { DirectionsEditor } from "./directions-editor";
import {
  deepClone,
  extractTopLevelObjects,
  findTabsObject,
  replaceInHtml,
  type LeafField,
} from "./named-object";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

type DetectedImage = {
  src: string;
  alt: string;
  count: number;
};

type ParsedContent = {
  textsOrdered: string[]; // textes uniques dans l'ordre d'apparition
  textCounts: Map<string, number>;
  images: DetectedImage[];
};

// Patterns à exclure de la détection (textes dynamiques type compteurs JS)
const COUNTER_PATTERN = /^\s*\d+\s*[\/\-–—]\s*\d+\s*$/;
// Attributs/classes parentes qui trahissent un nœud dynamique
const DYNAMIC_PARENT_ATTRS = ["data-counter", "data-count", "data-timer"];
const DYNAMIC_CLASS_HINTS = /\b(counter|compteur|char-count|live-count|timer|countdown|word-count|status-text)\b/i;
const DYNAMIC_ID_HINTS = /\b(counter|compteur|countdown|timer|live-count)\b/i;

function hasDynamicAncestor(node: Node): boolean {
  let p: Node | null = node.parentNode;
  while (p) {
    if (p.nodeType === 1) {
      const el = p as Element;
      if (el.hasAttribute("aria-live")) return true;
      if (el.getAttribute("role") === "status") return true;
      for (const attr of DYNAMIC_PARENT_ATTRS) {
        if (el.hasAttribute(attr)) return true;
      }
      const cls = el.getAttribute("class");
      if (cls && DYNAMIC_CLASS_HINTS.test(cls)) return true;
      const id = el.getAttribute("id");
      if (id && DYNAMIC_ID_HINTS.test(id)) return true;
    }
    p = p.parentNode;
  }
  return false;
}

/**
 * Parse le HTML brut côté client et extrait :
 *  - les textes uniques (set des nœuds texte non-vides hors script/style/title)
 *  - les images uniques (par attribut src) avec leur alt et leur fréquence
 *
 * Filtres anti-bruit :
 *  - rejet des fragments numériques courts (chiffres isolés)
 *  - rejet des compteurs "N / M" (texte mis à jour dynamiquement par JS)
 *  - rejet si un ancêtre a des hints `counter` / `aria-live` / `role=status`
 */
function parseRawHtml(html: string): ParsedContent {
  const textCounts = new Map<string, number>();
  const textsOrdered: string[] = [];
  const imageCounts = new Map<string, DetectedImage>();

  if (typeof DOMParser === "undefined") {
    return { textsOrdered, textCounts, images: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Walk text nodes
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      let p: Node | null = node.parentNode;
      while (p) {
        if (p.nodeType === 1) {
          const tag = (p as Element).tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "TITLE") {
            return NodeFilter.FILTER_REJECT;
          }
        }
        p = p.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let n: Node | null;
  // eslint-disable-next-line no-cond-assign
  while ((n = walker.nextNode())) {
    const raw = n.nodeValue ?? "";
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length < 2) continue;
    // Ignore les fragments numériques courts (chiffres isolés)
    if (/^[0-9\s.,€%–-]+$/.test(trimmed) && trimmed.length < 6) continue;
    // Ignore les compteurs "N / M" (caractères restants, X sur Y…)
    if (COUNTER_PATTERN.test(trimmed)) continue;
    // Ignore si un ancêtre signale du contenu dynamique
    if (hasDynamicAncestor(n)) continue;

    if (!textCounts.has(trimmed)) {
      textsOrdered.push(trimmed);
      textCounts.set(trimmed, 1);
    } else {
      textCounts.set(trimmed, (textCounts.get(trimmed) ?? 0) + 1);
    }
  }

  // Walk images
  const imgs = Array.from(doc.querySelectorAll("img"));
  for (const img of imgs) {
    const src = img.getAttribute("src");
    if (!src) continue;
    if (src.startsWith("data:")) continue; // skip inline data URIs
    const existing = imageCounts.get(src);
    if (existing) {
      existing.count += 1;
    } else {
      imageCounts.set(src, {
        src,
        alt: img.getAttribute("alt") ?? "",
        count: 1,
      });
    }
  }

  return {
    textsOrdered,
    textCounts,
    images: Array.from(imageCounts.values()),
  };
}

export function RawHtmlPageEditor({
  initialPage,
  clientId,
  projectId,
  projectName,
  clientName,
  publicHref,
}: {
  initialPage: Page;
  clientId: string;
  projectId: string;
  projectName: string;
  clientName: string;
  publicHref: string | null;
}) {
  const [page, setPage] = useState<Page>(initialPage);
  const content = (page.content as PageContent) ?? {};
  const rawHtml = content.meta?.raw_html ?? "";

  const [textOverrides, setTextOverrides] = useState<Record<string, string>>(
    () => ({ ...(content.meta?.text_overrides ?? {}) }),
  );
  const [imageOverrides, setImageOverrides] = useState<Record<string, string>>(
    () => ({ ...(content.meta?.image_overrides ?? {}) }),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // Target unifiée pour la modale médiathèque : soit un override d'image statique,
  // soit un champ image dans l'objet directions.
  type MediaTarget =
    | { kind: "static"; originalSrc: string }
    | { kind: "directions"; tabId: string; path: string };
  const [mediaTarget, setMediaTarget] = useState<MediaTarget | null>(null);

  // Détection de l'objet "tabs" (const DIRECTIONS = {1:..., 2:..., 3:...})
  // sur le HTML d'origine — on garde sa position d'origine pour pouvoir
  // réinjecter le résultat à la sauvegarde.
  const tabsExtracted = useMemo(() => {
    const candidates = extractTopLevelObjects(rawHtml);
    return findTabsObject(candidates);
  }, [rawHtml]);

  // Working copy de la data des directions (mutable au gré des edits)
  const [directionsData, setDirectionsData] = useState<Record<
    string,
    Record<string, unknown>
  > | null>(() =>
    tabsExtracted
      ? (deepClone(tabsExtracted.value) as Record<string, Record<string, unknown>>)
      : null,
  );

  // Labels des onglets : on tente de récupérer le texte des boutons
  // role="tab" du HTML (data-dir matchant les clés). Sinon fallback "Direction N".
  const tabLabels = useMemo(() => {
    if (!tabsExtracted || !directionsData) return [];
    const ids = Object.keys(directionsData);
    if (typeof DOMParser === "undefined") {
      return ids.map((id) => ({ id, label: `Direction ${id}` }));
    }
    const doc = new DOMParser().parseFromString(rawHtml, "text/html");
    return ids.map((id) => {
      const btn = doc.querySelector(`[role="tab"][data-dir="${id}"]`);
      let label = btn?.textContent?.trim() ?? "";
      // Nettoie un éventuel préfixe numérique du label ("01 Avant les mots" → "Avant les mots")
      label = label.replace(/^\s*\d{1,3}\s+/, "").trim();
      return { id, label: label || `Direction ${id}` };
    });
  }, [tabsExtracted, directionsData, rawHtml]);

  const parsed = useMemo(() => parseRawHtml(rawHtml), [rawHtml]);

  // Si un objet directions a été détecté, on collecte toutes les chaînes
  // qu'il contient (récursivement) pour les EXCLURE de la liste des
  // "Textes statiques". Sinon l'utilisateur verrait le texte de direction 1
  // affiché en double (DOM statique + onglet direction).
  const directionsTextSet = useMemo(() => {
    const set = new Set<string>();
    if (!directionsData) return set;
    function collect(value: unknown) {
      if (value === null || value === undefined) return;
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) set.add(trimmed);
        // Le DOM rendu retire souvent les tags HTML → on ajoute aussi la version
        // sans balises pour matcher les textes "à plat".
        const stripped = value.replace(/<[^>]+>/g, "").trim();
        if (stripped && stripped !== trimmed) set.add(stripped);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }
      if (typeof value === "object") {
        Object.values(value).forEach(collect);
      }
    }
    collect(directionsData);
    return set;
  }, [directionsData]);

  const staticTexts = useMemo(
    () => parsed.textsOrdered.filter((t) => !directionsTextSet.has(t)),
    [parsed.textsOrdered, directionsTextSet],
  );

  const directionsImageSet = useMemo(() => {
    const set = new Set<string>();
    if (!directionsData) return set;
    function collect(value: unknown) {
      if (typeof value === "string") {
        if (/\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(value)) set.add(value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }
      if (value && typeof value === "object") {
        Object.values(value).forEach(collect);
      }
    }
    collect(directionsData);
    return set;
  }, [directionsData]);

  const staticImages = useMemo(
    () => parsed.images.filter((img) => !directionsImageSet.has(img.src)),
    [parsed.images, directionsImageSet],
  );

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(false), 2000);
    return () => window.clearTimeout(t);
  }, [success]);

  async function saveName(name: string): Promise<AutosaveResult> {
    const result = await updatePageName({
      profileId: clientId,
      projectId,
      pageId: page.id,
      name,
    });
    if (result.ok) setPage((p) => ({ ...p, name }));
    return result;
  }

  function togglePublish() {
    const next = !page.is_published;
    setError(null);
    startTransition(async () => {
      const result = await updatePagePublished({
        profileId: clientId,
        projectId,
        pageId: page.id,
        isPublished: next,
      });
      if (result.ok) {
        setPage((p) => ({ ...p, is_published: next }));
      } else {
        setError(result.error);
      }
    });
  }

  function confirmDeletePage() {
    startTransition(async () => {
      await deletePage({
        profileId: clientId,
        projectId,
        pageId: page.id,
      });
    });
  }

  function handleTextChange(original: string, value: string) {
    setTextOverrides((prev) => {
      const next = { ...prev };
      if (value.trim() === "" || value === original) {
        delete next[original];
      } else {
        next[original] = value;
      }
      return next;
    });
  }

  function handleImageSelect(originalSrc: string, newUrl: string) {
    setImageOverrides((prev) => {
      const next = { ...prev };
      if (newUrl === originalSrc || newUrl === "") {
        delete next[originalSrc];
      } else {
        next[originalSrc] = newUrl;
      }
      return next;
    });
  }

  function handleResetImage(originalSrc: string) {
    setImageOverrides((prev) => {
      const next = { ...prev };
      delete next[originalSrc];
      return next;
    });
  }

  function handleSave() {
    setError(null);
    setSuccess(false);

    // Si l'utilisateur a édité les directions, on réinjecte la nouvelle
    // sérialisation à l'emplacement d'origine dans le raw_html.
    let rawHtmlOverride: string | undefined;
    if (tabsExtracted && directionsData) {
      rawHtmlOverride = replaceInHtml(rawHtml, tabsExtracted, directionsData);
    }

    startTransition(async () => {
      const result = await saveRawHtmlOverrides({
        profileId: clientId,
        projectId,
        pageId: page.id,
        textOverrides,
        imageOverrides,
        rawHtmlOverride,
      });
      if (result.ok) {
        setSuccess(true);
        setPage((p) => ({
          ...p,
          content: {
            ...((p.content as PageContent) ?? {}),
            meta: {
              ...((p.content as PageContent)?.meta ?? {}),
              text_overrides: textOverrides,
              image_overrides: imageOverrides,
              ...(rawHtmlOverride ? { raw_html: rawHtmlOverride } : {}),
            },
          } as PageContent,
        }));
      } else {
        setError(result.error);
      }
    });
  }

  const hasOverrides =
    Object.keys(textOverrides).length > 0 ||
    Object.keys(imageOverrides).length > 0;

  return (
    <div className="relative min-h-svh w-full px-6 py-10 md:px-16 md:py-14">
      {/* Header mobile */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href={`/admin/clients/${clientId}/projects/${projectId}`}
          className="text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          ← Projet
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          Édition fidèle
        </span>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-12 pt-20">
        {/* Breadcrumb + actions */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            <Link
              href="/admin/clients"
              className="transition-colors hover:text-white"
            >
              Espaces clients
            </Link>
            <span className="mx-3 text-white/20">→</span>
            <Link
              href={`/admin/clients/${clientId}`}
              className="text-white/55 transition-colors hover:text-white"
            >
              {clientName}
            </Link>
            <span className="mx-3 text-white/20">→</span>
            <Link
              href={`/admin/clients/${clientId}/projects/${projectId}`}
              className="transition-colors hover:text-white"
            >
              {projectName}
            </Link>
            <span className="mx-3 text-white/20">→</span>
            <span className="text-white/55">Reproduction fidèle</span>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex w-full max-w-2xl flex-col gap-3">
              <Eyebrow tracking="md">Titre de la page</Eyebrow>
              <AutosaveField
                initialValue={page.name}
                onSave={saveName}
                ariaLabel="Titre de la page"
                placeholder="Sans titre"
                className="w-full border-b border-white/20 bg-transparent pb-3 font-sans font-extralight tracking-[-0.05em] text-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {publicHref && (
                <Button
                  href={publicHref}
                  target="_blank"
                  rel="noopener"
                  variant="primary"
                  className="text-white/55"
                >
                  Voir public
                </Button>
              )}
              <button
                type="button"
                onClick={togglePublish}
                disabled={pending}
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] transition-colors hover:text-white disabled:opacity-50"
              >
                {page.is_published ? (
                  <>
                    <StatusBadge tone="success">Publi&eacute;e</StatusBadge>
                    <span className="text-white/40">·</span>
                    <span className="text-white/55">D&eacute;publier</span>
                  </>
                ) : (
                  <>
                    <StatusBadge tone="warning">Brouillon</StatusBadge>
                    <span className="text-white/40">·</span>
                    <span className="text-white/55">Publier</span>
                  </>
                )}
              </button>
              <Button
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={pending}
                variant="danger"
              >
                Supprimer
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.32em] text-amber-200/80">
              Reproduction fidèle
              {tabsExtracted && directionsData && (
                <>
                  <span className="mx-3 text-amber-200/40">·</span>
                  {Object.keys(directionsData).length} direction{Object.keys(directionsData).length > 1 ? "s" : ""} détectée{Object.keys(directionsData).length > 1 ? "s" : ""}
                </>
              )}
            </p>
            <p className="mt-2 font-serif text-sm italic text-white/55 md:text-base">
              {parsed.textsOrdered.length} texte{parsed.textsOrdered.length > 1 ? "s" : ""} unique{parsed.textsOrdered.length > 1 ? "s" : ""} ·{" "}
              {parsed.images.length} image{parsed.images.length > 1 ? "s" : ""} détecté{parsed.images.length > 1 ? "es" : "e"}{" "}
              · Les modifications s&apos;appliquent automatiquement sur la page publique au prochain chargement.
            </p>
          </div>

          {error && (
            <p className="border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
              {error}
            </p>
          )}
        </div>

        {/* Section DIRECTIONS (si un objet `const NAME = {1:..., 2:..., 3:...}`
            a été détecté dans le HTML d'origine). */}
        {tabsExtracted && directionsData && (
          <div className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between gap-4">
              <Eyebrow tracking="md">
                {tabsExtracted.name} · {Object.keys(directionsData).length} directions
              </Eyebrow>
              <Eyebrow tracking="md" intensity="muted">
                Édite chaque direction indépendamment
              </Eyebrow>
            </div>
            <DirectionsEditor
              data={directionsData}
              tabLabels={tabLabels}
              onChange={(next) => setDirectionsData(next)}
              onPickImage={(tabId, field: LeafField) =>
                setMediaTarget({ kind: "directions", tabId, path: field.path })
              }
              imagePickerOpenFor={
                mediaTarget?.kind === "directions"
                  ? { tabId: mediaTarget.tabId, path: mediaTarget.path }
                  : null
              }
            />
          </div>
        )}

        {/* Section IMAGES (statique, hors directions) */}
        {staticImages.length > 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between gap-4">
              <Eyebrow tracking="md">
                Images statiques · {staticImages.length}
              </Eyebrow>
              <Eyebrow tracking="md" intensity="muted">
                Clique sur un visuel pour le remplacer depuis la médiathèque
              </Eyebrow>
            </div>

            <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {staticImages.map((img) => {
                const override = imageOverrides[img.src];
                const displayUrl = override ?? img.src;
                return (
                  <li key={img.src} className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setMediaTarget({ kind: "static", originalSrc: img.src })
                      }
                      className={`group relative aspect-square w-full overflow-hidden rounded-md border bg-black/40 transition ${
                        override
                          ? "border-emerald-400/40 ring-1 ring-emerald-400/30"
                          : "border-white/10 hover:border-white/40"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={displayUrl}
                        alt={img.alt}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/65 px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-white/70 backdrop-blur-sm">
                        {override ? "Remplacée · cliquer pour modifier" : "Cliquer pour remplacer"}
                      </span>
                      {img.count > 1 && (
                        <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[9px] uppercase tracking-[0.28em] text-black">
                          {img.count}× dans la page
                        </span>
                      )}
                    </button>
                    {override && (
                      <button
                        type="button"
                        onClick={() => handleResetImage(img.src)}
                        className="text-[10px] uppercase tracking-[0.28em] text-white/40 transition-colors hover:text-white"
                      >
                        ← Revenir à l&apos;originale
                      </button>
                    )}
                    {img.alt && (
                      <span className="font-mono text-[10px] text-white/30">
                        alt: {img.alt}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Section TEXTES (statique, hors directions) */}
        {staticTexts.length > 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between gap-4">
              <Eyebrow tracking="md">
                Textes statiques · {staticTexts.length} unique
                {staticTexts.length > 1 ? "s" : ""}
              </Eyebrow>
              <Eyebrow tracking="md" intensity="muted">
                Modifier un texte met à jour toutes ses occurrences
              </Eyebrow>
            </div>

            <ul className="flex flex-col gap-5">
              {staticTexts.map((original) => {
                const count = parsed.textCounts.get(original) ?? 1;
                const value = textOverrides[original] ?? original;
                const overridden =
                  textOverrides[original] !== undefined &&
                  textOverrides[original] !== original;
                const isLong = original.length > 80;
                return (
                  <li key={original} className="flex flex-col gap-2">
                    <label className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-white/35">
                      <span>
                        {count > 1
                          ? `${count} occurrences identiques`
                          : "Texte"}
                      </span>
                      {overridden && (
                        <button
                          type="button"
                          onClick={() => handleTextChange(original, original)}
                          className="text-emerald-300/70 transition-colors hover:text-white"
                        >
                          ← Restaurer
                        </button>
                      )}
                    </label>
                    {isLong ? (
                      <textarea
                        rows={Math.min(8, Math.ceil(original.length / 80))}
                        value={value}
                        onChange={(e) =>
                          handleTextChange(original, e.target.value)
                        }
                        className={`w-full resize-y rounded-md border bg-white/[0.02] p-4 font-serif text-base text-[#F5F5F7]/90 placeholder:text-white/30 focus:outline-none md:text-lg ${
                          overridden
                            ? "border-emerald-400/30 focus:border-emerald-400/60"
                            : "border-white/10 focus:border-white/40"
                        }`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          handleTextChange(original, e.target.value)
                        }
                        className={`w-full border-b bg-transparent pb-2 font-sans text-base font-light text-[#F5F5F7] caret-[#F5F5F7] focus:outline-none md:text-lg ${
                          overridden
                            ? "border-emerald-400/40 focus:border-emerald-400/70"
                            : "border-white/20 focus:border-white/80"
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {staticTexts.length === 0 &&
          staticImages.length === 0 &&
          !directionsData && (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center font-serif italic text-white/45">
              Aucun texte ni image éditable détecté dans le HTML.
            </p>
          )}

        {/* Save bar */}
        <div className="sticky bottom-4 z-20 mt-8 flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-black/65 px-6 py-4 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <Eyebrow tracking="md" intensity="strong">
              {hasOverrides
                ? `${Object.keys(textOverrides).length} texte(s) · ${Object.keys(imageOverrides).length} image(s) remplacé(es)`
                : "Aucune modification"}
            </Eyebrow>
            <AnimatePresence>
              {success && (
                <motion.span
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  className="text-[10px] uppercase tracking-[0.32em] text-emerald-300/80"
                >
                  Enregistré
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <Button
            onClick={handleSave}
            disabled={pending}
            variant="primary"
            pending={pending}
            pendingLabel="Enregistrement…"
          >
            Enregistrer
          </Button>
        </div>

        <Button
          href={`/admin/clients/${clientId}/projects/${projectId}`}
          variant="ghost"
        >
          ← Retour projet
        </Button>
      </section>

      {/* Modal médiathèque (cible unifiée : override d'image statique OU
          champ d'image dans l'objet directions) */}
      {mediaTarget && (
        <MediaLibraryModal
          projectId={projectId}
          currentUrl={
            mediaTarget.kind === "static"
              ? (imageOverrides[mediaTarget.originalSrc] ?? null)
              : null
          }
          onSelect={(url) => {
            if (mediaTarget.kind === "static") {
              handleImageSelect(mediaTarget.originalSrc, url);
            } else if (directionsData) {
              const { tabId, path } = mediaTarget;
              const next = { ...directionsData };
              const cloned = JSON.parse(JSON.stringify(next[tabId]));
              // setLeaf chemin point → on l'inline pour éviter un import circulaire
              const parts = path.split(".");
              let cursor: unknown = cloned;
              for (let i = 0; i < parts.length - 1; i++) {
                if (cursor === null || typeof cursor !== "object") break;
                cursor = (cursor as Record<string, unknown>)[parts[i]];
              }
              if (cursor && typeof cursor === "object") {
                (cursor as Record<string, unknown>)[
                  parts[parts.length - 1]
                ] = url;
              }
              next[tabId] = cloned;
              setDirectionsData(next);
            }
          }}
          onClose={() => setMediaTarget(null)}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        tone="danger"
        title="Supprimer définitivement cette page ?"
        description="Tous les overrides texte/image seront perdus et les médias associés effacés. Action irréversible."
        confirmLabel="Supprimer la page"
        cancelLabel="Annuler"
        pending={pending}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          confirmDeletePage();
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
