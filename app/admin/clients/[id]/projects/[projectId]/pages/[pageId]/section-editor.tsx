"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  CHILD_SECTION_TYPES,
  getSectionTypeLabel,
  type ChildSection,
  type ChildSectionType,
  type Section,
} from "@/lib/section-types";
import {
  CODE_LANGUAGES,
  CODE_LANGUAGE_LABELS,
  type CodeLanguage,
} from "@/lib/code-highlight";
import { ConfirmDialog } from "@/lib/ds";
import { AutosaveField, type AutosaveResult } from "./autosave-input";
import { MediaUploader } from "./media-uploader";
import { updateSection } from "./actions";
import type { ActionContext } from "./actions-types";

type Props = {
  section: Section;
  index: number;
  total: number;
  context: ActionContext;
  onReplace: (s: Section) => void;
  onRemove: () => void;
  onMove: (direction: "up" | "down") => void;
  /** Présent uniquement quand section.type === "container". */
  onAddChild?: (type: ChildSectionType) => void;
  /** Présent uniquement quand section.type === "container". */
  onReplaceChild?: (child: ChildSection) => void;
  /** Présent uniquement quand section.type === "container". */
  onRemoveChild?: (childId: string) => void;
  /** Présent uniquement quand section.type === "container". */
  onMoveChild?: (childId: string, direction: "up" | "down") => void;
  /**
   * Accordéon : si défini, la section est repliable. Le header reste cliquable
   * pour basculer l'état. Le corps reste monté dans le DOM (display: none)
   * pour préserver l'état des autosaves et uploads en cours.
   * Si `undefined`, la section est toujours ouverte (rétro-compat, ex : enfants
   * d'un conteneur qui restent tous visibles).
   */
  isOpen?: boolean;
  onToggle?: () => void;
};

