/**
 * Types Skill — partagés entre tous les domaines (cf. lib/domains.ts
 * pour les listes effectives de skills par domaine).
 *
 * L'ordre dans le tableau `domain.skills` détermine la position
 * orbitale :
 *  - Index 0-7  → orbite intérieure (8 nœuds, r=140)
 *  - Index 8-15 → orbite extérieure (8 nœuds, r=215)
 *
 * Ne JAMAIS renommer un `id` une fois publié : il sert d'ancre URL
 * potentielle (#skill=xxx) pour des liens entrants.
 */

export type SkillAccent = "cyan" | "amber" | "emerald" | "rose" | "gold";

export type Skill = {
  id: string;
  label: string;
  title: string;
  description: string;
  accent: SkillAccent;
};

/** Mapping accent → couleur hex (utilisé par <SkillPanel> + glow). */
export const SKILL_ACCENT_HEX: Record<SkillAccent, string> = {
  cyan: "#7dd3fc",
  amber: "#fbbf24",
  emerald: "#34d399",
  rose: "#fb7185",
  gold: "#fde047",
};
