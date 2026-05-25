"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  SECTION_TYPES,
  type ChildSection,
  type ChildSectionType,
  type Section,
  type SectionType,
} from "@/lib/section-types";
import type { Page, PageContent } from "@/types/database";
import { Button, ConfirmDialog, Eyebrow, StatusBadge } from "@/lib/ds";
import { AutosaveField, type AutosaveResult } from "./autosave-input";
import { SectionEditor } from "./section-editor";
import {
  addChildSection,
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
import { MetaAdsAdminEditor } from "./meta-ads-admin-editor";
import type { MetaAdMockup } from "@/types/database";

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
  initialMetaAdsMockups,
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
  /**
   * Mockups Meta Ads pré-extraits côté serveur depuis `page.content.meta.meta_ads`.
   * On les reçoit en prop dédiée (et pas via `page.content`) parce que `page`
   * est mis dans un useState local — router.refresh() ne le réhydrate pas
   * après une mutation, mais les props serveur sont bien recalculées.
   */
  initialMetaAdsMockups: MetaAdMockup[];
}) {
  const [page, setPage] = useState<Page>(initialPage);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const content: PageContent = (page.content as PageContent) ?? {};
  const sections: Section[] = content.sections ?? [];
  const isRawHtml = content.meta?.style === "raw_html";
  const isDeliverables = content.meta?.style === "deliverables";
  const isMetaAds = content.meta?.style === "meta_ads";
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
      const next = (c.sections ?? []).map((s) => {
        if (s.id === updated.id) return updated;
        if (s.type === "container" && s.children?.some((ch) => ch.id === updated.id)) {
          return {
            ...s,
            children: s.children.map((ch) =>
              ch.id === updated.id
                ? ({ ...ch, ...updated, type: ch.type } as ChildSection)
                : ch,
            ),
          };
        }
        return s;
      });
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
        const sections = c.sections ?? [];
        const isTopLevel = sections.some((s) => s.id === sectionId);
        const next = isTopLevel
          ? sections.filter((s) => s.id !== sectionId)
          : sections.map((s) =>
              s.type === "container"
                ? {
                    ...s,
                    children: (s.children ?? []).filter(
                      (ch) => ch.id !== sectionId,
                    ),
                  }
                : s,
            );
        return { ...p, content: { ...c, sections: next } };
      });
    });
  }

  function handleAddChildSection(
    parentId: string,
    childType: ChildSectionType,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await addChildSection({
        ...context,
        parentId,
        childType,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const newChild = result.section as unknown as ChildSection;
      setPage((p) => {
        const c = (p.content as PageContent) ?? {};
        return {
          ...p,
          content: {
            ...c,
            sections: (c.sections ?? []).map((s) =>
              s.id === parentId
                ? { ...s, children: [...(s.children ?? []), newChild] }
                : s,
            ),
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
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field + scanlines + sabre — thème Conseil Jedi */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-50"
      />
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-16 left-2 top-24 hidden w-[2px] rounded-full md:block"
      />

      {/* Header mobile */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href={`/admin/clients/${clientId}/projects/${projectId}`}
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Mission
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Affûtage
        </span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col gap-12 pt-20">
        {/* Breadcrumb + actions */}
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link
              href="/admin/clients"
              className="transition-colors hover:text-cyan-100"
            >
              Holocrons
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href={`/admin/clients/${clientId}`}
              className="text-cyan-200/85 transition-colors hover:text-cyan-100"
            >
              {clientName}
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href={`/admin/clients/${clientId}/projects/${projectId}`}
              className="transition-colors hover:text-cyan-100"
            >
              {projectName}
            </Link>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex w-full max-w-2xl flex-col gap-3">
              <Eyebrow tracking="md" className="text-cyan-200/65">
                Titre du parchemin
              </Eyebrow>
              <AutosaveField
                initialValue={page.name}
                onSave={saveName}
                ariaLabel="Titre du parchemin"
                placeholder="Sans titre"
                className="w-full border-b border-cyan-200/25 bg-transparent pb-3 font-sans font-extralight tracking-[-0.05em] text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {publicHref && (
                <Button
                  href={publicHref}
                  target="_blank"
                  rel="noopener"
                  variant="primary"
                  className="text-cyan-200/65"
                >
                  Voir l&apos;holocron ↗
                </Button>
              )}
              <button
                type="button"
                onClick={togglePublish}
                disabled={pending}
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] transition-colors hover:text-cyan-100 disabled:opacity-50"
              >
                {page.is_published ? (
                  <>
                    <StatusBadge tone="success">Active</StatusBadge>
                    <span className="text-cyan-200/40">·</span>
                    <span className="text-cyan-200/65">D&eacute;sactiver</span>
                  </>
                ) : (
                  <>
                    <StatusBadge tone="warning">En forge</StatusBadge>
                    <span className="text-cyan-200/40">·</span>
                    <span className="text-cyan-200/65">Sceller</span>
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
            <p
              className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
              style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
            >
              {error}
            </p>
          )}

          {isRawHtml && (
            <div className="rounded-md border border-cyan-200/20 bg-cyan-200/[0.03] px-5 py-4">
              <Eyebrow tracking="md" className="text-cyan-200/85">
                Réplique fidèle
              </Eyebrow>
              <p className="mt-2 font-serif text-sm italic text-white/65 md:text-base">
                Le contenu de ce parchemin provient du HTML brut scellé dans son
                blueprint. L&apos;intro et les sections ci-dessous ne sont pas
                rendues côté public. Pour mettre à jour le contenu, confie un
                nouveau blueprint depuis{" "}
                <Link
                  href="/admin/templates/new"
                  className="underline decoration-cyan-200/40 transition-colors hover:text-cyan-100"
                >
                  Forge → Blueprints → Nouveau
                </Link>
                .
              </p>
            </div>
          )}

          {isDeliverables && (
            <div className="rounded-md border border-cyan-200/20 bg-cyan-200/[0.03] px-5 py-4">
              <Eyebrow tracking="md" className="text-cyan-200/85">
                Livrables (validation)
              </Eyebrow>
              <p className="mt-2 font-serif text-sm italic text-white/65 md:text-base">
                Ce parchemin affiche une galerie de livrables piochés dans la
                médiathèque de l&apos;holocron. Pour chaque livrable, le
                Padawan pourra laisser un retour et changer le statut
                (approuvé / modif demandée). L&apos;intro ci-dessous est
                rendue en tête de parchemin, les livrables se gèrent dans le
                bloc «&nbsp;Livrables&nbsp;» plus bas.
              </p>
            </div>
          )}

          {isMetaAds && (
            <div className="rounded-md border border-cyan-200/20 bg-cyan-200/[0.03] px-5 py-4">
              <Eyebrow tracking="md" className="text-cyan-200/85">
                Mockups Meta Ads
              </Eyebrow>
              <p className="mt-2 font-serif text-sm italic text-white/65 md:text-base">
                Ce parchemin présente une galerie de mockups publicitaires
                Facebook & Instagram. Chaque mockup combine un format Meta,
                une copy et un média de la médiathèque. L&apos;intro est
                rendue en tête de parchemin ; les mockups se gèrent dans le
                bloc «&nbsp;Mockups&nbsp;» plus bas. Lecture seule côté
                public.
              </p>
            </div>
          )}
        </div>

        {/* Intro */}
        <div className="flex flex-col gap-3">
          <Eyebrow tracking="md" className="text-cyan-200/65">
            Intro
          </Eyebrow>
          <AutosaveField
            multiline
            rows={3}
            initialValue={content.intro ?? ""}
            onSave={saveIntro}
            placeholder="Une phrase d'accroche pour démarrer le parchemin…"
            ariaLabel="Intro du parchemin"
            className="w-full resize-y rounded-md border border-cyan-200/15 bg-cyan-200/[0.02] p-4 font-serif italic text-base text-[#F5F5F7]/90 caret-cyan-200 placeholder:text-white/30 focus:border-cyan-200/50 focus:outline-none md:text-lg"
          />
        </div>

        {/* Sections OU livrables OU mockups Meta, selon style */}
        {isMetaAds ? (
          <div className="flex flex-col gap-6">
            <Eyebrow tracking="md" className="text-cyan-200/65">
              Mockups
            </Eyebrow>
            <MetaAdsAdminEditor
              ctx={context}
              initialMockups={initialMetaAdsMockups}
              availableMedia={availableMedia}
              availableFolders={availableFolders}
            />
          </div>
        ) : isDeliverables ? (
          <div className="flex flex-col gap-6">
            <Eyebrow tracking="md" className="text-cyan-200/65">
              Livrables
            </Eyebrow>
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
              <Eyebrow tracking="md" className="text-cyan-200/65">
                Sections · {sections.length}
              </Eyebrow>
            </div>

            {sections.length === 0 ? (
              <p className="rounded-xl border border-dashed border-cyan-200/20 bg-cyan-200/[0.02] p-8 text-center font-serif italic text-white/55">
                Ce parchemin n&apos;a aucune section. Ajoute-en une
                ci-dessous.
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
                    onAddChild={
                      s.type === "container"
                        ? (t) => handleAddChildSection(s.id, t)
                        : undefined
                    }
                    onReplaceChild={
                      s.type === "container"
                        ? (child) =>
                            handleReplaceSection(child as unknown as Section)
                        : undefined
                    }
                    onRemoveChild={
                      s.type === "container"
                        ? (childId) => handleRemoveSection(childId)
                        : undefined
                    }
                    onMoveChild={
                      s.type === "container"
                        ? (childId, d) => handleMoveSection(childId, d)
                        : undefined
                    }
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
            ← Retour mission
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDeleteOpen}
        tone="danger"
        title="Effacer définitivement ce parchemin ?"
        description="Toutes les sections et leurs médias seront effacés. Action irréversible."
        confirmLabel="Effacer le parchemin"
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
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-cyan-200/20 bg-cyan-200/[0.02] p-5">
      <span className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/65">
        + Ajouter une section
      </span>
      <ul className="flex flex-wrap gap-2">
        {SECTION_TYPES.map((t) => (
          <li key={t.value}>
            <button
              type="button"
              onClick={() => onAdd(t.value)}
              disabled={disabled}
              className="group inline-flex flex-col items-start gap-1 rounded-md border border-cyan-200/15 bg-black/30 px-3 py-2 text-left transition-colors hover:border-cyan-200/45 hover:bg-cyan-200/[0.04] disabled:opacity-50"
            >
              <span className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/75 transition-colors group-hover:text-cyan-100">
                {t.label}
              </span>
              <span className="font-serif text-xs italic text-white/55">
                {t.tagline}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
