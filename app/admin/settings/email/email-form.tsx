"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/lib/ds";
import {
  deleteEmailAccount,
  saveEmailAccount,
  testEmailConnection,
  type EmailSettingsState,
} from "./actions";

type AccountMeta = {
  email: string;
  display_name: string | null;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
};

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: EmailSettingsState = { status: "idle" };

function SubmitButton({ hasAccount }: { hasAccount: boolean }) {
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
          : hasAccount
            ? "Mettre à jour"
            : "Sceller le compte"}
      </span>
      <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
    </button>
  );
}

export function EmailSettingsForm({
  initialAccount,
  keyConfigured,
}: {
  initialAccount: AccountMeta | null;
  keyConfigured: boolean;
}) {
  const [state, formAction] = useActionState(saveEmailAccount, INITIAL_STATE);
  const [testState, setTestState] = useState<EmailSettingsState>({
    status: "idle",
  });
  const [testPending, startTest] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const hasAccount = !!initialAccount;

  function handleTest() {
    startTest(async () => {
      const res = await testEmailConnection();
      setTestState(res);
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "Supprimer la configuration de la boîte email ? Les emails ne seront plus accessibles depuis l'admin.",
      )
    )
      return;
    startDelete(async () => {
      await deleteEmailAccount();
    });
  }

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="flex w-full flex-col gap-8"
    >
      <fieldset disabled={!keyConfigured} className="flex flex-col gap-8 disabled:opacity-60">
        {/* Identité */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Email">
            <input
              type="email"
              name="email"
              required
              defaultValue={initialAccount?.email ?? "contact@speetch.com"}
              placeholder="contact@speetch.com"
              autoComplete="email"
              className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
          <Field label="Nom affiché">
            <input
              type="text"
              name="display_name"
              defaultValue={initialAccount?.display_name ?? "Speetch"}
              placeholder="Speetch"
              autoComplete="off"
              className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>
        </div>

        <Field
          label="Mot de passe IMAP/SMTP"
          hint={
            hasAccount
              ? "Laisse vide pour garder l'actuel"
              : "Mot de passe de la boîte chez Infomaniak"
          }
        >
          <input
            type="password"
            name="password"
            placeholder={hasAccount ? "••••••••" : "Mot de passe"}
            autoComplete="new-password"
            className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>

        {/* IMAP */}
        <div className="flex flex-col gap-4 rounded-md border border-cyan-200/15 bg-cyan-200/[0.02] p-5">
          <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/65">
            IMAP · Réception
          </span>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_120px_100px]">
            <Field label="Hôte">
              <input
                type="text"
                name="imap_host"
                required
                defaultValue={initialAccount?.imap_host ?? "mail.infomaniak.com"}
                className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
              />
            </Field>
            <Field label="Port">
              <input
                type="number"
                name="imap_port"
                required
                defaultValue={initialAccount?.imap_port ?? 993}
                min={1}
                max={65535}
                className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
              />
            </Field>
            <Field label="SSL">
              <label className="flex h-[28px] items-center gap-2">
                <input
                  type="checkbox"
                  name="imap_secure"
                  defaultChecked={initialAccount?.imap_secure ?? true}
                  className="h-4 w-4 cursor-pointer accent-cyan-300"
                />
                <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
                  Activé
                </span>
              </label>
            </Field>
          </div>
        </div>

        {/* SMTP */}
        <div className="flex flex-col gap-4 rounded-md border border-cyan-200/15 bg-cyan-200/[0.02] p-5">
          <span className="text-[10px] uppercase tracking-[0.4em] text-cyan-200/65">
            SMTP · Envoi
          </span>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_120px_100px]">
            <Field label="Hôte">
              <input
                type="text"
                name="smtp_host"
                required
                defaultValue={initialAccount?.smtp_host ?? "mail.infomaniak.com"}
                className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
              />
            </Field>
            <Field label="Port">
              <input
                type="number"
                name="smtp_port"
                required
                defaultValue={initialAccount?.smtp_port ?? 465}
                min={1}
                max={65535}
                className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 focus:border-cyan-200/80 focus:outline-none"
              />
            </Field>
            <Field label="SSL">
              <label className="flex h-[28px] items-center gap-2">
                <input
                  type="checkbox"
                  name="smtp_secure"
                  defaultChecked={initialAccount?.smtp_secure ?? true}
                  className="h-4 w-4 cursor-pointer accent-cyan-300"
                />
                <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">
                  Activé
                </span>
              </label>
            </Field>
          </div>
        </div>
      </fieldset>

      {/* Messages d'état */}
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
            Compte scellé. Tu peux tester la connexion.
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

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-cyan-200/15 pt-6">
        <div className="flex items-center gap-5">
          {hasAccount && (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={testPending}
                className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100 disabled:opacity-50"
              >
                {testPending ? "Test…" : "Tester la connexion"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletePending}
                className="text-[10px] uppercase tracking-[0.32em] text-white/35 transition-colors hover:text-red-300 disabled:opacity-50"
              >
                {deletePending ? "Suppression…" : "Effacer la configuration"}
              </button>
            </>
          )}
        </div>
        <SubmitButton hasAccount={hasAccount} />
      </div>
    </motion.form>
  );
}
