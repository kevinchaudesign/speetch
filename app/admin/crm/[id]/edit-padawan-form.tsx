"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { Button, ConfirmDialog, Eyebrow, Field } from "@/lib/ds";
import {
  PADAWAN_SOURCE_LABEL,
  PADAWAN_SOURCE_VALUES,
  PADAWAN_STATUS_LABEL,
  PADAWAN_STATUS_VALUES,
} from "@/lib/crm";
import {
  deletePadawan,
  updatePadawan,
  type CrmActionState,
} from "../actions";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const INITIAL_STATE: CrmActionState = { status: "idle" };

type PadawanInitial = {
  id: string;
  full_name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  notes: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      pending={pending}
      pendingLabel="Sauvegarde…"
      variant="primary"
    >
      Mettre à jour
    </Button>
  );
}

export function EditPadawanForm({ padawan }: { padawan: PadawanInitial }) {
  const [state, formAction] = useActionState(updatePadawan, INITIAL_STATE);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  // Reset visuel du message succès au bout de quelques secondes.
  const [flash, setFlash] = useState<"success" | null>(null);
  useEffect(() => {
    if (state.status === "success") {
      setFlash("success");
      const t = window.setTimeout(() => setFlash(null), 2400);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
      className="flex w-full max-w-2xl flex-col gap-10"
    >
      <input type="hidden" name="id" value={padawan.id} />

      <Field label="Nom du padawan">
        <input
          type="text"
          name="full_name"
          required
          autoComplete="off"
          defaultValue={padawan.full_name}
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-xl font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none md:text-2xl"
        />
      </Field>

      <Field label="Compagnie" hint="optionnel">
        <input
          type="text"
          name="company"
          autoComplete="off"
          defaultValue={padawan.company}
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-lg font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
        />
      </Field>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <Field label="E-mail" hint="optionnel">
          <input
            type="email"
            name="email"
            autoComplete="off"
            inputMode="email"
            spellCheck={false}
            defaultValue={padawan.email}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>

        <Field label="Téléphone" hint="optionnel">
          <input
            type="tel"
            name="phone"
            autoComplete="off"
            inputMode="tel"
            defaultValue={padawan.phone}
            className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <Field label="Origine">
          <select
            name="source"
            defaultValue={padawan.source}
            className="cursor-pointer appearance-none border-b border-cyan-200/25 bg-transparent bg-[length:10px_10px] bg-[position:right_0.6rem_center] bg-no-repeat pb-3 pr-8 font-sans text-lg font-light text-[#F5F5F7] focus:border-cyan-200/80 focus:outline-none [background-image:linear-gradient(45deg,transparent_50%,rgba(125,211,252,0.6)_50%),linear-gradient(135deg,rgba(125,211,252,0.6)_50%,transparent_50%)] [background-position:right_1.1rem_center,right_0.65rem_center] [background-size:5px_5px,5px_5px]"
          >
            <option value="" className="bg-black text-white/50">
              — Aucune —
            </option>
            {PADAWAN_SOURCE_VALUES.map((s) => (
              <option key={s} value={s} className="bg-black text-white">
                {PADAWAN_SOURCE_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Étape">
          <select
            name="status"
            defaultValue={padawan.status}
            className="cursor-pointer appearance-none border-b border-cyan-200/25 bg-transparent bg-[length:10px_10px] bg-[position:right_0.6rem_center] bg-no-repeat pb-3 pr-8 font-sans text-lg font-light text-[#F5F5F7] focus:border-cyan-200/80 focus:outline-none [background-image:linear-gradient(45deg,transparent_50%,rgba(125,211,252,0.6)_50%),linear-gradient(135deg,rgba(125,211,252,0.6)_50%,transparent_50%)] [background-position:right_1.1rem_center,right_0.65rem_center] [background-size:5px_5px,5px_5px]"
          >
            {PADAWAN_STATUS_VALUES.map((s) => (
              <option key={s} value={s} className="bg-black text-white">
                {PADAWAN_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          name="notes"
          rows={6}
          defaultValue={padawan.notes}
          className="border-b border-cyan-200/25 bg-transparent pb-3 font-sans text-base font-light text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
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
            className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
            style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
          >
            {state.error}
          </motion.p>
        )}
        {flash === "success" && (
          <motion.p
            key="ok"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="border-l-2 border-cyan-300/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-cyan-200/90"
            style={{ textShadow: "0 0 8px rgba(125, 211, 252, 0.45)" }}
          >
            Padawan mis à jour.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-cyan-200/15 pt-6">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="text-[11px] uppercase tracking-[0.32em] text-white/35 transition-colors hover:text-red-300"
        >
          Bannir du Conseil
        </button>
        <SubmitButton />
      </div>

      <Eyebrow tracking="md" className="text-cyan-200/40">
        Visible uniquement par le Conseil
      </Eyebrow>

      {/* ConfirmDialog : suppression définitive. La server action redirige
          vers /admin/crm, on l'enveloppe dans startTransition pour que
          React gère bien le pending state pendant la navigation. */}
      <ConfirmDialog
        open={confirmOpen}
        title="Bannir ce padawan ?"
        description={`${padawan.full_name} sera retiré du Conseil. Cette action est irréversible.`}
        confirmLabel="Bannir"
        tone="danger"
        cancelLabel="Annuler"
        pending={isDeleting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          startDelete(async () => {
            const fd = new FormData();
            fd.set("id", padawan.id);
            await deletePadawan(fd);
          })
        }
      />
    </motion.form>
  );
}
