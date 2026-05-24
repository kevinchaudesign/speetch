"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { encryptSecret, isEncryptionKeyConfigured } from "@/lib/email/crypto";

export type EmailSettingsState = {
  status: "idle" | "success" | "error";
  error?: string;
  testResult?: { ok: boolean; message: string };
};

async function requireOwnerProfile(): Promise<
  | { ok: true; admin: ReturnType<typeof createAdminClient>; profileId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false, error: "Accès réservé au propriétaire." };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manquant." };
  }

  const admin = createAdminClient();
  const { data: owner } = await admin
    .from("profiles")
    .select("id")
    .eq("is_owner", true)
    .maybeSingle();
  if (!owner) return { ok: false, error: "Profil owner introuvable." };
  return { ok: true, admin, profileId: owner.id };
}

/**
 * Upsert le compte email du Maître. Le password n'est chiffré et sauvé
 * que s'il est fourni explicitement dans le form (champ vide = on garde
 * l'ancien).
 */
export async function saveEmailAccount(
  _prev: EmailSettingsState,
  formData: FormData,
): Promise<EmailSettingsState> {
  const auth = await requireOwnerProfile();
  if (!auth.ok) return { status: "error", error: auth.error };

  if (!isEncryptionKeyConfigured()) {
    return {
      status: "error",
      error:
        "SPEETCH_EMAIL_ENCRYPTION_KEY manquante. Génère-la avec `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"` et ajoute-la à .env.local.",
    };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const imapHost = String(formData.get("imap_host") ?? "").trim();
  const imapPort = Number(formData.get("imap_port") ?? 993);
  const imapSecure = formData.get("imap_secure") === "on";
  const smtpHost = String(formData.get("smtp_host") ?? "").trim();
  const smtpPort = Number(formData.get("smtp_port") ?? 587);
  // Radio "starttls" → secure=false (STARTTLS, port 587, recommandé
  // Infomaniak). Radio "ssl" → secure=true (SSL/TLS direct, port 465).
  // Tolérant à l'ancien checkbox ("on") pour la rétrocompat.
  const smtpSecureRaw = formData.get("smtp_secure");
  const smtpSecure = smtpSecureRaw === "ssl" || smtpSecureRaw === "on";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", error: "Email invalide." };
  }
  if (!imapHost || !smtpHost) {
    return { status: "error", error: "Hôtes IMAP/SMTP requis." };
  }
  if (!Number.isFinite(imapPort) || imapPort < 1 || imapPort > 65535) {
    return { status: "error", error: "Port IMAP invalide." };
  }
  if (!Number.isFinite(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    return { status: "error", error: "Port SMTP invalide." };
  }

  // Cherche un compte existant
  const { data: existing } = await auth.admin
    .from("email_accounts" as never)
    .select("id, password_encrypted")
    .eq("profile_id", auth.profileId)
    .maybeSingle<{ id: string; password_encrypted: string }>();

  // Si pas de password fourni, on garde l'ancien (édition partielle).
  let passwordEncrypted: string;
  if (password.length > 0) {
    try {
      passwordEncrypted = encryptSecret(password);
    } catch (err) {
      return {
        status: "error",
        error: err instanceof Error ? err.message : "Erreur de chiffrement.",
      };
    }
  } else if (existing) {
    passwordEncrypted = existing.password_encrypted;
  } else {
    return {
      status: "error",
      error: "Mot de passe requis pour la première configuration.",
    };
  }

  const row = {
    profile_id: auth.profileId,
    email,
    display_name: displayName || null,
    imap_host: imapHost,
    imap_port: imapPort,
    imap_secure: imapSecure,
    smtp_host: smtpHost,
    smtp_port: smtpPort,
    smtp_secure: smtpSecure,
    password_encrypted: passwordEncrypted,
  };

  if (existing) {
    const { error } = await auth.admin
      .from("email_accounts" as never)
      .update(row as never)
      .eq("id", existing.id);
    if (error) return { status: "error", error: error.message };
  } else {
    const { error } = await auth.admin
      .from("email_accounts" as never)
      .insert(row as never);
    if (error) return { status: "error", error: error.message };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/email");
  return { status: "success" };
}

export async function deleteEmailAccount(): Promise<EmailSettingsState> {
  const auth = await requireOwnerProfile();
  if (!auth.ok) return { status: "error", error: auth.error };

  const { error } = await auth.admin
    .from("email_accounts" as never)
    .delete()
    .eq("profile_id", auth.profileId);

  if (error) return { status: "error", error: error.message };
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/email");
  return { status: "success" };
}

/**
 * Test de la connexion IMAP + SMTP — tente une connexion réelle avec
 * les credentials sauvegardés. Pas d'envoi ni de modification de la
 * boîte : juste auth IMAP (LOGIN puis LOGOUT) et auth SMTP (verify()).
 */
export async function testEmailConnection(): Promise<EmailSettingsState> {
  const auth = await requireOwnerProfile();
  if (!auth.ok) return { status: "error", error: auth.error };

  const { loadOwnerEmailAccount } = await import("@/lib/email/account");
  const account = await loadOwnerEmailAccount();
  if (!account) {
    return {
      status: "error",
      testResult: {
        ok: false,
        message: "Aucun compte sauvegardé. Sceller d'abord la config.",
      },
    };
  }

  // 1. IMAP
  const { ImapFlow } = await import("imapflow");
  const imap = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: account.imap_secure,
    auth: { user: account.email, pass: account.password },
    logger: false,
    tls: { rejectUnauthorized: true },
    socketTimeout: 15_000,
  });
  try {
    await imap.connect();
    await imap.logout();
  } catch (err) {
    return {
      status: "error",
      testResult: {
        ok: false,
        message:
          "IMAP : " +
          (err instanceof Error ? err.message : "connexion impossible"),
      },
    };
  }

  // 2. SMTP
  const nodemailer = (await import("nodemailer")).default;
  const transport = nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.smtp_secure,
    requireTLS: !account.smtp_secure,
    auth: { user: account.email, pass: account.password },
    tls: { rejectUnauthorized: true },
    connectionTimeout: 15_000,
  });
  try {
    await transport.verify();
  } catch (err) {
    return {
      status: "error",
      testResult: {
        ok: false,
        message:
          "SMTP : " +
          (err instanceof Error ? err.message : "auth impossible"),
      },
    };
  } finally {
    transport.close();
  }

  return {
    status: "success",
    testResult: {
      ok: true,
      message: "IMAP + SMTP : connexion réussie.",
    },
  };
}
