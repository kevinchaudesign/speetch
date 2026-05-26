"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { MediaFolderRow, MediaRow } from "./_lib/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const BUCKET = "page-media";
const STORAGE_PREFIX = "clients";
const MAX_NAME_LEN = 80;

// Limites par type. On reste large mais on cap pour éviter qu'un upload
// pète la requête (Hostinger / Supabase ont leur propre limite côté infra).
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
]);

const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg", // MP3
  "audio/mp4", // M4A (mp4 audio container)
  "audio/x-m4a",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/webm",
]);

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
): Promise<
  | { ok: true; isOwner: boolean }
  | { ok: false; error: string }
> {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, is_owner")
    .eq("id", profileId)
    .maybeSingle<{ id: string; is_owner: boolean }>();
  if (!profile) return { ok: false, error: "Client introuvable." };
  return { ok: true, isOwner: !!profile.is_owner };
}

function normalizeName(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_NAME_LEN) return trimmed.slice(0, MAX_NAME_LEN);
  return trimmed;
}

function cleanExt(filename: string, mime: string): string {
  const extMatch = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (extMatch) return extMatch[1];
  if (mime === "image/svg+xml") return "svg";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "audio/mpeg") return "mp3";
  if (mime === "audio/x-m4a" || mime === "audio/mp4") return "m4a";
  if (mime === "audio/wav" || mime === "audio/wave" || mime === "audio/x-wav")
    return "wav";
  return mime.split("/").pop() ?? "bin";
}

function cleanBaseName(filename: string): string {
  const noExt = filename.replace(/\.[a-z0-9]+$/i, "");
  return (
    noExt
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "media"
  );
}

// ============================================================================
// Conversion AVIF — toutes les images bitmap uploadées sont ré-encodées en
// AVIF avant stockage. L'original n'est jamais persisté dans le bucket.
// SVG (vecteur) et GIF (animation) sont préservés tels quels.
// ============================================================================

const AVIF_QUALITY = 55; // 50–60 = excellent rapport qualité/poids photo
const AVIF_EFFORT = 4; // 0=rapide / 9=lent. 4 = default sharp, bon compromis.

const AVIF_SKIP_MIMES = new Set<string>(["image/svg+xml", "image/gif"]);

type AvifConversion =
  | {
      converted: true;
      buffer: Buffer;
      size: number;
      width: number | null;
      height: number | null;
    }
  | { converted: false };

async function convertImageToAvif(
  input: ArrayBuffer,
  sourceMime: string,
): Promise<AvifConversion> {
  if (AVIF_SKIP_MIMES.has(sourceMime)) return { converted: false };
  try {
    // .rotate() applique l'orientation EXIF avant l'encodage AVIF, sinon
    // les photos prises au téléphone ressortent tournées.
    const buffer = await sharp(Buffer.from(input))
      .rotate()
      .avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT })
      .toBuffer();
    const meta = await sharp(buffer).metadata();
    return {
      converted: true,
      buffer,
      size: buffer.byteLength,
      width: meta.width ?? null,
      height: meta.height ?? null,
    };
  } catch (err) {
    console.error("[convertImageToAvif] failed:", err);
    return { converted: false };
  }
}

// ============================================================================
// Folders CRUD
// ============================================================================

export type CreateMediaFolderResult =
  | { ok: true; folderId: string }
  | { ok: false; error: string };

