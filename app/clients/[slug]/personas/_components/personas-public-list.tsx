"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type PublicPersonaMedia = {
  id: string;
  filename: string;
  mime_type: string;
  public_url: string;
};

export type PublicPersonaItem = {
  id: string;
  name: string;
  role: string | null;
  age: number | null;
  location: string | null;
  quote: string | null;
  bio: string | null;
  goals: string | null;
  frustrations: string | null;
  motivations: string | null;
  behaviors: string | null;
  tech_comfort: string | null;
  notes: string | null;
  cover_media_id: string | null;
  media: PublicPersonaMedia[];
};

export function PersonasPublicList({
  slug,
  personas,
}: {
  slug: string;
  personas: PublicPersonaItem[];
}) {
  if (personas.length === 0) {
    return (
      <p className="max-w-md border-t border-white/10 pt-10 font-serif text-base italic text-white/40 md:text-lg">
        Aucun persona à afficher pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {personas.map((persona, index) => (
        <PersonaPreviewCard
          key={persona.id}
          slug={slug}
          persona={persona}
          index={index}
        />
      ))}
    </ul>
  );
}

function PersonaPreviewCard({
  slug,
  persona,
  index,
}: {
  slug: string;
  persona: PublicPersonaItem;
  index: number;
}) {
  const explicitCover = persona.cover_media_id
    ? persona.media.find((m) => m.id === persona.cover_media_id) ?? null
    : null;
  const hero =
    explicitCover ??
    persona.media.find((m) => m.mime_type.startsWith("image/")) ??
    persona.media[0] ??
    null;
  const initials = computeInitials(persona.name);

  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{
        duration: 0.9,
        delay: Math.min(index * 0.05, 0.3),
        ease: EASE_OUT_EXPO,
      }}
    >
      <Link
        href={`/clients/${slug}/personas/${persona.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/30 hover:bg-white/[0.04]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.02]">
          {hero ? (
            hero.mime_type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={hero.public_url}
                alt={persona.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
            ) : (
              <video
                src={hero.public_url}
                preload="metadata"
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-sans font-extralight tracking-[-0.04em] text-white/20"
                style={{ fontSize: "clamp(3rem, 8vw, 5rem)" }}
              >
                {initials}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 p-6">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
            Persona {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="font-sans text-2xl font-extralight tracking-[-0.02em] text-[#F5F5F7]">
            {persona.name || (
              <span className="font-serif italic text-white/40">
                Sans nom
              </span>
            )}
          </h3>
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/45">
            {persona.role || (
              <span className="text-white/25">Rôle —</span>
            )}
            {persona.age != null && (
              <>
                <span className="mx-2 text-white/20">·</span>
                {persona.age} ans
              </>
            )}
          </p>
          {persona.location && (
            <p className="font-serif text-sm italic text-white/45">
              {persona.location}
            </p>
          )}
        </div>
      </Link>
    </motion.li>
  );
}

function computeInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "·";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}
