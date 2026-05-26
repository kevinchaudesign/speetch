"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { BlogPostRow, BlogStatus } from "./_lib/types";
import { readingTimeFromHtml, slugify } from "./_lib/slug";
import type { Json } from "@/types/database";

const BUCKET = "page-media";

export type OwnerImage = {
  id: string;
  filename: string;
  mime_type: string;
  public_url: string;
};

/**
 * Liste les images de la médiathèque studio (profile owner) pour
 * alimenter le picker de cover et l'insertion inline Tiptap.
 */
export async function fetchOwnerImages(): Promise<
  { ok: true; images: OwnerImage[] } | { ok: false; error: string }
> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: owner } = await auth.admin
    .from("profiles")
    .select("id")
    .eq("is_owner", true)
    .maybeSingle<{ id: string }>();
  if (!owner) return { ok: false, error: "Profil owner introuvable." };

  const { data: rows, error } = await auth.admin
    .from("client_media" as never)
    .select("id, filename, mime_type, storage_path, created_at")
    .eq("profile_id", owner.id)
    .like("mime_type", "image/%")
    .order("created_at", { ascending: false })
    .returns<
      Array<{
        id: string;
        filename: string;
        mime_type: string;
        storage_path: string;
      }>
    >();
  if (error) return { ok: false, error: error.message };

  const images: OwnerImage[] = (rows ?? []).map((r) => ({
    id: r.id,
    filename: r.filename,
    mime_type: r.mime_type,
    public_url: auth.admin.storage.from(BUCKET).getPublicUrl(r.storage_path).data
      .publicUrl,
  }));
  return { ok: true, images };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TITLE_LEN = 180;
const MAX_EXCERPT_LEN = 400;
const MAX_SEO_TITLE_LEN = 70; // best practice SERP
const MAX_SEO_DESC_LEN = 180; // best practice SERP

async function requireOwnerAndAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Session expirée. Reconnecte-toi." };
  }
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    return { ok: false as const, error: "Accès réservé au propriétaire." };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false as const,
      error: "SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local.",
    };
  }
  return { ok: true as const, admin: createAdminClient(), userId: user.id };
}

/**
 * Génère un slug unique pour un titre. Si une collision survient, suffixe
 * avec -2, -3, etc. Optionnel `ignoreId` pour permettre à un post de garder
 * son slug pendant un update.
 */
async function generateUniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  base: string,
  ignoreId?: string,
): Promise<string> {
  const root = slugify(base) || "article";
  let attempt = root;
  let n = 2;
  // 25 tentatives = largement suffisant pour un blog manuel.
  for (let i = 0; i < 25; i++) {
    let query = admin
      .from("blog_posts" as never)
      .select("id")
      .eq("slug", attempt);
    if (ignoreId) query = query.neq("id", ignoreId);
    const { data } = await query.maybeSingle<{ id: string }>();
    if (!data) return attempt;
    attempt = `${root}-${n}`;
    n += 1;
  }
  // Fallback ultra-rare : timestamp suffix.
  return `${root}-${Date.now()}`;
}

function normalize(raw: FormDataEntryValue | null, max: number): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

// ============================================================================
// CREATE
// ============================================================================

export type CreatePostResult =
  | { ok: true; postId: string; slug: string }
  | { ok: false; error: string };

/**
 * Crée un brouillon vierge et redirige vers son éditeur. Plus simple
 * qu'un form "création" séparé — l'utilisateur édite tout d'un coup.
 */
export async function createDraftPost(): Promise<CreatePostResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Récupère le profil owner pour author_id.
  const { data: owner } = await auth.admin
    .from("profiles")
    .select("id")
    .eq("is_owner", true)
    .maybeSingle<{ id: string }>();

  const slug = await generateUniqueSlug(auth.admin, "nouvel-article");

  const { data: inserted, error } = await auth.admin
    .from("blog_posts" as never)
    .insert({
      slug,
      title: "Nouvel article",
      excerpt: null,
      content_json: {},
      content_html: "",
      status: "draft" as BlogStatus,
      author_id: owner?.id ?? null,
      reading_time_minutes: 1,
    } as never)
    .select("id, slug")
    .single<{ id: string; slug: string }>();

  if (error || !inserted) {
    console.error("[createDraftPost] insert error:", error);
    return { ok: false, error: error?.message ?? "Création impossible." };
  }

  revalidatePath("/admin/blog");
  return { ok: true, postId: inserted.id, slug: inserted.slug };
}

/** Wrapper formulaire — crée un brouillon puis redirige vers l'éditeur. */
export async function createDraftPostAndRedirect(): Promise<void> {
  const res = await createDraftPost();
  if (!res.ok) {
    // Pas de toast en server action — on redirige vers la liste avec un param
    // d'erreur que la page lit. Simple et sans dépendance.
    redirect(`/admin/blog?error=${encodeURIComponent(res.error)}`);
  }
  redirect(`/admin/blog/${res.postId}`);
}

