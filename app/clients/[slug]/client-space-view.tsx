"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { ProjectInSpace } from "@/types/database";
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
  personasProjectIds,
}: {
  profileId: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  createdAt: string;
  projects: ProjectInSpace[];
  personasCount: number;
  /**
   * Liste des project_ids où ranger le lien personas.
   * Vide = section top-level. Sinon : le lien apparaît dans la page dédiée de
   * chaque projet pinné, pas sur la home.
   */
  personasProjectIds: string[];
}) {
  const personasPinnedSet = new Set(personasProjectIds);

  // Section top-level « Utilisateurs cibles » : rendue uniquement si
  // publication active ET aucun projet pinné. Sinon le lien apparaît
  // exclusivement dans la page projet correspondante.
  const showPersonasTopLevel =
    personasCount > 0 && personasPinnedSet.size === 0;
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

      {/* Personas — section top-level, uniquement si pas pinnée à un projet */}
      {showPersonasTopLevel && (
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

      {/* Projets — uniquement les cartes d'entrée, pas les pages */}
      {projects.length === 0 ? (
        <section className="mt-20 border-t border-white/10 px-6 py-20 md:mt-28 md:px-12">
          <p className="max-w-md text-balance font-serif text-base italic text-white/40 md:text-lg">
            Les projets seront ajoutés ici prochainement.
          </p>
        </section>
      ) : (
        <div className="mt-20 flex flex-col gap-16 md:mt-28 md:gap-20">
          {projects.map((project, idx) => (
            <ProjectBlock
              key={project.id}
              project={project}
              index={idx}
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
  clientSlug,
}: {
  project: ProjectInSpace;
  index: number;
  clientSlug: string;
}) {
  const projectTypeLabel = getProjectTypeLabel(project.project_type);
  const pages = project.pages ?? [];
  const lots = project.lots ?? [];

  // Le compteur de pages tient compte des notes publiées (snapshot dans
  // `pages`). Lots compté à partir de la liste exposée par la vue (peut
  // contenir des lots vides — c'est volontaire côté admin, on affiche
  // l'info brute).
  const pageCount = pages.length;
  const lotCount = lots.length;

  const href = `/clients/${clientSlug}/${project.slug}`;

  return (
    <article className="px-6 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
        className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6 border-t border-white/10 pt-10 md:pt-14"
      >
        <div className="flex max-w-2xl flex-col gap-5">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            Projet {String(index + 1).padStart(2, "0")}
            {projectTypeLabel && (
              <>
                <span className="mx-3 text-white/20">·</span>
                <span className="text-white/55">{projectTypeLabel}</span>
              </>
            )}
          </p>

          <Link href={href} className="group inline-block">
            <h2
              className="font-sans font-extralight leading-[0.9] tracking-[-0.04em] text-[#F5F5F7] transition-colors group-hover:text-white"
              style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
            >
              {project.name}
            </h2>
          </Link>

          {project.subtitle && (
            <p className="text-balance font-serif text-base italic text-white/55 md:text-lg">
              {project.subtitle}
            </p>
          )}

          <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">
            {pageCount === 0
              ? "Aucune page publiée"
              : `${pageCount} page${pageCount > 1 ? "s" : ""}`}
            {lotCount > 0 && (
              <>
                <span className="mx-3 text-white/20">·</span>
                {lotCount} lot{lotCount > 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>

        <Link
          href={href}
          className="group inline-flex items-center gap-4 text-2xl font-light text-[#F5F5F7] transition-colors md:text-3xl"
        >
          <span>Consulter</span>
          <span className="inline-block h-px w-12 bg-white/55 transition-all duration-500 ease-out group-hover:w-24 group-hover:bg-white" />
        </Link>
      </motion.div>
    </article>
  );
}
