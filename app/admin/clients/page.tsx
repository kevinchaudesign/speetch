import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getProjectTypeLabel } from "@/lib/project-types";
import { Button, Eyebrow, Hairline, StatusBadge } from "@/lib/ds";
import { DeleteProjectButton } from "./[id]/projects/[projectId]/_components/delete-project-button";

export const metadata: Metadata = {
  title: "Espaces clients",
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

type ClientRow = {
  id: string;
  full_name: string | null;
  slug: string | null;
  client_email: string | null;
  is_published: boolean;
  created_at: string;
  projects: ProjectMini[] | null;
};

export default async function ClientsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/clients");
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  // On joint les projets via la FK historique projects.profile_id. Le `!`
  // désambigue : depuis l'ajout de profiles.personas_project_id (autre FK
  // vers projects), PostgREST refuse l'embed implicite tant qu'on ne lui
  // précise pas la colonne sur laquelle s'appuyer.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, full_name, slug, client_email, is_published, created_at, projects!profile_id(id, name, is_published, project_type, position, created_at)",
    )
    .eq("is_owner", false)
    .order("created_at", { ascending: false });

  const clients: ClientRow[] = (data ?? []) as ClientRow[];
  const totalClients = clients.length;
  const totalPublishedClients = clients.filter((c) => c.is_published).length;

  return (
    <div className="relative min-h-svh w-full px-6 py-10 md:px-16 md:py-14">
      {/* Header — mobile only */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin"
          className="text-[11px] uppercase tracking-[0.28em] text-white/55 transition-colors hover:text-white"
        >
          ← Admin
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-white/40">
          Espaces clients
        </span>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-12 pt-24 md:pt-20">
        <div className="flex flex-col gap-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            Administration
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              Espaces{" "}
              <span className="font-serif italic font-normal text-white/85">
                clients
              </span>
            </h1>

            <Button href="/admin/clients/new" variant="return">
              Nouveau client
            </Button>
          </div>

          <Eyebrow tracking="md" intensity="default">
            {totalClients === 0
              ? "Aucun client pour le moment"
              : `${totalClients} client${totalClients > 1 ? "s" : ""} · ${totalPublishedClients} publié${totalPublishedClients > 1 ? "s" : ""}`}
          </Eyebrow>
        </div>

        {error && (
          <p className="border-l-2 border-red-400/40 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/80">
            Erreur de chargement · {error.message}
          </p>
        )}

        {clients.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col border-t border-white/10">
            {clients.map((client) => (
              <ClientListRow key={client.id} client={client} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-start gap-8 border-t border-white/10 pt-16">
      <p className="max-w-md text-balance font-serif text-base italic text-white/40 md:text-lg">
        Aucun espace client n&apos;a encore été créé. Le premier apparaîtra ici
        dès qu&apos;il sera ajouté.
      </p>
      <Button href="/admin/clients/new" variant="large">
        Créer le premier client
      </Button>
    </div>
  );
}

function ClientListRow({ client }: { client: ClientRow }) {
  const formattedDate = new Date(client.created_at).toLocaleDateString(
    "fr-FR",
    { year: "numeric", month: "short", day: "numeric" },
  );
  const projects = [...(client.projects ?? [])].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
  const publishedProjects = projects.filter((p) => p.is_published).length;

  return (
    <li className="flex flex-col gap-5 border-b border-white/10 py-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <h2 className="text-2xl font-light md:text-3xl">
              <Link
                href={`/admin/clients/${client.slug ?? client.id}`}
                className="text-[#F5F5F7] transition-colors hover:text-white/70"
              >
                {client.full_name ?? "Sans nom"}
              </Link>
            </h2>
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
            <span className="text-[10px] uppercase tracking-[0.32em] text-white/45">
              {projects.length === 0
                ? "Aucun projet"
                : `${projects.length} projet${projects.length > 1 ? "s" : ""} · ${publishedProjects} publié${publishedProjects > 1 ? "s" : ""}`}
            </span>
          </div>

          <p className="mt-1 break-all font-mono text-[11px] text-white/35">
            <span>/clients/{client.slug ?? "—"}</span>
            <span className="text-white/20"> · </span>
            <span>{formattedDate}</span>
            {client.client_email && (
              <>
                <span className="text-white/20"> · </span>
                <span>{client.client_email}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-x-8 gap-y-2">
          <Button
            href={`/admin/clients/${client.id}/design`}
            variant="primary"
            className="text-white/55"
          >
            Design
          </Button>
          <Button
            href={`/admin/clients/${client.id}/context`}
            variant="primary"
            className="text-white/55"
          >
            Contexte
          </Button>
          <Button
            href={`/admin/clients/${client.id}/personas`}
            variant="primary"
            className="text-white/55"
          >
            Personas
          </Button>
          <Button
            href={`/admin/clients/${client.id}/media`}
            variant="primary"
            className="text-white/55"
          >
            Médiathèque
          </Button>
          <Button
            href={`/admin/clients/${client.id}/projects/new`}
            variant="primary"
            className="text-white/55"
          >
            + Projet
          </Button>
          {client.slug && (
            <Button
              href={`/clients/${client.slug}`}
              target="_blank"
              rel="noopener"
              variant="primary"
              className="text-white/55"
            >
              Ouvrir
            </Button>
          )}
        </div>
      </div>

      {projects.length > 0 && (
        <ul className="flex flex-col gap-1 md:pl-6">
          {projects.map((project) => {
            const typeLabel = getProjectTypeLabel(project.project_type);
            return (
              <li
                key={project.id}
                className="group flex flex-wrap items-baseline gap-x-4 gap-y-1 py-1.5"
              >
                <Link
                  href={`/admin/clients/${client.id}/projects/${project.id}`}
                  className="inline-flex items-baseline gap-x-4 transition-colors"
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
                <div className="ml-auto flex items-center gap-5">
                  <DeleteProjectButton
                    profileId={client.id}
                    projectId={project.id}
                    projectName={project.name}
                  />
                  <Hairline
                    width="md"
                    hover="xl"
                    className="bg-white/25 group-hover:bg-white"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
