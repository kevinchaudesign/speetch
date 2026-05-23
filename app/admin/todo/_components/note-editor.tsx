"use client";

/**
 * NoteEditor — éditeur rich-text WYSIWYG style Notes iOS.
 *
 * Stack : Tiptap (ProseMirror) avec StarterKit + TaskList + Underline.
 *
 * - Titre auto = première ligne (CSS first-line + first paragraph)
 * - Cases cochables interactives (TaskList / TaskItem)
 * - Raccourcis natifs ⌘B (gras) / ⌘I (italique) / ⌘U (souligné),
 *   ⌘⇧8 (puces) / ⌘⇧7 (numérotée), + ⌘L ajouté pour insérer une
 *   case à cocher
 * - Auto-save débouncé 600ms
 * - Toolbar contextuelle minimaliste en bas (fond Conseil Jedi)
 * - Compatible legacy : si la note était stockée en plain text avant
 *   la migration v2, Tiptap la charge et la convertit en HTML au save
 */

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import { CodeBlock } from "@tiptap/extension-code-block";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { cn } from "@/lib/utils";
import type { TodoNoteItem } from "../_lib/types";
import { MediaEmbed, type MediaKind } from "./media-embed-node";
import { MediaPicker, type MediaPickerKind } from "./media-picker";

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
  const lastSavedRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"idle" | "typing" | "saving" | "saved">(
    "idle",
  );
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pickerKind, setPickerKind] = useState<MediaPickerKind | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: false, // surchargé ci-dessous
      }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlock.configure({
        HTMLAttributes: { class: "todo-code-block" },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: "todo-table" },
      }),
      TableRow,
      TableHeader,
      TableCell,
      MediaEmbed,
      Placeholder.configure({
        placeholder: ({ node }) => {
          // Titre attendu sur le tout premier nœud
          if (node.type.name === "heading") return "Titre…";
          return "Commence à écrire.";
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none focus:outline-none",
          "font-serif text-[16px] leading-relaxed md:text-[17px]",
          "[&_h1]:font-sans [&_h1]:text-3xl [&_h1]:font-extralight [&_h1]:tracking-[-0.03em] [&_h1]:text-[#F5F5F7]",
          "[&_h2]:font-sans [&_h2]:text-2xl [&_h2]:font-extralight [&_h2]:tracking-[-0.02em] [&_h2]:text-[#F5F5F7]",
          "[&_p]:text-[#F5F5F7]/92",
          "[&_strong]:text-cyan-100 [&_strong]:font-medium",
          "[&_em]:text-white/85",
          "[&_a]:text-cyan-200 [&_a]:underline [&_a]:decoration-cyan-200/40",
          "[&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1",
          "[&_li]:text-[#F5F5F7]/90",
          "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0",
          "[&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-3",
          "[&_li[data-type=taskItem]>label]:cursor-pointer [&_li[data-type=taskItem]>label]:select-none",
          "[&_li[data-type=taskItem]>label]:mt-[5px] [&_li[data-type=taskItem]>label]:shrink-0",
          "[&_li[data-type=taskItem]>label>input]:h-4 [&_li[data-type=taskItem]>label>input]:w-4 [&_li[data-type=taskItem]>label>input]:cursor-pointer [&_li[data-type=taskItem]>label>input]:accent-cyan-300",
          "[&_li[data-type=taskItem]>div]:flex-1",
          "[&_li[data-type=taskItem][data-checked=true]>div]:line-through [&_li[data-type=taskItem][data-checked=true]>div]:text-white/40",
          "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-white/30 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          "[&_h1.is-empty]:before:pointer-events-none [&_h1.is-empty]:before:float-left [&_h1.is-empty]:before:h-0 [&_h1.is-empty]:before:text-white/30 [&_h1.is-empty]:before:content-[attr(data-placeholder)]",
          // Code block — fond techy + accent cyan
          "[&_pre]:my-4 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-cyan-200/15 [&_pre]:bg-black/60 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed",
          "[&_pre_code]:text-cyan-100/90 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
          "[&_code]:rounded [&_code]:border [&_code]:border-cyan-200/15 [&_code]:bg-cyan-200/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-cyan-100",
          // Table — bordures cyan thin, header bg cyan/8
          "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-md [&_table]:border [&_table]:border-cyan-200/15",
          "[&_th]:bg-cyan-200/[0.08] [&_th]:p-2.5 [&_th]:text-left [&_th]:text-[12px] [&_th]:uppercase [&_th]:tracking-[0.2em] [&_th]:text-cyan-100 [&_th]:border [&_th]:border-cyan-200/15",
          "[&_td]:p-2.5 [&_td]:text-[14px] [&_td]:text-[#F5F5F7]/85 [&_td]:border [&_td]:border-cyan-200/10",
          // MediaEmbed — image/video/audio insérés depuis la médiathèque
          "[&_img[data-media-kind]]:my-4 [&_img[data-media-kind]]:max-w-full [&_img[data-media-kind]]:rounded-lg [&_img[data-media-kind]]:border [&_img[data-media-kind]]:border-cyan-200/15",
          "[&_video[data-media-kind]]:my-4 [&_video[data-media-kind]]:w-full [&_video[data-media-kind]]:rounded-lg [&_video[data-media-kind]]:border [&_video[data-media-kind]]:border-cyan-200/15",
          "[&_audio[data-media-kind]]:my-4 [&_audio[data-media-kind]]:w-full",
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const id = noteIdRef.current;
      if (!id) return;
      const html = ed.getHTML();
      onContentChange(id, html);
      scheduleSave(id, html);
    },
  });

  // Sync de la note ouverte → reset editor content (sans re-trigger onUpdate)
  useEffect(() => {
    if (!editor || !note) return;
    noteIdRef.current = note.id;
    // Tiptap charge HTML ou plain text (rétrocompat avec les notes pré-v2)
    const initialContent = note.content || "";
    // setContent emit-false : on n'enregistre pas l'init comme une frappe user
    editor.commands.setContent(initialContent, { emitUpdate: false });
    lastSavedRef.current = initialContent;
    setStatus("saved");
    setSavedAt(new Date(note.updated_at));
  }, [editor, note?.id, note?.updated_at, note]);

  // Reset complet quand on n'a plus de note
  useEffect(() => {
    if (note) return;
    noteIdRef.current = null;
    lastSavedRef.current = "";
    setStatus("idle");
    setSavedAt(null);
  }, [note]);

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

  // Raccourci ⌘L = insérer/toggle case à cocher
  useEffect(() => {
    if (!editor) return;
    function onKey(e: KeyboardEvent) {
      if (!editor || !editor.isFocused) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "l") {
        e.preventDefault();
        editor.chain().focus().toggleTaskList().run();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editor]);

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
      className={cn("relative flex flex-1 flex-col bg-black/10", className)}
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

      {/* Toolbar formatage */}
      {editor && (
        <div className="flex flex-wrap items-center gap-1 border-b border-cyan-200/[0.06] px-6 py-2 md:px-10">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            label="Titre"
            hint="⌘⇧1"
          >
            T1
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            label="Sous-titre"
            hint="⌘⇧2"
          >
            T2
          </ToolbarBtn>
          <Separator />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            label="Gras"
            hint="⌘B"
          >
            <BoldIcon />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            label="Italique"
            hint="⌘I"
          >
            <ItalicIcon />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            label="Souligné"
            hint="⌘U"
          >
            <UnderlineIcon />
          </ToolbarBtn>
          <Separator />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive("taskList")}
            label="Cases à cocher"
            hint="⌘L"
          >
            <CheckboxIcon />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            label="Liste à puces"
            hint="⌘⇧8"
          >
            <BulletIcon />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            label="Liste numérotée"
            hint="⌘⇧7"
          >
            <OrderedIcon />
          </ToolbarBtn>
          <Separator />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            label="Bloc de code"
            hint="⌘⌥C"
          >
            <CodeIcon />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            label="Tableau"
          >
            <TableIcon />
          </ToolbarBtn>
          <Separator />
          <ToolbarBtn
            onClick={() => setPickerKind("image")}
            label="Insérer une image"
          >
            <ImageIcon />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => setPickerKind("video")}
            label="Insérer une vidéo"
          >
            <VideoIcon />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => setPickerKind("audio")}
            label="Insérer un audio"
          >
            <AudioIcon />
          </ToolbarBtn>
          {editor.isActive("table") && (
            <>
              <Separator />
              <ToolbarBtn
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                label="+ Colonne"
              >
                +Col
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().addRowAfter().run()}
                label="+ Ligne"
              >
                +Ln
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().deleteColumn().run()}
                label="− Colonne"
              >
                −Col
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().deleteRow().run()}
                label="− Ligne"
              >
                −Ln
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().deleteTable().run()}
                label="Effacer le tableau"
              >
                ×Tbl
              </ToolbarBtn>
            </>
          )}
        </div>
      )}

      {/* Picker médiathèque inline */}
      <MediaPicker
        open={pickerKind !== null}
        kind={pickerKind ?? "all"}
        onClose={() => setPickerKind(null)}
        onSelect={(item) => {
          if (!editor) return;
          const kind: MediaKind = item.mime_type.startsWith("video/")
            ? "video"
            : item.mime_type.startsWith("audio/")
              ? "audio"
              : "image";
          editor
            .chain()
            .focus()
            .insertMediaEmbed({
              src: item.public_url,
              kind,
              alt: item.filename,
              filename: item.filename,
            })
            .run();
        }}
      />

      {/* Zone d'édition */}
      <div className="flex flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <EditorContent editor={editor} className="w-full flex-1" />
      </div>
    </section>
  );
}

