"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type {
  LotInSpace,
  PageInSpace,
  ProjectInSpace,
} from "@/types/database";
import { getProjectTypeLabel } from "@/lib/project-types";
import { lockClientSpace } from "./actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ClientSpaceView({
  profileId,
  slug,
  fullName,
  avatarUrl,
  createdAt,
  projects,
  personasCount,
}: {
  profileId: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  createdAt: string;
  projects: ProjectInSpace[];
  personasCount: number;
}) {
  const formattedDate = new Date(createdAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative min-h-svh w-full">
      {/* Header sticky */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/65 px-6 py-5 backdrop-blur-md md:px-12"
      >
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/55">
          Speetch · Espace privé
        </span>
        <form action={lockClientSpace}>
          <input type="hidden" name="slug" value={slug} />
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

      {/* Hero client */}
      <section className="px-6 pt-20 md:px-12 md:pt-32">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[11px] uppercase tracking-[0.4em] text-white/40"
        >
          Espace client
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="mt-6 font-sans font-extralight leading-[0.86] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.75rem, 9vw, 7rem)" }}
        >
          {fullName}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-12 flex flex-wrap items-center gap-x-12 gap-y-3 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.32em] text-white/45"
        >
          <span>Espace livré · {formattedDate}</span>
          <span>Paris</span>
          <span>Speetch</span>
          <span>
            {projects.length} projet{projects.length > 1 ? "s" : ""}
          </span>
        </motion.div>
      </section>

      {/* Cover (avatar) */}
      {avatarUrl && (
        <section className="mt-20 px-6 md:mt-28 md:px-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1.4, ease: EASE_OUT_EXPO }}
            className="relative aspect-[16/9] w-full overflow-hidden bg-white/[0.03]"
          >
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1280px) 1280px, 100vw"
            />
          </motion.div>
        </section>
      )}

      {/* Personas — section nav, n'apparaît que si au moins un persona est publié */}
      {personasCount > 0 && (
        <section className="mt-20 border-t border-white/10 px-6 pt-12 md:mt-28 md:px-12 md:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6"
          >
            <div className="flex max-w-2xl flex-col gap-4">
              <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
                Personas
                <span className="mx-3 text-white/20">·</span>
                <span className="text-white/55">
                  {personasCount} fiche{personasCount > 1 ? "s" : ""}
                </span>
              </p>
              <h2
                className="font-sans font-extralight leading-[0.9] tracking-[-0.04em] text-[#F5F5F7]"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                Utilisateurs cibles
              </h2>
              <p className="text-balance font-serif text-base italic text-white/45 md:text-lg">
                Fiches détaillées des personnes pour qui ce projet est pensé :
                contexte, objectifs, frustrations, citations.
              </p>
            </div>

            <Link
              href={`/clients/${slug}/personas`}
              className="group inline-flex items-center gap-4 text-2xl font-light text-[#F5F5F7] transition-colors md:text-3xl"
            >
              <span>Consulter</span>
              <span className="inline-block h-px w-12 bg-white/55 transition-all duration-500 ease-out group-hover:w-24 group-hover:bg-white" />
            </Link>
          </motion.div>
        </section>
      )}

      {/* Projets */}
      {projects.length === 0 ? (
        <section className="mt-20 border-t border-white/10 px-6 py-20 md:mt-28 md:px-12">
          <p className="max-w-md text-balance font-serif text-base italic text-white/40 md:text-lg">
            Les projets seront ajoutés ici prochainement.
          </p>
        </section>
      ) : (
        <div className="mt-20 flex flex-col gap-24 md:mt-28 md:gap-32">
          {projects.map((project, idx) => (
            <ProjectBlock
              key={project.id}
              project={project}
              index={idx}
              isLast={idx === projects.length - 1}
              clientSlug={slug}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 flex items-end justify-between border-t border-white/10 px-6 py-8 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Paris · 2026</span>
        <span>Speetch · Confidentiel</span>
      </footer>
    </div>
  );
}

function ProjectBlock({
  project,
  index,
  isLast,
  clientSlug,
}: {
  project: ProjectInSpace;
  index: number;
  isLast: boolean;
  clientSlug: string;
}) {
  const projectTypeLabel = getProjectTypeLabel(project.project_type);
  const pages = project.pages ?? [];
  const lots = project.lots ?? [];

  // Regroupe les pages par lot pour le rendu. Les lots sans page sont
  // masqués (pas de section vide côté public). L'ordre des lots est
  // l'ordre du tableau (déjà trié côté vue).
  const lotsWithPages: Array<{ lot: LotInSpace; pages: PageInSpace[] }> = lots
    .map((lot) => ({
      lot,
      pages: pages.filter((p) => p.lot_id === lot.id),
    }))
    .filter((entry) => entry.pages.length > 0);

  const orphanPages = pages.filter(
    (p) => !p.lot_id || !lots.some((l) => l.id === p.lot_id),
  );

  // Si aucun lot n'est défini (ou aucun lot n'a de page), on retombe sur la
  // mise en page historique : une liste plate sans entête de lot.
  const useLotLayout = lotsWithPages.length > 0;

  return (
    <article className={`px-6 md:px-12 ${isLast ? "" : ""}`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
        className="flex flex-col gap-5 border-t border-white/10 pt-10 md:pt-14"
      >
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
          Projet {String(index + 1).padStart(2, "0")}
          {projectTypeLabel && (
            <>
              <span className="mx-3 text-white/20">·</span>
              <span className="text-white/55">{projectTypeLabel}</span>
            </>
          )}
        </p>

        <h2
          className="font-sans font-extralight leading-[0.9] tracking-[-0.04em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
        >
          {project.name}
        </h2>

        <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">
          {pages.length === 0
            ? "Aucune page publiée"
            : `${pages.length} page${pages.length > 1 ? "s" : ""}${
                useLotLayout
                  ? ` · ${lotsWithPages.length} lot${lotsWithPages.length > 1 ? "s" : ""}`
                  : ""
              }`}
        </p>
      </motion.div>

      {pages.length > 0 && !useLotLayout && (
        <FlatPagesList
          pages={pages}
          projectSlug={project.slug}
          clientSlug={clientSlug}
        />
      )}

      {pages.length > 0 && useLotLayout && (
        <div className="mt-12 flex flex-col gap-16">
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
        </div>
      )}
    </article>
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
    ? `Lot ${String(index + 1).padStart(2, "0")}${
        lot.name ? ` · ${lot.name}` : ""
      }`
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

function FlatPagesList({
  pages,
  projectSlug,
  clientSlug,
}: {
  pages: PageInSpace[];
  projectSlug: string;
  clientSlug: string;
}) {
  return (
    <motion.ul
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.9, delay: 0.1, ease: EASE_OUT_EXPO }}
      className="mt-12 flex flex-col border-t border-white/10"
    >
      {pages.map((page, i) => (
        <PageRow
          key={page.id}
          page={page}
          index={i}
          projectSlug={projectSlug}
          clientSlug={clientSlug}
        />
      ))}
    </motion.ul>
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
