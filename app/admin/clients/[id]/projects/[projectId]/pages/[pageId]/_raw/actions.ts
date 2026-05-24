"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { PageContent } from "@/types/database";
import type {
  DeleteProjectMediaResult,
  ListProjectMediaResult,
  ProjectMediaItem,
  SaveOverridesResult,
  UploadProjectMediaResult,
} from "./actions-types";

const MEDIA_BUCKET = "page-media";
const MAX_MEDIA_SIZE = 25 * 1024 * 1024; // 25 MB
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireOwnerAndAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, error: "Session expirée." };

  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false as const, error: "Accès réservé au propriétaire." };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false as const,
      error: "SUPABASE_SERVICE_ROLE_KEY manquant.",
    };
  }

  return { ok: true as const, admin: createAdminClient() };
}

// ---------------------------------------------------------------------------
// Édition des overrides texte / image d'une page raw_html
// ---------------------------------------------------------------------------

export async function saveRawHtmlOverrides(input: {
  profileId: string;
  projectId: string;
  pageId: string;
  textOverrides: Record<string, string>;
  imageOverrides: Record<string, string>;
  /**
   * Si fourni, remplace `meta.raw_html` (utilisé pour persister les edits
   * d'un objet JS interne type `const DIRECTIONS`). Limite la taille pour
   * ne pas accidentellement écrire un payload trop gros.
   */
  rawHtmlOverride?: string;
}): Promise<SaveOverridesResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (
    !UUID_REGEX.test(input.profileId) ||
    !UUID_REGEX.test(input.projectId) ||
    !UUID_REGEX.test(input.pageId)
  ) {
    return { ok: false, error: "Identifiants invalides." };
  }

  if (
    typeof input.rawHtmlOverride === "string" &&
    input.rawHtmlOverride.length > 3 * 1024 * 1024
  ) {
    return { ok: false, error: "HTML trop volumineux (max 3 MB)." };
  }

  const { data: page, error: fetchError } = await auth.admin
    .from("pages")
    .select("id, project_id, content")
    .eq("id", input.pageId)
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (fetchError) {
    console.error("[saveRawHtmlOverrides] fetch error:", fetchError);
    return { ok: false, error: fetchError.message };
  }
  if (!page) return { ok: false, error: "Page introuvable." };

  const current = (page.content as PageContent) ?? {};
  if (current.meta?.style !== "raw_html") {
    return {
      ok: false,
      error:
        "Cette page n'est pas en mode reproduction fidèle — overrides non applicables.",
    };
  }

  const nextContent: PageContent = {
    ...current,
    meta: {
      ...current.meta,
      text_overrides: input.textOverrides,
      image_overrides: input.imageOverrides,
      ...(typeof input.rawHtmlOverride === "string"
        ? { raw_html: input.rawHtmlOverride }
        : {}),
    },
  };

  const { error: updateError } = await auth.admin
    .from("pages")
    .update({ content: nextContent })
    .eq("id", input.pageId);

  if (updateError) {
    console.error("[saveRawHtmlOverrides] update error:", updateError);
    return { ok: false, error: updateError.message };
  }

  revalidatePath(
    `/admin/clients/${input.profileId}/projects/${input.projectId}/pages/${input.pageId}`,
  );
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Médiathèque par projet (bucket page-media, path projects/{project_id}/...)
// ---------------------------------------------------------------------------

export async function listProjectMedia(
  projectId: string,
): Promise<ListProjectMediaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(projectId)) {
    return { ok: false, error: "Projet invalide." };
  }

  const prefix = `projects/${projectId}`;
  const { data, error } = await auth.admin.storage
    .from(MEDIA_BUCKET)
    .list(prefix, { sortBy: { column: "created_at", order: "desc" }, limit: 500 });

  if (error) {
    console.error("[listProjectMedia] list error:", error);
    return { ok: false, error: error.message };
  }

  const items: ProjectMediaItem[] = (data ?? [])
    .filter((f) => f.name && !f.name.startsWith(".") && f.metadata)
    .map((f) => {
      const path = `${prefix}/${f.name}`;
      const { data: pub } = auth.admin.storage
        .from(MEDIA_BUCKET)
        .getPublicUrl(path);
      return {
        path,
        url: pub.publicUrl,
        name: f.name,
        size: (f.metadata?.size as number | undefined) ?? 0,
        createdAt: f.created_at ?? new Date().toISOString(),
      };
    });

  return { ok: true, items };
}

export async function uploadProjectMedia(
  formData: FormData,
): Promise<UploadProjectMediaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!UUID_REGEX.test(projectId)) {
    return { ok: false, error: "Projet invalide." };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier reçu." };
  }
  if (file.size > MAX_MEDIA_SIZE) {
    return { ok: false, error: "Fichier trop volumineux (max 25 MB)." };
  }

  const cleanName = file.name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const timestamp = Date.now();
  const path = `projects/${projectId}/${timestamp}-${cleanName || "media"}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await auth.admin.storage
    .from(MEDIA_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    console.error("[uploadProjectMedia] upload error:", uploadError);
    return { ok: false, error: uploadError.message };
  }

  const { data: pub } = auth.admin.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(path);

  return {
    ok: true,
    item: {
      path,
      url: pub.publicUrl,
      name: cleanName || "media",
      size: file.size,
      createdAt: new Date().toISOString(),
    },
  };
}

export async function deleteProjectMedia(
  projectId: string,
  path: string,
): Promise<DeleteProjectMediaResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!UUID_REGEX.test(projectId)) {
    return { ok: false, error: "Projet invalide." };
  }
  if (!path.startsWith(`projects/${projectId}/`)) {
    return { ok: false, error: "Chemin de média hors du projet." };
  }

  const { error } = await auth.admin.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) {
    console.error("[deleteProjectMedia] remove error:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
