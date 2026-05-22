"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPage, type CreatePageState } from "./actions";
import { Field } from "@/lib/ds";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: CreatePageState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors duration-300 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-50"
    >
      <span>{pending ? "Scellement…" : "Sceller le parchemin"}</span>
      <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
    </button>
  );
}

export function NewPageForm({
  clientId,
  projectId,
  projectName,
  initialTemplateId,
  templateLabel,
  templateTagline,
}: {
  clientId: string;
  projectId: string;
  projectName: string;
  initialTemplateId: string;
  templateLabel: string;
  templateTagline?: string;
}) {
  const [state, formAction] = useActionState(createPage, INITIAL_STATE);
  const template = { label: templateLabel, tagline: templateTagline };

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

      {/* Header — mobile only */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="flex items-center justify-between md:hidden"
      >
        <Link
          href={`/admin/clients/${clientId}/projects/${projectId}/pages/new`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors duration-300 hover:text-cyan-100"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-200" />
          Changer de blueprint
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Nouveau parchemin
        </span>
      </motion.header>

      <section className="mx-auto flex max-w-2xl flex-col items-start gap-12 pt-20">
        {/* Blueprint sélectionné — breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex w-full flex-wrap items-center justify-between gap-3"
        >
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55">
            <span className="text-cyan-200/45">Nouveau parchemin</span>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/90">
              {template?.label ?? "Blueprint inconnu"}
            </span>
          </p>

          <Link
            href={`/admin/clients/${clientId}/projects/${projectId}/pages/new`}
            className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
          >
            <span className="inline-block h-px w-3 bg-current transition-all duration-500 ease-out group-hover:w-6 group-hover:bg-cyan-200" />
            <span>Changer de blueprint</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="flex flex-col gap-3"
        >
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/65">
            Mission : {projectName}
          </p>
          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            {template?.label ?? "Nouveau parchemin"}
          </h1>
          {template?.tagline && (
            <p className="max-w-lg font-serif text-base italic text-white/55 md:text-lg">
              {template.tagline}
            </p>
          )}
        </motion.div>

        <motion.form
          action={formAction}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: EASE_OUT_EXPO }}
          className="flex w-full max-w-2xl flex-col gap-10"
        >
          <input type="hidden" name="profile_id" value={clientId} />
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="template_id" value={initialTemplateId} />

          <Field label="Titre du parchemin">
            <input
              type="text"
              name="name"
              required
              autoFocus
              autoComplete="off"
              placeholder="Brief direction artistique"
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
            />
          </Field>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_published"
              className="h-4 w-4 cursor-pointer accent-cyan-300"
            />
            <span className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
              Sceller ce parchemin immédiatement
            </span>
          </label>

          <AnimatePresence>
            {state.status === "error" && state.error && (
              <motion.p
                key={state.error}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                className="text-[11px] uppercase tracking-[0.32em] text-red-300/85"
                style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
              >
                {state.error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between border-t border-cyan-200/15 pt-6">
            <Link
              href={`/admin/clients/${clientId}/projects/${projectId}`}
              className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 hover:text-cyan-100"
            >
              Annuler
            </Link>
            <SubmitButton />
          </div>
        </motion.form>
      </section>
    </div>
  );
}