export async function createMediaFolder(input: {
  profileId: string;
  name: string;
  /** ID du dossier parent (null/undefined = top-level). Profondeur max = 1 :
   *  un dossier qui a déjà un parent ne peut pas être parent d'un autre. */
  parentId?: string | null;
}): Promise<CreateMediaFolderResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  const name = normalizeName(input.name);
  if (!name) return { ok: false, error: "Le nom du dossier est requis." };

  const parentId =
    input.parentId === undefined || input.parentId === null
      ? null
      : input.parentId;
  if (parentId !== null && !UUID_REGEX.test(parentId)) {
    return { ok: false, error: "Dossier parent invalide." };
  }

  const own = await ensureProfileExists(auth.admin, input.profileId);
  if (!own.ok) return { ok: false, error: own.error };

  // Valide le parent : même profile + lui-même top-level (max depth = 1).
  if (parentId !== null) {
    const { data: parent } = await auth.admin
      .from("client_media_folders" as never)
      .select("id, profile_id, parent_id")
      .eq("id", parentId)
      .maybeSingle<Pick<MediaFolderRow, "id" | "profile_id" | "parent_id">>();
    if (!parent || parent.profile_id !== input.profileId) {
      return { ok: false, error: "Dossier parent introuvable." };
    }
    if (parent.parent_id !== null) {
      return {
        ok: false,
        error: "Un sous-dossier ne peut pas contenir d'autres sous-dossiers.",
      };
    }
  }

  // Position : on push à la fin de la "vue" (parent_id). Top-level = parent_id NULL,
  // sous-dossier = même parent_id.
  let query = auth.admin
    .from("client_media_folders" as never)
    .select("position")
    .eq("profile_id", input.profileId);
  query = parentId === null ? query.is("parent_id", null) : query.eq("parent_id", parentId);
  const { data: maxRow } = await query
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<MediaFolderRow, "position">>();
  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data: inserted, error } = await auth.admin
    .from("client_media_folders" as never)
    .insert({
      profile_id: input.profileId,
      name,
      position: nextPosition,
      parent_id: parentId,
    } as never)
    .select("id")
    .single<{ id: string }>();
  if (error || !inserted) {
    console.error("[createMediaFolder] insert error:", error);
    return { ok: false, error: error?.message ?? "Création impossible." };
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true, folderId: inserted.id };
}

export type RenameMediaFolderResult = { ok: true } | { ok: false; error: string };

export async function renameMediaFolder(input: {
  profileId: string;
  folderId: string;
  name: string;
}): Promise<RenameMediaFolderResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.folderId)) {
    return { ok: false, error: "Dossier invalide." };
  }
  const name = normalizeName(input.name);
  if (!name) return { ok: false, error: "Le nom du dossier est requis." };

  const { error } = await auth.admin
    .from("client_media_folders" as never)
    .update({ name } as never)
    .eq("id", input.folderId)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[renameMediaFolder] update error:", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true };
}

export type DeleteMediaFolderResult = { ok: true } | { ok: false; error: string };

export async function deleteMediaFolder(input: {
  profileId: string;
  folderId: string;
}): Promise<DeleteMediaFolderResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.folderId)) {
    return { ok: false, error: "Dossier invalide." };
  }

  // Le ON DELETE SET NULL côté FK ramène les médias en "Hors dossier"
  // automatiquement — pas besoin de toucher au Storage.
  const { error } = await auth.admin
    .from("client_media_folders" as never)
    .delete()
    .eq("id", input.folderId)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[deleteMediaFolder] delete error:", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true };
}

export type ReorderMediaFoldersResult =
  | { ok: true }
  | { ok: false; error: string };

export async function reorderMediaFolders(input: {
  profileId: string;
  folderIds: string[];
}): Promise<ReorderMediaFoldersResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!Array.isArray(input.folderIds) || input.folderIds.length === 0) {
    return { ok: false, error: "Liste vide." };
  }
  if (input.folderIds.length > 200) {
    return { ok: false, error: "Trop de dossiers (max 200)." };
  }
  if (!input.folderIds.every((id) => UUID_REGEX.test(id))) {
    return { ok: false, error: "Identifiant invalide." };
  }
  if (new Set(input.folderIds).size !== input.folderIds.length) {
    return { ok: false, error: "Doublons dans la liste." };
  }

  for (let i = 0; i < input.folderIds.length; i++) {
    const { error } = await auth.admin
      .from("client_media_folders" as never)
      .update({ position: i } as never)
      .eq("id", input.folderIds[i])
      .eq("profile_id", input.profileId);
    if (error) {
      console.error("[reorderMediaFolders] update error:", error);
      return { ok: false, error: error.message };
    }
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true };
}

