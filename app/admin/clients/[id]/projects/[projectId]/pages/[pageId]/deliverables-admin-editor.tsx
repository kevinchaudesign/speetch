"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog } from "@/lib/ds";
import { cn } from "@/lib/utils";
import {
  createDeliverable,
  deleteDeliverable,
  postOwnerReply,
  reorderDeliverables,
  updateDeliverable,
  type DeliverableActionContext,
} from "./deliverables-actions";

// ─── Types portés depuis la page server ─────────────────────────────────────

export type AdminDeliverableFeedback = {
  id: string;
  author_kind: "owner" | "client";
  body: string;
  created_at: string;
};

export type AdminDeliverable = {
  id: string;
  media_id: string | null;
  format: string | null;
  title: string | null;
  description: string | null;
  status: "pending" | "approved" | "changes_requested";
  position: number;
  media: AdminMediaOption | null;
  feedbacks: AdminDeliverableFeedback[];
};

export type AdminMediaOption = {
  id: string;
  filename: string;
  mime_type: string;
  public_url: string;
  folder_name: string | null;
};

const FORMAT_SUGGESTIONS = [
  "Feed 1:1",
  "Feed 4:5",
  "Story 9:16",
  "Reel 9:16",
  "Paysage 16:9",
];

// ─── Composant racine ───────────────────────────────────────────────────────

