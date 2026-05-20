import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getProjectTypeLabel } from "@/lib/project-types";
import { Button, Eyebrow, StatusBadge } from "@/lib/ds";
import { clientLookupColumn } from "@/lib/admin/resolve-client";
import { DeleteProjectButton } from "./projects/[projectId]/_components/delete-project-button";
import { PasswordEditCard } from "./_components/password-edit-card";

export const metadata: Metadata = {
  title: "Espace client · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ProjectMini = {
  id: string;
  name: string;
  is_published: boolean;
  project_type: string | null;
  position: number;
  created_at: string;
};

type ClientHub = {
  id: string;
  full_name: string | null;
  slug: string | null;
  client_email: string | null;
  is_published: boolean;
  created_at: string;
  projects: ProjectMini[] | null;
};

export default async function ClientHubPage({
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
    redirect(`/login?redirect=/admin/clients/${id}`);
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, full_name, slug, client_email, is_published, created_at, projects!profile_id(id, name, is_published, project_type, position, created_at)",
    )
    .eq(clientLookupColumn(id), id)
    .eq("is_owner", false)
    .maybeSingle();

  if (error || !data) notFound();

  const client = data as ClientHub;
  const projects = [...(client.projects ?? [])].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
  const publishedProjects = projects.filter((p) => p.is_published).length;

  const formattedDate = new Date(client.created_at).toLocaleDateString(
    "fr-FR",
    { year: "numeric", month: "short", day: "numeric" },
  );

  const clientName = client.full_name ?? "Sans nom";

  const sections: { label: string; href: string; hint: string }[] = [
    {
      label: "Design",
      href: `/admin/clients/${id}/design`,
      hint: "Charte, logos, références",
    },
    {
      label: "Contexte",
      href: `/admin/clients/${id}/context`,
      hint: "Briefs, documents, sources",
    },
    {
      label: "Personas",
      href: `/admin/clients/${id}/personas`,
      hint: "Profils & audiences",
    },
    {
      label: "Médiathèque",
      href: `/admin/clients/${id}/media`,
      hint: "Images, vidéos, fichiers",
    },
  ];

  return (
    <div className="relative min-h-svh w-full px-6 py-10 md:px-16 md:py-14">
      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin/clients"
          className="text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          ← Clients
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          Espace client
        </span>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-14 pt-24 md:pt-20">
        <div className="flex flex-col gap-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            Administration
            <span className="mx-3 text-white/20">·</span>
            <Link
              href="/admin/clients"
              className="text-white/55 transition-colors hover:text-white"
            >
              Espaces clients
            </Link>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              {clientName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {client.slug && (
                <Button
                  href={`/clients/${client.slug}`}
                  target="_blank"
                  rel="noopener"
                  variant="primary"
                  className="text-white/55"
                >
                  Ouvrir l&apos;espace public
                </Button>
              )}
              <Button
                href={`/admin/clients/${id}/projects/new`}
                variant="return"
              >
                Nouveau projet
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {client.is_published ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-emerald-300/75">
                <span className="block h-1 w-1 rounded-full bg-emerald-300" />
                Espace publié
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-amber-300/75">
                <span className="block h-1 w-1 rounded-full bg-amber-300" />
                Espace caché
              </span>
            )}
            <Eyebrow tracking="md" intensity="default">
              {projects.length === 0
                ? "Aucun projet"
                : `${projects.length} projet${projects.length > 1 ? "s" : ""} · ${publishedProjects} publié${publishedProjects > 1 ? "s" : ""}`}
            </Eyebrow>
          </div>

          <p className="break-all font-mono text-[11px] text-white/35">
            <span>/clients/{client.slug ?? "—"}</span>
            <span className="text-white/20"> · </span>
            <span>Créé le {formattedDate}</span>
            {client.client_email && (
              <>
                <span className="text-white/20"> · </span>
                <span>{client.client_email}</span>
              </>
            )}
          </p>
        </div>

        <PasswordEditCard profileId={client.id} />

        {/* Raccourcis sections */}
        <div className="flex flex-col gap-6">
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            Sections
          </h2>
          <ul className="grid grid-cols-1 gap-px border border-white/10 bg-white/5 sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.href} className="bg-[#0a0a0a]">
                <Link
                  href={s.href}
                  className="group flex items-center justify-between gap-6 px-6 py-7 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-light text-[#F5F5F7] md:text-2xl">
                      {s.label}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.32em] text-white/40">
                      {s.hint}
                    </span>
                  </div>
                  <span className="inline-block h-px w-8 bg-white/40 transition-all duration-500 ease-out group-hover:w-14 group-hover:bg-white" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Projets */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[11px] uppercase tracking-[0.4em] text-white/40">
              Projets
            </h2>
            <Button
              href={`/admin/clients/${id}/projects/new`}
              variant="primary"
              className="text-white/55"
            >
              + Nouveau projet
            </Button>
          </div>

          {projects.length === 0 ? (
            <p className="border-t border-white/10 pt-8 font-serif text-base italic text-white/40">
              Aucun projet pour ce client.
            </p>
          ) : (
            <ul className="flex flex-col border-t border-white/10">
              {projects.map((project) => {
                const typeLabel = getProjectTypeLabel(project.project_type);
                return (
                  <li
                    key={project.id}
                    className="group flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 py-4"
                  >
                    <Link
                      href={`/admin/clients/${id}/projects/${project.id}`}
                      className="inline-flex flex-1 items-baseline gap-x-4 transition-colors"
                    >
                      <span className="text-base font-light text-white/80 transition-colors group-hover:text-[#F5F5F7] md:text-lg">
                        {project.name}
                      </span>
                      {typeLabel && (
                        <span className="text-[10px] uppercase tracking-[0.28em] text-white/40">
                          {typeLabel}
                        </span>
                      )}
                      {project.is_published ? (
                        <StatusBadge tone="success">Publié</StatusBadge>
                      ) : (
                        <StatusBadge tone="warning">Brouillon</StatusBadge>
                      )}
                    </Link>
                    <DeleteProjectButton
                      profileId={client.id}
                      projectId={project.id}
                      projectName={project.name}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
