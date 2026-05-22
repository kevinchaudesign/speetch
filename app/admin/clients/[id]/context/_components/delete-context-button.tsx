"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertDialog, Button, ConfirmDialog } from "@/lib/ds";
import { deleteClientContext } from "../actions";

export function DeleteContextButton({
  profileId,
  contextId,
  contextTitle,
  redirectTo,
  className,
}: {
  profileId: string;
  contextId: string;
  contextTitle: string;
  redirectTo: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteClientContext({ profileId, contextId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirmOpen(false);
      router.push(redirectTo);
      router.refresh();
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
        title={`Effacer « ${contextTitle} » ?`}
        description="Cette action efface définitivement le parchemin d'archive. Irréversible."
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
