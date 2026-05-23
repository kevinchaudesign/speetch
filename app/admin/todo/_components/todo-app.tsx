"use client";

/**
 * TodoApp — racine de l'app Tâches Jedi.
 *
 * Layout type Notes iOS : 3 colonnes en desktop, navigation en stack
 * sur mobile (via state `mobileView`).
 *
 * Colonnes :
 *  1. ListPanel — sidebar des collections + raccourcis (Toutes, Épinglées,
 *     Non classées) + bouton "+ Liste"
 *  2. NotesPanel — liste des notes du dossier sélectionné, avec preview,
 *     date, badge épinglée + barre de recherche + bouton "+ Note"
 *  3. NoteEditor — éditeur textarea avec auto-save debouncé
 */

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  createTodoList,
  createTodoNote,
  deleteTodoList,
  deleteTodoNote,
  renameTodoList,
  toggleTodoNotePinned,
  updateTodoNoteContent,
} from "../actions";
import { splitNoteContent, type TodoListItem, type TodoNoteItem } from "../_lib/types";
import { ListPanel } from "./list-panel";
import { NotesPanel } from "./notes-panel";
import { NoteEditor } from "./note-editor";

export type SelectedScope =
  | { kind: "all" }
  | { kind: "pinned" }
  | { kind: "unfiled" }
  | { kind: "list"; listId: string };

