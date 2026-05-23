"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  computeTotals,
  parseLine,
} from "@/lib/credits/pricing";
import { loadEmitterSettings, getPrefixes } from "@/lib/credits/emitter";
import { nextCreditNumber } from "@/lib/credits/numbering";
import { loadBrevoSettings } from "@/lib/brevo-config";
import { sendBrevoTransactional } from "@/lib/brevo";
import { buildPublicCreditUrl } from "@/lib/credits/public-token";
import { buildQuoteEmail } from "@/lib/credits/email-templates";
import type { CreditLine, QuoteRow } from "@/lib/credits/types";

export type QuoteActionState = {
  status: "idle" | "success" | "error";
  error?: string;
  quoteId?: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireOwnerAndAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." as const };
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { error: "Accès réservé au propriétaire." as const };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error: "SUPABASE_SERVICE_ROLE_KEY manquant." as const,
    };
  }
  return { admin: createAdminClient() };
}

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseLinesFromForm(formData: FormData): CreditLine[] {
  const raw = String(formData.get("lines_json") ?? "[]");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: CreditLine[] = [];
  for (const l of parsed) {
    const line = parseLine(l as Record<string, unknown>);
    if (line && line.description && line.quantity > 0 && line.unit_price_ht > 0) {
      out.push(line);
    }
  }
  return out;
}

type QuotePayload = {
  profile_id: string | null;
  client_name: string;
  client_company: string | null;
  client_address: string | null;
  client_postal_code: string | null;
  client_city: string | null;
  client_country: string | null;
  client_siren: string | null;
  client_vat_number: string | null;
  client_email: string | null;
  issued_at: string;
  valid_until: string | null;
  intro: string | null;
  payment_terms: string | null;
  notes: string | null;
  vat_exempt: boolean;
  vat_exempt_mention: string | null;
  lines: CreditLine[];
  subtotal_ht: number;
  tax_total: number;
  total_ttc: number;
};

async function buildQuotePayload(
  formData: FormData,
): Promise<{ ok: true; value: QuotePayload } | { ok: false; error: string }> {
  const client_name = s(formData, "client_name");
  if (client_name.length < 2) {
    return { ok: false, error: "Nom du client obligatoire." };
  }
  const issued_at = s(formData, "issued_at") || new Date().toISOString().slice(0, 10);
  const valid_until = s(formData, "valid_until") || null;
  const profile_id_raw = s(formData, "profile_id");
  const profile_id =
    profile_id_raw && UUID_REGEX.test(profile_id_raw) ? profile_id_raw : null;

  const lines = parseLinesFromForm(formData);
  if (lines.length === 0) {
    return { ok: false, error: "Au moins une ligne avec description, quantité et prix." };
  }

  const emitter = await loadEmitterSettings();
  const vat_exempt = emitter?.vat_exempt ?? true;
  const vat_exempt_mention = vat_exempt
    ? emitter?.vat_exempt_mention ?? "TVA non applicable, art. 293 B du CGI"
    : null;

  const totals = computeTotals(lines, { vatExempt: vat_exempt });

  return {
    ok: true,
    value: {
      profile_id,
      client_name,
      client_company: s(formData, "client_company") || null,
      client_address: s(formData, "client_address") || null,
      client_postal_code: s(formData, "client_postal_code") || null,
      client_city: s(formData, "client_city") || null,
      client_country: s(formData, "client_country") || "France",
      client_siren: s(formData, "client_siren").replace(/\s+/g, "") || null,
      client_vat_number:
        s(formData, "client_vat_number").replace(/\s+/g, "").toUpperCase() || null,
      client_email: s(formData, "client_email").toLowerCase() || null,
      issued_at,
      valid_until,
      intro: s(formData, "intro") || null,
      payment_terms:
        s(formData, "payment_terms") || emitter?.default_payment_terms || null,
      notes: s(formData, "notes") || null,
      vat_exempt,
      vat_exempt_mention,
      lines,
      subtotal_ht: totals.subtotal_ht,
      tax_total: totals.tax_total,
      total_ttc: totals.total_ttc,
    },
  };
}

