"use client";

import { useParams } from "next/navigation";

function segment(params: Record<string, unknown>, key: string): string {
  const value = params?.[key];
  return typeof value === "string" ? value : "";
}

/**
 * Segments d'URL de la route admin courante — le slug (donc le nom) de
 * chaque entité, puisque les pages redirigent tout UUID vers la forme
 * canonique. À utiliser pour construire des liens depuis un composant
 * client, plutôt que les UUID (`profileId`, `projectId`, `pageId`) réservés
 * aux server actions.
 */
export function useClientSegment(): string {
  return segment(useParams(), "id");
}

export function useProjectSegment(): string {
  return segment(useParams(), "projectId");
}