export function TodoApp({
  initialLists,
  initialNotes,
}: {
  initialLists: TodoListItem[];
  initialNotes: TodoNoteItem[];
}) {
  const router = useRouter();
  const [lists, setLists] = useState<TodoListItem[]>(initialLists);
  const [notes, setNotes] = useState<TodoNoteItem[]>(initialNotes);
  const [selectedScope, setSelectedScope] = useState<SelectedScope>({
    kind: "all",
  });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    initialNotes[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState<"lists" | "notes" | "editor">(
    "lists",
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  /* ─── Notes filtrées par scope + recherche ───────────────────────── */
  const visibleNotes = useMemo(() => {
    let filtered = notes;
    switch (selectedScope.kind) {
      case "all":
        break;
      case "pinned":
        filtered = filtered.filter((n) => n.is_pinned);
        break;
      case "unfiled":
        filtered = filtered.filter((n) => n.list_id === null);
        break;
      case "list":
        filtered = filtered.filter(
          (n) => n.list_id === selectedScope.listId,
        );
        break;
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((n) =>
        n.content.toLowerCase().includes(q),
      );
    }
    // Tri : pinned en haut, puis updated_at desc
    return [...filtered].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return b.updated_at.localeCompare(a.updated_at);
    });
  }, [notes, selectedScope, query]);

  /* ─── Stats (count) mises à jour à la volée ──────────────────────── */
  const liveStats = useMemo(() => {
    return {
      total: notes.length,
      pinned: notes.filter((n) => n.is_pinned).length,
      unfiled: notes.filter((n) => n.list_id === null).length,
    };
  }, [notes]);

  /* ─── Count par liste (mises à jour à la volée) ──────────────────── */
  const listsWithCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of notes) {
      if (n.list_id) counts.set(n.list_id, (counts.get(n.list_id) ?? 0) + 1);
    }
    return lists.map((l) => ({ ...l, count: counts.get(l.id) ?? 0 }));
  }, [lists, notes]);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  /* ─── Actions Listes ─────────────────────────────────────────────── */

  function handleCreateList() {
    setError(null);
    startTransition(async () => {
      const res = await createTodoList();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLists((prev) => [
        ...prev,
        { id: res.list.id, name: res.list.name, color: res.list.color, count: 0 },
      ]);
      setSelectedScope({ kind: "list", listId: res.list.id });
      router.refresh();
    });
  }

  function handleRenameList(id: string, name: string) {
    setError(null);
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
    startTransition(async () => {
      const res = await renameTodoList(id, name);
      if (!res.ok) setError(res.error);
    });
  }

  function handleDeleteList(id: string) {
    setError(null);
    setLists((prev) => prev.filter((l) => l.id !== id));
    setNotes((prev) =>
      prev.map((n) => (n.list_id === id ? { ...n, list_id: null } : n)),
    );
    if (
      selectedScope.kind === "list" &&
      selectedScope.listId === id
    ) {
      setSelectedScope({ kind: "all" });
    }
    startTransition(async () => {
      const res = await deleteTodoList(id);
      if (!res.ok) {
        setError(res.error);
        router.refresh();
      }
    });
  }

  /* ─── Actions Notes ──────────────────────────────────────────────── */

  function handleCreateNote() {
    setError(null);
    const targetListId =
      selectedScope.kind === "list" ? selectedScope.listId : null;
    startTransition(async () => {
      const res = await createTodoNote(targetListId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const newNote: TodoNoteItem = {
        id: res.note.id,
        list_id: res.note.list_id,
        content: res.note.content,
        is_pinned: res.note.is_pinned,
        created_at: res.note.created_at,
        updated_at: res.note.updated_at,
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      setMobileView("editor");
    });
  }

  // Mise à jour optimiste + persist debouncé géré dans NoteEditor.
  const handleNoteContentChange = useCallback(
    (id: string, content: string) => {
      setNotes((prev) => {
        const idx = prev.findIndex((n) => n.id === id);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          content,
          updated_at: new Date().toISOString(),
        };
        return next;
      });
    },
    [],
  );

  const handlePersistContent = useCallback(
    async (id: string, content: string) => {
      const res = await updateTodoNoteContent(id, content);
      if (!res.ok) {
        setError(res.error);
      }
    },
    [],
  );

  function handleTogglePin(id: string) {
    const current = notes.find((n) => n.id === id);
    if (!current) return;
    const next = !current.is_pinned;
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_pinned: next } : n)),
    );
    startTransition(async () => {
      const res = await toggleTodoNotePinned(id, next);
      if (!res.ok) {
        setError(res.error);
        // rollback
        setNotes((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, is_pinned: !next } : n,
          ),
        );
      }
    });
  }

  function handleDeleteNote(id: string) {
    setError(null);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) {
      // Sélectionne la prochaine note visible si possible
      const next = visibleNotes.find((n) => n.id !== id);
      setSelectedNoteId(next?.id ?? null);
    }
    startTransition(async () => {
      const res = await deleteTodoNote(id);
      if (!res.ok) {
        setError(res.error);
        router.refresh();
      }
    });
  }

  function handleSelectScope(scope: SelectedScope) {
    setSelectedScope(scope);
    setQuery("");
    setMobileView("notes");
    // Auto-sélectionne la première note du scope si la sélection courante
    // n'y appartient pas.
    const firstInScope = notes.find((n) => {
      switch (scope.kind) {
        case "all":
          return true;
        case "pinned":
          return n.is_pinned;
        case "unfiled":
          return n.list_id === null;
        case "list":
          return n.list_id === scope.listId;
      }
    });
    if (
      !selectedNoteId ||
      !visibleNotes.some((n) => n.id === selectedNoteId)
    ) {
      setSelectedNoteId(firstInScope?.id ?? null);
    }
  }

  function handleSelectNote(id: string) {
    setSelectedNoteId(id);
    setMobileView("editor");
  }

  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      {/* Décor cosmique léger */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10 opacity-50"
      />

      {/* Breadcrumb + erreurs en bandeau supérieur */}
      <header className="flex items-center justify-between gap-3 px-6 py-5 md:px-12 md:py-7">
        <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/55">
          <Link
            href="/admin"
            className="transition-colors hover:text-cyan-100"
          >
            Conseil Jedi
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <span className="text-cyan-200/85">Tâches</span>
        </p>
        {error && (
          <span
            className="text-[11px] uppercase tracking-[0.32em] text-red-300/85"
            style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
            role="alert"
          >
            {error}
          </span>
        )}
      </header>

      {/* Layout 3 colonnes desktop / stack mobile */}
      <div className="grid h-[calc(100svh-72px)] grid-cols-1 md:grid-cols-[260px_320px_1fr]">
        <ListPanel
          className={cn(
            "border-r border-cyan-200/10",
            mobileView !== "lists" && "hidden md:flex",
          )}
          lists={listsWithCount}
          selectedScope={selectedScope}
          stats={liveStats}
          pending={pending}
          onSelectScope={handleSelectScope}
          onCreateList={handleCreateList}
          onRenameList={handleRenameList}
          onDeleteList={handleDeleteList}
        />
        <NotesPanel
          className={cn(
            "border-r border-cyan-200/10",
            mobileView !== "notes" && "hidden md:flex",
          )}
          notes={visibleNotes}
          query={query}
          selectedScope={selectedScope}
          selectedNoteId={selectedNoteId}
          onQueryChange={setQuery}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onTogglePin={handleTogglePin}
          onDeleteNote={handleDeleteNote}
          onBackMobile={() => setMobileView("lists")}
        />
        <NoteEditor
          className={cn(mobileView !== "editor" && "hidden md:flex")}
          note={selectedNote}
          onContentChange={handleNoteContentChange}
          onPersist={handlePersistContent}
          onTogglePin={handleTogglePin}
          onDelete={handleDeleteNote}
          onBackMobile={() => setMobileView("notes")}
        />
      </div>
    </div>
  );
}

// Helper pour les composants enfants — exporté pour réutilisation éventuelle.
export { splitNoteContent };
