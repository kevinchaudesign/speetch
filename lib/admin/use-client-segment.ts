"use client";

import { useParams } from "next/navigation";

/**
 * Segment d'URL du client couramment ouvert dans /admin/clients/[id] — son
 * slug (donc son nom) puisque les pages redirigent tout UUID vers la forme
 * canonique. À utiliser pour construire des liens depuis un composant client,
 * plutôt que le `profileId` (UUID) réservé aux server actions.
 */
export function useClientSegment(): string {
  const params = useParams<{ id: string }>();
  return typeof params?.id === "string" ? params.id : "";
}
