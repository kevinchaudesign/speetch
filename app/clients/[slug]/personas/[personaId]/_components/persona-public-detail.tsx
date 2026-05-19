"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { PublicPersonaItem } from "../../_components/personas-public-list";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function PersonaPublicDetail({
  slug,
  fullName,
  persona,
}: {
  slug: string;
  fullName: string;
  persona: PublicPersonaItem;
}) {
  return (
    <article className="px-6 pb-24 pt-20 md:px-12 md:pt-32">
      {/* Breadcrumb */}
      <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
        <Link
          href={`/clients/${slug}`}
          className="transition-colors hover:text-white"
        >
          {fullName}
        </Link>
        <span className="mx-3 text-white/20">·</span>
        <Link
          href={`/clients/${slug}/personas`}
          className="transition-colors hover:text-white"
        >
          Personas
        </Link>
        <span className="mx-3 text-white/20">·</span>
        <span className="text-white/55">
          {persona.name || "Sans nom"}
        </span>
      </p>

      {/* Nom monumental */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
        className="mt-6 font-sans font-extralight leading-[0.86] tracking-[-0.05em] text-[#F5F5F7]"
        style={{ fontSize: "clamp(2.75rem, 9vw, 7rem)" }}
      >
        {persona.name || (
          <span className="font-serif italic text-white/40">Sans nom</span>
        )}
      </motion.h1>

      {/* Sous-titre rôle / âge / location */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.32em] text-white/55"
      >
        {persona.role && <span>{persona.role}</span>}
        {persona.age != null && <span>{persona.age} ans</span>}
        {persona.location && <span>{persona.location}</span>}
        {!persona.role && persona.age == null && !persona.location && (
          <span className="text-white/30">—</span>
        )}
      </motion.p>

      {/* Cover hero — si visuels */}
      {persona.media.length > 0 && (
        <PersonaHero media={persona.media} cover={persona.cover_media_id} />
      )}

      {/* Citation */}
      {persona.quote && (
        <motion.blockquote
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          className="mx-auto mt-24 max-w-3xl border-l-2 border-white/30 pl-6 font-serif text-2xl italic leading-snug text-white/80 md:mt-32 md:text-3xl"
        >
          « {persona.quote} »
        </motion.blockquote>
      )}

      {/* Bio */}
      {persona.bio && (
        <Section title="Bio" body={persona.bio} delayBase={0.05} />
      )}

      {/* Grille goals / frustrations / motivations / behaviors / tech */}
      {(persona.goals ||
        persona.frustrations ||
        persona.motivations ||
        persona.behaviors ||
        persona.tech_comfort) && (
        <div className="mt-20 grid grid-cols-1 gap-x-12 gap-y-16 border-t border-white/10 pt-16 md:mt-28 md:grid-cols-2">
          {persona.goals && (
            <Section title="Objectifs" body={persona.goals} delayBase={0} />
          )}
          {persona.frustrations && (
            <Section
              title="Frustrations"
              body={persona.frustrations}
              delayBase={0.05}
            />
          )}
          {persona.motivations && (
            <Section
              title="Motivations"
              body={persona.motivations}
              delayBase={0.1}
            />
          )}
          {persona.behaviors && (
            <Section
              title="Comportements"
              body={persona.behaviors}
              delayBase={0.15}
            />
          )}
          {persona.tech_comfort && (
            <Section
              title="Niveau tech"
              body={persona.tech_comfort}
              delayBase={0.2}
            />
          )}
        </div>
      )}

      {/* Notes */}
      {persona.notes && (
        <div className="mt-20 border-t border-white/10 pt-16 md:mt-28">
          <Section title="Notes" body={persona.notes} delayBase={0} />
        </div>
      )}

      {/* Galerie complète des visuels (si > 1) */}
      {persona.media.length > 1 && (
        <div className="mt-20 border-t border-white/10 pt-16 md:mt-28">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            Visuels ({persona.media.length})
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {persona.media.map((m) => (
              <li key={m.id}>
                <a
                  href={m.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={m.filename}
                  className="group relative block aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/35"
                >
                  {m.mime_type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.public_url}
                      alt={m.filename}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  ) : m.mime_type.startsWith("video/") ? (
                    <>
                      <video
                        src={m.public_url}
                        preload="metadata"
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-white/80 backdrop-blur-sm">
                        Vidéo
                      </span>
                    </>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                      {m.mime_type}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA retour bas de page */}
      <div className="mt-24 flex items-center justify-between border-t border-white/10 pt-8 md:mt-32">
        <Link
          href={`/clients/${slug}/personas`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
          <span>Tous les personas</span>
        </Link>
        <Link
          href={`/clients/${slug}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
        >
          <span>Retour à l&apos;espace</span>
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
        </Link>
      </div>
    </article>
  );
}

function PersonaHero({
  media,
  cover,
}: {
  media: PublicPersonaItem["media"];
  cover: string | null;
}) {
  const explicit = cover ? media.find((m) => m.id === cover) ?? null : null;
  const hero =
    explicit ?? media.find((m) => m.mime_type.startsWith("image/")) ?? media[0];
  if (!hero) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1.4, ease: EASE_OUT_EXPO }}
      className="relative mt-16 aspect-[16/9] w-full overflow-hidden bg-white/[0.03] md:mt-20"
    >
      {hero.mime_type.startsWith("image/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hero.public_url}
          alt={hero.filename}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : hero.mime_type.startsWith("video/") ? (
        <video
          src={hero.public_url}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </motion.div>
  );
}

function Section({
  title,
  body,
  delayBase,
}: {
  title: string;
  body: string;
  delayBase: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: 0.9,
        delay: delayBase,
        ease: EASE_OUT_EXPO,
      }}
      className="flex flex-col gap-5"
    >
      <h2 className="text-[11px] uppercase tracking-[0.4em] text-white/45">
        {title}
      </h2>
      <p className="whitespace-pre-line text-balance font-serif text-base leading-relaxed text-white/75 md:text-lg">
        {body}
      </p>
    </motion.section>
  );
}
