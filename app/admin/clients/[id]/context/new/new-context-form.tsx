"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/lib/ds";
import { createClientContext, type CreateContextState } from "../actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: CreateContextState = { status: "idle" };

type SourceKind =
  | "upload"
  | "markdown"
  | "docx"
  | "pdf"
  | "xlsx"
  | "url"
  | "empty";
type Mode = "analyze" | "raw";

function SubmitButton({
  sourceKind,
  mode,
}: {
  sourceKind: SourceKind;
  mode: Mode;
}) {
  const { pending } = useFormStatus();
  const idle =
    sourceKind === "empty"
      ? "Sceller un parchemin vierge"
      : sourceKind === "markdown"
        ? "Sceller le Markdown"
        : sourceKind === "docx"
          ? "Sceller le document Word"
          : sourceKind === "pdf"
            ? "Sceller le PDF"
            : sourceKind === "xlsx"
              ? "Sceller le tableur"
              : mode === "raw"
                ? sourceKind === "url"
                  ? "Récupérer & sceller"
                  : "Sceller en l'état"
                : sourceKind === "url"
                  ? "Récupérer & confier à la Force"
                  : "Confier à la Force";
  const busy =
    sourceKind === "empty"
      ? "Scellement…"
      : sourceKind === "markdown" ||
          sourceKind === "docx" ||
          sourceKind === "pdf" ||
          sourceKind === "xlsx"
        ? "Conversion…"
        : mode === "raw"
          ? "Scellement…"
          : "Transmission Force…";
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors duration-300 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-50"
    >
      <span>{pending ? busy : idle}</span>
      <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
    </button>
  );
}

const MODE_OPTIONS: Array<{
  value: Mode;
  label: string;
  tagline: string;
  description: string;
}> = [
  {
    value: "analyze",
    label: "Analyse Force",
    tagline: "Texte structuré, lecture rapide",
    description:
      "Le HTML est analysé par la Force qui extrait le contenu en sections lisibles. Idéal pour des briefs, conversations, articles, recherches.",
  },
  {
    value: "raw",
    label: "Réplique fidèle",
    tagline: "HTML brut, JS interactif préservé",
    description:
      "Le HTML est rendu tel quel dans un iframe sandbox. Garde 100% des styles + scripts interactifs (calculateurs, accordéons, widgets).",
  },
];

