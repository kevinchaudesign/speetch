"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Button, Eyebrow, Field } from "@/lib/ds";
import {
  PADAWAN_SOURCE_LABEL,
  PADAWAN_SOURCE_VALUES,
  PADAWAN_STATUS_LABEL,
  PADAWAN_STATUS_VALUES,
} from "@/lib/crm";
import { createPadawan, type CrmActionState } from "../actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: CrmActionState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      pending={pending}
      pendingLabel="Scellement…"
      variant="primary"
    >
      Sceller le padawan
    </Button>
  );
}

export function NewPadawanForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createPadawan, INITIAL_STATE);

  // À la création, on file directement sur la fiche détail du padawan
  // (cohérent avec le workflow Holocron : on continue à éditer derrière).
  useEffect(() => {
    if (state.status === "success" && state.padawanId) {
      router.push(`/admin/crm/${state.padawanId}`);
    }
  }, [state, router]);

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
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

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="flex items-center justify-between md:hidden"
      >
        <Button href="/admin/crm" variant="return">
          Padawans
        </Button>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Repérage
        </span>
      </motion.header>

      <section className="mx-auto flex max-w-2xl flex-col items-start gap-12 pt-20 md:pt-28">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65"
        >
          Conseil Jedi
          <span className="mx-3 text-cyan-200/20">→</span>
          <span className="text-cyan-200/85">Repérer un padawan</span>
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          Repérer un{" "}
          <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
            padawan
          </span>
        </motion.h1>

        <AnimatePresence mode="wait">
          <motion.form
            key="form"
            action={formAction}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.45, ease: EASE_OUT_EXPO }}
            className="flex w-full max-w-2xl flex-col gap-10"
          >
            <Field label="Nom du padawan">
              <input
                type="text"
                name="full_name"
                required
                autoFocus
                autoComplete="off"
                placeholder="Léa Müller"
                className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
              />
            </Field>

            <Field label="Compagnie" hint="optionnel">
              <input
                type="text"
                name="company"
                autoComplete="off"
                placeholder="Atelier Müller"
                className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
              />
            </Field>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <Field label="E-mail" hint="optionnel">
                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  inputMode="email"
                  spellCheck={false}
                  placeholder="lea@mueller.fr"
                  className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
                />
              </Field>

              <Field label="Téléphone" hint="optionnel">
                <input
                  type="tel"
                  name="phone"
                  autoComplete="off"
                  inputMode="tel"
                  placeholder="+33 6 12 34 56 78"
                  className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <Field label="Origine" hint="comment t'es-tu croisé ?">
                <select
                  name="source"
                  defaultValue=""
                  className="cursor-pointer appearance-none border-b border-cyan-200/25 bg-transparent bg-[length:10px_10px] bg-[position:right_0.6rem_center] bg-no-repeat pb-3 pr-8 font-sans text-lg font-light text-[#F5F5F7] focus:border-cyan-200/80 focus:outline-none [background-image:linear-gradient(45deg,transparent_50%,rgba(125,211,252,0.6)_50%),linear-gradient(135deg,rgba(125,211,252,0.6)_50%,transparent_50%)] [background-position:right_1.1rem_center,right_0.65rem_center] [background-size:5px_5px,5px_5px]"
                >
                  <option value="" className="bg-black text-white/50">
                    — Aucune —
                  </option>
                  {PADAWAN_SOURCE_VALUES.map((s) => (
                    <option
                      key={s}
                      value={s}
                      className="bg-black text-white"
                    >
                      {PADAWAN_SOURCE_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Étape" hint="où en es-tu avec lui ?">
                <select
                  name="status"
                  defaultValue="detected"
                  className="cursor-pointer appearance-none border-b border-cyan-200/25 bg-transparent bg-[length:10px_10px] bg-[position:right_0.6rem_center] bg-no-repeat pb-3 pr-8 font-sans text-lg font-light text-[#F5F5F7] focus:border-cyan-200/80 focus:outline-none [background-image:linear-gradient(45deg,transparent_50%,rgba(125,211,252,0.6)_50%),linear-gradient(135deg,rgba(125,211,252,0.6)_50%,transparent_50%)] [background-position:right_1.1rem_center,right_0.65rem_center] [background-size:5px_5px,5px_5px]"
                >
                  {PADAWAN_STATUS_VALUES.map((s) => (
                    <option
                      key={s}
                      value={s}
                      className="bg-black text-white"
                    >
                      {PADAWAN_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Notes" hint="contexte, intentions, prochain pas">
              <textarea
                name="notes"
                rows={5}
                placeholder="Rencontré à l'expo… cherche une refonte de site… budget ≈ 8k…"
                className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
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
                Visible uniquement par le Conseil
              </Eyebrow>
              <SubmitButton />
            </div>
          </motion.form>
        </AnimatePresence>
      </section>

      <footer className="absolute inset-x-0 bottom-0 flex items-end justify-between px-6 py-6 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Temple Jedi · An 2026</span>
        <span className="text-cyan-200/55">Speetch — Conseil Jedi</span>
      </footer>
    </div>
  );
}
