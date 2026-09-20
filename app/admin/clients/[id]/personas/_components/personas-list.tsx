"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/lib/ds";
import { createPersona, reorderPersonas } from "../actions";
import type { PersonaItem } from "../_lib/persona-types";
import { useClientSegment } from "@/lib/admin/use-client-segment";

export function PersonasList({
  profileId,
  initialPersonas,
}: {
  profileId: string;
  initialPersonas: PersonaItem[];
}) {
  const router = useRouter();
  const clientSlug = useClientSegment();
  const [pending, startTransition] = useTransition();
  const [topError, setTopError] = useState<string | null>(null);

  function handleAdd() {
    setTopError(null);
    startTransition(async () => {
      const res = await createPersona({ profileId });
      if (!res.ok) {
        setTopError(res.error);
        return;
      }
      router.push(`/admin/clients/${clientSlug}/personas/${res.personaId}`);
    });
  }

  function handleMove(personaId: string, direction: "up" | "down") {
    setTopError(null);
    const ids = initialPersonas.map((p) => p.id);
    const idx = ids.indexOf(personaId);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[idx], next[target]] = [next[target], next[idx]];

    startTransition(async () => {
      const res = await reorderPersonas({ profileId, personaIds: next });
      if (!res.ok) {
        setTopError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55">
          {initialPersonas.length} audience
          {initialPersonas.length > 1 ? "s" : ""}
        </span>
        <Button
          variant="primary"
          onClick={handleAdd}
          pending={pending}
          pendingLabel="Forge…"
        >
          + Audience
        </Button>
      </div>

      {topError && (
        <p
          className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
          style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
        >
          {topError}
        </p>
      )}

      {initialPersonas.length === 0 ? (
        <div className="relative pt-8">
          <div
            aria-hidden
            className="sw-hologram-line absolute inset-x-0 top-0"
          />
          <p className="font-serif text-base italic text-white/55">
            Aucune audience pour cet holocron. Clique sur «&nbsp;+
            Audience&nbsp;» pour en forger une.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {initialPersonas.map((persona, index) => (
            <PersonaPreviewCard
              key={persona.id}
              persona={persona}
              index={index}
              total={initialPersonas.length}
              pending={pending}
              onMove={(dir) => handleMove(persona.id, dir)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Card d'aperçu ──────────────────────────────────────────────────────────

function PersonaPreviewCard({
  persona,
  index,
  total,
  pending,
  onMove,
}: {
  persona: PersonaItem;
  index: number;
  total: number;
  pending: boolean;
  onMove: (direction: "up" | "down") => void;
}) {
  // Priorité au cover choisi explicitement par l'utilisateur. On vérifie
  // qu'il est toujours dans la liste des médias taggés (sinon orphelin →
  // fallback heuristique).
  const explicitCover = persona.cover_media_id
    ? (persona.media.find((m) => m.id === persona.cover_media_id) ?? null)
    : null;
  const hero =
    explicitCover ??
    persona.media.find((m) => m.mime_type.startsWith("image/")) ??
    persona.media[0] ??
    null;
  const initials = computeInitials(persona.name);
  const clientSlug = useClientSegment();

  return (
    <li className="group relative">
      <Link
        href={`/admin/clients/${clientSlug}/personas/${persona.id}`}
        className="flex flex-col overflow-hidden rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.015] transition-all hover:border-cyan-200/40 hover:bg-cyan-200/[0.04]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-cyan-200/[0.02]">
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
                className="font-sans font-extralight tracking-[-0.04em] text-cyan-200/20"
                style={{ fontSize: "clamp(3rem, 8vw, 5rem)" }}
              >
                {initials}
              </span>
            </div>
          )}
          {persona.media.length > 0 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-cyan-200/80 backdrop-blur-sm">
              {persona.media.length} visuel{persona.media.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 p-5">
          <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
            Audience {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="font-sans text-2xl font-extralight tracking-[-0.02em] text-[#F5F5F7] transition-colors group-hover:text-cyan-100">
            {persona.name || (
              <span className="font-serif italic text-white/45">Sans nom</span>
            )}
          </h3>
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55">
            {persona.role || <span className="text-cyan-200/30">Rôle —</span>}
            {persona.age != null && (
              <>
                <span className="mx-2 text-cyan-200/25">·</span>
                {persona.age} ans
              </>
            )}
          </p>
          {persona.location && (
            <p className="font-serif text-sm italic text-white/55">
              {persona.location}
            </p>
          )}
        </div>
      </Link>

      {/* Boutons réordonner, en absolute pour ne pas être dans le <Link> */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 opacity-0 backdrop-blur-sm transition-opacity duration-200 ease-out focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMove("up");
          }}
          disabled={pending || index === 0}
          aria-label="Monter cette audience"
          className="px-2 text-[12px] text-cyan-200/75 transition-colors hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-cyan-200/75"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMove("down");
          }}
          disabled={pending || index === total - 1}
          aria-label="Descendre cette audience"
          className="px-2 text-[12px] text-cyan-200/75 transition-colors hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-cyan-200/75"
        >
          ↓
        </button>
      </div>
    </li>
  );
}

function computeInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "·";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}
