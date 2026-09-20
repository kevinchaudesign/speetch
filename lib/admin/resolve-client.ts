import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Les routes /admin/clients/[id] acceptent un UUID ou un slug. Renvoie la
// colonne `profiles` à utiliser dans le `.eq(...)` selon le format reçu.
export function clientLookupColumn(rawId: string): "id" | "slug" {
  return UUID_REGEX.test(rawId) ? "id" : "slug";
}

export function isClientUuid(rawId: string): boolean {
  return UUID_REGEX.test(rawId);
}

/**
 * Segment d'URL canonique d'un client : son slug (donc son nom), avec repli
 * sur l'UUID pour les profils historiques qui n'en ont pas encore.
 */
export function clientSegment(client: {
  id: string;
  slug?: string | null;
}): string {
  return client.slug || client.id;
}

/**
 * Même chose depuis un UUID seul — pour les server actions qui ne connaissent
 * que `profileId` et doivent reconstruire une URL (redirect / revalidatePath).
 */
export const resolveClientSegment = cache(
  async (profileId: string): Promise<string> => {
    if (!isClientUuid(profileId)) return profileId;
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("slug")
      .eq("id", profileId)
      .maybeSingle();
    return (data?.slug as string | null) || profileId;
  },
);

/**
 * Revalide une route admin d'un client sur ses deux adresses possibles
 * (slug canonique + UUID historique), à partir du seul `profileId`.
 *
 *   await revalidateClientPath(input.profileId, "/media");
 */
export async function revalidateClientPath(
  profileId: string,
  suffix = "",
): Promise<void> {
  const segment = await resolveClientSegment(profileId);
  revalidatePath(`/admin/clients/${segment}${suffix}`);
  if (segment !== profileId) {
    revalidatePath(`/admin/clients/${profileId}${suffix}`);
  }
}