// ============================================================================
// Media files
// ============================================================================

export type UploadClientMediaResult =
  | { ok: true; mediaId: string; storagePath: string; publicUrl: string }
  | { ok: false; error: string };

/**
 * Upload un fichier (image ou vidéo) dans le bucket page-media sous
 * `clients/{profileId}/...` et insère la ligne correspondante en base.
 * Le `folder_id` est optionnel (champ du form `folder_id`).
 */
export async function uploadClientMedia(
  formData: FormData,
): Promise<UploadClientMediaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const profileId = String(formData.get("profile_id") ?? "").trim();
  if (!UUID_REGEX.test(profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  const folderIdRaw = String(formData.get("folder_id") ?? "").trim();
  const folderId =
    folderIdRaw === "" || folderIdRaw === "null" ? null : folderIdRaw;
  if (folderId !== null && !UUID_REGEX.test(folderId)) {
    return { ok: false, error: "Dossier invalide." };
  }

  const own = await ensureProfileExists(auth.admin, profileId);
  if (!own.ok) return { ok: false, error: own.error };

  if (folderId !== null) {
    const { data: folder } = await auth.admin
      .from("client_media_folders" as never)
      .select("id, profile_id")
      .eq("id", folderId)
      .maybeSingle<Pick<MediaFolderRow, "id" | "profile_id">>();
    if (!folder || folder.profile_id !== profileId) {
      return { ok: false, error: "Dossier introuvable pour ce client." };
    }
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier reçu." };
  }
  const isImage = ALLOWED_IMAGE_TYPES.has(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);
  const isAudio = ALLOWED_AUDIO_TYPES.has(file.type);
  if (!isImage && !isVideo && !isAudio) {
    return {
      ok: false,
      error: `Format non supporté (${file.type || "inconnu"}).`,
    };
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: "Image trop volumineuse (max 20 MB)." };
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { ok: false, error: "Vidéo trop volumineuse (max 200 MB)." };
  }
  if (isAudio && file.size > MAX_AUDIO_SIZE) {
    return { ok: false, error: "Audio trop volumineux (max 50 MB)." };
  }

  const arrayBuffer = await file.arrayBuffer();

  // Conversion AVIF pour les images bitmap (PNG, JPEG, WEBP, AVIF source).
  // SVG et GIF passent tel quel (vecteur / animation). L'original n'est
  // jamais persisté dans le bucket — seul le AVIF résultant est stocké.
  let storedBuffer: ArrayBuffer | Buffer = arrayBuffer;
  let storedMime = file.type;
  let storedSize = file.size;
  let storedWidth: number | null = null;
  let storedHeight: number | null = null;
  let storedExt = cleanExt(file.name || "media", file.type);
  let storedFilename = file.name || `media.${storedExt}`;

  // Conversion AVIF réservée à la médiathèque studio (profil owner).
  // Les Holocrons clients gardent les originaux : ils servent de livraison
  // fidèle, pas de vitrine optimisée.
  if (isImage && own.isOwner) {
    const conv = await convertImageToAvif(arrayBuffer, file.type);
    if (conv.converted) {
      storedBuffer = conv.buffer;
      storedMime = "image/avif";
      storedSize = conv.size;
      storedWidth = conv.width;
      storedHeight = conv.height;
      storedExt = "avif";
      // Swap d'extension sur le nom affiché : "Photo.HEIC" → "Photo.avif".
      storedFilename = storedFilename.replace(/\.[a-z0-9]+$/i, ".avif");
      if (!/\.avif$/i.test(storedFilename)) storedFilename += ".avif";
    }
  }

  // Path : clients/{profileId}/{timestamp}-{slugified-name}.{ext}
  const base = cleanBaseName(file.name || "media");
  const storagePath = `${STORAGE_PREFIX}/${profileId}/${Date.now()}-${base}.${storedExt}`;

  const { error: uploadError } = await auth.admin.storage
    .from(BUCKET)
    .upload(storagePath, storedBuffer, {
      contentType: storedMime,
      upsert: false,
    });
  if (uploadError) {
    console.error("[uploadClientMedia] upload error:", uploadError);
    return { ok: false, error: uploadError.message };
  }

  // Position : on push à la fin de la "vue" (profile_id + folder_id)
  const { data: maxRow } = await auth.admin
    .from("client_media" as never)
    .select("position")
    .eq("profile_id", profileId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<MediaRow, "position">>();
  const nextPosition = (maxRow?.position ?? -1) + 1;

  const { data: inserted, error: insertError } = await auth.admin
    .from("client_media" as never)
    .insert({
      profile_id: profileId,
      folder_id: folderId,
      filename: storedFilename,
      storage_path: storagePath,
      mime_type: storedMime,
      size_bytes: storedSize,
      width: storedWidth,
      height: storedHeight,
      position: nextPosition,
    } as never)
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
    // Rollback storage
    await auth.admin.storage.from(BUCKET).remove([storagePath]);
    console.error("[uploadClientMedia] insert error:", insertError);
    return {
      ok: false,
      error: insertError?.message ?? "Erreur d'insertion en base.",
    };
  }

  const { data: pub } = auth.admin.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  revalidatePath(`/admin/clients/${profileId}/media`);
  return {
    ok: true,
    mediaId: inserted.id,
    storagePath,
    publicUrl: pub.publicUrl,
  };
}

