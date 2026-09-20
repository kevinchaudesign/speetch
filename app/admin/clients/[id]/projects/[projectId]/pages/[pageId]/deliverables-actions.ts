"use server";
import { revalidatePagePath } from "@/lib/admin/routes";

import { createAdminClient, createClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_FORMAT_LEN = 60;
const MAX_TITLE_LEN = 120;
const MAX_DESCRIPTION_LEN = 1000;
const MAX_FEEDBACK_LEN = 2000;
const MAX_DELIVERABLES_PER_PAGE = 200;

export type DeliverableActionContext = {
  profileId: string;
  projectId: string;
  pageId: string;
};

// ─── Auth ───────────────────────────────────────────────────────────────────

async function requireOwnerAndAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Session expirée. Reconnecte-toi." };
  }
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
  return { ok: true as const, admin: createAdminClient() };
}

/**
 * Vérifie que la page appartient bien au projet + client donnés. Centralisé
 * pour ne pas faire confiance aux IDs reçus côté client.
 */
async function ensurePageBelongsToClient(
  admin: ReturnType<typeof createAdminClient>,
  ctx: DeliverableActionContext,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: page } = await admin
    .from("pages")
    .select("id, project_id, projects!inner(id, profile_id)")
    .eq("id", ctx.pageId)
    .eq("project_id", ctx.projectId)
    .maybeSingle();
  if (!page) return { ok: false, error: "Page introuvable." };
  const project = (
    Array.isArray(page.projects) ? page.projects[0] : page.projects
  ) as { id: string; profile_id: string } | null;
  if (!project || project.profile_id !== ctx.profileId) {
    return { ok: false, error: "Page introuvable pour ce client." };
  }
  return { ok: true };
}

function validateCtx(ctx: DeliverableActionContext): string | null {
  if (!UUID_REGEX.test(ctx.profileId)) return "Client invalide.";
  if (!UUID_REGEX.test(ctx.projectId)) return "Projet invalide.";
  if (!UUID_REGEX.test(ctx.pageId)) return "Page invalide.";
  return null;
}

function cleanText(raw: unknown, maxLen: number): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLen) return trimmed.slice(0, maxLen);
  return trimmed;
}

async function revalidateBoth(ctx: DeliverableActionContext) {
  await revalidatePagePath(ctx.profileId, ctx.projectId, ctx.pageId);
  // La page publique pourrait être revalidée si on connait son slug — mais on
  // ne le fetch pas ici. Le dynamic = "force-dynamic" côté route publique
  // garantit qu'elle est toujours fraîche au prochain GET.
}

// ─── CRUD livrables ─────────────────────────────────────────────────────────

export type CreateDeliverableResult =
  | { ok: true; deliverableId: string }
  | { ok: false; error: string };

export async function createDeliverable(input: {
  ctx: DeliverableActionContext;
  mediaId: string;
  format?: string | null;
  title?: string | null;
  description?: string | null;
}): Promise<CreateDeliverableResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!UUID_REGEX.test(input.mediaId)) {
    return { ok: false, error: "Média invalide." };
  }

  const own = await ensurePageBelongsToClient(auth.admin, input.ctx);
  if (!own.ok) return { ok: false, error: own.error };

  // Le média doit appartenir au même client.
  const { data: media } = await auth.admin
    .from("client_media" as never)
    .select("id, profile_id")
    .eq("id", input.mediaId)
    .maybeSingle<{ id: string; profile_id: string }>();
  if (!media || media.profile_id !== input.ctx.profileId) {
    return { ok: false, error: "Média introuvable pour ce client." };
  }

  // Cap dur sur le nombre de livrables par page.
  const { count } = await auth.admin
    .from("client_page_deliverables" as never)
    .select("id", { count: "exact", head: true })
    .eq("page_id", input.ctx.pageId);
  if ((count ?? 0) >= MAX_DELIVERABLES_PER_PAGE) {
    return {
      ok: false,
      error: `Limite atteinte (${MAX_DELIVERABLES_PER_PAGE} livrables max par page).`,
    };
  }

  // Position : prochain à la fin
  const { data: maxRow } = await auth.admin
    .from("client_page_deliverables" as never)
    .select("position")
    .eq("page_id", input.ctx.pageId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<{ position: number }>();
  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data: inserted, error } = await auth.admin
    .from("client_page_deliverables" as never)
    .insert({
      page_id: input.ctx.pageId,
      media_id: input.mediaId,
      format: cleanText(input.format, MAX_FORMAT_LEN),
      title: cleanText(input.title, MAX_TITLE_LEN),
      description: cleanText(input.description, MAX_DESCRIPTION_LEN),
      position: nextPosition,
    } as never)
    .select("id")
    .single<{ id: string }>();
  if (error || !inserted) {
    console.error("[createDeliverable] insert error:", error);
    return { ok: false, error: error?.message ?? "Création impossible." };
  }

  await revalidateBoth(input.ctx);
  return { ok: true, deliverableId: inserted.id };
}

