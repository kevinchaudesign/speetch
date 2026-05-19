import { createClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/lib/auth/owner";
import { AdminAssistant } from "@/app/admin/_components/admin-assistant";
import { AdminEditModeFlag } from "./_admin/admin-edit-mode-flag";
import { EditModeToggle } from "./_admin/edit-mode-toggle";

export const dynamic = "force-dynamic";

/**
 * Layout des espaces clients `/clients/[slug]/…`.
 *
 * Garde stricte « owner-only » : on ne monte l'assistant, le toggle « Éditer »
 * et le flag `<html data-speetch-admin>` QUE si l'utilisateur Supabase
 * authentifié correspond à `SPEETCH_OWNER_EMAIL`. Les clients (cookie
 * scrypt sans Auth Supabase) n'ont pas de session → rien rendu.
 * Un user Supabase NON-owner (compte test, etc.) → rien non plus.
 */
export default async function ClientSpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = !!user && isOwnerEmail(user.email);

  return (
    <>
      {children}
      {isOwner ? (
        <>
          <AdminEditModeFlag />
          <EditModeToggle />
          <AdminAssistant email={user.email ?? "Session admin"} />
        </>
      ) : null}
    </>
  );
}
