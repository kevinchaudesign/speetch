"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { updateOwnerProfile, type UpdateOwnerState } from "./actions";
import { Field } from "@/lib/ds";
import { playR2Beep } from "@/lib/sw/audio";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: UpdateOwnerState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors duration-300 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-50"
    >
      <span>{pending ? "Scellement…" : "Sceller"}</span>
      <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
    </button>
  );
}

export function ProfileForm({
  initialFullName,
  initialAvatarUrl,
  ownerEmail,
}: {
  initialFullName: string;
  initialAvatarUrl: string;
  ownerEmail: string | null;
}) {
  const [state, formAction] = useActionState(
    updateOwnerProfile,
    INITIAL_STATE,
  );

  // Beep R2-D2 sur scellement réussi (no-op si audio off).
  useEffect(() => {
    if (state.status === "success") playR2Beep();
  }, [state.status]);

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="flex w-full max-w-2xl flex-col gap-10"
    >
      <Field label="Identifiant Conseil" hint="lecture seule">
        <span className="border-b border-cyan-200/15 bg-transparent pb-3 font-mono text-base text-white/55">
          {ownerEmail ?? "—"}
        </span>
      </Field>

      <Field label="Nom de Maître">
        <input
          type="text"
          name="full_name"
          required
          autoComplete="off"
          defaultValue={initialFullName}
          placeholder="Yoda"
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
        />
      </Field>

      <Field label="Sigil holographique" hint="optionnel — URL de l'avatar">
        <input
          type="url"
          name="avatar_url"
          autoComplete="off"
          defaultValue={initialAvatarUrl}
          placeholder="https://…"
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
        />
      </Field>

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
            Identité scellée.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-cyan-200/15 pt-6">
        <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/35">
          Code holocron géré via Supabase Auth
        </span>
        <SubmitButton />
      </div>
    </motion.form>
  );
}
