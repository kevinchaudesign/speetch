"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog } from "@/lib/ds";
import { cn } from "@/lib/utils";
import { deletePersona, setPersonaCover, updatePersona } from "../actions";
import type { PersonaItem, PersonaMedia } from "../_lib/persona-types";
import { useClientSegment } from "@/lib/admin/use-route-segment";

type PatchableField = Exclude<keyof PersonaItem, "id" | "media">;

// ─── Styles input/textarea — palette cyan thème Conseil Jedi ──────────────
const INPUT_CLASS =
  "w-full border-0 border-b border-cyan-200/20 bg-transparent py-2 text-sm text-[#F5F5F7] caret-cyan-200 outline-none transition-colors placeholder:text-white/25 focus:border-cyan-200/55";
const TEXTAREA_CLASS =
  "w-full resize-y border border-cyan-200/15 bg-cyan-200/[0.02] px-3 py-2 text-sm text-[#F5F5F7] caret-cyan-200 outline-none transition-colors placeholder:text-white/25 focus:border-cyan-200/45";
const NAME_INPUT_CLASS =
  "w-full border-0 border-b border-cyan-200/25 bg-transparent py-2 font-sans text-3xl font-extralight tracking-[-0.02em] text-[#F5F5F7] caret-cyan-200 outline-none transition-colors placeholder:text-white/25 focus:border-cyan-200/65 md:text-4xl";

const FIELD_LABEL_CLASS =
  "text-[10px] uppercase tracking-[0.32em] text-cyan-200/55";

const ERROR_CLASS = "text-[10px] uppercase tracking-[0.32em] text-red-300/85";

