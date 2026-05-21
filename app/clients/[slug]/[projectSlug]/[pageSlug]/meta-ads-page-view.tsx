"use client";

/**
 * Rendu public des pages "Meta Ads".
 *
 * Reçoit la liste de mockups depuis le content de la page, dispatche sur le
 * bon renderer par format (Facebook / Instagram), et présente le tout dans
 * une galerie sombre cohérente avec le reste de l'espace client.
 *
 * Lecture seule v1 — pas de feedback ni de statut par mockup.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  META_AD_FORMATS,
  getMetaAdFormatSpec,
  getMetaPlatformLabel,
} from "@/lib/meta-ads";
import type { MetaAdMockup, MetaAdPlatform } from "@/types/database";
import { MockupRenderer } from "./_meta-ads/renderer";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function MetaAdsPageView({
  clientSlug,
  clientName,
  projectSlug,
  projectName,
  pageName,
  intro,
  mockups,
}: {
  clientSlug: string;
  clientName: string;
  projectSlug: string;
  projectName: string;
  pageName: string;
  intro: string | null;
  mockups: MetaAdMockup[];
}) {
  const ordered = [...mockups].sort((a, b) => a.position - b.position);

  // Groupe FB/IG pour les ancres de filtre (purement visuel).
  const counts = ordered.reduce(
    (acc, m) => {
      const spec = getMetaAdFormatSpec(m.format);
      const platform: MetaAdPlatform = spec?.platform ?? "facebook";
      acc[platform] += 1;
      return acc;
    },
    { facebook: 0, instagram: 0 },
  );

  return (
    <div className="relative min-h-svh w-full">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/65 px-6 py-5 backdrop-blur-md md:px-12">
        <Link
          href={`/clients/${clientSlug}/${projectSlug}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
          <span>Retour {projectName}</span>
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          {clientName}
        </span>
      </header>

      <section className="px-6 pt-20 md:px-12 md:pt-32">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
          <Link
            href={`/clients/${clientSlug}`}
            className="transition-colors hover:text-white"
          >
            {clientName}
          </Link>
          <span className="mx-3 text-white/20">·</span>
          <Link
            href={`/clients/${clientSlug}/${projectSlug}`}
            className="transition-colors hover:text-white"
          >
            {projectName}
          </Link>
          <span className="mx-3 text-white/20">·</span>
          <span className="text-white/55">{pageName}</span>
        </p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
          className="mt-6 font-sans font-extralight leading-[0.86] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.75rem, 9vw, 7rem)" }}
        >
          {pageName}
        </motion.h1>

        {intro && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.15, ease: EASE_OUT_EXPO }}
            className="mt-8 max-w-2xl font-serif text-lg italic leading-relaxed text-white/65 md:text-xl"
          >
            {intro}
          </motion.p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-white/10 pt-6">
          <span className="text-[11px] uppercase tracking-[0.32em] text-white/45">
            {ordered.length} mockup{ordered.length > 1 ? "s" : ""}
          </span>
          {counts.facebook > 0 && (
            <PlatformBadge platform="facebook" count={counts.facebook} />
          )}
          {counts.instagram > 0 && (
            <PlatformBadge platform="instagram" count={counts.instagram} />
          )}
        </div>
      </section>

      <section className="px-6 pb-32 pt-12 md:px-12">
        {ordered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center font-serif italic text-white/45">
            Aucun mockup publié pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-16">
            {ordered.map((mockup) => (
              <li key={mockup.id}>
                <MockupBlock mockup={mockup} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MockupBlock({ mockup }: { mockup: MetaAdMockup }) {
  const spec = getMetaAdFormatSpec(mockup.format);
  const platform: MetaAdPlatform = spec?.platform ?? "facebook";
  return (
    <article className="flex flex-col items-center gap-6">
      <header className="flex w-full max-w-[480px] items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          {mockup.label && (
            <p className="font-sans text-base font-light tracking-[-0.01em] text-[#F5F5F7]">
              {mockup.label}
            </p>
          )}
          <p
            className={cn(
              "text-[11px] uppercase tracking-[0.32em]",
              platform === "facebook"
                ? "text-sky-300/70"
                : "text-pink-300/70",
            )}
          >
            {spec?.label ?? mockup.format}
          </p>
        </div>
      </header>
      <div className="w-full">
        <MockupRenderer mockup={mockup} />
      </div>
    </article>
  );
}

function PlatformBadge({
  platform,
  count,
}: {
  platform: MetaAdPlatform;
  count: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em]",
        platform === "facebook"
          ? "border-sky-300/40 text-sky-200/85"
          : "border-pink-300/40 text-pink-200/85",
      )}
    >
      {getMetaPlatformLabel(platform)} · {count}
    </span>
  );
}

// Référence exportée pour debug — permet de logger tous les formats supportés
// au cas où. Pas utilisé en runtime.
export const SUPPORTED_FORMATS = META_AD_FORMATS.map((f) => f.value);