export type UpdateDeliverableResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateDeliverable(input: {
  ctx: DeliverableActionContext;
  deliverableId: string;
  patch: {
    media_id?: string | null;
    format?: string | null;
    title?: string | null;
    description?: string | null;
  };
}): Promise<UpdateDeliverableResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!UUID_REGEX.test(input.deliverableId)) {
    return { ok: false, error: "Livrable invalide." };
  }

  const own = await ensurePageBelongsToClient(auth.admin, input.ctx);
  if (!own.ok) return { ok: false, error: own.error };

  // Si on change le media, valider qu'il appartient au même client.
  if (input.patch.media_id !== undefined && input.patch.media_id !== null) {
    if (!UUID_REGEX.test(input.patch.media_id)) {
      return { ok: false, error: "Média invalide." };
    }
    const { data: media } = await auth.admin
      .from("client_media" as never)
      .select("id, profile_id")
      .eq("id", input.patch.media_id)
      .maybeSingle<{ id: string; profile_id: string }>();
    if (!media || media.profile_id !== input.ctx.profileId) {
      return { ok: false, error: "Média introuvable pour ce client." };
    }
  }

  const update: Record<string, unknown> = {};
  if (input.patch.media_id !== undefined)
    update.media_id = input.patch.media_id;
  if (input.patch.format !== undefined) {
    update.format = cleanText(input.patch.format, MAX_FORMAT_LEN);
  }
  if (input.patch.title !== undefined) {
    update.title = cleanText(input.patch.title, MAX_TITLE_LEN);
  }
  if (input.patch.description !== undefined) {
    update.description = cleanText(
      input.patch.description,
      MAX_DESCRIPTION_LEN,
    );
  }
  if (Object.keys(update).length === 0) {
    return { ok: false, error: "Rien à mettre à jour." };
  }

  const { error } = await auth.admin
    .from("client_page_deliverables" as never)
    .update(update as never)
    .eq("id", input.deliverableId)
    .eq("page_id", input.ctx.pageId);
  if (error) {
    console.error("[updateDeliverable] update error:", error);
    return { ok: false, error: error.message };
  }
  await revalidateBoth(input.ctx);
  return { ok: true };
}

export type DeleteDeliverableResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteDeliverable(input: {
  ctx: DeliverableActionContext;
  deliverableId: string;
}): Promise<DeleteDeliverableResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!UUID_REGEX.test(input.deliverableId)) {
    return { ok: false, error: "Livrable invalide." };
  }
  const own = await ensurePageBelongsToClient(auth.admin, input.ctx);
  if (!own.ok) return { ok: false, error: own.error };

  const { error } = await auth.admin
    .from("client_page_deliverables" as never)
    .delete()
    .eq("id", input.deliverableId)
    .eq("page_id", input.ctx.pageId);
  if (error) {
    console.error("[deleteDeliverable] delete error:", error);
    return { ok: false, error: error.message };
  }
  await revalidateBoth(input.ctx);
  return { ok: true };
}

export type ReorderDeliverablesResult =
  | { ok: true }
  | { ok: false; error: string };

export async function reorderDeliverables(input: {
  ctx: DeliverableActionContext;
  deliverableIds: string[];
}): Promise<ReorderDeliverablesResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };

  if (
    !Array.isArray(input.deliverableIds) ||
    input.deliverableIds.length === 0
  ) {
    return { ok: false, error: "Liste vide." };
  }
  if (input.deliverableIds.length > MAX_DELIVERABLES_PER_PAGE) {
    return { ok: false, error: "Trop de livrables." };
  }
  if (!input.deliverableIds.every((id) => UUID_REGEX.test(id))) {
    return { ok: false, error: "Identifiant invalide." };
  }
  if (new Set(input.deliverableIds).size !== input.deliverableIds.length) {
    return { ok: false, error: "Doublons dans la liste." };
  }

  const own = await ensurePageBelongsToClient(auth.admin, input.ctx);
  if (!own.ok) return { ok: false, error: own.error };

  for (let i = 0; i < input.deliverableIds.length; i++) {
    const { error } = await auth.admin
      .from("client_page_deliverables" as never)
      .update({ position: i } as never)
      .eq("id", input.deliverableIds[i])
      .eq("page_id", input.ctx.pageId);
    if (error) {
      console.error("[reorderDeliverables] update error:", error);
      return { ok: false, error: error.message };
    }
  }
  await revalidateBoth(input.ctx);
  return { ok: true };
}

// ─── Owner reply dans un thread ────────────────────────────────────────────

export type PostOwnerReplyResult =
  | { ok: true; feedbackId: string }
  | { ok: false; error: string };

export async function postOwnerReply(input: {
  ctx: DeliverableActionContext;
  deliverableId: string;
  body: string;
}): Promise<PostOwnerReplyResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const err = validateCtx(input.ctx);
  if (err) return { ok: false, error: err };
  if (!UUID_REGEX.test(input.deliverableId)) {
    return { ok: false, error: "Livrable invalide." };
  }

  const body = cleanText(input.body, MAX_FEEDBACK_LEN);
  if (!body) return { ok: false, error: "Message vide." };

  const own = await ensurePageBelongsToClient(auth.admin, input.ctx);
  if (!own.ok) return { ok: false, error: own.error };

  // Vérifie que le livrable est bien rattaché à cette page.
  const { data: deliv } = await auth.admin
    .from("client_page_deliverables" as never)
    .select("id, page_id")
    .eq("id", input.deliverableId)
    .eq("page_id", input.ctx.pageId)
    .maybeSingle<{ id: string; page_id: string }>();
  if (!deliv) return { ok: false, error: "Livrable introuvable." };

  const { data: inserted, error } = await auth.admin
    .from("client_deliverable_feedback" as never)
    .insert({
      deliverable_id: input.deliverableId,
      author_kind: "owner",
      body,
    } as never)
    .select("id")
    .single<{ id: string }>();
  if (error || !inserted) {
    console.error("[postOwnerReply] insert error:", error);
    return { ok: false, error: error?.message ?? "Envoi impossible." };
  }
  await revalidateBoth(input.ctx);
  return { ok: true, feedbackId: inserted.id };
}
