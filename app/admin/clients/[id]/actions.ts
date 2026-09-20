"use server";
import { revalidateClientPath } from "@/lib/admin/routes";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { generateClientPassword, hashPassword } from "@/lib/crypto";

export type UpdatePasswordResult =
  | { ok: true; password: string }
  | { ok: false; error: string };

/**
 * Réinitialise le mot de passe d'un espace client.
 *
 * - `customPassword` vide → un mot de passe est généré (lisible).
 * - Sinon → on hash ce qu'on reçoit (validation longueur dans `hashPassword`).
 *
 * NB : les sessions existantes (cookies HMAC) ne sont pas invalidées par
 * ce changement — leur signature n'inclut pas le hash. Si on veut forcer
 * une reconnexion globale, il faudra ajouter un compteur de version au
 * payload signé.
 */
export async function updateClientPassword(input: {
  profileId: string;
  customPassword: string;
}): Promise<UpdatePasswordResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false, error: "Accès réservé au propriétaire." };
  }

  const profileId = String(input.profileId ?? "").trim();
  if (!profileId) {
    return { ok: false, error: "Client invalide." };
  }

  const custom = String(input.customPassword ?? "").trim();
  if (custom && custom.length < 6) {
    return {
      ok: false,
      error: "Le mot de passe doit faire au moins 6 caractères.",
    };
  }

  const password = custom || generateClientPassword();

  let hashed: { hash: string; salt: string };
  try {
    hashed = hashPassword(password);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur lors du hash.",
    };
  }

  const admin = createAdminClient();
  const { data: profile, error: lookupError } = await admin
    .from("profiles")
    .select("id, is_owner")
    .eq("id", profileId)
    .maybeSingle();
  if (lookupError || !profile) {
    return { ok: false, error: "Client introuvable." };
  }
  if (profile.is_owner) {
    return {
      ok: false,
      error: "Le profil owner n'a pas d'espace client à protéger.",
    };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      password_hash: hashed.hash,
      password_salt: hashed.salt,
    })
    .eq("id", profileId);

  if (updateError) {
    console.error("[updateClientPassword] update error:", updateError);
    return { ok: false, error: updateError.message };
  }

  await revalidateClientPath(profileId);
  return { ok: true, password };
}