export async function createQuote(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const built = await buildQuotePayload(formData);
  if (!built.ok) return { status: "error", error: built.error };

  // Numéro séquentiel attribué à la création (pas seulement à l'envoi)
  // — c'est l'usage le plus courant en agence pour pouvoir référencer
  // le devis dès le brouillon.
  const emitter = await loadEmitterSettings();
  const prefixes = getPrefixes(emitter);
  const year = new Date(built.value.issued_at).getFullYear();
  const num = await nextCreditNumber("quote", prefixes.quote, year);
  if (!num.ok) return { status: "error", error: num.error };

  const status = String(formData.get("emit") ?? "") === "1" ? "sent" : "draft";
  const sent_at = status === "sent" ? new Date().toISOString() : null;

  const { data, error } = await auth.admin
    .from("credit_quotes" as never)
    .insert({
      number: num.number,
      status,
      sent_at,
      ...built.value,
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    console.error("[createQuote] insert:", error);
    return { status: "error", error: error?.message ?? "Insertion échouée." };
  }

  revalidatePath("/admin/credits");
  revalidatePath("/admin/credits/devis");
  return { status: "success", quoteId: data.id };
}

export async function updateQuote(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const id = s(formData, "id");
  if (!UUID_REGEX.test(id)) {
    return { status: "error", error: "Identifiant devis invalide." };
  }

  const built = await buildQuotePayload(formData);
  if (!built.ok) return { status: "error", error: built.error };

  const { error } = await auth.admin
    .from("credit_quotes" as never)
    .update(built.value as never)
    .eq("id", id);

  if (error) {
    console.error("[updateQuote] update:", error);
    return { status: "error", error: error.message };
  }

  revalidatePath("/admin/credits");
  revalidatePath("/admin/credits/devis");
  revalidatePath(`/admin/credits/devis/${id}`);
  return { status: "success", quoteId: id };
}

export async function setQuoteStatus(formData: FormData): Promise<void> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return;
  const id = s(formData, "id");
  const status = s(formData, "status");
  if (!UUID_REGEX.test(id)) return;
  if (!["draft", "sent", "accepted", "refused", "expired"].includes(status))
    return;

  const patch: Record<string, unknown> = { status };
  const now = new Date().toISOString();
  if (status === "sent") patch.sent_at = now;
  if (status === "accepted") patch.accepted_at = now;
  if (status === "refused") patch.refused_at = now;

  await auth.admin
    .from("credit_quotes" as never)
    .update(patch as never)
    .eq("id", id);

  revalidatePath("/admin/credits/devis");
  revalidatePath(`/admin/credits/devis/${id}`);
}

export type SendQuoteState = {
  status: "idle" | "success" | "error";
  error?: string;
};

/**
 * Envoi du devis par email via Brevo. Construit un lien public signé
 * HMAC (90j) vers la vue print, et email le destinataire snapshot du
 * devis. Bascule le devis en `sent` si encore en brouillon.
 */
export async function sendQuoteByEmail(
  _prev: SendQuoteState,
  formData: FormData,
): Promise<SendQuoteState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const id = s(formData, "id");
  const overrideEmail = s(formData, "email").toLowerCase();
  if (!UUID_REGEX.test(id))
    return { status: "error", error: "Identifiant devis invalide." };

  const brevo = await loadBrevoSettings();
  if (!brevo) {
    return {
      status: "error",
      error:
        "Émetteur Brevo non configuré. Va dans Forge → Émetteur Brevo.",
    };
  }

  const { data: quote } = await auth.admin
    .from("credit_quotes" as never)
    .select("*")
    .eq("id", id)
    .maybeSingle<QuoteRow>();
  if (!quote) return { status: "error", error: "Devis introuvable." };

  const recipient = overrideEmail || quote.client_email || "";
  if (!recipient || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) {
    return {
      status: "error",
      error:
        "Adresse e-mail du destinataire manquante (ni dans le devis, ni dans l'override).",
    };
  }

  const emitter = await loadEmitterSettings();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const publicUrl = buildPublicCreditUrl(origin, "quote", id);
  const email = buildQuoteEmail(quote, publicUrl, emitter?.legal_name ?? null);

  const out = await sendBrevoTransactional({
    apiKey: brevo.apiKey,
    sender: { email: brevo.senderEmail, name: brevo.senderName },
    to: { email: recipient, name: quote.client_name },
    subject: email.subject,
    htmlContent: email.html,
    textContent: email.text,
    replyTo: brevo.replyTo
      ? { email: brevo.replyTo, name: brevo.senderName }
      : undefined,
    tags: ["speetch-credits", `quote:${id}`],
  });

  if (!out.ok) {
    return { status: "error", error: `Brevo : ${out.error}` };
  }

  // Bascule en 'sent' si encore brouillon, sinon on garde le status courant.
  if (quote.status === "draft") {
    await auth.admin
      .from("credit_quotes" as never)
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      } as never)
      .eq("id", id);
  } else {
    // Met juste à jour sent_at pour la trace du dernier envoi.
    await auth.admin
      .from("credit_quotes" as never)
      .update({ sent_at: new Date().toISOString() } as never)
      .eq("id", id);
  }

  revalidatePath("/admin/credits");
  revalidatePath("/admin/credits/devis");
  revalidatePath(`/admin/credits/devis/${id}`);
  return { status: "success" };
}

export async function deleteQuote(formData: FormData): Promise<void> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return;
  const id = s(formData, "id");
  if (!UUID_REGEX.test(id)) return;

  // Sécurité : on n'accepte de supprimer qu'un brouillon (un devis émis
  // doit garder sa trace, comme une facture).
  const { data: row } = await auth.admin
    .from("credit_quotes" as never)
    .select("status")
    .eq("id", id)
    .maybeSingle<{ status: string }>();
  if (!row || row.status !== "draft") {
    return;
  }
  await auth.admin.from("credit_quotes" as never).delete().eq("id", id);
  revalidatePath("/admin/credits/devis");
  redirect("/admin/credits/devis");
}
