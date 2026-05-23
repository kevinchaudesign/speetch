"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  isPadawanSource,
  isPadawanStatus,
  type PadawanSource,
  type PadawanStatus,
} from "@/lib/crm";

export type CrmActionState = {
  status: "idle" | "success" | "error";
  error?: string;
  /** Pour create/edit : id de la ligne touchée — permet au form de
   * rediriger ou d'afficher un panneau de succès. */
  padawanId?: string;
};

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireOwnerAndAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expirée. Reconnecte-toi." as const };
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { error: "Accès réservé au propriétaire." as const };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local — impossible d'écrire dans Supabase." as const,
    };
  }

  return { admin: createAdminClient() };
}

type ParsedPadawan = {
  full_name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: PadawanSource | null;
  status: PadawanStatus;
  notes: string | null;
};

function parsePadawanFormData(
  formData: FormData,
): { ok: true; value: ParsedPadawan } | { ok: false; error: string } {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const sourceRaw = String(formData.get("source") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "detected").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (fullName.length < 2) {
    return {
      ok: false,
      error: "Le nom doit faire au moins 2 caractères.",
    };
  }

  if (emailRaw && !EMAIL_REGEX.test(emailRaw)) {
    return { ok: false, error: "E-mail invalide." };
  }

  const status: PadawanStatus = isPadawanStatus(statusRaw)
    ? statusRaw
    : "detected";
  const source: PadawanSource | null =
    sourceRaw && isPadawanSource(sourceRaw) ? sourceRaw : null;

  return {
    ok: true,
    value: {
      full_name: fullName,
      company: company || null,
      email: emailRaw ? emailRaw.toLowerCase() : null,
      phone: phone || null,
      source,
      status,
      notes: notes || null,
    },
  };
}

export async function createPadawan(
  _prev: CrmActionState,
  formData: FormData,
): Promise<CrmActionState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const parsed = parsePadawanFormData(formData);
  if (!parsed.ok) return { status: "error", error: parsed.error };

  const { data, error } = await auth.admin
    .from("crm_padawans" as never)
    .insert(parsed.value as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    console.error("[createPadawan] insert error:", error);
    return {
      status: "error",
      error: error?.message ?? "Erreur d'insertion du padawan.",
    };
  }

  revalidatePath("/admin/crm");
  return { status: "success", padawanId: data.id };
}

export async function updatePadawan(
  _prev: CrmActionState,
  formData: FormData,
): Promise<CrmActionState> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return { status: "error", error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!UUID_REGEX.test(id)) {
    return { status: "error", error: "Identifiant padawan invalide." };
  }

  const parsed = parsePadawanFormData(formData);
  if (!parsed.ok) return { status: "error", error: parsed.error };

  const { error } = await auth.admin
    .from("crm_padawans" as never)
    .update(parsed.value as never)
    .eq("id", id);

  if (error) {
    console.error("[updatePadawan] update error:", error);
    return { status: "error", error: error.message };
  }

  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${id}`);
  return { status: "success", padawanId: id };
}

/**
 * Mise à jour rapide du statut depuis la liste (form action POST, pas
 * useActionState). Redirige vers /admin/crm pour rafraîchir le tableau.
 */
export async function updatePadawanStatus(formData: FormData): Promise<void> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return;

  const id = String(formData.get("id") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  if (!UUID_REGEX.test(id) || !isPadawanStatus(statusRaw)) return;

  await auth.admin
    .from("crm_padawans" as never)
    .update({ status: statusRaw } as never)
    .eq("id", id);

  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${id}`);
}

export async function deletePadawan(formData: FormData): Promise<void> {
  const auth = await requireOwnerAndAdmin();
  if ("error" in auth) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!UUID_REGEX.test(id)) return;

  await auth.admin
    .from("crm_padawans" as never)
    .delete()
    .eq("id", id);

  revalidatePath("/admin/crm");
  redirect("/admin/crm");
}
