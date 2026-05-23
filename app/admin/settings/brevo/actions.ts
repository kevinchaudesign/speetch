"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  clearBrevoSettings,
  loadBrevoSettings,
  saveBrevoSettings,
} from "@/lib/brevo-config";
import { pingBrevoAccount } from "@/lib/brevo";
import { isEncryptionKeyConfigured } from "@/lib/email/crypto";

export type BrevoSettingsState = {
  status: "idle" | "success" | "error";
  error?: string;
  testResult?: { ok: boolean; message: string };
};

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function requireOwner(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false, error: "Accès réservé au propriétaire." };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local — impossible d'écrire dans Supabase.",
    };
  }
  return { ok: true };
}

export async function saveBrevoSettingsAction(
  _prev: BrevoSettingsState,
  formData: FormData,
): Promise<BrevoSettingsState> {
  const guard = await requireOwner();
  if (!guard.ok) return { status: "error", error: guard.error };

  if (!isEncryptionKeyConfigured()) {
    return {
      status: "error",
      error:
        "SPEETCH_EMAIL_ENCRYPTION_KEY manquante dans .env.local — impossible de chiffrer la clé Brevo.",
    };
  }

  const apiKeyRaw = String(formData.get("api_key") ?? "").trim();
  const senderEmail = String(formData.get("sender_email") ?? "")
    .trim()
    .toLowerCase();
  const senderName = String(formData.get("sender_name") ?? "").trim();
  const replyToRaw = String(formData.get("reply_to") ?? "")
    .trim()
    .toLowerCase();

  if (!EMAIL_REGEX.test(senderEmail)) {
    return { status: "error", error: "E-mail d'émission invalide." };
  }
  if (replyToRaw && !EMAIL_REGEX.test(replyToRaw)) {
    return { status: "error", error: "Adresse de réponse invalide." };
  }

  const res = await saveBrevoSettings({
    senderEmail,
    senderName: senderName || null,
    replyTo: replyToRaw || null,
    apiKey: apiKeyRaw || undefined,
  });

  if (!res.ok) return { status: "error", error: res.error };

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/brevo");
  revalidatePath("/admin/crm/transmissions");
  revalidatePath("/admin/crm/transmissions/new");
  return { status: "success" };
}

/**
 * Teste la clé API courante via GET /v3/account. Ne fait pas d'envoi.
 * Si on vient juste de saisir une nouvelle clé non sauvegardée, on
 * peut la passer via formData.api_key pour la tester avant scellement.
 */
export async function testBrevoConnection(
  formData?: FormData,
): Promise<BrevoSettingsState> {
  const guard = await requireOwner();
  if (!guard.ok) return { status: "error", error: guard.error };

  let apiKey = String(formData?.get("api_key") ?? "").trim();
  if (!apiKey) {
    const stored = await loadBrevoSettings();
    apiKey = stored?.apiKey ?? "";
  }
  if (!apiKey) {
    return {
      status: "idle",
      testResult: {
        ok: false,
        message: "Aucune clé Brevo en BDD — saisis-en une d'abord.",
      },
    };
  }

  const r = await pingBrevoAccount(apiKey);
  if (r.ok) {
    return {
      status: "idle",
      testResult: {
        ok: true,
        message: `Connexion Brevo OK · compte ${r.email}${r.companyName ? ` (${r.companyName})` : ""}`,
      },
    };
  }
  return {
    status: "idle",
    testResult: { ok: false, message: `Erreur Brevo · ${r.error}` },
  };
}

export async function deleteBrevoSettingsAction(): Promise<void> {
  const guard = await requireOwner();
  if (!guard.ok) return;

  await clearBrevoSettings();

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/brevo");
  revalidatePath("/admin/crm/transmissions");
  revalidatePath("/admin/crm/transmissions/new");
}
