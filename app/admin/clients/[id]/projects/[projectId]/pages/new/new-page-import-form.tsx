"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/lib/ds";
import { createPageFromImport, type CreatePageState } from "./actions";
import {
  useClientSegment,
  useProjectSegment,
} from "@/lib/admin/use-route-segment";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: CreatePageState = { status: "idle" };

type ImportSource = "docx" | "markdown" | "html";

const SOURCE_LABELS: Record<
  ImportSource,
  {
    hint: string;
    accept: string;
    maxLabel: string;
    badge: string;
    description: string;
  }
> = {
  docx: {
    hint: "Fichier Word .docx",
    accept:
      ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    maxLabel: "max 8 MB",
    badge: "Word",
    description:
      "Le document Word est converti en HTML stylé. Les titres, listes, gras, italiques et tableaux sont préservés. Les images embarquées sont inlinées en base64.",
  },
  markdown: {
    hint: "Fichier Markdown .md",
    accept: ".md,.markdown,.mdx,text/markdown,text/x-markdown",
    maxLabel: "max 2 MB",
    badge: "Markdown",
    description:
      "Le Markdown est converti en HTML stylé Speetch. Titres, listes, tableaux, blocs de code, citations et liens sont préservés. Idéal pour une note, un README ou un export de conversation Claude.",
  },
  html: {
    hint: "Fichier HTML d'artifact Claude",
    accept: ".html,.htm,text/html",
    maxLabel: "max 3 MB",
    badge: "Artifact",
    description:
      "Le HTML est stocké tel quel et rendu dans un iframe sandbox côté public. Idéal pour les artifacts Claude exportés (Code Interpreter, Document Builder…) ou les exports HTML de Word/Pages.",
  },
};

function SubmitButton({ source }: { source: ImportSource }) {
  const { pending } = useFormStatus();
  const converts = source === "docx" || source === "markdown";
  const label = converts ? "Convertir & sceller" : "Sceller le parchemin";
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors duration-300 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-50"
    >
      <span>
        {pending ? (converts ? "Conversion…" : "Scellement…") : label}
      </span>
      <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
    </button>
  );
}

export function NewPageImportForm({
  clientId,
  projectId,
  projectName,
  source,
  templateId = "business_plan",
  templateLabel = "Business plan",
  backHref,
}: {
  clientId: string;
  projectId: string;
  projectName: string;
  source: ImportSource;
  /** ID du blueprint utilisé pour le breadcrumb et les hrefs retour. */
  templateId?: string;
  /** Label affiché dans le breadcrumb (ex : "Business plan", "Étude de marché"). */
  templateLabel?: string;
  /**
   * Destination du lien "Changer de source". Par défaut l'écran d'options du
   * blueprint ; la tuile universelle "Parchemin Markdown" n'en a pas et
   * renvoie directement au picker de blueprints.
   */
  backHref?: string;
}) {
  const clientSlug = useClientSegment();
  const projectSlug = useProjectSegment();
  const [state, formAction] = useActionState(
    createPageFromImport,
    INITIAL_STATE,
  );
  const cfg = SOURCE_LABELS[source];
  const base = `/admin/clients/${clientSlug}/projects/${projectSlug}/pages/new`;
  const changeSourceHref = backHref ?? `${base}?template=${templateId}`;

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
        <Link
          href={changeSourceHref}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors duration-300 hover:text-cyan-100"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-200" />
          Changer de source
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          {templateLabel}
        </span>
      </motion.header>

      <section className="mx-auto flex max-w-2xl flex-col items-start gap-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex w-full flex-wrap items-center justify-between gap-3"
        >
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55">
            <span className="text-cyan-200/45">{templateLabel}</span>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/90">Import {cfg.badge}</span>
          </p>

          <Link
            href={changeSourceHref}
            className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
          >
            <span className="inline-block h-px w-3 bg-current transition-all duration-500 ease-out group-hover:w-6 group-hover:bg-cyan-200" />
            <span>Changer de source</span>
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
            Import{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif font-normal italic">
              {cfg.badge}
            </span>
          </h1>
          <p className="max-w-lg font-serif text-base italic text-white/55 md:text-lg">
            {cfg.description}
          </p>
        </motion.div>

        <motion.form
          action={formAction}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: EASE_OUT_EXPO }}
          className="flex w-full max-w-2xl flex-col gap-10"
          encType="multipart/form-data"
        >
          <input type="hidden" name="profile_id" value={clientId} />
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="source" value={source} />

          <Field label="Titre du parchemin">
            <input
              type="text"
              name="name"
              required
              autoFocus
              autoComplete="off"
              placeholder={`${templateLabel} — V1`}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
            />
          </Field>

          <Field label={cfg.hint} hint={cfg.maxLabel}>
            <input
              type="file"
              name="file"
              required
              accept={cfg.accept}
              className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-200/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-cyan-100/85 hover:file:bg-cyan-200/20"
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
                className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
                style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
              >
                {state.error}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/40">
            Le parchemin est stocké en mode «&nbsp;Réplique fidèle&nbsp;». Pour
            le mettre à jour plus tard, ré-importer un nouveau fichier créera un
            nouveau parchemin (l&apos;ancien reste accessible jusqu&apos;à
            effacement).
          </p>

          <div className="flex items-center justify-between border-t border-cyan-200/15 pt-6">
            <Link
              href={`/admin/clients/${clientSlug}/projects/${projectSlug}`}
              className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 hover:text-cyan-100"
            >
              Annuler
            </Link>
            <SubmitButton source={source} />
          </div>
        </motion.form>
      </section>
    </div>
  );
}
