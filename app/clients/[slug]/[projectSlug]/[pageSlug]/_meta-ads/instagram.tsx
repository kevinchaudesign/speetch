/**
 * Renderers Instagram : Feed (image / vidéo / carrousel), Story, Reel,
 * Explore, Shop.
 *
 * Esthétique : chrome IG officielle (typo système, dégradé rose/orange pour
 * les rings Story). Carte unifiée style "post IG" max-w-[420px].
 */

import { cn } from "@/lib/utils";
import { getMetaCtaLabel } from "@/lib/meta-ads";
import type { MetaAdMockup } from "@/types/database";
import {
  Avatar,
  FeedCta,
  FramedMedia,
  PhoneFrame,
  SponsoredPill,
} from "./shared";

// ─── Feed (image / vidéo) ──────────────────────────────────────────────────

export function InstagramFeed({
  mockup,
  videoAspect = false,
}: {
  mockup: MetaAdMockup;
  videoAspect?: boolean;
}) {
  const { brand, copy, media, cta } = mockup;
  const aspect = videoAspect ? "aspect-[4/5]" : "aspect-square";
  return (
    <IgCard>
      <IgFeedHeader brand={brand} />
      <FramedMedia media={media} aspectClass={`${aspect} w-full`} />
      <IgActionBar />
      <FeedCta cta={cta} displayUrl={copy.display_url} variant="instagram" />
      {(copy.primary_text || copy.headline) && (
        <div className="space-y-1 px-4 pb-4 pt-2 text-[13px] leading-snug text-neutral-900">
          {copy.headline && (
            <p>
              <span className="font-semibold">{brand.name}</span>{" "}
              <span className="font-semibold">{copy.headline}</span>
            </p>
          )}
          {copy.primary_text && (
            <p className="whitespace-pre-line">
              {copy.headline ? "" : <span className="font-semibold">{brand.name}</span>}{" "}
              {copy.primary_text}
            </p>
          )}
        </div>
      )}
    </IgCard>
  );
}

// ─── Feed carrousel ────────────────────────────────────────────────────────

export function InstagramCarousel({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy, cta } = mockup;
  const cards = mockup.carousel ?? [];
  return (
    <IgCard>
      <IgFeedHeader brand={brand} />
      <div className="relative">
        <div className="flex w-full snap-x snap-mandatory overflow-x-auto bg-black">
          {cards.length === 0 ? (
            <div className="flex aspect-square w-full shrink-0 items-center justify-center bg-neutral-100 text-xs uppercase tracking-[0.32em] text-neutral-400">
              Carrousel vide
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="w-full shrink-0 snap-center">
                <FramedMedia
                  media={card.media}
                  aspectClass="aspect-square w-full"
                />
              </div>
            ))
          )}
        </div>
        {cards.length > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            1 / {cards.length}
          </span>
        )}
      </div>
      <IgActionBar />
      <FeedCta cta={cta} displayUrl={copy.display_url} variant="instagram" />
      {copy.primary_text && (
        <p className="whitespace-pre-line px-4 pb-4 pt-2 text-[13px] leading-snug text-neutral-900">
          <span className="font-semibold">{brand.name}</span> {copy.primary_text}
        </p>
      )}
    </IgCard>
  );
}

// ─── Story ─────────────────────────────────────────────────────────────────

export function InstagramStory({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy, media, cta } = mockup;
  return (
    <PhoneFrame>
      <div className="absolute inset-0">
        <FramedMedia media={media} aspectClass="h-full w-full" />
      </div>
      {/* Progress bar */}
      <div className="absolute inset-x-3 top-3 flex gap-1">
        <div className="h-0.5 flex-1 rounded-full bg-white/40">
          <div className="h-full w-2/3 rounded-full bg-white" />
        </div>
      </div>
      <div className="absolute inset-x-3 top-6 flex items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-2">
          <Avatar
            url={brand.avatar_url}
            name={brand.name}
            size={32}
            ring="instagram"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-white">
              {brand.name}
            </span>
            <SponsoredPill label={brand.sponsored_label ?? "Sponsorisé"} />
          </div>
        </div>
        <button
          type="button"
          className="text-white/85 text-lg"
          aria-label="Plus"
        >
          ⋯
        </button>
      </div>
      {copy.primary_text && (
        <p className="absolute inset-x-4 bottom-24 text-center text-[15px] font-medium leading-snug text-white drop-shadow-md">
          {copy.primary_text}
        </p>
      )}
      {cta !== "no_button" && (
        <div className="absolute inset-x-12 bottom-8">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-[13px] font-semibold text-neutral-900 shadow-lg"
          >
            ↑ {getMetaCtaLabel(cta)}
          </button>
        </div>
      )}
    </PhoneFrame>
  );
}

// ─── Reel ──────────────────────────────────────────────────────────────────

