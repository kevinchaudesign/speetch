/**
 * Types locaux pour la table `client_personas` — pas (encore) régénérée
 * dans `types/database.ts`. À supprimer quand la regen aura été faite via
 *   supabase gen types typescript --project-id gnspmcqebsjcfjkxjzeb --schema public
 */

export type ClientPersonaRow = {
  id: string;
  profile_id: string;
  name: string;
  role: string | null;
  age: number | null;
  location: string | null;
  quote: string | null;
  bio: string | null;
  goals: string | null;
  frustrations: string | null;
  motivations: string | null;
  behaviors: string | null;
  tech_comfort: string | null;
  notes: string | null;
  /** FK vers client_media.id — image choisie comme card preview, optionnel. */
  cover_media_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ClientPersonaInsert = {
  id?: string;
  profile_id: string;
  name?: string;
  position?: number;
};

export type ClientPersonaPatch = Partial<
  Pick<
    ClientPersonaRow,
    | "name"
    | "role"
    | "age"
    | "location"
    | "quote"
    | "bio"
    | "goals"
    | "frustrations"
    | "motivations"
    | "behaviors"
    | "tech_comfort"
    | "notes"
  >
>;

/**
 * Champs patchables côté UI — la liste fait foi pour la sanitisation côté
 * server action (cf. updatePersona).
 */
export const PERSONA_PATCHABLE_FIELDS = [
  "name",
  "role",
  "age",
  "location",
  "quote",
  "bio",
  "goals",
  "frustrations",
  "motivations",
  "behaviors",
  "tech_comfort",
  "notes",
] as const;

// ─── Types UI partagés liste/détail ─────────────────────────────────────────

/** Vignette d'un média de la médiathèque taggé sur un persona. */
export type PersonaMedia = {
  id: string;
  filename: string;
  mime_type: string;
  public_url: string;
};

/**
 * Persona enrichi pour l'UI : champs DB éditables + média(s) taggé(s).
 * Le champ `media` n'est PAS patchable — il est calculé côté serveur depuis
 * client_media.persona_id.
 */
export type PersonaItem = Pick<
  ClientPersonaRow,
  | "id"
  | "name"
  | "role"
  | "age"
  | "location"
  | "quote"
  | "bio"
  | "goals"
  | "frustrations"
  | "motivations"
  | "behaviors"
  | "tech_comfort"
  | "notes"
  | "cover_media_id"
> & {
  media: PersonaMedia[];
};
