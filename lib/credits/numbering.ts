/**
 * Génération de numéros séquentiels devis / facture / avoir.
 *
 * Délégation à la fonction Postgres `next_credit_number(year, kind,
 * prefix)` — atomique au row-level, résiste à la concurrence sans
 * transaction explicite côté Node. Format de retour : "PREFIX-YYYY-NNNN".
 *
 * IMPORTANT : on ne génère le numéro qu'au moment de "sceller"
 * (émission). Tant que la pièce est en brouillon, on peut la supprimer
 * sans laisser de trou. Une fois émise, elle reste — même annulée elle
 * doit garder son numéro (et nécessite un avoir pour être neutralisée).
 */

import { createAdminClient } from "@/lib/supabase/server";

export type NumberKind = "quote" | "invoice" | "credit_note";

export async function nextCreditNumber(
  kind: NumberKind,
  prefix: string,
  year: number = new Date().getFullYear(),
): Promise<{ ok: true; number: string } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc(
    "next_credit_number" as never,
    { p_year: year, p_kind: kind, p_prefix: prefix } as never,
  );
  if (error) {
    console.error("[nextCreditNumber] RPC error:", error);
    return { ok: false, error: error.message };
  }
  const num = typeof data === "string" ? data : String(data ?? "");
  if (!num) return { ok: false, error: "RPC vide." };
  return { ok: true, number: num };
}
