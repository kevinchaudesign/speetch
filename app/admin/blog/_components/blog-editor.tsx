"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Button, Field, Eyebrow, ConfirmDialog, AlertDialog, Chip } from "@/lib/ds";
import { cn } from "@/lib/utils";
import {
  deletePost,
  publishPost,
  unpublishPost,
  updatePost,
} from "../actions";
import { OwnerImagePicker } from "./owner-image-picker";
import type { OwnerImage } from "../actions";
import type { BlogStatus } from "../_lib/types";
import type { Json } from "@/types/database";
import { slugify } from "../_lib/slug";

const PUBLIC_BASE_URL = "https://speetch.com";
const SEO_TITLE_MAX = 70;
const SEO_DESC_MAX = 180;

export type BlogEditorInitial = {
  title: string;
  slug: string;
  excerpt: string;
  contentJson: Json;
  contentHtml: string;
  coverMediaId: string | null;
  coverUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  status: BlogStatus;
  publishedAt: string | null;
  readingTimeMinutes: number;
};

export function BlogEditor({
  postId,
  initial,
}: {
  postId: string;
  initial: BlogEditorInitial;
}) {
  const router = useRouter();

  // ── State formulaire ─────────────────────────────────────────────────
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(
    initial.coverMediaId,
  );
  const [coverUrl, setCoverUrl] = useState<string | null>(initial.coverUrl);
  const [seoTitle, setSeoTitle] = useState(initial.seoTitle);
  const [seoDescription, setSeoDescription] = useState(initial.seoDescription);
  const [canonicalUrl, setCanonicalUrl] = useState(initial.canonicalUrl);

  // ── État technique ────────────────────────────────────────────────────
  const [status] = useState<BlogStatus>(initial.status);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState<"cover" | "inline" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  // Track slug auto-suit-le-titre tant que le user ne l'a pas touché manuellement.
  const lastAutoSlug = useRef<string>(slugify(initial.title));
  const slugTouched = useRef<boolean>(initial.slug !== lastAutoSlug.current);

  // ── Tiptap ───────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, // H1 réservé au titre de l'article
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener",
          class: "blog-link",
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: { class: "blog-inline-image", loading: "lazy" },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return "Titre de section";
          return "Écris ici. Utilise les H2 pour structurer, les liens internes pour tisser ton SEO.";
        },
      }),
    ],
    content: initial.contentJson && Object.keys(initial.contentJson).length > 0
      ? (initial.contentJson as object)
      : initial.contentHtml || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none focus:outline-none min-h-[400px]",
          "font-serif text-[17px] leading-[1.75] md:text-[18px]",
          "[&_h2]:font-sans [&_h2]:text-2xl [&_h2]:font-extralight [&_h2]:tracking-[-0.02em] [&_h2]:text-[#F5F5F7] [&_h2]:mt-12 [&_h2]:mb-4",
          "[&_h3]:font-sans [&_h3]:text-xl [&_h3]:font-extralight [&_h3]:tracking-[-0.01em] [&_h3]:text-[#F5F5F7] [&_h3]:mt-8 [&_h3]:mb-3",
          "[&_p]:text-[#F5F5F7]/92 [&_p]:my-4",
          "[&_strong]:text-cyan-100 [&_strong]:font-medium",
          "[&_em]:text-white/85",
          "[&_a]:text-cyan-200 [&_a]:underline [&_a]:decoration-cyan-200/40 [&_a]:underline-offset-2",
          "[&_ul]:my-4 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:pl-6",
          "[&_li]:my-1.5 [&_li]:text-[#F5F5F7]/90",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-cyan-200/40 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-white/75 [&_blockquote]:my-6",
          "[&_code]:rounded [&_code]:border [&_code]:border-cyan-200/15 [&_code]:bg-cyan-200/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-cyan-100",
          "[&_pre]:my-6 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-cyan-200/15 [&_pre]:bg-black/60 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px]",
          "[&_img]:my-8 [&_img]:rounded-xl [&_img]:border [&_img]:border-white/10",
          "[&_hr]:my-10 [&_hr]:border-white/15",
          "[&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:text-white/30 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
        ),
      },
    },
  });

  // ── Auto-derive slug depuis titre tant que pas édité manuellement ────
  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugTouched.current) {
      const auto = slugify(v);
      lastAutoSlug.current = auto;
      setSlug(auto);
    }
  };
  const handleSlugChange = (v: string) => {
    slugTouched.current = true;
    setSlug(v);
  };

  // ── Save (Ctrl/⌘+S) ──────────────────────────────────────────────────
  const onSave = useCallback(async (): Promise<boolean> => {
    if (!editor) return false;
    setSaving(true);
    setError(null);
    const res = await updatePost({
      postId,
      title,
      slug,
      excerpt: excerpt.trim() || null,
      contentJson: editor.getJSON() as unknown as Json,
      contentHtml: editor.getHTML(),
      coverMediaId,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      canonicalUrl: canonicalUrl.trim() || null,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    router.refresh();
    return true;
  }, [
    editor,
    postId,
    title,
    slug,
    excerpt,
    coverMediaId,
    seoTitle,
    seoDescription,
    canonicalUrl,
    router,
  ]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void onSave();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onSave]);

  // ── Publish ──────────────────────────────────────────────────────────
  const onPublish = async () => {
    const saved = await onSave();
    if (!saved) return;
    setPublishing(true);
    setError(null);
    const res = await publishPost({ postId });
    setPublishing(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  const onUnpublish = async () => {
    setPublishing(true);
    setError(null);
    const res = await unpublishPost({ postId });
    setPublishing(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  const onDelete = async () => {
    const res = await deletePost({ postId });
    if (!res.ok) {
      setError(res.error);
      setDeleteOpen(false);
      return;
    }
    router.push("/admin/blog");
  };

  // ── Image picker (cover ou inline) ────────────────────────────────────
  const onPickImage = (img: OwnerImage) => {
    if (pickerOpen === "cover") {
      setCoverMediaId(img.id);
      setCoverUrl(img.public_url);
    } else if (pickerOpen === "inline" && editor) {
      editor
        .chain()
        .focus()
        .setImage({ src: img.public_url, alt: img.filename })
        .run();
    }
    setPickerOpen(null);
  };

  // ── Insertion de lien Tiptap ─────────────────────────────────────────
  const insertLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL du lien (laisser vide pour retirer)", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    // Préfixe http si l'utilisateur a tapé "speetch.com" sans schéma
    const normalized = /^[a-z]+:\/\//i.test(url) || url.startsWith("/")
      ? url
      : `https://${url}`;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalized })
      .run();
  };

  const seoTitlePreview = seoTitle.trim() || title.trim() || "(sans titre)";
  const seoDescPreview = seoDescription.trim() || excerpt.trim() || "";
  const publicUrl = `${PUBLIC_BASE_URL}/blog/${slug || "..."}`;

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-10">
      {/* ── Cover ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <Eyebrow tracking="md" intensity="strong">
          Image d'aperçu
        </Eyebrow>
        <button
          type="button"
          onClick={() => setPickerOpen("cover")}
          className={cn(
            "group relative flex aspect-[1200/630] w-full max-w-2xl items-center justify-center overflow-hidden rounded-2xl border transition-all",
            coverUrl
              ? "border-white/10 hover:border-white/30"
              : "border-dashed border-white/20 bg-white/[0.02] hover:border-white/40",
          )}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="text-[11px] uppercase tracking-[0.4em] text-white/45 group-hover:text-white/70">
              + Choisir une image (1200 × 630 recommandé)
            </span>
          )}
        </button>
        {coverMediaId && (
          <button
            type="button"
            onClick={() => {
              setCoverMediaId(null);
              setCoverUrl(null);
            }}
            className="self-start text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-red-300/85"
          >
            × Retirer l'aperçu
          </button>
        )}
      </section>

      {/* ── Titre + slug + excerpt ────────────────────────────────────── */}
      <section className="flex flex-col gap-6">
        <Field label="Titre">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Le titre de la chronique"
            maxLength={180}
            className="w-full border-b border-white/15 bg-transparent py-2 font-sans text-2xl font-extralight tracking-[-0.02em] text-[#F5F5F7] outline-none transition-colors focus:border-white/45 md:text-3xl"
          />
        </Field>

        <Field label="Slug" hint={publicUrl}>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="mon-article"
            maxLength={80}
            className="w-full border-b border-white/15 bg-transparent py-2 font-mono text-sm text-white/80 outline-none transition-colors focus:border-white/45"
          />
        </Field>

        <Field
          label="Résumé"
          hint={`${excerpt.length}/400 · accroche & meta fallback`}
        >
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value.slice(0, 400))}
            placeholder="2-3 phrases qui donnent envie de cliquer dans les SERP et sur les réseaux."
            rows={3}
            className="w-full resize-none border-b border-white/15 bg-transparent py-2 font-serif text-base italic text-white/85 outline-none transition-colors focus:border-white/45"
          />
        </Field>
      </section>

      {/* ── Toolbar Tiptap ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <Eyebrow tracking="md" intensity="strong">
          Contenu
        </Eyebrow>
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-white/10 bg-white/[0.02] p-1.5">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            label="H2"
            title="Titre de section (H2) — important pour le SEO"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            label="H3"
            title="Sous-titre (H3)"
          />
          <ToolbarSep />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            label="B"
            className="font-bold"
            title="Gras (⌘B)"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            label="I"
            className="italic"
            title="Italique (⌘I)"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            label="U"
            className="underline"
            title="Souligné (⌘U)"
          />
          <ToolbarSep />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            label="•"
            title="Liste à puces"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            label="1."
            title="Liste numérotée"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            label="“"
            title="Citation"
          />
          <ToolbarSep />
          <ToolbarBtn
            onClick={insertLink}
            active={editor.isActive("link")}
            label="↪"
            title="Lien (interne ou externe)"
          />
          <ToolbarBtn
            onClick={() => setPickerOpen("inline")}
            label="✦"
            title="Insérer une image depuis la médiathèque"
          />
          <ToolbarBtn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            label="—"
            title="Séparateur"
          />
        </div>

        <div className="rounded-md border border-white/10 bg-white/[0.02] px-4 py-6 md:px-8 md:py-10">
          <EditorContent editor={editor} />
        </div>
      </section>

      {/* ── SEO ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setSeoOpen((v) => !v)}
          className="flex items-center gap-3 text-left"
        >
          <Eyebrow tracking="md" intensity="strong">
            SEO {seoOpen ? "▾" : "▸"}
          </Eyebrow>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
            Aperçu Google + meta avancées
          </span>
        </button>

        {seoOpen && (
          <div className="flex flex-col gap-6 rounded-md border border-white/10 bg-white/[0.02] p-6">
            {/* Aperçu Google */}
            <div className="flex flex-col gap-1 rounded-md bg-black/40 p-4">
              <p className="font-mono text-[11px] text-white/40">{publicUrl}</p>
              <p className="font-sans text-[18px] text-blue-300/85 underline decoration-blue-300/40">
                {seoTitlePreview}
              </p>
              <p className="line-clamp-2 font-serif text-[13px] italic text-white/65">
                {seoDescPreview || "(pas de description — le résumé sera utilisé)"}
              </p>
            </div>

            <Field
              label="Titre SEO (override)"
              hint={`${seoTitle.length}/${SEO_TITLE_MAX}`}
            >
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value.slice(0, SEO_TITLE_MAX))}
                placeholder="Vide → titre de l'article"
                className="w-full border-b border-white/15 bg-transparent py-2 text-white outline-none transition-colors focus:border-white/45"
              />
            </Field>

            <Field
              label="Meta description (override)"
              hint={`${seoDescription.length}/${SEO_DESC_MAX}`}
            >
              <textarea
                value={seoDescription}
                onChange={(e) =>
                  setSeoDescription(e.target.value.slice(0, SEO_DESC_MAX))
                }
                placeholder="Vide → résumé"
                rows={3}
                className="w-full resize-none border-b border-white/15 bg-transparent py-2 text-white outline-none transition-colors focus:border-white/45"
              />
            </Field>

            <Field label="Canonical URL (cross-posting uniquement)">
              <input
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://… (laisser vide pour cet article comme source)"
                className="w-full border-b border-white/15 bg-transparent py-2 font-mono text-sm text-white/80 outline-none transition-colors focus:border-white/45"
              />
            </Field>
          </div>
        )}
      </section>

      {/* ── Barre d'actions ─────────────────────────────────────────────── */}
      <section className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 px-4 py-3 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-3">
          <Chip tone={status === "published" ? "success" : "muted"}>
            {status === "published" ? "Publié" : "Brouillon"}
          </Chip>
          {status === "published" && (
            <a
              href={`/blog/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70 transition-colors hover:text-cyan-100"
            >
              Voir en ligne ↗
            </a>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            disabled={saving || publishing}
          >
            Supprimer
          </Button>
          {status === "published" ? (
            <Button
              variant="ghost"
              onClick={onUnpublish}
              pending={publishing}
              pendingLabel="En cours…"
              disabled={saving}
            >
              Dépublier
            </Button>
          ) : null}
          <Button
            variant="ghost"
            onClick={onSave}
            pending={saving}
            pendingLabel="Sauvegarde…"
            disabled={publishing}
          >
            Enregistrer (⌘S)
          </Button>
          <Button
            variant="primary"
            onClick={onPublish}
            pending={publishing}
            pendingLabel="Publication…"
            disabled={saving}
          >
            {status === "published" ? "Mettre à jour & publier" : "Publier"}
          </Button>
        </div>
      </section>

      {/* ── Modales ─────────────────────────────────────────────────────── */}
      <OwnerImagePicker
        open={pickerOpen !== null}
        onClose={() => setPickerOpen(null)}
        onSelect={onPickImage}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Supprimer cette chronique ?"
        description="L'article sera retiré du blog et de la base. Action irréversible."
        confirmLabel="Supprimer"
        tone="danger"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={onDelete}
      />

      <AlertDialog
        open={!!error}
        title="Action impossible"
        description={error ?? ""}
        onClose={() => setError(null)}
      />
    </div>
  );
}

function ToolbarBtn({
  onClick,
  active = false,
  label,
  className,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded px-2.5 py-1 font-mono text-[12px] transition-colors",
        active
          ? "bg-cyan-200/[0.12] text-cyan-100"
          : "text-white/55 hover:bg-white/[0.06] hover:text-white",
        className,
      )}
    >
      {label}
    </button>
  );
}

function ToolbarSep() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-white/10" />;
}
