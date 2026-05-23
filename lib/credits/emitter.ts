/**
 * Helpers BDD pour les réglages de l'émetteur (singleton). Lit/écrit
 * la table credit_emitter_settings via service-role. Utilisé par la
 * page Forge → Émetteur Crédits et par les pages devis/facture
 * (mentions obligatoires en pied de pièce).
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { EmitterSettingsRow } from "./types";

export async function loadEmitterSettings(): Promise<EmitterSettingsRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("credit_emitter_settings" as never)
    .select("*")
    .eq("id", "singleton")
    .maybeSingle<EmitterSettingsRow>();
  return data ?? null;
}

/** Vrai si on a au moins une raison sociale + SIREN + adresse — suffisant
 *  pour émettre une pièce avec mentions légales basiques. */
export function isEmitterReady(s: EmitterSettingsRow | null): boolean {
  if (!s) return false;
  return Boolean(
    s.legal_name &&
      s.siren &&
      s.address_line1 &&
      s.postal_code &&
      s.city,
  );
}

export async function saveEmitterSettings(input: Partial<EmitterSettingsRow>): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const admin = createAdminClient();
  const patch: Record<string, unknown> = { id: "singleton" };
  for (const [k, v] of Object.entries(input)) {
    if (k === "id" || k === "updated_at") continue;
    patch[k] = v;
  }
  const { error } = await admin
    .from("credit_emitter_settings" as never)
    .upsert(patch as never, { onConflict: "id" });
  if (error) {
    console.error("[saveEmitterSettings] upsert error:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Préfixes effectifs (avec defaults). */
export function getPrefixes(s: EmitterSettingsRow | null): {
  quote: string;
  invoice: string;
  credit_note: string;
} {
  return {
    quote: s?.quote_prefix?.trim() || "DV",
    invoice: s?.invoice_prefix?.trim() || "FC",
    credit_note: s?.credit_note_prefix?.trim() || "AV",
  };
}