export function DeliverablesAdminEditor({
  ctx,
  initialDeliverables,
  availableMedia,
}: {
  ctx: DeliverableActionContext;
  initialDeliverables: AdminDeliverable[];
  availableMedia: AdminMediaOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleAdd(mediaId: string) {
    setError(null);
    setPickerOpen(false);
    startTransition(async () => {
      const res = await createDeliverable({ ctx, mediaId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(deliverableId: string) {
    setError(null);
    setConfirmDeleteId(null);
    startTransition(async () => {
      const res = await deleteDeliverable({ ctx, deliverableId });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleMove(deliverableId: string, direction: "up" | "down") {
    setError(null);
    const ids = initialDeliverables.map((d) => d.id);
    const idx = ids.indexOf(deliverableId);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[idx], next[target]] = [next[target], next[idx]];
    startTransition(async () => {
      const res = await reorderDeliverables({ ctx, deliverableIds: next });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const confirmTarget =
    confirmDeleteId != null
      ? initialDeliverables.find((d) => d.id === confirmDeleteId) ?? null
      : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.32em] text-white/45">
          {initialDeliverables.length} livrable
          {initialDeliverables.length > 1 ? "s" : ""}
        </span>
        <Button
          variant="primary"
          onClick={() => setPickerOpen(true)}
          pending={pending}
          pendingLabel="Ajout…"
        >
          + Ajouter un livrable
        </Button>
      </div>

      {error && (
        <p className="border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
          {error}
        </p>
      )}

      {initialDeliverables.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center font-serif italic text-white/45">
          Aucun livrable. Choisis un média de la médiathèque pour démarrer.
        </p>
      ) : (
        <ul className="flex flex-col gap-8">
          {initialDeliverables.map((d, i) => (
            <li key={d.id}>
              <DeliverableCard
                ctx={ctx}
                deliverable={d}
                index={i}
                total={initialDeliverables.length}
                pending={pending}
                onMove={(dir) => handleMove(d.id, dir)}
                onRequestDelete={() => setConfirmDeleteId(d.id)}
                onLocalRefresh={() => router.refresh()}
              />
            </li>
          ))}
        </ul>
      )}

      <MediaPickerModal
        open={pickerOpen}
        media={availableMedia}
        onClose={() => setPickerOpen(false)}
        onPick={handleAdd}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Supprimer ce livrable ?"
        description={
          confirmTarget ? (
            <span>
              <span className="font-serif italic">
                {confirmTarget.title ||
                  confirmTarget.media?.filename ||
                  "Sans titre"}
              </span>{" "}
              ainsi que tous les retours associés seront supprimés. Le média
              source dans la médiathèque n&apos;est pas touché.
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

// ─── Carte d'un livrable ────────────────────────────────────────────────────

function DeliverableCard({
  ctx,
  deliverable,
  index,
  total,
  pending,
  onMove,
  onRequestDelete,
  onLocalRefresh,
}: {
  ctx: DeliverableActionContext;
  deliverable: AdminDeliverable;
  index: number;
  total: number;
  pending: boolean;
  onMove: (direction: "up" | "down") => void;
  onRequestDelete: () => void;
  onLocalRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
            Livrable {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-1 font-sans text-xl font-extralight tracking-[-0.02em] text-[#F5F5F7]">
            {deliverable.title || deliverable.media?.filename || "Sans titre"}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <AdminStatusBadge status={deliverable.status} />
          <button
            type="button"
            onClick={() => onMove("up")}
            disabled={pending || index === 0}
            aria-label="Monter ce livrable"
            className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove("down")}
            disabled={pending || index === total - 1}
            aria-label="Descendre ce livrable"
            className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↓
          </button>
          <Button variant="danger" onClick={onRequestDelete} pending={pending}>
            Supprimer
          </Button>
        </div>
      </div>

      {/* Aperçu média */}
      <MediaThumb media={deliverable.media} />

      {/* Champs édition */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldInline
          ctx={ctx}
          deliverableId={deliverable.id}
          field="format"
          initialValue={deliverable.format ?? ""}
          label="Format"
          placeholder="ex: Feed 1:1, Story 9:16, Reel 9:16…"
          suggestions={FORMAT_SUGGESTIONS}
        />
        <FieldInline
          ctx={ctx}
          deliverableId={deliverable.id}
          field="title"
          initialValue={deliverable.title ?? ""}
          label="Titre"
          placeholder="ex: Hook variation A"
        />
      </div>
      <FieldInline
        ctx={ctx}
        deliverableId={deliverable.id}
        field="description"
        initialValue={deliverable.description ?? ""}
        label="Description"
        placeholder="Note ce que tu veux dire au client à propos de ce livrable…"
        multiline
      />

      {/* Thread */}
      <OwnerThread
        ctx={ctx}
        deliverableId={deliverable.id}
        feedbacks={deliverable.feedbacks}
        onSent={onLocalRefresh}
      />
    </div>
  );
}

function AdminStatusBadge({
  status,
}: {
  status: AdminDeliverable["status"];
}) {
  const map = {
    pending: {
      label: "En attente",
      className: "border-white/20 text-white/55",
    },
    approved: {
      label: "Approuvé",
      className: "border-emerald-300/50 text-emerald-200/85",
    },
    changes_requested: {
      label: "Modif demandée",
      className: "border-amber-300/50 text-amber-200/85",
    },
  } as const;
  const meta = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.32em]",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

function MediaThumb({ media }: { media: AdminMediaOption | null }) {
  if (!media) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-[0.32em] text-white/40">
        Média indisponible
      </div>
    );
  }
  if (media.mime_type.startsWith("image/")) {
    return (
      <div className="relative max-h-[420px] w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.public_url}
          alt={media.filename}
          className="block max-h-[420px] w-auto object-contain"
        />
      </div>
    );
  }
  if (media.mime_type.startsWith("video/")) {
    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
        <video
          src={media.public_url}
          controls
          preload="metadata"
          playsInline
          className="block max-h-[420px] w-full"
        />
      </div>
    );
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-[0.32em] text-white/40">
      {media.mime_type}
    </div>
  );
}

// ─── Champ inline avec autosave ─────────────────────────────────────────────

const FIELD_INPUT =
  "w-full border-0 border-b border-white/15 bg-transparent py-2 text-sm text-[#F5F5F7] outline-none transition-colors placeholder:text-white/30 focus:border-white/45";
const FIELD_TEXTAREA =
  "w-full resize-y border border-white/15 bg-white/[0.02] px-3 py-2 text-sm text-[#F5F5F7] outline-none transition-colors placeholder:text-white/30 focus:border-white/35";

function FieldInline({
  ctx,
  deliverableId,
  field,
  initialValue,
  label,
  placeholder,
  multiline,
  suggestions,
}: {
  ctx: DeliverableActionContext;
  deliverableId: string;
  field: "format" | "title" | "description";
  initialValue: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  suggestions?: string[];
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState(initialValue);
  const [debounceHandle, setDebounceHandle] = useState<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(next: string) {
    if (debounceHandle) clearTimeout(debounceHandle);
    if (next === lastSaved) return;
    const handle = setTimeout(async () => {
      setSaving(true);
      const res = await updateDeliverable({
        ctx,
        deliverableId,
        patch: { [field]: next.trim() || null },
      });
      setSaving(false);
      if (res.ok) {
        setLastSaved(next);
        setError(null);
      } else {
        setError(res.error);
      }
    }, 600);
    setDebounceHandle(handle);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-white/45">
        <span>{label}</span>
        {saving && <span className="text-white/30">…</span>}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            scheduleSave(e.target.value);
          }}
          placeholder={placeholder}
          rows={3}
          className={FIELD_TEXTAREA}
        />
      ) : (
        <>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              scheduleSave(e.target.value);
            }}
            placeholder={placeholder}
            className={FIELD_INPUT}
            autoComplete="off"
          />
          {suggestions && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setValue(s);
                    scheduleSave(s);
                  }}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.28em] text-white/45 transition-colors hover:border-white/35 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {error && (
        <p className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Thread côté owner ──────────────────────────────────────────────────────

function OwnerThread({
  ctx,
  deliverableId,
  feedbacks,
  onSent,
}: {
  ctx: DeliverableActionContext;
  deliverableId: string;
  feedbacks: AdminDeliverableFeedback[];
  onSent: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await postOwnerReply({
        ctx,
        deliverableId,
        body: draft,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDraft("");
      onSent();
    });
  }

  return (
    <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
      <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
        Retours ({feedbacks.length})
      </p>
      {feedbacks.length > 0 && (
        <ul className="flex flex-col gap-3">
          {feedbacks.map((f) => (
            <li
              key={f.id}
              className={cn(
                "flex flex-col gap-1 rounded-xl border p-4",
                f.author_kind === "client"
                  ? "border-amber-300/30 bg-amber-300/[0.04]"
                  : "border-white/15 bg-white/[0.03]",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
                  {f.author_kind === "client" ? "Client" : "Speetch"}
                </span>
                <span className="font-mono text-[10px] text-white/30">
                  {formatDate(f.created_at)}
                </span>
              </div>
              <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-white/80">
                {f.body}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSend} className="flex flex-col gap-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Réponse au client…"
          rows={2}
          className={FIELD_TEXTAREA}
        />
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={pending || draft.trim().length === 0}
            className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>{pending ? "Envoi…" : "Répondre"}</span>
            <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-16" />
          </button>
        </div>
        {error && (
          <p className="text-[10px] uppercase tracking-[0.32em] text-red-300/80">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

// ─── Modal sélecteur de média ───────────────────────────────────────────────

function MediaPickerModal({
  open,
  media,
  onClose,
  onPick,
}: {
  open: boolean;
  media: AdminMediaOption[];
  onClose: () => void;
  onPick: (mediaId: string) => void;
}) {
  const [filter, setFilter] = useState("");
  if (!open) return null;

  const filtered = filter.trim()
    ? media.filter((m) => {
        const q = filter.toLowerCase();
        return (
          m.filename.toLowerCase().includes(q) ||
          (m.folder_name?.toLowerCase().includes(q) ?? false)
        );
      })
    : media;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90svh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-6 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
              Choisir un média
            </p>
            <h2 className="mt-1 font-sans text-2xl font-extralight tracking-[-0.02em] text-[#F5F5F7]">
              Médiathèque client
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
          >
            Fermer ×
          </button>
        </header>

        <div className="border-b border-white/10 px-6 py-4">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par nom ou dossier…"
            className="w-full border-0 border-b border-white/15 bg-transparent py-2 text-sm text-[#F5F5F7] outline-none placeholder:text-white/30 focus:border-white/45"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-auto p-6">
          {filtered.length === 0 ? (
            <p className="py-12 text-center font-serif italic text-white/40">
              {media.length === 0
                ? "Aucun média dans la médiathèque. Uploade des fichiers dans /admin/clients/[id]/media."
                : "Aucun média ne correspond au filtre."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onPick(m.id)}
                    className="group flex w-full flex-col gap-2 text-left transition-colors"
                  >
                    <span className="relative block aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all group-hover:border-white/35">
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
                          <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-0.5 text-[9px] uppercase tracking-[0.32em] text-white/80 backdrop-blur-sm">
                            Vidéo
                          </span>
                        </>
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
                          {m.mime_type}
                        </span>
                      )}
                    </span>
                    <span className="px-1 truncate font-mono text-[10px] text-white/55">
                      {m.filename}
                    </span>
                    {m.folder_name && (
                      <span className="px-1 truncate text-[9px] uppercase tracking-[0.32em] text-white/30">
                        {m.folder_name}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
