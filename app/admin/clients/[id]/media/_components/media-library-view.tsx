"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button, ConfirmDialog, AlertDialog, Field, Eyebrow } from "@/lib/ds";
import { cn } from "@/lib/utils";
import {
  createMediaFolder,
  renameMediaFolder,
  deleteMediaFolder,
  uploadClientMedia,
  deleteClientMedia,
  deleteClientMediaBatch,
  moveMediaToFolder,
  moveClientMediaBatch,
  renameClientMedia,
  setMediaGeneration,
  setMediaPersona,
  setMediaFolderCover,
} from "../actions";

// Nom (case-insensitive) qu'un dossier doit avoir pour qu'on expose le tag
// persona sur ses médias. Centralisé pour pouvoir bouger ça plus tard.
const PERSONA_FOLDER_NAME = "personas";

function isPersonaFolderName(name: string): boolean {
  return name.trim().toLowerCase() === PERSONA_FOLDER_NAME;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type MediaFolder = {
  id: string;
  name: string;
  position: number;
  /** NULL = top-level. Sinon référence le dossier parent (1 niveau max). */
  parent_id: string | null;
  /** FK vers MediaItem.id — image désignée comme aperçu. */
  cover_media_id: string | null;
  /** URL publique du cover_media_id, résolue côté server. */
  cover_url: string | null;
};

/**
 * Aplatit l'arborescence dossiers (max depth = 1) en respectant l'ordre :
 * parent, puis ses enfants. Utilisé par les modales Move pour proposer
 * les sous-dossiers comme cibles, libellés "Parent / Enfant".
 */
function flattenFolderTree(
  folders: MediaFolder[],
): Array<{ id: string; label: string; isChild: boolean }> {
  const top = folders.filter((f) => f.parent_id === null);
  const childrenByParent = new Map<string, MediaFolder[]>();
  for (const f of folders) {
    if (f.parent_id) {
      const arr = childrenByParent.get(f.parent_id);
      if (arr) arr.push(f);
      else childrenByParent.set(f.parent_id, [f]);
    }
  }
  const out: Array<{ id: string; label: string; isChild: boolean }> = [];
  for (const t of top) {
    out.push({ id: t.id, label: t.name, isChild: false });
    for (const c of childrenByParent.get(t.id) ?? []) {
      out.push({ id: c.id, label: `${t.name} / ${c.name}`, isChild: true });
    }
  }
  return out;
}

/**
 * Télécharge un média via fetch + blob (contourne le fait que l'attribut
 * `download` est ignoré sur les URLs cross-origin par Chrome).
 */
async function downloadSingleMedia(
  url: string,
  filename: string,
): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename || "media";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}

/**
 * Demande au serveur de zipper plusieurs médias et déclenche le téléchargement.
 */
