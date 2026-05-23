"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { TodoListRow, TodoNoteRow } from "./_lib/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NOTE_LENGTH = 100_000; // 100 KB de texte
const MAX_LIST_NAME = 80;

type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: string };

async function requireOwnerProfile(): Promise<
  | { ok: true; admin: ReturnType<typeof createAdminClient>; profileId: string }
  | Err
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnecte-toi." };

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false, error: "Accès réservé au propriétaire." };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manquant." };
  }

  const admin = createAdminClient();
  const { data: owner, error } = await admin
    .from("profiles")
    .select("id")
    .eq("is_owner", true)
    .maybeSingle();
  if (error || !owner) {
    return { ok: false, error: "Profil owner introuvable." };
  }
  return { ok: true, admin, profileId: owner.id };
}

function bumpRevalidation() {
  revalidatePath("/admin/todo");
}

/* ─── Listes (dossiers) ─────────────────────────────────────────────────── */

export async function createTodoList(
  name?: string,
): Promise<Ok<{ list: TodoListRow }> | Err> {
  const auth = await requireOwnerProfile();
  if (!auth.ok) return auth;

  const finalName = (name ?? "").trim().slice(0, MAX_LIST_NAME) || "Nouvelle liste";

  const { data: maxRow } = await auth.admin
    .from("todo_lists" as never)
    .select("position")
    .eq("profile_id", auth.profileId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle<Pick<TodoListRow, "position">>();
  const position = (maxRow?.position ?? -1) + 1;

  const { data, error } = await auth.admin
    .from("todo_lists" as never)
    .insert({
      profile_id: auth.profileId,
      name: finalName,
      position,
    } as never)
    .select("*")
    .single<TodoListRow>();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Création impossible." };
  }
  bumpRevalidation();
  return { ok: true, list: data };
}

export async function renameTodoList(
  id: string,
  name: string,
): Promise<Ok<object> | Err> {
  if (!UUID_REGEX.test(id)) return { ok: false, error: "ID invalide." };
  const auth = await requireOwnerProfile();
  if (!auth.ok) return auth;

  const finalName = name.trim().slice(0, MAX_LIST_NAME);
  if (finalName.length === 0) {
    return { ok: false, error: "Nom requis." };
  }

  const { error } = await auth.admin
    .from("todo_lists" as never)
    .update({ name: finalName } as never)
    .eq("id", id)
    .eq("profile_id", auth.profileId);

  if (error) return { ok: false, error: error.message };
  bumpRevalidation();
  return { ok: true };
}

export async function deleteTodoList(id: string): Promise<Ok<object> | Err> {
  if (!UUID_REGEX.test(id)) return { ok: false, error: "ID invalide." };
  const auth = await requireOwnerProfile();
  if (!auth.ok) return auth;

  // Les notes du dossier sont automatiquement détachées (ON DELETE SET NULL).
  const { error } = await auth.admin
    .from("todo_lists" as never)
    .delete()
    .eq("id", id)
    .eq("profile_id", auth.profileId);

  if (error) return { ok: false, error: error.message };
  bumpRevalidation();
  return { ok: true };
}

/* ─── Notes ─────────────────────────────────────────────────────────────── */

export async function createTodoNote(
  listId: string | null,
): Promise<Ok<{ note: TodoNoteRow }> | Err> {
  const auth = await requireOwnerProfile();
  if (!auth.ok) return auth;
  if (listId !== null && !UUID_REGEX.test(listId)) {
    return { ok: false, error: "Liste invalide." };
  }

  const { data, error } = await auth.admin
    .from("todo_notes" as never)
    .insert({
      profile_id: auth.profileId,
      list_id: listId,
      content: "",
    } as never)
    .select("*")
    .single<TodoNoteRow>();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Création impossible." };
  }
  bumpRevalidation();
  return { ok: true, note: data };
}

export async function updateTodoNoteContent(
  id: string,
  content: string,
): Promise<Ok<object> | Err> {
  if (!UUID_REGEX.test(id)) return { ok: false, error: "ID invalide." };
  if (content.length > MAX_NOTE_LENGTH) {
    return { ok: false, error: "Note trop longue." };
  }
  const auth = await requireOwnerProfile();
  if (!auth.ok) return auth;

  const { error } = await auth.admin
    .from("todo_notes" as never)
    .update({ content } as never)
    .eq("id", id)
    .eq("profile_id", auth.profileId);

  if (error) return { ok: false, error: error.message };
  // Pas de revalidatePath ici : auto-save fréquent → on évite le revalidate
  // qui forcerait un re-fetch complet à chaque frappe.
  return { ok: true };
}

