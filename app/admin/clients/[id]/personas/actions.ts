"use server";
import { revalidateClientPath } from "@/lib/admin/resolve-client";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  PERSONA_PATCHABLE_FIELDS,
  type ClientPersonaPatch,
  type ClientPersonaRow,
} from "./_lib/persona-types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_TEXT_LEN = 4000;
const MAX_NAME_LEN = 120;
const MAX_PERSONAS = 50;

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
      error: "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local.",
    };
  }
  return { ok: true as const, admin: createAdminClient() };
}

async function ensureProfileExists(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, is_owner")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return { ok: false, error: "Client introuvable." };
  if (profile.is_owner) {
    return { ok: false, error: "Pas de personas sur le profil owner." };
  }
  return { ok: true };
}

/**
 * Sanitize une valeur de champ texte côté patch : trim, null si vide, cap
 * à MAX_TEXT_LEN. Ne touche pas à `age` ni à `name` (gérés à part).
 */
function sanitizeText(raw: unknown): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_TEXT_LEN) return trimmed.slice(0, MAX_TEXT_LEN);
  return trimmed;
}

function sanitizeName(raw: unknown): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_NAME_LEN) return trimmed.slice(0, MAX_NAME_LEN);
  return trimmed;
}

function sanitizeAge(raw: unknown): number | null | "invalid" {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n)) return "invalid";
  const int = Math.trunc(n);
  if (int < 0 || int > 150) return "invalid";
  return int;
}

// ============================================================================
// CRUD personas
// ============================================================================

export type CreatePersonaResult =
  | { ok: true; personaId: string }
  | { ok: false; error: string };

export async function createPersona(input: {
  profileId: string;
}): Promise<CreatePersonaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  const own = await ensureProfileExists(auth.admin, input.profileId);
  if (!own.ok) return { ok: false, error: own.error };

  // Cap dur sur le nombre de personas par client.
  const { count } = await auth.admin
    .from("client_personas" as never)
    .select("id", { count: "exact", head: true })
    .eq("profile_id", input.profileId);
  if ((count ?? 0) >= MAX_PERSONAS) {
    return {
      ok: false,
      error: `Limite atteinte (${MAX_PERSONAS} personas max par client).`,
    };
  }

  // Position : à la fin.
  const { data: maxRow } = await auth.admin
    .from("client_personas" as never)
    .select("position")
    .eq("profile_id", input.profileId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<ClientPersonaRow, "position">>();
  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data: inserted, error } = await auth.admin
    .from("client_personas" as never)
    .insert({
      profile_id: input.profileId,
      position: nextPosition,
    } as never)
    .select("id")
    .single<{ id: string }>();
  if (error || !inserted) {
    console.error("[createPersona] insert error:", error);
    return { ok: false, error: error?.message ?? "Création impossible." };
  }
  await revalidateClientPath(input.profileId, `/personas`);
  return { ok: true, personaId: inserted.id };
}

export type UpdatePersonaResult = { ok: true } | { ok: false; error: string };

/**
 * Patch partiel d'un persona. Filtre les champs reçus contre la whitelist
 * `PERSONA_PATCHABLE_FIELDS` — pas moyen de patcher profile_id, position,
 * created_at, etc. depuis ici.
 */
export async function updatePersona(input: {
  profileId: string;
  personaId: string;
  patch: Record<string, unknown>;
}): Promise<UpdatePersonaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.personaId)) {
    return { ok: false, error: "Persona invalide." };
  }
  if (!input.patch || typeof input.patch !== "object") {
    return { ok: false, error: "Patch invalide." };
  }

  const clean: ClientPersonaPatch = {};
  for (const field of PERSONA_PATCHABLE_FIELDS) {
    if (!(field in input.patch)) continue;
    const raw = input.patch[field];

    if (field === "name") {
      const v = sanitizeName(raw);
      if (!v) {
        return { ok: false, error: "Le nom du persona est requis." };
      }
      clean.name = v;
      continue;
    }

    if (field === "age") {
      const v = sanitizeAge(raw);
      if (v === "invalid") {
        return { ok: false, error: "Âge invalide (0–150)." };
      }
      clean.age = v;
      continue;
    }

    clean[field] = sanitizeText(raw);
  }

  if (Object.keys(clean).length === 0) {
    return { ok: false, error: "Rien à mettre à jour." };
  }

  const { error } = await auth.admin
    .from("client_personas" as never)
    .update(clean as never)
    .eq("id", input.personaId)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[updatePersona] update error:", error);
    return { ok: false, error: error.message };
  }
  await revalidateClientPath(input.profileId, `/personas`);
  return { ok: true };
}

export type DeletePersonaResult = { ok: true } | { ok: false; error: string };

export async function deletePersona(input: {
  profileId: string;
  personaId: string;
}): Promise<DeletePersonaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.personaId)) {
    return { ok: false, error: "Persona invalide." };
  }

  const { error } = await auth.admin
    .from("client_personas" as never)
    .delete()
    .eq("id", input.personaId)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[deletePersona] delete error:", error);
    return { ok: false, error: error.message };
  }
  await revalidateClientPath(input.profileId, `/personas`);
  return { ok: true };
}

// ============================================================================
// Settings de publication (profile-level)
// ============================================================================

export type SetPersonasPublishedResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setPersonasPublished(input: {
  profileId: string;
  published: boolean;
}): Promise<SetPersonasPublishedResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  const own = await ensureProfileExists(auth.admin, input.profileId);
  if (!own.ok) return { ok: false, error: own.error };

  const { error } = await auth.admin
    .from("profiles")
    .update({ personas_published: input.published } as never)
    .eq("id", input.profileId);
  if (error) {
    console.error("[setPersonasPublished] update error:", error);
    return { ok: false, error: error.message };
  }
  await revalidateClientPath(input.profileId, `/personas`);
  return { ok: true };
}

