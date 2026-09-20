import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { lookupColumn, routeSegment } from "@/lib/admin/routes";
import { Button, Chip, Hairline } from "@/lib/ds";
import type { PageContent } from "@/types/database";
import { DeleteContextButton } from "../_components/delete-context-button";
import type { ClientContextRow } from "../_lib/types";
import { PublishingPanel } from "./publishing-panel";
import { RawHtmlContextView } from "./raw-html-context-view";

export const metadata: Metadata = {
  title: "Parchemin · Archives",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ContextDetailPage({
  params,
}: {
  params: Promise<{ id: string; contextId: string }>;
}) {
  const { id, contextId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/admin/clients/${id}/context/${contextId}`);
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
  if (clientSlug !== id)
    redirect(`/admin/clients/${clientSlug}/context/${contextId}`);

  const { data: ctxData } = await admin
    .from("client_contexts" as never)
    .select(
      "id, profile_id, title, slug, summary, content, source_kind, source_url, source_filename, position, project_id, published_page_id, created_at, updated_at",
    )
    .eq(lookupColumn(contextId), contextId)
    .eq("profile_id", profile.id)
    .maybeSingle<ClientContextRow>();

  if (!ctxData) notFound();
  // URL canonique : le segment porte le titre du parchemin, jamais son UUID.
  if (ctxData.slug && ctxData.slug !== contextId)
    redirect(`/admin/clients/${clientSlug}/context/${ctxData.slug}`);

  const { data: projectsData } = await admin
    .from("projects")
    .select("id, name, slug, is_published")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  const projects = (projectsData ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    is_published: boolean;
  }>;

  const content = (ctxData.content as PageContent) ?? { sections: [] };
  const sections = content.sections ?? [];
  const intro = content.intro ?? null;
  const isRawHtml = content.meta?.style === "raw_html";
  const rawHtml = content.meta?.raw_html ?? "";
  const hiddenElements: string[] = Array.isArray(
    (content.meta as { hidden_elements?: unknown } | undefined)
      ?.hidden_elements,
  )
    ? (content.meta as { hidden_elements: unknown[] }).hidden_elements.filter(
        (s): s is string => typeof s === "string",
      )
    : [];
  const rawTextOverrides = content.meta?.text_overrides;
  const textOverrides: Record<string, string> =
    rawTextOverrides && typeof rawTextOverrides === "object"
      ? Object.fromEntries(
          Object.entries(rawTextOverrides).filter(
            ([k, v]) => typeof k === "string" && typeof v === "string",
          ) as Array<[string, string]>,
        )
      : {};
  const applySpeetchDs =
    (content.meta as { apply_speetch_ds?: unknown } | undefined)
      ?.apply_speetch_ds === true;
  const clientName = profile.full_name ?? "Client";

  const formattedDate = new Date(ctxData.created_at).toLocaleDateString(
    "fr-FR",
    { year: "numeric", month: "long", day: "numeric" },
  );

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
          href={`/admin/clients/${clientSlug}/context`}
          className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 transition-colors hover:text-cyan-100"
        >
          ← Archives
        </Link>
        <span className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
          Parchemin
        </span>
      </header>

      <article className="mx-auto flex max-w-3xl flex-col gap-12 pt-20">
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
              href={`/admin/clients/${clientSlug}/context`}
              className="transition-colors hover:text-cyan-100"
            >
              {clientName}
            </Link>
            <span className="mx-3 text-cyan-200/20">·</span>
            <span className="text-cyan-200/55">Archives</span>
          </p>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <h1
                  className="font-sans font-extralight leading-[0.9] tracking-[-0.04em] text-[#F5F5F7]"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
                >
                  {ctxData.title}
                </h1>
                <Chip
                  tone={ctxData.source_kind === "url" ? "default" : "muted"}
                  className="w-fit"
                >
                  {ctxData.source_kind === "url" ? "URL" : "Upload"}
                </Chip>
                {isRawHtml && (
                  <Chip tone="warning" className="w-fit">
                    Réplique fidèle
                  </Chip>
                )}
              </div>
              {ctxData.summary && (
                <p className="max-w-2xl text-balance font-serif text-base italic text-white/55 md:text-lg">
                  {ctxData.summary}
                </p>
              )}
              <p className="font-mono text-[11px] text-white/35">
                <span>{formattedDate}</span>
                {ctxData.source_kind === "url" && ctxData.source_url && (
                  <>
                    <span className="text-white/20"> · </span>
                    <a
                      href={ctxData.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all underline-offset-2 hover:underline"
                    >
                      {ctxData.source_url}
                    </a>
                  </>
                )}
                {ctxData.source_kind === "upload" &&
                  ctxData.source_filename && (
                    <>
                      <span className="text-white/20"> · </span>
                      <span className="break-all">
                        {ctxData.source_filename}
                      </span>
                    </>
                  )}
              </p>
            </div>

            <DeleteContextButton
              profileId={profile.id}
              contextId={ctxData.id}
              contextTitle={ctxData.title}
              redirectTo={`/admin/clients/${clientSlug}/context`}
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-10">
          <PublishingPanel
            profileId={profile.id}
            contextId={ctxData.id}
            clientSlug={profile.slug ?? null}
            initialProjectId={ctxData.project_id}
            initialPublishedPageId={ctxData.published_page_id}
            projects={projects}
          />
        </div>

        {isRawHtml ? (
          <div>
            <RawHtmlContextView
              rawHtml={rawHtml}
              title={ctxData.title}
              profileId={profile.id}
              contextId={ctxData.id}
              initialHiddenElements={hiddenElements}
              initialTextOverrides={textOverrides}
              applySpeetchDs={applySpeetchDs}
            />
          </div>
        ) : (
          <>
            {intro && (
              <div className="border-t border-white/10 pt-10">
                <p className="max-w-2xl text-balance font-serif text-lg italic leading-relaxed text-white/75 md:text-xl">
                  {intro}
                </p>
              </div>
            )}

            {sections.length === 0 ? (
              <p className="text-balance border-t border-white/10 pt-10 font-serif text-base italic text-white/40">
                Cette note n&apos;a pas de contenu structuré (HTML source vide
                ou non-exploitable).
              </p>
            ) : (
              <div className="flex flex-col gap-12 border-t border-white/10 pt-10">
                {sections.map((section, i) => (
                  <ContextSection
                    key={section.id ?? `s-${i}`}
                    title={section.title}
                    body={section.type === "text" ? (section.body ?? "") : ""}
                    index={i}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-8">
          <Link
            href={`/admin/clients/${clientSlug}/context`}
            className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-white/55 transition-colors hover:text-white"
          >
            <Hairline width="md" hover="lg" />
            <span>Toutes les notes</span>
          </Link>
          <Button
            href={`/admin/clients/${clientSlug}/context/new`}
            variant="ghost"
          >
            + Nouvelle note
          </Button>
        </div>
      </article>
    </div>
  );
}

function ContextSection({
  title,
  body,
  index,
}: {
  title?: string;
  body: string;
  index: number;
}) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.4em] text-white/35">
          {String(index + 1).padStart(2, "0")}
        </span>
        {title && (
          <h2
            className="font-sans font-light leading-[1.1] tracking-[-0.02em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(1.25rem, 2.6vw, 1.75rem)" }}
          >
            {title}
          </h2>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {paragraphs.map((para, i) => {
          const isBulletBlock =
            /^[•\-–*]\s/.test(para) || /\n[•\-–*]\s/.test(para);
          if (isBulletBlock) {
            const items = para
              .split(/\n+/)
              .map((line) => line.replace(/^[•\-–*]\s*/, "").trim())
              .filter(Boolean);
            return (
              <ul key={i} className="flex flex-col gap-2 pl-5 text-white/80">
                {items.map((item, j) => (
                  <li
                    key={j}
                    className="relative leading-relaxed before:absolute before:-left-4 before:text-white/30 before:content-['–']"
                  >
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p
              key={i}
              className="max-w-2xl whitespace-pre-line font-serif text-base leading-[1.7] text-white/80 md:text-lg"
            >
              {renderInline(para)}
            </p>
          );
        })}
      </div>
    </section>
  );
}

function renderInline(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  const regex = /«\s([^»]+?)\s»|_([^_\n]+?)_/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const inner = match[1] ?? match[2] ?? "";
    nodes.push(
      <em key={key++} className="font-serif italic text-white/95">
        {match[1] ? `« ${inner} »` : inner}
      </em>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length === 0 ? text : nodes;
}
