import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionCookieName, verifySession } from "@/lib/crypto";
import { isValidSlug } from "@/lib/slug";
import type { ProjectInSpace } from "@/types/database";
import { UnlockGate } from "./unlock-gate";
import { ClientSpaceView } from "./client-space-view";

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

  if (!data) {
    return {
      title: "Espace introuvable",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: data.full_name ?? "Espace Client",
    robots: { index: false, follow: false },
  };
}

export default async function ClientSpacePage({ params }: Props) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();

  // Lecture via la vue publique (anon a `select`).
  const supabase = await createClient();
  const { data: space } = await supabase
    .from("client_spaces")
    .select("id, slug, full_name, avatar_url, created_at, projects")
    .eq("slug", slug)
    .maybeSingle();

  if (!space || !space.id || !space.slug || !space.created_at) notFound();

  const profileId = space.id;
  const spaceSlug = space.slug;
  const createdAt = space.created_at;

  // Vérification du cookie de gate
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getSessionCookieName(profileId))?.value;
  const unlocked = verifySession(profileId, sessionValue);

  if (!unlocked) {
    return (
      <UnlockGate
        slug={spaceSlug}
        fullName={space.full_name ?? "Espace Client"}
      />
    );
  }

  // Parse la liste de projets agrégée par la vue
  const projects = (
    Array.isArray(space.projects) ? space.projects : []
  ) as ProjectInSpace[];

  // Nombre de personas publiés pour ce client — sert juste à décider si la
  // section "Personas" est rendue sur la home espace. Vue pas (encore)
  // dans types/database.ts → cast `as never`.
  const { count: personasCount } = await supabase
    .from("client_personas_public" as never)
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId);

  return (
    <ClientSpaceView
      profileId={profileId}
      slug={spaceSlug}
      fullName={space.full_name ?? "Espace Client"}
      avatarUrl={space.avatar_url}
      createdAt={createdAt}
      projects={projects}
      personasCount={personasCount ?? 0}
    />
  );
}
