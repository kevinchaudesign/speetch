/**
 * Helpers BDD pour la config Brevo (singleton crm_brevo_settings).
 *
 * Toutes les transmissions CRM lisent leur clé API + sender ici. La clé
 * API est chiffrée AES-256-GCM avec SPEETCH_EMAIL_ENCRYPTION_KEY (même
 * clé que les comptes email — un seul secret à gérer).
 */

import { createAdminClient } from "@/lib/supabase/server";
import { decryptSecret, encryptSecret } from "@/lib/email/crypto";

export type BrevoSettings = {
  apiKey: string;
  senderEmail: string;
  senderName: string | null;
  replyTo: string | null;
};

export type BrevoSettingsMeta = {
  senderEmail: string | null;
  senderName: string | null;
  replyTo: string | null;
  hasApiKey: boolean;
  updatedAt: string | null;
};

type BrevoRow = {
  id: string;
  api_key_encrypted: string | null;
  sender_email: string | null;
  sender_name: string | null;
  reply_to: string | null;
  updated_at: string;
};

/**
 * Charge la config complète avec API key déchiffrée. Pour l'envoi.
 * Renvoie null si la config est incomplète (pas d'API key OU pas de
 * sender) ou si la clé de chiffrement n'est pas configurée.
 */
export async function loadBrevoSettings(): Promise<BrevoSettings | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_brevo_settings" as never)
    .select(
      "id, api_key_encrypted, sender_email, sender_name, reply_to, updated_at",
    )
    .eq("id", "singleton")
    .maybeSingle<BrevoRow>();

  if (!data || !data.api_key_encrypted || !data.sender_email) return null;

  let apiKey: string;
  try {
    apiKey = decryptSecret(data.api_key_encrypted);
  } catch (e) {
    console.error("[loadBrevoSettings] decrypt error:", e);
    return null;
  }

  return {
    apiKey,
    senderEmail: data.sender_email,
    senderName: data.sender_name,
    replyTo: data.reply_to,
  };
}

/**
 * Variante méta : ne déchiffre rien, sert à afficher l'état dans l'UI
 * (sans jamais exposer la clé API au bundle client).
 */
export async function loadBrevoSettingsMeta(): Promise<BrevoSettingsMeta | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_brevo_settings" as never)
    .select(
      "api_key_encrypted, sender_email, sender_name, reply_to, updated_at",
    )
    .eq("id", "singleton")
    .maybeSingle<{
      api_key_encrypted: string | null;
      sender_email: string | null;
      sender_name: string | null;
      reply_to: string | null;
      updated_at: string;
    }>();

  if (!data) return null;

  return {
    senderEmail: data.sender_email,
    senderName: data.sender_name,
    replyTo: data.reply_to,
    hasApiKey: !!data.api_key_encrypted,
    updatedAt: data.updated_at,
  };
}

export async function isBrevoSettingsConfigured(): Promise<boolean> {
  const meta = await loadBrevoSettingsMeta();
  return !!(meta && meta.hasApiKey && meta.senderEmail);
}

/**
 * Upsert de la config Brevo (singleton). Si `apiKey` est null/undefined,
 * on garde la valeur chiffrée existante. Pour effacer entièrement la
 * config, utiliser `clearBrevoSettings()`.
 */
export async function saveBrevoSettings(input: {
  senderEmail: string;
  senderName: string | null;
  replyTo: string | null;
  /** Si fourni, écrase la clé chiffrée. Sinon, conserve l'existante. */
  apiKey?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const patch: Record<string, unknown> = {
    id: "singleton",
    sender_email: input.senderEmail,
    sender_name: input.senderName,
    reply_to: input.replyTo,
  };

  if (input.apiKey && input.apiKey.length > 0) {
    try {
      patch.api_key_encrypted = encryptSecret(input.apiKey);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Erreur de chiffrement inconnue.";
      return { ok: false, error: msg };
    }
  }

  const { error } = await admin
    .from("crm_brevo_settings" as never)
    .upsert(patch as never, { onConflict: "id" });

  if (error) {
    console.error("[saveBrevoSettings] upsert error:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Vide totalement la config Brevo (suppression de la ligne singleton). */
export async function clearBrevoSettings(): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("crm_brevo_settings" as never)
    .delete()
    .eq("id", "singleton");
}
