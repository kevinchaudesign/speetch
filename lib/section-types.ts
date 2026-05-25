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
];

export function isValidSectionType(value: string): value is SectionType {
  return SECTION_TYPES.some((t) => t.value === value);
}

export function getSectionTypeLabel(value: SectionType): string {
  return SECTION_TYPES.find((t) => t.value === value)?.label ?? value;
}
