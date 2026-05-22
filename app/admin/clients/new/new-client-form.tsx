"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { PROJECT_TYPES } from "@/lib/project-types";
import { Button, Eyebrow, Field, StatusBadge } from "@/lib/ds";
import {
  createClientSpace,
  type CreateClientResult,
  type CreateClientState,
} from "./actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_CREATE_STATE: CreateClientState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      pending={pending}
      pendingLabel="Scellement…"
      variant="primary"
    >
      Sceller l&apos;holocron
    </Button>
  );
}

function CopyableLine({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* silencieux */
    }
  };

  return (
    <div className="group flex flex-col gap-3 border-b border-cyan-200/15 pb-5">
      <Eyebrow tracking="md" className="text-cyan-200/65">
        {label}
      </Eyebrow>
      <div className="flex items-center justify-between gap-4">
        <code className="break-all font-mono text-base text-[#F5F5F7] md:text-lg">
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          {copied ? "Copié" : "Copier"}
          <span
            className={`inline-block h-px transition-all duration-500 ease-out ${
              copied ? "w-10 bg-emerald-300" : "w-6 bg-current"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function SuccessPanel({
  result,
  onReset,
}: {
  result: CreateClientResult;
  onReset: () => void;
}) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      className="flex w-full max-w-2xl flex-col gap-10"
    >
      <StatusBadge tone="success">Holocron scellé</StatusBadge>

      <h2
        className="font-sans font-extralight leading-[0.9] tracking-[-0.04em] text-[#F5F5F7]"
        style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
      >
        {result.fullName}
      </h2>

      <div className="flex flex-col gap-6">
        <CopyableLine label="Lien holocron" value={result.url} />
        <CopyableLine label="Code holocron" value={result.password} />
      </div>

      <p className="max-w-lg text-balance text-sm text-amber-200/80">
        ⚠ Ce code holocron ne sera plus jamais affiché. Transmets-le au
        Padawan maintenant — il est hashé en base, impossible à récupérer.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-6 pt-4">
        <Button onClick={onReset} variant="return">
          Forger un autre holocron
        </Button>

        <div className="flex items-center gap-8">
          <Button
            href={result.url}
            target="_blank"
            rel="noopener"
            variant="ghost"
            className="text-cyan-200/65"
          >
            Ouvrir l&apos;holocron ↗
          </Button>
          <Button
            href="/admin"
            variant="ghost"
            className="text-cyan-200/65"
          >
            Retour Conseil
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function NewClientForm() {
  const [state, formAction] = useActionState(
    createClientSpace,
    INITIAL_CREATE_STATE,
  );
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field + scanlines + sabre — thème Conseil Jedi */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-50"
      />
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-16 left-2 top-24 hidden w-[2px] rounded-full md:block"
      />

      {/* Header — mobile only (sidebar prend le relai en desktop) */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="flex items-center justify-between md:hidden"
      >
        <Button href="/admin" variant="return">
          Conseil
        </Button>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Forge holocron
        </span>
      </motion.header>

      {/* Centre */}
      <section className="mx-auto flex max-w-2xl flex-col items-start gap-12 pt-20 md:pt-28">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65"
        >
          Forge holocron
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          Forger un{" "}
          <span className="sw-hologram-text font-serif italic font-normal">
            holocron
          </span>
        </motion.h1>

        <AnimatePresence mode="wait">
          {state.status === "success" && state.result ? (
            <SuccessPanel
              key={`success-${resetKey}`}
              result={state.result}
              onReset={() => {
                setResetKey((k) => k + 1);
                // useActionState ne propose pas de reset natif —
                // le simplest : reload léger sur la même URL.
                window.location.reload();
              }}
            />
          ) : (
            <motion.form
              key={`form-${resetKey}`}
              action={formAction}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.45, ease: EASE_OUT_EXPO }}
              className="flex w-full max-w-2xl flex-col gap-10"
            >
              <Field label="Nom de l'holocron">
                <input
                  type="text"
                  name="full_name"
                  required
                  autoFocus
                  autoComplete="off"
                  placeholder="Atelier Léa Müller"
                  className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
                />
              </Field>

              <Field label="Sous-titre" hint="optionnel">
                <input
                  type="text"
                  name="subtitle"
                  autoComplete="off"
                  placeholder="Direction artistique · 2026"
                  className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
                />
              </Field>

              <Field label="Type de mission" hint="optionnel">
                <select
                  name="project_type"
                  defaultValue=""
                  className="cursor-pointer appearance-none border-b border-cyan-200/25 bg-transparent bg-[length:10px_10px] bg-[position:right_0.6rem_center] bg-no-repeat pb-3 pr-8 font-sans text-lg font-light text-[#F5F5F7] focus:border-cyan-200/80 focus:outline-none [background-image:linear-gradient(45deg,transparent_50%,rgba(125,211,252,0.6)_50%),linear-gradient(135deg,rgba(125,211,252,0.6)_50%,transparent_50%)] [background-position:right_1.1rem_center,right_0.65rem_center] [background-size:5px_5px,5px_5px]"
                >
                  <option value="" className="bg-black text-white/50">
                    — Aucun —
                  </option>
                  {PROJECT_TYPES.map((t) => (
                    <option
                      key={t.value}
                      value={t.value}
                      className="bg-black text-white"
                    >
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Identifiant du Padawan" hint="optionnel — e-mail">
                <input
                  type="email"
                  name="client_email"
                  autoComplete="off"
                  inputMode="email"
                  spellCheck={false}
                  placeholder="nom@client.fr"
                  className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
                />
              </Field>

              <Field label="Code holocron" hint="vide = généré par la Force">
                <input
                  type="text"
                  name="password"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="voile-cuivre-aurore-482"
                  className="border-b border-cyan-200/25 bg-transparent pb-3 font-mono text-base text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-lg"
                />
              </Field>

              {state.status === "error" && state.error && (
                <motion.p
                  key={state.error}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                  className="text-[11px] uppercase tracking-[0.32em] text-red-300/85"
                  style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
                >
                  {state.error}
                </motion.p>
              )}

              <div className="flex items-center justify-between border-t border-cyan-200/15 pt-6">
                <Eyebrow tracking="md" className="text-cyan-200/55">
                  Holocron scellé immédiatement
                </Eyebrow>
                <SubmitButton />
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <footer className="absolute inset-x-0 bottom-0 flex items-end justify-between px-6 py-6 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Temple Jedi · An 2026</span>
        <span className="text-cyan-200/55">Speetch — Conseil Jedi</span>
      </footer>
    </div>
  );
}
