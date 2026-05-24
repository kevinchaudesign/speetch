"use client";

/**
 * NotesPanel — colonne 2 : liste des notes du scope sélectionné.
 * Barre de recherche en haut, bouton "+ Note" en bas, cards avec
 * titre + preview + date (format Notes iOS).
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { splitNoteContent, type TodoNoteItem } from "../_lib/types";
import type { SelectedScope } from "./todo-app";
import { ConfirmDialog } from "@/lib/ds/confirm-dialog";

const SCOPE_LABELS: Record<SelectedScope["kind"], string> = {
  all: "Toutes les notes",
  pinned: "Épinglées",
  unfiled: "Non classées",
  list: "Liste",
};

export function NotesPanel({
  className,
  notes,
  query,
  selectedScope,
  selectedNoteId,
  onQueryChange,
  onSelectNote,
  onCreateNote,
  onTogglePin,
  onDeleteNote,
  onBackMobile,
}: {
  className?: string;
  notes: TodoNoteItem[];
  query: string;
  selectedScope: SelectedScope;
  selectedNoteId: string | null;
  onQueryChange: (q: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onTogglePin: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onBackMobile: () => void;
}) {
  const title = SCOPE_LABELS[selectedScope.kind];
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <section
      className={cn(
        "flex flex-col bg-black/20 backdrop-blur-sm",
        className,
      )}
      aria-label="Liste des notes"
    >
      {/* Header : back mobile + title + count */}
      <header className="flex items-center justify-between gap-3 border-b border-cyan-200/10 px-4 py-4">
        <button
          type="button"
          onClick={onBackMobile}
          className="md:hidden text-[10px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100"
          aria-label="Retour aux listes"
        >
          ←
        </button>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
            {title}
          </span>
          <span className="font-mono text-[10px] text-white/40">
            {notes.length} {notes.length > 1 ? "notes" : "note"}
          </span>
        </div>
        <button
          type="button"
          onClick={onCreateNote}
          aria-label="Nouvelle note"
          title="Nouvelle note"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cyan-200/20 text-cyan-200/75 transition-colors hover:border-cyan-200/55 hover:bg-cyan-200/[0.06] hover:text-cyan-100"
        >
          <PlusIcon />
        </button>
      </header>

      {/* Barre de recherche */}
      <div className="border-b border-cyan-200/10 px-4 py-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-200/45" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher dans les notes"
            className="w-full rounded-md border border-cyan-200/15 bg-cyan-200/[0.02] py-2 pl-9 pr-3 text-[13px] text-[#F5F5F7] caret-cyan-200 outline-none placeholder:text-white/35 focus:border-cyan-200/45"
          />
        </div>
      </div>

      {/* Liste des notes */}
      <ul
        className="flex flex-1 flex-col overflow-y-auto"
        role="listbox"
        aria-label="Notes"
      >
        {notes.length === 0 ? (
          <li className="px-5 py-8 text-center font-serif text-sm italic text-white/45">
            {query
              ? "Aucune note ne correspond."
              : "Aucune note. Clique sur « + » pour en forger une."}
          </li>
        ) : (
          notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              selected={note.id === selectedNoteId}
              onSelect={() => onSelectNote(note.id)}
              onTogglePin={() => onTogglePin(note.id)}
              onDelete={() => setDeleteId(note.id)}
            />
          ))
        )}
      </ul>

      <ConfirmDialog
        open={deleteId !== null}
        title="Effacer cette note ?"
        description="L'action est irréversible. La note sera définitivement perdue."
        confirmLabel="Effacer"
        tone="danger"
        onConfirm={() => {
          if (deleteId) onDeleteNote(deleteId);
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </section>
  );
}

function NoteRow({
  note,
  selected,
  onSelect,
  onTogglePin,
  onDelete,
}: {
  note: TodoNoteItem;
  selected: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const { title, preview } = splitNoteContent(note.content);
  const date = formatRelativeDate(note.updated_at);

  return (
    <li
      className={cn(
        "group relative border-b border-cyan-200/[0.06]",
        selected && "bg-cyan-200/[0.06]",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full flex-col gap-1.5 px-4 py-3.5 text-left transition-colors",
          !selected && "hover:bg-cyan-200/[0.03]",
        )}
        role="option"
        aria-selected={selected}
      >
        <div className="flex items-center justify-between gap-3">
          <h3
            className={cn(
              "min-w-0 truncate text-[14px] font-light",
              selected ? "text-cyan-100" : "text-[#F5F5F7]/90",
            )}
          >
            {title || (
              <span className="font-serif italic text-white/40">
                Nouvelle note
              </span>
            )}
          </h3>
          {note.is_pinned && (
            <PinIcon className="shrink-0 text-cyan-200/85" />
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/45">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-200/55">
            {date}
          </span>
          {preview && (
            <>
              <span className="text-white/20">·</span>
              <span className="truncate text-white/55">{preview}</span>
            </>
          )}
        </div>
      </button>
      {/* Actions au hover (épingler/effacer) */}
      <div
        className={cn(
          "absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity duration-200",
          (selected || true) && "group-hover:opacity-100",
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          aria-label={note.is_pinned ? "Désépingler" : "Épingler"}
          title={note.is_pinned ? "Désépingler" : "Épingler"}
          className="inline-flex h-6 w-6 items-center justify-center rounded text-cyan-200/60 transition-colors hover:bg-cyan-200/[0.08] hover:text-cyan-100"
        >
          <PinIcon />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Effacer"
          title="Effacer"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-white/40 transition-colors hover:bg-red-400/10 hover:text-red-300"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000; // secondes
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

/* ─── Icônes ────────────────────────────────────────────────────────── */

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.5" y2="16.5" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 4l4 4-5 1-3 6-2-2-5 5 1-6L4 8h6l4-4 2 0Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}
