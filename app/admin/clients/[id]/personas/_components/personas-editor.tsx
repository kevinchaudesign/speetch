"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog } from "@/lib/ds";
import {
  createPersona,
  deletePersona,
  reorderPersonas,
  updatePersona,
} from "../actions";
import type { ClientPersonaRow } from "../_lib/persona-types";

export type PersonaMedia = {
  id: string;
  filename: string;
  mime_type: string;
  public_url: string;
};

export type PersonaItem = Pick<
  ClientPersonaRow,
  | "id"
  | "name"
  | "role"
  | "age"
  | "location"
  | "quote"
  | "bio"
  | "goals"
  | "frustrations"
  | "motivations"
  | "behaviors"
  | "tech_comfort"
  | "notes"
> & {
  /** Médias de la médiathèque taggés sur ce persona — lecture seule ici,
   *  l'assignment se fait depuis /admin/clients/:id/media. */
  media: PersonaMedia[];
};

type PatchableField = Exclude<keyof PersonaItem, "id" | "media">;

// ─── Styles input/textarea — alignés sur le reste de l'admin ────────────────
const INPUT_CLASS =
  "w-full border-0 border-b border-white/15 bg-transparent py-2 text-sm text-[#F5F5F7] outline-none transition-colors placeholder:text-white/25 focus:border-white/45";
const TEXTAREA_CLASS =
  "w-full resize-y border border-white/15 bg-white/[0.02] px-3 py-2 text-sm text-[#F5F5F7] outline-none transition-colors placeholder:text-white/25 focus:border-white/35";
const NAME_INPUT_CLASS =
  "w-full border-0 border-b border-white/20 bg-transparent py-2 font-sans text-2xl font-extralight tracking-[-0.02em] text-[#F5F5F7] outline-none transition-colors placeholder:text-white/25 focus:border-white/55";

const FIELD_LABEL_CLASS =
  "text-[10px] uppercase tracking-[0.32em] text-white/45";

const ERROR_CLASS =
  "text-[10px] uppercase tracking-[0.32em] text-red-300/80";

export function PersonasEditor({
  profileId,
  initialPersonas,
}: {
  profileId: string;
  initialPersonas: PersonaItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [topError, setTopError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleAdd() {
    setTopError(null);
    startTransition(async () => {
      const res = await createPersona({ profileId });
      if (!res.ok) {
        setTopError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(personaId: string) {
    setTopError(null);
    setConfirmDeleteId(null);
    startTransition(async () => {
      const res = await deletePersona({ profileId, personaId });
      if (!res.ok) {
        setTopError(res.error);
        return;
      }
      router.refresh();
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

  const confirmTarget =
    confirmDeleteId != null
      ? initialPersonas.find((p) => p.id === confirmDeleteId) ?? null
      : null;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/45">
          {initialPersonas.length} persona
          {initialPersonas.length > 1 ? "s" : ""}
        </span>
        <Button
          variant="primary"
          onClick={handleAdd}
          pending={pending}
          pendingLabel="Ajout…"
        >
          + Persona
        </Button>
      </div>

      {topError && (
        <p className="border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
          {topError}
        </p>
      )}

      {initialPersonas.length === 0 ? (
        <p className="border-t border-white/10 pt-8 font-serif text-base italic text-white/40">
          Aucun persona pour ce client. Clique sur « + Persona » pour en
          créer un.
        </p>
      ) : (
        <ul className="flex flex-col gap-8">
          {initialPersonas.map((persona, index) => (
            <li
              key={persona.id}
              className="flex flex-col gap-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-10"
            >
              <PersonaCard
                profileId={profileId}
                persona={persona}
                index={index}
                total={initialPersonas.length}
                pending={pending}
                onMove={(dir) => handleMove(persona.id, dir)}
                onRequestDelete={() => setConfirmDeleteId(persona.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Supprimer ce persona ?"
        description={
          confirmTarget ? (
            <span>
              <span className="font-serif italic">{confirmTarget.name}</span>{" "}
              sera définitivement supprimé. Cette action est irréversible.
            </span>
          ) : null
        }
        confirmLabel="Supprimer"
        tone="danger"
        pending={pending}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

// ─── Carte persona ──────────────────────────────────────────────────────────

function PersonaCard({
  profileId,
  persona,
  index,
  total,
  pending,
  onMove,
  onRequestDelete,
}: {
  profileId: string;
  persona: PersonaItem;
  index: number;
  total: number;
  pending: boolean;
  onMove: (direction: "up" | "down") => void;
  onRequestDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-white/30">
            Persona {String(index + 1).padStart(2, "0")}
          </p>
          <AutosaveTextInput
            profileId={profileId}
            personaId={persona.id}
            field="name"
            initialValue={persona.name}
            placeholder="Nom du persona"
            className={NAME_INPUT_CLASS}
            ariaLabel="Nom du persona"
          />
        </div>

        <div className="flex shrink-0 items-center gap-5 pt-7">
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={pending || index === 0}
            aria-label="Monter ce persona"
            className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-white/40"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={pending || index === total - 1}
            aria-label="Descendre ce persona"
            className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-white/40"
          >
            ↓
          </button>
          <Button variant="danger" onClick={onRequestDelete} pending={pending}>
            Supprimer
          </Button>
        </div>
      </div>

      <PersonaMediaStrip media={persona.media} />

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
          placeholder="« Ce que ce persona pourrait dire… »"
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
    </div>
  );
}

function PersonaMediaStrip({ media }: { media: PersonaMedia[] }) {
  if (media.length === 0) {
    return (
      <p className="text-[11px] uppercase tracking-[0.32em] text-white/30">
        Aucun visuel taggé
        <span className="mx-2 text-white/15">·</span>
        <span className="font-serif italic normal-case tracking-normal text-white/40">
          assigne des images depuis la médiathèque, dossier « Personas »
        </span>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className={FIELD_LABEL_CLASS}>
        Visuels ({media.length})
      </span>
      <ul className="flex flex-wrap gap-3">
        {media.map((m) => (
          <li key={m.id}>
            <a
              href={m.public_url}
              target="_blank"
              rel="noopener noreferrer"
              title={m.filename}
              className="group relative block h-28 w-28 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all hover:border-white/35"
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
          </li>
        ))}
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
  const [saving, setSaving] = useState(false);
  const lastSavedRef = useRef(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resync si le serveur change la valeur (revalidatePath, etc.).
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
      setSaving(true);
      const res = await updatePersona({
        profileId,
        personaId,
        patch: { [field]: next },
      });
      setSaving(false);
      if (res.ok) {
        lastSavedRef.current = next;
      } else {
        setError(res.error);
      }
    }, DEBOUNCE_MS);
  }

  return { value, onChange, error, saving };
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
