"use client";

/**
 * Picker direct de médiathèque ouvert quand l'admin clique sur une image
 * d'une page côté client. Pas de chatbot dans la boucle : on liste les
 * médias du client, l'admin clique sur l'un d'eux, on POST
 * `/api/admin/assistant/apply` (kind=image-override), puis on rafraîchit
 * la page pour que l'iframe relise les `image_overrides`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Modal, ModalHeader } from "@/lib/ds";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

type MediaItem = {
  id: string;
  folder_id: string | null;
  filename: string;
  url: string;
  kind: "image" | "video" | "other";
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
};

type MediaFolder = {
  id: string;
  name: string;
  position: number;
};

export type ImagePickerTarget = {
  clientSlug: string;
  pageId: string;
  pageName: string;
  originalSrc: string;
  currentSrc: string;
  alt: string;
  /** Id d'instance posé par injectOriginalsMarker — quand présent, l'API
   *  écrit dans image_overrides_by_id pour cibler cette seule <img>. */
  imgId: string;
};

export function MediaPickerModal({
  target,
  onClose,
}: {
  target: ImagePickerTarget | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const open = target !== null;

  const [folders, setFolders] = useState<MediaFolder[] | null>(null);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  /** ID du média venant d'être appliqué — affiche un état « Appliqué ✓ »
   *  pendant 1.2s puis on ferme. */
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const closingTimerRef = useRef<number | null>(null);
  // Alternative à la médiathèque : poser un bloc de couleur uni à la
  // place de l'image. Le serveur construit le data URI SVG.
  // `blockColor` est la valeur normalisée (#rrggbb) utilisée pour
  // l'aperçu et l'API. `colorInput` est la string brute saisie au
  // clavier — peut être transitoirement invalide pendant la frappe.
  const [blockColor, setBlockColor] = useState<string>("#ffffff");
  const [colorInput, setColorInput] = useState<string>("#ffffff");
  const [applyingColor, setApplyingColor] = useState(false);

  // Charge la médiathèque à l'ouverture.
  useEffect(() => {
    if (!target) return;
    setFolders(null);
    setItems(null);
    setError(null);
    setFolderFilter(null);
    setQuery("");
    setAppliedId(null);
    setApplyingId(null);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/client-media?slug=${encodeURIComponent(target.clientSlug)}`,
          { credentials: "include" },
        );
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          folders?: MediaFolder[];
          items?: MediaItem[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          setError(json.error ?? `HTTP ${res.status}`);
          setFolders([]);
          setItems([]);
          return;
        }
        setFolders(json.folders ?? []);
        setItems(json.items ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        setFolders([]);
        setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [target]);

  // Cleanup du timer de fermeture différée si la modal est fermée à la main.
  useEffect(() => {
    if (!open && closingTimerRef.current) {
      window.clearTimeout(closingTimerRef.current);
      closingTimerRef.current = null;
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!items) return [];
    let list = items.filter((it) => it.kind === "image");
    if (folderFilter !== null) {
      list = list.filter((it) =>
        folderFilter === "__root__"
          ? it.folder_id === null
          : it.folder_id === folderFilter,
      );
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((it) => it.filename.toLowerCase().includes(q));
    }
    return list;
  }, [items, folderFilter, query]);

  const handleSelect = useCallback(
    async (item: MediaItem) => {
      if (!target || applyingId) return;
      setApplyingId(item.id);
      setError(null);
      try {
        const res = await fetch("/api/admin/assistant/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "image-override",
            client_slug: target.clientSlug,
            page_id: target.pageId,
            original_src: target.originalSrc,
            img_id: target.imgId,
            new_media_url: item.url,
          }),
          credentials: "include",
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }
        setAppliedId(item.id);
        // Rafraîchit la route → revalidatePath côté serveur a déjà tagué le
        // cache : Next refait le fetch des content + ré-render l'iframe avec
        // le nouvel image_override.
        router.refresh();
        closingTimerRef.current = window.setTimeout(() => {
          onClose();
        }, 900);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setError(msg);
      } finally {
        setApplyingId(null);
      }
    },
    [target, applyingId, router, onClose],
  );

  const handleApplyColor = useCallback(async () => {
    if (!target || applyingColor) return;
    setApplyingColor(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/assistant/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "image-override",
          client_slug: target.clientSlug,
          page_id: target.pageId,
          original_src: target.originalSrc,
          img_id: target.imgId,
          block_color: blockColor,
        }),
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
      closingTimerRef.current = window.setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
    } finally {
      setApplyingColor(false);
    }
  }, [target, applyingColor, blockColor, router, onClose]);

  if (!target) return null;

  const aspectHint =
    target.alt && target.alt.length > 0 ? `« ${target.alt} »` : null;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader
        title={`Médiathèque · ${target.pageName}`}
        subtitle={
          items === null
            ? "Chargement…"
            : `${filtered.length} image${filtered.length > 1 ? "s" : ""} disponibles`
        }
        onClose={onClose}
      />

      {/* Bandeau "image actuelle" + filtres */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-6 py-5 md:px-8">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]">
            {target.currentSrc && /^https?:\/\//i.test(target.currentSrc) ? (
              <Image
                src={target.currentSrc}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="px-1 text-center text-[9px] uppercase tracking-[0.32em] text-white/30">
                {target.currentSrc ? "src brisé" : "vide"}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[9px] uppercase tracking-[0.4em] text-white/35">
              Emplacement sélectionné
            </span>
            <span className="truncate font-mono text-[12px] text-white/65">
              {target.originalSrc || "(src vide)"}
            </span>
            {aspectHint && (
              <span className="truncate text-[11px] italic text-white/40">
                alt&nbsp;: {aspectHint}
              </span>
            )}
          </div>
        </div>

        {/* Bloc de couleur — alternative à un média de la bibliothèque.
            Le serveur construit le data URI SVG (1×1 stretched cover).
            Deux entrées synchronisées : swatch (OS color picker) +
            input texte hex pour saisir une valeur précise. */}
        <div className="flex items-center gap-4 rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-3">
          <label
            className="relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-md border border-white/[0.12]"
            style={{ backgroundColor: blockColor }}
            aria-label="Choisir une couleur"
          >
            <input
              type="color"
              value={blockColor}
              onChange={(e) => {
                const next = e.target.value;
                setBlockColor(next);
                setColorInput(next.toUpperCase());
              }}
              disabled={applyingColor}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[9px] uppercase tracking-[0.4em] text-white/35">
              Bloc de couleur
            </span>
            <input
              type="text"
              inputMode="text"
              spellCheck={false}
              autoCapitalize="characters"
              value={colorInput}
              onChange={(e) => {
                const raw = e.target.value.trim();
                // Accepte la saisie avec ou sans #. Auto-préfixe pour
                // l'affichage si l'utilisateur tape directement les hex.
                const normalized = raw.startsWith("#") ? raw : raw ? `#${raw}` : "";
                setColorInput(normalized);
                if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) {
                  setBlockColor(normalized);
                }
              }}
              onBlur={() => {
                // Snap à la dernière valeur valide à la perte de focus
                // (évite que l'utilisateur reste sur une saisie cassée).
                if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(colorInput)) {
                  setColorInput(blockColor.toUpperCase());
                }
              }}
              placeholder="#RRGGBB"
              disabled={applyingColor}
              className={cn(
                "w-32 border-b bg-transparent pb-1 font-mono text-[13px] tracking-[0.05em] outline-none transition-colors",
                /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(colorInput)
                  ? "border-white/20 text-white/85 focus:border-white/70"
                  : "border-red-400/40 text-red-200/80 focus:border-red-300/70",
              )}
            />
          </div>
          <button
            type="button"
            onClick={handleApplyColor}
            disabled={
              applyingColor ||
              applyingId !== null ||
              !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(colorInput)
            }
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.32em] transition-colors",
              applyingColor
                ? "border-emerald-300/40 text-emerald-200"
                : "border-white/15 text-white/75 hover:border-white/45 hover:text-white disabled:opacity-40 disabled:hover:border-white/15 disabled:hover:text-white/75",
            )}
          >
            {applyingColor ? "Application…" : "Appliquer ce bloc"}
          </button>
        </div>

        {/* Filtres + recherche */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              active={folderFilter === null}
              onClick={() => setFolderFilter(null)}
              label="Tous"
            />
            {items && items.some((it) => it.folder_id === null) && (
              <FilterChip
                active={folderFilter === "__root__"}
                onClick={() => setFolderFilter("__root__")}
                label="Racine"
              />
            )}
            {folders?.map((f) => (
              <FilterChip
                key={f.id}
                active={folderFilter === f.id}
                onClick={() => setFolderFilter(f.id)}
                label={f.name}
              />
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un fichier…"
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-white/85 placeholder:text-white/30 outline-none transition-colors focus:border-white/25 md:w-72"
          />
        </div>
      </div>

      {error && (
        <p className="border-b border-red-400/20 bg-red-400/5 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-red-300/80 md:px-8">
          {error}
        </p>
      )}

      {/* Grille */}
      <div className="flex-1 overflow-auto px-6 py-6 md:px-8 md:py-8">
        {items === null ? (
          <p className="font-serif italic text-white/40">Chargement…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="font-serif italic text-white/40">
              Aucune image ne correspond. Ajuste le filtre ou téléverse depuis
              l'admin&nbsp;:
            </p>
            <a
              href={`/admin/clients?slug=${encodeURIComponent(target.clientSlug)}`}
              className="text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
            >
              Ouvrir la médiathèque admin →
            </a>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((it) => {
              const isCurrent = it.url === target.currentSrc;
              const isApplying = applyingId === it.id;
              const isApplied = appliedId === it.id;
              return (
                <li key={it.id} className="flex flex-col gap-2">
                  <motion.button
                    type="button"
                    onClick={() => handleSelect(it)}
                    disabled={applyingId !== null}
                    whileHover={{ scale: applyingId ? 1 : 1.02 }}
                    whileTap={{ scale: applyingId ? 1 : 0.98 }}
                    transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                    className={cn(
                      "group relative aspect-square w-full overflow-hidden rounded-md border bg-black/40 transition-all",
                      isApplied
                        ? "border-emerald-300/60 ring-2 ring-emerald-300/40"
                        : isCurrent
                          ? "border-white/70 ring-2 ring-white/30"
                          : "border-white/[0.08] hover:border-white/35",
                      applyingId !== null && !isApplying && "opacity-40",
                    )}
                  >
                    <Image
                      src={it.url}
                      alt={it.filename}
                      fill
                      sizes="(min-width: 1024px) 240px, (min-width: 768px) 33vw, 50vw"
                      className="object-cover"
                    />
                    {isCurrent && !isApplied && (
                      <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[9px] uppercase tracking-[0.3em] text-black">
                        Actuel
                      </span>
                    )}
                    {isApplied && (
                      <span className="absolute inset-0 flex items-center justify-center bg-emerald-400/15 text-emerald-200">
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 22 22"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 11l4 4 8-8" />
                        </svg>
                      </span>
                    )}
                    {isApplying && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[10px] uppercase tracking-[0.32em] text-white/85">
                        Application…
                      </span>
                    )}
                  </motion.button>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-[11px] text-white/55">
                      {it.filename}
                    </span>
                    {it.width && it.height && (
                      <span className="shrink-0 font-mono text-[9px] text-white/30">
                        {it.width}×{it.height}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em] transition-colors",
        active
          ? "border-white/40 bg-white/[0.05] text-white"
          : "border-white/[0.08] bg-transparent text-white/45 hover:border-white/25 hover:text-white/85",
      )}
    >
      {label}
    </button>
  );
}