/* ── Toolbar ───────────────────────────────────────────────────────── */

function ToolbarBtn({
  children,
  onClick,
  active,
  label,
  hint,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={hint ? `${label} (${hint})` : label}
      className={cn(
        "inline-flex h-8 min-w-[32px] items-center justify-center rounded-md px-2 text-[12px] font-mono uppercase tracking-[0.1em] transition-colors",
        active
          ? "bg-cyan-200/[0.12] text-cyan-100"
          : "text-cyan-200/65 hover:bg-cyan-200/[0.06] hover:text-cyan-100",
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return (
    <span
      aria-hidden
      className="mx-1 inline-block h-4 w-px bg-cyan-200/15"
    />
  );
}

/* ── Helpers ───────────────────────────────────────────────────────── */

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

/* ── Icônes ────────────────────────────────────────────────────────── */

function BoldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7Z" />
      <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7Z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="11" y1="5" x2="17" y2="5" />
      <line x1="7" y1="19" x2="13" y2="19" />
      <line x1="14" y1="5" x2="10" y2="19" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 4v7a5 5 0 0 0 10 0V4" />
      <line x1="5" y1="20" x2="19" y2="20" />
    </svg>
  );
}

function CheckboxIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  );
}

function BulletIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="5" cy="6" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="18" r="1" fill="currentColor" />
      <line x1="10" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="10" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function OrderedIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <text x="3" y="9" fontSize="6" fill="currentColor" stroke="none">1.</text>
      <text x="3" y="16" fontSize="6" fill="currentColor" stroke="none">2.</text>
      <line x1="10" y1="7" x2="20" y2="7" />
      <line x1="10" y1="13" x2="20" y2="13" />
      <line x1="10" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="M21 16l-5-5L5 21" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <polygon points="22 8 16 12 22 16" fill="currentColor" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V6l9-2v12" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="15" cy="16" r="2.5" />
    </svg>
  );
}

function PinIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 4l4 4-5 1-3 6-2-2-5 5 1-6L4 8h6l4-4 2 0Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7h16" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}
