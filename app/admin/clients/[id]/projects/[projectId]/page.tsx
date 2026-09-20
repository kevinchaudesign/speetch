import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { lookupColumn, routeSegment } from "@/lib/admin/resolve-client";
import { getProjectTypeLabel } from "@/lib/project-types";
import { isDbTemplateId } from "@/lib/page-templates";
import { Button, StatusBadge } from "@/lib/ds";
import {
  ProjectBoard,
  type BoardLot,
  type BoardNote,
  type BoardPage,
} from "./_components/project-board";
import type { ProjectLotRow } from "./_lib/lot-types";
import type { ClientContextRow } from "../../context/_lib/types";

export const metadata: Metadata = {
  title: "Mission · Parchemins",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageRow = BoardPage;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = await params;

  if (!UUID_REGEX.test(projectId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/admin/clients/${id}/projects/${projectId}`);
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, slug")
    .eq(lookupColumn(id), id)
    .eq("is_owner", false)
    .maybeSingle();
  if (!profile) notFound();
  const clientSlug = routeSegment(profile);
  // URL canonique : le segment porte le nom du client, jamais son UUID.
  if (clientSlug !== id)
    redirect(`/admin/clients/${clientSlug}/projects/${projectId}`);

  const { data: project } = await admin
    .from("projects")
    .select(
      "id, name, subtitle, project_type, is_published, profile_id, profiles!profile_id(full_name, slug)",
    )
    .eq("id", projectId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  const { data: pagesData } = await admin
    .from("pages")
    .select(
      "id, name, slug, template_id, position, is_published, created_at, lot_id" as never,
    )
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<BoardPage[]>();

  // Notes publiées sur ce projet (project_id = projectId).
  // On les lit AVANT de filtrer les pages : on a besoin de leurs
  // published_page_id pour exclure les pages-snapshot de la liste affichée.
  const { data: notesData } = await admin
    .from("client_contexts" as never)
    .select(
      "id, title, slug, position, source_kind, created_at, lot_id, published_page_id",
    )
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<
      Array<
        Pick<
          ClientContextRow,
          | "id"
          | "title"
          | "slug"
          | "position"
          | "source_kind"
          | "created_at"
          | "lot_id"
          | "published_page_id"
        >
      >
    >();

  // Une note publiée crée une page-snapshot dans `pages` (id =
  // published_page_id). On masque ces snapshots dans la liste : la note est
  // la source de vérité (titre, contenu, lot), la page suit silencieusement.
  // Sinon on aurait un doublon visuel (titre × 2 : une fois dans le lot de
  // la note, une fois dans "Hors lot" du côté page).
  const snapshotPageIds = new Set(
    (notesData ?? [])
      .map((n) => n.published_page_id)
      .filter((id): id is string => id !== null),
  );

  const pages: PageRow[] = ((pagesData ?? []) as PageRow[]).filter(
    (p) => !snapshotPageIds.has(p.id),
  );
  const publishedCount = pages.filter((p) => p.is_published).length;

  const notes: BoardNote[] = (notesData ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    slug: n.slug,
    position: n.position,
    is_published: n.published_page_id !== null,
    source_kind: n.source_kind,
    created_at: n.created_at,
    lot_id: n.lot_id,
  }));

  // Lots du projet
  const { data: lotsData } = await admin
    .from("project_lots" as never)
    .select("id, name, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true })
    .returns<Array<Pick<ProjectLotRow, "id" | "name" | "position">>>();
  const lots: BoardLot[] = (lotsData ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    position: l.position,
  }));

  // Batch-fetch les labels des templates DB référencés
  const dbTemplateIds = Array.from(
    new Set(pages.map((p) => p.template_id).filter(isDbTemplateId)),
  );
  const dbTemplateLabels = new Map<string, string>();
  if (dbTemplateIds.length > 0) {
    const { data: tpls } = await admin
      .from("page_templates")
      .select("id, label")
      .in("id", dbTemplateIds);
    for (const tpl of tpls ?? []) {
      dbTemplateLabels.set(tpl.id, tpl.label);
    }
  }
  const clientName =
    (project.profiles as { full_name: string | null } | null)?.full_name ??
    "Client";
  const typeLabel = getProjectTypeLabel(project.project_type);

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

      {/* Header — mobile only */}
      <header className="flex items-center justify-between md:hidden">
        <Link
          href={`/admin/clients/${clientSlug}`}
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← {clientName}
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Mission
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
            {typeLabel && (
              <>
                <span className="mx-3 text-cyan-200/20">·</span>
                <span className="text-cyan-200/55">{typeLabel}</span>
              </>
            )}
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <h1
                  className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
                  style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
                >
                  {project.name}
                </h1>
                {project.is_published ? (
                  <StatusBadge tone="success">Active</StatusBadge>
                ) : (
                  <StatusBadge tone="warning">En forge</StatusBadge>
                )}
              </div>
              {project.subtitle && (
                <p className="max-w-xl text-balance font-serif text-base italic text-white/55 md:text-lg">
                  {project.subtitle}
                </p>
              )}
            </div>

            <Button
              href={`/admin/clients/${clientSlug}/projects/${projectId}/pages/new`}
              variant="primary"
            >
              + Nouveau parchemin
            </Button>
          </div>

          <p className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
            {pages.length === 0 && notes.length === 0
              ? "Aucun parchemin ni note pour le moment"
              : [
                  `${pages.length} parchemin${pages.length > 1 ? "s" : ""} · ${publishedCount} actif${publishedCount > 1 ? "s" : ""}`,
                  notes.length > 0
                    ? `${notes.length} note${notes.length > 1 ? "s" : ""}`
                    : null,
                  lots.length > 0
                    ? `${lots.length} lot${lots.length > 1 ? "s" : ""}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </p>
        </div>

        {pages.length === 0 && notes.length === 0 && lots.length === 0 ? (
          <EmptyState clientId={id} projectId={projectId} />
        ) : (
          <ProjectBoard
            profileId={profile.id}
            projectId={projectId}
            initialLots={lots}
            initialPages={pages}
            initialNotes={notes}
            dbTemplateLabels={Object.fromEntries(dbTemplateLabels)}
          />
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

function EmptyState({
  clientId,
  projectId,
}: {
  clientId: string;
  projectId: string;
}) {
  return (
    <div className="relative flex flex-col items-start gap-8 pt-16">
      <div aria-hidden className="sw-hologram-line absolute inset-x-0 top-0" />
      <p className="max-w-md text-balance font-serif text-base italic text-white/55 md:text-lg">
        Cette mission n&apos;a encore aucun parchemin. Démarre avec un blueprint
        pour poser une première mise en forme.
      </p>
      <Button
        href={`/admin/clients/${clientId}/projects/${projectId}/pages/new`}
        variant="large"
      >
        Forger le premier parchemin
      </Button>
    </div>
  );
}
