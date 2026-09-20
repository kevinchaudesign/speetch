"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import { Button, Chip, ConfirmDialog, Hairline, StatusBadge } from "@/lib/ds";
import {
  CUSTOM_TEMPLATE_ID,
  RAW_HTML_VIRTUAL_TEMPLATE_ID,
  getPageTemplate,
} from "@/lib/page-templates";
import {
  createProjectLot,
  deleteProjectLot,
  renameProjectLot,
  reorderLotItems,
  reorderProjectLots,
  setContextLot,
  setPageLot,
} from "../actions";
import { DetachPageButton } from "./detach-page-button";
import { useClientSegment } from "@/lib/admin/use-client-segment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BoardLot = {
  id: string;
  name: string | null;
  position: number;
};

export type BoardPage = {
  id: string;
  name: string;
  slug: string;
  template_id: string;
  position: number;
  is_published: boolean;
  created_at: string;
  lot_id: string | null;
};

export type BoardNote = {
  id: string;
  title: string;
  slug: string;
  position: number;
  is_published: boolean;
  source_kind: "upload" | "url" | "empty";
  created_at: string;
  lot_id: string | null;
};

// Union pour les items affichés dans la liste d'un lot (pages + notes
// mélangées). On garde la donnée originale par référence pour ne pas
// dupliquer ; le kind permet de router vers le bon row component.
type LotItem =
  | { kind: "page"; data: BoardPage }
  | { kind: "note"; data: BoardNote };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function lotLabel(lot: BoardLot, index: number): string {
  const base = `Lot ${index + 1}`;
  return lot.name ? `${base} · ${lot.name}` : base;
}

// ---------------------------------------------------------------------------
// Main board
// ---------------------------------------------------------------------------

