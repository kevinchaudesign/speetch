/**
 * Service IMAP — lecture de la boîte mail du Maître via imapflow.
 *
 * Usage type :
 *   const account = await loadOwnerEmailAccount();
 *   const messages = await fetchInboxMessages(account, { limit: 50 });
 *
 * Pour le MVP on charge les N derniers messages d'INBOX. À itérer :
 *   - dossiers (Sent, Trash, …)
 *   - search / filter
 *   - pagination
 *   - mark as read / unread
 *   - attachments
 */

import "server-only";
import { ImapFlow } from "imapflow";
import type { EmailAccountWithSecret } from "./account";

export type InboxMessage = {
  uid: number;
  /** Identifiant Message-ID RFC822 pour reply/thread. */
  messageId: string | null;
  from: { name: string | null; address: string };
  to: Array<{ name: string | null; address: string }>;
  subject: string;
  /** Aperçu texte (premiers ~200 chars). */
  preview: string;
  /** Corps texte brut (chargé à la demande seulement, null sinon). */
  body: string | null;
  /** Corps HTML si dispo (chargé à la demande). */
  html: string | null;
  /** Date d'envoi RFC822. */
  date: string;
  flags: {
    seen: boolean;
    answered: boolean;
    flagged: boolean;
  };
};

function clientFromAccount(account: EmailAccountWithSecret): ImapFlow {
  return new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: account.imap_secure,
    auth: { user: account.email, pass: account.password },
    logger: false,
    // Timeouts raisonnables pour ne pas pendre la requête
    socketTimeout: 30_000,
  });
}

function extractAddress(
  addr: { name?: string; address?: string } | undefined,
): { name: string | null; address: string } | null {
  if (!addr || !addr.address) return null;
  return { name: addr.name ?? null, address: addr.address };
}

function previewFromBody(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * Liste les N derniers messages d'INBOX (par défaut 50), triés du plus
 * récent au plus ancien. Inclut le preview texte mais pas le corps
 * complet (pour la perf — utiliser fetchMessageBody pour ça).
 */
export async function fetchInboxMessages(
  account: EmailAccountWithSecret,
  { limit = 50 }: { limit?: number } = {},
): Promise<InboxMessage[]> {
  const client = clientFromAccount(account);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      // Récupérer les UIDs des N derniers messages
      const mailbox = client.mailbox as { exists: number } | null;
      const total = mailbox?.exists ?? 0;
      if (total === 0) return [];
      const firstSeq = Math.max(1, total - limit + 1);
      const range = `${firstSeq}:${total}`;

      const messages: InboxMessage[] = [];
      for await (const msg of client.fetch(range, {
        uid: true,
        envelope: true,
        flags: true,
        bodyStructure: true,
        // On télécharge un preview texte (TEXT) — assez pour la liste
        bodyParts: ["1"],
      })) {
        const env = msg.envelope;
        if (!env) continue;
        const fromAddr =
          extractAddress(env.from?.[0]) ?? {
            name: null,
            address: "(inconnu)",
          };
        const toAddrs =
          env.to?.map(extractAddress).filter((a): a is NonNullable<typeof a> => a !== null) ?? [];

        // Preview : extraire le texte si dispo, sinon laisser vide
        let preview = "";
        const part1 = msg.bodyParts?.get("1");
        if (part1) {
          try {
            const decoded = part1.toString("utf-8");
            preview = previewFromBody(decoded);
          } catch {
            preview = "";
          }
        }

        messages.push({
          uid: msg.uid,
          messageId: env.messageId ?? null,
          from: fromAddr,
          to: toAddrs,
          subject: env.subject ?? "(sans objet)",
          preview,
          body: null,
          html: null,
          date: (env.date instanceof Date
            ? env.date.toISOString()
            : env.date) ?? new Date(0).toISOString(),
          flags: {
            seen: msg.flags?.has("\\Seen") ?? false,
            answered: msg.flags?.has("\\Answered") ?? false,
            flagged: msg.flags?.has("\\Flagged") ?? false,
          },
        });
      }
      // Plus récent d'abord
      messages.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      return messages;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

/**
 * Récupère le corps complet (text + html) d'un message par son UID.
 * Marque le message comme lu côté serveur.
 */
export async function fetchMessageBody(
  account: EmailAccountWithSecret,
  uid: number,
): Promise<{ text: string | null; html: string | null }> {
  const client = clientFromAccount(account);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const msg = await client.fetchOne(
        String(uid),
        { source: true },
        { uid: true },
      );
      if (!msg || !msg.source) return { text: null, html: null };

      // Parse le source RFC822 avec une lib légère (on garde imapflow
      // pour l'IMAP, mailparser pourrait venir plus tard). Pour le
      // MVP, on extrait grossièrement text/html depuis le source.
      const source = msg.source.toString("utf-8");
      const { text, html } = parseRFC822Body(source);

      // Marque comme lu
      await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });

      return { text, html };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

/**
 * Parser MIME minimaliste — extrait le premier text/plain et text/html
 * du source RFC822. Suffisant pour le MVP, à remplacer par mailparser
 * si on veut gérer les pièces jointes, le quoted-printable bien, etc.
 */
function parseRFC822Body(source: string): {
  text: string | null;
  html: string | null;
} {
  // Sépare headers et body sur la première ligne vide
  const sepIdx = source.indexOf("\r\n\r\n");
  if (sepIdx === -1) return { text: source, html: null };
  const headers = source.slice(0, sepIdx).toLowerCase();
  const body = source.slice(sepIdx + 4);

  // Cherche un boundary multipart
  const boundaryMatch = headers.match(/boundary="?([^";\r\n]+)"?/i);
  if (!boundaryMatch) {
    // Single-part : retourne comme texte
    return { text: body, html: null };
  }
  const boundary = boundaryMatch[1];
  const parts = body.split(`--${boundary}`);

  let text: string | null = null;
  let html: string | null = null;
  for (const part of parts) {
    const partLower = part.toLowerCase();
    if (partLower.includes("content-type: text/plain") && !text) {
      const partSep = part.indexOf("\r\n\r\n");
      if (partSep !== -1) text = part.slice(partSep + 4).trim();
    }
    if (partLower.includes("content-type: text/html") && !html) {
      const partSep = part.indexOf("\r\n\r\n");
      if (partSep !== -1) html = part.slice(partSep + 4).trim();
    }
  }
  return { text, html };
}