export function SectionEditor({
  section,
  index,
  total,
  context,
  onReplace,
  onRemove,
  onMove,
  onAddChild,
  onReplaceChild,
  onRemoveChild,
  onMoveChild,
  isOpen,
  onToggle,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Accordéon des enfants (utilisé uniquement quand section.type === "container",
  // mais le hook est déclaré systématiquement pour préserver l'ordre des hooks).
  const [openChildId, setOpenChildId] = useState<string | null>(null);

  async function savePatch(
    patch: Partial<Section>,
  ): Promise<AutosaveResult> {
    const result = await updateSection({
      ...context,
      sectionId: section.id,
      patch,
    });
    if (result.ok) {
      onReplace({ ...section, ...patch, id: section.id, type: section.type });
    }
    return result;
  }

  function handleConfirmRemove() {
    startTransition(() => {
      onRemove();
      setConfirmOpen(false);
    });
  }

  const isContainer = section.type === "container";
  const containerChildren = isContainer ? section.children ?? [] : [];

  // Auto-ouvre le dernier enfant quand un nouveau vient d'être ajouté
  // (addChildSection append toujours en fin du tableau).
  const prevChildrenCountRef = useRef(containerChildren.length);
  useEffect(() => {
    if (!isContainer) return;
    if (containerChildren.length > prevChildrenCountRef.current) {
      const newest = containerChildren[containerChildren.length - 1];
      if (newest) setOpenChildId(newest.id);
    }
    prevChildrenCountRef.current = containerChildren.length;
  }, [isContainer, containerChildren]);
  // collapsible si onToggle est fourni ; sinon toujours ouvert (cas des enfants
  // de conteneur, ou rétro-compat).
  const collapsible = typeof onToggle === "function";
  const open = collapsible ? isOpen === true : true;
  const titlePreview = (section.title ?? "").trim();

  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.015] p-6 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="group flex flex-1 min-w-0 items-center gap-3 rounded-md py-1 text-left transition-colors hover:opacity-90"
          >
            <span
              aria-hidden
              className={`inline-block text-white/45 transition-transform duration-200 ${
                open ? "rotate-90" : ""
              }`}
            >
              ▸
            </span>
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/30">
              {String(index + 1).padStart(2, "0")}
              <span className="mx-2 text-white/15">/</span>
              {String(total).padStart(2, "0")}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.28em] text-white/70">
              {getSectionTypeLabel(section.type)}
            </span>
            <span
              className={`min-w-0 flex-1 truncate font-sans text-sm font-light md:text-base ${
                titlePreview ? "text-white/85" : "italic text-white/35"
              }`}
            >
              {titlePreview || "Sans titre"}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/30">
              {String(index + 1).padStart(2, "0")}
              <span className="mx-2 text-white/15">/</span>
              {String(total).padStart(2, "0")}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.28em] text-white/70">
              {getSectionTypeLabel(section.type)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={index === 0 || pending}
            aria-label="Monter la section"
            className="rounded-md px-2 py-1 text-sm text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={index === total - 1 || pending}
            aria-label="Descendre la section"
            className="rounded-md px-2 py-1 text-sm text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={pending}
            aria-label="Supprimer la section"
            className="rounded-md px-2 py-1 text-sm text-white/55 transition-colors hover:bg-white/[0.05] hover:text-red-300/80 disabled:opacity-30"
          >
            ×
          </button>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title={
          isContainer
            ? "Supprimer ce conteneur et tous ses blocs enfants ?"
            : "Supprimer cette section ?"
        }
        description={
          isContainer
            ? "Le conteneur et tous les blocs qu'il contient (y compris leurs médias) seront effacés. Action irréversible."
            : "Les médias attachés à la section seront aussi effacés du stockage. Action irréversible."
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        pending={pending}
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className={open ? "flex flex-col gap-6" : "hidden"}>
      <AutosaveField
        initialValue={section.title ?? ""}
        onSave={(v) => savePatch({ title: v })}
        placeholder={
          isContainer
            ? "Titre du conteneur (optionnel)"
            : "Titre de la section"
        }
        ariaLabel="Titre"
        className="w-full border-b border-white/15 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] placeholder:text-white/30 focus:border-white/60 focus:outline-none md:text-xl"
      />

      {section.type === "text" && (
        <AutosaveField
          multiline
          rows={6}
          initialValue={section.body ?? ""}
          onSave={(v) => savePatch({ body: v })}
          placeholder="Corps du texte…"
          ariaLabel="Corps du texte"
          className="w-full resize-y rounded-md border border-white/10 bg-white/[0.02] p-4 font-serif text-base text-[#F5F5F7]/90 placeholder:text-white/30 focus:border-white/40 focus:outline-none"
        />
      )}

      {section.type === "embed" && (
        <AutosaveField
          initialValue={section.embedUrl ?? ""}
          onSave={(v) => savePatch({ embedUrl: v })}
          placeholder="https://vimeo.com/… · https://youtu.be/… · https://figma.com/file/…"
          ariaLabel="URL à intégrer"
          className="w-full border-b border-white/15 bg-transparent pb-3 font-mono text-sm text-[#F5F5F7] placeholder:text-white/30 focus:border-white/60 focus:outline-none"
        />
      )}

      {(section.type === "image" || section.type === "video") && (
        <MediaUploader
          section={section}
          context={context}
          mode="single"
          accept={section.type === "image" ? "image/*" : "video/*"}
          onSectionReplace={onReplace}
        />
      )}

      {section.type === "gallery" && (
        <MediaUploader
          section={section}
          context={context}
          mode="multi"
          accept="image/*"
          onSectionReplace={onReplace}
        />
      )}

      {section.type === "code" && (
        <div className="flex flex-col gap-4">
          <LanguageSelect
            value={section.language}
            onChange={(language) => savePatch({ language })}
            disabled={pending}
          />
          <AutosaveField
            multiline
            rows={10}
            initialValue={section.code ?? ""}
            onSave={(v) => savePatch({ code: v })}
            placeholder="// Colle ton code ici…"
            ariaLabel="Code"
            className="w-full resize-y rounded-md border border-white/10 bg-black/40 p-4 font-mono text-[13px] leading-relaxed text-[#F5F5F7]/90 placeholder:text-white/30 focus:border-white/40 focus:outline-none"
          />
        </div>
      )}

      {isContainer && (
        <div className="flex flex-col gap-4 rounded-xl border border-cyan-200/15 bg-cyan-200/[0.015] p-4 md:p-5">
          <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/65">
            Blocs du conteneur · {containerChildren.length}
          </span>

          {containerChildren.length === 0 ? (
            <p className="rounded-md border border-dashed border-cyan-200/15 bg-black/20 p-5 text-center font-serif italic text-white/45">
              Ce conteneur est vide. Ajoute un bloc ci-dessous.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {containerChildren.map((child, j) => (
                <SectionEditor
                  key={child.id}
                  section={child as Section}
                  index={j}
                  total={containerChildren.length}
                  context={context}
                  onReplace={(s) =>
                    onReplaceChild?.(s as unknown as ChildSection)
                  }
                  onRemove={() => onRemoveChild?.(child.id)}
                  onMove={(d) => onMoveChild?.(child.id, d)}
                  isOpen={openChildId === child.id}
                  onToggle={() =>
                    setOpenChildId((prev) =>
                      prev === child.id ? null : child.id,
                    )
                  }
                />
              ))}
            </div>
          )}

          {onAddChild && (
            <AddChildBar onAdd={onAddChild} disabled={pending} />
          )}
        </div>
      )}
      </div>
    </article>
  );
}

function AddChildBar({
  onAdd,
  disabled,
}: {
  onAdd: (type: ChildSectionType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-cyan-200/20 bg-black/20 p-4">
      <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/65">
        + Ajouter un bloc dans le conteneur
      </span>
      <ul className="flex flex-wrap gap-2">
        {CHILD_SECTION_TYPES.map((t) => (
          <li key={t.value}>
            <button
              type="button"
              onClick={() => onAdd(t.value)}
              disabled={disabled}
              className="group inline-flex items-center gap-2 rounded-md border border-cyan-200/15 bg-black/30 px-3 py-1.5 transition-colors hover:border-cyan-200/45 hover:bg-cyan-200/[0.04] disabled:opacity-50"
            >
              <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75 transition-colors group-hover:text-cyan-100">
                {t.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LanguageSelect({
  value,
  onChange,
  disabled,
}: {
  value: string | undefined;
  onChange: (next: CodeLanguage) => void;
  disabled?: boolean;
}) {
  const current: CodeLanguage =
    value && (CODE_LANGUAGES as readonly string[]).includes(value)
      ? (value as CodeLanguage)
      : "text";
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
        Langage
      </span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value as CodeLanguage)}
        disabled={disabled}
        className="w-fit border-b border-white/15 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] focus:border-white/60 focus:outline-none"
      >
        {CODE_LANGUAGES.map((lang) => (
          <option key={lang} value={lang} className="bg-black text-white/85">
            {CODE_LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>
    </label>
  );
}
