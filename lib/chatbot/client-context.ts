/**
 * Snapshot serveur du contexte d'un espace client — utilisé par l'assistant
 * admin quand il est invoqué sur une page `/clients/[slug]`.
 *
 * On agrège : profil, projets, pages (avec lots), sections-image des pages
 * « document » (pour permettre les swaps d'images via tool use), documents
 * de contexte, médiathèque complète (URLs publiques, classées par dossier).
 *
 * RLS : on utilise `createAdminClient()` (service-role). L'auth de l'appelant
 * est déjà vérifiée en amont par la route `/api/admin/assistant`.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { Json, PageContent } from "@/types/database";

const MEDIA_BUCKET = "page-media";

type ProfileSnapshot = {
  id: string;
  full_name: string | null;
  slug: string | null;
  subtitle: string | null;
  client_email: string | null;
  project_type: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  has_avatar: boolean;
  has_design: boolean;
};

type ProjectSnapshot = {
  id: string;
  name: string;
  slug: string;
  project_type: string | null;
  subtitle: string | null;
  is_published: boolean;
  delivery_date: string | null;
  position: number;
};

type PageSnapshot = {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  position: number;
  is_published: boolean;
  style: string | null;
};

type LotSnapshot = {
  id: string;
  project_id: string;
  name: string | null;
  position: number;
};

type ContextSnapshot = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  source_kind: string;
  source_filename: string | null;
  has_content: boolean;
  has_published_page: boolean;
  position: number;
  updated_at: string;
};

type EditableImageSection = {
  page_id: string;
  page_name: string;
  page_slug: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  section_id: string;
  section_type: "image" | "gallery" | "video";
  section_title: string;
  media: Array<{
    index: number;
    url: string;
    caption: string | null;
  }>;
};

type MediaEntry = {
  id: string;
  filename: string;
  url: string;
  kind: "image" | "video" | "other";
  folder_id: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
};

type MediaSnapshot = {
  total: number;
  folders: Array<{ id: string; name: string; position: number }>;
  entries: MediaEntry[];
};

type AnnotationCounters = {
  total: number;
};

function extractStyle(content: Json | null | undefined): string | null {
  if (!content || typeof content !== "object" || Array.isArray(content))
    return null;
  const meta = (content as Record<string, unknown>).meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const style = (meta as Record<string, unknown>).style;
  return typeof style === "string" ? style : null;
}

function hasDesign(content: Json | null | undefined): boolean {
  if (!content || typeof content !== "object" || Array.isArray(content))
    return false;
  const c = content as Record<string, unknown>;
  return Boolean(c.design || c.brand_colors || c.theme);
}

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

function mediaKindFromMime(mime: string): "image" | "video" | "other" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "other";
}

/**
 * Lit `pages.content` et extrait les sections image/gallery/video pour qu'on
 * puisse fournir à Claude la liste exacte des points de swap d'image.
 */
function extractEditableSections(
  content: Json | null | undefined,
): Array<Omit<EditableImageSection, "page_id" | "page_name" | "page_slug" | "project_id" | "project_name" | "project_slug">> {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return [];
  }
  const c = content as PageContent;
  if (!Array.isArray(c.sections)) return [];
  const out: ReturnType<typeof extractEditableSections> = [];
  for (const s of c.sections) {
    if (
      (s.type === "image" || s.type === "gallery" || s.type === "video") &&
      Array.isArray(s.media)
    ) {
      out.push({
        section_id: s.id,
        section_type: s.type,
        section_title: s.title ?? "(sans titre)",
        media: s.media.map((m, i) => ({
          index: i,
          url: m.url,
          caption: m.caption ?? null,
        })),
      });
    }
  }
  return out;
}

