import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button } from "@/lib/ds";
import { PersonaDetailEditor } from "../_components/persona-detail-editor";
import type {
  ClientPersonaRow,
  PersonaItem,
  PersonaMedia,
} from "../_lib/persona-types";
import type { MediaRow } from "../../media/_lib/types";

export const metadata: Metadata = {
  title: "Persona",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MEDIA_BUCKET = "page-media";

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ id: string; personaId: string }>;
}) {
  const { id, personaId } = await params;
  if (!UUID_REGEX.test(id) || !UUID_REGEX.test(personaId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/admin/clients/${id}/personas/${personaId}`);
  }
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, is_owner")
    .eq("id", id)
    .maybeSingle();
  if (!profile || profile.is_owner) notFound();

  // Le persona doit appartenir à ce client — sinon 404 (évite l'énumération
  // de personas d'autres clients via l'URL).
  const { data: personaRow } = await admin
    .from("client_personas" as never)
    .select(
      "id, name, role, age, location, quote, bio, goals, frustrations, motivations, behaviors, tech_comfort, notes, profile_id",
    )
    .eq("id", personaId)
    .eq("profile_id", id)
    .maybeSingle<
      Pick<
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
        | "profile_id"
      >
    >();
  if (!personaRow) notFound();

  // Médias taggés sur CE persona uniquement.
  const { data: mediaRows } = await admin
    .from("client_media" as never)
    .select("id, filename, storage_path, mime_type, position, created_at")
    .eq("profile_id", id)
    .eq("persona_id", personaId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<
      Array<
        Pick<
          MediaRow,
          | "id"
          | "filename"
          | "storage_path"
          | "mime_type"
          | "position"
          | "created_at"
        >
      >
    >();

  const media: PersonaMedia[] = (mediaRows ?? []).map((m) => {
    const { data: pub } = admin.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(m.storage_path);
    return {
      id: m.id,
      filename: m.filename,
      mime_type: m.mime_type,
      public_url: pub.publicUrl,
    };
  });

  const persona: PersonaItem = {
    id: personaRow.id,
    name: personaRow.name,
    role: personaRow.role,
    age: personaRow.age,
    location: personaRow.location,
    quote: personaRow.quote,
    bio: personaRow.bio,
    goals: personaRow.goals,
    frustrations: personaRow.frustrations,
    motivations: personaRow.motivations,
    behaviors: personaRow.behaviors,
    tech_comfort: personaRow.tech_comfort,
    notes: personaRow.notes,
    media,
  };

  const clientName = profile.full_name ?? "Client";

  return (
    <div className="relative min-h-svh w-full px-6 py-10 md:px-16 md:py-14">
      <section className="mx-auto flex max-w-5xl flex-col gap-12 pt-12 md:pt-20">
        <header className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            <Link
              href="/admin/clients"
              className="transition-colors hover:text-white"
            >
              Espaces clients
            </Link>
            <span className="mx-3 text-white/20">→</span>
            <span className="text-white/55">{clientName}</span>
            <span className="mx-3 text-white/20">·</span>
            <Link
              href={`/admin/clients/${id}/personas`}
              className="text-white/55 transition-colors hover:text-white"
            >
              Personas
            </Link>
            <span className="mx-3 text-white/20">·</span>
            <span className="text-white/55">
              {persona.name || "Sans nom"}
            </span>
          </p>
        </header>

        <PersonaDetailEditor profileId={id} persona={persona} />

        <div className="flex items-center pt-4">
          <Button
            href={`/admin/clients/${id}/personas`}
            variant="ghost"
          >
            ← Retour personas
          </Button>
        </div>
      </section>
    </div>
  );
}
