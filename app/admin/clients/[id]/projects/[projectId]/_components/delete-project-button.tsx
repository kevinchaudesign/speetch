"use client";

import { useState, useTransition } from "react";
import { AlertDialog, Button, ConfirmDialog } from "@/lib/ds";
import { deleteProject } from "../actions";

export function DeleteProjectButton({
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteProject({ profileId, projectId });
      if (!result.ok) {
        setError(result.error);
      }
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <Button
        onClick={() => setConfirmOpen(true)}
        variant="danger"
        className={className}
      >
        Supprimer
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title={`Effacer la mission « ${projectName} » ?`}
        description="Cette action efface aussi tous les parchemins de la mission et leurs médias. Irréversible."
        confirmLabel="Effacer définitivement"
        cancelLabel="Annuler"
        pending={pending}
        onConfirm={onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
      <AlertDialog
        open={error !== null}
        title="Suppression impossible"
        description={error}
        onClose={() => setError(null)}
      />
    </>
  );
}
