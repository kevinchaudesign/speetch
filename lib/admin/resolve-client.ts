import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Les routes admin acceptent un UUID ou un slug pour chaque segment. Renvoie
// la colonne à interroger dans le `.eq(...)` selon le format reçu.
export function lookupColumn(rawId: string): "id" | "slug" {
  return UUID_REGEX.test(rawId) ? "id" : "slug";
}

export function isUuid(raw: string): boolean {
  return UUID_REGEX.test(raw);
}

/**
 * Segment d'URL canonique d'une entité (client, parchemin) : son slug — donc
 * son nom — avec repli sur l'UUID pour les lignes historiques qui n'en ont
 * pas encore.
 */
export function routeSegment(entity: {
  id: string;
  slug?: string | null;
}): string {
  return entity.slug || entity.id;
}

/**
 * Même chose depuis un UUID seul — pour les server actions qui ne connaissent
 * que `profileId` et doivent reconstruire une URL (redirect / revalidatePath).
 */
export const resolveClientSegment = cache(
  async (profileId: string): Promise<string> => {
    if (!isUuid(profileId)) return profileId;
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

/**
 * Segment d'URL canonique d'un parchemin : son slug (donc son titre). Les
 * slugs de `client_contexts` ne sont uniques que par client, d'où le
 * `profileId` en portée.
 */
export const resolveContextSegment = cache(
  async (profileId: string, contextId: string): Promise<string> => {
    if (!isUuid(contextId)) return contextId;
    const admin = createAdminClient();
    const { data } = await admin
      .from("client_contexts" as never)
      .select("slug")
      .eq("id", contextId)
      .eq("profile_id", profileId)
      .maybeSingle<{ slug: string }>();
    return data?.slug || contextId;
  },
);

/**
 * Revalide la fiche d'un parchemin depuis les identifiants bruts (UUID) dont
 * disposent les server actions.
 */
export async function revalidateContextPath(
  profileId: string,
  contextId: string,
): Promise<void> {
  const segment = await resolveContextSegment(profileId, contextId);
  await revalidateClientPath(profileId, `/context/${segment}`);
  if (segment !== contextId) {
    await revalidateClientPath(profileId, `/context/${contextId}`);
  }
}
