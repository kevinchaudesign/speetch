import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getProjectTypeLabel } from "@/lib/project-types";
import { Button, Eyebrow, StatusBadge } from "@/lib/ds";
import { lookupColumn, routeSegment } from "@/lib/admin/resolve-client";
import { DeleteProjectButton } from "./projects/[projectId]/_components/delete-project-button";
import { RenameProjectButton } from "./projects/[projectId]/_components/rename-project-button";
import { PasswordEditCard } from "./_components/password-edit-card";

export const metadata: Metadata = {
  title: "Holocron · Conseil Jedi",
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
    .eq(lookupColumn(id), id)
    .eq("is_owner", false)
    .maybeSingle();

  if (error || !data) notFound();

  const client = data as ClientHub;
  const clientSlug = routeSegment(client);
  // URL canonique : le segment porte le nom du client, jamais son UUID.
  if (clientSlug !== id) redirect(`/admin/clients/${clientSlug}`);
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
      href: `/admin/clients/${clientSlug}/design`,
      hint: "Charte, logos, références",
    },
    {
      label: "Archives",
      href: `/admin/clients/${clientSlug}/context`,
      hint: "Briefs, parchemins, sources",
    },
    {
      label: "Audiences",
      href: `/admin/clients/${clientSlug}/personas`,
      hint: "Profils & cibles",
    },
    {
      label: "Médiathèque",
      href: `/admin/clients/${clientSlug}/media`,
      hint: "Images, vidéos, fichiers",
    },
  ];

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

      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin/clients"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Holocrons
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Holocron
        </span>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-14 pt-24 md:pt-20">
        <div className="flex flex-col gap-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link
              href="/admin"
              className="transition-colors hover:text-cyan-100"
            >
              Conseil Jedi
            </Link>
            <span className="mx-3 text-cyan-200/20">·</span>
            <Link
              href="/admin/clients"
              className="text-cyan-200/85 transition-colors hover:text-cyan-100"
            >
              Holocrons
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
                  className="text-cyan-200/65"
                >
                  Ouvrir l&apos;holocron public ↗
                </Button>
              )}
              <Button
                href={`/admin/clients/${clientSlug}/projects/new`}
                variant="return"
              >
                Nouvelle mission
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {client.is_published ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-cyan-200/85">
                <span className="sw-cyan-dot block h-1 w-1 rounded-full bg-cyan-300" />
                Holocron scellé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-amber-300/85">
                <span className="block h-1 w-1 rounded-full bg-amber-300" />
                Holocron en forge
              </span>
            )}
            <Eyebrow tracking="md" className="text-cyan-200/70">
              {projects.length === 0
                ? "Aucune mission"
                : `${projects.length} mission${projects.length > 1 ? "s" : ""} · ${publishedProjects} active${publishedProjects > 1 ? "s" : ""}`}
            </Eyebrow>
          </div>

          <p className="break-all font-mono text-[11px] text-white/35">
            <span>/clients/{client.slug ?? "—"}</span>
            <span className="text-cyan-200/25"> · </span>
            <span>Forgé le {formattedDate}</span>
            {client.client_email && (
              <>
                <span className="text-cyan-200/25"> · </span>
                <span>{client.client_email}</span>
              </>
            )}
          </p>
        </div>

        <PasswordEditCard profileId={client.id} />

        {/* Raccourcis sections — consoles internes de l'holocron */}
        <div className="flex flex-col gap-6">
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            Consoles
          </h2>
          <ul className="grid grid-cols-1 gap-px border border-cyan-200/15 bg-cyan-200/[0.08] sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.href} className="bg-[#0a0a0a]">
                <Link
                  href={s.href}
                  className="group flex items-center justify-between gap-6 px-6 py-7 transition-colors hover:bg-cyan-200/[0.04]"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xl font-light text-[#F5F5F7] transition-colors group-hover:text-cyan-100 md:text-2xl">
                      {s.label}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/55">
                      {s.hint}
                    </span>
                  </div>
                  <span className="inline-block h-px w-8 bg-cyan-200/40 transition-all duration-500 ease-out group-hover:w-14 group-hover:bg-cyan-200" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Missions */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
              Missions
            </h2>
            <Button
              href={`/admin/clients/${clientSlug}/projects/new`}
              variant="primary"
              className="text-cyan-200/65"
            >
              + Nouvelle mission
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="relative pt-8">
              <div
                aria-hidden
                className="sw-hologram-line absolute inset-x-0 top-0"
              />
              <p className="font-serif text-base italic text-white/55">
                Aucune mission pour cet holocron.
              </p>
            </div>
          ) : (
            <ul className="relative flex flex-col">
              <div
                aria-hidden
                className="sw-hologram-line absolute inset-x-0 top-0"
              />
              {projects.map((project, i) => {
                const typeLabel = getProjectTypeLabel(project.project_type);
                return (
                  <li
                    key={project.id}
                    className="group relative flex flex-wrap items-center gap-x-4 gap-y-2 py-4"
                  >
                    {i < projects.length - 1 && (
                      <div
                        aria-hidden
                        className="sw-hologram-line absolute inset-x-0 bottom-0"
                      />
                    )}
                    <Link
                      href={`/admin/clients/${clientSlug}/projects/${project.id}`}
                      className="inline-flex flex-1 items-baseline gap-x-4 transition-colors"
                    >
                      <span className="text-base font-light text-white/85 transition-colors group-hover:text-cyan-100 md:text-lg">
                        {project.name}
                      </span>
                      {typeLabel && (
                        <span className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/45">
                          {typeLabel}
                        </span>
                      )}
                      {project.is_published ? (
                        <StatusBadge tone="success">Active</StatusBadge>
                      ) : (
                        <StatusBadge tone="warning">En forge</StatusBadge>
                      )}
                    </Link>
                    <div className="flex items-center gap-4">
                      <RenameProjectButton
                        profileId={client.id}
                        projectId={project.id}
                        projectName={project.name}
                      />
                      <DeleteProjectButton
                        profileId={client.id}
                        projectId={project.id}
                        projectName={project.name}
                      />
                    </div>
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
