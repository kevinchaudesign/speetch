"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Button, Eyebrow, Field } from "@/lib/ds";
import type { PadawanStatus } from "@/lib/crm";
import {
  TRANSMISSION_MAX_RECIPIENTS,
} from "@/lib/crm-transmissions";
import {
  sendTransmission,
  type SendTransmissionState,
} from "../actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: SendTransmissionState = { status: "idle" };

type PadawanPick = {
  id: string;
  full_name: string;
  company: string | null;
  email: string | null;
  status: string;
  statusLabel: string;
};

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      pending={pending}
      pendingLabel="Émission en cours…"
      variant="primary"
      disabled={count === 0}
    >
      Émettre · {count} destinataire{count > 1 ? "s" : ""}
    </Button>
  );
}

export function NewTransmissionForm({
  padawans,
  statusValues,
  statusLabels,
  senderEmail,
  senderName,
  defaultReplyTo,
}: {
  padawans: PadawanPick[];
  statusValues: PadawanStatus[];
  statusLabels: Record<PadawanStatus, string>;
  senderEmail: string;
  senderName: string;
  defaultReplyTo: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(sendTransmission, INITIAL_STATE);

  // Filtre par statut padawan (multi-select). Tous activés par défaut
  // sauf 'lost' et 'won' (cas habituel : on parle aux leads chauds).
  const [statusFilter, setStatusFilter] = useState<Set<PadawanStatus>>(() => {
    return new Set(statusValues.filter((s) => s !== "lost" && s !== "won"));
  });

  // Padawans sélectionnés (sous-ensemble des emails valides).
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // À la réussite : on saute sur la fiche de la transmission envoyée.
  useEffect(() => {
    if (state.status === "success" && state.transmissionId) {
      router.push(`/admin/crm/transmissions/${state.transmissionId}`);
    }
  }, [state, router]);

  const contactable = useMemo(
    () =>
      padawans.filter((p) => {
        if (!p.email) return false;
        const s = p.status as PadawanStatus;
        return statusFilter.has(s);
      }),
    [padawans, statusFilter],
  );

  // Si le filtre change, on garde uniquement les sélections encore visibles.
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const p of contactable) if (prev.has(p.id)) next.add(p.id);
      return next;
    });
  }, [contactable]);

  function toggleStatus(s: PadawanStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      if (prev.size === contactable.length) return new Set();
      return new Set(contactable.map((p) => p.id));
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected =
    contactable.length > 0 && selectedIds.size === contactable.length;
  const overLimit = selectedIds.size > TRANSMISSION_MAX_RECIPIENTS;

  const padawansWithoutEmail = padawans.filter((p) => !p.email).length;

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="flex w-full max-w-3xl flex-col gap-10"
    >
      {/* Sender info — lecture seule, configurée via Forge → Émetteur Brevo */}
      <Field
        label="Émetteur"
        hint="défini dans Forge → Émetteur Brevo"
      >
        <span className="border-b border-cyan-200/15 bg-transparent pb-3 font-mono text-sm text-white/65">
          {senderName ? `${senderName} ` : ""}
          <span className="text-white/40">&lt;</span>
          {senderEmail || "—"}
          <span className="text-white/40">&gt;</span>
        </span>
      </Field>

      <Field
        label="Adresse de réponse"
        hint={
          defaultReplyTo
            ? `vide = défaut Brevo (${defaultReplyTo})`
            : "optionnel — Reply-To"
        }
      >
        <input
          type="email"
          name="reply_to"
          autoComplete="off"
          inputMode="email"
          spellCheck={false}
          placeholder={defaultReplyTo || senderEmail || "réponse@speetch.fr"}
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
        />
      </Field>

      <Field label="Sujet">
        <input
          type="text"
          name="subject"
          required
          autoComplete="off"
          placeholder="Speetch · Studio de DA, nouvelle saison"
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
        />
      </Field>

      <Field label="Corps du message" hint="texte brut · auto-converti en HTML">
        <textarea
          name="body_text"
          required
          rows={12}
          placeholder={"Bonjour {Nom},\n\nVoilà…\n\nÀ très vite,\nKevin"}
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
        />
      </Field>

      {/* Section destinataires */}
      <div className="flex flex-col gap-5 border-t border-cyan-200/15 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Eyebrow tracking="md" className="text-cyan-200/70">
              Destinataires
            </Eyebrow>
            <p className="font-serif text-sm italic text-white/55">
              {contactable.length === 0
                ? "Aucun padawan contactable avec ces filtres."
                : `${contactable.length} padawan${contactable.length > 1 ? "s" : ""} contactable${contactable.length > 1 ? "s" : ""} · ${selectedIds.size} sélectionné${selectedIds.size > 1 ? "s" : ""}.`}
            </p>
            {padawansWithoutEmail > 0 && (
              <p className="text-[10px] uppercase tracking-[0.28em] text-amber-200/70">
                {padawansWithoutEmail} padawan
                {padawansWithoutEmail > 1 ? "s" : ""} sans email — exclu
                {padawansWithoutEmail > 1 ? "s" : ""}.
              </p>
            )}
          </div>

          {contactable.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100"
            >
              {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          )}
        </div>

        {/* Filtre par statut */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-[10px] uppercase tracking-[0.28em] text-white/40">
            Filtrer
          </span>
          {statusValues.map((s) => {
            const active = statusFilter.has(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStatus(s)}
                aria-pressed={active}
                className={
                  "rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em] transition-colors " +
                  (active
                    ? "border-cyan-200/55 bg-cyan-200/[0.08] text-cyan-100"
                    : "border-white/15 bg-transparent text-white/40 hover:border-cyan-200/30 hover:text-cyan-200/80")
                }
              >
                {statusLabels[s]}
              </button>
            );
          })}
        </div>

        {/* Liste des destinataires (checkboxes) */}
        {contactable.length === 0 ? (
          <p className="border-l-2 border-amber-300/40 pl-4 font-serif text-sm italic text-amber-200/80">
            Aucun padawan ne matche ces filtres. Élargis la sélection ou
            repère de nouveaux padawans depuis la liste.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto rounded-md border border-cyan-200/15 bg-black/30">
            {contactable.map((p) => {
              const checked = selectedIds.has(p.id);
              return (
                <li
                  key={p.id}
                  className="border-b border-cyan-200/10 last:border-b-0"
                >
                  <label className="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-cyan-200/[0.04]">
                    <input
                      type="checkbox"
                      name="padawan_ids"
                      value={p.id}
                      checked={checked}
                      onChange={() => toggleOne(p.id)}
                      className="h-4 w-4 cursor-pointer accent-cyan-300"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm text-[#F5F5F7]">
                        {p.full_name}
                        {p.company && (
                          <span className="ml-2 text-white/40">
                            · {p.company}
                          </span>
                        )}
                      </span>
                      <span className="truncate font-mono text-[11px] text-cyan-200/70">
                        {p.email}
                      </span>
                    </div>
                    <span className="shrink-0 text-[9px] uppercase tracking-[0.28em] text-white/40">
                      {p.statusLabel}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {overLimit && (
          <p className="border-l-2 border-red-400/60 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85">
            Limite atteinte : {TRANSMISSION_MAX_RECIPIENTS} max par
            transmission.
          </p>
        )}
      </div>

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
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-cyan-200/15 pt-6">
        <Eyebrow tracking="md" className="text-cyan-200/55">
          Envoi via Brevo · 1 appel API / destinataire
        </Eyebrow>
        <SubmitButton count={selectedIds.size} />
      </div>
    </motion.form>
  );
}
