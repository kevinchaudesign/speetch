"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  postClientFeedback,
  setDeliverableStatusByClient,
} from "../../deliverable-actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type DeliverableStatus = "pending" | "approved" | "changes_requested";

export type PublicDeliverableFeedback = {
  id: string;
  author_kind: "owner" | "client";
  body: string;
  created_at: string;
};

export type PublicDeliverable = {
  id: string;
  position: number;
  format: string | null;
  title: string | null;
  description: string | null;
  status: DeliverableStatus;
  media: {
    filename: string;
    mime_type: string;
    public_url: string;
  } | null;
  feedbacks: PublicDeliverableFeedback[];
};

export function DeliverablesPageView({
  clientSlug,
  clientName,
  projectSlug,
  projectName,
  pageName,
  intro,
  deliverables,
}: {
  clientSlug: string;
  clientName: string;
  projectSlug: string;
  projectName: string;
  pageName: string;
  intro: string | null;
  deliverables: PublicDeliverable[];
}) {
  const totals = countByStatus(deliverables);

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
          <p className="mt-10 max-w-2xl text-balance font-serif text-base italic text-white/55 md:text-lg">
            {intro}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.32em] text-white/45">
          <span>
            {deliverables.length} livrable{deliverables.length > 1 ? "s" : ""}
          </span>
          {totals.approved > 0 && (
            <span className="text-emerald-200/85">
              {totals.approved} approuvé{totals.approved > 1 ? "s" : ""}
            </span>
          )}
          {totals.changes > 0 && (
            <span className="text-amber-200/85">
              {totals.changes} modif demandée{totals.changes > 1 ? "s" : ""}
            </span>
          )}
          {totals.pending > 0 && (
            <span className="text-white/55">
              {totals.pending} en attente
            </span>
          )}
        </div>
      </section>

      <section className="px-6 pb-24 pt-20 md:px-12 md:pb-32 md:pt-24">
        {deliverables.length === 0 ? (
          <p className="border-t border-white/10 pt-10 font-serif text-base italic text-white/40">
            Aucun livrable n&apos;a encore été ajouté à cette page.
          </p>
        ) : (
          <ul className="flex flex-col gap-20 md:gap-28">
            {deliverables.map((d, i) => (
              <DeliverableBlock
                key={d.id}
                deliverable={d}
                index={i}
                clientSlug={clientSlug}
              />
            ))}
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

function countByStatus(items: PublicDeliverable[]) {
  let approved = 0;
  let changes = 0;
  let pending = 0;
  for (const d of items) {
    if (d.status === "approved") approved++;
    else if (d.status === "changes_requested") changes++;
    else pending++;
  }
  return { approved, changes, pending };
}

// ─── Bloc d'un livrable ──────────────────────────────────────────────────

function DeliverableBlock({
  deliverable,
  index,
  clientSlug,
}: {
  deliverable: PublicDeliverable;
  index: number;
  clientSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [intendedStatus, setIntendedStatus] = useState<
    "approved" | "changes_requested" | null
  >(null);

  function handleStatusOnly(status: "approved" | "changes_requested") {
    setError(null);
    startTransition(async () => {
      const res = await setDeliverableStatusByClient({
        clientSlug,
        deliverableId: deliverable.id,
        status,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft.trim()) {
      setError("Écris un message d'abord.");
      return;
    }
    startTransition(async () => {
      const res = await postClientFeedback({
        clientSlug,
        deliverableId: deliverable.id,
        body: draft,
        newStatus: intendedStatus,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDraft("");
      setIntendedStatus(null);
      router.refresh();
    });
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      className="flex flex-col gap-10 border-t border-white/10 pt-12 md:pt-16"
    >
      {/* Header livrable */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
            Livrable {String(index + 1).padStart(2, "0")}
            {deliverable.format && (
              <>
                <span className="mx-3 text-white/20">·</span>
                <span className="text-white/55">{deliverable.format}</span>
              </>
            )}
          </p>
          <h2
            className="font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            {deliverable.title ||
              (deliverable.media?.filename ?? "Sans titre")}
          </h2>
        </div>
        <StatusBadge status={deliverable.status} />
      </header>

      {/* Média */}
      <MediaPreview media={deliverable.media} format={deliverable.format} />

      {/* Description */}
      {deliverable.description && (
        <p className="max-w-2xl text-balance font-serif text-base leading-relaxed text-white/65 md:text-lg">
          {deliverable.description}
        </p>
      )}

      {/* Boutons statut rapide */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-white/10 pt-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-white/40">
          Statut rapide
        </span>
        <button
          type="button"
          onClick={() => handleStatusOnly("approved")}
          disabled={pending}
          className={cn(
            "text-[11px] uppercase tracking-[0.32em] transition-colors disabled:cursor-wait",
            deliverable.status === "approved"
              ? "text-emerald-200/85"
              : "text-white/45 hover:text-emerald-200/85",
          )}
        >
          ✓ Approuver
        </button>
        <button
          type="button"
          onClick={() => handleStatusOnly("changes_requested")}
          disabled={pending}
          className={cn(
            "text-[11px] uppercase tracking-[0.32em] transition-colors disabled:cursor-wait",
            deliverable.status === "changes_requested"
              ? "text-amber-200/85"
              : "text-white/45 hover:text-amber-200/85",
          )}
        >
          ↻ Demander une modif
        </button>
      </div>

      {/* Thread de feedback */}
      <div className="flex flex-col gap-6 border-t border-white/10 pt-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
          Retours ({deliverable.feedbacks.length})
        </p>

        {deliverable.feedbacks.length > 0 && (
          <ul className="flex flex-col gap-5">
            {deliverable.feedbacks.map((f) => (
              <FeedbackBubble key={f.id} feedback={f} />
            ))}
          </ul>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ton retour ou ta demande de modification…"
            rows={3}
            className="w-full resize-y border border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-[#F5F5F7] outline-none transition-colors placeholder:text-white/30 focus:border-white/35"
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-white/55">
              <input
                type="radio"
                name={`status-${deliverable.id}`}
                checked={intendedStatus === null}
                onChange={() => setIntendedStatus(null)}
                className="accent-white"
              />
              Sans changer le statut
            </label>
            <label className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-emerald-200/75">
              <input
                type="radio"
                name={`status-${deliverable.id}`}
                checked={intendedStatus === "approved"}
                onChange={() => setIntendedStatus("approved")}
                className="accent-emerald-300"
              />
              + Approuver
            </label>
            <label className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-amber-200/75">
              <input
                type="radio"
                name={`status-${deliverable.id}`}
                checked={intendedStatus === "changes_requested"}
                onChange={() => setIntendedStatus("changes_requested")}
                className="accent-amber-300"
              />
              + Demander une modif
            </label>
            <div className="ml-auto">
              <button
                type="submit"
                disabled={pending || draft.trim().length === 0}
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>{pending ? "Envoi…" : "Envoyer"}</span>
                <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-16" />
              </button>
            </div>
          </div>
          {error && (
            <p className="text-[11px] uppercase tracking-[0.32em] text-red-300/80">
              {error}
            </p>
          )}
        </form>
      </div>
    </motion.li>
  );
}

function StatusBadge({ status }: { status: DeliverableStatus }) {
  const map: Record<DeliverableStatus, { label: string; className: string }> = {
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
  };
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

function MediaPreview({
  media,
  format,
}: {
  media: PublicDeliverable["media"];
  format: string | null;
}) {
  if (!media) {
    return (
      <div className="flex aspect-[4/3] w-full max-w-2xl items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-[0.32em] text-white/40">
        Média indisponible
      </div>
    );
  }

  // Heuristique de cadrage : on respecte les formats Meta usuels si déclarés.
  // Sinon ratio 4:3 par défaut (sera "contain" pour les images de toute façon).
  const aspect = aspectFromFormat(format);

  if (media.mime_type.startsWith("image/")) {
    return (
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
        style={{ aspectRatio: aspect }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.public_url}
          alt={media.filename}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
    );
  }
  if (media.mime_type.startsWith("video/")) {
    return (
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-white/10 bg-black"
        style={{ aspectRatio: aspect }}
      >
        <video
          src={media.public_url}
          controls
          preload="metadata"
          playsInline
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div className="flex aspect-[4/3] w-full max-w-2xl items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-[0.32em] text-white/40">
      {media.mime_type}
    </div>
  );
}

/**
 * Mapping doux des labels de format communs vers un aspect-ratio CSS.
 * Si le user tape autre chose (ex: « Carrousel 6 cartes »), on retombe sur
 * un 4:3 neutre.
 */
function aspectFromFormat(format: string | null): string {
  if (!format) return "4 / 3";
  const f = format.toLowerCase();
  if (f.includes("9:16") || f.includes("story") || f.includes("reel"))
    return "9 / 16";
  if (f.includes("4:5") || f.includes("feed") || f.includes("post"))
    return "4 / 5";
  if (f.includes("1:1") || f.includes("carré") || f.includes("square"))
    return "1 / 1";
  if (f.includes("16:9") || f.includes("paysage") || f.includes("landscape"))
    return "16 / 9";
  return "4 / 3";
}

function FeedbackBubble({ feedback }: { feedback: PublicDeliverableFeedback }) {
  const isOwner = feedback.author_kind === "owner";
  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-5",
        isOwner
          ? "border-white/20 bg-white/[0.04]"
          : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
          {isOwner ? "Speetch" : "Toi"}
        </span>
        <span className="font-mono text-[10px] text-white/30">
          {formatDate(feedback.created_at)}
        </span>
      </div>
      <p className="whitespace-pre-line font-serif text-sm leading-relaxed text-white/80 md:text-base">
        {feedback.body}
      </p>
    </li>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