export type PersonasProjectPinResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Vérifie que `projectId` appartient bien à `profileId`. Mutualisé pour
 * add/remove — un user qui malicieusement passe un projet d'un autre
 * client n'obtient rien.
 */
async function ensureProjectBelongsToClient(
  admin: ReturnType<typeof createAdminClient>,
  profileId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: project } = await admin
    .from("projects")
    .select("id, profile_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project || project.profile_id !== profileId) {
    return { ok: false, error: "Projet introuvable pour ce client." };
  }
  return { ok: true };
}

export async function addPersonasProjectPin(input: {
  profileId: string;
  projectId: string;
}): Promise<PersonasProjectPinResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.projectId)) {
    return { ok: false, error: "Projet invalide." };
  }
  const own = await ensureProfileExists(auth.admin, input.profileId);
  if (!own.ok) return { ok: false, error: own.error };
  const owns = await ensureProjectBelongsToClient(
    auth.admin,
    input.profileId,
    input.projectId,
  );
  if (!owns.ok) return owns;

  // Upsert pour idempotence : si la ligne existe déjà, no-op.
  const { error } = await auth.admin
    .from("client_personas_project_pins" as never)
    .upsert(
      { profile_id: input.profileId, project_id: input.projectId } as never,
      { onConflict: "profile_id,project_id" },
    );
  if (error) {
    console.error("[addPersonasProjectPin] upsert error:", error);
    return { ok: false, error: error.message };
  }
  await revalidateClientPath(input.profileId, `/personas`);
  return { ok: true };
}

export async function removePersonasProjectPin(input: {
  profileId: string;
  projectId: string;
}): Promise<PersonasProjectPinResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.projectId)) {
    return { ok: false, error: "Projet invalide." };
  }
  const own = await ensureProfileExists(auth.admin, input.profileId);
  if (!own.ok) return { ok: false, error: own.error };

  const { error } = await auth.admin
    .from("client_personas_project_pins" as never)
    .delete()
    .eq("profile_id", input.profileId)
    .eq("project_id", input.projectId);
  if (error) {
    console.error("[removePersonasProjectPin] delete error:", error);
    return { ok: false, error: error.message };
  }
  await revalidateClientPath(input.profileId, `/personas`);
  return { ok: true };
}

export type SetPersonaCoverResult = { ok: true } | { ok: false; error: string };

/**
 * Définit (ou retire si mediaId = null) le visuel affiché en card preview
 * du persona dans la liste.
 *
 * Validations :
 * - le persona appartient au client (filtre profile_id côté update)
 * - le média existe, appartient au même client, ET est actuellement tagué
 *   sur ce persona (sinon ça n'a pas de sens de l'utiliser comme cover)
 */
export async function setPersonaCover(input: {
  profileId: string;
  personaId: string;
  mediaId: string | null;
}): Promise<SetPersonaCoverResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.personaId)) {
    return { ok: false, error: "Persona invalide." };
  }
  if (input.mediaId !== null && !UUID_REGEX.test(input.mediaId)) {
    return { ok: false, error: "Média invalide." };
  }

  if (input.mediaId !== null) {
    const { data: media } = await auth.admin
      .from("client_media" as never)
      .select("id, profile_id, persona_id")
      .eq("id", input.mediaId)
      .maybeSingle<{
        id: string;
        profile_id: string;
        persona_id: string | null;
      }>();
    if (!media || media.profile_id !== input.profileId) {
      return { ok: false, error: "Média introuvable pour ce client." };
    }
    if (media.persona_id !== input.personaId) {
      return {
        ok: false,
        error: "Le média doit d'abord être taggé sur ce persona.",
      };
    }
  }

  const { error } = await auth.admin
    .from("client_personas" as never)
    .update({ cover_media_id: input.mediaId } as never)
    .eq("id", input.personaId)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[setPersonaCover] update error:", error);
    return { ok: false, error: error.message };
  }
  await revalidateClientPath(input.profileId, `/personas`);
  await revalidateClientPath(input.profileId, `/personas/${input.personaId}`);
  return { ok: true };
}

export type ReorderPersonasResult = { ok: true } | { ok: false; error: string };

export async function reorderPersonas(input: {
  profileId: string;
  personaIds: string[];
}): Promise<ReorderPersonasResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!Array.isArray(input.personaIds) || input.personaIds.length === 0) {
    return { ok: false, error: "Liste vide." };
  }
  if (input.personaIds.length > MAX_PERSONAS) {
    return {
      ok: false,
      error: `Trop de personas (max ${MAX_PERSONAS}).`,
    };
  }
  if (!input.personaIds.every((id) => UUID_REGEX.test(id))) {
    return { ok: false, error: "Identifiant invalide." };
  }
  if (new Set(input.personaIds).size !== input.personaIds.length) {
    return { ok: false, error: "Doublons dans la liste." };
  }

  for (let i = 0; i < input.personaIds.length; i++) {
    const { error } = await auth.admin
      .from("client_personas" as never)
      .update({ position: i } as never)
      .eq("id", input.personaIds[i])
      .eq("profile_id", input.profileId);
    if (error) {
      console.error("[reorderPersonas] update error:", error);
      return { ok: false, error: error.message };
    }
  }
  await revalidateClientPath(input.profileId, `/personas`);
  return { ok: true };
}
