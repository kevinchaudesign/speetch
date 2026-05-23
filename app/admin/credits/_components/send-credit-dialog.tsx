"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Modal, Eyebrow, Button, Field } from "@/lib/ds";
import {
  sendQuoteByEmail,
  type SendQuoteState,
} from "../devis/actions";
import {
  sendInvoiceByEmail,
  type SendInvoiceState,
} from "../factures/actions";

/**
 * Modal "Envoyer par email" — wrapper qui rend la variante adaptée
 * (devis ou facture). Les deux variantes ont la même UX mais sont des
 * composants distincts pour respecter les Rules of Hooks (useActionState
 * lié à une action spécifique).
 */

type Common = {
  pieceId: string;
  pieceNumber: string;
  clientName: string;
  defaultEmail: string;
  open: boolean;
  onClose: () => void;
};

export function SendCreditDialog(
  props: Common & { kind: "quote" | "invoice" },
) {
  if (props.kind === "quote") return <SendQuoteDialog {...props} />;
  return <SendInvoiceDialog {...props} />;
}

const INITIAL_QUOTE: SendQuoteState = { status: "idle" };
const INITIAL_INVOICE: SendInvoiceState = { status: "idle" };

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      pending={pending}
      pendingLabel="Émission…"
      variant="primary"
    >
      Transmettre
    </Button>
  );
}

function SendQuoteDialog({
  pieceId,
  pieceNumber,
  clientName,
  defaultEmail,
  open,
  onClose,
}: Common) {
  const [state, formAction] = useActionState(sendQuoteByEmail, INITIAL_QUOTE);
  return (
    <DialogShell
      label="le devis"
      formAction={formAction}
      state={state}
      pieceId={pieceId}
      pieceNumber={pieceNumber}
      clientName={clientName}
      defaultEmail={defaultEmail}
      open={open}
      onClose={onClose}
    />
  );
}

function SendInvoiceDialog({
  pieceId,
  pieceNumber,
  clientName,
  defaultEmail,
  open,
  onClose,
}: Common) {
  const [state, formAction] = useActionState(
    sendInvoiceByEmail,
    INITIAL_INVOICE,
  );
  return (
    <DialogShell
      label="la facture"
      formAction={formAction}
      state={state}
      pieceId={pieceId}
      pieceNumber={pieceNumber}
      clientName={clientName}
      defaultEmail={defaultEmail}
      open={open}
      onClose={onClose}
      withFacturX
    />
  );
}

function DialogShell({
  label,
  formAction,
  state,
  pieceId,
  pieceNumber,
  clientName,
  defaultEmail,
  open,
  onClose,
  withFacturX = false,
}: {
  label: string;
  formAction: (formData: FormData) => void;
  state: { status: "idle" | "success" | "error"; error?: string };
  pieceId: string;
  pieceNumber: string;
  clientName: string;
  defaultEmail: string;
  open: boolean;
  onClose: () => void;
  /** Affiche l'option "Joindre Factur-X XML" (factures uniquement). */
  withFacturX?: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [attachXml, setAttachXml] = useState(true);

  useEffect(() => {
    if (open) setEmail(defaultEmail);
  }, [open, defaultEmail]);

  useEffect(() => {
    if (state.status === "success") {
      const t = window.setTimeout(() => onClose(), 1400);
      return () => window.clearTimeout(t);
    }
  }, [state, onClose]);

  return (
    <Modal open={open} size="compact" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-5 px-6 py-7 md:px-8 md:py-8">
        <input type="hidden" name="id" value={pieceId} />

        <div className="flex flex-col gap-2">
          <Eyebrow tracking="md" intensity="strong">
            Transmission holographique
          </Eyebrow>
          <h2
            className="font-sans font-extralight leading-tight tracking-[-0.03em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)" }}
          >
            Envoyer {label}
          </h2>
          <p className="font-serif text-sm italic text-white/55">
            <span className="font-mono not-italic text-cyan-100">{pieceNumber}</span>
            {" · "}
            {clientName}
          </p>
        </div>

        <Field label="E-mail du destinataire">
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@client.fr"
            className="w-full border-b border-cyan-200/25 bg-transparent pb-2 font-mono text-sm text-[#F5F5F7] caret-cyan-200 placeholder:text-white/25 focus:border-cyan-200/80 focus:outline-none"
          />
        </Field>

        {withFacturX && (
          <label className="flex cursor-pointer items-start gap-3 border border-cyan-200/15 bg-cyan-200/[0.02] px-4 py-3">
            <input
              type="checkbox"
              name="attach_facturx"
              checked={attachXml}
              onChange={(e) => setAttachXml(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-cyan-300"
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm text-[#F5F5F7]">
                Joindre le Factur-X (XML)
              </span>
              <span className="font-serif text-[12px] italic text-white/55">
                XML CII profil BASIC, conforme EN 16931. Reçu en pièce
                jointe par le client + son éventuel PDP.
              </span>
            </div>
          </label>
        )}

        <Eyebrow tracking="md" className="text-cyan-200/55">
          Lien public signé · valable 90 jours · le destinataire pourra
          télécharger le PDF directement.
        </Eyebrow>

        {state.status === "error" && state.error && (
          <p
            className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.28em] text-red-300/85"
            style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
          >
            {state.error}
          </p>
        )}
        {state.status === "success" && (
          <p
            className="border-l-2 border-cyan-300/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-cyan-200/90"
            style={{ textShadow: "0 0 8px rgba(125, 211, 252, 0.45)" }}
          >
            Transmission émise ✓
          </p>
        )}

        <div className="mt-3 flex items-center justify-end gap-6 border-t border-cyan-200/15 pt-5">
          <Button variant="ghost" onClick={onClose} type="button">
            Annuler
          </Button>
          <SubmitBtn />
        </div>
      </form>
    </Modal>
  );
}
