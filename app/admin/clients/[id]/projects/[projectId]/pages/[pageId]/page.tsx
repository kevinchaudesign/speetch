import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Page, PageContent } from "@/types/database";
import { PageEditor } from "./page-editor";
import { RawHtmlPageEditor } from "./_raw/raw-html-page-editor";

export const metadata: Metadata = {
  title: "Éditer la page",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string; projectId: string; pageId: string }>;
}) {
  const { id, projectId, pageId } = await params;

  if (
    !UUID_REGEX.test(id) ||
    !UUID_REGEX.test(projectId) ||
    !UUID_REGEX.test(pageId)
  ) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirect=/admin/clients/${id}/projects/${projectId}/pages/${pageId}`,
    );
  }

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data: pageData } = await admin
    .from("pages")
    .select(
      "id, project_id, name, slug, template_id, content, position, is_published, created_at, updated_at, projects!inner(id, name, slug, is_published, profile_id, profiles!profile_id(id, full_name, slug, is_published))",
    )
    .eq("id", pageId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!pageData) notFound();

  const project = pageData.projects as
    | {
        id: string;
        name: string;
        slug: string;
        is_published: boolean;
        profile_id: string;
        profiles:
          | {
              id: string;
              full_name: string | null;
              slug: string | null;
              is_published: boolean;
            }
          | {
              id: string;
              full_name: string | null;
              slug: string | null;
              is_published: boolean;
            }[]
          | null;
      }
    | null
    | Array<{
        id: string;
        name: string;
        slug: string;
        is_published: boolean;
        profile_id: string;
        profiles:
          | {
              id: string;
              full_name: string | null;
              slug: string | null;
              is_published: boolean;
            }
          | {
              id: string;
              full_name: string | null;
              slug: string | null;
              is_published: boolean;
            }[]
          | null;
      }>;
  const projectObj = Array.isArray(project) ? project[0] : project;
  if (!projectObj || projectObj.profile_id !== id) {
    notFound();
  }
  const profileObj = Array.isArray(projectObj.profiles)
    ? projectObj.profiles[0]
    : projectObj.profiles;

  // On reconstitue un Page complet (sans le payload des relations imbriquées)
  const page: Page = {
    id: pageData.id,
    project_id: pageData.project_id,
    name: pageData.name,
    slug: pageData.slug,
    template_id: pageData.template_id,
    content: pageData.content,
    position: pageData.position,
    is_published: pageData.is_published,
    created_at: pageData.created_at,
    updated_at: pageData.updated_at,
  };

  // URL publique disponible uniquement si toute la chaîne est publiée
  const publicHref =
    page.is_published &&
    projectObj.is_published &&
    profileObj?.is_published &&
    profileObj.slug
      ? `/clients/${profileObj.slug}/${projectObj.slug}/${page.slug}`
      : null;

  const isRawHtml =
    ((page.content as PageContent) ?? {}).meta?.style === "raw_html";

  if (isRawHtml) {
    return (
      <RawHtmlPageEditor
        initialPage={page}
        clientId={id}
        projectId={projectId}
        projectName={projectObj.name}
        clientName={profileObj?.full_name ?? "Client"}
        publicHref={publicHref}
      />
    );
  }

  return (
    <PageEditor
      initialPage={page}
      clientId={id}
      projectId={projectId}
      projectName={projectObj.name}
      clientName={profileObj?.full_name ?? "Client"}
      publicHref={publicHref}
    />
  );
}