async function downloadBatchAsZip(
  profileId: string,
  mediaIds: string[],
): Promise<void> {
  const res = await fetch("/api/admin/client-media/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, mediaIds }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  const cd = res.headers.get("Content-Disposition") ?? "";
  const match = cd.match(/filename="([^"]+)"/);
  a.download = match?.[1] ?? "mediatheque.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}

export type MediaItem = {
  id: string;
  folder_id: string | null;
  persona_id: string | null;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  generation_prompt: string | null;
  generation_model: string | null;
  created_at: string;
  public_url: string;
};

export type PersonaOption = {
  id: string;
  name: string;
};

type Selection =
  | { kind: "all" }
  | { kind: "loose" }
  | { kind: "folder"; id: string };

function isImage(mime: string) {
  return mime.startsWith("image/");
}
function isVideo(mime: string) {
  return mime.startsWith("video/");
}
function isAudio(mime: string) {
  return mime.startsWith("audio/");
}

/**
 * Convertit un mime_type ou un nom de fichier en label format court
 * affiché en badge sur la tuile (JPG, PNG, WEBP, GIF, AVIF, SVG, MP4…).
 * Préfère l'extension du filename si elle existe (plus fidèle que le
 * mime — ex : "image/jpeg" pour un .heic recompressé).
 */
function formatLabel(mime: string, filename?: string): string {
  // 1. Essaye l'extension du filename d'abord
  if (filename) {
    const dot = filename.lastIndexOf(".");
    if (dot > 0 && dot < filename.length - 1) {
      const ext = filename.slice(dot + 1).toLowerCase();
      if (ext === "jpeg") return "JPG";
      if (ext.length >= 2 && ext.length <= 5) return ext.toUpperCase();
    }
  }
  // 2. Fallback sur le mime_type
  const slash = mime.indexOf("/");
  if (slash < 0) return mime.toUpperCase();
  let sub = mime.slice(slash + 1).toLowerCase();
  // Normalisations courantes
  if (sub === "jpeg") sub = "jpg";
  if (sub === "svg+xml") sub = "svg";
  if (sub === "x-matroska") sub = "mkv";
  if (sub === "quicktime") sub = "mov";
  return sub.toUpperCase();
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export function MediaLibraryView({
  profileId,
  initialFolders,
  initialItems,
  personas,
}: {
  profileId: string;
  initialFolders: MediaFolder[];
  initialItems: MediaItem[];
  personas: PersonaOption[];
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>({ kind: "all" });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Modal state
  // createFolderState : null = fermé, { parentId } = ouvert. parentId NULL =
  // top-level, string = sous-dossier de ce parent.
  const [createFolderState, setCreateFolderState] = useState<{
    parentId: string | null;
  } | null>(null);
  const createFolderOpen = createFolderState !== null;
  const [renameFolderState, setRenameFolderState] =
    useState<MediaFolder | null>(null);
  const [deleteFolderState, setDeleteFolderState] =
    useState<MediaFolder | null>(null);
  const [renameMediaState, setRenameMediaState] = useState<MediaItem | null>(
    null,
  );
  const [deleteMediaState, setDeleteMediaState] = useState<MediaItem | null>(
    null,
  );
  const [moveMediaState, setMoveMediaState] = useState<MediaItem | null>(null);
  const [generationState, setGenerationState] = useState<MediaItem | null>(
    null,
  );
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Modale "choisir l'image d'aperçu d'un dossier" — picker sur tous les
  // médias image du client (pas seulement ceux du dossier).
  const [coverPickerFolder, setCoverPickerFolder] =
    useState<MediaFolder | null>(null);

  // ── Sélection multiple ────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Dernier ID coché par clic direct — sert d'ancre pour Shift+click range.
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const [batchPending, setBatchPending] = useState(false);
  const hasSelection = selectedIds.size > 0;

  // Lecture seule du state — page server fournit toujours la source de vérité.
  const folders = initialFolders;
  const items = initialItems;

  // Poids du thumb AVIF réellement servi par /_next/image, capturé via
  // Performance API. `encodedBodySize` reflète les octets du corps
  // (y compris pour les hits cache, contrairement à `transferSize`).
  const [thumbBytes, setThumbBytes] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    const urlToId = new Map(items.map((i) => [i.public_url, i.id]));

    const ingest = (entry: PerformanceResourceTiming) => {
      if (!entry.name.includes("/_next/image")) return;
      try {
        const u = new URL(entry.name, window.location.origin);
        const orig = u.searchParams.get("url");
        if (!orig) return;
        const id = urlToId.get(decodeURIComponent(orig));
        if (!id) return;
        const bytes = entry.encodedBodySize || entry.transferSize;
        if (!bytes) return;
        setThumbBytes((prev) => {
          if (prev.get(id) === bytes) return prev;
          const next = new Map(prev);
          next.set(id, bytes);
          return next;
        });
      } catch {
        /* URL mal formée — ignore */
      }
    };

    for (const e of performance.getEntriesByType("resource")) {
      ingest(e as PerformanceResourceTiming);
    }
    const obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) ingest(e as PerformanceResourceTiming);
    });
    obs.observe({ type: "resource", buffered: true });
    return () => obs.disconnect();
  }, [items]);

  // ── Tag persona ──────────────────────────────────────────────────────────
  const personaFolderIds = useMemo(() => {
    const set = new Set<string>();
    for (const f of folders) {
      if (isPersonaFolderName(f.name)) set.add(f.id);
    }
    return set;
  }, [folders]);

  const personaById = useMemo(() => {
    const map = new Map<string, PersonaOption>();
    for (const p of personas) map.set(p.id, p);
    return map;
  }, [personas]);

  const handleSetPersona = useCallback(
    async (mediaId: string, personaId: string | null) => {
      const res = await setMediaPersona({ profileId, mediaId, personaId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      startTransition(() => router.refresh());
    },
    [profileId, router],
  );

  const handleSetGeneration = useCallback(
    async (mediaId: string, prompt: string, model: string) => {
      const res = await setMediaGeneration({
        profileId,
        mediaId,
        prompt,
        model,
      });
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      setGenerationState(null);
      startTransition(() => router.refresh());
      return true;
    },
    [profileId, router],
  );

  const filtered = useMemo(() => {
    if (selection.kind === "all") return items;
    if (selection.kind === "loose")
      return items.filter((m) => m.folder_id === null);
    return items.filter((m) => m.folder_id === selection.id);
  }, [items, selection]);

  // Tree des dossiers (max 1 niveau) : top-level + map parent → enfants.
  const topLevelFolders = useMemo(
    () => folders.filter((f) => f.parent_id === null),
    [folders],
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string, MediaFolder[]>();
    for (const f of folders) {
      if (f.parent_id) {
        const arr = map.get(f.parent_id);
        if (arr) arr.push(f);
        else map.set(f.parent_id, [f]);
      }
    }
    return map;
  }, [folders]);

  // Sous-dossiers à afficher en haut de la grille quand on est dans un dossier
  // parent. Vide pour "Tous", "Hors dossier", et pour les sous-dossiers eux-mêmes
  // (depth max = 1, donc un sous-dossier n'a jamais d'enfants).
  const subFoldersInView = useMemo(() => {
    if (selection.kind !== "folder") return [];
    return childrenByParent.get(selection.id) ?? [];
  }, [selection, childrenByParent]);

  const counts = useMemo(() => {
    const byFolder = new Map<string | null, number>();
    for (const m of items) {
      const k = m.folder_id;
      byFolder.set(k, (byFolder.get(k) ?? 0) + 1);
    }
    return byFolder;
  }, [items]);

  // Fermer le menu contextuel au clic ailleurs / Esc
  useEffect(() => {
    if (!openMenuId) return;
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-media-menu]")) setOpenMenuId(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenuId(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  // Esc → vide la sélection (si aucun menu / modale n'est ouvert)
  useEffect(() => {
    if (!hasSelection) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Si une modale est ouverte, on la laisse capturer son propre Esc.
      if (
        batchDeleteOpen ||
        batchMoveOpen ||
        renameFolderState ||
        deleteFolderState ||
        renameMediaState ||
        deleteMediaState ||
        moveMediaState ||
        previewItem ||
        createFolderOpen ||
        coverPickerFolder
      ) {
        return;
      }
      setSelectedIds(new Set());
      setAnchorId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    hasSelection,
    batchDeleteOpen,
    batchMoveOpen,
    renameFolderState,
    deleteFolderState,
    renameMediaState,
    deleteMediaState,
    moveMediaState,
    previewItem,
    createFolderOpen,
    coverPickerFolder,
  ]);

  // Si la sélection courante (filtrage par dossier) change, on purge la
  // sélection des IDs qui ne sont plus visibles — évite des actions silencieuses
  // sur des items invisibles.
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const visible = new Set(filtered.map((m) => m.id));
    let changed = false;
    const next = new Set<string>();
    for (const id of selectedIds) {
      if (visible.has(id)) next.add(id);
      else changed = true;
    }
    if (changed) setSelectedIds(next);
  }, [filtered, selectedIds]);

  const toggleSelection = useCallback(
    (id: string, mode: "toggle" | "range") => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (mode === "range" && anchorId && anchorId !== id) {
          const ids = filtered.map((m) => m.id);
          const fromIdx = ids.indexOf(anchorId);
          const toIdx = ids.indexOf(id);
          if (fromIdx !== -1 && toIdx !== -1) {
            const [lo, hi] =
              fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
            for (let i = lo; i <= hi; i += 1) next.add(ids[i]);
            return next;
          }
        }
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      if (mode === "toggle") setAnchorId(id);
    },
    [filtered, anchorId],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setAnchorId(null);
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(filtered.map((m) => m.id)));
    setAnchorId(null);
  }, [filtered]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      setUploadProgress({ done: 0, total: files.length });
      setError(null);
      const targetFolderId = selection.kind === "folder" ? selection.id : null;
      let done = 0;
      let firstError: string | null = null;
      for (const file of files) {
        const fd = new FormData();
        fd.append("profile_id", profileId);
        if (targetFolderId) fd.append("folder_id", targetFolderId);
        fd.append("file", file);
        const res = await uploadClientMedia(fd);
        if (!res.ok && firstError === null) firstError = res.error;
        done += 1;
        setUploadProgress({ done, total: files.length });
      }
      setUploading(false);
      setUploadProgress(null);
      if (firstError) setError(firstError);
      startTransition(() => router.refresh());
    },
    [profileId, selection, router],
  );

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    void uploadFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      void uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const refresh = () => startTransition(() => router.refresh());

  return (
    <div className="flex flex-col gap-10">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className="relative"
      >
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          {/* Sidebar dossiers */}
          <aside className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Eyebrow tracking="md" intensity="strong">
                Dossiers
              </Eyebrow>
              <button
                type="button"
                onClick={() => setCreateFolderState({ parentId: null })}
                className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
              >
                + Nouveau
              </button>
            </div>

            <ul className="flex flex-col gap-1">
              <FolderRow
                label="Tous"
                count={items.length}
                active={selection.kind === "all"}
                onClick={() => setSelection({ kind: "all" })}
              />
              <FolderRow
                label="Hors dossier"
                count={counts.get(null) ?? 0}
                active={selection.kind === "loose"}
                onClick={() => setSelection({ kind: "loose" })}
              />
              {folders.length > 0 && (
                <li className="my-2 h-px bg-white/10" aria-hidden />
              )}
              {topLevelFolders.map((f) => {
                const children = childrenByParent.get(f.id) ?? [];
                return (
                  <Fragment key={f.id}>
                    <FolderRow
                      label={f.name}
                      count={counts.get(f.id) ?? 0}
                      coverUrl={f.cover_url}
                      depth={0}
                      active={
                        selection.kind === "folder" && selection.id === f.id
                      }
                      onClick={() => setSelection({ kind: "folder", id: f.id })}
                      onRename={() => setRenameFolderState(f)}
                      onDelete={() => setDeleteFolderState(f)}
                      onCreateSub={() =>
                        setCreateFolderState({ parentId: f.id })
                      }
                      onPickCover={() => setCoverPickerFolder(f)}
                    />
                    {children.map((c) => (
                      <FolderRow
                        key={c.id}
                        label={c.name}
                        count={counts.get(c.id) ?? 0}
                        coverUrl={c.cover_url}
                        depth={1}
                        active={
                          selection.kind === "folder" && selection.id === c.id
                        }
                        onClick={() =>
                          setSelection({ kind: "folder", id: c.id })
                        }
                        onRename={() => setRenameFolderState(c)}
                        onDelete={() => setDeleteFolderState(c)}
                        onPickCover={() => setCoverPickerFolder(c)}
                      />
                    ))}
                  </Fragment>
                );
              })}
            </ul>
          </aside>

          {/* Zone droite */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* Drop zone + actions */}
            <div className="flex flex-col gap-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                className={cn(
                  "group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition-all duration-500 ease-out",
                  dragOver
                    ? "border-white/50 bg-white/[0.05] backdrop-blur-sm"
                    : "border-white/15 bg-white/[0.01] hover:border-white/30 hover:bg-white/[0.025]",
                )}
              >
                <span className="text-[11px] uppercase tracking-[0.4em] text-white/45 group-hover:text-white/70">
                  {dragOver
                    ? "Relâche pour téléverser"
                    : selection.kind === "folder"
                      ? `Téléverser dans « ${
                          folders.find((f) => f.id === selection.id)?.name ?? ""
                        } »`
                      : "Glisse des fichiers ici ou clique pour parcourir"}
                </span>
                <span className="font-serif text-sm italic text-white/35">
                  Images 20 Mo · vidéos 200 Mo · audios 50 Mo
                </span>
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                onChange={onPickFiles}
                className="hidden"
              />

              <AnimatePresence>
                {uploading && uploadProgress && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                    className="text-[11px] uppercase tracking-[0.32em] text-white/55"
                  >
                    Téléversement {uploadProgress.done}/{uploadProgress.total}…
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Sous-dossiers du dossier courant (parent) — tuiles en tête de grille */}
            {subFoldersInView.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {subFoldersInView.map((sf) => (
                  <FolderTile
                    key={sf.id}
                    folder={sf}
                    count={counts.get(sf.id) ?? 0}
                    onClick={() => setSelection({ kind: "folder", id: sf.id })}
                    onPickCover={() => setCoverPickerFolder(sf)}
                  />
                ))}
              </ul>
            )}

            {/* Grille des médias */}
            {filtered.length === 0 && subFoldersInView.length === 0 ? (
              <p className="py-12 text-center font-serif text-base italic text-white/35">
                {selection.kind === "all"
                  ? "Aucun média pour le moment."
                  : selection.kind === "loose"
                    ? "Aucun média hors dossier."
                    : "Ce dossier est vide."}
              </p>
            ) : filtered.length === 0 ? null : (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((m) => {
                  const inPersonaFolder =
                    m.folder_id !== null && personaFolderIds.has(m.folder_id);
                  return (
                    <MediaTile
                      key={m.id}
                      item={m}
                      thumbBytes={thumbBytes.get(m.id) ?? null}
                      menuOpen={openMenuId === m.id}
                      selected={selectedIds.has(m.id)}
                      anySelected={hasSelection}
                      personaOptions={inPersonaFolder ? personas : null}
                      currentPersonaName={
                        m.persona_id
                          ? (personaById.get(m.persona_id)?.name ?? null)
                          : null
                      }
                      onSetPersona={(personaId) =>
                        handleSetPersona(m.id, personaId)
                      }
                      onMenuToggle={() =>
                        setOpenMenuId((prev) => (prev === m.id ? null : m.id))
                      }
                      onPreview={() => setPreviewItem(m)}
                      onToggleSelect={(mode) => toggleSelection(m.id, mode)}
                      onRename={() => {
                        setOpenMenuId(null);
                        setRenameMediaState(m);
                      }}
                      onEditGeneration={() => {
                        setOpenMenuId(null);
                        setGenerationState(m);
                      }}
                      onMove={() => {
                        setOpenMenuId(null);
                        setMoveMediaState(m);
                      }}
                      onDelete={() => {
                        setOpenMenuId(null);
                        setDeleteMediaState(m);
                      }}
                      onDownload={async () => {
                        setOpenMenuId(null);
                        try {
                          await downloadSingleMedia(m.public_url, m.filename);
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Téléchargement impossible.",
                          );
                        }
                      }}
                      onSetAsCover={
                        isImage(m.mime_type) && m.folder_id !== null
                          ? async () => {
                              setOpenMenuId(null);
                              const currentCoverId =
                                folders.find((f) => f.id === m.folder_id)
                                  ?.cover_media_id ?? null;
                              const isCurrent = currentCoverId === m.id;
                              const res = await setMediaFolderCover({
                                profileId,
                                folderId: m.folder_id!,
                                mediaId: isCurrent ? null : m.id,
                              });
                              if (!res.ok) {
                                setError(res.error);
                                return;
                              }
                              refresh();
                            }
                          : null
                      }
                      isCurrentCover={
                        m.folder_id !== null &&
                        (folders.find((f) => f.id === m.folder_id)
                          ?.cover_media_id ?? null) === m.id
                      }
                    />
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Overlay drag global discret */}
        <AnimatePresence>
          {dragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-white/30"
            />
          )}
        </AnimatePresence>
      </div>

      {/* === Modales === */}

      <CreateFolderModal
        open={createFolderOpen}
        parentName={
          createFolderState?.parentId
            ? (folders.find((f) => f.id === createFolderState.parentId)?.name ??
              null)
            : null
        }
        onClose={() => setCreateFolderState(null)}
        onSubmit={async (name) => {
          if (!createFolderState) return false;
          const res = await createMediaFolder({
            profileId,
            name,
            parentId: createFolderState.parentId,
          });
          if (!res.ok) {
            setError(res.error);
            return false;
          }
          setCreateFolderState(null);
          setSelection({ kind: "folder", id: res.folderId });
          refresh();
          return true;
        }}
      />

      <RenameFolderModal
        folder={renameFolderState}
        onClose={() => setRenameFolderState(null)}
        onSubmit={async (name) => {
          if (!renameFolderState) return false;
          const res = await renameMediaFolder({
            profileId,
            folderId: renameFolderState.id,
            name,
          });
          if (!res.ok) {
            setError(res.error);
            return false;
          }
          setRenameFolderState(null);
          refresh();
          return true;
        }}
      />

      <ConfirmDialog
        open={!!deleteFolderState}
        title={`Effacer «&nbsp;${deleteFolderState?.name ?? ""}&nbsp;» ?`}
        description="Les médias du dossier ne sont pas effacés : ils repassent en «&nbsp;Hors dossier&nbsp;»."
        confirmLabel="Effacer le dossier"
        tone="danger"
        pending={pending}
        onCancel={() => setDeleteFolderState(null)}
        onConfirm={async () => {
          if (!deleteFolderState) return;
          const res = await deleteMediaFolder({
            profileId,
            folderId: deleteFolderState.id,
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          if (
            selection.kind === "folder" &&
            selection.id === deleteFolderState.id
          ) {
            setSelection({ kind: "all" });
          }
          setDeleteFolderState(null);
          refresh();
        }}
      />

      <RenameMediaModal
        media={renameMediaState}
        onClose={() => setRenameMediaState(null)}
        onSubmit={async (filename) => {
          if (!renameMediaState) return false;
          const res = await renameClientMedia({
            profileId,
            mediaId: renameMediaState.id,
            filename,
          });
          if (!res.ok) {
            setError(res.error);
            return false;
          }
          setRenameMediaState(null);
          refresh();
          return true;
        }}
      />

      <GenerationModal
        media={generationState}
        onClose={() => setGenerationState(null)}
        onSubmit={async (prompt, model) => {
          if (!generationState) return false;
          return handleSetGeneration(generationState.id, prompt, model);
        }}
      />

      <MoveMediaModal
        media={moveMediaState}
        folders={folders}
        onClose={() => setMoveMediaState(null)}
        onSubmit={async (folderId) => {
          if (!moveMediaState) return false;
          const res = await moveMediaToFolder({
            profileId,
            mediaId: moveMediaState.id,
            folderId,
          });
          if (!res.ok) {
            setError(res.error);
            return false;
          }
          setMoveMediaState(null);
          refresh();
          return true;
        }}
      />

      <ConfirmDialog
        open={!!deleteMediaState}
        title="Effacer ce média ?"
        description={
          <>
            <span className="font-mono not-italic text-white/75">
              {deleteMediaState?.filename}
            </span>{" "}
            sera retiré du stockage. Les parchemins qui l&apos;utilisent en
            référence cassée.
          </>
        }
        confirmLabel="Effacer"
        tone="danger"
        pending={pending}
        onCancel={() => setDeleteMediaState(null)}
        onConfirm={async () => {
          if (!deleteMediaState) return;
          const res = await deleteClientMedia({
            profileId,
            mediaId: deleteMediaState.id,
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setDeleteMediaState(null);
          refresh();
        }}
      />

      <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />

      <CoverPickerModal
        folder={coverPickerFolder}
        items={items}
        onClose={() => setCoverPickerFolder(null)}
        onPick={async (mediaId) => {
          if (!coverPickerFolder) return;
          const res = await setMediaFolderCover({
            profileId,
            folderId: coverPickerFolder.id,
            mediaId,
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setCoverPickerFolder(null);
          refresh();
        }}
      />

      <AlertDialog
        open={!!error}
        title="Action impossible"
        description={error ?? ""}
        onClose={() => setError(null)}
      />

      {/* === Sélection multiple : action bar flottante + modales batch === */}
      <BatchActionBar
        count={selectedIds.size}
        allVisibleCount={filtered.length}
        pending={batchPending}
        onMove={() => setBatchMoveOpen(true)}
        onDelete={() => setBatchDeleteOpen(true)}
        onDownload={async () => {
          if (selectedIds.size === 0) return;
          setBatchPending(true);
          try {
            await downloadBatchAsZip(profileId, Array.from(selectedIds));
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Téléchargement ZIP impossible.",
            );
          } finally {
            setBatchPending(false);
          }
        }}
        onSelectAll={selectAllVisible}
        onClear={clearSelection}
      />

      <MoveBatchModal
        open={batchMoveOpen}
        count={selectedIds.size}
        folders={folders}
        pending={batchPending}
        onClose={() => setBatchMoveOpen(false)}
        onSubmit={async (folderId) => {
          setBatchPending(true);
          const res = await moveClientMediaBatch({
            profileId,
            mediaIds: Array.from(selectedIds),
            folderId,
          });
          setBatchPending(false);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setBatchMoveOpen(false);
          clearSelection();
          refresh();
        }}
      />

      <ConfirmDialog
        open={batchDeleteOpen}
        title={
          selectedIds.size === 1
            ? "Effacer le média sélectionné ?"
            : `Effacer ${selectedIds.size} médias sélectionnés ?`
        }
        description="Les fichiers seront retirés du stockage. Les parchemins qui les utilisent verront des références cassées."
        confirmLabel="Effacer"
        tone="danger"
        pending={batchPending}
        onCancel={() => setBatchDeleteOpen(false)}
        onConfirm={async () => {
          setBatchPending(true);
          const res = await deleteClientMediaBatch({
            profileId,
            mediaIds: Array.from(selectedIds),
          });
          setBatchPending(false);
          if (!res.ok) {
            setError(res.error);
            return;
          }
          setBatchDeleteOpen(false);
          clearSelection();
          refresh();
        }}
      />
    </div>
  );
}

// ============================================================================
// Sous-composants
// ============================================================================

function FolderRow({
  label,
  count,
  active,
  onClick,
  onRename,
  onDelete,
  /** URL d'aperçu (image désignée comme cover). */
  coverUrl,
  /** 0 = top-level, 1 = sous-dossier (indenté). */
  depth = 0,
  /** Optionnel : callback pour créer un sous-dossier (top-level seulement). */
  onCreateSub,
  /** Optionnel : callback pour ouvrir le picker d'image d'aperçu. */
  onPickCover,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  coverUrl?: string | null;
  depth?: 0 | 1;
  onCreateSub?: () => void;
  onPickCover?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "group flex items-center justify-between gap-2 rounded-md py-1.5 text-sm transition-colors",
        depth === 1 ? "ml-4 pl-2 pr-2" : "px-2",
        active
          ? "bg-white/[0.06] text-white"
          : "text-white/55 hover:bg-white/[0.03] hover:text-white/85",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        {/* Indent visuel pour un sous-dossier */}
        {depth === 1 && (
          <span
            aria-hidden
            className="inline-block h-px w-2 shrink-0 bg-white/15"
          />
        )}
        {/* Aperçu (cover) : thumbnail 18px en début de ligne, sinon spacer pour
            aligner les rows avec/sans aperçu. */}
        <span
          aria-hidden
          className={cn(
            "relative h-[18px] w-[18px] shrink-0 overflow-hidden rounded-[3px] border",
            coverUrl
              ? "border-white/10"
              : "border-dashed border-white/10 bg-white/[0.02]",
          )}
        >
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="shrink-0 font-mono text-[10px] text-white/35">
          {count}
        </span>
      </button>
      {(onRename || onDelete || onCreateSub || onPickCover) && hover && (
        <div className="flex items-center gap-2">
          {onCreateSub && (
            <button
              type="button"
              onClick={onCreateSub}
              aria-label="Créer un sous-dossier"
              title="Créer un sous-dossier"
              className="text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
            >
              +
            </button>
          )}
          {onPickCover && (
            <button
              type="button"
              onClick={onPickCover}
              aria-label="Choisir l'image d'aperçu"
              title="Choisir l'image d'aperçu"
              className="text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
            >
              ✦
            </button>
          )}
          {onRename && (
            <button
              type="button"
              onClick={onRename}
              aria-label="Renommer le dossier"
              className="text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Supprimer le dossier"
              className="text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-red-300/80"
            >
              ×
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function MediaTile({
  item,
  thumbBytes,
  menuOpen,
  selected,
  anySelected,
  personaOptions,
  currentPersonaName,
  onSetPersona,
  onMenuToggle,
  onPreview,
  onToggleSelect,
  onRename,
  onEditGeneration,
  onMove,
  onDelete,
  onDownload,
  onSetAsCover,
  isCurrentCover,
}: {
  item: MediaItem;
  /** Octets transférés du thumb AVIF/WebP via /_next/image, ou null si pas encore mesuré. */
  thumbBytes: number | null;
  menuOpen: boolean;
  selected: boolean;
  anySelected: boolean;
  /** null = média hors dossier "Personas" → ne pas afficher de select. */
  personaOptions: PersonaOption[] | null;
  currentPersonaName: string | null;
  onSetPersona: (personaId: string | null) => void;
  onMenuToggle: () => void;
  onPreview: () => void;
  onToggleSelect: (mode: "toggle" | "range") => void;
  onRename: () => void;
  onEditGeneration: () => void;
  onMove: () => void;
  onDelete: () => void;
  onDownload: () => void;
  /** null = action désactivée (média non-image ou hors dossier). */
  onSetAsCover: (() => void) | null;
  /** Vrai si ce média est déjà l'aperçu du dossier où il vit. */
  isCurrentCover: boolean;
}) {
  const img = isImage(item.mime_type);
  const vid = isVideo(item.mime_type);
  const aud = isAudio(item.mime_type);

  const handleTileClick = (e: React.MouseEvent) => {
    const meta = e.metaKey || e.ctrlKey;
    const shift = e.shiftKey;
    // Cmd/Ctrl ou Shift : sélection multiple en raccourci power-user.
    if (meta) {
      e.preventDefault();
      onToggleSelect("toggle");
      return;
    }
    if (shift) {
      e.preventDefault();
      onToggleSelect("range");
      return;
    }
    // Si une sélection est déjà active, un clic simple toggle (mode batch).
    if (anySelected) {
      e.preventDefault();
      onToggleSelect("toggle");
      return;
    }
    onPreview();
  };

  return (
    <li
      className={cn(
        "group relative flex flex-col gap-2",
        // Quand le menu est ouvert on hisse la tuile au-dessus des sœurs
        // sinon le dropdown est mangé par les vignettes voisines de la grille.
        menuOpen && "z-30",
      )}
    >
      <button
        type="button"
        onClick={handleTileClick}
        className={cn(
          "relative block aspect-square w-full overflow-hidden rounded-xl border bg-white/[0.02] transition-all",
          selected
            ? "border-white/80 ring-2 ring-white/40"
            : "border-white/10 hover:border-white/25",
        )}
      >
        {img && (
          <Image
            src={item.public_url}
            alt={item.filename}
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        )}
        {vid && (
          <>
            <video
              src={item.public_url}
              preload="metadata"
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-white/80 backdrop-blur-sm">
              Vidéo
            </span>
          </>
        )}
        {aud && (
          <>
            <div className="absolute inset-0 flex items-center justify-center text-cyan-200/60">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 18V6l9-2v12" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="15" cy="16" r="3" />
              </svg>
            </div>
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-white/80 backdrop-blur-sm">
              Audio
            </span>
          </>
        )}
        {!img && !vid && !aud && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.32em] text-white/40">
            {item.mime_type}
          </span>
        )}

        {/* Badge format — JPG / PNG / WEBP / SVG / GIF / AVIF / MP4 / MP3 …
            Toujours visible sur image, vidéo et audio. */}
        {(img || vid || aud) && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
            {formatLabel(item.mime_type, item.filename)}
          </span>
        )}

        {/* Checkbox de sélection — toujours visible quand une sélection
            existe, sinon apparaît au hover (group-hover). Clic dédié pour
            toggle sans déclencher le preview. */}
        <span
          role="checkbox"
          aria-checked={selected}
          aria-label={selected ? "Désélectionner" : "Sélectionner"}
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleSelect(e.shiftKey ? "range" : "toggle");
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect("toggle");
            }
          }}
          className={cn(
            "absolute left-2 top-2 z-10 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border bg-black/55 backdrop-blur-sm transition-all duration-200 ease-out",
            selected
              ? "border-white bg-white text-black opacity-100"
              : anySelected
                ? "border-white/55 text-transparent opacity-100 hover:border-white"
                : "border-white/45 text-transparent opacity-0 hover:border-white group-hover:opacity-100",
          )}
        >
          {selected && (
            <svg
              width="11"
              height="11"
              viewBox="0 0 11 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M2 5.5 L4.5 8 L9 3" />
            </svg>
          )}
        </span>
      </button>

      <div className="flex items-center justify-between gap-2 px-1">
        <span
          className="min-w-0 truncate font-mono text-[11px] text-white/55"
          title={item.filename}
        >
          {item.filename}
        </span>
        <div className="relative shrink-0" data-media-menu>
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
          >
            ⋯
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
                role="menu"
                className="absolute right-0 top-full z-20 mt-1 flex w-40 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
              >
                <MenuItem onClick={onRename}>Renommer</MenuItem>
                <MenuItem onClick={onEditGeneration}>Génération IA…</MenuItem>
                <MenuItem onClick={onMove}>Déplacer…</MenuItem>
                <MenuItem onClick={onDownload}>Télécharger</MenuItem>
                <MenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(item.public_url);
                    onMenuToggle();
                  }}
                >
                  Copier l'URL
                </MenuItem>
                {onSetAsCover && (
                  <MenuItem onClick={onSetAsCover}>
                    {isCurrentCover
                      ? "Retirer l'aperçu du dossier"
                      : "Désigner comme aperçu du dossier"}
                  </MenuItem>
                )}
                <div className="h-px bg-white/10" />
                <MenuItem onClick={onDelete} danger>
                  Supprimer
                </MenuItem>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <span className="flex flex-wrap items-baseline gap-x-2 px-1 font-mono text-[10px] text-white/30">
        <span>orig {formatSize(item.size_bytes)}</span>
        {isImage(item.mime_type) && (
          <span className="text-white/50">
            {thumbBytes != null
              ? `· thumb ${formatSize(thumbBytes)}`
              : "· thumb …"}
          </span>
        )}
        {item.generation_model && (
          <span
            className="min-w-0 truncate text-cyan-200/60"
            title={item.generation_prompt ?? undefined}
          >
            · {item.generation_model}
          </span>
        )}
      </span>

      {personaOptions !== null && (
        <PersonaTagSelect
          options={personaOptions}
          value={item.persona_id}
          currentName={currentPersonaName}
          onChange={onSetPersona}
        />
      )}
    </li>
  );
}

function FolderTile({
  folder,
  count,
  onClick,
  onPickCover,
}: {
  folder: MediaFolder;
  count: number;
  onClick: () => void;
  onPickCover?: () => void;
}) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onClick}
        className="relative flex aspect-square w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all group-hover:border-white/30"
      >
        {folder.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={folder.cover_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-white/30"
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Z" />
            </svg>
          </div>
        )}
        {/* Voile en bas pour la lisibilité du label sur les covers claires */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-white/80 backdrop-blur-sm">
          Dossier
        </span>
        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
          {count}
        </span>
        <span className="absolute inset-x-3 bottom-3 truncate text-left text-sm font-light text-white">
          {folder.name}
        </span>
      </button>
      {onPickCover && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPickCover();
          }}
          aria-label="Choisir l'image d'aperçu"
          title="Choisir l'image d'aperçu"
          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-[12px] text-white/85 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 hover:text-white group-hover:opacity-100"
        >
          ✦
        </button>
      )}
    </li>
  );
}