export function ProjectBoard({
  profileId,
  projectId,
  initialLots,
  initialPages,
  initialNotes,
  dbTemplateLabels,
}: {
  profileId: string;
  projectId: string;
  initialLots: BoardLot[];
  initialPages: BoardPage[];
  initialNotes: BoardNote[];
  dbTemplateLabels: Record<string, string>;
}) {
  const [lots, setLots] = useState<BoardLot[]>(initialLots);
  const [pages, setPages] = useState<BoardPage[]>(initialPages);
  const [notes, setNotes] = useState<BoardNote[]>(initialNotes);
  const [error, setError] = useState<string | null>(null);

  // Resync sur re-fetch parent (router.refresh, navigation, suppression…).
  useEffect(() => setLots(initialLots), [initialLots]);
  useEffect(() => setPages(initialPages), [initialPages]);
  useEffect(() => setNotes(initialNotes), [initialNotes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Construit la liste unifiée d'un lot (ou null = "Hors lot") : pages et
  // notes mélangées, triées par leur `position` (ce compteur est désormais
  // partagé entre pages et notes après chaque drag — cf. action serveur
  // reorderLotItems).
  function buildLotItems(lotId: string | null): LotItem[] {
    const items: LotItem[] = [];
    for (const p of pages) {
      if ((p.lot_id ?? null) === lotId) {
        items.push({ kind: "page", data: p });
      }
    }
    for (const n of notes) {
      if ((n.lot_id ?? null) === lotId) {
        items.push({ kind: "note", data: n });
      }
    }
    items.sort((a, b) => {
      const ap = a.data.position;
      const bp = b.data.position;
      if (ap !== bp) return ap - bp;
      // Tiebreaker : ordre stable pages d'abord pour limiter les sauts
      // visuels quand deux items partagent la même position (cas des
      // données pré-feature où chaque table avait son propre compteur).
      if (a.kind !== b.kind) return a.kind === "page" ? -1 : 1;
      return 0;
    });
    return items;
  }

  function dndKey(item: LotItem): string {
    return `${item.kind}:${item.data.id}`;
  }

  // ---- Drag handlers ----

  function handleLotDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = lots.findIndex((l) => l.id === active.id);
    const newIndex = lots.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const previous = lots;
    const reordered = arrayMove(lots, oldIndex, newIndex);
    setLots(reordered);
    setError(null);
    startTransition(async () => {
      const res = await reorderProjectLots({
        profileId,
        projectId,
        lotIds: reordered.map((l) => l.id),
      });
      if (!res.ok) {
        setError(res.error);
        setLots(previous);
      }
    });
  }

  function handleLotItemsDragEnd(lotId: string | null, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sectionItems = buildLotItems(lotId);
    const oldIndex = sectionItems.findIndex((it) => dndKey(it) === active.id);
    const newIndex = sectionItems.findIndex((it) => dndKey(it) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(sectionItems, oldIndex, newIndex);

    // Renumérote les positions au sein du lot : compteur partagé entre
    // pages et notes pour que le tri par position dans la vue produise
    // bien l'ordre désiré.
    const previousPages = pages;
    const previousNotes = notes;
    const newPages = pages.map((p) => {
      if ((p.lot_id ?? null) !== lotId) return p;
      const idx = reordered.findIndex(
        (it) => it.kind === "page" && it.data.id === p.id,
      );
      return idx >= 0 ? { ...p, position: idx } : p;
    });
    const newNotes = notes.map((n) => {
      if ((n.lot_id ?? null) !== lotId) return n;
      const idx = reordered.findIndex(
        (it) => it.kind === "note" && it.data.id === n.id,
      );
      return idx >= 0 ? { ...n, position: idx } : n;
    });
    setPages(newPages);
    setNotes(newNotes);
    setError(null);

    startTransition(async () => {
      const res = await reorderLotItems({
        profileId,
        projectId,
        lotId,
        items: reordered.map((it) => ({ kind: it.kind, id: it.data.id })),
      });
      if (!res.ok) {
        setError(res.error);
        setPages(previousPages);
        setNotes(previousNotes);
      }
    });
  }

  // ---- Lot CRUD ----

  function handleCreateLot(name: string | null) {
    const previous = lots;
    setError(null);
    startTransition(async () => {
      const res = await createProjectLot({ profileId, projectId, name });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const newLot: BoardLot = {
        id: res.lotId,
        name,
        position: previous.length,
      };
      setLots([...previous, newLot]);
    });
  }

  function handleRenameLot(lotId: string, name: string | null) {
    const previous = lots;
    setLots(previous.map((l) => (l.id === lotId ? { ...l, name } : l)));
    setError(null);
    startTransition(async () => {
      const res = await renameProjectLot({
        profileId,
        projectId,
        lotId,
        name,
      });
      if (!res.ok) {
        setError(res.error);
        setLots(previous);
      }
    });
  }

  function handleDeleteLot(lotId: string) {
    const previous = lots;
    const previousPages = pages;
    const previousNotes = notes;
    setLots(previous.filter((l) => l.id !== lotId));
    setPages(
      pages.map((p) => (p.lot_id === lotId ? { ...p, lot_id: null } : p)),
    );
    setNotes(
      notes.map((n) => (n.lot_id === lotId ? { ...n, lot_id: null } : n)),
    );
    setError(null);
    startTransition(async () => {
      const res = await deleteProjectLot({ profileId, projectId, lotId });
      if (!res.ok) {
        setError(res.error);
        setLots(previous);
        setPages(previousPages);
        setNotes(previousNotes);
      }
    });
  }

  // ---- Item → lot move ----

  function handlePageLotChange(pageId: string, lotId: string | null) {
    const previous = pages;
    setPages(pages.map((p) => (p.id === pageId ? { ...p, lot_id: lotId } : p)));
    setError(null);
    startTransition(async () => {
      const res = await setPageLot({ profileId, projectId, pageId, lotId });
      if (!res.ok) {
        setError(res.error);
        setPages(previous);
      }
    });
  }

  function handleNoteLotChange(noteId: string, lotId: string | null) {
    const previous = notes;
    setNotes(notes.map((n) => (n.id === noteId ? { ...n, lot_id: lotId } : n)));
    setError(null);
    startTransition(async () => {
      const res = await setContextLot({
        profileId,
        projectId,
        contextId: noteId,
        lotId,
      });
      if (!res.ok) {
        setError(res.error);
        setNotes(previous);
      }
    });
  }

  // ---- Rendering ----

  return (
    <div className="flex flex-col gap-10">
      {error && (
        <p className="border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleLotDragEnd}
      >
        <SortableContext
          items={lots.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-10">
            {lots.map((lot, index) => (
              <SortableLotSection
                key={lot.id}
                lot={lot}
                index={index}
                lots={lots}
                items={buildLotItems(lot.id)}
                profileId={profileId}
                projectId={projectId}
                dbTemplateLabels={dbTemplateLabels}
                sensors={sensors}
                onRename={handleRenameLot}
                onDelete={handleDeleteLot}
                onItemsDragEnd={(event) => handleLotItemsDragEnd(lot.id, event)}
                onPageLotChange={handlePageLotChange}
                onNoteLotChange={handleNoteLotChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <OrphanSection
        lots={lots}
        items={buildLotItems(null)}
        profileId={profileId}
        projectId={projectId}
        dbTemplateLabels={dbTemplateLabels}
        sensors={sensors}
        onItemsDragEnd={(event) => handleLotItemsDragEnd(null, event)}
        onPageLotChange={handlePageLotChange}
        onNoteLotChange={handleNoteLotChange}
      />

      <CreateLotForm onCreate={handleCreateLot} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lot section (sortable card containing pages + notes lists)
// ---------------------------------------------------------------------------

function SortableLotSection({
  lot,
  index,
  lots,
  items,
  profileId,
  projectId,
  dbTemplateLabels,
  sensors,
  onRename,
  onDelete,
  onItemsDragEnd,
  onPageLotChange,
  onNoteLotChange,
}: {
  lot: BoardLot;
  index: number;
  lots: BoardLot[];
  items: LotItem[];
  profileId: string;
  projectId: string;
  dbTemplateLabels: Record<string, string>;
  sensors: ReturnType<typeof useSensors>;
  onRename: (lotId: string, name: string | null) => void;
  onDelete: (lotId: string) => void;
  onItemsDragEnd: (event: DragEndEvent) => void;
  onPageLotChange: (pageId: string, lotId: string | null) => void;
  onNoteLotChange: (noteId: string, lotId: string | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lot.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [nameDraft, setNameDraft] = useState(lot.name ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setNameDraft(lot.name ?? ""), [lot.name]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commitRename() {
    const trimmed = nameDraft.trim();
    const next = trimmed.length === 0 ? null : trimmed;
    setEditing(false);
    if ((lot.name ?? null) !== next) {
      onRename(lot.id, next);
    }
  }

  const label = lotLabel(lot, index);

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6 ${
        isDragging ? "z-10 opacity-60" : ""
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            aria-label={`Réordonner ${label}`}
            className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-white/30 transition-colors hover:text-white/70 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <DragDots />
          </button>

          {editing ? (
            <input
              ref={inputRef}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === "Escape") {
                  setNameDraft(lot.name ?? "");
                  setEditing(false);
                }
              }}
              placeholder="Nom optionnel"
              maxLength={80}
              className="min-w-0 flex-1 border-b border-white/30 bg-transparent pb-1 font-sans text-base font-light text-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-w-0 flex-1 text-left text-base font-light text-[#F5F5F7] transition-colors hover:text-white"
              title="Cliquer pour renommer"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/40">
                Lot {String(index + 1).padStart(2, "0")}
              </span>
              {lot.name && <span className="ml-3 font-sans">· {lot.name}</span>}
              {!lot.name && (
                <span className="ml-3 font-serif italic text-white/30">
                  + ajouter un nom
                </span>
              )}
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-red-300/80"
          >
            Supprimer
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-2 pl-8">
        <UnifiedItemList
          items={items}
          lots={lots}
          profileId={profileId}
          projectId={projectId}
          dbTemplateLabels={dbTemplateLabels}
          sensors={sensors}
          onDragEnd={onItemsDragEnd}
          onPageLotChange={onPageLotChange}
          onNoteLotChange={onNoteLotChange}
          emptyLabel="Aucun élément dans ce lot."
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        tone="danger"
        title={`Effacer ${label} ?`}
        description={
          items.length > 0
            ? `Les ${items.length} élément${
                items.length > 1 ? "s" : ""
              } rattaché${
                items.length > 1 ? "s" : ""
              } repasseront en «&nbsp;Hors lot&nbsp;» — rien n'est effacé.`
            : "Aucun élément n'y est rattaché — l'effacement est sans effet collatéral."
        }
        confirmLabel="Effacer"
        cancelLabel="Annuler"
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete(lot.id);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Orphan section (items not in any lot)
// ---------------------------------------------------------------------------

function OrphanSection({
  lots,
  items,
  profileId,
  projectId,
  dbTemplateLabels,
  sensors,
  onItemsDragEnd,
  onPageLotChange,
  onNoteLotChange,
}: {
  lots: BoardLot[];
  items: LotItem[];
  profileId: string;
  projectId: string;
  dbTemplateLabels: Record<string, string>;
  sensors: ReturnType<typeof useSensors>;
  onItemsDragEnd: (event: DragEndEvent) => void;
  onPageLotChange: (pageId: string, lotId: string | null) => void;
  onNoteLotChange: (noteId: string, lotId: string | null) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-5 border-t border-white/10 pt-8">
      <header className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/40">
          Hors lot
        </span>
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/25">
          {items.length} élément{items.length > 1 ? "s" : ""}
        </span>
      </header>

      <div className="flex flex-col gap-2 pl-8">
        <UnifiedItemList
          items={items}
          lots={lots}
          profileId={profileId}
          projectId={projectId}
          dbTemplateLabels={dbTemplateLabels}
          sensors={sensors}
          onDragEnd={onItemsDragEnd}
          onPageLotChange={onPageLotChange}
          onNoteLotChange={onNoteLotChange}
          emptyLabel={null}
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Unified sortable list of items (pages + notes mélangées)
// ---------------------------------------------------------------------------

type SortableRenderArg = {
  setNodeRef: (el: HTMLElement | null) => void;
  style: React.CSSProperties;
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: Record<string, (event: React.SyntheticEvent) => void> | undefined;
  isDragging: boolean;
};

function unifiedDndKey(item: LotItem): string {
  return `${item.kind}:${item.data.id}`;
}

function UnifiedItemList({
  items,
  lots,
  profileId,
  projectId,
  dbTemplateLabels,
  sensors,
  onDragEnd,
  onPageLotChange,
  onNoteLotChange,
  emptyLabel,
}: {
  items: LotItem[];
  lots: BoardLot[];
  profileId: string;
  projectId: string;
  dbTemplateLabels: Record<string, string>;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (event: DragEndEvent) => void;
  onPageLotChange: (pageId: string, lotId: string | null) => void;
  onNoteLotChange: (noteId: string, lotId: string | null) => void;
  emptyLabel: string | null;
}) {
  if (items.length === 0) {
    if (!emptyLabel) return null;
    return (
      <p className="font-serif text-sm italic text-white/30">{emptyLabel}</p>
    );
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={items.map((it) => unifiedDndKey(it))}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col">
          {items.map((it) => (
            <SortableShell key={unifiedDndKey(it)} id={unifiedDndKey(it)}>
              {(sortable) =>
                it.kind === "page" ? (
                  <SortablePageRow
                    page={it.data}
                    lots={lots}
                    profileId={profileId}
                    projectId={projectId}
                    dbTemplateLabel={dbTemplateLabels[it.data.template_id]}
                    onLotChange={onPageLotChange}
                    sortable={sortable}
                  />
                ) : (
                  <SortableNoteRow
                    note={it.data}
                    lots={lots}
                    onLotChange={onNoteLotChange}
                    sortable={sortable}
                  />
                )
              }
            </SortableShell>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableShell({
  id,
  children,
}: {
  id: string;
  children: (sortable: SortableRenderArg) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <>
      {children({
        setNodeRef,
        style,
        attributes,
        listeners: listeners as
          | Record<string, (event: React.SyntheticEvent) => void>
          | undefined,
        isDragging,
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page row
// ---------------------------------------------------------------------------

function SortablePageRow({
  page,
  lots,
  profileId,
  projectId,
  dbTemplateLabel,
  onLotChange,
  sortable,
}: {
  page: BoardPage;
  lots: BoardLot[];
  profileId: string;
  projectId: string;
  dbTemplateLabel: string | undefined;
  onLotChange: (pageId: string, lotId: string | null) => void;
  sortable: SortableRenderArg;
}) {
  const clientSlug = useClientSegment();
  const codeTemplate = getPageTemplate(page.template_id);
  const isDetached = page.template_id === CUSTOM_TEMPLATE_ID;
  const isRawHtmlDirect = page.template_id === RAW_HTML_VIRTUAL_TEMPLATE_ID;
  const templateLabel = isDetached
    ? "Détachée"
    : isRawHtmlDirect
      ? "Reproduction fidèle"
      : (codeTemplate?.label ?? dbTemplateLabel ?? null);

  return (
    <li
      ref={sortable.setNodeRef as (el: HTMLLIElement | null) => void}
      style={sortable.style}
      className={`flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b border-white/5 py-5 last:border-b-0 ${
        sortable.isDragging ? "z-10 bg-white/[0.02] opacity-60" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <button
          type="button"
          aria-label={`Réordonner « ${page.name} »`}
          className="mt-1 flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-white/25 transition-colors hover:text-white/70 active:cursor-grabbing"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <DragDots />
        </button>
        <Link
          href={`/admin/clients/${clientSlug}/projects/${projectId}/pages/${page.id}`}
          className="group flex min-w-0 flex-1 flex-col gap-2"
        >
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-xl font-light text-white/80 transition-colors group-hover:text-[#F5F5F7] md:text-2xl">
              {page.name}
            </h3>
            {page.is_published ? (
              <StatusBadge tone="success">Active</StatusBadge>
            ) : (
              <StatusBadge tone="warning">En forge</StatusBadge>
            )}
          </div>
          {templateLabel && (
            <Chip
              tone={
                isDetached ? "muted" : isRawHtmlDirect ? "warning" : "default"
              }
              className="w-fit"
            >
              {templateLabel}
              {dbTemplateLabel && !isDetached && !isRawHtmlDirect && (
                <span className="ml-2 text-white/35">· HTML</span>
              )}
            </Chip>
          )}
          <p className="font-mono text-[11px] text-white/35">
            <span>/{page.slug}</span>
            <span className="text-white/20"> · </span>
            <span>{formatDate(page.created_at)}</span>
          </p>
        </Link>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-4">
        <LotSelect
          value={page.lot_id}
          lots={lots}
          onChange={(lotId) => onLotChange(page.id, lotId)}
        />
        {!isDetached && !isRawHtmlDirect && (
          <DetachPageButton
            profileId={profileId}
            projectId={projectId}
            pageId={page.id}
            pageName={page.name}
          />
        )}
        <Link
          href={`/admin/clients/${clientSlug}/projects/${projectId}/pages/${page.id}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
        >
          <span>Affûter</span>
          <Hairline width="sm" hover="lg" />
        </Link>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Note row
// ---------------------------------------------------------------------------

function SortableNoteRow({
  note,
  lots,
  onLotChange,
  sortable,
}: {
  note: BoardNote;
  lots: BoardLot[];
  onLotChange: (noteId: string, lotId: string | null) => void;
  sortable: SortableRenderArg;
}) {
  const clientSlug = useClientSegment();
  const sourceLabel =
    note.source_kind === "url"
      ? "URL"
      : note.source_kind === "empty"
        ? "Vierge"
        : "Upload";
  return (
    <li
      ref={sortable.setNodeRef as (el: HTMLLIElement | null) => void}
      style={sortable.style}
      className={`flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b border-white/5 py-5 last:border-b-0 ${
        sortable.isDragging ? "z-10 bg-white/[0.02] opacity-60" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <button
          type="button"
          aria-label={`Réordonner « ${note.title} »`}
          className="mt-1 flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-white/25 transition-colors hover:text-white/70 active:cursor-grabbing"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <DragDots />
        </button>
        <Link
          href={`/admin/clients/${clientSlug}/context/${note.id}`}
          className="group flex min-w-0 flex-1 flex-col gap-2"
        >
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-xl font-light text-white/80 transition-colors group-hover:text-[#F5F5F7] md:text-2xl">
              {note.title}
            </h3>
            <Chip tone="muted" className="w-fit">
              Note
            </Chip>
          </div>
          <p className="font-mono text-[11px] text-white/35">
            <span>{sourceLabel}</span>
            <span className="text-white/20"> · </span>
            <span>/{note.slug}</span>
            <span className="text-white/20"> · </span>
            <span>{formatDate(note.created_at)}</span>
          </p>
        </Link>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-4">
        <LotSelect
          value={note.lot_id}
          lots={lots}
          onChange={(lotId) => onLotChange(note.id, lotId)}
        />
        <Link
          href={`/admin/clients/${clientSlug}/context/${note.id}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
        >
          <span>Ouvrir</span>
          <Hairline width="sm" hover="lg" />
        </Link>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Lot selector dropdown
// ---------------------------------------------------------------------------

function LotSelect({
  value,
  lots,
  onChange,
}: {
  value: string | null;
  lots: BoardLot[];
  onChange: (lotId: string | null) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/35">
      <span>Lot</span>
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : e.target.value)
        }
        className="rounded-md border border-white/15 bg-black/40 px-2 py-1 text-[11px] font-light tracking-normal text-white/80 transition-colors hover:border-white/30 focus:border-white/60 focus:outline-none"
      >
        <option value="">Aucun</option>
        {lots.map((lot, i) => (
          <option key={lot.id} value={lot.id}>
            Lot {String(i + 1).padStart(2, "0")}
            {lot.name ? ` · ${lot.name}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Create-lot inline form
// ---------------------------------------------------------------------------

function CreateLotForm({
  onCreate,
}: {
  onCreate: (name: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        className="self-start"
      >
        + Nouveau lot
      </Button>
    );
  }

  function commit() {
    const trimmed = name.trim();
    onCreate(trimmed.length === 0 ? null : trimmed);
    setName("");
    setOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.02] p-4">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setName("");
            setOpen(false);
          }
        }}
        placeholder="Nom optionnel (Enter pour créer)"
        maxLength={80}
        className="min-w-[12rem] flex-1 border-b border-white/20 bg-transparent pb-1 font-sans text-sm font-light text-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none"
      />
      <Button onClick={commit} variant="primary">
        Créer
      </Button>
      <button
        type="button"
        onClick={() => {
          setName("");
          setOpen(false);
        }}
        className="text-[11px] uppercase tracking-[0.32em] text-white/40 hover:text-white"
      >
        Annuler
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

function DragDots() {
  return (
    <svg
      viewBox="0 0 12 16"
      aria-hidden="true"
      className="h-4 w-3"
      fill="currentColor"
    >
      <circle cx="3" cy="3" r="1.2" />
      <circle cx="9" cy="3" r="1.2" />
      <circle cx="3" cy="8" r="1.2" />
      <circle cx="9" cy="8" r="1.2" />
      <circle cx="3" cy="13" r="1.2" />
      <circle cx="9" cy="13" r="1.2" />
    </svg>
  );
}
