"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/lib/ds";
import { deleteInvoice, setInvoiceStatus } from "../actions";
import type { InvoiceStatus } from "@/lib/credits/types";
import { SendCreditDialog } from "../../_components/send-credit-dialog";
import { IssueCreditNoteDialog } from "./issue-credit-note-dialog";

/**
 * Barre d'actions de cycle de vie d'une facture.
 * - draft → sent / canceled / supprimer
 * - sent → paid / partial → géré aussi par l'édition (paid_amount)
 * - Annulation possible (status = canceled) sans suppression (la pièce
 *   garde son numéro pour l'audit).
 */
export function InvoiceActionsBar({
  invoiceId,
  invoiceNumber,
  clientName,
  clientEmail,
  subtotalHt,
  taxTotal,
  totalTtc,
  status,
}: {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  subtotalHt: number;
  taxTotal: number;
  totalTtc: number;
  status: InvoiceStatus;
}) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [issueAvoirOpen, setIssueAvoirOpen] = useState(false);

  function setStatus(next: InvoiceStatus) {
    start(async () => {
      const fd = new FormData();
      fd.set("id", invoiceId);
      fd.set("status", next);
      await setInvoiceStatus(fd);
    });
  }

  const canDelete = status === "draft";
  const canEmit = status === "draft";
  const canMarkPaid = status === "sent" || status === "partial" || status === "overdue";
  const canCancel = status !== "canceled" && status !== "draft" && status !== "paid";
  const canSendEmail = status !== "canceled";
  const canIssueAvoir = status !== "draft";

  return (
    <div className="flex w-full flex-wrap items-center gap-4 border-y border-cyan-200/15 py-4">
      {canSendEmail && (
        <ActionBtn
          label="Envoyer par email"
          onClick={() => setSendOpen(true)}
          disabled={pending}
          tone="success"
        />
      )}
      {canEmit && (
        <ActionBtn
          label="Marquer émise"
          onClick={() => setStatus("sent")}
          disabled={pending}
        />
      )}
      {canMarkPaid && (
        <ActionBtn
          label="Marquer encaissée"
          onClick={() => setStatus("paid")}
          disabled={pending}
          tone="success"
        />
      )}
      <span className="ml-auto" />
      {canIssueAvoir && (
        <button
          type="button"
          onClick={() => setIssueAvoirOpen(true)}
          disabled={pending}
          className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/70 transition-colors hover:text-cyan-100 disabled:opacity-40"
        >
          Émettre un avoir
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          onClick={() => setConfirmCancel(true)}
          disabled={pending}
          className="text-[10px] uppercase tracking-[0.32em] text-amber-300/85 transition-colors hover:text-amber-200 disabled:opacity-40"
        >
          Annuler la facture
        </button>
      )}
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
        description="Une facture brouillon peut être supprimée. Émise, elle doit rester (avoir requis pour annulation)."
        confirmLabel="Effacer"
        tone="danger"
        cancelLabel="Annuler"
        pending={pending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          start(async () => {
            const fd = new FormData();
            fd.set("id", invoiceId);
            await deleteInvoice(fd);
          })
        }
      />

      <ConfirmDialog
        open={confirmCancel}
        title="Annuler cette facture ?"
        description="Le statut passe à « Annulée ». La facture garde son numéro et reste visible dans l'historique (exigence légale)."
        confirmLabel="Annuler la facture"
        tone="warning"
        cancelLabel="Garder telle quelle"
        pending={pending}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          setStatus("canceled");
        }}
      />

      <SendCreditDialog
        kind="invoice"
        pieceId={invoiceId}
        pieceNumber={invoiceNumber}
        clientName={clientName}
        defaultEmail={clientEmail}
        open={sendOpen}
        onClose={() => setSendOpen(false)}
      />

      <IssueCreditNoteDialog
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        invoiceSubtotalHt={subtotalHt}
        invoiceTaxTotal={taxTotal}
        invoiceTotalTtc={totalTtc}
        open={issueAvoirOpen}
        onClose={() => setIssueAvoirOpen(false)}
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
  tone?: "info" | "success";
}) {
  const color =
    tone === "success"
      ? "text-emerald-200/85 hover:text-emerald-100"
      : "text-cyan-100/80 hover:text-cyan-100";
  const bar = tone === "success" ? "bg-emerald-300/85" : "bg-cyan-200/85";
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