export function PersonaDetailEditor({
  profileId,
  persona,
}: {
  profileId: string;
  persona: PersonaItem;
}) {
  const router = useRouter();
  const clientSlug = useClientSegment();
  const [pending, startTransition] = useTransition();
  const [topError, setTopError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    setConfirmDelete(false);
    setTopError(null);
    startTransition(async () => {
      const res = await deletePersona({ profileId, personaId: persona.id });
      if (!res.ok) {
        setTopError(res.error);
        return;
      }
      // Retour à la liste après suppression.
      router.push(`/admin/clients/${clientSlug}/personas`);
      router.refresh();
    });
  }

  // Cover : toggle. Si on clique sur la card actuelle → on retire (null).
  function handleToggleCover(mediaId: string) {
    setTopError(null);
    const nextMediaId = persona.cover_media_id === mediaId ? null : mediaId;
    startTransition(async () => {
      const res = await setPersonaCover({
        profileId,
        personaId: persona.id,
        mediaId: nextMediaId,
      });
      if (!res.ok) {
        setTopError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-10">
      {topError && (
        <p
          className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
          style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
        >
          {topError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
          Nom de l&apos;audience
        </span>
        <AutosaveTextInput
          profileId={profileId}
          personaId={persona.id}
          field="name"
          initialValue={persona.name}
          placeholder="Nom de l'audience"
          className={NAME_INPUT_CLASS}
          ariaLabel="Nom de l'audience"
        />
      </div>

      <PersonaMediaStrip
        media={persona.media}
        coverMediaId={persona.cover_media_id}
        onToggleCover={handleToggleCover}
        pending={pending}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FieldBlock label="Rôle">
          <AutosaveTextInput
            profileId={profileId}
            personaId={persona.id}
            field="role"
            initialValue={persona.role ?? ""}
            placeholder="ex: Directrice marketing"
            className={INPUT_CLASS}
            ariaLabel="Rôle"
          />
        </FieldBlock>
        <FieldBlock label="Âge">
          <AutosaveTextInput
            profileId={profileId}
            personaId={persona.id}
            field="age"
            initialValue={persona.age == null ? "" : String(persona.age)}
            placeholder="ex: 34"
            className={INPUT_CLASS}
            ariaLabel="Âge"
            inputMode="numeric"
          />
        </FieldBlock>
        <FieldBlock label="Localisation">
          <AutosaveTextInput
            profileId={profileId}
            personaId={persona.id}
            field="location"
            initialValue={persona.location ?? ""}
            placeholder="ex: Paris"
            className={INPUT_CLASS}
            ariaLabel="Localisation"
          />
        </FieldBlock>
      </div>

      <FieldBlock label="Citation">
        <AutosaveTextArea
          profileId={profileId}
          personaId={persona.id}
          field="quote"
          initialValue={persona.quote ?? ""}
          placeholder="« Ce que cette audience pourrait dire… »"
          className={TEXTAREA_CLASS}
          ariaLabel="Citation"
          rows={2}
        />
      </FieldBlock>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FieldBlock label="Bio">
          <AutosaveTextArea
            profileId={profileId}
            personaId={persona.id}
            field="bio"
            initialValue={persona.bio ?? ""}
            placeholder="Contexte de vie, parcours…"
            className={TEXTAREA_CLASS}
            ariaLabel="Bio"
            rows={4}
          />
        </FieldBlock>
        <FieldBlock label="Niveau tech">
          <AutosaveTextArea
            profileId={profileId}
            personaId={persona.id}
            field="tech_comfort"
            initialValue={persona.tech_comfort ?? ""}
            placeholder="ex: à l'aise smartphone, peu PC, jamais d'outil pro"
            className={TEXTAREA_CLASS}
            ariaLabel="Niveau tech"
            rows={4}
          />
        </FieldBlock>
        <FieldBlock label="Objectifs">
          <AutosaveTextArea
            profileId={profileId}
            personaId={persona.id}
            field="goals"
            initialValue={persona.goals ?? ""}
            placeholder="Ce qu'il/elle cherche à accomplir"
            className={TEXTAREA_CLASS}
            ariaLabel="Objectifs"
            rows={4}
          />
        </FieldBlock>
        <FieldBlock label="Frustrations">
          <AutosaveTextArea
            profileId={profileId}
            personaId={persona.id}
            field="frustrations"
            initialValue={persona.frustrations ?? ""}
            placeholder="Ce qui bloque, agace, fait perdre du temps"
            className={TEXTAREA_CLASS}
            ariaLabel="Frustrations"
            rows={4}
          />
        </FieldBlock>
        <FieldBlock label="Motivations">
          <AutosaveTextArea
            profileId={profileId}
            personaId={persona.id}
            field="motivations"
            initialValue={persona.motivations ?? ""}
            placeholder="Pourquoi il/elle agit"
            className={TEXTAREA_CLASS}
            ariaLabel="Motivations"
            rows={4}
          />
        </FieldBlock>
        <FieldBlock label="Comportements">
          <AutosaveTextArea
            profileId={profileId}
            personaId={persona.id}
            field="behaviors"
            initialValue={persona.behaviors ?? ""}
            placeholder="Habitudes, routines, manière d'utiliser le produit"
            className={TEXTAREA_CLASS}
            ariaLabel="Comportements"
            rows={4}
          />
        </FieldBlock>
      </div>

      <FieldBlock label="Notes">
        <AutosaveTextArea
          profileId={profileId}
          personaId={persona.id}
          field="notes"
          initialValue={persona.notes ?? ""}
          placeholder="Tout le reste : citations brutes d'interview, insights, etc."
          className={TEXTAREA_CLASS}
          ariaLabel="Notes"
          rows={4}
        />
      </FieldBlock>

      <div className="flex items-center justify-end border-t border-cyan-200/15 pt-8">
        <Button
          variant="danger"
          onClick={() => setConfirmDelete(true)}
          pending={pending}
        >
          Effacer cette audience
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Effacer cette audience ?"
        description={
          <span>
            <span className="font-serif italic">{persona.name}</span> sera
            définitivement effacée. Cette action est irréversible.
          </span>
        }
        confirmLabel="Effacer"
        tone="danger"
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function PersonaMediaStrip({
  media,
  coverMediaId,
  onToggleCover,
  pending,
}: {
  media: PersonaMedia[];
  coverMediaId: string | null;
  onToggleCover: (mediaId: string) => void;
  pending: boolean;
}) {
  if (media.length === 0) {
    return (
      <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/45">
        Aucun visuel taggé
        <span className="mx-2 text-cyan-200/20">·</span>
        <span className="font-serif normal-case italic tracking-normal text-white/55">
          assigne des images depuis la médiathèque, dossier
          «&nbsp;Audiences&nbsp;»
        </span>
      </p>
    );
  }

  // Cover orphelin = cover_media_id pointe vers un média plus taggé sur ce
  // persona (peut arriver si on a re-tagué le média ailleurs). On l'ignore
  // côté affichage pour rester cohérent avec la liste.
  const activeCoverId =
    coverMediaId && media.some((m) => m.id === coverMediaId)
      ? coverMediaId
      : null;

  return (
    <div className="flex flex-col gap-3">
      <span className={FIELD_LABEL_CLASS}>
        Visuels ({media.length})<span className="mx-2 text-cyan-200/20">·</span>
        <span className="normal-case tracking-normal text-cyan-200/45">
          {activeCoverId
            ? "click ★ pour retirer la vignette"
            : "click ☆ pour définir la vignette"}
        </span>
      </span>
      <ul className="flex flex-wrap gap-3">
        {media.map((m) => {
          const isCover = m.id === activeCoverId;
          return (
            <li key={m.id} className="group relative h-28 w-28">
              <a
                href={m.public_url}
                target="_blank"
                rel="noopener noreferrer"
                title={m.filename}
                className={cn(
                  "relative block h-full w-full overflow-hidden rounded-xl border bg-cyan-200/[0.02] transition-all",
                  isCover
                    ? "border-cyan-200/60 ring-2 ring-cyan-200/35"
                    : "border-cyan-200/15 hover:border-cyan-200/40",
                )}
              >
                {m.mime_type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.public_url}
                    alt={m.filename}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
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
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-white/80 backdrop-blur-sm">
                      Vidéo
                    </span>
                  </>
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-white/40">
                    {m.mime_type}
                  </span>
                )}
              </a>

              <button
                type="button"
                onClick={() => onToggleCover(m.id)}
                disabled={pending}
                aria-label={
                  isCover ? "Retirer comme vignette" : "Définir comme vignette"
                }
                aria-pressed={isCover}
                title={
                  isCover
                    ? "Vignette actuelle — click pour retirer"
                    : "Définir comme vignette"
                }
                className={cn(
                  "absolute right-1.5 top-1.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-black/60 text-[14px] backdrop-blur-sm transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50",
                  isCover
                    ? "border-cyan-200/75 text-amber-200 opacity-100 hover:border-cyan-200"
                    : "border-cyan-200/40 text-cyan-200/65 opacity-0 hover:border-cyan-200/80 hover:text-cyan-100 focus-visible:opacity-100 group-hover:opacity-100",
                )}
              >
                {isCover ? "★" : "☆"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className={FIELD_LABEL_CLASS}>{label}</span>
      {children}
    </div>
  );
}

// ─── Autosave debouncé ──────────────────────────────────────────────────────

const DEBOUNCE_MS = 600;

function useAutosave(
  profileId: string,
  personaId: string,
  field: PatchableField,
  initialValue: string,
) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const lastSavedRef = useRef(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialValue !== lastSavedRef.current) {
      lastSavedRef.current = initialValue;
      setValue(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function onChange(next: string) {
    setValue(next);
    setError(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (next === lastSavedRef.current) return;

    timeoutRef.current = setTimeout(async () => {
      const res = await updatePersona({
        profileId,
        personaId,
        patch: { [field]: next },
      });
      if (res.ok) {
        lastSavedRef.current = next;
      } else {
        setError(res.error);
      }
    }, DEBOUNCE_MS);
  }

  return { value, onChange, error };
}

function AutosaveTextInput({
  profileId,
  personaId,
  field,
  initialValue,
  placeholder,
  className,
  ariaLabel,
  inputMode,
}: {
  profileId: string;
  personaId: string;
  field: PatchableField;
  initialValue: string;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  inputMode?: "text" | "numeric";
}) {
  const { value, onChange, error } = useAutosave(
    profileId,
    personaId,
    field,
    initialValue,
  );
  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={className}
        autoComplete="off"
      />
      {error && <p className={ERROR_CLASS}>{error}</p>}
    </div>
  );
}

function AutosaveTextArea({
  profileId,
  personaId,
  field,
  initialValue,
  placeholder,
  className,
  ariaLabel,
  rows = 4,
}: {
  profileId: string;
  personaId: string;
  field: PatchableField;
  initialValue: string;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  rows?: number;
}) {
  const { value, onChange, error } = useAutosave(
    profileId,
    personaId,
    field,
    initialValue,
  );
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={className}
        rows={rows}
      />
      {error && <p className={ERROR_CLASS}>{error}</p>}
    </div>
  );
}
