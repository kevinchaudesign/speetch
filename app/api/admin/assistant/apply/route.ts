import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/owner";
import { isValidSlug } from "@/lib/slug";
import type { Json, PageContent } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Applique une proposition générée par l'assistant. Trois variantes :
 *  - `image-section` : page « document » → mute content.sections[i].media[j].url
 *  - `image-override` : page « raw_html » → ajoute/maj content.meta.image_overrides
 *  - `text-override`  : page « raw_html » → ajoute/maj content.meta.text_overrides
 *
 * Toutes les variantes valident : auth admin, page ∈ client, médiathèque
 * (pour les images uniquement).
 */

const MEDIA_BUCKET = "page-media";

type ProfileRow = { id: string; slug: string | null };
type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  profile_id: string;
};
type PageRow = {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  content: Json;
};
type MediaRow = {
  id: string;
  profile_id: string;
  storage_path: string;
};

async function validateClientPage(
  pageId: string,
  clientSlug: string,
): Promise<
  | { ok: true; profile: ProfileRow; project: ProjectRow; page: PageRow }
  | { ok: false; status: number; error: string }
> {
  const admin = createAdminClient();
  const { data: profileRow } = await admin
    .from("profiles")
    .select("id, slug")
    .eq("slug", clientSlug)
    .eq("is_owner", false)
    .maybeSingle<ProfileRow>();
  if (!profileRow) {
    return { ok: false, status: 404, error: "Client introuvable" };
  }
  const { data: pageRow } = await admin
    .from("pages")
    .select("id, project_id, name, slug, content")
    .eq("id", pageId)
    .maybeSingle<PageRow>();
  if (!pageRow) {
    return { ok: false, status: 404, error: "Page introuvable" };
  }
  const { data: projectRow } = await admin
    .from("projects")
    .select("id, name, slug, profile_id")
    .eq("id", pageRow.project_id)
    .maybeSingle<ProjectRow>();
  if (!projectRow || projectRow.profile_id !== profileRow.id) {
    return {
      ok: false,
      status: 403,
      error: "Page hors périmètre du client",
    };
  }
  return { ok: true, profile: profileRow, project: projectRow, page: pageRow };
}

async function ensureMediaInLibrary(
  profileId: string,
  newMediaUrl: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: mediaRows } = await admin
    .from("client_media" as never)
    .select("id, profile_id, storage_path")
    .eq("profile_id", profileId);
  const candidates = (mediaRows ?? []) as unknown as MediaRow[];
  return candidates.some((m) => {
    const { data } = admin.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(m.storage_path);
    return data?.publicUrl === newMediaUrl;
  });
}

