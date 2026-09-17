"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertDialog, Button, Field, Modal, ModalHeader } from "@/lib/ds";
import { renameProject } from "../actions";

/**
 * Renomme une mission depuis la liste des missions d'un client.
 *
 * Le nom affiché est mis à jour en optimiste pour que la liste réagisse
 * immédiatement ; en cas d'échec serveur on revient au nom précédent et on
 * affiche l'erreur.
 */
export function RenameProjectButton({
  profileId,
  projectId,
  projectName,
  className,
}: {
  profileId: string;
  projectId: string;
  projectName: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(projectName);
  const [error, setError] = useState<string | null>(null);

  // Le nom peut changer sous nos pieds (revalidation après un autre
  // renommage) : on resynchronise le champ tant que la modale est fermée.
  useEffect(() => {
    if (!open) setValue(projectName);
  }, [projectName, open]);

  const trimmed = value.trim();
  const unchanged = trimmed === projectName.trim();
  const tooShort = trimmed.length < 2;

  function submit() {
    if (pending || tooShort || unchanged) return;
    startTransition(async () => {
      const result = await renameProject({
        profileId,
        projectId,
        name: trimmed,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="primary"
        className={className}
      >
        Renommer
      </Button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        size="compact"
      >
        <ModalHeader
          title="Renommer la mission"
          subtitle={projectName}
          onClose={() => !pending && setOpen(false)}
        />

        <form
          className="flex flex-col gap-8 px-6 py-7 md:px-8"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Nom de la mission" hint="2 à 120 caractères">
            <input
              type="text"
              value={value}
              autoFocus
              maxLength={120}
              autoComplete="off"
              onChange={(e) => setValue(e.target.value)}
              className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
            />
          </Field>

          <p className="text-[11px] leading-relaxed text-white/35">
            L&apos;adresse publique de la mission ne change pas : les liens
            déjà transmis au client restent valides.
          </p>

          <div className="flex items-center justify-between border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="text-[11px] uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending || tooShort || unchanged}
              className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/80 transition-colors duration-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>{pending ? "Enregistrement…" : "Renommer"}</span>
              <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
            </button>
          </div>
        </form>
      </Modal>

      <AlertDialog
        open={error !== null}
        title="Renommage impossible"
        description={error}
        onClose={() => setError(null)}
      />
    </>
  );
}