export function InstagramReel({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy, media, cta } = mockup;
  return (
    <PhoneFrame>
      <div className="absolute inset-0">
        <FramedMedia media={media} aspectClass="h-full w-full" />
      </div>
      {/* Header top transparent */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/55 to-transparent p-4 text-white">
        <span className="text-lg font-semibold">Reels</span>
        <button type="button" aria-label="Caméra" className="text-lg">
          📷
        </button>
      </div>
      {/* Colonne actions droite */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 text-white">
        <IgReelIcon glyph="♡" label="125k" />
        <IgReelIcon glyph="💬" label="2 480" />
        <IgReelIcon glyph="↗" label="Partager" />
        <IgReelIcon glyph="⋯" label="Plus" />
        <div className="mt-2 h-8 w-8 overflow-hidden rounded-md border border-white/80">
          <Avatar url={brand.avatar_url} name={brand.name} size={32} />
        </div>
      </div>
      {/* Footer */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pr-16 text-white">
        <div className="flex items-center gap-2">
          <Avatar url={brand.avatar_url} name={brand.name} size={28} />
          <span className="text-[13px] font-semibold">{brand.name}</span>
          <SponsoredPill label={brand.sponsored_label ?? "Sponsorisé"} />
        </div>
        {copy.primary_text && (
          <p className="line-clamp-2 text-[13px] leading-snug">
            {copy.primary_text}
          </p>
        )}
        {cta !== "no_button" && (
          <button
            type="button"
            className="mt-1 w-full rounded-md bg-white py-2 text-[13px] font-semibold text-neutral-900"
          >
            {getMetaCtaLabel(cta)}
          </button>
        )}
      </div>
    </PhoneFrame>
  );
}

// ─── Explore (tile dans la grille) ─────────────────────────────────────────

export function InstagramExplore({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy, media, cta } = mockup;
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-md border border-neutral-200 bg-white">
      <div className="relative">
        <FramedMedia media={media} aspectClass="aspect-square w-full" />
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
          Sponsorisé
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar url={brand.avatar_url} name={brand.name} size={28} />
        <span className="flex-1 truncate text-[13px] font-semibold text-neutral-900">
          {brand.name}
        </span>
        {cta !== "no_button" && (
          <button
            type="button"
            className="rounded-md bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white"
          >
            {getMetaCtaLabel(cta)}
          </button>
        )}
      </div>
      {copy.headline && (
        <p className="px-3 pb-3 text-[12px] leading-snug text-neutral-700">
          {copy.headline}
        </p>
      )}
    </div>
  );
}

// ─── Shop ──────────────────────────────────────────────────────────────────

export function InstagramShop({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy, media, cta } = mockup;
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-md border border-neutral-200 bg-white">
      <div className="relative">
        <FramedMedia media={media} aspectClass="aspect-square w-full" />
        <span className="absolute left-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-700">
          🛍 Shop
        </span>
      </div>
      <div className="space-y-1 px-3 py-3">
        {copy.headline && (
          <p className="text-[13px] font-semibold text-neutral-900">
            {copy.headline}
          </p>
        )}
        {copy.description && (
          <p className="text-[12px] text-neutral-500">{copy.description}</p>
        )}
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
          {brand.name}
        </p>
        {cta !== "no_button" && (
          <button
            type="button"
            className="mt-2 w-full rounded-md bg-neutral-900 py-1.5 text-[12px] font-semibold text-white"
          >
            {getMetaCtaLabel(cta)}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sous-composants IG internes ───────────────────────────────────────────

function IgCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-md border border-neutral-200 bg-white text-neutral-900">
      {children}
    </div>
  );
}

function IgFeedHeader({
  brand,
}: {
  brand: MetaAdMockup["brand"];
}) {
  return (
    <header className="flex items-center gap-3 px-4 py-3">
      <Avatar
        url={brand.avatar_url}
        name={brand.name}
        size={32}
        ring="instagram"
      />
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-[13px] font-semibold text-neutral-900">
          {brand.name}
        </span>
        <span className="text-[11px] text-neutral-500">
          {brand.sponsored_label ?? "Sponsorisé"}
        </span>
      </div>
      <button
        type="button"
        aria-label="Menu"
        className={cn("text-[18px] leading-none text-neutral-500")}
      >
        ⋯
      </button>
    </header>
  );
}

function IgActionBar() {
  return (
    <div className="flex items-center gap-4 px-4 py-2 text-[20px] text-neutral-800">
      <span>♡</span>
      <span>💬</span>
      <span>↗</span>
      <span className="ml-auto">🔖</span>
    </div>
  );
}

function IgReelIcon({ glyph, label }: { glyph: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl drop-shadow">{glyph}</span>
      <span className="text-[10px] font-medium drop-shadow">{label}</span>
    </div>
  );
}
