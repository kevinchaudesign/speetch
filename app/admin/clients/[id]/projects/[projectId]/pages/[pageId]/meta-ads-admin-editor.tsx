"use client";

/**
 * Éditeur admin des mockups Meta Ads (Facebook + Instagram).
 *
 * Pattern aligné sur DeliverablesAdminEditor : liste de cartes, picker de
 * format à la création, picker média réutilisé (mêmes types `AdminMediaOption` /
 * `AdminFolderOption`). Stocke tout dans `pages.content.meta.meta_ads[]` via
 * les server actions de `meta-ads-actions.ts`.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, ConfirmDialog, Modal, ModalHeader } from "@/lib/ds";
import { cn } from "@/lib/utils";
import {
  META_AD_FORMATS,
  META_CTAS,
  formatDimensions,
  getMetaAdFormatSpec,
  getMetaPlatformLabel,
  type MetaAdFormatSpec,
} from "@/lib/meta-ads";
import { MockupRenderer } from "@/app/clients/[slug]/[projectSlug]/[pageSlug]/_meta-ads/renderer";
import type {
  MetaAdCta,
  MetaAdFormat,
  MetaAdMockup,
  MetaAdPlatform,
} from "@/types/database";
import type {
  AdminFolderOption,
  AdminMediaOption,
} from "./deliverables-admin-editor";
import {
  addCarouselCard,
  createMetaAdMockup,
  deleteCarouselCard,
  deleteMetaAdMockup,
  reorderMetaAdMockups,
  updateCarouselCard,
  updateMetaAdMockup,
  type MetaAdsActionContext,
  type UpdateMockupPatch,
} from "./meta-ads-actions";

// ─── Composant racine ───────────────────────────────────────────────────────

export function MetaAdsAdminEditor({
  ctx,
  initialMockups,
  availableMedia,
  availableFolders,
}: {
  ctx: MetaAdsActionContext;
  initialMockups: MetaAdMockup[];
  availableMedia: AdminMediaOption[];
  availableFolders: AdminFolderOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formatPickerOpen, setFormatPickerOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const mockups = useMemo(
    () => [...initialMockups].sort((a, b) => a.position - b.position),
    [initialMockups],
  );

  function handleAdd(format: MetaAdFormat) {
    setError(null);
    setFormatPickerOpen(false);
    startTransition(async () => {
      const res = await createMetaAdMockup({ ctx, format });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(mockupId: string) {
    setError(null);
    setConfirmDeleteId(null);
    startTransition(async () => {
      const res = await deleteMetaAdMockup({ ctx, mockupId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleMove(mockupId: string, direction: "up" | "down") {
    setError(null);
    const ids = mockups.map((m) => m.id);
    const idx = ids.indexOf(mockupId);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[idx], next[target]] = [next[target], next[idx]];
    startTransition(async () => {
      const res = await reorderMetaAdMockups({ ctx, mockupIds: next });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const confirmTarget =
    confirmDeleteId != null
      ? mockups.find((m) => m.id === confirmDeleteId) ?? null
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/45">
          {mockups.length} mockup{mockups.length > 1 ? "s" : ""}
        </span>
        <Button
          variant="primary"
          onClick={() => setFormatPickerOpen(true)}
          pending={pending}
          pendingLabel="Ajout…"
        >
          + Nouveau mockup
        </Button>
      </div>

      {error && (
        <p className="border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
          {error}
        </p>
      )}

      {mockups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center font-serif italic text-white/45">
          Aucun mockup. Choisis un format pour démarrer.
        </p>
      ) : (
        <ul className="flex flex-col gap-8">
          {mockups.map((m, i) => (
            <li key={m.id}>
              <MockupCard
                ctx={ctx}
                mockup={m}
                index={i}
                total={mockups.length}
                pending={pending}
                availableMedia={availableMedia}
                availableFolders={availableFolders}
                onMove={(dir) => handleMove(m.id, dir)}
                onRequestDelete={() => setConfirmDeleteId(m.id)}
                onLocalRefresh={() => router.refresh()}
              />
            </li>
          ))}
        </ul>
      )}

      <FormatPickerModal
        open={formatPickerOpen}
        onClose={() => setFormatPickerOpen(false)}
        onPick={handleAdd}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Supprimer ce mockup ?"
        description={
          confirmTarget ? (
            <span>
              <span className="font-serif italic">
                {confirmTarget.label ||
                  getMetaAdFormatSpec(confirmTarget.format)?.label ||
                  "Mockup"}
              </span>{" "}
              sera définitivement supprimé. Le média source dans la médiathèque
              n&apos;est pas touché.
            </span>
          ) : null
        }
        confirmLabel="Supprimer"
        tone="danger"
        pending={pending}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

// ─── Carte d'un mockup ─────────────────────────────────────────────────────

function MockupCard({
  ctx,
  mockup,
  index,
  total,
  pending,
  availableMedia,
  availableFolders,
  onMove,
  onRequestDelete,
  onLocalRefresh,
}: {
  ctx: MetaAdsActionContext;
  mockup: MetaAdMockup;
  index: number;
  total: number;
  pending: boolean;
  availableMedia: AdminMediaOption[];
  availableFolders: AdminFolderOption[];
  onMove: (direction: "up" | "down") => void;
  onRequestDelete: () => void;
  onLocalRefresh: () => void;
}) {
  const spec = getMetaAdFormatSpec(mockup.format);
  const platform: MetaAdPlatform = spec?.platform ?? "facebook";
  const isCarousel = spec?.carousel === true;

  const [collapsed, setCollapsed] = useState(true);
  const [mediaPickerOpen, setMediaPickerOpen] = useState<
    "main" | "avatar" | { kind: "carousel"; cardId: string } | null
  >(null);

  function handleSetMedia(mediaId: string) {
    const target = mediaPickerOpen;
    setMediaPickerOpen(null);
    if (!target) return;
    void (async () => {
      if (target === "main") {
        const res = await updateMetaAdMockup({
          ctx,
          mockupId: mockup.id,
          patch: { media_id: mediaId },
        });
        if (res.ok) onLocalRefresh();
      } else if (target === "avatar") {
        const res = await updateMetaAdMockup({
          ctx,
          mockupId: mockup.id,
          patch: { brand: { avatar_media_id: mediaId } },
        });
        if (res.ok) onLocalRefresh();
      } else {
        const res = await updateCarouselCard({
          ctx,
          mockupId: mockup.id,
          cardId: target.cardId,
          patch: { media_id: mediaId },
        });
        if (res.ok) onLocalRefresh();
      }
    })();
  }

  function handleAddCarouselCard(mediaId: string) {
    setMediaPickerOpen(null);
    void (async () => {
      const res = await addCarouselCard({
        ctx,
        mockupId: mockup.id,
        mediaId,
      });
      if (res.ok) onLocalRefresh();
    })();
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      {/* Header carte */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
            Mockup {String(index + 1).padStart(2, "0")} ·{" "}
            <span
              className={cn(
                platform === "facebook" ? "text-sky-300/70" : "text-pink-300/70",
              )}
            >
              {spec?.label ?? getMetaPlatformLabel(platform)}
            </span>
          </p>
          <h3 className="mt-1 font-sans text-xl font-extralight tracking-[-0.02em] text-[#F5F5F7]">
            {mockup.label || (
              <span className="italic text-white/40">Sans étiquette</span>
            )}
          </h3>
          <p className="mt-1 font-serif text-sm italic text-white/45">
            {spec?.tagline}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={pending || index === 0}
            aria-label="Monter ce mockup"
            className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={pending || index === total - 1}
            aria-label="Descendre ce mockup"
            className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
          <Button variant="danger" onClick={onRequestDelete} pending={pending}>
            Supprimer
          </Button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Déplier le mockup" : "Replier le mockup"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/15 text-white/55 transition-colors hover:border-white/45 hover:text-white"
          >
            <span
              className={cn(
                "inline-block text-[13px] leading-none transition-transform duration-300",
                collapsed ? "rotate-0" : "rotate-180",
              )}
            >
              ▾
            </span>
          </button>
        </div>
      </div>

      {collapsed ? (
        <CollapsedSummary mockup={mockup} spec={spec} />
      ) : (
        <>
          {/* Aperçu live — reflète le state serveur (mis à jour ~600ms après
              chaque autosave). Lecture seule ; éviter de saisir directement. */}
          <LivePreview mockup={mockup} />

          {/* Champs : format + label */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormatInline
          ctx={ctx}
          mockupId={mockup.id}
          value={mockup.format}
          onChanged={onLocalRefresh}
        />
        <TextInline
          ctx={ctx}
          mockupId={mockup.id}
          field="label"
          label="Étiquette interne"
          placeholder="ex: Hook A · variation crème"
          initialValue={mockup.label ?? ""}
        />
      </div>

      {/* Brand */}
      <fieldset className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/30 p-5">
        <legend className="px-1 text-[10px] uppercase tracking-[0.4em] text-white/40">
          Marque & profil
        </legend>
        <div className="flex flex-wrap items-start gap-5">
          <AvatarThumb
            url={mockup.brand.avatar_url ?? null}
            onPick={() => setMediaPickerOpen("avatar")}
            onClear={async () => {
              await updateMetaAdMockup({
                ctx,
                mockupId: mockup.id,
                patch: { brand: { avatar_media_id: null } },
              });
              onLocalRefresh();
            }}
          />
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <TextInline
              ctx={ctx}
              mockupId={mockup.id}
              field="brand.name"
              label={platform === "instagram" ? "Handle / nom" : "Nom de page"}
              placeholder={
                platform === "instagram" ? "ton_handle" : "Ma Marque"
              }
              initialValue={mockup.brand.name}
            />
            {platform === "facebook" && (
              <TextInline
                ctx={ctx}
                mockupId={mockup.id}
                field="brand.sponsored_label"
                label="Sous-ligne (FB)"
                placeholder="Sponsorisé · 🌐"
                initialValue={mockup.brand.sponsored_label ?? ""}
              />
            )}
          </div>
        </div>
      </fieldset>

      {/* Copy */}
      <fieldset className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/30 p-5">
        <legend className="px-1 text-[10px] uppercase tracking-[0.4em] text-white/40">
          Copy publicitaire
        </legend>
        <TextInline
          ctx={ctx}
          mockupId={mockup.id}
          field="copy.primary_text"
          label="Texte principal (au-dessus du média)"
          placeholder="Ton accroche qui apparaît en haut du post…"
          initialValue={mockup.copy.primary_text ?? ""}
          multiline
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInline
            ctx={ctx}
            mockupId={mockup.id}
            field="copy.headline"
            label="Titre (sous le média)"
            placeholder="Titre court et percutant"
            initialValue={mockup.copy.headline ?? ""}
          />
          <TextInline
            ctx={ctx}
            mockupId={mockup.id}
            field="copy.description"
            label="Description (petite ligne grise)"
            placeholder="Sous-titre descriptif"
            initialValue={mockup.copy.description ?? ""}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextInline
            ctx={ctx}
            mockupId={mockup.id}
            field="copy.display_url"
            label="URL affichée"
            placeholder="speetch.fr"
            initialValue={mockup.copy.display_url ?? ""}
          />
          <CtaInline
            ctx={ctx}
            mockupId={mockup.id}
            value={mockup.cta}
            onChanged={onLocalRefresh}
          />
        </div>
      </fieldset>

          {/* Média principal ou carrousel */}
          {isCarousel ? (
            <CarouselEditor
              ctx={ctx}
              mockup={mockup}
              onRequestAddCard={() =>
                setMediaPickerOpen({ kind: "carousel", cardId: "__new__" })
              }
              onRequestSwapCard={(cardId) =>
                setMediaPickerOpen({ kind: "carousel", cardId })
              }
              onChanged={onLocalRefresh}
            />
          ) : (
            <MediaThumbAdmin
              url={mockup.media?.url ?? null}
              mimeType={mockup.media?.mime_type ?? null}
              onPick={() => setMediaPickerOpen("main")}
              onClear={async () => {
                await updateMetaAdMockup({
                  ctx,
                  mockupId: mockup.id,
                  patch: { media_id: null },
                });
                onLocalRefresh();
              }}
            />
          )}
        </>
      )}

      <MediaPickerModal
        open={mediaPickerOpen !== null}
        media={availableMedia}
        folders={availableFolders}
        restrictToImages={mediaPickerOpen === "avatar"}
        onClose={() => setMediaPickerOpen(null)}
        onPick={(mediaId) => {
          if (
            mediaPickerOpen &&
            typeof mediaPickerOpen === "object" &&
            mediaPickerOpen.cardId === "__new__"
          ) {
            handleAddCarouselCard(mediaId);
          } else {
            handleSetMedia(mediaId);
          }
        }}
      />
    </div>
  );
}

