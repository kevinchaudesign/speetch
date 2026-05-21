/**
 * Renderers Facebook : Feed (image / vidéo / carrousel), Story, Reel,
 * Right Column, Marketplace, In-stream.
 *
 * Esthétique : palette FB officielle (bleu #1877f2, gris #f0f2f5), typo
 * système. Chaque mockup s'inscrit dans une carte rounded-xl border qui
 * imite le rendu desktop FB.
 */

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

export function FacebookFeed({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy, media, cta } = mockup;
  return (
    <FbCard>
      <FbFeedHeader brand={brand} />
      {copy.primary_text && (
        <p className="whitespace-pre-line px-4 pb-3 text-[14px] leading-snug text-neutral-900">
          {copy.primary_text}
        </p>
      )}
      <FramedMedia media={media} aspectClass="aspect-square w-full" />
      <FeedCta
        cta={cta}
        displayUrl={copy.display_url}
        variant="facebook"
      />
      {(copy.headline || copy.description) && (
        <div className="px-4 pb-3 pt-2">
          {copy.headline && (
            <p className="text-[14px] font-semibold leading-snug text-neutral-900">
              {copy.headline}
            </p>
          )}
          {copy.description && (
            <p className="mt-0.5 text-[13px] leading-snug text-neutral-600">
              {copy.description}
            </p>
          )}
        </div>
      )}
      <FbActionBar />
    </FbCard>
  );
}

// ─── Feed carrousel ────────────────────────────────────────────────────────

