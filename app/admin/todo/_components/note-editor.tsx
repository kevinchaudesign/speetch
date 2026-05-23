"use client";

/**
 * NoteEditor — colonne 3 : éditeur textarea avec auto-save debouncé.
 *
 * - Auto-save 600ms après la dernière frappe (debounce)
 * - Première ligne du textarea = titre (rendu plus gros, géré côté UI)
 * - Indicateur de statut "Enregistré · à l'instant" / "Yoda médite…"
 * - Raccourcis : Cmd+B (bold pseudo en *), Cmd+I (italic pseudo en _),
 *   Cmd+L (checklist - [ ])
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { TodoNoteItem } from "../_lib/types";

const DEBOUNCE_MS = 600;

export function NoteEditor({
  className,
  note,
  onContentChange,
  onPersist,
  onTogglePin,
  onDelete,
  onBackMobile,
}: {
  className?: string;
  note: TodoNoteItem | null;
  onContentChange: (id: string, content: string) => void;
  onPersist: (id: string, content: string) => Promise<void>;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onBackMobile: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastSavedRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"idle" | "typing" | "saving" | "saved">(
    "idle",
  );
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Reset l'état quand la note change
  useEffect(() => {
    if (!note) {
      lastSavedRef.current = "";
      setStatus("idle");
      setSavedAt(null);
      return;
    }
    lastSavedRef.current = note.content;
    setStatus("saved");
    setSavedAt(new Date(note.updated_at));
  }, [note?.id, note?.updated_at, note]);

  // Cleanup debounce au unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function scheduleSave(id: string, content: string) {
    setStatus("typing");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (content === lastSavedRef.current) return;
      setStatus("saving");
      await onPersist(id, content);
      lastSavedRef.current = content;
      setSavedAt(new Date());
      setStatus("saved");
    }, DEBOUNCE_MS);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!note) return;
    const value = e.target.value;
    onContentChange(note.id, value);
    scheduleSave(note.id, value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!note) return;
    const meta = e.metaKey || e.ctrlKey;
    if (meta && e.key.toLowerCase() === "l") {
      e.preventDefault();
      insertAtCursor("- [ ] ", e.currentTarget);
    } else if (meta && e.key.toLowerCase() === "b") {
      e.preventDefault();
      wrapSelection("**", "**", e.currentTarget);
    } else if (meta && e.key.toLowerCase() === "i") {
      e.preventDefault();
      wrapSelection("_", "_", e.currentTarget);
    }
  }

  function insertAtCursor(text: string, ta: HTMLTextAreaElement) {
    if (!note) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    // Si on est en début de ligne, juste insère ; sinon précède d'un \n
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const insert = (needsNewline ? "\n" : "") + text;
    const next = before + insert + after;
    ta.value = next;
    onContentChange(note.id, next);
    const caret = start + insert.length;
    ta.setSelectionRange(caret, caret);
    scheduleSave(note.id, next);
  }

  function wrapSelection(
    left: string,
    right: string,
    ta: HTMLTextAreaElement,
  ) {
    if (!note) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? 0;
    const selected = ta.value.slice(start, end);
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    const next = before + left + selected + right + after;
    ta.value = next;
    onContentChange(note.id, next);
    ta.setSelectionRange(start + left.length, end + left.length);
    scheduleSave(note.id, next);
  }

  /* ── Empty state ──────────────────────────────────────────────── */
  if (!note) {
    return (
      <section
        className={cn(
          "flex flex-1 items-center justify-center bg-black/10 px-6",
          className,
        )}
      >
        <p className="text-center font-serif text-base italic text-white/35">
          Sélectionne une note ou crée-en une nouvelle.
        </p>
      </section>
    );
  }

  const statusLabel = formatStatus(status, savedAt);

  return (
    <section
      className={cn(
        "relative flex flex-1 flex-col bg-black/10",
        className,
      )}
      aria-label="Éditeur de note"
    >
      {/* Topbar éditeur */}
      <header className="flex items-center justify-between gap-3 border-b border-cyan-200/10 px-6 py-3.5 md:px-10">
        <button
          type="button"
          onClick={onBackMobile}
          className="md:hidden text-[10px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100"
          aria-label="Retour aux notes"
        >
          ←
        </button>
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.32em]",
            status === "saved"
              ? "text-cyan-200/65"
              : status === "saving"
                ? "text-cyan-100"
                : "text-white/40",
          )}
          aria-live="polite"
        >
          {statusLabel}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTogglePin(note.id)}
            aria-label={note.is_pinned ? "Désépingler" : "Épingler"}
            title={note.is_pinned ? "Désépingler" : "Épingler"}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
              note.is_pinned
                ? "border-cyan-200/50 bg-cyan-200/[0.08] text-cyan-100"
                : "border-cyan-200/15 text-cyan-200/65 hover:border-cyan-200/45 hover:bg-cyan-200/[0.06] hover:text-cyan-100",
            )}
          >
            <PinIcon filled={note.is_pinned} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Effacer cette note ?")) onDelete(note.id);
            }}
            aria-label="Effacer cette note"
            title="Effacer cette note"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cyan-200/15 text-white/55 transition-colors hover:border-red-400/40 hover:bg-red-400/[0.08] hover:text-red-300"
          >
            <TrashIcon />
          </button>
        </div>
      </header>

      {/* Textarea — édition libre, premier ligne traitée comme titre côté
          rendu de la liste (NotesPanel) */}
      <div className="flex flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12">
        <textarea
          key={note.id}
          ref={textareaRef}
          defaultValue={note.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Titre…&#10;&#10;Commence à écrire."
          spellCheck={true}
          autoComplete="off"
          className="w-full flex-1 resize-none bg-transparent font-serif text-[16px] leading-relaxed text-[#F5F5F7]/92 caret-cyan-200 outline-none placeholder:text-white/30 md:text-[17px]"
          style={{
            // La première ligne est volontairement traitée comme titre en
            // styling via la prop CSS first-line — Tailwind ne l'expose
            // pas, on utilise un style inline pour préserver le texte
            // brut côté éditeur.
            // eslint-disable-next-line
          }}
        />
      </div>

      {/* Indices clavier en bas */}
      <footer className="hidden items-center justify-end gap-5 border-t border-cyan-200/[0.06] px-10 py-2 md:flex">
        <ShortcutHint keys={["⌘", "L"]} label="Cocher" />
        <ShortcutHint keys={["⌘", "B"]} label="Gras" />
        <ShortcutHint keys={["⌘", "I"]} label="Italique" />
      </footer>
    </section>
  );
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.32em] text-white/30">
      {keys.map((k, i) => (
        <span
          key={i}
          className="inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-cyan-200/15 px-1 text-cyan-200/60"
        >
          {k}
        </span>
      ))}
      <span>{label}</span>
    </span>
  );
}

function formatStatus(
  status: "idle" | "typing" | "saving" | "saved",
  savedAt: Date | null,
): string {
  if (status === "typing") return "Yoda observe…";
  if (status === "saving") return "Scellement…";
  if (status === "saved" && savedAt) {
    const diff = (Date.now() - savedAt.getTime()) / 1000;
    if (diff < 60) return "Scellé · à l'instant";
    if (diff < 3600) return `Scellé · ${Math.floor(diff / 60)} min`;
    return `Scellé · ${new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(savedAt)}`;
  }
  return "—";
}

/* ─── Icônes ────────────────────────────────────────────────────────── */

function PinIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 4l4 4-5 1-3 6-2-2-5 5 1-6L4 8h6l4-4 2 0Z" />
    </svg>
  );
}

function TrashIcon() {
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
      aria-hidden
    >
      <path d="M4 7h16" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}
