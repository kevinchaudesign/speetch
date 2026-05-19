"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getSessionCookieName, verifySession } from "@/lib/crypto";
import { isValidSlug } from "@/lib/slug";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_FEEDBACK_LEN = 2000;
const DELIVERABLE_STATUSES = ["pending", "approved", "changes_requested"] as const;
type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

// ─── Auth via cookie de gate ────────────────────────────────────────────────

async function resolveProfileBySlug(
  slug: string,
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  if (!isValidSlug(slug)) return { ok: false, error: "Slug invalide." };
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_spaces")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!data?.id) return { ok: false, error: "Espace introuvable." };
  return { ok: true, profileId: data.id };
}

async function requireUnlocked(
  clientSlug: string,
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const resolved = await resolveProfileBySlug(clientSlug);
  if (!resolved.ok) return resolved;
  const cookieStore = await cookies();
  const value = cookieStore.get(getSessionCookieName(resolved.profileId))?.value;
  if (!verifySession(resolved.profileId, value)) {
    return { ok: false, error: "Espace verrouillé." };
  }
  return { ok: true, profileId: resolved.profileId };
}

/**
 * Vérifie que le livrable existe ET appartient à une page publiée de ce
 * client. Renvoie le pageId pour servir aux revalidatePath.
 */
async function ensureDeliverableInClientScope(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  deliverableId: string,
): Promise<
  | { ok: true; pageId: string; projectId: string; pageSlug: string; projectSlug: string }
  | { ok: false; error: string }
> {
  const { data } = await admin
    .from("client_page_deliverables" as never)
    .select(
      "id, page_id, pages!inner(id, slug, is_published, project_id, projects!inner(id, slug, is_published, profile_id))",
    )
    .eq("id", deliverableId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Livrable introuvable." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const page = Array.isArray(row.pages) ? row.pages[0] : row.pages;
  if (!page) return { ok: false, error: "Page introuvable." };
  const project = Array.isArray(page.projects) ? page.projects[0] : page.projects;
  if (!project) return { ok: false, error: "Projet introuvable." };

  if (project.profile_id !== profileId) {
    return { ok: false, error: "Livrable hors de ton espace." };
  }
  if (!page.is_published || !project.is_published) {
    return { ok: false, error: "Livrable non publié." };
  }
  return {
    ok: true,
    pageId: page.id,
    projectId: project.id,
    pageSlug: page.slug,
    projectSlug: project.slug,
  };
}

function cleanBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_FEEDBACK_LEN) return trimmed.slice(0, MAX_FEEDBACK_LEN);
  return trimmed;
}

function normalizeStatus(raw: unknown): DeliverableStatus | null {
  return typeof raw === "string" &&
    (DELIVERABLE_STATUSES as readonly string[]).includes(raw)
    ? (raw as DeliverableStatus)
    : null;
}

// ─── Post feedback client ───────────────────────────────────────────────────

export type PostClientFeedbackResult =
  | { ok: true; feedbackId: string }
  | { ok: false; error: string };

/**
 * Poste un message du client dans le thread d'un livrable.
 * Optionnellement, met à jour le statut du livrable au passage (approve /
 * request changes). Le statut "pending" ne peut pas être re-set par le client
 * (c'est l'état initial, et le retour à "pending" est réservé à l'owner via
 * resetDeliverableStatus si besoin plus tard).
 */
export async function postClientFeedback(input: {
  clientSlug: string;
  deliverableId: string;
  body: string;
  newStatus?: "approved" | "changes_requested" | null;
}): Promise<PostClientFeedbackResult> {
  const auth = await requireUnlocked(input.clientSlug);
  if (!auth.ok) return auth;
  if (!UUID_REGEX.test(input.deliverableId)) {
    return { ok: false, error: "Livrable invalide." };
  }
  const body = cleanBody(input.body);
  if (!body) return { ok: false, error: "Message vide." };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Configuration serveur manquante." };
  }
  const admin = createAdminClient();

  const scope = await ensureDeliverableInClientScope(
    admin,
    auth.profileId,
    input.deliverableId,
  );
  if (!scope.ok) return scope;

  const { data: inserted, error: insertError } = await admin
    .from("client_deliverable_feedback" as never)
    .insert({
      deliverable_id: input.deliverableId,
      author_kind: "client",
      body,
    } as never)
    .select("id")
    .single<{ id: string }>();
  if (insertError || !inserted) {
    console.error("[postClientFeedback] insert error:", insertError);
    return {
      ok: false,
      error: insertError?.message ?? "Envoi impossible.",
    };
  }

  // Si on change le statut au passage, on l'écrit après. Si ça échoue, le
  // commentaire reste posté (cohérent avec « envoyer le message » comme
  // action principale).
  if (input.newStatus) {
    const status = normalizeStatus(input.newStatus);
    if (status === "approved" || status === "changes_requested") {
      const { error: statusError } = await admin
        .from("client_page_deliverables" as never)
        .update({ status } as never)
        .eq("id", input.deliverableId);
      if (statusError) {
        console.error("[postClientFeedback] status update error:", statusError);
      }
    }
  }

  revalidatePath(
    `/clients/${input.clientSlug}/${scope.projectSlug}/${scope.pageSlug}`,
  );
  return { ok: true, feedbackId: inserted.id };
}

// ─── Mise à jour de statut sans poster un message ──────────────────────────

export type SetDeliverableStatusResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setDeliverableStatusByClient(input: {
  clientSlug: string;
  deliverableId: string;
  status: "approved" | "changes_requested";
}): Promise<SetDeliverableStatusResult> {
  const auth = await requireUnlocked(input.clientSlug);
  if (!auth.ok) return auth;
  if (!UUID_REGEX.test(input.deliverableId)) {
    return { ok: false, error: "Livrable invalide." };
  }
  const status = normalizeStatus(input.status);
  if (status !== "approved" && status !== "changes_requested") {
    return { ok: false, error: "Statut invalide." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Configuration serveur manquante." };
  }
  const admin = createAdminClient();

  const scope = await ensureDeliverableInClientScope(
    admin,
    auth.profileId,
    input.deliverableId,
  );
  if (!scope.ok) return scope;

  const { error } = await admin
    .from("client_page_deliverables" as never)
    .update({ status } as never)
    .eq("id", input.deliverableId);
  if (error) {
    console.error("[setDeliverableStatusByClient] update error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath(
    `/clients/${input.clientSlug}/${scope.projectSlug}/${scope.pageSlug}`,
  );
  return { ok: true };
}
