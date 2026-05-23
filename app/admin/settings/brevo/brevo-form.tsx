"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/lib/ds";
import {
  deleteBrevoSettingsAction,
  saveBrevoSettingsAction,
  testBrevoConnection,
  type BrevoSettingsState,
} from "./actions";

type BrevoMeta = {
  senderEmail: string | null;
  senderName: string | null;
  replyTo: string | null;
  hasApiKey: boolean;
  updatedAt: string | null;
};

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: BrevoSettingsState = { status: "idle" };

function SubmitButton({ hasConfig }: { hasConfig: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors duration-300 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-50"
    >
      <span>
        {pending
          ? "Scellement…"
          : hasConfig
            ? "Mettre à jour"
            : "Sceller la config"}
      </span>
      <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
    </button>
  );
}

export function BrevoSettingsForm({
  initialSettings,
  keyConfigured,
}: {
  initialSettings: BrevoMeta | null;
  keyConfigured: boolean;
}) {
  const [state, formAction] = useActionState(
    saveBrevoSettingsAction,
    INITIAL_STATE,
  );
  const [testState, setTestState] = useState<BrevoSettingsState>({
    status: "idle",
  });
  const [testPending, startTest] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  const hasConfig =
    !!initialSettings && (initialSettings.hasApiKey || !!initialSettings.senderEmail);

  function handleTest() {
    startTest(async () => {
      // On test la clé saisie dans le form si elle existe, sinon celle
      // déjà en BDD.
      const fd = new FormData();
      const apiKeyInput = formRef.current?.querySelector<HTMLInputElement>(
        'input[name="api_key"]',
      );
      if (apiKeyInput?.value) fd.set("api_key", apiKeyInput.value);
      const res = await testBrevoConnection(fd);
      setTestState(res);
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "Effacer la config Brevo ? Les transmissions seront bloquées tant qu'aucune nouvelle clé ne sera saisie.",
      )
    )
      return;
    startDelete(async () => {
      await deleteBrevoSettingsAction();
    });
  }

  return (
    <motion.form
      ref={formRef}
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="flex w-full flex-col gap-8"
    >
      <fieldset
        disabled={!keyConfigured}
        className="flex flex-col gap-8 disabled:opacity-60"
      >
        <Field
          label="Clé API Brevo"
          hint={
            initialSettings?.hasApiKey
              ? "Laisse vide pour garder la clé actuelle"
              : "https://app.brevo.com/settings/keys/api"
          }
        >
          <input
            type="password"
            name="api_key"
            placeholder={
              initialSettings?.hasApiKey
                ? "•••••••• (clé en place)"
                : "xkeysib-…"
            }
            autoComplete="off"
            spellCheck={false}
            className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field
            label="E-mail d'émission"
            hint="adresse vérifiée dans Brevo"
          >
            <input
              type="email"
              name="sender_email"
              required
              defaultValue={initialSettings?.senderEmail ?? ""}
              placeholder="contact@speetch.fr"
              autoComplete="off"
              inputMode="email"
              spellCheck={false}
              className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>

          <Field label="Nom d'émission" hint="affiché comme expéditeur">
            <input
              type="text"
              name="sender_name"
              defaultValue={initialSettings?.senderName ?? ""}
              placeholder="Speetch"
              autoComplete="off"
              className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>

        <Field
          label="Adresse de réponse par défaut"
          hint="optionnel — Reply-To"
        >
          <input
            type="email"
            name="reply_to"
            defaultValue={initialSettings?.replyTo ?? ""}
            placeholder="kevin@speetch.fr"
            autoComplete="off"
            inputMode="email"
            spellCheck={false}
            className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
      </fieldset>

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
            key="save-ok"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="border-l-2 border-cyan-300/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-cyan-200/90"
            style={{ textShadow: "0 0 8px rgba(125, 211, 252, 0.45)" }}
          >
            Config scellée.
          </motion.p>
        )}
        {testState.testResult && (
          <motion.p
            key={`test-${testState.testResult.message}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className={
              testState.testResult.ok
                ? "border-l-2 border-cyan-300/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-cyan-200/90"
                : "border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.28em] text-red-300/85"
            }
            style={{
              textShadow: testState.testResult.ok
                ? "0 0 8px rgba(125, 211, 252, 0.45)"
                : "0 0 8px rgba(252, 165, 165, 0.35)",
            }}
          >
            {testState.testResult.message}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-cyan-200/15 pt-6">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={handleTest}
            disabled={testPending}
            className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100 disabled:opacity-50"
          >
            {testPending ? "Test…" : "Tester la connexion"}
          </button>
          {hasConfig && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              className="text-[10px] uppercase tracking-[0.32em] text-white/35 transition-colors hover:text-red-300 disabled:opacity-50"
            >
              {deletePending ? "Suppression…" : "Effacer la config"}
            </button>
          )}
        </div>
        <SubmitButton hasConfig={hasConfig} />
      </div>
    </motion.form>
  );
}
