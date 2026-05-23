"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/lib/ds";
import { saveEmitterAction, type EmitterSettingsState } from "./actions";
import type { EmitterSettingsRow } from "@/lib/credits/types";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: EmitterSettingsState = { status: "idle" };

function SubmitButton({ has }: { has: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors duration-300 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-50"
    >
      <span>{pending ? "Scellement…" : has ? "Mettre à jour" : "Sceller"}</span>
      <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12" />
    </button>
  );
}

export function EmitterSettingsForm({
  initial,
}: {
  initial: EmitterSettingsRow | null;
}) {
  const [state, formAction] = useActionState(saveEmitterAction, INITIAL_STATE);
  const [vatExempt, setVatExempt] = useState(initial?.vat_exempt ?? true);
  const has = !!initial;

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="flex w-full flex-col gap-10"
    >
      {/* Identité légale */}
      <Section title="Identité légale" hint="apparaît en en-tête des pièces">
        <Field label="Raison sociale">
          <input
            type="text"
            name="legal_name"
            required
            autoComplete="organization"
            defaultValue={initial?.legal_name ?? ""}
            placeholder="Speetch"
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
          />
        </Field>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Forme juridique" hint="ex. SAS, SARL, EI, micro">
            <input
              type="text"
              name="legal_form"
              defaultValue={initial?.legal_form ?? ""}
              placeholder="Micro-entreprise"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>

          <Field label="SIREN" hint="9 chiffres">
            <input
              type="text"
              name="siren"
              defaultValue={initial?.siren ?? ""}
              placeholder="123 456 789"
              inputMode="numeric"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="SIRET" hint="14 chiffres — optionnel">
            <input
              type="text"
              name="siret"
              defaultValue={initial?.siret ?? ""}
              placeholder="123 456 789 00012"
              inputMode="numeric"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>

          <Field label="N° TVA intracom." hint="FR + 11 chiffres — si assujetti">
            <input
              type="text"
              name="vat_number"
              defaultValue={initial?.vat_number ?? ""}
              placeholder="FR12345678901"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
      </Section>

      {/* TVA */}
      <Section title="Régime TVA" hint="impacte le calcul + la mention en pied">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="vat_exempt"
            checked={vatExempt}
            onChange={(e) => setVatExempt(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-cyan-300"
          />
          <span className="text-sm text-[#F5F5F7]">
            Franchise en base de TVA (TVA non applicable)
          </span>
        </label>

        {vatExempt && (
          <Field label="Mention pied de pièce">
            <input
              type="text"
              name="vat_exempt_mention"
              defaultValue={
                initial?.vat_exempt_mention ??
                "TVA non applicable, art. 293 B du CGI"
              }
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        )}
      </Section>

      {/* Adresse */}
      <Section title="Adresse de l'entreprise">
        <Field label="Adresse — ligne 1">
          <input
            type="text"
            name="address_line1"
            required
            autoComplete="address-line1"
            defaultValue={initial?.address_line1 ?? ""}
            placeholder="42 rue de la République"
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>

        <Field label="Adresse — ligne 2" hint="optionnel — bât., étage…">
          <input
            type="text"
            name="address_line2"
            autoComplete="address-line2"
            defaultValue={initial?.address_line2 ?? ""}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_2fr_1fr]">
          <Field label="Code postal">
            <input
              type="text"
              name="postal_code"
              required
              autoComplete="postal-code"
              defaultValue={initial?.postal_code ?? ""}
              placeholder="75011"
              inputMode="numeric"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Ville">
            <input
              type="text"
              name="city"
              required
              autoComplete="address-level2"
              defaultValue={initial?.city ?? "Paris"}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Pays">
            <input
              type="text"
              name="country"
              autoComplete="country-name"
              defaultValue={initial?.country ?? "France"}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
      </Section>

      {/* Banque */}
      <Section title="Coordonnées bancaires" hint="apparaît en pied de facture">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="IBAN">
            <input
              type="text"
              name="iban"
              defaultValue={initial?.iban ?? ""}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="BIC">
            <input
              type="text"
              name="bic"
              defaultValue={initial?.bic ?? ""}
              placeholder="BNPAFRPPXXX"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
        <Field label="Banque" hint="optionnel">
          <input
            type="text"
            name="bank_name"
            defaultValue={initial?.bank_name ?? ""}
            placeholder="Qonto"
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
      </Section>

      {/* Conditions */}
      <Section title="Conditions de paiement" hint="mentions légales obligatoires">
        <Field label="Délai par défaut">
          <input
            type="text"
            name="default_payment_terms"
            defaultValue={initial?.default_payment_terms ?? "30 jours fin de mois"}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Taux de pénalité de retard">
            <input
              type="text"
              name="late_payment_rate"
              defaultValue={initial?.late_payment_rate ?? "Taux BCE + 10 points"}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Indemnité forfaitaire recouvrement (€)">
            <input
              type="number"
              step="0.01"
              name="recovery_indemnity"
              defaultValue={initial?.recovery_indemnity ?? 40}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
        <Field label="Mentions légales complémentaires" hint="optionnel — apparaît en pied">
          <textarea
            name="legal_mentions"
            rows={3}
            defaultValue={initial?.legal_mentions ?? ""}
            placeholder="Pas d'escompte pour règlement anticipé. RCS Paris."
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-sm font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
      </Section>

      {/* Numérotation */}
      <Section title="Numérotation" hint="préfixes ; le numéro suivra YYYY-NNNN">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Field label="Devis">
            <input
              type="text"
              name="quote_prefix"
              defaultValue={initial?.quote_prefix ?? "DV"}
              maxLength={6}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Facture">
            <input
              type="text"
              name="invoice_prefix"
              defaultValue={initial?.invoice_prefix ?? "FC"}
              maxLength={6}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Avoir">
            <input
              type="text"
              name="credit_note_prefix"
              defaultValue={initial?.credit_note_prefix ?? "AV"}
              maxLength={6}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
      </Section>

      {/* Facturation électronique */}
      <Section
        title="Facturation électronique"
        hint="à compléter quand tu auras choisi ton PDP"
      >
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.04] px-4 py-3 text-[11px] uppercase tracking-[0.28em] text-amber-200/85">
          Réforme française : réception obligatoire au 1ᵉʳ sept. 2026,
          émission rolling 2026-2027.
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="PDP — plateforme partenaire" hint="ex. Chorus Pro, Pennylane">
            <input
              type="text"
              name="pdp_provider"
              defaultValue={initial?.pdp_provider ?? ""}
              placeholder="Chorus Pro"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Identifiant PDP">
            <input
              type="text"
              name="pdp_id"
              defaultValue={initial?.pdp_id ?? ""}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-sm text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>
      </Section>

      <AnimatePresence>
        {state.status === "error" && state.error && (
          <motion.p
            key={state.error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
            style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
          >
            {state.error}
          </motion.p>
        )}
        {state.status === "success" && (
          <motion.p
            key="ok"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="border-l-2 border-cyan-300/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-cyan-200/90"
            style={{ textShadow: "0 0 8px rgba(125, 211, 252, 0.45)" }}
          >
            Émetteur scellé.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-end border-t border-cyan-200/15 pt-6">
        <SubmitButton has={has} />
      </div>
    </motion.form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-cyan-200/15 pb-2">
        <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
          {title}
        </span>
        {hint && (
          <span className="font-serif text-[12px] italic text-white/45">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
