/**
 * Briques partagées par tous les renderers Meta (Facebook + Instagram).
 *
 * Tout est local à `_meta-ads/` : avatar circulaire, bouton CTA, médias
 * (image/vidéo) avec ratio cadré. Aucun export vers le reste de l'app.
 */

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getMetaCtaLabel } from "@/lib/meta-ads";
import type { MetaAdCta, MetaAdMedia } from "@/types/database";

export function Avatar({
  url,
  name,
  size = 40,
  ring,
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
  ring?: "instagram" | null;
}) {
  const px = `${size}px`;
  const ringClass =
    ring === "instagram"
      ? "ring-2 ring-offset-2 ring-offset-white ring-pink-500"
      : "";
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-neutral-200",
        ringClass,
      )}
      style={{ width: px, height: px }}
    >
      {url ? (
        <Image
          src={url}
          alt={name}
          width={size * 2}
          height={size * 2}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-neutral-500"
          style={{ fontSize: size * 0.4 }}
        >
          {(name?.[0] ?? "?").toUpperCase()}
        </span>
      )}
    </div>
  );
}

/** Cadre d'un média avec ratio forcé. Image OR video OR placeholder. */
export function FramedMedia({
  media,
  aspectClass,
  rounded,
  className,
}: {
  media: MetaAdMedia | null | undefined;
  aspectClass: string;
  rounded?: string;
  className?: string;
}) {
  const round = rounded ?? "";
  if (!media) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-100 text-xs uppercase tracking-[0.32em] text-neutral-400",
          aspectClass,
          round,
          className,
        )}
      >
        Média manquant
      </div>
    );
  }
  if (media.mime_type.startsWith("image/")) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-black",
          aspectClass,
          round,
          className,
        )}
      >
        <Image
          src={media.url}
          alt=""
          fill
          sizes="(min-width: 1024px) 600px, 100vw"
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }
  if (media.mime_type.startsWith("video/")) {
    return (
      <div
        className={cn(
          "overflow-hidden bg-black",
          aspectClass,
          round,
          className,
        )}
      >
        <video
          src={media.url}
          poster={media.poster_url ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-neutral-100 text-xs uppercase tracking-[0.32em] text-neutral-400",
        aspectClass,
        round,
        className,
      )}
    >
      {media.mime_type}
    </div>
  );
}

/**
 * Bouton CTA "feed" — style FB/IG : full-width, fond neutre, flèche à droite.
 * Hidden si cta === "no_button".
 */
export function FeedCta({
  cta,
  displayUrl,
  variant = "facebook",
}: {
  cta: MetaAdCta;
  displayUrl?: string | null;
  variant?: "facebook" | "instagram";
}) {
  if (cta === "no_button") return null;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3",
        variant === "facebook"
          ? "border-t border-neutral-200 bg-[#f0f2f5]"
          : "border-t border-neutral-200 bg-white",
      )}
    >
      <div className="flex min-w-0 flex-col">
        {displayUrl && (
          <span className="truncate text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            {displayUrl}
          </span>
        )}
        <span className="truncate text-[13px] font-semibold text-neutral-900">
          {getMetaCtaLabel(cta)}
        </span>
      </div>
      <button
        type="button"
        className={cn(
          "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors",
          variant === "facebook"
            ? "bg-[#e4e6eb] text-neutral-900 hover:bg-[#d8dadf]"
            : "border border-neutral-300 text-neutral-900 hover:bg-neutral-50",
        )}
      >
        {getMetaCtaLabel(cta)}
      </button>
    </div>
  );
}

/** Pastille "Sponsorisé" minuscule, utilisée par les variantes story/reel. */
export function SponsoredPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm">
      {label}
    </span>
  );
}

/**
 * Wrapper "phone" — colonne portrait 9:16 sur fond noir, utilisée pour
 * stories / reels / formats verticaux.
 */
export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-[36px] border-[6px] border-neutral-900 bg-black shadow-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
