import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { lookupColumn, routeSegment } from "@/lib/admin/routes";
import { Button, Chip, Hairline } from "@/lib/ds";
import type { ClientContextSummary } from "./_lib/types";
import { DeleteContextButton } from "./_components/delete-context-button";
import { SpeetchStyleButton } from "./_components/speetch-style-button";

export const metadata: Metadata = {
  title: "Archives · Holocron",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ClientContextListPage({
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
    redirect(`/login?redirect=/admin/clients/${id}/context`);
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, slug")
    .eq(lookupColumn(id), id)
    .eq("is_owner", false)
    .maybeSingle();

  if (!profile) notFound();
  const clientSlug = routeSegment(profile);
  // URL canonique : le segment porte le nom du client, jamais son UUID.
  if (clientSlug !== id) redirect(`/admin/clients/${clientSlug}/context`);

  const { data: contextsData } = await admin
    .from("client_contexts" as never)
    .select(
      "id, title, slug, summary, source_kind, source_url, source_filename, position, project_id, published_page_id, content, created_at, updated_at",
    )
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  type ContextWithContent = ClientContextSummary & {
    content: { meta?: { apply_speetch_ds?: unknown } } | null;
  };
  const contexts = (contextsData ?? []) as unknown as ContextWithContent[];
  const clientName = profile.full_name ?? "Client";

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
          Archives
        </span>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col gap-12 pt-20">
        <div className="flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link
              href="/admin/clients"
              className="transition-colors hover:text-cyan-100"
            >
              Holocrons
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <Link
              href={`/admin/clients/${clientSlug}`}
              className="text-cyan-200/85 transition-colors hover:text-cyan-100"
            >
              {clientName}
            </Link>
            <span className="mx-3 text-cyan-200/20">·</span>
            <span className="text-cyan-200/55">Archives</span>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <h1
                className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
                style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
              >
                Archives{" "}
                <span className="sw-hologram-text sw-hologram-glitch font-serif font-normal italic">
                  internes
                </span>
              </h1>
              <p className="max-w-xl text-balance font-serif text-base italic text-white/55 md:text-lg">
                Parchemins privés sur cet holocron — briefs, artifacts,
                recherches. Jamais visibles côté espace public.
              </p>
            </div>

            <Button
              href={`/admin/clients/${clientSlug}/context/new`}
              variant="primary"
            >
              + Nouveau parchemin
            </Button>
          </div>

          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
            {contexts.length === 0
              ? "Aucun parchemin scellé pour le moment"
              : `${contexts.length} parchemin${contexts.length > 1 ? "s" : ""} d'archive`}
          </p>
        </div>

        {contexts.length === 0 ? (
          <EmptyState clientId={id} />
        ) : (
          <ul className="relative flex flex-col">
            <div
              aria-hidden
              className="sw-hologram-line absolute inset-x-0 top-0"
            />
            {contexts.map((ctx, i) => {
              const formattedDate = new Date(ctx.created_at).toLocaleDateString(
                "fr-FR",
                { year: "numeric", month: "short", day: "numeric" },
              );
              return (
                <li
                  key={ctx.id}
                  className="relative flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3 py-7"
                >
                  {i < contexts.length - 1 && (
                    <div
                      aria-hidden
                      className="sw-hologram-line absolute inset-x-0 bottom-0"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                      <Link
                        href={`/admin/clients/${clientSlug}/context/${routeSegment(ctx)}`}
                        className="group text-2xl font-light text-white/85 transition-colors hover:text-cyan-100 md:text-3xl"
                      >
                        {ctx.title}
                      </Link>
                      <Chip
                        tone={ctx.source_kind === "url" ? "default" : "muted"}
                        className="w-fit"
                      >
                        {ctx.source_kind === "url" ? "URL" : "Upload"}
                      </Chip>
                      {ctx.published_page_id && (
                        <Chip tone="success" className="w-fit">
                          Publié
                        </Chip>
                      )}
                      <SpeetchStyleButton
                        profileId={profile.id}
                        contextId={ctx.id}
                        initialEnabled={
                          ctx.content?.meta?.apply_speetch_ds === true
                        }
                        variant="chip"
                      />
                    </div>
                    {ctx.summary && (
                      <p className="max-w-2xl text-balance font-serif text-sm italic text-white/65 md:text-base">
                        {ctx.summary}
                      </p>
                    )}
                    <p className="font-mono text-[11px] text-white/40">
                      <span>{formattedDate}</span>
                      <span className="text-cyan-200/25"> · </span>
                      <span className="break-all">
                        {ctx.source_kind === "url"
                          ? (ctx.source_url ?? "—")
                          : (ctx.source_filename ?? "—")}
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-6">
                    <DeleteContextButton
                      profileId={profile.id}
                      contextId={ctx.id}
                      contextTitle={ctx.title}
                      redirectTo={`/admin/clients/${clientSlug}/context`}
                    />
                    <Link
                      href={`/admin/clients/${clientSlug}/context/${routeSegment(ctx)}`}
                      className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors hover:text-cyan-100"
                    >
                      <span>Ouvrir</span>
                      <Hairline width="sm" hover="lg" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center gap-6 pt-4">
          <Button href={`/admin/clients/${clientSlug}`} variant="ghost">
            ← Retour {clientName}
          </Button>
          <Button href="/admin/clients" variant="ghost">
            Tous les Holocrons
          </Button>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ clientId }: { clientId: string }) {
  return (
    <div className="relative flex flex-col items-start gap-8 pt-16">
      <div aria-hidden className="sw-hologram-line absolute inset-x-0 top-0" />
      <p className="max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
        Aucun parchemin d&apos;archive pour cet holocron. Confie un fichier HTML
        ou colle une URL — la Force analyse et structure le parchemin dans le
        Codex Speetch.
      </p>
      <Button href={`/admin/clients/${clientId}/context/new`} variant="large">
        Forger le premier parchemin
      </Button>
    </div>
  );
}
