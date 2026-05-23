"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Modal, Eyebrow, Button, Field } from "@/lib/ds";
import { formatEuro } from "@/lib/credits/pricing";
import {
  createCreditNote,
  type CreditNoteState,
} from "../../avoirs/actions";

/**
 * Modal pour émettre un avoir lié à une facture.
 * Mode "total" : reprend les montants exacts de la facture et bascule
 * la facture en "canceled". Mode "partial" : montants saisis (avoir
 * pour remise commerciale a posteriori, par exemple).
 */

const INITIAL: CreditNoteState = { status: "idle" };

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      pending={pending}
      pendingLabel="Émission…"
      variant="primary"
    >
      Émettre l&apos;avoir
    </Button>
  );
}

export function IssueCreditNoteDialog({
  invoiceId,
  invoiceNumber,
  invoiceSubtotalHt,
  invoiceTaxTotal,
  invoiceTotalTtc,
  open,
  onClose,
}: {
  invoiceId: string;
  invoiceNumber: string;
  invoiceSubtotalHt: number;
  invoiceTaxTotal: number;
  invoiceTotalTtc: number;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createCreditNote, INITIAL);
  const [mode, setMode] = useState<"full" | "partial">("full");

  // Au succès : on file sur la fiche avoir
  useEffect(() => {
    if (state.status === "success" && state.creditNoteId) {
      router.push(`/admin/credits/avoirs/${state.creditNoteId}`);
    }
  }, [state, router]);

  return (
    <Modal open={open} size="compact" onClose={onClose}>
      <form
        action={formAction}
        className="flex flex-col gap-5 px-6 py-7 md:px-8 md:py-8"
      >
        <input type="hidden" name="invoice_id" value={invoiceId} />

        <div className="flex flex-col gap-2">
          <Eyebrow tracking="md" intensity="strong">
            Émission d&apos;avoir
          </Eyebrow>
          <h2
            className="font-sans font-extralight leading-tight tracking-[-0.03em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)" }}
          >
            Avoir sur facture{" "}
            <span className="font-mono text-cyan-100">{invoiceNumber}</span>
          </h2>
          <p className="font-serif text-sm italic text-white/55">
            Montant facture : {formatEuro(invoiceTotalTtc)} TTC
          </p>
        </div>

        {/* Mode total / partiel */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
            Périmètre
          </span>
          <label className="flex cursor-pointer items-start gap-3 border border-cyan-200/15 bg-cyan-200/[0.02] px-4 py-3 hover:border-cyan-200/40">
            <input
              type="radio"
              name="mode"
              value="full"
              checked={mode === "full"}
              onChange={() => setMode("full")}
              className="mt-1 h-4 w-4 cursor-pointer accent-cyan-300"
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm text-[#F5F5F7]">Annulation totale</span>
              <span className="font-serif text-[12px] italic text-white/55">
                Montants = facture ({formatEuro(invoiceTotalTtc)}). Bascule la
                facture en « Annulée ».
              </span>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 border border-cyan-200/15 bg-cyan-200/[0.02] px-4 py-3 hover:border-cyan-200/40">
            <input
              type="radio"
              name="mode"
              value="partial"
              checked={mode === "partial"}
              onChange={() => setMode("partial")}
              className="mt-1 h-4 w-4 cursor-pointer accent-cyan-300"
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm text-[#F5F5F7]">Avoir partiel</span>
              <span className="font-serif text-[12px] italic text-white/55">
                Saisir les montants à créditer (remise commerciale a posteriori).
              </span>
            </div>
          </label>
        </div>

        {mode === "partial" && (
          <div className="grid grid-cols-2 gap-4 border-l-2 border-cyan-200/20 pl-4">
            <Field label="Montant HT à créditer">
              <input
                type="number"
                step="0.01"
                name="subtotal_ht"
                required
                defaultValue={invoiceSubtotalHt}
                className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
              />
            </Field>
            <Field label="TVA à créditer">
              <input
                type="number"
                step="0.01"
                name="tax_total"
                required
                defaultValue={invoiceTaxTotal}
                className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
              />
            </Field>
          </div>
        )}

        <Field label="Motif" hint="apparaît sur l'avoir imprimé">
          <input
            type="text"
            name="reason"
            required
            minLength={3}
            placeholder="Annulation suite à erreur de prestation"
            className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>

        <Field label="Notes" hint="optionnel">
          <input
            type="text"
            name="notes"
            className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>

        {state.status === "error" && state.error && (
          <p
            className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.28em] text-red-300/85"
            style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
          >
            {state.error}
          </p>
        )}

        <div className="mt-3 flex items-center justify-end gap-6 border-t border-cyan-200/15 pt-5">
          <Button variant="ghost" onClick={onClose} type="button">
            Annuler
          </Button>
          <SubmitBtn />
        </div>
      </form>
    </Modal>
  );
}
