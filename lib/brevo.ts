/**
 * Client minimal pour l'API Brevo (ex-Sendinblue) — transactional emails.
 *
 * Endpoint : POST https://api.brevo.com/v3/smtp/email
 * Docs     : https://developers.brevo.com/reference/sendtransacemail
 *
 * On ne passe pas par le SDK officiel pour rester léger et server-only.
 * Les env vars BREVO_API_KEY / BREVO_SENDER_EMAIL / BREVO_SENDER_NAME sont
 * lues côté serveur uniquement (jamais exposées au bundle client).
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type BrevoSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export type BrevoSendArgs = {
  to: { email: string; name?: string | null };
  subject: string;
  htmlContent?: string;
  textContent?: string;
  /** Surcharge du sender par défaut (env). */
  sender?: { email: string; name?: string | null };
  replyTo?: { email: string; name?: string | null };
  /** Tags Brevo (analytics, filtres). */
  tags?: string[];
};

/** Vrai si BREVO_API_KEY + sender par défaut sont configurés. */
export function isBrevoConfigured(): boolean {
  return Boolean(
    process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL,
  );
}

export function getBrevoDefaultSender(): {
  email: string;
  name: string | null;
} | null {
  const email = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!email) return null;
  return {
    email,
    name: process.env.BREVO_SENDER_NAME?.trim() || null,
  };
}

/**
 * Envoie un email transactionnel via Brevo. Renvoie le messageId
 * sur succès, ou un message d'erreur lisible.
 *
 * Timeout : 20 s (au-delà, on considère l'API en panne plutôt que
 * d'attendre indéfiniment).
 */
export async function sendBrevoTransactional(
  args: BrevoSendArgs,
): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "BREVO_API_KEY manquant dans .env.local." };
  }
  const defaultSender = getBrevoDefaultSender();
  const sender = args.sender ?? defaultSender;
  if (!sender) {
    return {
      ok: false,
      error: "Sender Brevo non configuré (BREVO_SENDER_EMAIL).",
    };
  }
  if (!args.htmlContent && !args.textContent) {
    return {
      ok: false,
      error: "Email vide : htmlContent ou textContent requis.",
    };
  }

  const payload: Record<string, unknown> = {
    sender: { email: sender.email, name: sender.name ?? undefined },
    to: [{ email: args.to.email, name: args.to.name ?? undefined }],
    subject: args.subject,
  };
  if (args.htmlContent) payload.htmlContent = args.htmlContent;
  if (args.textContent) payload.textContent = args.textContent;
  if (args.replyTo) {
    payload.replyTo = {
      email: args.replyTo.email,
      name: args.replyTo.name ?? undefined,
    };
  }
  if (args.tags && args.tags.length > 0) payload.tags = args.tags;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const json = (await res.json().catch(() => ({}))) as {
      messageId?: string;
      message?: string;
      code?: string;
    };

    if (!res.ok) {
      const err = json.message || `HTTP ${res.status}`;
      return { ok: false, error: err };
    }

    return {
      ok: true,
      messageId: String(json.messageId ?? ""),
    };
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Brevo : délai dépassé (20s)."
          : e.message
        : "Erreur inconnue Brevo.";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convertit un texte brut en HTML basique pour le `htmlContent` Brevo.
 * Gère les sauts de ligne, échappe les caractères dangereux, autolinkize
 * les URLs http(s). Suffisant pour des emails plain text → HTML.
 */
export function textToBrevoHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (m) => `<a href="${m}" style="color:#0ea5e9">${m}</a>`,
  );
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;white-space:pre-wrap">${linked}</div>`;
}
