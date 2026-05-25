import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionCookieName, verifySession } from "@/lib/crypto";
import { isValidSlug } from "@/lib/slug";
import { highlightCode } from "@/lib/code-highlight";
import type { PageContent } from "@/types/database";
import { PublicPageView } from "./public-page-view";
import { DocumentPageView } from "./document-page-view";
import { RawHtmlPageView } from "./raw-html-page-view";
import { FwaPageView } from "./fwa-page-view";
import {
  DeliverablesPageView,
  type PublicDeliverable,
  type PublicDeliverableFeedback,
} from "./deliverables-page-view";
import { MetaAdsPageView } from "./meta-ads-page-view";
import type { MetaAdMockup } from "@/types/database";

const MEDIA_BUCKET = "page-media";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string; projectSlug: string; pageSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, projectSlug, pageSlug } = await params;
  if (!isValidSlug(slug) || !isValidSlug(projectSlug) || !isValidSlug(pageSlug)) {
    return { title: "Page introuvable", robots: { index: false, follow: false } };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("client_pages")
    .select("page_name, client_name")
    .eq("client_slug", slug)
    .eq("project_slug", projectSlug)
    .eq("page_slug", pageSlug)
    .maybeSingle();

  if (!data) {
    return { title: "Page introuvable", robots: { index: false, follow: false } };
  }

  return {
    title: `${data.page_name ?? "Page"} · ${data.client_name ?? "Speetch"}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicPageRoute({ params }: Props) {
  const { slug, projectSlug, pageSlug } = await params;
  if (!isValidSlug(slug) || !isValidSlug(projectSlug) || !isValidSlug(pageSlug)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: page } = await supabase
    .from("client_pages")
    .select(
      "profile_id, client_slug, client_name, project_id, project_slug, project_name, project_type, page_id, page_slug, page_name, page_content, page_created_at, page_updated_at",
    )
    .eq("client_slug", slug)
    .eq("project_slug", projectSlug)
    .eq("page_slug", pageSlug)
    .maybeSingle();

  if (
    !page ||
    !page.profile_id ||
    !page.project_id ||
    !page.page_id ||
    !page.client_slug ||
    !page.project_slug ||
    !page.page_slug
  ) {
    notFound();
  }

  // Cookie gate — réutilise le même cookie que /clients/[slug]
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(getSessionCookieName(page.profile_id))?.value;
  const unlocked = verifySession(page.profile_id, sessionValue);

  if (!unlocked) {
    // Renvoie vers la racine de l'espace pour afficher le gate.
    redirect(`/clients/${slug}`);
  }

  // Précédent / Suivant — fetch des autres pages publiées du même projet.
  // Ordre : lot.position d'abord (NULLS LAST → pages hors lot en fin), puis
  // page.position (renumérotée 0..N-1 par lot côté admin). On cast via
  // .returns<>() le temps que les types Supabase régénèrent lot_*.
  const { data: siblings } = await supabase
    .from("client_pages")
    .select(
      "page_id, page_slug, page_name, page_position, lot_id, lot_position, lot_name",
    )
    .eq("project_id", page.project_id)
    .order("lot_position", { ascending: true, nullsFirst: false })
    .order("page_position", { ascending: true })
    .returns<
      Array<{
        page_id: string | null;
        page_slug: string | null;
        page_name: string | null;
        page_position: number | null;
        lot_id: string | null;
        lot_position: number | null;
        lot_name: string | null;
      }>
    >();

  const ordered = siblings ?? [];
  const currentIdx = ordered.findIndex((p) => p.page_id === page.page_id);
  const prev = currentIdx > 0 ? ordered[currentIdx - 1] : null;
  const next =
    currentIdx >= 0 && currentIdx < ordered.length - 1
      ? ordered[currentIdx + 1]
      : null;

  const content = (page.page_content as PageContent) ?? {};
  const prevTarget =
    prev && prev.page_slug && prev.page_name
      ? { slug: prev.page_slug, name: prev.page_name }
      : null;
  const nextTarget =
    next && next.page_slug && next.page_name
      ? { slug: next.page_slug, name: next.page_name }
      : null;

  const style = content.meta?.style;

  // Pré-rendu des sections code via shiki (server-side). Map sectionId → HTML
  // coloré, passée aux 3 views client (document, fwa, public). Variante de
  // thème selon le rendu : "light" pour le document éditorial, "dark" sinon.
  let highlightedCode: Record<string, string> = {};
  if (!style || style === "document" || style === "fwa") {
    const variant: "dark" | "light" = style === "document" ? "light" : "dark";
    const codeSections = (content.sections ?? []).filter(
      (s) => s.type === "code" && s.code,
    );
    if (codeSections.length > 0) {
      const entries = await Promise.all(
        codeSections.map(
          async (s) =>
            [s.id, await highlightCode(s.code ?? "", s.language, variant)] as const,
        ),
      );
      highlightedCode = Object.fromEntries(entries);
    }
  }

  const navPages = ordered
    .filter(
      (p): p is {
        page_id: string;
        page_slug: string;
        page_name: string;
        page_position: number | null;
        lot_id: string | null;
        lot_position: number | null;
        lot_name: string | null;
      } => !!p.page_slug && !!p.page_name,
    )
    .map((p) => ({
      slug: p.page_slug,
      name: p.page_name,
      lot_id: p.lot_id,
      lot_name: p.lot_name,
      lot_position: p.lot_position,
    }));

  if (style === "deliverables") {
    // Fetch livrables + feedbacks via les vues publiques (filtre déjà
    // is_published + slug not null côté DB).
    const { data: delivRows } = await supabase
      .from("client_page_deliverables_public" as never)
      .select(
        "id, position, format, title, description, status, media_id, media_filename, media_mime_type, media_storage_path",
      )
      .eq("page_id", page.page_id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<
        Array<{
          id: string;
          position: number;
          format: string | null;
          title: string | null;
          description: string | null;
          status: "pending" | "approved" | "changes_requested";
          media_id: string | null;
          media_filename: string | null;
          media_mime_type: string | null;
          media_storage_path: string | null;
        }>
      >();

    const { data: feedbackRows } = await supabase
      .from("client_deliverable_feedback_public" as never)
      .select("id, deliverable_id, author_kind, body, created_at")
      .eq("page_id", page.page_id)
      .order("created_at", { ascending: true })
      .returns<
        Array<{
          id: string;
          deliverable_id: string;
          author_kind: "owner" | "client";
          body: string;
          created_at: string;
        }>
      >();

    const feedbacksByDeliverable = new Map<string, PublicDeliverableFeedback[]>();
    for (const f of feedbackRows ?? []) {
      const entry: PublicDeliverableFeedback = {
        id: f.id,
        author_kind: f.author_kind,
        body: f.body,
        created_at: f.created_at,
      };
      const arr = feedbacksByDeliverable.get(f.deliverable_id);
      if (arr) arr.push(entry);
      else feedbacksByDeliverable.set(f.deliverable_id, [entry]);
    }

    const deliverables: PublicDeliverable[] = (delivRows ?? []).map((d) => {
      let media: PublicDeliverable["media"] = null;
      if (d.media_id && d.media_storage_path && d.media_mime_type) {
        const { data: pub } = supabase.storage
          .from(MEDIA_BUCKET)
          .getPublicUrl(d.media_storage_path);
        media = {
          filename: d.media_filename ?? "media",
          mime_type: d.media_mime_type,
          public_url: pub.publicUrl,
        };
      }
      return {
        id: d.id,
        position: d.position,
        format: d.format,
        title: d.title,
        description: d.description,
        status: d.status,
        media,
        feedbacks: feedbacksByDeliverable.get(d.id) ?? [],
      };
    });

    return (
      <DeliverablesPageView
        clientSlug={page.client_slug}
        clientName={page.client_name ?? "Espace client"}
        projectSlug={page.project_slug}
        projectName={page.project_name ?? "Projet"}
        pageName={page.page_name ?? "Page"}
        intro={content.intro ?? null}
        deliverables={deliverables}
      />
    );
  }

  if (style === "meta_ads") {
    const mockups: MetaAdMockup[] = Array.isArray(content.meta?.meta_ads)
      ? (content.meta!.meta_ads as MetaAdMockup[])
      : [];
    return (
      <MetaAdsPageView
        clientSlug={page.client_slug}
        clientName={page.client_name ?? "Espace client"}
        projectSlug={page.project_slug}
        projectName={page.project_name ?? "Projet"}
        pageName={page.page_name ?? "Page"}
        intro={content.intro ?? null}
        mockups={mockups}
      />
    );
  }

  if (style === "raw_html" && typeof content.meta?.raw_html === "string") {
    const applySpeetchDs =
      (content.meta as { apply_speetch_ds?: unknown } | undefined)
        ?.apply_speetch_ds === true;

    // Fetch des annotations existantes pour cette page (lecture publique via RLS)
    const { data: annotationsData } = await supabase
      .from("client_annotations" as never)
      .select(
        "id, color, anchor_exact, anchor_prefix, anchor_suffix, comment, created_at",
      )
      .eq("profile_id", page.profile_id)
      .eq("target_kind", "page")
      .eq("target_id", page.page_id)
      .order("created_at", { ascending: true })
      .returns<
        Array<{
          id: string;
          color: "yellow" | "green" | "pink" | "blue";
          anchor_exact: string;
          anchor_prefix: string;
          anchor_suffix: string;
          comment: string | null;
          created_at: string;
        }>
      >();

    return (
      <RawHtmlPageView
        clientSlug={page.client_slug}
        clientName={page.client_name ?? "Espace client"}
        projectSlug={page.project_slug}
        projectName={page.project_name ?? "Projet"}
        pageName={page.page_name ?? "Page"}
        pageSlug={page.page_slug}
        pageId={page.page_id}
        rawHtml={content.meta.raw_html}
        textOverrides={content.meta.text_overrides}
        imageOverrides={content.meta.image_overrides}
        imageOverridesById={content.meta.image_overrides_by_id}
        applySpeetchDs={applySpeetchDs}
        pages={navPages}
        initialAnnotations={(annotationsData ?? []).map((a) => ({
          id: a.id,
          color: a.color,
          anchor_exact: a.anchor_exact,
          anchor_prefix: a.anchor_prefix,
          anchor_suffix: a.anchor_suffix,
          comment: a.comment,
        }))}
      />
    );
  }

  if (style === "fwa") {
    return (
      <FwaPageView
        clientSlug={page.client_slug}
        clientName={page.client_name ?? "Espace client"}
        projectSlug={page.project_slug}
        projectName={page.project_name ?? "Projet"}
        projectType={page.project_type}
        pageName={page.page_name ?? "Page"}
        pageSlug={page.page_slug}
        content={content}
        prev={prevTarget}
        next={nextTarget}
        pages={navPages}
        highlightedCode={highlightedCode}
      />
    );
  }

  if (style === "document") {
    return (
      <DocumentPageView
        clientSlug={page.client_slug}
        clientName={page.client_name ?? "Espace client"}
        projectSlug={page.project_slug}
        projectName={page.project_name ?? "Projet"}
        projectType={page.project_type}
        pageName={page.page_name ?? "Page"}
        pageSlug={page.page_slug}
        content={content}
        prev={prevTarget}
        next={nextTarget}
        pages={navPages}
        highlightedCode={highlightedCode}
      />
    );
  }

  return (
    <PublicPageView
      clientSlug={page.client_slug}
      clientName={page.client_name ?? "Espace client"}
      projectSlug={page.project_slug}
      projectName={page.project_name ?? "Projet"}
      projectType={page.project_type}
      pageName={page.page_name ?? "Page"}
      pageSlug={page.page_slug}
      content={content}
      prev={prevTarget}
      next={nextTarget}
      pages={navPages}
      highlightedCode={highlightedCode}
    />
  );
}
