"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  SECTION_TYPES,
  type Section,
  type SectionType,
} from "@/lib/section-types";
import type { Page, PageContent } from "@/types/database";
import { Button, ConfirmDialog, Eyebrow, StatusBadge } from "@/lib/ds";
import { AutosaveField, type AutosaveResult } from "./autosave-input";
import { SectionEditor } from "./section-editor";
import {
  addSection,
  deletePage,
  moveSection,
  removeSection,
  updatePageIntro,
  updatePageName,
  updatePagePublished,
} from "./actions";
import type { ActionContext } from "./actions-types";
import {
  DeliverablesAdminEditor,
  type AdminDeliverable,
  type AdminFolderOption,
  type AdminMediaOption,
} from "./deliverables-admin-editor";

export function PageEditor({
  initialPage,
  clientId,
  projectId,
  projectName,
  clientName,
  publicHref,
  initialDeliverables,
  availableMedia,
  availableFolders,
}: {
  initialPage: Page;
  clientId: string;
  projectId: string;
  projectName: string;
  clientName: string;
  publicHref: string | null;
  /** Non-null UNIQUEMENT si la page est en mode style="deliverables". */
  initialDeliverables: AdminDeliverable[] | null;
  /** Médias dispo dans la médiathèque client pour le picker. */
  availableMedia: AdminMediaOption[];
  /** Dossiers de la médiathèque pour la sidebar du picker. */
  availableFolders: AdminFolderOption[];
}) {
  const [page, setPage] = useState<Page>(initialPage);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const content: PageContent = (page.content as PageContent) ?? {};
  const sections: Section[] = content.sections ?? [];
  const isRawHtml = content.meta?.style === "raw_html";
  const isDeliverables = content.meta?.style === "deliverables";
  const context: ActionContext = {
    profileId: clientId,
    projectId,
    pageId: page.id,
  };

  async function saveName(name: string): Promise<AutosaveResult> {
    const result = await updatePageName({ ...context, name });
    if (result.ok) setPage((p) => ({ ...p, name }));
    return result;
  }

  async function saveIntro(intro: string): Promise<AutosaveResult> {
    const result = await updatePageIntro({ ...context, intro });
    if (result.ok) {
      setPage((p) => ({
        ...p,
        content: { ...((p.content as PageContent) ?? {}), intro },
      }));
    }
    return result;
  }

  function togglePublish() {
    const next = !page.is_published;
    setError(null);
    startTransition(async () => {
      const result = await updatePagePublished({
        ...context,
        isPublished: next,
      });
      if (result.ok) {
        setPage((p) => ({ ...p, is_published: next }));
      } else {
        setError(result.error);
      }
    });
  }

  function handleAddSection(type: SectionType) {
    setError(null);
    startTransition(async () => {
      const result = await addSection({ ...context, type });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPage((p) => {
        const c = (p.content as PageContent) ?? {};
        return {
          ...p,
          content: { ...c, sections: [...(c.sections ?? []), result.section] },
        };
      });
    });
  }

  function handleReplaceSection(updated: Section) {
    setPage((p) => {
      const c = (p.content as PageContent) ?? {};
      const next = (c.sections ?? []).map((s) =>
        s.id === updated.id ? updated : s,
      );
      return { ...p, content: { ...c, sections: next } };
    });
  }

  function handleRemoveSection(sectionId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeSection({ ...context, sectionId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPage((p) => {
        const c = (p.content as PageContent) ?? {};
        return {
          ...p,
          content: {
            ...c,
            sections: (c.sections ?? []).filter((s) => s.id !== sectionId),
          },
        };
      });
    });
  }

  function handleMoveSection(sectionId: string, direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      const result = await moveSection({
        ...context,
        sectionId,
        direction,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPage((p) => ({
        ...p,
        content: {
          ...((p.content as PageContent) ?? {}),
          sections: result.sections,
        },
      }));
    });
  }

  function confirmDeletePage() {
    startTransition(async () => {
      await deletePage(context);
    });
  }

  return (
    <div className="relative min-h-svh w-full px-6 py-10 md:px-16 md:py-14">
      {/* Header mobile */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href={`/admin/clients/${clientId}/projects/${projectId}`}
          className="text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          ← Projet
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          Édition
        </span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col gap-12 pt-20">
        {/* Breadcrumb + actions */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            <Link
              href="/admin/clients"
              className="transition-colors hover:text-white"
            >
              Espaces clients
            </Link>
            <span className="mx-3 text-white/20">→</span>
            <span className="text-white/55">{clientName}</span>
            <span className="mx-3 text-white/20">→</span>
            <Link
              href={`/admin/clients/${clientId}/projects/${projectId}`}
              className="transition-colors hover:text-white"
            >
              {projectName}
            </Link>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex w-full max-w-2xl flex-col gap-3">
              <Eyebrow tracking="md">Titre de la page</Eyebrow>
              <AutosaveField
                initialValue={page.name}
                onSave={saveName}
                ariaLabel="Titre de la page"
                placeholder="Sans titre"
                className="w-full border-b border-white/20 bg-transparent pb-3 font-sans font-extralight tracking-[-0.05em] text-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {publicHref && (
                <Button
                  href={publicHref}
                  target="_blank"
                  rel="noopener"
                  variant="primary"
                  className="text-white/55"
                >
                  Voir public
                </Button>
              )}
              <button
                type="button"
                onClick={togglePublish}
                disabled={pending}
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] transition-colors hover:text-white disabled:opacity-50"
              >
                {page.is_published ? (
                  <>
                    <StatusBadge tone="success">Publi&eacute;e</StatusBadge>
                    <span className="text-white/40">·</span>
                    <span className="text-white/55">D&eacute;publier</span>
                  </>
                ) : (
                  <>
                    <StatusBadge tone="warning">Brouillon</StatusBadge>
                    <span className="text-white/40">·</span>
                    <span className="text-white/55">Publier</span>
                  </>
                )}
              </button>

              <Button
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={pending}
                variant="danger"
              >
                Supprimer
              </Button>
            </div>
          </div>

          {error && (
            <p className="border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
              {error}
            </p>
          )}

          {isRawHtml && (
            <div className="rounded-md border border-white/15 bg-white/[0.03] px-5 py-4">
              <Eyebrow tracking="md" intensity="strong">
                Reproduction fidèle
              </Eyebrow>
              <p className="mt-2 font-serif text-sm italic text-white/55 md:text-base">
                Le contenu de cette page provient du HTML brut stocké dans son
                template. L&apos;intro et les sections ci-dessous ne sont pas
                rendues sur la page publique. Pour mettre à jour le contenu,
                ré-importe un nouveau template depuis{" "}
                <Link
                  href="/admin/templates/new"
                  className="underline decoration-white/30 transition-colors hover:text-white"
                >
                  Réglages → Templates → Nouveau
                </Link>
                .
              </p>
            </div>
          )}

          {isDeliverables && (
            <div className="rounded-md border border-white/15 bg-white/[0.03] px-5 py-4">
              <Eyebrow tracking="md" intensity="strong">
                Livrables (validation)
              </Eyebrow>
              <p className="mt-2 font-serif text-sm italic text-white/55 md:text-base">
                Cette page affiche une galerie de livrables piochés dans la
                médiathèque du client. Pour chaque livrable, le client pourra
                laisser un retour et changer le statut (approuvé / modif
                demandée). L&apos;intro ci-dessous est rendue en tête de page,
                les livrables se gèrent dans le bloc « Livrables » plus bas.
              </p>
            </div>
          )}
        </div>

        {/* Intro */}
        <div className="flex flex-col gap-3">
          <Eyebrow tracking="md">Intro</Eyebrow>
          <AutosaveField
            multiline
            rows={3}
            initialValue={content.intro ?? ""}
            onSave={saveIntro}
            placeholder="Une phrase d'accroche pour démarrer la page…"
            ariaLabel="Intro de la page"
            className="w-full resize-y rounded-md border border-white/10 bg-white/[0.02] p-4 font-serif italic text-base text-[#F5F5F7]/90 placeholder:text-white/30 focus:border-white/40 focus:outline-none md:text-lg"
          />
        </div>

        {/* Sections OU livrables, selon style */}
        {isDeliverables ? (
          <div className="flex flex-col gap-6">
            <Eyebrow tracking="md">Livrables</Eyebrow>
            <DeliverablesAdminEditor
              ctx={context}
              initialDeliverables={initialDeliverables ?? []}
              availableMedia={availableMedia}
              availableFolders={availableFolders}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-baseline justify-between">
              <Eyebrow tracking="md">Sections · {sections.length}</Eyebrow>
            </div>

            {sections.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center font-serif italic text-white/45">
                Cette page n&apos;a aucune section. Ajoute-en une ci-dessous.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {sections.map((s, i) => (
                  <SectionEditor
                    key={s.id}
                    section={s}
                    index={i}
                    total={sections.length}
                    context={context}
                    onReplace={handleReplaceSection}
                    onRemove={() => handleRemoveSection(s.id)}
                    onMove={(d) => handleMoveSection(s.id, d)}
                  />
                ))}
              </div>
            )}

            <AddSectionBar onAdd={handleAddSection} disabled={pending} />
          </div>
        )}

        <div className="flex items-center pt-4">
          <Button
            href={`/admin/clients/${clientId}/projects/${projectId}`}
            variant="ghost"
          >
            ← Retour projet
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDeleteOpen}
        tone="danger"
        title="Supprimer définitivement cette page ?"
        description="Toutes les sections et leurs médias seront effacés. Action irréversible."
        confirmLabel="Supprimer la page"
        cancelLabel="Annuler"
        pending={pending}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          confirmDeletePage();
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}

function AddSectionBar({
  onAdd,
  disabled,
}: {
  onAdd: (type: SectionType) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5">
      <span className="text-[11px] uppercase tracking-[0.32em] text-white/55">
        + Ajouter une section
      </span>
      <ul className="flex flex-wrap gap-2">
        {SECTION_TYPES.map((t) => (
          <li key={t.value}>
            <button
              type="button"
              onClick={() => onAdd(t.value)}
              disabled={disabled}
              className="group inline-flex flex-col items-start gap-1 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-left transition-colors hover:border-white/40 hover:bg-white/[0.04] disabled:opacity-50"
            >
              <span className="text-[11px] uppercase tracking-[0.32em] text-white/70 transition-colors group-hover:text-white">
                {t.label}
              </span>
              <span className="font-serif text-xs italic text-white/40">
                {t.tagline}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