// ─── Format picker (sélection à la création) ────────────────────────────────

function FormatPickerModal({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (f: MetaAdFormat) => void;
}) {
  const groups: Array<{ platform: MetaAdPlatform; items: typeof META_AD_FORMATS }> =
    [
      {
        platform: "facebook",
        items: META_AD_FORMATS.filter((f) => f.platform === "facebook"),
      },
      {
        platform: "instagram",
        items: META_AD_FORMATS.filter((f) => f.platform === "instagram"),
      },
    ];

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader
        title="Nouveau mockup"
        subtitle="Choisir un format Meta"
        onClose={onClose}
      />
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-6">
        {groups.map((g) => (
          <div key={g.platform} className="flex flex-col gap-3">
            <p
              className={cn(
                "text-[10px] uppercase tracking-[0.4em]",
                g.platform === "facebook" ? "text-sky-300/70" : "text-pink-300/70",
              )}
            >
              {getMetaPlatformLabel(g.platform)}
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {g.items.map((f) => (
                <li key={f.value}>
                  <button
                    type="button"
                    onClick={() => onPick(f.value)}
                    className="group flex w-full items-stretch gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left transition-colors hover:border-white/40 hover:bg-white/[0.04]"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                      <FormatPreview spec={f} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex w-full items-baseline justify-between gap-3">
                        <span className="text-[11px] uppercase tracking-[0.32em] text-white/75">
                          {f.label.replace(/^(Facebook|Instagram) · /, "")}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-white/55">
                          {formatDimensions(f.dimensions)}
                        </span>
                      </div>
                      <span className="font-serif text-xs italic text-white/45">
                        {f.tagline}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─── Format preview (mini-wireframe par surface) ───────────────────────────

/**
 * Mini-aperçu visuel d'un format Meta dans le picker. Le contenu évoque le
 * chrome (header carte feed, progress bar story, dots reel à droite, etc.)
 * en dégradés de gris pour rester discret.
 *
 * Dimensions explicites en px (cap à BOX=56) pour garder les cartes du
 * picker à hauteur uniforme : les formats 9:16 finiraient sinon à 100+ px
 * de haut et casseraient l'alignement de la grille.
 */
function FormatPreview({ spec }: { spec: MetaAdFormatSpec }) {
  const BOX = 56;
  let width = BOX;
  let height = BOX;
  switch (spec.aspect) {
    case "9:16":
      width = Math.round((BOX * 9) / 16);
      height = BOX;
      break;
    case "4:5":
      width = Math.round((BOX * 4) / 5);
      height = BOX;
      break;
    case "16:9":
      width = BOX;
      height = Math.round((BOX * 9) / 16);
      break;
    case "1.91:1":
      width = BOX;
      height = Math.round(BOX / 1.91);
      break;
    case "1:1":
    case "auto":
    default:
      width = BOX;
      height = BOX;
      break;
  }
  return (
    <div
      style={{ width, height }}
      className="overflow-hidden rounded-sm bg-white/[0.06] ring-1 ring-inset ring-white/15"
    >
      <PreviewBySurface spec={spec} />
    </div>
  );
}

function PreviewBySurface({ spec }: { spec: MetaAdFormatSpec }) {
  switch (spec.surface) {
    case "feed":
      return <PreviewFeed platform={spec.platform} carousel={spec.carousel} />;
    case "story":
      return <PreviewStory platform={spec.platform} />;
    case "reel":
      return <PreviewReel />;
    case "right_column":
      return <PreviewRightColumn />;
    case "in_stream":
      return <PreviewInStream />;
    case "shop":
      return <PreviewShop />;
    default:
      return <div className="h-full w-full bg-white/[0.04]" />;
  }
}

/**
 * Carte de feed : barre header (avatar + lignes), média, barre d'actions.
 * Carrousel = on suggère un deuxième cadre décalé derrière.
 */
function PreviewFeed({
  platform,
  carousel,
}: {
  platform: MetaAdPlatform;
  carousel: boolean;
}) {
  const accent =
    platform === "facebook" ? "bg-sky-300/55" : "bg-pink-300/55";
  return (
    <div className="relative flex h-full w-full flex-col bg-white/[0.04]">
      {carousel && (
        <div className="absolute inset-y-1 right-0 w-1/12 rounded-sm bg-white/10" />
      )}
      <div className="flex items-center gap-0.5 px-1 py-0.5">
        <span className={cn("h-1 w-1 rounded-full", accent)} />
        <span className="h-0.5 flex-1 rounded bg-white/25" />
      </div>
      <div className="flex-1 bg-white/15" />
      <div className="flex items-center gap-0.5 px-1 py-0.5">
        <span className="h-0.5 w-1.5 rounded bg-white/30" />
        <span className="h-0.5 w-1.5 rounded bg-white/30" />
        <span className="h-0.5 w-1.5 rounded bg-white/30" />
      </div>
    </div>
  );
}

/** Story : barre progress en haut, contenu, sticker CTA en bas. */
function PreviewStory({ platform }: { platform: MetaAdPlatform }) {
  const accent =
    platform === "facebook" ? "bg-sky-300/55" : "bg-pink-300/55";
  return (
    <div className="relative h-full w-full bg-white/15">
      <div className="absolute inset-x-0.5 top-0.5 flex gap-0.5">
        <span className="h-0.5 flex-1 rounded-full bg-white/70" />
      </div>
      <span
        className={cn(
          "absolute left-1 top-1.5 h-1 w-1 rounded-full",
          accent,
        )}
      />
      <span className="absolute inset-x-1 bottom-1 h-1 rounded-full bg-white/80" />
    </div>
  );
}

/** Reel : contenu plein + colonne de dots à droite. */
function PreviewReel() {
  return (
    <div className="relative h-full w-full bg-white/15">
      <div className="absolute right-0.5 top-1/3 flex flex-col items-center gap-1">
        <span className="h-0.5 w-0.5 rounded-full bg-white/85" />
        <span className="h-0.5 w-0.5 rounded-full bg-white/85" />
        <span className="h-0.5 w-0.5 rounded-full bg-white/85" />
      </div>
      <span className="absolute inset-x-1 bottom-1 h-0.5 rounded bg-white/70" />
    </div>
  );
}

/** Right column : encart paysage avec ligne de texte en bas. */
function PreviewRightColumn() {
  return (
    <div className="flex h-full w-full flex-col bg-white/[0.04]">
      <div className="flex-1 bg-white/15" />
      <div className="flex flex-col gap-0.5 px-1 py-0.5">
        <span className="h-0.5 w-full rounded bg-white/35" />
        <span className="h-0.5 w-3/4 rounded bg-white/25" />
      </div>
    </div>
  );
}

/** In-stream : cadre vidéo avec triangle play. */
function PreviewInStream() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-white/15">
      <span
        aria-hidden
        className="block h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent border-l-white/90"
      />
    </div>
  );
}

/** Shop : tuile carrée avec sticker en haut. */
function PreviewShop() {
  return (
    <div className="relative h-full w-full bg-white/15">
      <span className="absolute left-1 top-1 h-1 w-2 rounded-sm bg-white/75" />
    </div>
  );
}

// ─── Résumé condensé (état replié) ─────────────────────────────────────────

/**
 * Vue minimale d'un mockup quand sa carte est repliée : mini wireframe à
 * gauche + headline + dimensions à droite. Sert de repère visuel rapide pour
 * scroller une longue liste sans déplier chaque carte.
 */
function CollapsedSummary({
  mockup,
  spec,
}: {
  mockup: MetaAdMockup;
  spec: MetaAdFormatSpec | null;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
      {spec && (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center">
          <FormatPreview spec={spec} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-serif text-sm italic text-white/65">
          {mockup.copy.headline ||
            mockup.copy.primary_text ||
            "Sans copy"}
        </p>
        <p className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-white/40">
          <span>{mockup.brand.name}</span>
          {spec && (
            <>
              <span className="text-white/20">·</span>
              <span className="font-mono text-white/50">
                {formatDimensions(spec.dimensions)}
              </span>
            </>
          )}
          {mockup.media === null &&
            (!mockup.carousel || mockup.carousel.length === 0) && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-amber-300/70">média manquant</span>
              </>
            )}
        </p>
      </div>
    </div>
  );
}

// ─── Live preview (rendu réel du mockup, lecture seule) ────────────────────

/**
 * Aperçu live d'un mockup admin. Réutilise exactement le même renderer que la
 * page publique (`MockupRenderer`), placé dans une zone neutre claire pour
 * détacher visuellement le rendu Meta (chrome blanc) du fond sombre admin.
 *
 * Limite UX : le rendu reflète l'état serveur, pas la valeur en frappe. Après
 * environ 600 ms d'inactivité, l'autosave fire → router.refresh → nouveau
 * prop mockup → aperçu se met à jour.
 */
function LivePreview({ mockup }: { mockup: MetaAdMockup }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
        Aperçu en direct
      </p>
      <div className="flex w-full justify-center overflow-hidden rounded-xl bg-[#f5f5f7] p-6 ring-1 ring-inset ring-white/5">
        {/*
          Désactive les interactions (la zone est purement décorative) et
          empêche tout focus accidentel par tab. Le rendu Meta a des
          <button> qu'on ne veut pas activables ici.
        */}
        <div
          className="pointer-events-none w-full max-w-full"
          aria-hidden
          tabIndex={-1}
        >
          <MockupRenderer mockup={mockup} />
        </div>
      </div>
    </div>
  );
}

// ─── Sous-composants : format select inline ─────────────────────────────────

function FormatInline({
  ctx,
  mockupId,
  value,
  onChanged,
}: {
  ctx: MetaAdsActionContext;
  mockupId: string;
  value: MetaAdFormat;
  onChanged: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
        Format Meta
      </span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as MetaAdFormat;
          start(async () => {
            const res = await updateMetaAdMockup({
              ctx,
              mockupId,
              patch: { format: next },
            });
            if (!res.ok) setError(res.error);
            else {
              setError(null);
              onChanged();
            }
          });
        }}
        className="w-full border-0 border-b border-white/15 bg-transparent py-2 text-sm text-[#F5F5F7] outline-none transition-colors focus:border-white/45"
      >
        {META_AD_FORMATS.map((f) => (
          <option key={f.value} value={f.value} className="bg-black">
            {f.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
          {error}
        </p>
      )}
    </div>
  );
}

function CtaInline({
  ctx,
  mockupId,
  value,
  onChanged,
}: {
  ctx: MetaAdsActionContext;
  mockupId: string;
  value: MetaAdCta;
  onChanged: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
        Bouton CTA
      </span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as MetaAdCta;
          start(async () => {
            const res = await updateMetaAdMockup({
              ctx,
              mockupId,
              patch: { cta: next },
            });
            if (res.ok) onChanged();
          });
        }}
        className="w-full border-0 border-b border-white/15 bg-transparent py-2 text-sm text-[#F5F5F7] outline-none transition-colors focus:border-white/45"
      >
        {META_CTAS.map((c) => (
          <option key={c.value} value={c.value} className="bg-black">
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Sous-composant : text inline autosave ─────────────────────────────────

const FIELD_INPUT =
  "w-full border-0 border-b border-white/15 bg-transparent py-2 text-sm text-[#F5F5F7] outline-none transition-colors placeholder:text-white/30 focus:border-white/45";
const FIELD_TEXTAREA =
  "w-full resize-y border border-white/15 bg-white/[0.02] px-3 py-2 text-sm text-[#F5F5F7] outline-none transition-colors placeholder:text-white/30 focus:border-white/35";

type InlineField =
  | "label"
  | "brand.name"
  | "brand.sponsored_label"
  | "copy.primary_text"
  | "copy.headline"
  | "copy.description"
  | "copy.display_url";

function buildPatch(field: InlineField, raw: string): UpdateMockupPatch {
  const value = raw.trim();
  const v: string | null = value.length > 0 ? value : null;
  switch (field) {
    case "label":
      return { label: v };
    case "brand.name":
      return { brand: { name: v ?? "Annonceur" } };
    case "brand.sponsored_label":
      return { brand: { sponsored_label: v } };
    case "copy.primary_text":
      return { copy: { primary_text: v } };
    case "copy.headline":
      return { copy: { headline: v } };
    case "copy.description":
      return { copy: { description: v } };
    case "copy.display_url":
      return { copy: { display_url: v } };
  }
}

function TextInline({
  ctx,
  mockupId,
  field,
  label,
  placeholder,
  initialValue,
  multiline,
}: {
  ctx: MetaAdsActionContext;
  mockupId: string;
  field: InlineField;
  label: string;
  placeholder?: string;
  initialValue: string;
  multiline?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState(initialValue);
  const [handle, setHandle] = useState<ReturnType<typeof setTimeout> | null>(
    null,
  );

  function schedule(next: string) {
    if (handle) clearTimeout(handle);
    if (next === lastSaved) return;
    const h = setTimeout(async () => {
      setSaving(true);
      const res = await updateMetaAdMockup({
        ctx,
        mockupId,
        patch: buildPatch(field, next),
      });
      setSaving(false);
      if (res.ok) {
        setLastSaved(next);
        setError(null);
      } else {
        setError(res.error);
      }
    }, 600);
    setHandle(h);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-white/45">
        <span>{label}</span>
        {saving && <span className="text-white/30">…</span>}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            schedule(e.target.value);
          }}
          placeholder={placeholder}
          rows={3}
          className={FIELD_TEXTAREA}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            schedule(e.target.value);
          }}
          placeholder={placeholder}
          className={FIELD_INPUT}
          autoComplete="off"
        />
      )}
      {error && (
        <p className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Carrousel editor ──────────────────────────────────────────────────────

function CarouselEditor({
  ctx,
  mockup,
  onRequestAddCard,
  onRequestSwapCard,
  onChanged,
}: {
  ctx: MetaAdsActionContext;
  mockup: MetaAdMockup;
  onRequestAddCard: () => void;
  onRequestSwapCard: (cardId: string) => void;
  onChanged: () => void;
}) {
  const cards = mockup.carousel ?? [];
  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/30 p-5">
      <legend className="px-1 text-[10px] uppercase tracking-[0.4em] text-white/40">
        Carrousel · {cards.length} carte{cards.length > 1 ? "s" : ""}
      </legend>
      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-6 text-center font-serif italic text-white/45">
          Ajoute des cartes pour démarrer le carrousel.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {cards.map((card, i) => (
            <li
              key={card.id}
              className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4 md:flex-row"
            >
              <div className="w-full shrink-0 md:w-40">
                <MediaThumbAdmin
                  url={card.media?.url ?? null}
                  mimeType={card.media?.mime_type ?? null}
                  compact
                  onPick={() => onRequestSwapCard(card.id)}
                  onClear={async () => {
                    await updateCarouselCard({
                      ctx,
                      mockupId: mockup.id,
                      cardId: card.id,
                      patch: { media_id: null },
                    });
                    onChanged();
                  }}
                />
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <p className="text-[10px] uppercase tracking-[0.32em] text-white/35">
                  Carte {String(i + 1).padStart(2, "0")}
                </p>
                <CarouselTextInline
                  ctx={ctx}
                  mockupId={mockup.id}
                  cardId={card.id}
                  field="headline"
                  label="Titre"
                  initialValue={card.headline ?? ""}
                />
                <CarouselTextInline
                  ctx={ctx}
                  mockupId={mockup.id}
                  cardId={card.id}
                  field="description"
                  label="Description"
                  initialValue={card.description ?? ""}
                />
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteCarouselCard({
                        ctx,
                        mockupId: mockup.id,
                        cardId: card.id,
                      });
                      onChanged();
                    }}
                    className="text-[10px] uppercase tracking-[0.32em] text-red-300/70 transition-colors hover:text-red-200"
                  >
                    Retirer la carte
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button variant="ghost" onClick={onRequestAddCard}>
          + Ajouter une carte
        </Button>
      </div>
    </fieldset>
  );
}

function CarouselTextInline({
  ctx,
  mockupId,
  cardId,
  field,
  label,
  initialValue,
}: {
  ctx: MetaAdsActionContext;
  mockupId: string;
  cardId: string;
  field: "headline" | "description";
  label: string;
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(initialValue);
  const [handle, setHandle] = useState<ReturnType<typeof setTimeout> | null>(
    null,
  );

  function schedule(next: string) {
    if (handle) clearTimeout(handle);
    if (next === lastSaved) return;
    const h = setTimeout(async () => {
      setSaving(true);
      const res = await updateCarouselCard({
        ctx,
        mockupId,
        cardId,
        patch: { [field]: next.trim() || null },
      });
      setSaving(false);
      if (res.ok) setLastSaved(next);
    }, 600);
    setHandle(h);
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-white/45">
        <span>{label}</span>
        {saving && <span className="text-white/30">…</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          schedule(e.target.value);
        }}
        className={FIELD_INPUT}
        autoComplete="off"
      />
    </div>
  );
}

// ─── Media thumb admin + avatar thumb ─────────────────────────────────────

function MediaThumbAdmin({
  url,
  mimeType,
  compact,
  onPick,
  onClear,
}: {
  url: string | null;
  mimeType: string | null;
  compact?: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  const heightClass = compact ? "max-h-[160px]" : "max-h-[420px]";
  if (!url) {
    return (
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "flex w-full items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:border-white/35 hover:bg-white/[0.04]",
          compact ? "aspect-square" : "aspect-video",
        )}
      >
        + Choisir un média
      </button>
    );
  }
  const isImage = mimeType?.startsWith("image/");
  const isVideo = mimeType?.startsWith("video/");
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]",
          heightClass,
        )}
      >
        {isImage && (
          <Image
            src={url}
            alt="Média"
            width={1600}
            height={1200}
            sizes="(min-width: 1024px) 800px, 100vw"
            className={cn("block w-auto object-contain", heightClass)}
            unoptimized={mimeType === "image/svg+xml"}
          />
        )}
        {isVideo && (
          <video
            src={url}
            controls
            preload="metadata"
            playsInline
            className={cn("block w-full", heightClass)}
          />
        )}
        {!isImage && !isVideo && (
          <div className="flex aspect-video items-center justify-center text-[10px] uppercase tracking-[0.32em] text-white/40">
            {mimeType ?? "média"}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPick}
          className="text-[10px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
        >
          Changer le média
        </button>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] uppercase tracking-[0.32em] text-white/35 transition-colors hover:text-red-300"
        >
          Retirer
        </button>
      </div>
    </div>
  );
}

function AvatarThumb({
  url,
  onPick,
  onClear,
}: {
  url: string | null;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onPick}
        className="relative h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white/[0.04] transition-colors hover:border-white/40"
      >
        {url ? (
          <Image
            src={url}
            alt="Avatar"
            width={128}
            height={128}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.28em] text-white/35">
            Avatar
          </span>
        )}
      </button>
      {url && (
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] uppercase tracking-[0.28em] text-white/35 transition-colors hover:text-red-300"
        >
          Retirer
        </button>
      )}
    </div>
  );
}

