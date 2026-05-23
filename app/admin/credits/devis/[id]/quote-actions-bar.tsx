"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/lib/ds";
import { deleteQuote, setQuoteStatus } from "../actions";
import type { QuoteStatus } from "@/lib/credits/types";

/**
 * Barre d'actions de cycle de vie d'un devis :
 *  - Marquer émis / accepté / refusé / expiré (selon le state machine)
 *  - Convertir en facture (lien vers /factures/new?from_quote=…)
 *  - Supprimer (uniquement si brouillon)
 */
export function QuoteActionsBar({
  quoteId,
  status,
}: {
  quoteId: string;
  status: QuoteStatus;
}) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function setStatus(next: QuoteStatus) {
    start(async () => {
      const fd = new FormData();
      fd.set("id", quoteId);
      fd.set("status", next);
      await setQuoteStatus(fd);
    });
  }

  const canDelete = status === "draft";
  const canEmit = status === "draft";
  const canAccept = status === "sent";
  const canRefuse = status === "sent";
  const canConvert = status === "accepted";

  return (
    <div className="flex w-full flex-wrap items-center gap-4 border-y border-cyan-200/15 py-4">
      {canEmit && (
        <ActionBtn
          label="Marquer envoyé"
          onClick={() => setStatus("sent")}
          disabled={pending}
        />
      )}
      {canAccept && (
        <ActionBtn
          label="Marquer accepté"
          onClick={() => setStatus("accepted")}
          disabled={pending}
          tone="success"
        />
      )}
      {canRefuse && (
        <ActionBtn
          label="Marquer refusé"
          onClick={() => setStatus("refused")}
          disabled={pending}
          tone="danger"
        />
      )}
      {canConvert && (
        <a
          href={`/admin/credits/factures/new?from_quote=${quoteId}`}
          className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-emerald-200/85 transition-colors hover:text-emerald-100"
        >
          Émettre la facture
          <span className="inline-block h-px w-4 bg-current transition-all duration-500 ease-out group-hover:w-10" />
        </a>
      )}
      <span className="ml-auto" />
      {canDelete && (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={pending}
          className="text-[10px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-red-300 disabled:opacity-40"
        >
          Effacer ce brouillon
        </button>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Effacer ce brouillon ?"
        description="Un devis brouillon peut être supprimé (numéro libéré). Une fois émis, il devra rester."
        confirmLabel="Effacer"
        tone="danger"
        cancelLabel="Annuler"
        pending={pending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          start(async () => {
            const fd = new FormData();
            fd.set("id", quoteId);
            await deleteQuote(fd);
          })
        }
      />
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  tone = "info",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "info" | "success" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-emerald-200/85 hover:text-emerald-100"
      : tone === "danger"
        ? "text-red-300/85 hover:text-red-200"
        : "text-cyan-100/80 hover:text-cyan-100";
  const bar =
    tone === "success"
      ? "bg-emerald-300/85"
      : tone === "danger"
        ? "bg-red-300/85"
        : "bg-cyan-200/85";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] transition-colors duration-300 disabled:cursor-wait disabled:opacity-50 ${color}`}
    >
      <span>{label}</span>
      <span
        className={`inline-block h-px w-5 transition-all duration-500 ease-out group-hover:w-12 ${bar}`}
      />
    </button>
  );
}
