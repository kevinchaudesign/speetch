"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Field } from "@/lib/ds";
import { HolocronPicker } from "../../_components/holocron-picker";
import { LineItemsEditor } from "../../_components/line-items-editor";
import {
  createInvoice,
  updateInvoice,
  type InvoiceActionState,
} from "../actions";
import {
  OPERATION_NATURE_LABEL,
  OPERATION_NATURE_VALUES,
  OPERATION_TYPE_LABEL,
  OPERATION_TYPE_VALUES,
  PAYMENT_METHOD_LABEL,
  PAYMENT_METHOD_VALUES,
  type CreditLine,
  type InvoiceRow,
} from "@/lib/credits/types";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: InvoiceActionState = { status: "idle" };

type Holocron = {
  id: string;
  full_name: string;
  client_email: string | null;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function SubmitBtn({
  label,
  pendingLabel,
  emitMode,
}: {
  label: string;
  pendingLabel: string;
  emitMode?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={emitMode ? "emit" : undefined}
      value={emitMode ? "1" : undefined}
      disabled={pending}
      className={`group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] transition-colors duration-300 disabled:cursor-wait disabled:opacity-50 ${
        emitMode
          ? "text-emerald-200/85 hover:text-emerald-100"
          : "text-cyan-100/80 hover:text-cyan-100"
      }`}
    >
      <span>{pending ? pendingLabel : label}</span>
      <span
        className={`inline-block h-px w-6 transition-all duration-500 ease-out group-hover:w-12 ${
          emitMode ? "bg-emerald-300/85" : "bg-cyan-200/85"
        }`}
      />
    </button>
  );
}

export function InvoiceForm({
  mode,
  initial,
  fromQuote,
  holocrons,
  defaultPaymentTerms,
  vatExempt,
}: {
  mode: "create" | "edit";
  initial?: InvoiceRow;
  /** Si on duplique depuis un devis (mode create). */
  fromQuote?: {
    quoteId: string;
    snapshot: Partial<InvoiceRow>;
  };
  holocrons: Holocron[];
  defaultPaymentTerms: string;
  vatExempt: boolean;
}) {
  const router = useRouter();
  const action = mode === "create" ? createInvoice : updateInvoice;
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state.status === "success" && state.invoiceId && mode === "create") {
      router.push(`/admin/credits/factures/${state.invoiceId}`);
    }
  }, [state, router, mode]);

  // Source des défauts : initial (edit) > fromQuote.snapshot (create depuis devis) > rien
  const src: Partial<InvoiceRow> = initial ?? fromQuote?.snapshot ?? {};
  const lines: CreditLine[] = (src.lines as CreditLine[]) ?? [];

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="flex w-full flex-col gap-10"
    >
      {mode === "edit" && initial && (
        <input type="hidden" name="id" value={initial.id} />
      )}
      {fromQuote && (
        <input type="hidden" name="quote_id" value={fromQuote.quoteId} />
      )}

      <Field label="Holocron client" hint="optionnel — sélection auto-remplit le nom">
        <HolocronPicker
          holocrons={holocrons}
          initialId={src.profile_id ?? null}
        />
      </Field>

      {/* Client snapshot */}
      <section className="flex flex-col gap-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
          Coordonnées client (snapshot figé)
        </span>
        <Field label="Nom du destinataire">
          <input
            type="text"
            name="client_name"
            required
            defaultValue={src.client_name ?? ""}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Société">
            <input
              type="text"
              name="client_company"
              defaultValue={src.client_company ?? ""}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="E-mail">
            <input
              type="email"
              name="client_email"
              defaultValue={src.client_email ?? ""}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-sm text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
        <Field label="Adresse">
          <input
            type="text"
            name="client_address"
            defaultValue={src.client_address ?? ""}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr_1fr]">
          <Field label="CP">
            <input
              type="text"
              name="client_postal_code"
              defaultValue={src.client_postal_code ?? ""}
              inputMode="numeric"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Ville">
            <input
              type="text"
              name="client_city"
              defaultValue={src.client_city ?? ""}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Pays">
            <input
              type="text"
              name="client_country"
              defaultValue={src.client_country ?? "France"}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="SIREN" hint="exigé B2B — facturation électronique">
            <input
              type="text"
              name="client_siren"
              defaultValue={src.client_siren ?? ""}
              inputMode="numeric"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="N° TVA intra.">
            <input
              type="text"
              name="client_vat_number"
              defaultValue={src.client_vat_number ?? ""}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-sm text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
      </section>

      {/* Dates */}
      <section className="flex flex-col gap-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
          Dates
        </span>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Date d'émission">
            <input
              type="date"
              name="issued_at"
              required
              defaultValue={(src.issued_at ?? todayIso()).slice(0, 10)}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Date d'échéance" hint="défaut : +30 jours">
            <input
              type="date"
              name="due_at"
              defaultValue={(src.due_at ?? plusDaysIso(30)).slice(0, 10)}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
      </section>

      {/* Réforme facturation électronique */}
      <section className="flex flex-col gap-6 border border-cyan-200/15 bg-cyan-200/[0.02] px-5 py-5">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
            Facturation électronique
          </span>
          <span className="font-serif text-[12px] italic text-white/45">
            champs requis par la réforme française (Factur-X / e-reporting)
          </span>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Type d'opération">
            <select
              name="operation_type"
              defaultValue={src.operation_type ?? "B2B"}
              className="cursor-pointer appearance-none border-b border-cyan-200/25 bg-transparent pb-3 pr-8 font-sans text-base font-light text-[#F5F5F7] focus:border-cyan-200/80 focus:outline-none [background-image:linear-gradient(45deg,transparent_50%,rgba(125,211,252,0.6)_50%),linear-gradient(135deg,rgba(125,211,252,0.6)_50%,transparent_50%)] [background-position:right_1.1rem_center,right_0.65rem_center] [background-size:5px_5px,5px_5px] bg-no-repeat"
            >
              {OPERATION_TYPE_VALUES.map((v) => (
                <option key={v} value={v} className="bg-black text-white">
                  {OPERATION_TYPE_LABEL[v]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nature de l'opération">
            <select
              name="operation_nature"
              defaultValue={src.operation_nature ?? "services"}
              className="cursor-pointer appearance-none border-b border-cyan-200/25 bg-transparent pb-3 pr-8 font-sans text-base font-light text-[#F5F5F7] focus:border-cyan-200/80 focus:outline-none [background-image:linear-gradient(45deg,transparent_50%,rgba(125,211,252,0.6)_50%),linear-gradient(135deg,rgba(125,211,252,0.6)_50%,transparent_50%)] [background-position:right_1.1rem_center,right_0.65rem_center] [background-size:5px_5px,5px_5px] bg-no-repeat"
            >
              {OPERATION_NATURE_VALUES.map((v) => (
                <option key={v} value={v} className="bg-black text-white">
                  {OPERATION_NATURE_LABEL[v]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          label="Adresse de livraison"
          hint="optionnel — si distincte de l'adresse de facturation"
        >
          <input
            type="text"
            name="delivery_address"
            defaultValue={src.delivery_address ?? ""}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
      </section>

      {/* Intro */}
      <Field label="Introduction" hint="texte d'accroche optionnel">
        <textarea
          name="intro"
          rows={3}
          defaultValue={src.intro ?? ""}
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
        />
      </Field>

      {/* Lignes */}
      <section className="flex flex-col gap-4 border-t border-cyan-200/15 pt-8">
        <LineItemsEditor initial={lines} vatExempt={vatExempt} />
      </section>

      {/* Conditions + paiement */}
      <section className="grid grid-cols-1 gap-8 border-t border-cyan-200/15 pt-8 md:grid-cols-2">
        <Field
          label="Conditions de paiement"
          hint={`défaut : ${defaultPaymentTerms}`}
        >
          <input
            type="text"
            name="payment_terms"
            defaultValue={src.payment_terms ?? ""}
            placeholder={defaultPaymentTerms}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
        <Field label="Mode de paiement">
          <select
            name="payment_method"
            defaultValue={src.payment_method ?? "transfer"}
            className="cursor-pointer appearance-none border-b border-cyan-200/25 bg-transparent pb-3 pr-8 font-sans text-base font-light text-[#F5F5F7] focus:border-cyan-200/80 focus:outline-none [background-image:linear-gradient(45deg,transparent_50%,rgba(125,211,252,0.6)_50%),linear-gradient(135deg,rgba(125,211,252,0.6)_50%,transparent_50%)] [background-position:right_1.1rem_center,right_0.65rem_center] [background-size:5px_5px,5px_5px] bg-no-repeat"
          >
            {PAYMENT_METHOD_VALUES.map((v) => (
              <option key={v} value={v} className="bg-black text-white">
                {PAYMENT_METHOD_LABEL[v]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Montant déjà reçu (€)">
          <input
            type="number"
            step="0.01"
            name="paid_amount"
            defaultValue={src.paid_amount ?? 0}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
        <Field label="Date d'encaissement" hint="si payé">
          <input
            type="date"
            name="paid_at"
            defaultValue={src.paid_at ?? ""}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
        <Field label="Notes" hint="apparaît en pied">
          <input
            type="text"
            name="notes"
            defaultValue={src.notes ?? ""}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
      </section>

      <AnimatePresence>
        {state.status === "error" && state.error && (
          <motion.p
            key={state.error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
          >
            {state.error}
          </motion.p>
        )}
        {state.status === "success" && mode === "edit" && (
          <motion.p
            key="ok"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="border-l-2 border-cyan-300/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-cyan-200/90"
          >
            Facture mise à jour.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-end gap-8 border-t border-cyan-200/15 pt-6">
        {mode === "create" ? (
          <>
            <SubmitBtn label="Sceller en brouillon" pendingLabel="Scellement…" />
            <SubmitBtn
              label="Sceller et émettre"
              pendingLabel="Émission…"
              emitMode
            />
          </>
        ) : (
          <SubmitBtn label="Mettre à jour" pendingLabel="Sauvegarde…" />
        )}
      </div>
    </motion.form>
  );
}
