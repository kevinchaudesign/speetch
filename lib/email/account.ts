/**
 * Helpers pour lire/écrire les comptes email dans la table
 * `email_accounts`. Fait le pont entre la BDD chiffrée et les modules
 * IMAP/SMTP qui ont besoin du password en clair.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { decryptSecret } from "./crypto";

export type EmailAccountRow = {
  id: string;
  profile_id: string;
  email: string;
  display_name: string | null;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  password_encrypted: string;
  created_at: string;
  updated_at: string;
};

/** Compte avec password déchiffré, prêt pour IMAP/SMTP. */
export type EmailAccountWithSecret = Omit<
  EmailAccountRow,
  "password_encrypted"
> & {
  password: string;
};

/**
 * Charge le premier compte email du owner (pour le MVP, on ne gère
 * qu'un seul compte). Retourne null si aucun compte configuré.
 */
export async function loadOwnerEmailAccount(): Promise<EmailAccountWithSecret | null> {
  const admin = createAdminClient();

  const { data: owner } = await admin
    .from("profiles")
    .select("id")
    .eq("is_owner", true)
    .maybeSingle();
  if (!owner) return null;

  const { data: account } = await admin
    .from("email_accounts" as never)
    .select("*")
    .eq("profile_id", owner.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<EmailAccountRow>();

  if (!account) return null;

  try {
    const password = decryptSecret(account.password_encrypted);
    return {
      ...account,
      password,
      // Cast inutile mais explicite : on n'expose pas password_encrypted
      password_encrypted: undefined as unknown as never,
    } as unknown as EmailAccountWithSecret;
  } catch {
    return null;
  }
}

/**
 * Variante sans password (pour l'affichage UI : on ne déchiffre rien,
 * on retourne juste les méta-données du compte).
 */
export async function loadOwnerEmailAccountMeta(): Promise<
  Omit<EmailAccountRow, "password_encrypted"> | null
> {
  const admin = createAdminClient();

  const { data: owner } = await admin
    .from("profiles")
    .select("id")
    .eq("is_owner", true)
    .maybeSingle();
  if (!owner) return null;

  const { data: account } = await admin
    .from("email_accounts" as never)
    .select(
      "id, profile_id, email, display_name, imap_host, imap_port, imap_secure, smtp_host, smtp_port, smtp_secure, created_at, updated_at",
    )
    .eq("profile_id", owner.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<Omit<EmailAccountRow, "password_encrypted">>();

  return account ?? null;
}
