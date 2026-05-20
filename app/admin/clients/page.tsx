import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, Eyebrow } from "@/lib/ds";

export const metadata: Metadata = {
  title: "Espaces clients",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ClientRow = {
  id: string;
  full_name: string | null;
  slug: string | null;
  is_published: boolean;
  created_at: string;
  projects: { id: string; is_published: boolean }[] | null;
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
      "id, full_name, slug, is_published, created_at, projects!profile_id(id, is_published)",
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
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
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

function ClientCard({ client }: { client: ClientRow }) {
  const projects = client.projects ?? [];
  const publishedProjects = projects.filter((p) => p.is_published).length;
  const href = `/admin/clients/${client.slug ?? client.id}`;

  return (
    <li>
      <Link
        href={href}
        className="group flex h-full flex-col gap-4 border border-white/10 bg-white/[0.02] px-5 py-6 transition-colors hover:border-white/25 hover:bg-white/[0.04]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-light text-[#F5F5F7] transition-colors md:text-2xl">
            {client.full_name ?? "Sans nom"}
          </h2>
          {client.is_published ? (
            <span
              className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300"
              title="Espace publié"
            />
          ) : (
            <span
              className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300"
              title="Espace caché"
            />
          )}
        </div>

        <p className="text-[10px] uppercase tracking-[0.32em] text-white/45">
          {projects.length === 0
            ? "Aucun projet"
            : `${projects.length} projet${projects.length > 1 ? "s" : ""} · ${publishedProjects} publié${publishedProjects > 1 ? "s" : ""}`}
        </p>

        <p className="mt-auto break-all font-mono text-[11px] text-white/35">
          /clients/{client.slug ?? "—"}
        </p>
      </Link>
    </li>
  );
}