function ModeField({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (value: Mode) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-cyan-200/55">
        <span>Mode de rendu</span>
      </legend>

      <input type="hidden" name="mode" value={mode} />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-cyan-200/[0.1] md:grid-cols-2">
        {MODE_OPTIONS.map((opt) => {
          const active = opt.value === mode;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`group relative flex h-full flex-col gap-3 bg-black p-6 text-left transition-colors duration-500 ease-out hover:bg-cyan-200/[0.04] md:p-7 ${
                active ? "ring-1 ring-inset ring-cyan-200/55" : ""
              }`}
            >
              <span
                className={`text-[10px] uppercase tracking-[0.4em] transition-colors duration-500 ${
                  active
                    ? "text-cyan-200/85"
                    : "text-white/30 group-hover:text-cyan-200/65"
                }`}
              >
                {active ? "Sélectionné" : "Cliquer pour choisir"}
              </span>
              <span
                className={`font-sans font-extralight leading-[1] tracking-[-0.02em] text-[#F5F5F7] transition-colors duration-500 ${
                  active ? "sw-hologram-text" : "group-hover:text-cyan-100"
                }`}
                style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)" }}
              >
                {opt.label}
              </span>
              <span className="font-serif text-sm italic text-white/65">
                {opt.tagline}
              </span>
              <span className="text-[11px] leading-relaxed text-white/55">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const SOURCE_OPTIONS: Array<{
  value: SourceKind;
  label: string;
  tagline: string;
  description: string;
}> = [
  {
    value: "upload",
    label: "Parchemin HTML",
    tagline: "Artifact Force, page exportée…",
    description:
      "Confie un fichier .html depuis ton disque. Idéal pour les artifacts générés par la Force ou les pages sauvegardées.",
  },
  {
    value: "markdown",
    label: "Parchemin Markdown",
    tagline: "Note .md, README, doc technique…",
    description:
      "Confie un fichier .md depuis ton disque. Conversion en HTML stylé Codex Speetch — titres, listes, code, citations préservés.",
  },
  {
    value: "docx",
    label: "Document Word",
    tagline: ".docx, brief client, rapport…",
    description:
      "Confie un fichier .docx. Conversion en HTML stylé Codex Speetch via Mammoth — titres, listes, gras/italique, tableaux, images préservés.",
  },
  {
    value: "pdf",
    label: "Document PDF",
    tagline: ".pdf, brief, contrat, étude…",
    description:
      "Confie un fichier .pdf. Extraction du texte page par page via pdf.js — idéal pour des briefs / études. Les PDF scannés (sans texte) ne fonctionnent pas.",
  },
  {
    value: "xlsx",
    label: "Tableur Excel",
    tagline: ".xlsx, planning, budget, copy deck…",
    description:
      "Confie un fichier .xlsx. Chaque feuille devient une section avec un tableau HTML stylé Codex Speetch. Idéal pour copy decks, plannings, budgets.",
  },
  {
    value: "url",
    label: "Transmission URL",
    tagline: "Page web publique",
    description:
      "Colle une URL https://. Le HTML est fetché côté serveur puis analysé. Pratique pour des articles, briefs en ligne, etc.",
  },
  {
    value: "empty",
    label: "Parchemin vierge",
    tagline: "Repartir d'une page blanche",
    description:
      "Forge un parchemin vierge avec juste un titre. Tu rempliras ensuite via l'éditeur HTML brut ou le mode édition texte.",
  },
];

function SourceField({
  sourceKind,
  onChange,
}: {
  sourceKind: SourceKind;
  onChange: (value: SourceKind) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-cyan-200/55">
        <span>Source du contenu</span>
      </legend>

      <input type="hidden" name="source_kind" value={sourceKind} />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-cyan-200/[0.1] md:grid-cols-2">
        {SOURCE_OPTIONS.map((opt) => {
          const active = opt.value === sourceKind;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`group relative flex h-full flex-col gap-3 bg-black p-6 text-left transition-colors duration-500 ease-out hover:bg-cyan-200/[0.04] md:p-7 ${
                active ? "ring-1 ring-inset ring-cyan-200/55" : ""
              }`}
            >
              <span
                className={`text-[10px] uppercase tracking-[0.4em] transition-colors duration-500 ${
                  active
                    ? "text-cyan-200/85"
                    : "text-white/30 group-hover:text-cyan-200/65"
                }`}
              >
                {active ? "Sélectionné" : "Cliquer pour choisir"}
              </span>
              <span
                className={`font-sans font-extralight leading-[1] tracking-[-0.02em] text-[#F5F5F7] transition-colors duration-500 ${
                  active ? "sw-hologram-text" : "group-hover:text-cyan-100"
                }`}
                style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)" }}
              >
                {opt.label}
              </span>
              <span className="font-serif text-sm italic text-white/65">
                {opt.tagline}
              </span>
              <span className="text-[11px] leading-relaxed text-white/55">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function NewContextForm({
  profileId,
  clientName,
}: {
  profileId: string;
  clientName: string;
}) {
  const [state, formAction] = useActionState(
    createClientContext,
    INITIAL_STATE,
  );
  const [sourceKind, setSourceKind] = useState<SourceKind>("upload");
  const [mode, setMode] = useState<Mode>("analyze");

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

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="flex items-center justify-between md:hidden"
      >
        <Link
          href={`/admin/clients/${profileId}/context`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors duration-300 hover:text-cyan-100"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10 group-hover:bg-cyan-200" />
          Archives
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Nouveau parchemin
        </span>
      </motion.header>

      <section className="mx-auto flex max-w-2xl flex-col items-start gap-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="flex flex-col gap-3"
        >
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/65">
            <Link
              href={`/admin/clients/${profileId}/context`}
              className="transition-colors hover:text-cyan-100"
            >
              Archives
            </Link>
            <span className="mx-3 text-cyan-200/20">·</span>
            <Link
              href={`/admin/clients/${profileId}`}
              className="text-cyan-200/85 transition-colors hover:text-cyan-100"
            >
              {clientName}
            </Link>
          </p>
          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Nouveau{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              parchemin
            </span>
          </h1>
          <p className="max-w-lg font-serif text-base italic text-white/55 md:text-lg">
            Confie un fichier HTML, Markdown, Word, PDF ou Excel, ou colle une
            URL — la Force analyse ou Speetch convertit en parchemin stylé.
          </p>
        </motion.div>

        <motion.form
          action={formAction}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: EASE_OUT_EXPO }}
          className="flex w-full max-w-2xl flex-col gap-10"
          encType="multipart/form-data"
        >
          <input type="hidden" name="profile_id" value={profileId} />

          <SourceField sourceKind={sourceKind} onChange={setSourceKind} />

          {sourceKind !== "empty" &&
            sourceKind !== "markdown" &&
            sourceKind !== "docx" &&
            sourceKind !== "pdf" &&
            sourceKind !== "xlsx" && (
              <ModeField mode={mode} onChange={setMode} />
            )}

          {sourceKind === "upload" && (
            <Field label="Parchemin HTML" hint="max 2 MB">
              <input
                type="file"
                name="file"
                required
                accept=".html,.htm,text/html"
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-200/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-cyan-100/85 hover:file:bg-cyan-200/20"
              />
            </Field>
          )}

          {sourceKind === "markdown" && (
            <Field label="Parchemin Markdown" hint="max 2 MB · .md, .markdown">
              <input
                type="file"
                name="file"
                required
                accept=".md,.markdown,.mdx,text/markdown,text/x-markdown"
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-200/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-cyan-100/85 hover:file:bg-cyan-200/20"
              />
            </Field>
          )}

          {sourceKind === "docx" && (
            <Field
              label="Document Word"
              hint="max 8 MB · .docx (pas .doc legacy)"
            >
              <input
                type="file"
                name="file"
                required
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-200/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-cyan-100/85 hover:file:bg-cyan-200/20"
              />
            </Field>
          )}

          {sourceKind === "pdf" && (
            <Field label="Document PDF" hint="max 12 MB · .pdf avec du texte">
              <input
                type="file"
                name="file"
                required
                accept=".pdf,application/pdf"
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-200/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-cyan-100/85 hover:file:bg-cyan-200/20"
              />
            </Field>
          )}

          {sourceKind === "xlsx" && (
            <Field label="Tableur Excel" hint="max 10 MB · .xlsx, .xlsm">
              <input
                type="file"
                name="file"
                required
                accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroenabled.12"
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-200/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-cyan-100/85 hover:file:bg-cyan-200/20"
              />
            </Field>
          )}

          {sourceKind === "url" && (
            <Field label="URL de la transmission" hint="https://… uniquement">
              <input
                type="url"
                name="url"
                required
                autoComplete="off"
                placeholder="https://exemple.com/article"
                className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
              />
            </Field>
          )}

          <Field
            label="Titre"
            hint={
              sourceKind === "empty"
                ? "requis"
                : sourceKind === "markdown" ||
                    sourceKind === "docx" ||
                    sourceKind === "pdf" ||
                    sourceKind === "xlsx"
                  ? "optionnel — repris du document ou du nom de fichier si vide"
                  : "optionnel — la Force propose si vide"
            }
          >
            <input
              type="text"
              name="title"
              required={sourceKind === "empty"}
              autoComplete="off"
              placeholder={
                sourceKind === "empty"
                  ? "Mon brief, mes notes pour cet holocron…"
                  : "Brief de marque — refonte…"
              }
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
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
          </AnimatePresence>

          <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/40">
            {sourceKind === "empty"
              ? "Un parchemin vierge est forgé. Tu pourras remplir le HTML depuis le parchemin."
              : sourceKind === "markdown"
                ? "Le Markdown est converti en HTML stylé Codex Speetch — aucun appel à la Force. Quasi instantané."
                : sourceKind === "docx"
                  ? "Le document Word est converti via Mammoth — aucun appel à la Force. Images embarquées préservées."
                  : sourceKind === "pdf"
                    ? "Le PDF est lu page par page via pdf.js — texte extrait dans l'ordre de lecture, séparé en sections. Aucun appel à la Force."
                    : sourceKind === "xlsx"
                      ? "Le tableur est converti via SheetJS — une section par feuille, tableaux HTML stylés Codex Speetch. Aucun appel à la Force."
                      : mode === "raw"
                        ? "Le HTML est scellé et rendu tel quel — aucun appel à la Force. Quasi instantané."
                        : "La Force ouvre le parchemin en 10-30 secondes. Reste sur la page pendant la transmission."}
          </p>

          <div className="flex items-center justify-between border-t border-cyan-200/15 pt-6">
            <Link
              href={`/admin/clients/${profileId}/context`}
              className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55 hover:text-cyan-100"
            >
              Annuler
            </Link>
            <SubmitButton sourceKind={sourceKind} mode={mode} />
          </div>
        </motion.form>
      </section>
    </div>
  );
}
