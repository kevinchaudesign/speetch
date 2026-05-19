import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionCookieName, verifySession } from "@/lib/crypto";
import { isValidSlug } from "@/lib/slug";
import { fetchPersonaForClient, MEDIA_BUCKET } from "../_lib/fetch-personas";
import { PersonaPublicDetail } from "./_components/persona-public-detail";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ slug: string; personaId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, personaId } = await params;
  if (!isValidSlug(slug) || !UUID_REGEX.test(personaId)) {
    return {
      title: "Persona introuvable",
      robots: { index: false, follow: false },
    };
  }
  const supabase = await createClient();
  const { data: space } = await supabase
    .from("client_spaces")
    .select("id, full_name")
    .eq("slug", slug)
    .maybeSingle();
  if (!space?.id) {
    return {
      title: "Persona introuvable",
      robots: { index: false, follow: false },
    };
  }
  const { data: persona } = await supabase
    .from("client_personas_public" as never)
    .select("name")
    .eq("profile_id", space.id)
    .eq("id", personaId)
    .maybeSingle<{ name: string }>();
  return {
    title: persona?.name
      ? `${persona.name} · ${space.full_name ?? "Personas"}`
      : "Persona",
    robots: { index: false, follow: false },
  };
}

export default async function PublicPersonaDetailPage({ params }: Props) {
  const { slug, personaId } = await params;
  if (!isValidSlug(slug) || !UUID_REGEX.test(personaId)) notFound();

  const supabase = await createClient();
  const { data: space } = await supabase
    .from("client_spaces")
    .select("id, slug, full_name")
    .eq("slug", slug)
    .maybeSingle();
  if (!space || !space.id || !space.slug) notFound();

  const profileId = space.id;

  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getSessionCookieName(profileId))?.value;
  const unlocked = verifySession(profileId, sessionValue);
  if (!unlocked) redirect(`/clients/${slug}`);

  const persona = await fetchPersonaForClient({
    supabase,
    profileId,
    personaId,
    bucket: MEDIA_BUCKET,
  });
  if (!persona) notFound();

  const fullName = space.full_name ?? "Espace client";

  return (
    <div className="relative min-h-svh w-full">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/65 px-6 py-5 backdrop-blur-md md:px-12">
        <Link
          href={`/clients/${slug}/personas`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
          <span>Tous les personas</span>
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          {fullName}
        </span>
      </header>

      <PersonaPublicDetail
        slug={slug}
        fullName={fullName}
        persona={persona}
      />

      <footer className="flex items-end justify-between border-t border-white/10 px-6 py-8 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Paris · 2026</span>
        <span>Speetch · Confidentiel</span>
      </footer>
    </div>
  );
}