export async function toggleTodoNotePinned(
  id: string,
  isPinned: boolean,
): Promise<Ok<object> | Err> {
  if (!UUID_REGEX.test(id)) return { ok: false, error: "ID invalide." };
  const auth = await requireOwnerProfile();
  if (!auth.ok) return auth;

  const { error } = await auth.admin
    .from("todo_notes" as never)
    .update({ is_pinned: isPinned } as never)
    .eq("id", id)
    .eq("profile_id", auth.profileId);

  if (error) return { ok: false, error: error.message };
  bumpRevalidation();
  return { ok: true };
}

export async function moveTodoNoteToList(
  id: string,
  listId: string | null,
): Promise<Ok<object> | Err> {
  if (!UUID_REGEX.test(id)) return { ok: false, error: "ID invalide." };
  if (listId !== null && !UUID_REGEX.test(listId)) {
    return { ok: false, error: "Liste invalide." };
  }
  const auth = await requireOwnerProfile();
  if (!auth.ok) return auth;

  const { error } = await auth.admin
    .from("todo_notes" as never)
    .update({ list_id: listId } as never)
    .eq("id", id)
    .eq("profile_id", auth.profileId);

  if (error) return { ok: false, error: error.message };
  bumpRevalidation();
  return { ok: true };
}

/* ─── Médiathèque owner — pour l'insertion inline dans une note ────── */

export type OwnerMediaFolder = { id: string; name: string };
export type OwnerMediaItem = {
  id: string;
  folder_id: string | null;
  filename: string;
  mime_type: string;
  size_bytes: number;
  public_url: string;
};

const STORAGE_BUCKET = "page-media";

/**
 * Liste tous les médias du Maître (owner profile) avec leur public_url
 * et les dossiers, pour alimenter le picker inline de l'éditeur Tâches.
 */
export async function fetchOwnerMedia(): Promise<
  | { ok: true; folders: OwnerMediaFolder[]; items: OwnerMediaItem[] }
  | Err
> {
  const auth = await requireOwnerProfile();
  if (!auth.ok) return auth;

  const [foldersRes, itemsRes] = await Promise.all([
    auth.admin
      .from("client_media_folders" as never)
      .select("id, name, position")
      .eq("profile_id", auth.profileId)
      .order("position", { ascending: true })
      .returns<Array<{ id: string; name: string; position: number }>>(),
    auth.admin
      .from("client_media" as never)
      .select(
        "id, folder_id, filename, mime_type, size_bytes, storage_path, position, created_at",
      )
      .eq("profile_id", auth.profileId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<
        Array<{
          id: string;
          folder_id: string | null;
          filename: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
        }>
      >(),
  ]);

  if (foldersRes.error || itemsRes.error) {
    return {
      ok: false,
      error: foldersRes.error?.message ?? itemsRes.error?.message ?? "Lecture impossible.",
    };
  }

  const folders: OwnerMediaFolder[] = (foldersRes.data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
  }));

  const items: OwnerMediaItem[] = (itemsRes.data ?? []).map((m) => {
    const { data: pub } = auth.admin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(m.storage_path);
    return {
      id: m.id,
      folder_id: m.folder_id,
      filename: m.filename,
      mime_type: m.mime_type,
      size_bytes: m.size_bytes,
      public_url: pub.publicUrl,
    };
  });

  return { ok: true, folders, items };
}

export async function deleteTodoNote(id: string): Promise<Ok<object> | Err> {
  if (!UUID_REGEX.test(id)) return { ok: false, error: "ID invalide." };
  const auth = await requireOwnerProfile();
  if (!auth.ok) return auth;

  const { error } = await auth.admin
    .from("todo_notes" as never)
    .delete()
    .eq("id", id)
    .eq("profile_id", auth.profileId);

  if (error) return { ok: false, error: error.message };
  bumpRevalidation();
  return { ok: true };
}