export async function loadClientContextSnapshot(
  slug: string,
): Promise<string | null> {
  const supabase = createAdminClient();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "id, full_name, slug, subtitle, client_email, project_type, is_published, avatar_url, content, created_at, updated_at",
    )
    .eq("slug", slug)
    .eq("is_owner", false)
    .maybeSingle();

  if (!profileRow || !profileRow.id) return null;

  const profile: ProfileSnapshot = {
    id: profileRow.id,
    full_name: profileRow.full_name,
    slug: profileRow.slug,
    subtitle: profileRow.subtitle,
    client_email: profileRow.client_email,
    project_type: profileRow.project_type,
    is_published: profileRow.is_published,
    created_at: profileRow.created_at,
    updated_at: profileRow.updated_at,
    has_avatar: Boolean(profileRow.avatar_url),
    has_design: hasDesign(profileRow.content),
  };

  // Lignes brutes typées localement — tables non encore régénérées dans
  // `types/database.ts` (pattern `as never` + cast, cf.
  // `app/admin/clients/[id]/…`).
  type ProjectRowLite = {
    id: string;
    name: string;
    slug: string;
    project_type: string | null;
    subtitle: string | null;
    is_published: boolean;
    delivery_date: string | null;
    position: number;
  };
  type PageRowLite = {
    id: string;
    project_id: string;
    name: string;
    slug: string;
    position: number;
    is_published: boolean;
    content: Json;
  };
  type LotRowLite = {
    id: string;
    project_id: string;
    name: string | null;
    position: number;
  };
  type ContextRowLite = {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    source_kind: string;
    source_filename: string | null;
    content: Json | null;
    published_page_id: string | null;
    position: number;
    updated_at: string;
  };
  type MediaFolderRowLite = {
    id: string;
    name: string;
    position: number;
  };
  type MediaRowLite = {
    id: string;
    filename: string;
    storage_path: string;
    mime_type: string;
    folder_id: string | null;
    width: number | null;
    height: number | null;
    size_bytes: number | null;
    position: number;
  };

  // Charges parallèles : projets, contextes, médias COMPLETS, dossiers.
  const [projectsRes, contextsRes, mediaRes, foldersRes] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, slug, project_type, subtitle, is_published, delivery_date, position",
      )
      .eq("profile_id", profile.id)
      .order("position", { ascending: true }),
    supabase
      .from("client_contexts" as never)
      .select(
        "id, title, slug, summary, source_kind, source_filename, content, position, published_page_id, updated_at",
      )
      .eq("profile_id", profile.id)
      .order("position", { ascending: true })
      .limit(40),
    supabase
      .from("client_media" as never)
      .select(
        "id, filename, storage_path, mime_type, folder_id, width, height, size_bytes, position",
      )
      .eq("profile_id", profile.id)
      .order("position", { ascending: true })
      .limit(300),
    supabase
      .from("client_media_folders" as never)
      .select("id, name, position")
      .eq("profile_id", profile.id)
      .order("position", { ascending: true }),
  ]);

  const projects: ProjectSnapshot[] = (
    (projectsRes.data ?? []) as ProjectRowLite[]
  ).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    project_type: p.project_type,
    subtitle: p.subtitle,
    is_published: p.is_published,
    delivery_date: p.delivery_date,
    position: p.position,
  }));

  // Pages + lots + annotations seulement si le client a des projets.
  let pages: PageSnapshot[] = [];
  let lots: LotSnapshot[] = [];
  let annotations: AnnotationCounters = { total: 0 };
  let editableSections: EditableImageSection[] = [];
  if (projects.length > 0) {
    const projectIds = projects.map((p) => p.id);
    const [pagesRes, lotsRes, annotationsRes] = await Promise.all([
      supabase
        .from("pages")
        .select(
          "id, project_id, name, slug, position, is_published, content",
        )
        .in("project_id", projectIds)
        .order("position", { ascending: true })
        .limit(200),
      supabase
        .from("project_lots" as never)
        .select("id, project_id, name, position")
        .in("project_id", projectIds)
        .order("position", { ascending: true })
        .limit(100),
      supabase
        .from("client_annotations" as never)
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profile.id),
    ]);
    const pageRows = (pagesRes.data ?? []) as PageRowLite[];
    pages = pageRows.map((p) => ({
      id: p.id,
      project_id: p.project_id,
      name: p.name,
      slug: p.slug,
      position: p.position,
      is_published: p.is_published,
      style: extractStyle(p.content),
    }));
    lots = ((lotsRes.data ?? []) as LotRowLite[]).map((l) => ({
      id: l.id,
      project_id: l.project_id,
      name: l.name,
      position: l.position,
    }));
    annotations = {
      total:
        typeof annotationsRes.count === "number" ? annotationsRes.count : 0,
    };

    // Extrait les sections image/gallery/video des pages « document ».
    const projectIndex = new Map(projects.map((p) => [p.id, p]));
    for (const pageRow of pageRows) {
      const style = extractStyle(pageRow.content);
      // raw_html : impossible de muter via tool use V1.
      if (style === "raw_html") continue;
      const proj = projectIndex.get(pageRow.project_id);
      if (!proj) continue;
      const sections = extractEditableSections(pageRow.content);
      for (const s of sections) {
        editableSections.push({
          page_id: pageRow.id,
          page_name: pageRow.name,
          page_slug: pageRow.slug,
          project_id: proj.id,
          project_name: proj.name,
          project_slug: proj.slug,
          ...s,
        });
      }
    }
  }

  const contexts: ContextSnapshot[] = (
    (contextsRes.data ?? []) as ContextRowLite[]
  ).map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    summary: c.summary,
    source_kind: c.source_kind,
    source_filename: c.source_filename,
    has_content: Boolean(c.content),
    has_published_page: Boolean(c.published_page_id),
    position: c.position,
    updated_at: c.updated_at,
  }));

  const folderRows = (foldersRes.data ?? []) as MediaFolderRowLite[];
  const mediaRows = (mediaRes.data ?? []) as MediaRowLite[];

  const mediaEntries: MediaEntry[] = mediaRows.map((m) => {
    const { data: pub } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(m.storage_path);
    return {
      id: m.id,
      filename: m.filename,
      url: pub?.publicUrl ?? "",
      kind: mediaKindFromMime(m.mime_type),
      folder_id: m.folder_id,
      width: m.width,
      height: m.height,
      size_bytes: m.size_bytes,
    };
  });

  const media: MediaSnapshot = {
    total: mediaEntries.length,
    folders: folderRows.map((f) => ({
      id: f.id,
      name: f.name,
      position: f.position,
    })),
    entries: mediaEntries,
  };

  return formatSnapshot({
    profile,
    projects,
    pages,
    lots,
    contexts,
    media,
    annotations,
    editableSections,
  });
}

