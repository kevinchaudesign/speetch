/**
 * Liste prédéfinie des types de projets pour les Espaces Clients.
 *
 * Pour ajouter/retirer un type : éditer cette const.
 * - `value` est stocké dans `projects.project_type` (snake_case stable)
 * - `label` est ce que voient l'admin et le client (modifiable sans
 *   impact sur la BDD)
 * - `tagline` est la phrase d'accroche affichée sur le sélecteur visuel
 *
 * ⚠ Ne renomme JAMAIS une `value` déjà utilisée : ça orpheline les
 * lignes existantes. Préfère désactiver (retirer du select) plutôt que
 * renommer.
 */
export const PROJECT_TYPES = [
  {
    value: "campagne_meta",
    label: "Campagne Meta",
    tagline: "Annonces ciblées sur Facebook et Instagram",
  },
  {
    value: "campagne_google",
    label: "Campagne Google Ads",
    tagline: "Search, Display, YouTube, Performance Max",
  },
  {
    value: "branding",
    label: "Identité visuelle",
    tagline: "Logo, charte graphique, applications",
  },
  {
    value: "site_web",
    label: "Site web",
    tagline: "Design et développement, du concept au déploiement",
  },
  {
    value: "app_mobile",
    label: "App mobile",
    tagline: "iOS, Android, cross-plateforme — du wireframe au store",
  },
  {
    value: "video",
    label: "Vidéo · Motion design",
    tagline: "Animation, montage, broadcast",
  },
  {
    value: "print",
    label: "Print · Édition",
    tagline: "Affiches, flyers, livres, packaging",
  },
  {
    value: "direction_artistique",
    label: "Direction artistique",
    tagline: "Concept, art direction, exécution",
  },
  {
    value: "strategie",
    label: "Stratégie · Conseil",
    tagline: "Vision, positionnement, recommandations",
  },
  {
    value: "autre",
    label: "Autre",
    tagline: "Projet sur-mesure",
  },
] as const;

export type ProjectTypeValue = (typeof PROJECT_TYPES)[number]["value"];

export function isValidProjectType(value: string): value is ProjectTypeValue {
  return PROJECT_TYPES.some((t) => t.value === value);
}

export function getProjectTypeLabel(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  return PROJECT_TYPES.find((t) => t.value === value)?.label ?? null;
}

export function getProjectType(value: string | null | undefined) {
  if (!value) return null;
  return PROJECT_TYPES.find((t) => t.value === value) ?? null;
}