// ─── Media picker modal (subset, ré-implémenté minimal) ─────────────────────

type FolderSelection =
  | { kind: "all" }
  | { kind: "loose" }
  | { kind: "folder"; id: string };

function MediaPickerModal({
  open,
  media,
  folders,
  restrictToImages,
  onClose,
  onPick,
}: {
  open: boolean;
  media: AdminMediaOption[];
  folders: AdminFolderOption[];
  restrictToImages?: boolean;
  onClose: () => void;
  onPick: (mediaId: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [selection, setSelection] = useState<FolderSelection>({ kind: "all" });

  if (!open) return null;

  let pool = media;
  if (restrictToImages) {
    pool = pool.filter((m) => m.mime_type.startsWith("image/"));
  }
  if (selection.kind === "loose") {
    pool = pool.filter((m) => m.folder_id === null);
  } else if (selection.kind === "folder") {
    pool = pool.filter((m) => m.folder_id === selection.id);
  }
  const filtered = filter.trim()
    ? pool.filter((m) =>
        m.filename.toLowerCase().includes(filter.toLowerCase()),
      )
    : pool;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90svh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-6 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
              {restrictToImages ? "Choisir une image" : "Choisir un média"}
            </p>
            <h2 className="mt-1 font-sans text-2xl font-extralight tracking-[-0.02em] text-[#F5F5F7]">
              Médiathèque client
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
          >
            Fermer ×
          </button>
        </header>

        <div className="border-b border-white/10 px-6 py-4">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par nom…"
            className="w-full border-0 border-b border-white/15 bg-transparent py-2 text-sm text-[#F5F5F7] outline-none placeholder:text-white/30 focus:border-white/45"
            autoFocus
          />
        </div>

        <div className="flex flex-1 min-h-0">
          <aside className="w-56 shrink-0 overflow-y-auto border-r border-white/10 p-4">
            <p className="px-2 text-[10px] uppercase tracking-[0.4em] text-white/40">
              Dossiers
            </p>
            <ul className="mt-3 flex flex-col gap-1">
              <li>
                <button
                  type="button"
                  onClick={() => setSelection({ kind: "all" })}
                  className={cn(
                    "block w-full px-2 py-1.5 text-left text-[11px] uppercase tracking-[0.32em] transition-colors",
                    selection.kind === "all"
                      ? "text-white"
                      : "text-white/45 hover:text-white",
                  )}
                >
                  Tous
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSelection({ kind: "loose" })}
                  className={cn(
                    "block w-full px-2 py-1.5 text-left text-[11px] uppercase tracking-[0.32em] transition-colors",
                    selection.kind === "loose"
                      ? "text-white"
                      : "text-white/45 hover:text-white",
                  )}
                >
                  Hors dossier
                </button>
              </li>
              {folders.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setSelection({ kind: "folder", id: f.id })}
                    className={cn(
                      "block w-full px-2 py-1.5 text-left text-[11px] uppercase tracking-[0.32em] transition-colors",
                      selection.kind === "folder" && selection.id === f.id
                        ? "text-white"
                        : "text-white/45 hover:text-white",
                    )}
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex-1 overflow-y-auto p-6">
            {filtered.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/15 p-8 text-center font-serif italic text-white/40">
                Aucun média trouvé.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {filtered.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => onPick(m.id)}
                      className="group block w-full overflow-hidden rounded-lg border border-white/10 bg-black/30 text-left transition-colors hover:border-white/40"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-black">
                        {m.mime_type.startsWith("image/") ? (
                          <Image
                            src={m.public_url}
                            alt={m.filename}
                            fill
                            sizes="200px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized={m.mime_type === "image/svg+xml"}
                          />
                        ) : m.mime_type.startsWith("video/") ? (
                          <video
                            src={m.public_url}
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.32em] text-white/40">
                            {m.mime_type}
                          </div>
                        )}
                      </div>
                      <div className="px-2 py-2">
                        <p className="truncate text-[10px] text-white/55">
                          {m.filename}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
