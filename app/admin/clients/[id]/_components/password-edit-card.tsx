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
    <div className="flex flex-col gap-4 border border-white/10 bg-white/[0.02] px-6 py-6">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            Mot de passe
          </h2>
          <p className="font-serif text-sm italic text-white/45">
            Le mot de passe d&apos;accès à l&apos;espace public du client.
          </p>
        </div>
        {mode === "idle" && (
          <Button
            onClick={() => setMode("editing")}
            variant="primary"
            className="text-white/55"
          >
            Modifier
          </Button>
        )}
        {mode === "done" && (
          <Button
            onClick={reset}
            variant="primary"
            className="text-white/55"
          >
            Fermer
          </Button>
        )}
      </div>

      {mode === "editing" && (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
          <Field
            label="Nouveau mot de passe"
            hint="vide = généré automatiquement"
          >
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="voile-cuivre-aurore-482"
              autoFocus
              disabled={pending}
              autoComplete="off"
              className="w-full border-0 border-b border-white/15 bg-transparent py-2 font-mono text-base text-[#F5F5F7] outline-none transition-colors placeholder:text-white/25 focus:border-white/45 disabled:opacity-50"
            />
          </Field>
          {error && (
            <p className="border-l-2 border-red-400/40 pl-3 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={submit}
              disabled={pending}
              variant="return"
            >
              {pending ? "Mise à jour…" : "Valider"}
            </Button>
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {mode === "done" && newPassword && (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-5">
          <p className="text-[11px] uppercase tracking-[0.32em] text-emerald-300/80">
            Mot de passe mis à jour
          </p>
          <p className="font-serif text-sm italic text-white/55">
            Copie-le maintenant — il ne sera plus jamais ré-affiché.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <code className="break-all rounded border border-white/15 bg-black/40 px-4 py-3 font-mono text-base text-[#F5F5F7]">
              {newPassword}
            </code>
            <button
              type="button"
              onClick={copy}
              className={cn(
                "text-[11px] uppercase tracking-[0.32em] transition-colors",
                copied
                  ? "text-emerald-300/80"
                  : "text-white/55 hover:text-white",
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
