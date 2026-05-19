"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type {
  LotInSpace,
  PageInSpace,
  ProjectInSpace,
} from "@/types/database";
import { getProjectTypeLabel } from "@/lib/project-types";
import { lockClientSpace } from "../actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ProjectPageView({
  profileId,
  clientSlug,
  clientName,
  project,
  hasPersonas,
  personasCount,
}: {
  profileId: string;
  clientSlug: string;
  clientName: string;
  project: ProjectInSpace;
  hasPersonas: boolean;
  personasCount: number;
}) {
  const projectTypeLabel = getProjectTypeLabel(project.project_type);
  const pages = project.pages ?? [];
  const lots = project.lots ?? [];

  const lotsWithPages: Array<{ lot: LotInSpace; pages: PageInSpace[] }> = lots
    .map((lot) => ({
      lot,
      pages: pages.filter((p) => p.lot_id === lot.id),
    }))
    .filter((entry) => entry.pages.length > 0);

  const orphanPages = pages.filter(
    (p) => !p.lot_id || !lots.some((l) => l.id === p.lot_id),
  );

  const useLotLayout = lotsWithPages.length > 0;

  const deliveryFormatted = project.delivery_date
    ? new Date(project.delivery_date).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="relative min-h-svh w-full">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/65 px-6 py-5 backdrop-blur-md md:px-12"
      >
        <Link
          href={`/clients/${clientSlug}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
          <span>Retour {clientName}</span>
        </Link>
        <form action={lockClientSpace}>
          <input type="hidden" name="slug" value={clientSlug} />
          <input type="hidden" name="profile_id" value={profileId} />
          <button
            type="submit"
            className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
          >
            <span>Verrouiller</span>
            <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
          </button>
        </form>
      </motion.header>

      <section className="px-6 pt-20 md:px-12 md:pt-32">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
          <Link
            href={`/clients/${clientSlug}`}
            className="transition-colors hover:text-white"
          >
            {clientName}
          </Link>
          <span className="mx-3 text-white/20">·</span>
          <span className="text-white/55">Projet</span>
          {projectTypeLabel && (
            <>
              <span className="mx-3 text-white/20">·</span>
              <span className="text-white/55">{projectTypeLabel}</span>
            </>
          )}
        </p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
          className="mt-6 font-sans font-extralight leading-[0.86] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.75rem, 9vw, 7rem)" }}
        >
          {project.name}
        </motion.h1>

        {project.subtitle && (
          <p className="mt-10 max-w-2xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            {project.subtitle}
          </p>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-x-12 gap-y-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.32em] text-white/45">
          {deliveryFormatted && <span>Livraison · {deliveryFormatted}</span>}
          <span>
            {pages.length} page{pages.length > 1 ? "s" : ""}
          </span>
          {useLotLayout && (
            <span>
              {lotsWithPages.length} lot{lotsWithPages.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </section>

      <section className="px-6 pb-24 pt-20 md:px-12 md:pb-32 md:pt-24">
        {pages.length === 0 && !hasPersonas ? (
          <p className="border-t border-white/10 pt-10 font-serif text-base italic text-white/40">
            Aucune page publiée pour ce projet.
          </p>
        ) : useLotLayout ? (
          <div className="flex flex-col gap-16">
            {lotsWithPages.map((entry, lotIndex) => (
              <LotBlock
                key={entry.lot.id}
                lot={entry.lot}
                index={lotIndex}
                pages={entry.pages}
                projectSlug={project.slug}
                clientSlug={clientSlug}
              />
            ))}
            {orphanPages.length > 0 && (
              <LotBlock
                lot={null}
                index={lotsWithPages.length}
                pages={orphanPages}
                projectSlug={project.slug}
                clientSlug={clientSlug}
              />
            )}
            {hasPersonas && (
              <section className="flex flex-col">
                <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-white/10 pb-5 pt-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/55">
                    Insights
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-white/30">
                    1 page
                  </p>
                </header>
                <ul className="flex flex-col border-t border-white/10">
                  <PersonasPageRow
                    clientSlug={clientSlug}
                    index={0}
                    count={personasCount}
                  />
                </ul>
              </section>
            )}
          </div>
        ) : (
          <ul className="flex flex-col border-t border-white/10">
            {pages.map((page, i) => (
              <PageRow
                key={page.id}
                page={page}
                index={i}
                projectSlug={project.slug}
                clientSlug={clientSlug}
              />
            ))}
            {hasPersonas && (
              <PersonasPageRow
                clientSlug={clientSlug}
                index={pages.length}
                count={personasCount}
              />
            )}
          </ul>
        )}
      </section>

      <footer className="flex items-end justify-between border-t border-white/10 px-6 py-8 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Paris · 2026</span>
        <span>Speetch · Confidentiel</span>
      </footer>
    </div>
  );
}

function LotBlock({
  lot,
  index,
  pages,
  projectSlug,
  clientSlug,
}: {
  lot: LotInSpace | null;
  index: number;
  pages: PageInSpace[];
  projectSlug: string;
  clientSlug: string;
}) {
  const label = lot
    ? `Lot ${String(index + 1).padStart(2, "0")}${lot.name ? ` · ${lot.name}` : ""}`
    : "Hors lot";

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.9, delay: 0.05, ease: EASE_OUT_EXPO }}
      className="flex flex-col"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-white/10 pb-5 pt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/55">
          {label}
        </p>
        <p className="text-[11px] uppercase tracking-[0.32em] text-white/30">
          {pages.length} page{pages.length > 1 ? "s" : ""}
        </p>
      </header>
      <ul className="flex flex-col border-t border-white/10">
        {pages.map((page, i) => (
          <PageRow
            key={page.id}
            page={page}
            index={i}
            projectSlug={projectSlug}
            clientSlug={clientSlug}
          />
        ))}
      </ul>
    </motion.section>
  );
}

function PageRow({
  page,
  index,
  projectSlug,
  clientSlug,
}: {
  page: PageInSpace;
  index: number;
  projectSlug: string;
  clientSlug: string;
}) {
  return (
    <li className="border-b border-white/10">
      <Link
        href={`/clients/${clientSlug}/${projectSlug}/${page.slug}`}
        className="group flex flex-wrap items-baseline justify-between gap-x-10 gap-y-2 py-7 transition-colors md:py-9"
      >
        <div className="flex min-w-0 flex-1 items-baseline gap-x-6 gap-y-1">
          <span className="font-mono text-[11px] text-white/30 transition-colors group-hover:text-white/55">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3
            className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-white/80 transition-colors group-hover:text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            {page.name}
          </h3>
        </div>
        <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors group-hover:text-white">
          <span>Ouvrir</span>
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-16" />
        </span>
      </Link>
    </li>
  );
}

function PersonasPageRow({
  clientSlug,
  index,
  count,
}: {
  clientSlug: string;
  index: number;
  count: number;
}) {
  return (
    <li className="border-b border-white/10">
      <Link
        href={`/clients/${clientSlug}/personas`}
        className="group flex flex-wrap items-baseline justify-between gap-x-10 gap-y-2 py-7 transition-colors md:py-9"
      >
        <div className="flex min-w-0 flex-1 items-baseline gap-x-6 gap-y-1">
          <span className="font-mono text-[11px] text-white/30 transition-colors group-hover:text-white/55">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3
            className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-white/80 transition-colors group-hover:text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            Personas{" "}
            <span className="font-serif italic text-white/45">
              · {count} fiche{count > 1 ? "s" : ""}
            </span>
          </h3>
        </div>
        <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors group-hover:text-white">
          <span>Consulter</span>
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-16" />
        </span>
      </Link>
    </li>
  );
}