// ============================================================================
// UPDATE
// ============================================================================

export type UpdatePostResult = { ok: true } | { ok: false; error: string };

export async function updatePost(input: {
  postId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentJson: Json;
  contentHtml: string;
  coverMediaId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
}): Promise<UpdatePostResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.postId)) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const title = normalize(input.title, MAX_TITLE_LEN);
  if (!title) return { ok: false, error: "Le titre est requis." };

  // Slug : on accepte un slug fourni (édité à la main), sinon on dérive du titre.
  // On force l'unicité (avec ignoreId du post courant).
  const slugBase = (input.slug || title).trim();
  const finalSlug = await generateUniqueSlug(
    auth.admin,
    slugBase,
    input.postId,
  );

  const excerpt = input.excerpt ? normalize(input.excerpt, MAX_EXCERPT_LEN) : null;
  const seoTitle = input.seoTitle ? normalize(input.seoTitle, MAX_SEO_TITLE_LEN) : null;
  const seoDescription = input.seoDescription
    ? normalize(input.seoDescription, MAX_SEO_DESC_LEN)
    : null;
  const canonicalUrl = input.canonicalUrl
    ? normalize(input.canonicalUrl, 500)
    : null;

  if (input.coverMediaId !== null && !UUID_REGEX.test(input.coverMediaId)) {
    return { ok: false, error: "Cover invalide." };
  }

  const readingTime = readingTimeFromHtml(input.contentHtml ?? "");

  const { error } = await auth.admin
    .from("blog_posts" as never)
    .update({
      title,
      slug: finalSlug,
      excerpt,
      content_json: input.contentJson ?? {},
      content_html: input.contentHtml ?? "",
      cover_media_id: input.coverMediaId,
      seo_title: seoTitle,
      seo_description: seoDescription,
      canonical_url: canonicalUrl,
      reading_time_minutes: readingTime,
    } as never)
    .eq("id", input.postId);

  if (error) {
    console.error("[updatePost] update error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${input.postId}`);
  revalidatePath(`/blog/${finalSlug}`);
  revalidatePath("/blog");
  return { ok: true };
}

// ============================================================================
// PUBLISH / UNPUBLISH
// ============================================================================

export type PublishPostResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function publishPost(input: {
  postId: string;
}): Promise<PublishPostResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.postId)) {
    return { ok: false, error: "Identifiant invalide." };
  }

  // Récupère le post pour vérifier qu'il a au minimum un titre + du contenu.
  const { data: post } = await auth.admin
    .from("blog_posts" as never)
    .select("id, slug, title, content_html, published_at")
    .eq("id", input.postId)
    .maybeSingle<Pick<BlogPostRow, "id" | "slug" | "title" | "content_html" | "published_at">>();
  if (!post) return { ok: false, error: "Article introuvable." };
  if (!post.title.trim()) return { ok: false, error: "Donne un titre avant de publier." };
  if (!post.content_html.trim()) {
    return { ok: false, error: "L'article est vide — ajoute du contenu avant de publier." };
  }

  // Première publication : on stamp published_at. Republication d'un post déjà
  // publié dans le passé : on garde la date initiale (sinon Google voit
  // l'article comme "nouveau" à chaque republish, ce qui pénalise).
  const published_at = post.published_at ?? new Date().toISOString();

  const { error } = await auth.admin
    .from("blog_posts" as never)
    .update({
      status: "published" as BlogStatus,
      published_at,
    } as never)
    .eq("id", input.postId);

  if (error) {
    console.error("[publishPost] update error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${input.postId}`);
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");
  return { ok: true, slug: post.slug };
}

export async function unpublishPost(input: {
  postId: string;
}): Promise<UpdatePostResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.postId)) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const { data: post } = await auth.admin
    .from("blog_posts" as never)
    .select("slug")
    .eq("id", input.postId)
    .maybeSingle<{ slug: string }>();

  const { error } = await auth.admin
    .from("blog_posts" as never)
    .update({ status: "draft" as BlogStatus } as never)
    .eq("id", input.postId);

  if (error) {
    console.error("[unpublishPost] update error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${input.postId}`);
  if (post?.slug) revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");
  return { ok: true };
}

// ============================================================================
// DELETE
// ============================================================================

export async function deletePost(input: {
  postId: string;
}): Promise<UpdatePostResult> {
  const auth = await requireOwnerAndAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (!UUID_REGEX.test(input.postId)) {
    return { ok: false, error: "Identifiant invalide." };
  }

  const { data: post } = await auth.admin
    .from("blog_posts" as never)
    .select("slug")
    .eq("id", input.postId)
    .maybeSingle<{ slug: string }>();

  const { error } = await auth.admin
    .from("blog_posts" as never)
    .delete()
    .eq("id", input.postId);

  if (error) {
    console.error("[deletePost] delete error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/blog");
  if (post?.slug) revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog");
  return { ok: true };
}
