import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button } from "@/lib/ds";
import {
  PersonasEditor,
  type PersonaItem,
  type PersonaMedia,
} from "./_components/personas-editor";
import type { ClientPersonaRow } from "./_lib/persona-types";
import type { MediaRow } from "../media/_lib/types";

const MEDIA_BUCKET = "page-media";

export const metadata: Metadata = {
  title: "Personas",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ClientPersonasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

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
    .select("id, full_name, is_owner")
    .eq("id", id)
    .maybeSingle();
  if (!profile || profile.is_owner) notFound();

  const { data: personasData } = await admin
    .from("client_personas" as never)
    .select(
      "id, name, role, age, location, quote, bio, goals, frustrations, motivations, behaviors, tech_comfort, notes, position",
    )
    .eq("profile_id", id)
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
    .eq("profile_id", id)
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
    media: mediaByPersona.get(p.id) ?? [],
  }));

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
            <span className="text-white/55">Personas</span>
          </p>
          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Personas{" "}
            <span className="font-serif italic font-normal text-white/85">
              {clientName}
            </span>
          </h1>
          <p className="max-w-xl font-serif text-base italic text-white/45 md:text-lg">
            Fiches utilisateur cible pour ce client : rôle, objectifs,
            frustrations, citations. Sert de base pour orienter les pages
            publiques et les décisions de design.
          </p>
        </header>

        <PersonasEditor profileId={id} initialPersonas={personas} />

        <div className="flex items-center pt-4">
          <Button href="/admin/clients" variant="ghost">
            ← Retour clients
          </Button>
        </div>
      </section>
    </div>
  );
}
