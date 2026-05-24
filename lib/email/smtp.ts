/**
 * Service SMTP — envoi d'email via nodemailer, avec les credentials
 * IMAP/SMTP stockés en BDD (email_accounts).
 *
 * Pour le MVP : envoi simple (text + html). Pas de PJ, pas de threading
 * RFC IMAP (In-Reply-To / References) pour les replies — à itérer.
 */

import "server-only";
import nodemailer from "nodemailer";
import type { EmailAccountWithSecret } from "./account";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Pour les replies — Message-ID auquel on répond. */
  inReplyTo?: string;
  references?: string;
  /** CC / BCC à passer si besoin. */
  cc?: string;
  bcc?: string;
};

export type SendEmailResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

export async function sendEmail(
  account: EmailAccountWithSecret,
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const transporter = nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    // secure=true → SSL direct (port 465). secure=false → plaintext puis
    // STARTTLS (port 587 Infomaniak). requireTLS force l'upgrade STARTTLS
    // côté plaintext pour ne jamais transmettre les credentials en clair.
    secure: account.smtp_secure,
    requireTLS: !account.smtp_secure,
    auth: { user: account.email, pass: account.password },
    // Recommandation Infomaniak : valider le certificat serveur (défaut
    // nodemailer mais on l'explicite pour la sécurité documentée).
    tls: { rejectUnauthorized: true },
    connectionTimeout: 30_000,
  });

  try {
    const info = await transporter.sendMail({
      from: account.display_name
        ? `"${account.display_name}" <${account.email}>`
        : account.email,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      text: input.text,
      html: input.html,
      inReplyTo: input.inReplyTo,
      references: input.references,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Échec de l'envoi (erreur inconnue).",
    };
  } finally {
    transporter.close();
  }
}
