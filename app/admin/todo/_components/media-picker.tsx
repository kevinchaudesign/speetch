"use client";

/**
 * MediaPicker — modal de sélection dans la médiathèque du Maître pour
 * insertion inline dans une note Tiptap. Filtre par kind demandé
 * (image / video / audio / all).
 *
 * Fetch les médias à l'ouverture (lazy) via la server action
 * fetchOwnerMedia. Affiche une grille avec sidebar de dossiers.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  fetchOwnerMedia,
  type OwnerMediaFolder,
  type OwnerMediaItem,
} from "../actions";
import type { MediaKind } from "./media-embed-node";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type MediaPickerKind = MediaKind | "all";

const MIME_PREFIX_BY_KIND: Record<MediaPickerKind, string | null> = {
  image: "image/",
  video: "video/",
  audio: "audio/",
  all: null,
};

const KIND_LABELS: Record<MediaPickerKind, string> = {
  image: "Insérer une image",
  video: "Insérer une vidéo",
  audio: "Insérer un audio",
  all: "Insérer un média",
};

export function MediaPicker({
  open,
  kind,
  onClose,
  onSelect,
}: {
  open: boolean;
  kind: MediaPickerKind;
  onClose: () => void;
  onSelect: (item: OwnerMediaItem) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<OwnerMediaFolder[]>([]);
  const [items, setItems] = useState<OwnerMediaItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | "all">("all");
  const [query, setQuery] = useState("");

  // Fetch au premier open uniquement (cache simple côté state)
  const [fetched, setFetched] = useState(false);
  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    setError(null);
    fetchOwnerMedia().then((res) => {
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setFolders(res.folders);
      setItems(res.items);
      setFetched(true);
    });
  }, [open, fetched]);

  // Escape pour fermer
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const mimePrefix = MIME_PREFIX_BY_KIND[kind];
  const filtered = items.filter((m) => {
    if (mimePrefix && !m.mime_type.startsWith(mimePrefix)) return false;
    if (selectedFolder !== "all" && m.folder_id !== selectedFolder) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!m.filename.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="media-picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-6 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-cyan-200/20 bg-black/95"
            style={{
              boxShadow:
                "0 32px 80px -16px rgba(0,0,0,0.7), 0 0 32px rgba(125,211,252,0.12)",
            }}
          >
            <header className="flex items-center justify-between border-b border-cyan-200/15 px-6 py-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
                  Médiathèque Maître
                </span>
                <span className="font-serif text-lg italic text-[#F5F5F7]">
                  {KIND_LABELS[kind]}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-cyan-100"
              >
                Fermer
              </button>
            </header>

            <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[200px_1fr]">
              {/* Sidebar dossiers */}
              <aside className="hidden flex-col gap-1 overflow-y-auto border-r border-cyan-200/10 bg-black/30 p-3 md:flex">
                <FolderRow
                  active={selectedFolder === "all"}
                  onClick={() => setSelectedFolder("all")}
                >
                  Tous
                </FolderRow>
                {folders.map((f) => (
                  <FolderRow
                    key={f.id}
                    active={selectedFolder === f.id}
                    onClick={() => setSelectedFolder(f.id)}
                  >
                    {f.name}
                  </FolderRow>
                ))}
              </aside>

              {/* Search + grille */}
              <div className="flex flex-col overflow-hidden">
                <div className="border-b border-cyan-200/10 px-5 py-3">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher par nom…"
                    aria-label="Rechercher un média"
                    className="w-full rounded-md border border-cyan-200/15 bg-cyan-200/[0.02] px-3 py-2 text-[13px] text-[#F5F5F7] caret-cyan-200 outline-none placeholder:text-white/35 focus:border-cyan-200/45"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {loading && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
                      Chargement…
                    </p>
                  )}
                  {error && (
                    <p className="text-[11px] uppercase tracking-[0.32em] text-red-300/85">
                      {error}
                    </p>
                  )}
                  {!loading && !error && filtered.length === 0 && (
                    <p className="font-serif italic text-white/45">
                      Aucun média
                      {mimePrefix
                        ? ` ${kind === "image" ? "image" : kind === "video" ? "vidéo" : "audio"}`
                        : ""}{" "}
                      ne correspond.
                    </p>
                  )}
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {filtered.map((item) => (
                      <MediaTile
                        key={item.id}
                        item={item}
                        onSelect={() => {
                          onSelect(item);
                          onClose();
                        }}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FolderRow({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full truncate rounded-md px-3 py-2 text-left text-[12px] uppercase tracking-[0.28em] transition-colors",
        active
          ? "bg-cyan-200/[0.1] text-cyan-100"
          : "text-white/55 hover:bg-cyan-200/[0.04] hover:text-cyan-100/85",
      )}
    >
      {children}
    </button>
  );
}

function MediaTile({
  item,
  onSelect,
}: {
  item: OwnerMediaItem;
  onSelect: () => void;
}) {
  const isImage = item.mime_type.startsWith("image/");
  const isVideo = item.mime_type.startsWith("video/");
  const isAudio = item.mime_type.startsWith("audio/");

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="group flex w-full flex-col gap-2 overflow-hidden rounded-lg border border-cyan-200/10 bg-cyan-200/[0.02] p-2 text-left transition-colors hover:border-cyan-200/45 hover:bg-cyan-200/[0.05]"
        title={item.filename}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-black/40">
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.public_url}
              alt={item.filename}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {isVideo && (
            <video
              src={item.public_url}
              preload="metadata"
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {isAudio && (
            <div className="absolute inset-0 flex items-center justify-center text-cyan-200/55">
              <AudioGlyph />
            </div>
          )}
          {!isImage && !isVideo && !isAudio && (
            <div className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-white/45">
              {item.mime_type}
            </div>
          )}
        </div>
        <span className="truncate font-mono text-[10px] text-white/70">
          {item.filename}
        </span>
      </button>
    </li>
  );
}

function AudioGlyph() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18V6l9-2v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="15" cy="16" r="3" />
    </svg>
  );
}
