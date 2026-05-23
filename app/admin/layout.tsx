import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";

const SIDEBAR_COOKIE = "speetch_admin_sidebar_collapsed";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  // Lecture du cookie côté serveur → pas de flash à l'hydratation.
  const cookieStore = await cookies();
  const initialCollapsed =
    cookieStore.get(SIDEBAR_COOKIE)?.value === "1";

  // Owner profile : nom (greeting chatbot) + id (médiathèque studio) +
  // avatar (topbar admin).
  const admin = createAdminClient();
  const { data: ownerProfile } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("is_owner", true)
    .maybeSingle();
  const displayName = ownerProfile?.full_name?.trim() || null;
  const ownerProfileId = ownerProfile?.id ?? null;
  const avatarUrl = ownerProfile?.avatar_url ?? null;

  return (
    <AdminShell
      email={user.email ?? "Session active"}
      displayName={displayName}
      ownerProfileId={ownerProfileId}
      avatarUrl={avatarUrl}
      initialCollapsed={initialCollapsed}
    >
      {children}
    </AdminShell>
  );
}
