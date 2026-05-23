"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { saveEmitterSettings } from "@/lib/credits/emitter";
import type { EmitterSettingsRow } from "@/lib/credits/types";

export type EmitterSettingsState = {
  status: "idle" | "success" | "error";
  error?: string;
};

const SIREN_REGEX = /^\d{9}$/;
const SIRET_REGEX = /^\d{14}$/;
const VAT_FR_REGEX = /^FR\d{11}$/i;
const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/i;

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Session expirée." };
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false as const, error: "Accès réservé au propriétaire." };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false as const,
      error: "SUPABASE_SERVICE_ROLE_KEY manquant.",
    };
  }
  return { ok: true as const };
}

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullable(v: string): string | null {
  return v.length > 0 ? v : null;
}

export async function saveEmitterAction(
  _prev: EmitterSettingsState,
  formData: FormData,
): Promise<EmitterSettingsState> {
  const guard = await requireOwner();
  if (!guard.ok) return { status: "error", error: guard.error };

  const legal_name = s(formData, "legal_name");
  const legal_form = s(formData, "legal_form");
  const siren = s(formData, "siren").replace(/\s+/g, "");
  const siret = s(formData, "siret").replace(/\s+/g, "");
  const vat_number = s(formData, "vat_number").replace(/\s+/g, "").toUpperCase();
  const vat_exempt = formData.get("vat_exempt") === "on";
  const vat_exempt_mention = s(formData, "vat_exempt_mention");
  const address_line1 = s(formData, "address_line1");
  const address_line2 = s(formData, "address_line2");
  const postal_code = s(formData, "postal_code");
  const city = s(formData, "city");
  const country = s(formData, "country");
  const iban = s(formData, "iban").replace(/\s+/g, "").toUpperCase();
  const bic = s(formData, "bic").replace(/\s+/g, "").toUpperCase();
  const bank_name = s(formData, "bank_name");
  const default_payment_terms = s(formData, "default_payment_terms");
  const late_payment_rate = s(formData, "late_payment_rate");
  const recovery_raw = s(formData, "recovery_indemnity").replace(",", ".");
  const recovery_indemnity = recovery_raw ? Number(recovery_raw) : null;
  const legal_mentions = s(formData, "legal_mentions");
  const pdp_provider = s(formData, "pdp_provider");
  const pdp_id = s(formData, "pdp_id");
  const quote_prefix = s(formData, "quote_prefix").toUpperCase() || "DV";
  const invoice_prefix = s(formData, "invoice_prefix").toUpperCase() || "FC";
  const credit_note_prefix = s(formData, "credit_note_prefix").toUpperCase() || "AV";

  if (legal_name.length < 2) {
    return { status: "error", error: "Raison sociale obligatoire." };
  }
  if (siren && !SIREN_REGEX.test(siren)) {
    return { status: "error", error: "SIREN invalide (9 chiffres)." };
  }
  if (siret && !SIRET_REGEX.test(siret)) {
    return { status: "error", error: "SIRET invalide (14 chiffres)." };
  }
  if (vat_number && !VAT_FR_REGEX.test(vat_number)) {
    return {
      status: "error",
      error: "N° TVA intra invalide (format FR + 11 chiffres).",
    };
  }
  if (iban && !IBAN_REGEX.test(iban)) {
    return { status: "error", error: "IBAN invalide." };
  }
  if (recovery_indemnity != null && !Number.isFinite(recovery_indemnity)) {
    return { status: "error", error: "Indemnité de recouvrement invalide." };
  }

  const patch: Partial<EmitterSettingsRow> = {
    legal_name,
    legal_form: nullable(legal_form),
    siren: nullable(siren),
    siret: nullable(siret),
    vat_number: nullable(vat_number),
    vat_exempt,
    vat_exempt_mention: nullable(vat_exempt_mention),
    address_line1: nullable(address_line1),
    address_line2: nullable(address_line2),
    postal_code: nullable(postal_code),
    city: nullable(city),
    country: nullable(country),
    iban: nullable(iban),
    bic: nullable(bic),
    bank_name: nullable(bank_name),
    default_payment_terms: nullable(default_payment_terms),
    late_payment_rate: nullable(late_payment_rate),
    recovery_indemnity,
    legal_mentions: nullable(legal_mentions),
    pdp_provider: nullable(pdp_provider),
    pdp_id: nullable(pdp_id),
    quote_prefix,
    invoice_prefix,
    credit_note_prefix,
  };

  const res = await saveEmitterSettings(patch);
  if (!res.ok) return { status: "error", error: res.error };

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/emitter");
  revalidatePath("/admin/credits", "layout");
  return { status: "success" };
}
