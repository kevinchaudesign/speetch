import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { clientLookupColumn, clientSegment } from "@/lib/admin/resolve-client";
import { Button } from "@/lib/ds";
import { PersonasList } from "./_components/personas-list";
import {
  PersonasSettingsPanel,
  type ProjectOption,
} from "./_components/personas-settings-panel";
import type {
  ClientPersonaRow,
  PersonaItem,
  PersonaMedia,
} from "./_lib/persona-types";
import type { MediaRow } from "../media/_lib/types";

const MEDIA_BUCKET = "page-media";

export const metadata: Metadata = {
  title: "Audiences · Holocron",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ClientPersonasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/admin/clients/${id}/personas`);
  }
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, slug, is_owner, personas_published")
    .eq(clientLookupColumn(id), id)
    .maybeSingle<{
      id: string;
      full_name: string | null;
      slug: string | null;
      is_owner: boolean;
      personas_published: boolean | null;
    }>();
  if (!profile || profile.is_owner) notFound();
  const clientSlug = clientSegment(profile);
  if (clientSlug !== id) redirect(`/admin/clients/${clientSlug}/personas`);

  // Projets du client + pins existants — sert au multi-select de
  // PersonasSettingsPanel.
  const { data: projectsData } = await admin
    .from("projects")
    .select("id, name, position, created_at")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const projects: ProjectOption[] = (projectsData ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? "Sans nom",
  }));

  const { data: pinsData } = await admin
    .from("client_personas_project_pins" as never)
    .select("project_id")
    .eq("profile_id", profile.id)
    .returns<Array<{ project_id: string }>>();
  const pinnedProjectIds: string[] = (pinsData ?? []).map((p) => p.project_id);

  const { data: personasData } = await admin
    .from("client_personas" as never)
    .select(
      "id, name, role, age, location, quote, bio, goals, frustrations, motivations, behaviors, tech_comfort, notes, cover_media_id, position",
    )
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<
      Array<
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
          | "position"
        >
      >
    >();

  // Médias du client taggés sur un persona. Le filtre persona_id non null
  // est fait en TS — le builder Supabase ne combine pas proprement `.not()`
  // et `.returns<>()`, on récupère tout et on filtre ici.
  const { data: allMediaData } = await admin
    .from("client_media" as never)
    .select(
      "id, persona_id, filename, storage_path, mime_type, position, created_at",
    )
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<
      Array<
        Pick<
          MediaRow,
          | "id"
          | "persona_id"
          | "filename"
          | "storage_path"
          | "mime_type"
          | "position"
          | "created_at"
        >
      >
    >();

  const mediaByPersona = new Map<string, PersonaMedia[]>();
  for (const m of allMediaData ?? []) {
    if (!m.persona_id) continue;
    const { data: pub } = admin.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(m.storage_path);
    const entry: PersonaMedia = {
      id: m.id,
      filename: m.filename,
      mime_type: m.mime_type,
      public_url: pub.publicUrl,
    };
    const arr = mediaByPersona.get(m.persona_id);
    if (arr) arr.push(entry);
    else mediaByPersona.set(m.persona_id, [entry]);
  }

  const personas: PersonaItem[] = (personasData ?? []).map((p) => ({
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
            <span className="text-cyan-200/55">Audiences</span>
          </p>
          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Audiences{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif font-normal italic">
              {clientName}
            </span>
          </h1>
          <p className="max-w-xl font-serif text-base italic text-white/55 md:text-lg">
            Fiches d&apos;audience cible pour cet holocron : rôle, objectifs,
            frustrations, citations. Sert de boussole pour orienter les
            parchemins publics et les décisions de design.
          </p>
        </header>

        <PersonasSettingsPanel
          profileId={profile.id}
          published={profile.personas_published ?? false}
          pinnedProjectIds={pinnedProjectIds}
          projects={projects}
        />

        <PersonasList profileId={profile.id} initialPersonas={personas} />

        <div className="flex items-center gap-6 pt-4">
          <Button href={`/admin/clients/${clientSlug}`} variant="ghost">
            ← Retour {clientName}
          </Button>
          <Button href="/admin/clients" variant="ghost">
            Tous les Holocrons
          </Button>
        </div>
      </section>
    </div>
  );
}
