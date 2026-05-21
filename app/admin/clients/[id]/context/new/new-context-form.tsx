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
      ? "Créer la note vide"
      : sourceKind === "markdown"
        ? "Importer le Markdown"
        : sourceKind === "docx"
          ? "Importer le document Word"
          : sourceKind === "pdf"
            ? "Importer le PDF"
            : sourceKind === "xlsx"
              ? "Importer le tableur"
              : mode === "raw"
                ? sourceKind === "url"
                  ? "Récupérer & enregistrer"
                  : "Enregistrer en l'état"
                : sourceKind === "url"
                  ? "Récupérer & analyser"
                  : "Analyser & enregistrer";
  const busy =
    sourceKind === "empty"
      ? "Création…"
      : sourceKind === "markdown" ||
          sourceKind === "docx" ||
          sourceKind === "pdf" ||
          sourceKind === "xlsx"
        ? "Conversion…"
        : mode === "raw"
          ? "Enregistrement…"
          : "Analyse en cours…";
  return (
    <button
      type="submit"
      disabled={pending}
      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/75 transition-colors duration-300 hover:text-white disabled:cursor-wait disabled:opacity-50"
    >
      <span>{pending ? busy : idle}</span>
      <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
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
    label: "Analyse Claude",
    tagline: "Texte structuré, lecture rapide",
    description:
      "Le HTML est analysé par Claude qui extrait le contenu en sections lisibles. Idéal pour des briefs, conversations, articles, recherches.",
  },
  {
    value: "raw",
    label: "Reproduction fidèle",
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
      <legend className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-white/45">
        <span>Mode de rendu</span>
      </legend>

      <input type="hidden" name="mode" value={mode} />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/[0.08] md:grid-cols-2">
        {MODE_OPTIONS.map((opt) => {
          const active = opt.value === mode;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`group relative flex h-full flex-col gap-3 bg-black p-6 text-left transition-colors duration-500 ease-out hover:bg-white/[0.03] md:p-7 ${
                active ? "ring-1 ring-inset ring-white/40" : ""
              }`}
            >
              <span
                className={`text-[10px] uppercase tracking-[0.4em] transition-colors duration-500 ${
                  active
                    ? "text-white/85"
                    : "text-white/30 group-hover:text-white/55"
                }`}
              >
                {active ? "Sélectionné" : "Cliquer pour choisir"}
              </span>
              <span
                className="font-sans font-extralight leading-[1] tracking-[-0.02em] text-[#F5F5F7]"
                style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)" }}
              >
                {opt.label}
              </span>
              <span className="font-serif text-sm italic text-white/55">
                {opt.tagline}
              </span>
              <span className="text-[11px] leading-relaxed text-white/45">
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
    label: "Fichier HTML",
    tagline: "Artifact Claude, page exportée…",
    description:
      "Upload un fichier .html depuis ton disque. Idéal pour les artifacts Claude téléchargés ou les pages sauvegardées.",
  },
  {
    value: "markdown",
    label: "Fichier Markdown",
    tagline: "Note .md, README, doc technique…",
    description:
      "Upload un fichier .md depuis ton disque. Conversion en HTML stylé Speetch — titres, listes, code, citations préservés.",
  },
  {
    value: "docx",
    label: "Document Word",
    tagline: ".docx, brief client, rapport…",
    description:
      "Upload un fichier .docx. Conversion en HTML stylé Speetch via Mammoth — titres, listes, gras/italique, tableaux, images préservés.",
  },
  {
    value: "pdf",
    label: "Document PDF",
    tagline: ".pdf, brief, contrat, étude…",
    description:
      "Upload un fichier .pdf. Extraction du texte page par page via pdf.js — idéal pour des briefs / études. Les PDF scannés (sans texte) ne fonctionnent pas.",
  },
  {
    value: "xlsx",
    label: "Tableur Excel",
    tagline: ".xlsx, planning, budget, copy deck…",
    description:
      "Upload un fichier .xlsx. Chaque feuille devient une section avec un tableau HTML stylé Speetch. Idéal pour copy decks, plannings, budgets.",
  },
  {
    value: "url",
    label: "URL distante",
    tagline: "Page web publique",
    description:
      "Colle une URL https://. Le HTML est fetché côté serveur puis analysé. Pratique pour des articles, briefs en ligne, etc.",
  },
  {
    value: "empty",
    label: "Note vide",
    tagline: "Repartir d'une page blanche",
    description:
      "Crée une note vierge avec juste un titre. Tu rempliras ensuite via l'éditeur HTML brut ou le mode édition texte.",
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
      <legend className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-white/45">
        <span>Source du contenu</span>
      </legend>

      <input type="hidden" name="source_kind" value={sourceKind} />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/[0.08] md:grid-cols-2">
        {SOURCE_OPTIONS.map((opt) => {
          const active = opt.value === sourceKind;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={`group relative flex h-full flex-col gap-3 bg-black p-6 text-left transition-colors duration-500 ease-out hover:bg-white/[0.03] md:p-7 ${
                active ? "ring-1 ring-inset ring-white/40" : ""
              }`}
            >
              <span
                className={`text-[10px] uppercase tracking-[0.4em] transition-colors duration-500 ${
                  active
                    ? "text-white/85"
                    : "text-white/30 group-hover:text-white/55"
                }`}
              >
                {active ? "Sélectionné" : "Cliquer pour choisir"}
              </span>
              <span
                className="font-sans font-extralight leading-[1] tracking-[-0.02em] text-[#F5F5F7]"
                style={{ fontSize: "clamp(1.25rem, 2vw, 1.75rem)" }}
              >
                {opt.label}
              </span>
              <span className="font-serif text-sm italic text-white/55">
                {opt.tagline}
              </span>
              <span className="text-[11px] leading-relaxed text-white/45">
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
    <div className="relative min-h-svh w-full px-6 py-10 md:px-16 md:py-14">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="flex items-center justify-between md:hidden"
      >
        <Link
          href={`/admin/clients/${profileId}/context`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors duration-300 hover:text-white"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-10" />
          Contexte
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          Nouvelle note
        </span>
      </motion.header>

      <section className="mx-auto flex max-w-2xl flex-col items-start gap-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="flex flex-col gap-3"
        >
          <p className="text-[11px] uppercase tracking-[0.32em] text-white/55">
            <Link
              href={`/admin/clients/${profileId}/context`}
              className="transition-colors hover:text-white"
            >
              Contexte
            </Link>
            <span className="mx-3 text-white/20">·</span>
            <Link
              href={`/admin/clients/${profileId}`}
              className="text-white/55 transition-colors hover:text-white"
            >
              {clientName}
            </Link>
          </p>
          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Nouvelle{" "}
            <span className="font-serif italic font-normal text-white/85">
              note
            </span>
          </h1>
          <p className="max-w-lg font-serif text-base italic text-white/45 md:text-lg">
            Upload un fichier HTML, Markdown, Word, PDF ou Excel, colle une
            URL — Claude analyse ou Speetch convertit en note stylée.
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
            <Field label="Fichier HTML" hint="max 2 MB">
              <input
                type="file"
                name="file"
                required
                accept=".html,.htm,text/html"
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-white/80 hover:file:bg-white/20"
              />
            </Field>
          )}

          {sourceKind === "markdown" && (
            <Field label="Fichier Markdown" hint="max 2 MB · .md, .markdown">
              <input
                type="file"
                name="file"
                required
                accept=".md,.markdown,.mdx,text/markdown,text/x-markdown"
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-white/80 hover:file:bg-white/20"
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
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-white/80 hover:file:bg-white/20"
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
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-white/80 hover:file:bg-white/20"
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
                className="block w-full text-sm text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.32em] file:text-white/80 hover:file:bg-white/20"
              />
            </Field>
          )}

          {sourceKind === "url" && (
            <Field label="URL de la page" hint="https://… uniquement">
              <input
                type="url"
                name="url"
                required
                autoComplete="off"
                placeholder="https://exemple.com/article"
                className="border-b border-white/20 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none"
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
                  : "optionnel — Claude propose si vide"
            }
          >
            <input
              type="text"
              name="title"
              required={sourceKind === "empty"}
              autoComplete="off"
              placeholder={
                sourceKind === "empty"
                  ? "Mon brief, mes notes pour ce client…"
                  : "Brief de marque — refonte…"
              }
              className="border-b border-white/20 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-[#F5F5F7] placeholder:text-white/25 focus:border-white/80 focus:outline-none md:text-2xl"
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
                className="border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80"
              >
                {state.error}
              </motion.p>
            )}
          </AnimatePresence>

          <p className="text-[10px] uppercase tracking-[0.32em] text-white/30">
            {sourceKind === "empty"
              ? "Une note vierge est créée. Tu pourras remplir le HTML depuis la note."
              : sourceKind === "markdown"
                ? "Le Markdown est converti en HTML stylé Speetch — aucun appel Claude. Quasi instantané."
                : sourceKind === "docx"
                  ? "Le document Word est converti en HTML stylé Speetch via Mammoth — aucun appel Claude. Images embarquées préservées."
                  : sourceKind === "pdf"
                    ? "Le PDF est lu page par page via pdf.js — texte extrait dans l'ordre de lecture, séparé en sections de page. Aucun appel Claude."
                    : sourceKind === "xlsx"
                      ? "Le tableur est converti via SheetJS — une section par feuille, tableaux HTML stylés Speetch. Aucun appel Claude."
                      : mode === "raw"
                        ? "Le HTML est stocké et rendu tel quel — aucun appel Claude. Quasi instantané."
                        : "L'analyse Claude prend en général 10-30 secondes. Reste sur la page pendant la conversion."}
          </p>

          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <Link
              href={`/admin/clients/${profileId}/context`}
              className="text-[11px] uppercase tracking-[0.32em] text-white/40 hover:text-white"
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
