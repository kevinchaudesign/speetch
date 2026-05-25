/**
 * Types de sections d'une page + config UI pour les présenter à l'admin.
 *
 * Pour ajouter un type de section : éditer cette const ET le type union
 * dans `types/database.ts` (PageContent → sections[].type). Mettre à jour
 * aussi le renderer côté espace client public quand il sera implémenté.
 */
import type { PageContent } from "@/types/database";

export type Section = NonNullable<PageContent["sections"]>[number];
export type SectionType = Section["type"];
export type SectionMedia = NonNullable<Section["media"]>[number];
export type ChildSection = NonNullable<Section["children"]>[number];
export type ChildSectionType = ChildSection["type"];

export const SECTION_TYPES: ReadonlyArray<{
  value: SectionType;
  label: string;
  tagline: string;
}> = [
  { value: "text", label: "Texte", tagline: "Titre et corps de texte" },
  { value: "image", label: "Image", tagline: "Une image avec légende" },
  { value: "video", label: "Vidéo", tagline: "Un fichier vidéo uploadé" },
  {
    value: "embed",
    label: "Embed",
    tagline: "URL externe (Vimeo, YouTube, Figma…)",
  },
  {
    value: "gallery",
    label: "Galerie",
    tagline: "Plusieurs images avec légendes",
  },
  {
    value: "code",
    label: "Code",
    tagline: "Snippet avec coloration syntaxique",
  },
  {
    value: "container",
    label: "Conteneur",
    tagline: "Regroupe d'autres blocs (texte, image, code…) à la suite",
  },
];

/**
 * Types autorisés DANS un conteneur. Un conteneur ne peut pas contenir
 * un autre conteneur (1 niveau d'imbrication maximum).
 */
export const CHILD_SECTION_TYPES: ReadonlyArray<{
  value: ChildSectionType;
  label: string;
  tagline: string;
}> = SECTION_TYPES.filter(
  (t): t is { value: ChildSectionType; label: string; tagline: string } =>
    t.value !== "container",
);

export function isValidSectionType(value: string): value is SectionType {
  return SECTION_TYPES.some((t) => t.value === value);
}

export function isValidChildSectionType(
  value: string,
): value is ChildSectionType {
  return CHILD_SECTION_TYPES.some((t) => t.value === value);
}

export function getSectionTypeLabel(value: SectionType): string {
  return SECTION_TYPES.find((t) => t.value === value)?.label ?? value;
}