export type DeleteClientMediaResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteClientMedia(input: {
  profileId: string;
  mediaId: string;
}): Promise<DeleteClientMediaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.mediaId)) {
    return { ok: false, error: "Média invalide." };
  }

  const { data: row } = await auth.admin
    .from("client_media" as never)
    .select("id, profile_id, storage_path")
    .eq("id", input.mediaId)
    .maybeSingle<Pick<MediaRow, "id" | "profile_id" | "storage_path">>();
  if (!row || row.profile_id !== input.profileId) {
    return { ok: false, error: "Média introuvable." };
  }

  const { error: removeError } = await auth.admin.storage
    .from(BUCKET)
    .remove([row.storage_path]);
  if (removeError) {
    console.error("[deleteClientMedia] storage error:", removeError);
    // On continue quand même : on préfère un orphan storage qu'une ligne
    // DB qui pointe sur un fichier disparu côté UI.
  }

  const { error } = await auth.admin
    .from("client_media" as never)
    .delete()
    .eq("id", input.mediaId);
  if (error) {
    console.error("[deleteClientMedia] delete error:", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true };
}

export type MoveMediaToFolderResult =
  | { ok: true }
  | { ok: false; error: string };

export async function moveMediaToFolder(input: {
  profileId: string;
  mediaId: string;
  folderId: string | null;
}): Promise<MoveMediaToFolderResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.mediaId)) {
    return { ok: false, error: "Média invalide." };
  }
  if (input.folderId !== null && !UUID_REGEX.test(input.folderId)) {
    return { ok: false, error: "Dossier invalide." };
  }

  if (input.folderId !== null) {
    const { data: folder } = await auth.admin
      .from("client_media_folders" as never)
      .select("id, profile_id")
      .eq("id", input.folderId)
      .maybeSingle<Pick<MediaFolderRow, "id" | "profile_id">>();
    if (!folder || folder.profile_id !== input.profileId) {
      return { ok: false, error: "Dossier introuvable pour ce client." };
    }
  }

  const { error } = await auth.admin
    .from("client_media" as never)
    .update({ folder_id: input.folderId } as never)
    .eq("id", input.mediaId)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[moveMediaToFolder] update error:", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true };
}

// ============================================================================
// Actions groupées (multi-sélection)
// ============================================================================

export type BatchMediaResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

