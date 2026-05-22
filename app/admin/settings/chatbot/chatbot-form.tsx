"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Eyebrow } from "@/lib/ds";
import {
  updateChatbotPrompt,
  type UpdateChatbotPromptState,
} from "./actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: UpdateChatbotPromptState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors duration-300 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-50"
    >
      <span>{pending ? "Scellement…" : "Sceller la voix"}</span>
      <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
    </button>
  );
}

export function ChatbotPromptForm({
  ownerId,
  initialPrompt,
  defaultPrompt,
}: {
  ownerId: string | null;
  initialPrompt: string | null;
  defaultPrompt: string;
}) {
  const [state, formAction] = useActionState(
    updateChatbotPrompt,
    INITIAL_STATE,
  );
  /* Le textarea est pré-rempli :
     - avec le custom stocké en BDD si défini,
     - sinon avec le DEFAULT_PRODUCT_BRIEF pour que le Maître ait une base
       éditable visible immédiatement (plutôt qu'un champ vide). */
  const [value, setValue] = useState(initialPrompt ?? defaultPrompt);
  const [showDefault, setShowDefault] = useState(false);

  // Reset = remettre le default dans le textarea. Si on save sans modifier,
  // le résultat fonctionnel est identique au default (qu'il soit stocké
  // tel quel ou NULL, le chatbot voit le même prompt).
  function handleReset() {
    setValue(defaultPrompt);
  }

  // Tag « personnalisée » uniquement si le texte diffère du default. Sinon
  // c'est juste le default visible/éditable — pas encore custom.
  const isDefault =
    value.trim().length === 0 || value.trim() === defaultPrompt.trim();
  const hasCustom = !isDefault;
  const lengthHint = `${value.length} caractères`;

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="flex w-full max-w-4xl flex-col gap-8"
    >
      {!ownerId && (
        <p
          className="border-l-2 border-amber-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-amber-300/85"
          style={{ textShadow: "0 0 8px rgba(252, 211, 77, 0.35)" }}
        >
          Profil owner introuvable. Configure ton Identité Jedi d&apos;abord
          (/admin/settings/profile).
        </p>
      )}

      {/* État courant */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-200/15 pb-4">
        <Eyebrow tracking="md" className="text-cyan-200/65">
          État de la voix
        </Eyebrow>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.32em]">
          {hasCustom ? (
            <span className="text-cyan-100/85">
              <span className="sw-cyan-dot mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 align-middle" />
              Voix personnalisée
            </span>
          ) : (
            <span className="text-cyan-200/55">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-200/40 align-middle" />
              Default Conseil Jedi
            </span>
          )}
          <span className="text-cyan-200/30">·</span>
          <span className="font-mono text-[10px] text-cyan-200/45 normal-case tracking-normal">
            {lengthHint}
          </span>
        </div>
      </div>

      {/* Textarea principal */}
      <div className="flex flex-col gap-3">
        <label
          htmlFor="prompt"
          className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/55"
        >
          System instructions
        </label>
        <textarea
          id="prompt"
          name="prompt"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={22}
          placeholder="Le default Conseil Jedi (Maître Yoda) est ici. Modifie-le comme tu veux."
          autoComplete="off"
          spellCheck={false}
          className="w-full resize-y rounded-md border border-cyan-200/15 bg-cyan-200/[0.02] p-5 font-mono text-[13px] leading-relaxed text-[#F5F5F7]/92 caret-cyan-200 placeholder:text-white/30 focus:border-cyan-200/55 focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {hasCustom ? (
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-red-300/85"
            >
              ⌫ Réinitialiser au default
            </button>
          ) : (
            <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/35">
              Identique au default
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowDefault((s) => !s)}
            className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
          >
            {showDefault ? "Masquer le default brut" : "Voir le default brut ↓"}
          </button>
        </div>
      </div>

      {/* Default en référence — fold/unfold */}
      <AnimatePresence initial={false}>
        {showDefault && (
          <motion.div
            key="default-block"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 rounded-md border border-dashed border-cyan-200/20 bg-cyan-200/[0.02] p-5">
              <div className="flex items-center justify-between gap-3">
                <Eyebrow tracking="md" className="text-cyan-200/65">
                  Default Conseil Jedi (référence)
                </Eyebrow>
                <span className="font-mono text-[10px] text-cyan-200/45">
                  {defaultPrompt.length} caractères · read-only
                </span>
              </div>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-white/65">
                {defaultPrompt}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status messages */}
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
            Voix scellée. Le prochain message en bénéficiera.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Action bar */}
      <div className="flex items-center justify-between border-t border-cyan-200/15 pt-6">
        <Button href="/admin/settings" variant="ghost">
          ← Forge
        </Button>
        <SubmitButton />
      </div>
    </motion.form>
  );
}
