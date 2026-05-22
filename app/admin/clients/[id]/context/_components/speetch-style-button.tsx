"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertDialog } from "@/lib/ds";
import { cn } from "@/lib/utils";
import { setContextSpeetchStyle } from "../actions";

/**
 * Bouton réutilisable (liste + viewer) pour activer/désactiver l'overlay
 * CSS Codex Speetch sur un parchemin raw_html.
 *
 * Variante :
 *  - "chip" : pour les lignes de liste (petit, dans la chip strip)
 *  - "full" : pour la toolbar du viewer (texte explicite + état visible)
 */
export function SpeetchStyleButton({
  profileId,
  contextId,
  initialEnabled,
  variant = "chip",
}: {
  profileId: string;
  contextId: string;
  initialEnabled: boolean;
  variant?: "chip" | "full";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState<string | null>(null);

  function onToggle() {
    if (pending) return;
    const next = !enabled;
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      const result = await setContextSpeetchStyle({
        profileId,
        contextId,
        enabled: next,
      });
      if (!result.ok) {
        setError(result.error);
        setEnabled(!next);
        return;
      }
      router.refresh();
    });
  }

  if (variant === "chip") {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }}
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em] transition-colors",
            enabled
              ? "border-cyan-200/55 bg-cyan-200/[0.08] text-cyan-100"
              : "border-cyan-200/15 bg-cyan-200/[0.02] text-cyan-200/45 hover:border-cyan-200/40 hover:text-cyan-100/80",
            pending && "opacity-50",
          )}
          title="Active/désactive l'overlay Codex Speetch sur le parchemin"
        >
          <span
            className={cn(
              "block h-1.5 w-1.5 rounded-full",
              enabled ? "bg-cyan-300 sw-cyan-dot" : "bg-cyan-200/30",
            )}
          />
          <span>{enabled ? "Codex ON" : "Codex"}</span>
        </button>
        <AlertDialog
          open={error !== null}
          title="Action impossible"
          description={error}
          onClose={() => setError(null)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className={cn(
          "group inline-flex items-center gap-3 rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.32em] transition-colors",
          enabled
            ? "border-cyan-200/55 bg-cyan-200/[0.08] text-cyan-100"
            : "border-cyan-200/15 bg-cyan-200/[0.02] text-cyan-200/55 hover:border-cyan-200/40 hover:text-cyan-100",
          pending && "cursor-wait opacity-50",
        )}
      >
        <span
          className={cn(
            "block h-2 w-2 rounded-full transition-colors",
            enabled ? "bg-cyan-300 sw-cyan-dot" : "bg-cyan-200/30",
          )}
        />
        <span>
          {pending ? "…" : enabled ? "Codex Speetch · ON" : "Codex Speetch"}
        </span>
      </button>
      <AlertDialog
        open={error !== null}
        title="Action impossible"
        description={error}
        onClose={() => setError(null)}
      />
    </>
  );
}
