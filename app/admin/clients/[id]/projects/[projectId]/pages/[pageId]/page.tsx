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
  const isDeliverables =
    ((page.content as PageContent) ?? {}).meta?.style === "deliverables";

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

  // Mode "Livrables" : on précharge la liste des livrables + leurs feedbacks
  // + tous les médias disponibles dans la médiathèque du client pour le
  // picker + la liste des dossiers (sidebar de navigation du picker).
  let initialDeliverables: import("./deliverables-admin-editor").AdminDeliverable[] | null = null;
  let availableMedia: import("./deliverables-admin-editor").AdminMediaOption[] = [];
  let availableFolders: import("./deliverables-admin-editor").AdminFolderOption[] = [];
  if (isDeliverables) {
    const { data: delivRows } = await admin
      .from("client_page_deliverables" as never)
      .select(
        "id, media_id, format, title, description, status, position",
      )
      .eq("page_id", page.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<
        Array<{
          id: string;
          media_id: string | null;
          format: string | null;
          title: string | null;
          description: string | null;
          status: "pending" | "approved" | "changes_requested";
          position: number;
        }>
      >();

    const { data: feedbackRows } = await admin
      .from("client_deliverable_feedback" as never)
      .select(
        "id, deliverable_id, author_kind, body, created_at, client_page_deliverables!inner(page_id)",
      )
      .eq("client_page_deliverables.page_id", page.id)
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

    const feedbacksByDeliv = new Map<
      string,
      import("./deliverables-admin-editor").AdminDeliverableFeedback[]
    >();
    for (const f of feedbackRows ?? []) {
      const arr = feedbacksByDeliv.get(f.deliverable_id);
      const entry = {
        id: f.id,
        author_kind: f.author_kind,
        body: f.body,
        created_at: f.created_at,
      };
      if (arr) arr.push(entry);
      else feedbacksByDeliv.set(f.deliverable_id, [entry]);
    }

    const mediaIds = (delivRows ?? [])
      .map((d) => d.media_id)
      .filter((v): v is string => !!v);
    const mediaById = new Map<
      string,
      import("./deliverables-admin-editor").AdminMediaOption
    >();
    if (mediaIds.length > 0) {
      const { data: usedMedia } = await admin
        .from("client_media" as never)
        .select(
          "id, filename, mime_type, storage_path, folder_id, client_media_folders(name)",
        )
        .in("id", mediaIds)
        .returns<
          Array<{
            id: string;
            filename: string;
            mime_type: string;
            storage_path: string;
            folder_id: string | null;
            client_media_folders: { name: string } | { name: string }[] | null;
          }>
        >();
      for (const m of usedMedia ?? []) {
        const { data: pub } = admin.storage
          .from("page-media")
          .getPublicUrl(m.storage_path);
        const folder = Array.isArray(m.client_media_folders)
          ? m.client_media_folders[0]
          : m.client_media_folders;
        mediaById.set(m.id, {
          id: m.id,
          filename: m.filename,
          mime_type: m.mime_type,
          public_url: pub.publicUrl,
          folder_id: m.folder_id,
          folder_name: folder?.name ?? null,
        });
      }
    }

    initialDeliverables = (delivRows ?? []).map((d) => ({
      id: d.id,
      media_id: d.media_id,
      format: d.format,
      title: d.title,
      description: d.description,
      status: d.status,
      position: d.position,
      media: d.media_id ? mediaById.get(d.media_id) ?? null : null,
      feedbacks: feedbacksByDeliv.get(d.id) ?? [],
    }));

    // Tous les médias du client pour le picker. On limite aux images +
    // vidéos (déjà filtré par mime côté UI mais autant cadrer).
    const { data: allMedia } = await admin
      .from("client_media" as never)
      .select(
        "id, filename, mime_type, storage_path, folder_id, position, created_at, client_media_folders(name)",
      )
      .eq("profile_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false })
      .returns<
        Array<{
          id: string;
          filename: string;
          mime_type: string;
          storage_path: string;
          folder_id: string | null;
          position: number;
          created_at: string;
          client_media_folders: { name: string } | { name: string }[] | null;
        }>
      >();

    availableMedia = (allMedia ?? []).map((m) => {
      const { data: pub } = admin.storage
        .from("page-media")
        .getPublicUrl(m.storage_path);
      const folder = Array.isArray(m.client_media_folders)
        ? m.client_media_folders[0]
        : m.client_media_folders;
      return {
        id: m.id,
        filename: m.filename,
        mime_type: m.mime_type,
        public_url: pub.publicUrl,
        folder_id: m.folder_id,
        folder_name: folder?.name ?? null,
      };
    });

    // Liste des dossiers de la médiathèque pour la sidebar du picker.
    const { data: foldersData } = await admin
      .from("client_media_folders" as never)
      .select("id, name, position")
      .eq("profile_id", id)
      .order("position", { ascending: true })
      .returns<Array<{ id: string; name: string; position: number }>>();
    availableFolders = (foldersData ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      position: f.position,
    }));
  }

  return (
    <PageEditor
      initialPage={page}
      clientId={id}
      projectId={projectId}
      projectName={projectObj.name}
      clientName={profileObj?.full_name ?? "Client"}
      publicHref={publicHref}
      initialDeliverables={initialDeliverables}
      availableMedia={availableMedia}
      availableFolders={availableFolders}
    />
  );
}
