import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, Eyebrow } from "@/lib/ds";

export const metadata: Metadata = {
  title: "Holocrons",
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
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
      {/* Star field + scanlines + sabre vertical — thème Conseil Jedi */}
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

      {/* Header — mobile only */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href="/admin"
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Conseil
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Holocrons
        </span>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-12 pt-24 md:pt-20">
        <div className="flex flex-col gap-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            Conseil Jedi
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <h1
              className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
            >
              Les{" "}
              <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
                Holocrons
              </span>
            </h1>

            <Button href="/admin/clients/new" variant="return">
              Forger un holocron
            </Button>
          </div>

          <Eyebrow tracking="md" className="text-cyan-200/70">
            {totalClients === 0
              ? "Aucun holocron forgé pour le moment"
              : `${totalClients} holocron${totalClients > 1 ? "s" : ""} · ${totalPublishedClients} scellé${totalPublishedClients > 1 ? "s" : ""}`}
          </Eyebrow>
        </div>

        {error && (
          <p
            className="border-l-2 border-red-400/50 pl-4 text-[11px] uppercase tracking-[0.32em] text-red-300/85"
            style={{ textShadow: "0 0 8px rgba(252, 165, 165, 0.35)" }}
          >
            Erreur de transmission · {error.message}
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
    <div className="relative flex flex-col items-start gap-8 pt-16">
      <div
        aria-hidden
        className="sw-hologram-line absolute inset-x-0 top-0"
      />
      <p className="max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
        Le Conseil n&apos;a pas encore d&apos;archive holocron. Le premier
        prendra forme dès qu&apos;il sera forgé.
      </p>
      <Button href="/admin/clients/new" variant="large">
        Forger le premier holocron
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
        className="group flex h-full flex-col gap-4 border border-cyan-200/15 bg-cyan-200/[0.015] px-5 py-6 transition-colors hover:border-cyan-200/40 hover:bg-cyan-200/[0.04]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-light text-[#F5F5F7] transition-colors group-hover:text-cyan-100 md:text-2xl">
            {client.full_name ?? "Sans nom"}
          </h2>
          {client.is_published ? (
            <span
              className="sw-cyan-dot mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300"
              title="Holocron scellé (publié)"
            />
          ) : (
            <span
              className="mt-2 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300"
              title="Holocron en forge (caché)"
            />
          )}
        </div>

        <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/55">
          {projects.length === 0
            ? "Aucune mission"
            : `${projects.length} mission${projects.length > 1 ? "s" : ""} · ${publishedProjects} active${publishedProjects > 1 ? "s" : ""}`}
        </p>

        <p className="mt-auto break-all font-mono text-[11px] text-white/35">
          /clients/{client.slug ?? "—"}
        </p>
      </Link>
    </li>
  );
}