function revalidateClientPage(
  clientSlug: string,
  projectSlug: string,
  pageSlug: string,
) {
  try {
    revalidatePath(`/clients/${clientSlug}/${projectSlug}/${pageSlug}`);
    revalidatePath(`/clients/${clientSlug}/${projectSlug}`);
    revalidatePath(`/clients/${clientSlug}`);
  } catch (err) {
    console.warn("[assistant/apply] revalidate warning:", err);
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const owner = await requireOwner(supabase);
  if (!owner.ok) {
    return NextResponse.json(
      {
        error:
          owner.reason === "no_session"
            ? "Non authentifié"
            : "Accès réservé au propriétaire",
      },
      { status: owner.reason === "no_session" ? 401 : 403 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const kind = typeof payload.kind === "string" ? payload.kind : "image-section";
  const clientSlug =
    typeof payload.client_slug === "string" ? payload.client_slug : "";
  const pageId = typeof payload.page_id === "string" ? payload.page_id : "";

  if (!isValidSlug(clientSlug)) {
    return NextResponse.json(
      { error: "client_slug invalide" },
      { status: 400 },
    );
  }
  if (!pageId) {
    return NextResponse.json({ error: "page_id manquant" }, { status: 400 });
  }

  const scoped = await validateClientPage(pageId, clientSlug);
  if (!scoped.ok) {
    return NextResponse.json({ error: scoped.error }, { status: scoped.status });
  }
  const { profile, project, page } = scoped;
  const admin = createAdminClient();

  // ─── Variante 1 : image-section (page document) ───
  if (kind === "image-section") {
    const sectionId =
      typeof payload.section_id === "string" ? payload.section_id : "";
    const newMediaUrl =
      typeof payload.new_media_url === "string" ? payload.new_media_url : "";
    const mediaIndex =
      typeof payload.media_index === "number" &&
      Number.isInteger(payload.media_index)
        ? payload.media_index
        : 0;
    if (!sectionId || !newMediaUrl) {
      return NextResponse.json(
        { error: "Champs requis manquants (section_id, new_media_url)" },
        { status: 400 },
      );
    }

    const content = page.content as PageContent | null;
    if (!content || !Array.isArray(content.sections)) {
      return NextResponse.json(
        { error: "Cette page n'a pas de sections éditables" },
        { status: 400 },
      );
    }
    const sectionIndex = content.sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) {
      return NextResponse.json(
        { error: "Section introuvable" },
        { status: 404 },
      );
    }
    const section = content.sections[sectionIndex];
    if (
      section.type !== "image" &&
      section.type !== "gallery" &&
      section.type !== "video"
    ) {
      return NextResponse.json(
        { error: `Section non éditable (type=${section.type})` },
        { status: 400 },
      );
    }
    const sectionMedia = Array.isArray(section.media) ? section.media : [];
    if (mediaIndex < 0 || mediaIndex >= sectionMedia.length) {
      return NextResponse.json(
        { error: "media_index hors borne" },
        { status: 400 },
      );
    }

    if (!(await ensureMediaInLibrary(profile.id, newMediaUrl))) {
      return NextResponse.json(
        { error: "URL hors médiathèque de ce client" },
        { status: 403 },
      );
    }

    const nextSections = content.sections.map((s, i) => {
      if (i !== sectionIndex) return s;
      if (s.type !== "image" && s.type !== "gallery" && s.type !== "video") {
        return s;
      }
      const media = Array.isArray(s.media) ? s.media : [];
      const nextMedia = media.map((m, mi) =>
        mi === mediaIndex ? { ...m, url: newMediaUrl } : m,
      );
      return { ...s, media: nextMedia };
    });
    const nextContent: PageContent = { ...content, sections: nextSections };

    const { error } = await admin
      .from("pages")
      .update({ content: nextContent as unknown as Json })
      .eq("id", page.id);
    if (error) {
      console.error("[assistant/apply] update error:", error);
      return NextResponse.json(
        { error: `Échec mise à jour : ${error.message}` },
        { status: 500 },
      );
    }

    revalidateClientPage(profile.slug ?? clientSlug, project.slug, page.slug);
    return NextResponse.json({
      ok: true,
      kind: "image-section",
      page_id: page.id,
      new_url: newMediaUrl,
    });
  }

  // ─── Variantes 2 et 3 : raw_html overrides ───
  const content = page.content as PageContent | null;
  if (content?.meta?.style !== "raw_html") {
    return NextResponse.json(
      { error: "Page non raw_html — variante incompatible" },
      { status: 400 },
    );
  }
  const meta = content.meta ?? {};

  if (kind === "image-override") {
    const originalSrc =
      typeof payload.original_src === "string" ? payload.original_src : "";
    const imgId = typeof payload.img_id === "string" ? payload.img_id : "";
    const newMediaUrl =
      typeof payload.new_media_url === "string" ? payload.new_media_url : "";
    if (!originalSrc || !newMediaUrl) {
      return NextResponse.json(
        { error: "Champs requis manquants (original_src, new_media_url)" },
        { status: 400 },
      );
    }
    if (!(await ensureMediaInLibrary(profile.id, newMediaUrl))) {
      return NextResponse.json(
        { error: "URL hors médiathèque de ce client" },
        { status: 403 },
      );
    }
    // Si on dispose d'un img_id (index DOM), on écrit dans la map by-id
    // pour cibler une seule occurrence. Sinon fallback sur la map "par src"
    // qui s'applique à toutes les <img> ayant ce src.
    const nextMeta = imgId
      ? {
          ...meta,
          image_overrides_by_id: {
            ...(meta.image_overrides_by_id ?? {}),
            [imgId]: newMediaUrl,
          },
        }
      : {
          ...meta,
          image_overrides: {
            ...(meta.image_overrides ?? {}),
            [originalSrc]: newMediaUrl,
          },
        };
    const nextContent: PageContent = { ...content, meta: nextMeta };
    const { error } = await admin
      .from("pages")
      .update({ content: nextContent as unknown as Json })
      .eq("id", page.id);
    if (error) {
      console.error("[assistant/apply] image-override update error:", error);
      return NextResponse.json(
        { error: `Échec mise à jour : ${error.message}` },
        { status: 500 },
      );
    }
    revalidateClientPage(profile.slug ?? clientSlug, project.slug, page.slug);
    return NextResponse.json({
      ok: true,
      kind: "image-override",
      page_id: page.id,
      new_url: newMediaUrl,
      scope: imgId ? "by_id" : "by_src",
    });
  }

  if (kind === "text-override") {
    const originalText =
      typeof payload.original_text === "string" ? payload.original_text : "";
    const newText =
      typeof payload.new_text === "string" ? payload.new_text : "";
    if (!originalText || !newText) {
      return NextResponse.json(
        { error: "Champs requis manquants (original_text, new_text)" },
        { status: 400 },
      );
    }
    if (originalText.length > 2000 || newText.length > 2000) {
      return NextResponse.json(
        { error: "Texte trop long" },
        { status: 400 },
      );
    }
    const nextTexts = {
      ...(meta.text_overrides ?? {}),
      [originalText]: newText,
    };
    const nextContent: PageContent = {
      ...content,
      meta: { ...meta, text_overrides: nextTexts },
    };
    const { error } = await admin
      .from("pages")
      .update({ content: nextContent as unknown as Json })
      .eq("id", page.id);
    if (error) {
      console.error("[assistant/apply] text-override update error:", error);
      return NextResponse.json(
        { error: `Échec mise à jour : ${error.message}` },
        { status: 500 },
      );
    }
    revalidateClientPage(profile.slug ?? clientSlug, project.slug, page.slug);
    return NextResponse.json({
      ok: true,
      kind: "text-override",
      page_id: page.id,
      new_text: newText,
    });
  }

  return NextResponse.json(
    { error: `Variante \`${kind}\` non gérée` },
    { status: 400 },
  );
}
