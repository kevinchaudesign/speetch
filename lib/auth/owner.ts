/**
 * Helpers d'autorisation owner-only pour Speetch.
 *
 * Pattern utilisé dans tout le projet :
 *  - `SPEETCH_OWNER_EMAIL` défini → seul cet email est considéré owner.
 *  - Non défini → fallback single-tenant : tout user Supabase authentifié
 *    est considéré owner (utile en dev local).
 *
 * Toute fonction d'écriture admin OU d'édition côté espace client doit
 * passer par `requireOwner` (server-side) ou `isOwnerEmail` (côté SSR
 * pour gating UI conditionnel).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function isOwnerEmail(email: string | null | undefined): boolean {
  const owner = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (!owner) return true;
  return (email ?? "").toLowerCase() === owner;
}

export type OwnerCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "no_session" | "not_owner" };

/**
 * À utiliser dans une route handler ou un Server Component. Lit la session
 * Supabase et vérifie qu'elle correspond à l'email owner. Renvoie un
 * `OwnerCheck` plutôt que de lever — le caller décide du status code.
 */
export async function requireOwner(
  supabase: SupabaseClient<Database>,
): Promise<OwnerCheck> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "no_session" };
  if (!isOwnerEmail(user.email)) return { ok: false, reason: "not_owner" };
  return { ok: true, email: user.email ?? "" };
}
