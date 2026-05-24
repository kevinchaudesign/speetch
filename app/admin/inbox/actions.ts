"use server";

/**
 * Server actions de l'inbox admin :
 *  - listInbox     : fetch les N derniers messages (server fetch IMAP)
 *  - openMessage   : fetch le corps complet d'un message + mark as read
 *  - sendInboxEmail: envoi via SMTP
 *  - replyToMessage: envoi d'une réponse avec threading In-Reply-To
 *
 * Toutes vérifient que le caller est le owner Speetch (cf. requireOwner).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { loadOwnerEmailAccount } from "@/lib/email/account";
import {
  discoverFolders,
  fetchInboxMessages,
  fetchMessageBody,
  type EmailFolder,
  type InboxMessage,
} from "@/lib/email/imap";
import { sendEmail } from "@/lib/email/smtp";

async function requireOwner(): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false, error: "Accès réservé au propriétaire." };
  }
  return { ok: true };
}

export type ListInboxResult =
  | { status: "ok"; messages: InboxMessage[] }
  | { status: "error"; error: string };

export async function listInbox(
  limit = 50,
  folder = "INBOX",
): Promise<ListInboxResult> {
  const auth = await requireOwner();
  if (!auth.ok) return { status: "error", error: auth.error };

  const account = await loadOwnerEmailAccount();
  if (!account)
    return {
      status: "error",
      error: "Aucun compte email configuré. Connectez-le dans la Forge.",
    };

  try {
    const messages = await fetchInboxMessages(account, { limit, folder });
    return { status: "ok", messages };
  } catch (err) {
    return {
      status: "error",
      error:
        err instanceof Error
          ? `Connexion IMAP impossible : ${err.message}`
          : "Connexion IMAP impossible.",
    };
  }
}

export type ListFoldersResult =
  | { status: "ok"; folders: EmailFolder[] }
  | { status: "error"; error: string };

export async function listFolders(): Promise<ListFoldersResult> {
  const auth = await requireOwner();
  if (!auth.ok) return { status: "error", error: auth.error };

  const account = await loadOwnerEmailAccount();
  if (!account)
    return { status: "error", error: "Aucun compte email configuré." };

  try {
    const folders = await discoverFolders(account);
    return { status: "ok", folders };
  } catch (err) {
    return {
      status: "error",
      error:
        err instanceof Error
          ? `Découverte impossible : ${err.message}`
          : "Découverte impossible.",
    };
  }
}

export type OpenMessageResult =
  | { status: "ok"; text: string | null; html: string | null }
  | { status: "error"; error: string };

export async function openMessage(
  uid: number,
  folder = "INBOX",
): Promise<OpenMessageResult> {
  const auth = await requireOwner();
  if (!auth.ok) return { status: "error", error: auth.error };

  const account = await loadOwnerEmailAccount();
  if (!account)
    return { status: "error", error: "Aucun compte email configuré." };

  try {
    const body = await fetchMessageBody(account, uid, folder);
    revalidatePath("/admin/inbox");
    return { status: "ok", ...body };
  } catch (err) {
    return {
      status: "error",
      error:
        err instanceof Error
          ? `Lecture impossible : ${err.message}`
          : "Lecture impossible.",
    };
  }
}

export type SendEmailState = {
  status: "idle" | "success" | "error";
  error?: string;
  messageId?: string;
};

export async function sendInboxEmail(
  _prev: SendEmailState,
  formData: FormData,
): Promise<SendEmailState> {
  const auth = await requireOwner();
  if (!auth.ok) return { status: "error", error: auth.error };

  const to = String(formData.get("to") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const inReplyTo =
    (formData.get("in_reply_to") as string | null)?.trim() || undefined;
  const references =
    (formData.get("references") as string | null)?.trim() || undefined;

  if (!to) return { status: "error", error: "Destinataire requis." };
  if (!subject) return { status: "error", error: "Objet requis." };
  if (!text) return { status: "error", error: "Message vide." };
  if (text.length > 50_000)
    return { status: "error", error: "Message trop long (>50000 chars)." };

  const account = await loadOwnerEmailAccount();
  if (!account)
    return { status: "error", error: "Aucun compte email configuré." };

  const res = await sendEmail(account, {
    to,
    subject,
    text,
    inReplyTo,
    references,
  });
  if (!res.ok)
    return {
      status: "error",
      error: res.error ?? "Échec de l'envoi.",
    };
  revalidatePath("/admin/inbox");
  return { status: "success", messageId: res.messageId };
}
