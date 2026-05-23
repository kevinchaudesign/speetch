"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/lib/ds";
import { deleteTransmission } from "../actions";

export function DeleteTransmissionButton({
  transmissionId,
  subject,
}: {
  transmissionId: string;
  subject: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startDelete] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] uppercase tracking-[0.32em] text-white/35 transition-colors hover:text-red-300"
      >
        Effacer la trace
      </button>
      <ConfirmDialog
        open={open}
        title="Effacer cette transmission ?"
        description={`« ${subject} » sera retirée de l'historique. Les emails déjà envoyés restent envoyés, mais la trace disparaît.`}
        confirmLabel="Effacer"
        tone="danger"
        cancelLabel="Annuler"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() =>
          startDelete(async () => {
            const fd = new FormData();
            fd.set("id", transmissionId);
            await deleteTransmission(fd);
          })
        }
      />
    </>
  );
}
