import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionCookieName, verifySession } from "@/lib/crypto";
import { isValidSlug } from "@/lib/slug";
import {
  PersonasPublicList,
  type PublicPersonaItem,
} from "./_components/personas-public-list";
import {
  fetchPersonasForClient,
  MEDIA_BUCKET,
} from "./_lib/fetch-personas";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return {
      title: "Espace introuvable",
      robots: { index: false, follow: false },
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("client_spaces")
    .select("full_name")
    .eq("slug", slug)
    .maybeSingle();

  return {
    title: data?.full_name
      ? `Personas · ${data.full_name}`
      : "Personas",
    robots: { index: false, follow: false },
  };
}

export default async function PublicPersonasListPage({ params }: Props) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  const supabase = await createClient();
  const { data: space } = await supabase
    .from("client_spaces")
    .select("id, slug, full_name")
    .eq("slug", slug)
    .maybeSingle();

  if (!space || !space.id || !space.slug) notFound();

  const profileId = space.id;

  // Gate cookie — partagé avec /clients/[slug]. Si pas unlocked, on renvoie
  // vers la home espace où le gate s'affiche.
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getSessionCookieName(profileId))?.value;
  const unlocked = verifySession(profileId, sessionValue);
  if (!unlocked) redirect(`/clients/${slug}`);

  const personas: PublicPersonaItem[] = await fetchPersonasForClient({
    supabase,
    profileId,
    bucket: MEDIA_BUCKET,
  });

  const fullName = space.full_name ?? "Espace client";

  return (
    <div className="relative min-h-svh w-full">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/65 px-6 py-5 backdrop-blur-md md:px-12">
        <Link
          href={`/clients/${slug}`}
          className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          <span className="inline-block h-px w-6 bg-current transition-all duration-500 ease-out group-hover:w-12" />
          <span>Retour à l&apos;espace</span>
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          Personas
        </span>
      </header>

      <section className="px-6 pt-20 md:px-12 md:pt-32">
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
          {fullName}
          <span className="mx-3 text-white/20">·</span>
          <span className="text-white/55">Personas</span>
        </p>

        <h1
          className="mt-6 font-sans font-extralight leading-[0.86] tracking-[-0.05em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(2.75rem, 9vw, 7rem)" }}
        >
          Personas
        </h1>

        <p className="mt-10 max-w-xl text-balance font-serif text-base italic text-white/45 md:text-lg">
          {personas.length === 0
            ? "Les personas seront ajoutés ici prochainement."
            : "Fiches utilisateur cibles de ce projet. Clique sur une carte pour lire le détail complet."}
        </p>
      </section>

      <section className="px-6 pb-24 pt-16 md:px-12 md:pb-32 md:pt-24">
        <PersonasPublicList slug={slug} personas={personas} />
      </section>

      <footer className="flex items-end justify-between border-t border-white/10 px-6 py-8 text-[11px] uppercase tracking-[0.28em] text-white/40 md:px-12">
        <span>Paris · 2026</span>
        <span>Speetch · Confidentiel</span>
      </footer>
    </div>
  );
}
