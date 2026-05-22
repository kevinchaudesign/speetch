"use client";

import { useState, useTransition } from "react";
import { Button, ConfirmDialog } from "@/lib/ds";
import { deleteTemplate } from "./new/actions";

export function DeleteTemplateForm({
  templateId,
  usageCount,
}: {
  templateId: string;
  usageCount: number;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const description =
    usageCount > 0
      ? `${usageCount} parchemin${usageCount > 1 ? "s" : ""} ${usageCount > 1 ? "utilisent" : "utilise"} déjà ce blueprint. Ils garderont leur contenu mais perdront le lien vers le blueprint.`
      : "Action irréversible.";

  function onConfirm() {
    const formData = new FormData();
    formData.append("template_id", templateId);
    startTransition(async () => {
      await deleteTemplate(formData);
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <Button
        onClick={() => setConfirmOpen(true)}
        variant="danger"
        pending={pending}
        pendingLabel="Effacement…"
      >
        Supprimer
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title="Effacer ce blueprint ?"
        description={description}
        confirmLabel="Effacer le blueprint"
        cancelLabel="Annuler"
        pending={pending}
        onConfirm={onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
