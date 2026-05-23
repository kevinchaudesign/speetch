"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { computeTotals, parseLine } from "@/lib/credits/pricing";
import { loadEmitterSettings, getPrefixes } from "@/lib/credits/emitter";
import { nextCreditNumber } from "@/lib/credits/numbering";
import { loadBrevoSettings } from "@/lib/brevo-config";
import { sendBrevoTransactional } from "@/lib/brevo";
import { buildPublicCreditUrl } from "@/lib/credits/public-token";
import { buildInvoiceEmail } from "@/lib/credits/email-templates";
import type { CreditLine, InvoiceRow } from "@/lib/credits/types";

export type InvoiceActionState = {
  status: "idle" | "success" | "error";
  error?: string;
  invoiceId?: string;
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
    return { error: "SUPABASE_SERVICE_ROLE_KEY manquant." as const };
  }
  return { admin: createAdminClient() };
}

function s(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullable(v: string): string | null {
  return v.length > 0 ? v : null;
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

async function buildInvoicePayload(formData: FormData) {
  const client_name = s(formData, "client_name");
  if (client_name.length < 2)
    return { ok: false as const, error: "Nom du client obligatoire." };

  const issued_at = s(formData, "issued_at") || new Date().toISOString().slice(0, 10);
  const due_at = s(formData, "due_at") || null;
  const profile_id_raw = s(formData, "profile_id");
  const profile_id =
    profile_id_raw && UUID_REGEX.test(profile_id_raw) ? profile_id_raw : null;
  const quote_id_raw = s(formData, "quote_id");
  const quote_id =
    quote_id_raw && UUID_REGEX.test(quote_id_raw) ? quote_id_raw : null;

  const lines = parseLinesFromForm(formData);
  if (lines.length === 0)
    return {
      ok: false as const,
      error: "Au moins une ligne avec description, quantité et prix.",
    };

  const emitter = await loadEmitterSettings();
  const vat_exempt = emitter?.vat_exempt ?? true;
  const vat_exempt_mention = vat_exempt
    ? emitter?.vat_exempt_mention ?? "TVA non applicable, art. 293 B du CGI"
    : null;

  const totals = computeTotals(lines, { vatExempt: vat_exempt });

  const paidAmountRaw = s(formData, "paid_amount").replace(",", ".");
  const paid_amount = paidAmountRaw ? Number(paidAmountRaw) : 0;
  if (!Number.isFinite(paid_amount) || paid_amount < 0)
    return { ok: false as const, error: "Montant payé invalide." };

  return {
    ok: true as const,
    value: {
      profile_id,
      quote_id,
      client_name,
      client_company: nullable(s(formData, "client_company")),
      client_address: nullable(s(formData, "client_address")),
      client_postal_code: nullable(s(formData, "client_postal_code")),
      client_city: nullable(s(formData, "client_city")),
      client_country: nullable(s(formData, "client_country")) || "France",
      client_siren: nullable(s(formData, "client_siren").replace(/\s+/g, "")),
      client_vat_number: nullable(
        s(formData, "client_vat_number").replace(/\s+/g, "").toUpperCase(),
      ),
      client_email: nullable(s(formData, "client_email").toLowerCase()),
      issued_at,
      due_at,
      intro: nullable(s(formData, "intro")),
      payment_terms:
        nullable(s(formData, "payment_terms")) || emitter?.default_payment_terms || null,
      payment_method: nullable(s(formData, "payment_method")),
      paid_amount,
      paid_at: nullable(s(formData, "paid_at")),
      notes: nullable(s(formData, "notes")),
      operation_type: nullable(s(formData, "operation_type")) || "B2B",
      operation_nature: nullable(s(formData, "operation_nature")) || "services",
      delivery_address: nullable(s(formData, "delivery_address")),
      vat_exempt,
      vat_exempt_mention,
      lines,
      subtotal_ht: totals.subtotal_ht,
      tax_total: totals.tax_total,
      total_ttc: totals.total_ttc,
    },
  };
}

function derivePaymentStatus(
  paid_amount: number,
  total_ttc: number,
  due_at: string | null,
  current: "draft" | "sent" | "paid" | "partial" | "overdue" | "canceled",
): "draft" | "sent" | "paid" | "partial" | "overdue" | "canceled" {
  if (current === "canceled" || current === "draft") return current;
  if (paid_amount >= total_ttc && total_ttc > 0) return "paid";
  if (paid_amount > 0 && paid_amount < total_ttc) return "partial";
  if (due_at) {
    const due = Date.parse(due_at);
    if (Number.isFinite(due) && due < Date.now()) return "overdue";
  }
  return "sent";
}

export async function createInvoice(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const built = await buildInvoicePayload(formData);
  if (!built.ok) return { status: "error", error: built.error };

  const emitter = await loadEmitterSettings();
  const prefixes = getPrefixes(emitter);
  const year = new Date(built.value.issued_at).getFullYear();
  const num = await nextCreditNumber("invoice", prefixes.invoice, year);
  if (!num.ok) return { status: "error", error: num.error };

  const wantEmit = String(formData.get("emit") ?? "") === "1";
  const initialStatus: "draft" | "sent" = wantEmit ? "sent" : "draft";
  const status = derivePaymentStatus(
    built.value.paid_amount,
    built.value.total_ttc,
    built.value.due_at,
    initialStatus,
  );
  const sent_at = initialStatus === "sent" ? new Date().toISOString() : null;

  const { data, error } = await auth.admin
    .from("credit_invoices" as never)
    .insert({
      number: num.number,
      status,
      sent_at,
      ...built.value,
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    console.error("[createInvoice] insert:", error);
    return { status: "error", error: error?.message ?? "Insertion échouée." };
  }

  // Lier le devis source en accepted s'il était encore sent.
  if (built.value.quote_id) {
    await auth.admin
      .from("credit_quotes" as never)
      .update({ status: "accepted", accepted_at: new Date().toISOString() } as never)
      .eq("id", built.value.quote_id)
      .eq("status", "sent");
  }

  revalidatePath("/admin/credits");
  revalidatePath("/admin/credits/factures");
  if (built.value.quote_id) {
    revalidatePath(`/admin/credits/devis/${built.value.quote_id}`);
  }
  return { status: "success", invoiceId: data.id };
}

export async function updateInvoice(
  _prev: InvoiceActionState,
  formData: FormData,
): Promise<InvoiceActionState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const id = s(formData, "id");
  if (!UUID_REGEX.test(id))
    return { status: "error", error: "Identifiant facture invalide." };

  const built = await buildInvoicePayload(formData);
  if (!built.ok) return { status: "error", error: built.error };

  const { data: current } = await auth.admin
    .from("credit_invoices" as never)
    .select("status")
    .eq("id", id)
    .maybeSingle<{ status: string }>();
  const currentStatus = (current?.status ?? "draft") as
    | "draft"
    | "sent"
    | "paid"
    | "partial"
    | "overdue"
    | "canceled";
  const status = derivePaymentStatus(
    built.value.paid_amount,
    built.value.total_ttc,
    built.value.due_at,
    currentStatus,
  );

  const { error } = await auth.admin
    .from("credit_invoices" as never)
    .update({ ...built.value, status } as never)
    .eq("id", id);

  if (error) {
    console.error("[updateInvoice] update:", error);
    return { status: "error", error: error.message };
  }

  revalidatePath("/admin/credits");
  revalidatePath("/admin/credits/factures");
  revalidatePath(`/admin/credits/factures/${id}`);
  return { status: "success", invoiceId: id };
}

export async function setInvoiceStatus(formData: FormData): Promise<void> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return;
  const id = s(formData, "id");
  const status = s(formData, "status");
  if (!UUID_REGEX.test(id)) return;
  if (
    !["draft", "sent", "paid", "partial", "overdue", "canceled"].includes(status)
  )
    return;

  const patch: Record<string, unknown> = { status };
  const now = new Date().toISOString();
  if (status === "sent") patch.sent_at = now;
  if (status === "paid") {
    patch.paid_at = now.slice(0, 10);
    // Si on marque comme payé sans préciser le montant, on prend le total.
    const { data } = await auth.admin
      .from("credit_invoices" as never)
      .select("total_ttc")
      .eq("id", id)
      .maybeSingle<{ total_ttc: number }>();
    if (data) patch.paid_amount = data.total_ttc;
  }

  await auth.admin
    .from("credit_invoices" as never)
    .update(patch as never)
    .eq("id", id);

  revalidatePath("/admin/credits/factures");
  revalidatePath(`/admin/credits/factures/${id}`);
}

export type SendInvoiceState = {
  status: "idle" | "success" | "error";
  error?: string;
};

/**
 * Envoi de la facture par email via Brevo. Lien public signé HMAC
 * (90j) vers la vue print + récap inline (montant, échéance, IBAN).
 * Bascule la facture en `sent` si encore en brouillon.
 */
export async function sendInvoiceByEmail(
  _prev: SendInvoiceState,
  formData: FormData,
): Promise<SendInvoiceState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const id = s(formData, "id");
  const overrideEmail = s(formData, "email").toLowerCase();
  if (!UUID_REGEX.test(id))
    return { status: "error", error: "Identifiant facture invalide." };

  const brevo = await loadBrevoSettings();
  if (!brevo) {
    return {
      status: "error",
      error:
        "Émetteur Brevo non configuré. Va dans Forge → Émetteur Brevo.",
    };
  }

  const { data: invoice } = await auth.admin
    .from("credit_invoices" as never)
    .select("*")
    .eq("id", id)
    .maybeSingle<InvoiceRow>();
  if (!invoice) return { status: "error", error: "Facture introuvable." };

  const recipient = overrideEmail || invoice.client_email || "";
  if (!recipient || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) {
    return {
      status: "error",
      error:
        "Adresse e-mail du destinataire manquante (ni dans la facture, ni dans l'override).",
    };
  }

  const emitter = await loadEmitterSettings();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const publicUrl = buildPublicCreditUrl(origin, "invoice", id);
  const email = buildInvoiceEmail(
    invoice,
    publicUrl,
    emitter?.legal_name ?? null,
    emitter?.iban ?? null,
  );

  const out = await sendBrevoTransactional({
    apiKey: brevo.apiKey,
    sender: { email: brevo.senderEmail, name: brevo.senderName },
    to: { email: recipient, name: invoice.client_name },
    subject: email.subject,
    htmlContent: email.html,
    textContent: email.text,
    replyTo: brevo.replyTo
      ? { email: brevo.replyTo, name: brevo.senderName }
      : undefined,
    tags: ["speetch-credits", `invoice:${id}`],
  });

  if (!out.ok) {
    return { status: "error", error: `Brevo : ${out.error}` };
  }

  if (invoice.status === "draft") {
    await auth.admin
      .from("credit_invoices" as never)
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      } as never)
      .eq("id", id);
  } else {
    await auth.admin
      .from("credit_invoices" as never)
      .update({ sent_at: new Date().toISOString() } as never)
      .eq("id", id);
  }

  revalidatePath("/admin/credits");
  revalidatePath("/admin/credits/factures");
  revalidatePath(`/admin/credits/factures/${id}`);
  return { status: "success" };
}

export async function deleteInvoice(formData: FormData): Promise<void> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return;
  const id = s(formData, "id");
  if (!UUID_REGEX.test(id)) return;

  // Sécurité : on n'autorise la suppression que d'un brouillon.
  const { data } = await auth.admin
    .from("credit_invoices" as never)
    .select("status")
    .eq("id", id)
    .maybeSingle<{ status: string }>();
  if (!data || data.status !== "draft") return;

  await auth.admin.from("credit_invoices" as never).delete().eq("id", id);
  revalidatePath("/admin/credits/factures");
  redirect("/admin/credits/factures");
}
