"use client";

import { useState, useTransition } from "react";
import { Button, Field } from "@/lib/ds";
import { cn } from "@/lib/utils";
import { updateClientPassword } from "../actions";

export function PasswordEditCard({ profileId }: { profileId: string }) {
  const [mode, setMode] = useState<"idle" | "editing" | "done">("idle");
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateClientPassword({
        profileId,
        customPassword: custom,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNewPassword(res.password);
      setMode("done");
      setCustom("");
    });
  };

  const copy = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const reset = () => {
    setMode("idle");
    setNewPassword(null);
    setError(null);
    setCopied(false);
  };

  return (
    <div className="flex flex-col gap-4 border border-cyan-200/15 bg-cyan-200/[0.015] px-6 py-6">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            Code holocron
          </h2>
          <p className="font-serif text-sm italic text-white/55">
            Le code holocron permettant au Padawan d&apos;accéder à son espace
            public.
          </p>
        </div>
        {mode === "idle" && (
          <Button
            onClick={() => setMode("editing")}
            variant="primary"
            className="text-cyan-200/65"
          >
            Régénérer
          </Button>
        )}
        {mode === "done" && (
          <Button
            onClick={reset}
            variant="primary"
            className="text-cyan-200/65"
          >
            Fermer
          </Button>
        )}
      </div>

      {mode === "editing" && (
        <div className="flex flex-col gap-3 border-t border-cyan-200/15 pt-5">
          <Field
            label="Nouveau code holocron"
            hint="vide = forgé par la Force"
          >
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="voile-cuivre-aurore-482"
              autoFocus
              disabled={pending}
              autoComplete="off"
              className="w-full border-0 border-b border-cyan-200/20 bg-transparent py-2 font-mono text-base text-[#F5F5F7] caret-cyan-200 outline-none transition-colors placeholder:text-white/25 focus:border-cyan-200/55 disabled:opacity-50"
            />
          </Field>
          {error && (
            <p
              className="border-l-2 border-red-400/50 pl-3 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
              style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
            >
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={submit} disabled={pending} variant="return">
              {pending ? "Scellement…" : "Sceller"}
            </Button>
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/40 transition-colors hover:text-cyan-100 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {mode === "done" && newPassword && (
        <div className="flex flex-col gap-3 border-t border-cyan-200/15 pt-5">
          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/90"
             style={{ textShadow: "0 0 8px rgba(125, 211, 252, 0.45)" }}>
            Code holocron scellé
          </p>
          <p className="font-serif text-sm italic text-white/65">
            Copie-le maintenant — il ne sera plus jamais ré-affiché.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <code className="break-all rounded border border-cyan-200/25 bg-black/40 px-4 py-3 font-mono text-base text-[#F5F5F7]">
              {newPassword}
            </code>
            <button
              type="button"
              onClick={copy}
              className={cn(
                "text-[11px] uppercase tracking-[0.32em] transition-colors",
                copied
                  ? "text-cyan-200/90"
                  : "text-cyan-200/65 hover:text-cyan-100",
              )}
            >
              {copied ? "✓ Copié" : "Copier"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
