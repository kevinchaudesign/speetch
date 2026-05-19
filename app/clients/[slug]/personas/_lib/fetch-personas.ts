/**
 * Helpers de lecture pour les routes publiques /clients/[slug]/personas.
 * Lecture exclusivement via les vues client_personas_public et
 * client_persona_media_public (anon-readable, filtres publication dans la
 * vue). Aucune utilisation de createAdminClient ici — c'est de la lecture
 * côté visiteur authentifié via gate cookie, pas admin.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicPersonaItem, PublicPersonaMedia } from "../_components/personas-public-list";

// Type Supabase volontairement permissif : les vues client_personas_public
// et client_persona_media_public ne sont pas (encore) régénérées dans
// types/database.ts, on se contente d'appeler `.from(... as never)` plus bas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

export const MEDIA_BUCKET = "page-media";

type PersonaRow = {
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
  cover_media_id: string | null;
  position: number;
};

type MediaRow = {
  id: string;
  persona_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  position: number;
  created_at: string;
};

export async function fetchPersonasForClient({
  supabase,
  profileId,
  bucket = MEDIA_BUCKET,
}: {
  supabase: AnySupabase;
  profileId: string;
  bucket?: string;
}): Promise<PublicPersonaItem[]> {
  const { data: personaRows } = await supabase
    .from("client_personas_public" as never)
    .select(
      "id, profile_id, name, role, age, location, quote, bio, goals, frustrations, motivations, behaviors, tech_comfort, notes, cover_media_id, position",
    )
    .eq("profile_id", profileId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<PersonaRow[]>();

  const { data: mediaRows } = await supabase
    .from("client_persona_media_public" as never)
    .select(
      "id, persona_id, filename, storage_path, mime_type, position, created_at",
    )
    .eq("profile_id", profileId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<MediaRow[]>();

  const mediaByPersona = new Map<string, PublicPersonaMedia[]>();
  for (const m of mediaRows ?? []) {
    const { data: pub } = supabase.storage
      .from(bucket)
      .getPublicUrl(m.storage_path);
    const entry: PublicPersonaMedia = {
      id: m.id,
      filename: m.filename,
      mime_type: m.mime_type,
      public_url: pub.publicUrl,
    };
    const arr = mediaByPersona.get(m.persona_id);
    if (arr) arr.push(entry);
    else mediaByPersona.set(m.persona_id, [entry]);
  }

  return (personaRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    age: p.age,
    location: p.location,
    quote: p.quote,
    bio: p.bio,
    goals: p.goals,
    frustrations: p.frustrations,
    motivations: p.motivations,
    behaviors: p.behaviors,
    tech_comfort: p.tech_comfort,
    notes: p.notes,
    cover_media_id: p.cover_media_id,
    media: mediaByPersona.get(p.id) ?? [],
  }));
}

export async function fetchPersonaForClient({
  supabase,
  profileId,
  personaId,
  bucket = MEDIA_BUCKET,
}: {
  supabase: AnySupabase;
  profileId: string;
  personaId: string;
  bucket?: string;
}): Promise<PublicPersonaItem | null> {
  const { data: row } = await supabase
    .from("client_personas_public" as never)
    .select(
      "id, profile_id, name, role, age, location, quote, bio, goals, frustrations, motivations, behaviors, tech_comfort, notes, cover_media_id, position",
    )
    .eq("profile_id", profileId)
    .eq("id", personaId)
    .maybeSingle<PersonaRow>();
  if (!row) return null;

  const { data: mediaRows } = await supabase
    .from("client_persona_media_public" as never)
    .select(
      "id, persona_id, filename, storage_path, mime_type, position, created_at",
    )
    .eq("profile_id", profileId)
    .eq("persona_id", personaId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<MediaRow[]>();

  const media: PublicPersonaMedia[] = (mediaRows ?? []).map((m) => {
    const { data: pub } = supabase.storage
      .from(bucket)
      .getPublicUrl(m.storage_path);
    return {
      id: m.id,
      filename: m.filename,
      mime_type: m.mime_type,
      public_url: pub.publicUrl,
    };
  });

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    age: row.age,
    location: row.location,
    quote: row.quote,
    bio: row.bio,
    goals: row.goals,
    frustrations: row.frustrations,
    motivations: row.motivations,
    behaviors: row.behaviors,
    tech_comfort: row.tech_comfort,
    notes: row.notes,
    cover_media_id: row.cover_media_id,
    media,
  };
}
