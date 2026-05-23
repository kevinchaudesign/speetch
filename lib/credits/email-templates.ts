/**
 * Templates email pour l'envoi des pièces (devis / facture) au client
 * par Brevo. Construit le sujet, le corps texte et le HTML brevo en
 * fonction de la pièce + lien public signé.
 */

import { formatEuro } from "./pricing";
import { textToBrevoHtml } from "@/lib/brevo";
import type { InvoiceRow, QuoteRow } from "./types";

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function senderName(legalName: string | null): string {
  return legalName?.trim() || "Speetch";
}

export type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

export function buildQuoteEmail(
  quote: QuoteRow,
  publicUrl: string,
  emitterLegalName: string | null,
): EmailContent {
  const subject = `Devis ${quote.number} — ${senderName(emitterLegalName)}`;
  const validity = quote.valid_until
    ? `\n\nCe devis est valable jusqu'au ${DATE.format(new Date(quote.valid_until))}.`
    : "";
  const text = `Bonjour ${quote.client_name},

Vous trouverez ci-joint le devis ${quote.number}, émis le ${DATE.format(new Date(quote.issued_at))}.

Montant total : ${formatEuro(Number(quote.total_ttc))}${quote.vat_exempt ? " (HT = TTC, franchise en base de TVA)" : " TTC"}.
${validity}

Pour consulter et télécharger le PDF :
${publicUrl}

Reste à votre disposition pour toute question.

Cordialement,
${senderName(emitterLegalName)}`;
  return { subject, text, html: textToBrevoHtml(text) };
}

export function buildInvoiceEmail(
  invoice: InvoiceRow,
  publicUrl: string,
  emitterLegalName: string | null,
  emitterIban: string | null,
): EmailContent {
  const subject = `Facture ${invoice.number} — ${senderName(emitterLegalName)}`;
  const dueLine = invoice.due_at
    ? `\nÉchéance : ${DATE.format(new Date(invoice.due_at))}.`
    : "";
  const ibanLine = emitterIban
    ? `\nRèglement par virement sur l'IBAN ${emitterIban}.`
    : "";
  const text = `Bonjour ${invoice.client_name},

Veuillez trouver ci-jointe la facture ${invoice.number}, émise le ${DATE.format(new Date(invoice.issued_at))}.

Montant total : ${formatEuro(Number(invoice.total_ttc))}${invoice.vat_exempt ? " (HT = TTC, franchise en base de TVA)" : " TTC"}.${dueLine}${ibanLine}

Pour consulter et télécharger le PDF :
${publicUrl}

Reste à votre disposition pour toute question.

Cordialement,
${senderName(emitterLegalName)}`;
  return { subject, text, html: textToBrevoHtml(text) };
}
