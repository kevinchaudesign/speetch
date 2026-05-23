"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Field } from "@/lib/ds";
import { HolocronPicker } from "../../_components/holocron-picker";
import { LineItemsEditor } from "../../_components/line-items-editor";
import {
  createQuote,
  updateQuote,
  type QuoteActionState,
} from "../actions";
import type { CreditLine, QuoteRow } from "@/lib/credits/types";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: QuoteActionState = { status: "idle" };

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

function SubmitButton({
  pendingLabel,
  label,
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

export function QuoteForm({
  mode,
  initial,
  holocrons,
  defaultPaymentTerms,
  vatExempt,
}: {
  mode: "create" | "edit";
  initial?: QuoteRow;
  holocrons: Holocron[];
  defaultPaymentTerms: string;
  vatExempt: boolean;
}) {
  const router = useRouter();
  const action = mode === "create" ? createQuote : updateQuote;
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  // Sur succès en mode create : on file sur la fiche détail du devis créé.
  useEffect(() => {
    if (state.status === "success" && state.quoteId && mode === "create") {
      router.push(`/admin/credits/devis/${state.quoteId}`);
    }
  }, [state, router, mode]);

  const lines: CreditLine[] = initial?.lines ?? [];

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

      {/* Holocron rattaché */}
      <Field label="Holocron client" hint="optionnel — sélection auto-remplit le nom">
        <HolocronPicker
          holocrons={holocrons}
          initialId={initial?.profile_id ?? null}
        />
      </Field>

      {/* Coordonnées client (snapshot figé à l'émission) */}
      <section className="flex flex-col gap-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
          Coordonnées client (snapshot)
        </span>
        <Field label="Nom du destinataire">
          <input
            type="text"
            name="client_name"
            required
            defaultValue={initial?.client_name ?? ""}
            placeholder="Léa Müller"
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Société / structure">
            <input
              type="text"
              name="client_company"
              defaultValue={initial?.client_company ?? ""}
              placeholder="Atelier Müller SAS"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="E-mail">
            <input
              type="email"
              name="client_email"
              defaultValue={initial?.client_email ?? ""}
              placeholder="lea@mueller.fr"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
        <Field label="Adresse">
          <input
            type="text"
            name="client_address"
            defaultValue={initial?.client_address ?? ""}
            placeholder="12 rue des Lilas"
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr_1fr]">
          <Field label="Code postal">
            <input
              type="text"
              name="client_postal_code"
              defaultValue={initial?.client_postal_code ?? ""}
              inputMode="numeric"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Ville">
            <input
              type="text"
              name="client_city"
              defaultValue={initial?.client_city ?? ""}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Pays">
            <input
              type="text"
              name="client_country"
              defaultValue={initial?.client_country ?? "France"}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="SIREN" hint="exigé en B2B pour la facturation électronique">
            <input
              type="text"
              name="client_siren"
              defaultValue={initial?.client_siren ?? ""}
              placeholder="123 456 789"
              inputMode="numeric"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="N° TVA intra." hint="si assujetti">
            <input
              type="text"
              name="client_vat_number"
              defaultValue={initial?.client_vat_number ?? ""}
              placeholder="FR12345678901"
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
              defaultValue={initial?.issued_at ?? todayIso()}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Date de validité" hint="défaut : +30 jours">
            <input
              type="date"
              name="valid_until"
              defaultValue={initial?.valid_until ?? plusDaysIso(30)}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
      </section>

      {/* Intro */}
      <Field label="Introduction" hint="texte d'accroche en haut du devis — optionnel">
        <textarea
          name="intro"
          rows={3}
          defaultValue={initial?.intro ?? ""}
          placeholder="Suite à notre conversation, voici la proposition pour…"
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
        />
      </Field>

      {/* Lignes */}
      <section className="flex flex-col gap-4 border-t border-cyan-200/15 pt-8">
        <LineItemsEditor initial={lines} vatExempt={vatExempt} />
      </section>

      {/* Conditions + notes */}
      <section className="grid grid-cols-1 gap-8 border-t border-cyan-200/15 pt-8 md:grid-cols-2">
        <Field label="Conditions de paiement" hint={`défaut : ${defaultPaymentTerms}`}>
          <input
            type="text"
            name="payment_terms"
            defaultValue={initial?.payment_terms ?? ""}
            placeholder={defaultPaymentTerms}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
        <Field label="Notes" hint="apparaît en pied">
          <input
            type="text"
            name="notes"
            defaultValue={initial?.notes ?? ""}
            placeholder="Acompte 30 % à la signature"
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
            Devis mis à jour.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-end gap-8 border-t border-cyan-200/15 pt-6">
        {mode === "create" ? (
          <>
            <SubmitButton label="Sceller en brouillon" pendingLabel="Scellement…" />
            <SubmitButton
              label="Sceller et émettre"
              pendingLabel="Émission…"
              emitMode
            />
          </>
        ) : (
          <SubmitButton label="Mettre à jour" pendingLabel="Sauvegarde…" />
        )}
      </div>
    </motion.form>
  );
}