const MAX_BATCH_SIZE = 200;

function validateMediaIds(
  mediaIds: unknown,
): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
    return { ok: false, error: "Aucun média sélectionné." };
  }
  if (mediaIds.length > MAX_BATCH_SIZE) {
    return { ok: false, error: `Trop de médias (max ${MAX_BATCH_SIZE}).` };
  }
  const ids: string[] = [];
  for (const id of mediaIds) {
    if (typeof id !== "string" || !UUID_REGEX.test(id)) {
      return { ok: false, error: "Identifiant invalide dans la sélection." };
    }
    ids.push(id);
  }
  // Déduplique au cas où.
  return { ok: true, ids: Array.from(new Set(ids)) };
}

/**
 * Supprime plusieurs médias en une fois. Effectue d'abord la suppression
 * dans le bucket Storage (en une seule requête `.remove([paths])`), puis
 * la suppression DB en une seule requête `.delete().in("id", ids)`.
 *
 * On filtre côté DB sur `profile_id` pour empêcher la suppression croisée
 * — même si un media_id appartient à un autre client, il ne sera pas
 * supprimé.
 */
export async function deleteClientMediaBatch(input: {
  profileId: string;
  mediaIds: string[];
}): Promise<BatchMediaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  const validated = validateMediaIds(input.mediaIds);
  if (!validated.ok) return validated;
  const ids = validated.ids;

  // Récupère les storage_path uniquement pour les médias qui appartiennent
  // vraiment au client.
  const { data: rows, error: fetchError } = await auth.admin
    .from("client_media" as never)
    .select("id, storage_path")
    .in("id", ids)
    .eq("profile_id", input.profileId)
    .returns<Array<Pick<MediaRow, "id" | "storage_path">>>();
  if (fetchError) {
    console.error("[deleteClientMediaBatch] fetch error:", fetchError);
    return { ok: false, error: fetchError.message };
  }
  if (!rows || rows.length === 0) {
    return { ok: false, error: "Aucun média trouvé pour ce client." };
  }

  const validIds = rows.map((r) => r.id);
  const paths = rows.map((r) => r.storage_path);

  // Supprime du Storage (échec non bloquant : on préfère un orphelin storage
  // qu'une ligne DB cassée).
  const { error: storageError } = await auth.admin.storage
    .from(BUCKET)
    .remove(paths);
  if (storageError) {
    console.error("[deleteClientMediaBatch] storage error:", storageError);
  }

  const { error: dbError } = await auth.admin
    .from("client_media" as never)
    .delete()
    .in("id", validIds)
    .eq("profile_id", input.profileId);
  if (dbError) {
    console.error("[deleteClientMediaBatch] db error:", dbError);
    return { ok: false, error: dbError.message };
  }

  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true, count: validIds.length };
}

/**
 * Déplace plusieurs médias vers un dossier (ou « hors dossier » si null)
 * en une seule requête DB.
 */
export async function moveClientMediaBatch(input: {
  profileId: string;
  mediaIds: string[];
  folderId: string | null;
}): Promise<BatchMediaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  const validated = validateMediaIds(input.mediaIds);
  if (!validated.ok) return validated;
  const ids = validated.ids;

  if (input.folderId !== null) {
    if (!UUID_REGEX.test(input.folderId)) {
      return { ok: false, error: "Dossier invalide." };
    }
    const { data: folder } = await auth.admin
      .from("client_media_folders" as never)
      .select("id, profile_id")
      .eq("id", input.folderId)
      .maybeSingle<Pick<MediaFolderRow, "id" | "profile_id">>();
    if (!folder || folder.profile_id !== input.profileId) {
      return { ok: false, error: "Dossier introuvable pour ce client." };
    }
  }

  const { error, count } = await auth.admin
    .from("client_media" as never)
    .update({ folder_id: input.folderId } as never, { count: "exact" })
    .in("id", ids)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[moveClientMediaBatch] update error:", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true, count: count ?? ids.length };
}

