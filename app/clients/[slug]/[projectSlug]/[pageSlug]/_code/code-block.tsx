"use client";

import { useState } from "react";
import { CODE_LANGUAGE_LABELS, isCodeLanguage } from "@/lib/code-highlight";

type Props = {
  /** HTML pré-rendu par shiki côté serveur (voir lib/code-highlight.ts). */
  html: string;
  /** Code brut, utilisé pour le bouton Copier. */
  code: string;
  /** Label affiché en haut à gauche. */
  language?: string;
  /** Variante de palette — "dark" (public/fwa) ou "light" (document). */
  variant?: "dark" | "light";
};

export function CodeBlock({ html, code, language, variant = "dark" }: Props) {
  const [expanded, setExpanded] = useState(false);
  const label = isCodeLanguage(language)
    ? CODE_LANGUAGE_LABELS[language]
    : "Texte brut";

  const lineCount = code ? code.split("\n").length : 0;

  const containerCls =
    variant === "dark"
      ? "border-white/10 bg-black/50"
      : "border-[rgba(110,4,16,0.18)] bg-[rgba(247,238,221,0.6)]";

  const headerCls =
    variant === "dark"
      ? "border-white/10 text-white/50"
      : "border-[rgba(110,4,16,0.18)] text-[rgba(110,4,16,0.65)]";

  return (
    <div className={`relative overflow-hidden rounded-md border ${containerCls}`}>
      <div
        className={`flex items-center justify-between gap-3 ${expanded ? "border-b" : ""} px-4 py-2 text-[10px] uppercase tracking-[0.32em] ${headerCls}`}
      >
        <div className="flex items-center gap-3">
          <span>{label}</span>
          {lineCount > 0 && (
            <span className="opacity-60">
              {lineCount} ligne{lineCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ToggleButton
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            variant={variant}
          />
          <CopyButton text={code} variant={variant} />
        </div>
      </div>
      {expanded && (
        <div
          className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed [&_pre]:m-0 [&_pre]:!bg-transparent [&_pre]:p-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

function ToggleButton({
  expanded,
  onToggle,
  variant,
}: {
  expanded: boolean;
  onToggle: () => void;
  variant: "dark" | "light";
}) {
  const cls =
    variant === "dark"
      ? "text-white/55 hover:text-cyan-100"
      : "text-[rgba(110,4,16,0.65)] hover:text-[rgba(110,4,16,1)]";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`text-[10px] uppercase tracking-[0.32em] transition-colors ${cls}`}
    >
      {expanded ? "Replier" : "Déplier"}
    </button>
  );
}

function CopyButton({ text, variant }: { text: string; variant: "dark" | "light" }) {
  const [copied, setCopied] = useState(false);
  const cls =
    variant === "dark"
      ? "text-white/55 hover:text-cyan-100"
      : "text-[rgba(110,4,16,0.65)] hover:text-[rgba(110,4,16,1)]";

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* navigator.clipboard peut échouer en http sans contexte sécurisé */
        }
      }}
      className={`text-[10px] uppercase tracking-[0.32em] transition-colors ${cls}`}
    >
      {copied ? "Copié" : "Copier"}
    </button>
  );
}
