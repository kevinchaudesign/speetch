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
