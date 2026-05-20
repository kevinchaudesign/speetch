"use client";

import {
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
  setMediaPersona,
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
};

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
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameFolderState, setRenameFolderState] = useState<MediaFolder | null>(
    null,
  );
  const [deleteFolderState, setDeleteFolderState] = useState<MediaFolder | null>(
    null,
  );
  const [renameMediaState, setRenameMediaState] = useState<MediaItem | null>(
    null,
  );
  const [deleteMediaState, setDeleteMediaState] = useState<MediaItem | null>(
    null,
  );
  const [moveMediaState, setMoveMediaState] = useState<MediaItem | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    if (selection.kind === "all") return items;
    if (selection.kind === "loose")
      return items.filter((m) => m.folder_id === null);
    return items.filter((m) => m.folder_id === selection.id);
  }, [items, selection]);

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
        createFolderOpen
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
      const targetFolderId =
        selection.kind === "folder" ? selection.id : null;
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
                onClick={() => setCreateFolderOpen(true)}
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
              {folders.map((f) => (
                <FolderRow
                  key={f.id}
                  label={f.name}
                  count={counts.get(f.id) ?? 0}
                  active={
                    selection.kind === "folder" && selection.id === f.id
                  }
                  onClick={() => setSelection({ kind: "folder", id: f.id })}
                  onRename={() => setRenameFolderState(f)}
                  onDelete={() => setDeleteFolderState(f)}
                />
              ))}
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
                  Images 20 Mo · vidéos 200 Mo
                </span>
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/*"
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

            {/* Grille */}
            {filtered.length === 0 ? (
              <p className="py-12 text-center font-serif text-base italic text-white/35">
                {selection.kind === "all"
                  ? "Aucun média pour le moment."
                  : selection.kind === "loose"
                    ? "Aucun média hors dossier."
                    : "Ce dossier est vide."}
              </p>
            ) : (
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
                      onMove={() => {
                        setOpenMenuId(null);
                        setMoveMediaState(m);
                      }}
                      onDelete={() => {
                        setOpenMenuId(null);
                        setDeleteMediaState(m);
                      }}
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
        onClose={() => setCreateFolderOpen(false)}
        onSubmit={async (name) => {
          const res = await createMediaFolder({ profileId, name });
          if (!res.ok) {
            setError(res.error);
            return false;
          }
          setCreateFolderOpen(false);
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
        title={`Supprimer « ${deleteFolderState?.name ?? ""} » ?`}
        description="Les médias du dossier ne sont pas supprimés : ils repassent en « Hors dossier »."
        confirmLabel="Supprimer le dossier"
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
        title="Supprimer ce média ?"
        description={
          <>
            <span className="font-mono not-italic text-white/75">
              {deleteMediaState?.filename}
            </span>{" "}
            sera retiré du stockage. Les pages qui l'utilisent en référence
            cassée.
          </>
        }
        confirmLabel="Supprimer"
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

      <PreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
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
        onMove={() => setBatchMoveOpen(true)}
        onDelete={() => setBatchDeleteOpen(true)}
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
            ? "Supprimer le média sélectionné ?"
            : `Supprimer ${selectedIds.size} médias sélectionnés ?`
        }
        description="Les fichiers seront retirés du stockage. Les pages qui les utilisent verront des références cassées."
        confirmLabel="Supprimer"
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
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <li
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-white/[0.06] text-white"
          : "text-white/55 hover:bg-white/[0.03] hover:text-white/85",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 font-mono text-[10px] text-white/35">
          {count}
        </span>
      </button>
      {(onRename || onDelete) && hover && (
        <div className="flex items-center gap-2">
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
  onMove,
  onDelete,
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
  onMove: () => void;
  onDelete: () => void;
}) {
  const img = isImage(item.mime_type);
  const vid = isVideo(item.mime_type);

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
        {!img && !vid && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.32em] text-white/40">
            {item.mime_type}
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
                : "border-white/45 text-transparent opacity-0 group-hover:opacity-100 hover:border-white",
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
                <MenuItem onClick={onMove}>Déplacer…</MenuItem>
                <MenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(item.public_url);
                    onMenuToggle();
                  }}
                >
                  Copier l'URL
                </MenuItem>
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
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
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
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={submitting}
              >
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
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
}) {
  return (
    <TextModal
      open={open}
      title="Nouveau dossier"
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
            <p className="font-mono text-xs text-white/55">
              {media?.filename}
            </p>
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
              {folders.map((f) => (
                <MoveTarget
                  key={f.id}
                  label={f.name}
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
}: {
  label: string;
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
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
        <span className="truncate">{label}</span>
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
              <span className="min-w-0 truncate font-mono text-xs text-white/55">
                {item.filename}
              </span>
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
              ) : (
                <p className="px-6 py-12 text-center text-sm text-white/55">
                  Aperçu non disponible pour ce format.
                </p>
              )}
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
  onMove,
  onDelete,
  onSelectAll,
  onClear,
}: {
  count: number;
  allVisibleCount: number;
  onMove: () => void;
  onDelete: () => void;
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
              className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/85 transition-colors hover:text-white"
            >
              <span>Déplacer dans…</span>
              <span
                aria-hidden
                className="inline-block h-px w-4 bg-current transition-all duration-500 group-hover:w-10"
              />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-red-300/85"
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
              {folders.map((f) => (
                <MoveTarget
                  key={f.id}
                  label={f.name}
                  disabled={pending}
                  pending={false}
                  onClick={() => onSubmit(f.id)}
                />
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-end border-t border-white/10 pt-6">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={pending}
              >
                {pending ? "Déplacement…" : "Fermer"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