export function FacebookCarousel({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy } = mockup;
  const cards = mockup.carousel ?? [];
  return (
    <FbCard>
      <FbFeedHeader brand={brand} />
      {copy.primary_text && (
        <p className="whitespace-pre-line px-4 pb-3 text-[14px] leading-snug text-neutral-900">
          {copy.primary_text}
        </p>
      )}
      <div className="flex w-full gap-2 overflow-x-auto bg-[#f0f2f5] p-3">
        {cards.length === 0 ? (
          <div className="flex aspect-square w-3/4 shrink-0 items-center justify-center bg-white text-xs uppercase tracking-[0.32em] text-neutral-400">
            Carrousel vide
          </div>
        ) : (
          cards.map((card) => (
            <div
              key={card.id}
              className="w-3/4 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm"
            >
              <FramedMedia
                media={card.media}
                aspectClass="aspect-square w-full"
              />
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  {card.headline && (
                    <p className="truncate text-[13px] font-semibold text-neutral-900">
                      {card.headline}
                    </p>
                  )}
                  {card.description && (
                    <p className="truncate text-[12px] text-neutral-500">
                      {card.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md bg-[#e4e6eb] px-2.5 py-1 text-[12px] font-semibold text-neutral-900"
                >
                  {getMetaCtaLabel(card.cta ?? mockup.cta)}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <FbActionBar />
    </FbCard>
  );
}

// ─── Story ─────────────────────────────────────────────────────────────────

export function FacebookStory({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy, media, cta } = mockup;
  return (
    <PhoneFrame>
      <div className="absolute inset-0">
        <FramedMedia media={media} aspectClass="h-full w-full" />
      </div>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/55 to-transparent p-4">
        <div className="flex items-center gap-2">
          <Avatar url={brand.avatar_url} name={brand.name} size={32} />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-white">
              {brand.name}
            </span>
            <SponsoredPill label={brand.sponsored_label ?? "Sponsorisé"} />
          </div>
        </div>
      </div>
      {copy.primary_text && (
        <p className="absolute inset-x-4 bottom-24 text-center text-[15px] font-medium leading-snug text-white drop-shadow-md">
          {copy.primary_text}
        </p>
      )}
      {cta !== "no_button" && (
        <div className="absolute inset-x-6 bottom-6">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 text-[13px] font-semibold text-neutral-900 shadow-lg"
          >
            ↑ {getMetaCtaLabel(cta)}
          </button>
        </div>
      )}
    </PhoneFrame>
  );
}

// ─── Reel ──────────────────────────────────────────────────────────────────

export function FacebookReel({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy, media, cta } = mockup;
  return (
    <PhoneFrame>
      <div className="absolute inset-0">
        <FramedMedia media={media} aspectClass="h-full w-full" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
        <div className="flex items-center gap-2">
          <Avatar url={brand.avatar_url} name={brand.name} size={36} />
          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-[13px] font-semibold text-white">
              {brand.name}
            </span>
            <SponsoredPill label={brand.sponsored_label ?? "Sponsorisé"} />
          </div>
          <button
            type="button"
            className="rounded-full border border-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white"
          >
            Suivre
          </button>
        </div>
        {copy.primary_text && (
          <p className="line-clamp-2 text-[13px] leading-snug text-white/95">
            {copy.primary_text}
          </p>
        )}
        {cta !== "no_button" && (
          <button
            type="button"
            className="w-full rounded-md bg-white py-2 text-[13px] font-semibold text-neutral-900"
          >
            {getMetaCtaLabel(cta)}
          </button>
        )}
      </div>
      {/* Colonne d'actions à droite */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4 text-white">
        <ReelIcon glyph="♡" label="Like" />
        <ReelIcon glyph="💬" label="Com." />
        <ReelIcon glyph="↗" label="Part." />
        <ReelIcon glyph="⋯" label="Plus" />
      </div>
    </PhoneFrame>
  );
}

// ─── Right column (desktop) ────────────────────────────────────────────────

export function FacebookRightColumn({ mockup }: { mockup: MetaAdMockup }) {
  const { copy, media, cta } = mockup;
  return (
    <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm">
      <p className="px-3 pb-2 pt-2 text-[11px] uppercase tracking-[0.12em] text-neutral-500">
        Sponsorisé
      </p>
      <FramedMedia media={media} aspectClass="aspect-[1.91/1] w-full" />
      <div className="px-3 py-3">
        {copy.headline && (
          <p className="text-[14px] font-semibold leading-tight text-neutral-900">
            {copy.headline}
          </p>
        )}
        {copy.display_url && (
          <p className="mt-1 text-[12px] uppercase tracking-[0.1em] text-neutral-500">
            {copy.display_url}
          </p>
        )}
        {copy.description && (
          <p className="mt-1 text-[12px] leading-snug text-neutral-600">
            {copy.description}
          </p>
        )}
        {cta !== "no_button" && (
          <button
            type="button"
            className="mt-3 w-full rounded-md bg-[#1877f2] py-1.5 text-[12px] font-semibold text-white"
          >
            {getMetaCtaLabel(cta)}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Marketplace ───────────────────────────────────────────────────────────

export function FacebookMarketplace({ mockup }: { mockup: MetaAdMockup }) {
  const { copy, media } = mockup;
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm">
      <FramedMedia media={media} aspectClass="aspect-square w-full" />
      <div className="px-3 py-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
          Sponsorisé
        </p>
        {copy.headline && (
          <p className="mt-1 text-[14px] font-semibold leading-tight text-neutral-900">
            {copy.headline}
          </p>
        )}
        {copy.display_url && (
          <p className="mt-1 text-[12px] text-neutral-500">
            {copy.display_url}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── In-stream (vidéo 16:9 partenaire) ─────────────────────────────────────

export function FacebookInStream({ mockup }: { mockup: MetaAdMockup }) {
  const { brand, copy, media, cta } = mockup;
  return (
    <div className="mx-auto w-full max-w-[640px] overflow-hidden rounded-md border border-neutral-200 bg-black">
      <div className="relative">
        <FramedMedia media={media} aspectClass="aspect-video w-full" />
        <div className="absolute left-3 top-3 rounded bg-black/65 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
          Publicité · {brand.name}
        </div>
        {cta !== "no_button" && (
          <button
            type="button"
            className="absolute bottom-3 right-3 rounded bg-[#1877f2] px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            {getMetaCtaLabel(cta)}
          </button>
        )}
      </div>
      {copy.headline && (
        <p className="bg-white px-4 py-3 text-[14px] font-semibold text-neutral-900">
          {copy.headline}
        </p>
      )}
    </div>
  );
}

// ─── Sous-composants FB internes ───────────────────────────────────────────

function FbCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-sm">
      {children}
    </div>
  );
}

function FbFeedHeader({
  brand,
}: {
  brand: MetaAdMockup["brand"];
}) {
  return (
    <header className="flex items-center gap-3 px-4 py-3">
      <Avatar url={brand.avatar_url} name={brand.name} size={40} />
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-[14px] font-semibold text-neutral-900">
          {brand.name}
        </span>
        <span className="text-[12px] text-neutral-500">
          {brand.sponsored_label ?? "Sponsorisé"} · 🌐
        </span>
      </div>
      <button
        type="button"
        aria-label="Menu"
        className="text-[18px] leading-none text-neutral-500"
      >
        ⋯
      </button>
    </header>
  );
}

function FbActionBar() {
  return (
    <div className="grid grid-cols-3 border-t border-neutral-200 bg-white text-[13px] font-medium text-neutral-600">
      {[
        { label: "J'aime", glyph: "👍" },
        { label: "Commenter", glyph: "💬" },
        { label: "Partager", glyph: "↗" },
      ].map((a) => (
        <button
          key={a.label}
          type="button"
          className="flex items-center justify-center gap-1.5 py-2"
        >
          <span>{a.glyph}</span>
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

function ReelIcon({ glyph, label }: { glyph: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl drop-shadow">{glyph}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider drop-shadow">
        {label}
      </span>
    </div>
  );
}
