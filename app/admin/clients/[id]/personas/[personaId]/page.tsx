import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { lookupColumn, routeSegment } from "@/lib/admin/resolve-client";
import { Button } from "@/lib/ds";
import { PersonaDetailEditor } from "../_components/persona-detail-editor";
import type {
  ClientPersonaRow,
  PersonaItem,
  PersonaMedia,
} from "../_lib/persona-types";
import type { MediaRow } from "../../media/_lib/types";

export const metadata: Metadata = {
  title: "Audience · Holocron",
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
  if (!UUID_REGEX.test(personaId)) notFound();

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
    .select("id, full_name, slug, is_owner")
    .eq(lookupColumn(id), id)
    .maybeSingle();
  if (!profile || profile.is_owner) notFound();
  const clientSlug = routeSegment(profile);
  if (clientSlug !== id)
    redirect(`/admin/clients/${clientSlug}/personas/${personaId}`);

  // Le persona doit appartenir à ce client — sinon 404 (évite l'énumération
  // de personas d'autres clients via l'URL).
  const { data: personaRow } = await admin
    .from("client_personas" as never)
    .select(
      "id, name, role, age, location, quote, bio, goals, frustrations, motivations, behaviors, tech_comfort, notes, cover_media_id, profile_id",
    )
    .eq("id", personaId)
    .eq("profile_id", profile.id)
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
        | "cover_media_id"
        | "profile_id"
      >
    >();
  if (!personaRow) notFound();

  // Médias taggés sur CE persona uniquement.
  const { data: mediaRows } = await admin
    .from("client_media" as never)
    .select("id, filename, storage_path, mime_type, position, created_at")
    .eq("profile_id", profile.id)
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
    cover_media_id: personaRow.cover_media_id,
    media,
  };

  const clientName = profile.full_name ?? "Client";

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field + scanlines + sabre — thème Conseil Jedi */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-50"
      />
      <div
        aria-hidden
        className="sw-lightsaber-bar pointer-events-none absolute bottom-16 left-2 top-24 hidden w-[2px] rounded-full md:block"
      />

      <section className="mx-auto flex max-w-5xl flex-col gap-12 pt-12 md:pt-20">
        <header className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link
              href="/admin/clients"
              className="transition-colors hover:text-cyan-100"
            >
              Holocrons
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href={`/admin/clients/${clientSlug}`}
              className="text-cyan-200/85 transition-colors hover:text-cyan-100"
            >
              {clientName}
            </Link>
            <span className="mx-3 text-cyan-200/20">·</span>
            <Link
              href={`/admin/clients/${clientSlug}/personas`}
              className="text-cyan-200/85 transition-colors hover:text-cyan-100"
            >
              Audiences
            </Link>
            <span className="mx-3 text-cyan-200/20">·</span>
            <span className="text-cyan-200/55">
              {persona.name || "Sans nom"}
            </span>
          </p>
        </header>

        <PersonaDetailEditor profileId={profile.id} persona={persona} />

        <div className="flex items-center pt-4">
          <Button
            href={`/admin/clients/${clientSlug}/personas`}
            variant="ghost"
          >
            ← Retour Audiences
          </Button>
        </div>
      </section>
    </div>
  );
}