function PersonaTagSelect({
  options,
  value,
  currentName,
  onChange,
}: {
  options: PersonaOption[];
  value: string | null;
  currentName: string | null;
  onChange: (personaId: string | null) => void;
}) {
  if (options.length === 0) {
    return (
      <span className="block px-1 font-mono text-[10px] italic text-white/30">
        Aucun persona — créer dans /personas
      </span>
    );
  }
  return (
    <label className="flex items-center gap-2 px-1">
      <span className="shrink-0 text-[9px] uppercase tracking-[0.32em] text-white/35">
        Persona
      </span>
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : e.target.value)
        }
        aria-label={
          currentName ? `Persona : ${currentName}` : "Choisir un persona"
        }
        className={cn(
          "min-w-0 flex-1 cursor-pointer truncate border-0 border-b border-white/15 bg-transparent py-0.5 text-[11px] outline-none transition-colors hover:border-white/35 focus:border-white/45",
          value ? "text-white/85" : "text-white/45",
        )}
      >
        <option value="" className="bg-[#0a0a0a] text-white/55">
          — Aucun —
        </option>
        {options.map((p) => (
          <option key={p.id} value={p.id} className="bg-[#0a0a0a] text-white">
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function MenuItem({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-left text-[11px] uppercase tracking-[0.32em] transition-colors",
        danger
          ? "text-white/55 hover:bg-red-500/10 hover:text-red-300"
          : "text-white/55 hover:bg-white/[0.04] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

// ============================================================================
// Modales : create/rename folder, rename/move media, preview
// ============================================================================

function TextModal({
  open,
  title,
  label,
  initialValue,
  submitLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  label: string;
  initialValue: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (value: string) => Promise<boolean>;
}) {
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setSubmitting(false);
    }
  }, [open, initialValue]);

  // Échap → ferme (géré aussi par la Modal sous-jacente)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[88] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) onClose();
          }}
        >
          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!value.trim()) return;
              setSubmitting(true);
              const ok = await onSubmit(value.trim());
              if (!ok) setSubmitting(false);
            }}
            className="relative flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-[#0a0a0a] px-6 py-8 md:px-8 md:py-10"
          >
            <Eyebrow tracking="md" intensity="strong">
              {title}
            </Eyebrow>
            <Field label={label}>
              <input
                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={submitting}
                maxLength={80}
                className="w-full border-b border-white/15 bg-transparent py-2 text-base text-white outline-none transition-colors focus:border-white/45"
              />
            </Field>
            <div className="mt-2 flex items-center justify-end gap-6 border-t border-white/10 pt-6">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                pending={submitting}
                pendingLabel="En cours…"
              >
                {submitLabel}
              </Button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CreateFolderModal({
  open,
  parentName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  /** Nom du dossier parent si on crée un sous-dossier ; null pour top-level. */
  parentName: string | null;
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
}) {
  return (
    <TextModal
      open={open}
      title={
        parentName ? `Sous-dossier de « ${parentName} »` : "Nouveau dossier"
      }
      label="Nom du dossier"
      initialValue=""
      submitLabel="Créer"
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function RenameFolderModal({
  folder,
  onClose,
  onSubmit,
}: {
  folder: MediaFolder | null;
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
}) {
  return (
    <TextModal
      open={!!folder}
      title="Renommer le dossier"
      label="Nouveau nom"
      initialValue={folder?.name ?? ""}
      submitLabel="Enregistrer"
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function RenameMediaModal({
  media,
  onClose,
  onSubmit,
}: {
  media: MediaItem | null;
  onClose: () => void;
  onSubmit: (filename: string) => Promise<boolean>;
}) {
  return (
    <TextModal
      open={!!media}
      title="Renommer le média"
      label="Nom du fichier"
      initialValue={media?.filename ?? ""}
      submitLabel="Enregistrer"
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

// ============================================================================
// Provenance IA d'un média : prompt de génération + modèle
// ============================================================================

function GenerationModal({
  media,
  onClose,
  onSubmit,
}: {
  media: MediaItem | null;
  onClose: () => void;
  onSubmit: (prompt: string, model: string) => Promise<boolean>;
}) {
  const open = !!media;
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setPrompt(media?.generation_prompt ?? "");
      setModel(media?.generation_model ?? "");
      setSubmitting(false);
    }
  }, [open, media]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[88] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) onClose();
          }}
        >
          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              // Les deux champs peuvent être vidés : soumettre du vide efface
              // la provenance au lieu de bloquer.
              const ok = await onSubmit(prompt, model);
              if (!ok) setSubmitting(false);
            }}
            className="relative flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-white/10 bg-[#0a0a0a] px-6 py-8 md:px-8 md:py-10"
          >
            <Eyebrow tracking="md" intensity="strong">
              Génération IA
            </Eyebrow>
            <p className="-mt-2 min-w-0 truncate font-mono text-[11px] text-white/35">
              {media?.filename}
            </p>
            <Field label="Prompt">
              <textarea
                autoFocus
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={submitting}
                rows={6}
                maxLength={4000}
                placeholder="Le prompt qui a servi à générer ce média…"
                className="w-full resize-y rounded-lg border border-white/15 bg-white/[0.02] px-3 py-2 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/45"
              />
            </Field>
            <Field label="Modèle">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={submitting}
                maxLength={120}
                placeholder="Midjourney v7, Nano Banana Pro, Seedream 4…"
                className="w-full border-b border-white/15 bg-transparent py-2 text-base text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/45"
              />
            </Field>
            <div className="mt-2 flex items-center justify-end gap-6 border-t border-white/10 pt-6">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                pending={submitting}
                pendingLabel="En cours…"
              >
                Enregistrer
              </Button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MoveMediaModal({
  media,
  folders,
  onClose,
  onSubmit,
}: {
  media: MediaItem | null;
  folders: MediaFolder[];
  onClose: () => void;
  onSubmit: (folderId: string | null) => Promise<boolean>;
}) {
  const [submitting, setSubmitting] = useState<string | "loose" | null>(null);
  const open = !!media;

  useEffect(() => {
    if (open) setSubmitting(null);
  }, [open]);

  const currentFolderId = media?.folder_id ?? null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[88] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="relative flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-[#0a0a0a] px-6 py-8 md:px-8 md:py-10"
          >
            <Eyebrow tracking="md" intensity="strong">
              Déplacer le média
            </Eyebrow>
            <p className="font-mono text-xs text-white/55">{media?.filename}</p>
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              <MoveTarget
                label="Hors dossier"
                disabled={currentFolderId === null || submitting !== null}
                pending={submitting === "loose"}
                onClick={async () => {
                  setSubmitting("loose");
                  const ok = await onSubmit(null);
                  if (!ok) setSubmitting(null);
                }}
              />
              {folders.length > 0 && (
                <li className="my-1 h-px bg-white/10" aria-hidden />
              )}
              {flattenFolderTree(folders).map((f) => (
                <MoveTarget
                  key={f.id}
                  label={f.label}
                  isChild={f.isChild}
                  disabled={currentFolderId === f.id || submitting !== null}
                  pending={submitting === f.id}
                  onClick={async () => {
                    setSubmitting(f.id);
                    const ok = await onSubmit(f.id);
                    if (!ok) setSubmitting(null);
                  }}
                />
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-end border-t border-white/10 pt-6">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={submitting !== null}
              >
                Fermer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MoveTarget({
  label,
  disabled,
  pending,
  onClick,
  isChild = false,
}: {
  label: string;
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
  isChild?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
          disabled
            ? "text-white/25"
            : "text-white/65 hover:bg-white/[0.04] hover:text-white",
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {isChild && (
            <span aria-hidden className="shrink-0 text-white/30">
              ↳
            </span>
          )}
          <span className="truncate">{label}</span>
        </span>
        {pending && (
          <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
            …
          </span>
        )}
      </button>
    </li>
  );
}

function PreviewModal({
  item,
  onClose,
}: {
  item: MediaItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm md:p-10"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="relative flex max-h-full max-w-5xl flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="min-w-0 truncate font-mono text-xs text-white/55">
                  {item.filename}
                </span>
                <span className="shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">
                  {formatLabel(item.mime_type, item.filename)}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
              >
                Fermer
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              {isImage(item.mime_type) ? (
                // Preview plein écran : on sert l'original (sans transcodage AVIF)
                // pour permettre l'inspection pixel-perfect d'un livrable.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.public_url}
                  alt={item.filename}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              ) : isVideo(item.mime_type) ? (
                <video
                  src={item.public_url}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-full"
                />
              ) : isAudio(item.mime_type) ? (
                <div className="flex flex-col items-center gap-6 px-12 py-16">
                  <div className="text-cyan-200/55">
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M9 18V6l9-2v12" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="15" cy="16" r="3" />
                    </svg>
                  </div>
                  <audio
                    src={item.public_url}
                    controls
                    autoPlay
                    className="w-full max-w-md"
                  />
                </div>
              ) : (
                <p className="px-6 py-12 text-center text-sm text-white/55">
                  Aperçu non disponible pour ce format.
                </p>
              )}
            </div>
            {(item.generation_prompt || item.generation_model) && (
              <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
                {item.generation_model && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/70">
                    {item.generation_model}
                  </p>
                )}
                {item.generation_prompt && (
                  <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-white/60">
                    {item.generation_prompt}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Picker d'image d'aperçu pour un dossier
// ============================================================================

function CoverPickerModal({
  folder,
  items,
  onClose,
  onPick,
}: {
  folder: MediaFolder | null;
  items: MediaItem[];
  onClose: () => void;
  /** mediaId = null pour retirer l'aperçu actuel. */
  onPick: (mediaId: string | null) => Promise<void> | void;
}) {
  const [submitting, setSubmitting] = useState<string | "clear" | null>(null);
  const open = !!folder;

  useEffect(() => {
    if (open) setSubmitting(null);
  }, [open]);

  // Seules les images peuvent servir d'aperçu. Pour un sous-dossier
  // (parent_id !== null), on restreint le picker aux images qui sont
  // directement dans ce sous-dossier — l'aperçu doit refléter le contenu.
  // Pour un dossier top-level, on laisse tout le catalogue image du client.
  const images = useMemo(() => {
    const all = items.filter((i) => i.mime_type.startsWith("image/"));
    if (!folder) return all;
    if (folder.parent_id !== null) {
      return all.filter((i) => i.folder_id === folder.id);
    }
    return all;
  }, [items, folder]);

  return (
    <AnimatePresence>
      {open && folder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[88] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="relative flex w-full max-w-3xl flex-col gap-5 rounded-2xl border border-white/10 bg-[#0a0a0a] px-6 py-8 md:px-8 md:py-10"
          >
            <div className="flex flex-col gap-2">
              <Eyebrow tracking="md" intensity="strong">
                Image d&apos;aperçu
              </Eyebrow>
              <p className="font-mono text-xs text-white/55">
                Dossier «&nbsp;{folder.name}&nbsp;»
              </p>
            </div>

            {images.length === 0 ? (
              <p className="py-12 text-center font-serif text-base italic text-white/35">
                {folder.parent_id !== null
                  ? "Aucune image dans ce sous-dossier. Téléverse ou déplace une image ici pour pouvoir la désigner comme aperçu."
                  : "Aucune image dans la médiathèque pour le moment."}
              </p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <ul className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
                  {/* Tuile "Aucun aperçu" — n'apparaît que si un cover est déjà désigné */}
                  {folder.cover_media_id && (
                    <li>
                      <button
                        type="button"
                        onClick={async () => {
                          setSubmitting("clear");
                          await onPick(null);
                        }}
                        disabled={submitting !== null}
                        className={cn(
                          "relative flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-white/15 bg-white/[0.02] p-2 text-center text-[10px] uppercase tracking-[0.32em] text-white/50 transition-colors hover:border-white/35 hover:text-white",
                          submitting === "clear" && "opacity-60",
                        )}
                      >
                        <span className="text-2xl text-white/30">∅</span>
                        <span>
                          {submitting === "clear" ? "…" : "Aucun aperçu"}
                        </span>
                      </button>
                    </li>
                  )}
                  {images.map((img) => {
                    const isCurrent = folder.cover_media_id === img.id;
                    const isPending = submitting === img.id;
                    return (
                      <li key={img.id}>
                        <button
                          type="button"
                          onClick={async () => {
                            if (isCurrent) {
                              onClose();
                              return;
                            }
                            setSubmitting(img.id);
                            await onPick(img.id);
                          }}
                          disabled={submitting !== null}
                          title={img.filename}
                          className={cn(
                            "relative block aspect-square w-full overflow-hidden rounded-md border bg-white/[0.02] transition-all",
                            isCurrent
                              ? "border-white/80 ring-2 ring-white/40"
                              : "border-white/10 hover:border-white/45",
                            submitting !== null &&
                              !isPending &&
                              !isCurrent &&
                              "opacity-40",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.public_url}
                            alt={img.filename}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                          {isCurrent && (
                            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[9px] uppercase tracking-[0.32em] text-white/90 backdrop-blur-sm">
                              Actuel
                            </span>
                          )}
                          {isPending && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[10px] uppercase tracking-[0.32em] text-white">
                              …
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="mt-2 flex items-center justify-end border-t border-white/10 pt-6">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={submitting !== null}
              >
                Fermer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Sélection multiple — action bar + modale de déplacement batch
// ============================================================================

function BatchActionBar({
  count,
  allVisibleCount,
  pending,
  onMove,
  onDelete,
  onDownload,
  onSelectAll,
  onClear,
}: {
  count: number;
  allVisibleCount: number;
  pending: boolean;
  onMove: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const allSelected = count > 0 && count === allVisibleCount;
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4"
          role="region"
          aria-label="Actions sur la sélection"
        >
          <div
            className={cn(
              "pointer-events-auto flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-white/[0.12] px-5 py-3.5",
              "bg-gradient-to-br from-white/[0.08] via-[#0a0a0a]/95 to-[#0a0a0a]/95 backdrop-blur-2xl",
              "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85),inset_1px_1px_0_0_rgba(255,255,255,0.06)]",
            )}
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/85">
              <span className="font-mono not-italic">{count}</span>
              <span className="ml-1.5 text-white/45">
                sélectionné{count > 1 ? "s" : ""}
              </span>
            </span>

            <span aria-hidden className="inline-block h-3 w-px bg-white/15" />

            {!allSelected && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-[10px] uppercase tracking-[0.32em] text-white/45 transition-colors hover:text-white"
              >
                Tout sélectionner ({allVisibleCount})
              </button>
            )}

            <button
              type="button"
              onClick={onMove}
              disabled={pending}
              className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/85 transition-colors hover:text-white disabled:opacity-50"
            >
              <span>Déplacer dans…</span>
              <span
                aria-hidden
                className="inline-block h-px w-4 bg-current transition-all duration-500 group-hover:w-10"
              />
            </button>

            <button
              type="button"
              onClick={onDownload}
              disabled={pending}
              className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/85 transition-colors hover:text-white disabled:opacity-50"
            >
              <span>{pending ? "ZIP en cours…" : "Télécharger (ZIP)"}</span>
              <span
                aria-hidden
                className="inline-block h-px w-4 bg-current transition-all duration-500 group-hover:w-10"
              />
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-red-300/85 disabled:opacity-50"
            >
              <span>Supprimer</span>
              <span
                aria-hidden
                className="inline-block h-px w-4 bg-current transition-all duration-500 group-hover:w-10"
              />
            </button>

            <span aria-hidden className="inline-block h-3 w-px bg-white/15" />

            <button
              type="button"
              onClick={onClear}
              className="text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white"
            >
              Effacer
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MoveBatchModal({
  open,
  count,
  folders,
  pending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  count: number;
  folders: MediaFolder[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (folderId: string | null) => void | Promise<void>;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[88] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm md:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="relative flex w-full max-w-md flex-col gap-6 rounded-2xl border border-white/10 bg-[#0a0a0a] px-6 py-8 md:px-8 md:py-10"
          >
            <Eyebrow tracking="md" intensity="strong">
              Déplacer la sélection
            </Eyebrow>
            <p className="font-serif text-sm italic text-white/55">
              {count} média{count > 1 ? "s" : ""} sélectionné
              {count > 1 ? "s" : ""}
            </p>
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              <MoveTarget
                label="Hors dossier"
                disabled={pending}
                pending={false}
                onClick={() => onSubmit(null)}
              />
              {folders.length > 0 && (
                <li className="my-1 h-px bg-white/10" aria-hidden />
              )}
              {flattenFolderTree(folders).map((f) => (
                <MoveTarget
                  key={f.id}
                  label={f.label}
                  isChild={f.isChild}
                  disabled={pending}
                  pending={false}
                  onClick={() => onSubmit(f.id)}
                />
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-end border-t border-white/10 pt-6">
              <Button variant="ghost" onClick={onClose} disabled={pending}>
                {pending ? "Déplacement…" : "Fermer"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