function formatSnapshot(input: {
  profile: ProfileSnapshot;
  projects: ProjectSnapshot[];
  pages: PageSnapshot[];
  lots: LotSnapshot[];
  contexts: ContextSnapshot[];
  media: MediaSnapshot;
  annotations: AnnotationCounters;
  editableSections: EditableImageSection[];
}): string {
  const {
    profile,
    projects,
    pages,
    lots,
    contexts,
    media,
    annotations,
    editableSections,
  } = input;

  const lines: string[] = [];

  lines.push("## Snapshot du client (lecture admin, à jour à l'instant)");
  lines.push("");
  lines.push("### Profil");
  lines.push(`- Nom : ${profile.full_name ?? "(sans nom)"}`);
  lines.push(`- Slug : ${profile.slug ?? "(inconnu)"}`);
  if (profile.subtitle) lines.push(`- Sous-titre : ${profile.subtitle}`);
  if (profile.client_email)
    lines.push(`- Email contact : ${profile.client_email}`);
  if (profile.project_type)
    lines.push(`- Type de projet : ${profile.project_type}`);
  lines.push(
    `- Statut : ${profile.is_published ? "publié" : "brouillon"} · avatar : ${
      profile.has_avatar ? "oui" : "non"
    } · design custom : ${profile.has_design ? "oui" : "non"}`,
  );
  lines.push(
    `- Espace créé le ${fmtDate(profile.created_at)} · dernière maj ${fmtDate(
      profile.updated_at,
    )}`,
  );
  lines.push("");

  // Projets + pages groupées par projet
  if (projects.length === 0) {
    lines.push("### Projets");
    lines.push("- Aucun projet pour le moment.");
    lines.push("");
  } else {
    lines.push(`### Projets (${projects.length})`);
    for (const proj of projects) {
      const projPages = pages
        .filter((p) => p.project_id === proj.id)
        .sort((a, b) => a.position - b.position);
      const projLots = lots
        .filter((l) => l.project_id === proj.id)
        .sort((a, b) => a.position - b.position);
      const statusBits: string[] = [];
      statusBits.push(proj.is_published ? "publié" : "brouillon");
      if (proj.delivery_date)
        statusBits.push(`livraison ${fmtDate(proj.delivery_date)}`);
      if (proj.project_type) statusBits.push(proj.project_type);
      lines.push(
        `- **${proj.name}** \`/${profile.slug}/${proj.slug}\` — ${statusBits.join(" · ")}`,
      );
      if (proj.subtitle) lines.push(`  · Sous-titre : ${proj.subtitle}`);
      if (projLots.length > 0) {
        const lotLabels = projLots
          .map((l, i) => l.name ?? `Lot ${i + 1}`)
          .join(", ");
        lines.push(`  · ${projLots.length} lot(s) : ${lotLabels}`);
      }
      if (projPages.length === 0) {
        lines.push(`  · Aucune page`);
      } else if (projPages.length <= 8) {
        for (const pg of projPages) {
          const meta: string[] = [];
          meta.push(pg.is_published ? "publié" : "brouillon");
          if (pg.style) meta.push(pg.style);
          lines.push(
            `  · ${pg.position + 1}. **${pg.name}** \`${pg.slug}\` (page_id=\`${pg.id}\`) — ${meta.join(" · ")}`,
          );
        }
      } else {
        lines.push(
          `  · ${projPages.length} pages (${projPages.filter((p) => p.is_published).length} publiées)`,
        );
        lines.push(
          `  · Premières : ${projPages
            .slice(0, 5)
            .map((p) => `${p.name} (${p.slug}, page_id=${p.id})`)
            .join(", ")}…`,
        );
      }
    }
    lines.push("");
  }

  // Sections-images éditables (pour tool use)
  if (editableSections.length === 0) {
    lines.push("### Sections image / gallery / video éditables");
    lines.push("- Aucune section image dans les pages « document ».");
    lines.push("");
  } else {
    lines.push(
      `### Sections image / gallery / video éditables (${editableSections.length})`,
    );
    lines.push(
      "Utilise ces (page_id, section_id, media_index) avec l'outil `propose_image_change`.",
    );
    // Group by page for readability
    const byPage = new Map<string, EditableImageSection[]>();
    for (const sec of editableSections) {
      const key = sec.page_id;
      const arr = byPage.get(key) ?? [];
      arr.push(sec);
      byPage.set(key, arr);
    }
    for (const [pageId, sections] of byPage) {
      const head = sections[0];
      lines.push(
        `- Page **${head.page_name}** \`/${profile.slug}/${head.project_slug}/${head.page_slug}\` (page_id=\`${pageId}\`)`,
      );
      for (const s of sections) {
        lines.push(
          `  · section_id=\`${s.section_id}\` · type=${s.section_type} · titre=${JSON.stringify(s.section_title)}`,
        );
        for (const m of s.media) {
          const cap = m.caption ? ` · caption=${JSON.stringify(m.caption)}` : "";
          lines.push(
            `    - media_index=${m.index} · url=${m.url || "(vide)"}${cap}`,
          );
        }
      }
    }
    lines.push("");
  }

  // Médiathèque détaillée — utile pour que Claude choisisse new_media_url
  if (media.total === 0) {
    lines.push("### Médiathèque");
    lines.push("- Aucun média.");
    lines.push("");
  } else {
    lines.push(`### Médiathèque (${media.total} fichier(s))`);
    const folderById = new Map(media.folders.map((f) => [f.id, f]));
    const byFolder = new Map<string | null, MediaEntry[]>();
    for (const m of media.entries) {
      const arr = byFolder.get(m.folder_id) ?? [];
      arr.push(m);
      byFolder.set(m.folder_id, arr);
    }
    // « Racine » d'abord
    if (byFolder.has(null)) {
      lines.push(`- Racine (${byFolder.get(null)!.length}) :`);
      for (const m of byFolder.get(null)!) {
        const dim = m.width && m.height ? ` · ${m.width}×${m.height}` : "";
        lines.push(`  · [${m.kind}] ${m.filename}${dim} — ${m.url}`);
      }
    }
    for (const folder of media.folders) {
      const items = byFolder.get(folder.id);
      if (!items || items.length === 0) continue;
      lines.push(`- Dossier **${folder.name}** (${items.length}) :`);
      for (const m of items) {
        const dim = m.width && m.height ? ` · ${m.width}×${m.height}` : "";
        lines.push(`  · [${m.kind}] ${m.filename}${dim} — ${m.url}`);
      }
    }
    lines.push("");
  }

  // Dossier de contexte
  if (contexts.length === 0) {
    lines.push("### Dossier de contexte");
    lines.push("- Aucun document de contexte importé.");
    lines.push("");
  } else {
    lines.push(`### Dossier de contexte (${contexts.length})`);
    for (const ctx of contexts.slice(0, 20)) {
      const meta: string[] = [];
      meta.push(ctx.source_kind);
      if (ctx.source_filename) meta.push(ctx.source_filename);
      if (ctx.has_published_page) meta.push("publié au client");
      lines.push(`- **${ctx.title}** \`${ctx.slug}\` — ${meta.join(" · ")}`);
      if (ctx.summary && ctx.summary.length > 0) {
        const trimmed =
          ctx.summary.length > 220
            ? `${ctx.summary.slice(0, 220).trim()}…`
            : ctx.summary;
        lines.push(`  · ${trimmed}`);
      }
    }
    if (contexts.length > 20) {
      lines.push(
        `- (${contexts.length - 20} document(s) supplémentaire(s) non listés)`,
      );
    }
    lines.push("");
  }

  lines.push("### Annotations publiques");
  lines.push(
    annotations.total === 0
      ? "- Aucune annotation pour le moment."
      : `- ${annotations.total} annotation(s) fluo sur les pages raw_html.`,
  );

  return lines.join("\n");
}
