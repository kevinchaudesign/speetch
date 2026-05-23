import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { TodoApp } from "./_components/todo-app";
import type {
  TodoListItem,
  TodoListRow,
  TodoNoteItem,
  TodoNoteRow,
} from "./_lib/types";

export const metadata: Metadata = {
  title: "Tâches Jedi · Conseil",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TodoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/todo");

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();
  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("is_owner", true)
    .maybeSingle();
  if (!ownerProfile) redirect("/admin");

  // Fetch listes + toutes les notes du owner. Volume raisonnable pour les
  // todos d'un solo studio — on charge tout d'un coup côté client.
  const [{ data: listsData }, { data: notesData }] = await Promise.all([
    admin
      .from("todo_lists" as never)
      .select("id, name, color, position")
      .eq("profile_id", ownerProfile.id)
      .order("position", { ascending: true })
      .returns<
        Array<Pick<TodoListRow, "id" | "name" | "color" | "position">>
      >(),
    admin
      .from("todo_notes" as never)
      .select("id, list_id, content, is_pinned, created_at, updated_at")
      .eq("profile_id", ownerProfile.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .returns<
        Array<
          Pick<
            TodoNoteRow,
            | "id"
            | "list_id"
            | "content"
            | "is_pinned"
            | "created_at"
            | "updated_at"
          >
        >
      >(),
  ]);

  // Count notes par liste pour le badge sidebar.
  const countByList = new Map<string | null, number>();
  for (const n of notesData ?? []) {
    const key = n.list_id;
    countByList.set(key, (countByList.get(key) ?? 0) + 1);
  }

  const lists: TodoListItem[] = (listsData ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color ?? null,
    count: countByList.get(l.id) ?? 0,
  }));

  const notes: TodoNoteItem[] = (notesData ?? []).map((n) => ({
    id: n.id,
    list_id: n.list_id,
    content: n.content ?? "",
    is_pinned: n.is_pinned,
    created_at: n.created_at,
    updated_at: n.updated_at,
  }));

  return <TodoApp initialLists={lists} initialNotes={notes} />;
}
