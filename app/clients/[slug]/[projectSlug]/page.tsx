import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionCookieName, verifySession } from "@/lib/crypto";
import { isValidSlug } from "@/lib/slug";
import type { ProjectInSpace } from "@/types/database";
import { ProjectPageView } from "./project-page-view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; projectSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  if (!isValidSlug(slug) || !isValidSlug(projectSlug)) {
    return { title: "Projet introuvable", robots: { index: false, follow: false } };
  }

  const supabase = await createClient();
  const { data: space } = await supabase
    .from("client_spaces")
    .select("full_name, projects")
    .eq("slug", slug)
    .maybeSingle<{ full_name: string | null; projects: unknown }>();

  const project = (
    Array.isArray(space?.projects) ? (space?.projects as ProjectInSpace[]) : []
  ).find((p) => p?.slug === projectSlug);

  if (!project) {
    return { title: "Projet introuvable", robots: { index: false, follow: false } };
  }

  return {
    title: `${project.name} · ${space?.full_name ?? "Speetch"}`,
    robots: { index: false, follow: false },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug, projectSlug } = await params;
  if (!isValidSlug(slug) || !isValidSlug(projectSlug)) notFound();

  const supabase = await createClient();
  const { data: space } = await supabase
    .from("client_spaces")
    .select(
      "id, slug, full_name, created_at, projects, personas_published, personas_project_ids",
    )
    .eq("slug", slug)
    .maybeSingle<{
      id: string;
      slug: string;
      full_name: string | null;
      created_at: string;
      projects: unknown;
      personas_published: boolean | null;
      personas_project_ids: string[] | null;
    }>();

  if (!space || !space.id || !space.slug) notFound();

  const profileId = space.id;
  const spaceSlug = space.slug;

  // Cookie gate — si verrouillé, on renvoie à la home de l'espace qui affiche
  // le UnlockGate. Pas de gate inline ici pour garder une seule source de
  // vérité côté UI.
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getSessionCookieName(profileId))?.value;
  const unlocked = verifySession(profileId, sessionValue);
  if (!unlocked) redirect(`/clients/${spaceSlug}`);

  const projects = (
    Array.isArray(space.projects) ? space.projects : []
  ) as ProjectInSpace[];

  const project = projects.find((p) => p?.slug === projectSlug);
  if (!project) notFound();

  // Personas pinné sur ce projet — uniquement si le partage est activé côté
  // admin (sinon, on ignore les pins, même comportement que la home espace).
  const personasPinnedHere =
    space.personas_published === true &&
    Array.isArray(space.personas_project_ids) &&
    space.personas_project_ids.includes(project.id);

  let personasCount = 0;
  if (personasPinnedHere) {
    const { count } = await supabase
      .from("client_personas_public" as never)
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId);
    personasCount = count ?? 0;
  }

  return (
    <ProjectPageView
      profileId={profileId}
      clientSlug={spaceSlug}
      clientName={space.full_name ?? "Espace client"}
      project={project}
      hasPersonas={personasPinnedHere && personasCount > 0}
      personasCount={personasCount}
    />
  );
}