export type SetMediaPersonaResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Tagge un média avec un persona (ou retire le tag si personaId = null).
 * Vérifie côté serveur que le persona appartient bien au même client — la FK
 * DB ne contraint pas cette cohérence cross-table.
 */
export async function setMediaPersona(input: {
  profileId: string;
  mediaId: string;
  personaId: string | null;
}): Promise<SetMediaPersonaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.mediaId)) {
    return { ok: false, error: "Média invalide." };
  }
  if (input.personaId !== null && !UUID_REGEX.test(input.personaId)) {
    return { ok: false, error: "Persona invalide." };
  }

  if (input.personaId !== null) {
    const { data: persona } = await auth.admin
      .from("client_personas" as never)
      .select("id, profile_id")
      .eq("id", input.personaId)
      .maybeSingle<{ id: string; profile_id: string }>();
    if (!persona || persona.profile_id !== input.profileId) {
      return { ok: false, error: "Persona introuvable pour ce client." };
    }
  }

  const { error } = await auth.admin
    .from("client_media" as never)
    .update({ persona_id: input.personaId } as never)
    .eq("id", input.mediaId)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[setMediaPersona] update error:", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true };
}

export type SetMediaFolderCoverResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Désigne une image comme aperçu d'un dossier (ou retire l'aperçu si mediaId = null).
 * L'image doit appartenir au même client ; pas obligée d'être dans le dossier
 * (volontairement souple — un dossier "Covers" peut alimenter d'autres dossiers).
 */
export async function setMediaFolderCover(input: {
  profileId: string;
  folderId: string;
  mediaId: string | null;
}): Promise<SetMediaFolderCoverResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.folderId)) {
    return { ok: false, error: "Dossier invalide." };
  }
  if (input.mediaId !== null && !UUID_REGEX.test(input.mediaId)) {
    return { ok: false, error: "Média invalide." };
  }

  // Vérifie que le dossier appartient au client.
  const { data: folder } = await auth.admin
    .from("client_media_folders" as never)
    .select("id, profile_id")
    .eq("id", input.folderId)
    .maybeSingle<Pick<MediaFolderRow, "id" | "profile_id">>();
  if (!folder || folder.profile_id !== input.profileId) {
    return { ok: false, error: "Dossier introuvable." };
  }

  // Vérifie que le média (si fourni) appartient au même client et est une image.
  if (input.mediaId !== null) {
    const { data: media } = await auth.admin
      .from("client_media" as never)
      .select("id, profile_id, mime_type")
      .eq("id", input.mediaId)
      .maybeSingle<Pick<MediaRow, "id" | "profile_id" | "mime_type">>();
    if (!media || media.profile_id !== input.profileId) {
      return { ok: false, error: "Média introuvable pour ce client." };
    }
    if (!media.mime_type.startsWith("image/")) {
      return { ok: false, error: "L'aperçu doit être une image." };
    }
  }

  const { error } = await auth.admin
    .from("client_media_folders" as never)
    .update({ cover_media_id: input.mediaId } as never)
    .eq("id", input.folderId)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[setMediaFolderCover] update error:", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true };
}

export type RenameClientMediaResult =
  | { ok: true }
  | { ok: false; error: string };

export async function renameClientMedia(input: {
  profileId: string;
  mediaId: string;
  filename: string;
}): Promise<RenameClientMediaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.profileId)) {
    return { ok: false, error: "Client invalide." };
  }
  if (!UUID_REGEX.test(input.mediaId)) {
    return { ok: false, error: "Média invalide." };
  }
  const filename = normalizeName(input.filename);
  if (!filename) return { ok: false, error: "Nom requis." };

  const { error } = await auth.admin
    .from("client_media" as never)
    .update({ filename } as never)
    .eq("id", input.mediaId)
    .eq("profile_id", input.profileId);
  if (error) {
    console.error("[renameClientMedia] update error:", error);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/clients/${input.profileId}/media`);
  return { ok: true };
}
