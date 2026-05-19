"use client";

import { motion } from "framer-motion";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { signInWithPassword, type SignInState } from "./actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: SignInState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/70 transition-colors duration-300 hover:text-white disabled:cursor-wait disabled:opacity-50"
    >
      <span>{pending ? "Connexion…" : "Se connecter"}</span>
      <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
    </button>
  );
}

export function LoginForm({
  redirect,
  initialError,
}: {
  redirect: string;
  initialError?: string;
}) {
  const [state, formAction] = useActionState(
    signInWithPassword,
    INITIAL_STATE,
  );

  const showError = state.status === "error" || (!!initialError && state.status === "idle");
  const errorMessage =
    state.status === "error"
      ? state.message
      : initialError
        ? "Authentification impossible. Réessaie."
        : null;

  return (
    <div className="relative min-h-svh w-full">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 md:px-12"
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors duration-300 hover:text-white"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10" />
          Retour Speetch
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          Admin · Accès restreint
        </span>
      </motion.header>

      {/* Centre */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6 text-[11px] uppercase tracking-[0.4em] text-white/40"
        >
          Authentification
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="mb-12 select-none text-center font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7] md:mb-16"
          style={{ fontSize: "clamp(2.75rem, 9vw, 7rem)" }}
        >
          Accès{" "}
          <span className="font-serif italic font-normal text-white/85">
            privé
          </span>
        </motion.h1>

        <motion.form
          key="form"
          action={formAction}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: EASE_OUT_EXPO }}
          className="flex w-full max-w-md flex-col gap-8"
        >
          <input type="hidden" name="redirect" value={redirect} />

          <label className="flex flex-col gap-3">
            <span className="text-[11px] uppercase tracking-[0.32em] text-white/40">
              Adresse e-mail
            </span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              autoFocus
              inputMode="email"
              spellCheck={false}
              placeholder="nom@speetch.com"
              className="border-b border-white/20 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none focus:ring-0 md:text-2xl"
            />
          </label>

          <label className="flex flex-col gap-3">
            <span className="text-[11px] uppercase tracking-[0.32em] text-white/40">
              Mot de passe
            </span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="border-b border-white/20 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none focus:ring-0 md:text-2xl"
            />
          </label>

          {showError && errorMessage && (
            <motion.p
              key={errorMessage}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="text-[11px] uppercase tracking-[0.32em] text-red-300/80"
            >
              {errorMessage}
            </motion.p>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] uppercase tracking-[0.32em] text-white/30">
              Email + mot de passe
            </span>
            <SubmitButton />
          </div>
        </motion.form>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.8 }}
        className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-6 py-6 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12"
      >
        <span>Paris · 2026</span>
        <span>Speetch — Admin</span>
      </motion.footer>
    </div>
  );
}
