/**
 * Client minimal pour l'API Brevo (ex-Sendinblue) — transactional emails.
 *
 * Endpoint : POST https://api.brevo.com/v3/smtp/email
 * Docs     : https://developers.brevo.com/reference/sendtransacemail
 *
 * Pas de SDK officiel pour rester léger et server-only. La clé API et le
 * sender par défaut sont stockés en BDD via crm_brevo_settings (cf.
 * lib/brevo-config.ts) et passés explicitement en argument — ce module
 * ne lit jamais de variables d'environnement.
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const BREVO_ACCOUNT_ENDPOINT = "https://api.brevo.com/v3/account";

export type BrevoSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export type BrevoSendArgs = {
  apiKey: string;
  sender: { email: string; name?: string | null };
  to: { email: string; name?: string | null };
  subject: string;
  htmlContent?: string;
  textContent?: string;
  replyTo?: { email: string; name?: string | null };
  /** Tags Brevo (analytics, filtres). */
  tags?: string[];
};

/**
 * Envoie un email transactionnel via Brevo. Renvoie le messageId sur
 * succès, ou un message d'erreur lisible.
 *
 * Timeout : 20 s (au-delà, on considère l'API en panne plutôt que
 * d'attendre indéfiniment).
 */
export async function sendBrevoTransactional(
  args: BrevoSendArgs,
): Promise<BrevoSendResult> {
  if (!args.apiKey) {
    return { ok: false, error: "Clé API Brevo manquante." };
  }
  if (!args.sender?.email) {
    return { ok: false, error: "Sender Brevo manquant." };
  }
  if (!args.htmlContent && !args.textContent) {
    return {
      ok: false,
      error: "Email vide : htmlContent ou textContent requis.",
    };
  }

  const payload: Record<string, unknown> = {
    sender: {
      email: args.sender.email,
      name: args.sender.name ?? undefined,
    },
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
        "api-key": args.apiKey,
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
 * Ping de validation : appelle GET /v3/account avec la clé fournie.
 * Plus léger qu'un envoi réel et confirme la validité de la clé.
 */
export type BrevoTestResult =
  | { ok: true; email: string; companyName: string | null }
  | { ok: false; error: string };

export async function pingBrevoAccount(
  apiKey: string,
): Promise<BrevoTestResult> {
  if (!apiKey) return { ok: false, error: "Clé API manquante." };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(BREVO_ACCOUNT_ENDPOINT, {
      method: "GET",
      headers: { accept: "application/json", "api-key": apiKey },
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => ({}))) as {
      email?: string;
      companyName?: string;
      message?: string;
    };
    if (!res.ok) {
      return { ok: false, error: json.message || `HTTP ${res.status}` };
    }
    return {
      ok: true,
      email: String(json.email ?? ""),
      companyName: json.companyName ?? null,
    };
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === "AbortError"
          ? "Brevo : délai dépassé."
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
