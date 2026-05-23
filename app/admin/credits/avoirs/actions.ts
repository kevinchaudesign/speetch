"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { loadEmitterSettings, getPrefixes } from "@/lib/credits/emitter";
import { nextCreditNumber } from "@/lib/credits/numbering";
import type { InvoiceRow } from "@/lib/credits/types";

export type CreditNoteState = {
  status: "idle" | "success" | "error";
  error?: string;
  creditNoteId?: string;
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

/**
 * Émet un avoir lié à une facture. Deux modes :
 *  - Total : montants = ceux de la facture (annulation complète).
 *  - Partiel : montants saisis manuellement.
 *
 * Si l'annulation est totale, on bascule aussi la facture en
 * 'canceled' pour que le statut reflète la situation. Sinon on laisse
 * la facture telle quelle (cas typique : avoir partiel pour remise
 * commerciale a posteriori).
 */
export async function createCreditNote(
  _prev: CreditNoteState,
  formData: FormData,
): Promise<CreditNoteState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const invoiceId = s(formData, "invoice_id");
  if (!UUID_REGEX.test(invoiceId))
    return { status: "error", error: "Identifiant facture invalide." };

  const reason = s(formData, "reason");
  if (reason.length < 3)
    return { status: "error", error: "Motif requis (3 caractères min.)." };

  const mode = s(formData, "mode"); // 'full' | 'partial'
  const notes = s(formData, "notes");

  const { data: invoice } = await auth.admin
    .from("credit_invoices" as never)
    .select("subtotal_ht, tax_total, total_ttc, status")
    .eq("id", invoiceId)
    .maybeSingle<{
      subtotal_ht: number;
      tax_total: number;
      total_ttc: number;
      status: string;
    }>();
  if (!invoice) return { status: "error", error: "Facture introuvable." };
  if (invoice.status === "draft") {
    return {
      status: "error",
      error:
        "On n'émet pas d'avoir sur un brouillon — supprime-le ou émets-le d'abord.",
    };
  }

  let subtotal_ht: number;
  let tax_total: number;
  let total_ttc: number;

  if (mode === "full") {
    subtotal_ht = Number(invoice.subtotal_ht);
    tax_total = Number(invoice.tax_total);
    total_ttc = Number(invoice.total_ttc);
  } else {
    const ht = Number(s(formData, "subtotal_ht").replace(",", "."));
    const tax = Number(s(formData, "tax_total").replace(",", "."));
    if (!Number.isFinite(ht) || ht <= 0)
      return { status: "error", error: "Montant HT invalide." };
    if (!Number.isFinite(tax) || tax < 0)
      return { status: "error", error: "Montant TVA invalide." };
    subtotal_ht = ht;
    tax_total = tax;
    total_ttc = ht + tax;
    if (total_ttc > Number(invoice.total_ttc)) {
      return {
        status: "error",
        error: "L'avoir ne peut pas dépasser le montant de la facture.",
      };
    }
  }

  const emitter = await loadEmitterSettings();
  const prefixes = getPrefixes(emitter);
  const year = new Date().getFullYear();
  const num = await nextCreditNumber("credit_note", prefixes.credit_note, year);
  if (!num.ok) return { status: "error", error: num.error };

  const { data, error } = await auth.admin
    .from("credit_notes" as never)
    .insert({
      number: num.number,
      invoice_id: invoiceId,
      reason,
      subtotal_ht,
      tax_total,
      total_ttc,
      notes: notes || null,
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    console.error("[createCreditNote] insert:", error);
    return { status: "error", error: error?.message ?? "Insertion échouée." };
  }

  if (mode === "full") {
    await auth.admin
      .from("credit_invoices" as never)
      .update({ status: "canceled" } as never)
      .eq("id", invoiceId);
  }

  revalidatePath("/admin/credits");
  revalidatePath("/admin/credits/factures");
  revalidatePath(`/admin/credits/factures/${invoiceId}`);
  revalidatePath("/admin/credits/avoirs");
  return { status: "success", creditNoteId: data.id };
}

export async function deleteCreditNote(formData: FormData): Promise<void> {
  // Pas de suppression — un avoir doit rester (audit). Action vide pour
  // l'instant, on pourrait l'utiliser pour autre chose (corriger le motif…).
  return;
}

/** Server action utilisée par le bouton "Ouvrir le PDF" pour rediriger. */
export async function openCreditNotePrint(formData: FormData): Promise<void> {
  const id = s(formData, "id");
  if (!UUID_REGEX.test(id)) return;
  redirect(`/admin/credits/print/credit_note/${id}`);
}
