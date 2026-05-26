/**
 * Lectures publiques du blog.
 *
 * On utilise le client service-role (`createAdminClient`) plutôt que
 * `createClient` (SSR cookies) parce que ces queries tournent aussi au
 * build (generateStaticParams, sitemap) où il n'y a pas de request scope.
 *
 * Sécurité : on filtre toujours sur `status='published' and published_at
 * is not null`. Service-role bypass RLS mais notre filtre côté code est
 * la source de vérité — résultat identique à ce qu'un utilisateur public
 * verrait via RLS.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { BlogPostRow } from "@/app/admin/blog/_lib/types";

const BUCKET = "page-media";

export type PublishedPostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  updated_at: string;
  cover_url: string | null;
  reading_time_minutes: number;
};

export type PublishedPostFull = PublishedPostListItem & {
  content_html: string;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  author_name: string | null;
};

/** Liste tous les articles publiés, plus récents en premier. */
export async function listPublishedPosts(): Promise<PublishedPostListItem[]> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("blog_posts" as never)
    .select(
      "id, slug, title, excerpt, published_at, updated_at, cover_media_id, reading_time_minutes",
    )
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .returns<
      Array<
        Pick<
          BlogPostRow,
          | "id"
          | "slug"
          | "title"
          | "excerpt"
          | "published_at"
          | "updated_at"
          | "cover_media_id"
          | "reading_time_minutes"
        >
      >
    >();
  return resolveCovers(admin, rows ?? []);
}

/** Lookup d'un post par slug — utilisé pour la page article + generateMetadata. */
export async function getPublishedPostBySlug(
  slug: string,
): Promise<PublishedPostFull | null> {
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("blog_posts" as never)
    .select(
      "id, slug, title, excerpt, content_html, published_at, updated_at, cover_media_id, reading_time_minutes, seo_title, seo_description, canonical_url, author_id",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .not("published_at", "is", null)
    .maybeSingle<
      Pick<
        BlogPostRow,
        | "id"
        | "slug"
        | "title"
        | "excerpt"
        | "content_html"
        | "published_at"
        | "updated_at"
        | "cover_media_id"
        | "reading_time_minutes"
        | "seo_title"
        | "seo_description"
        | "canonical_url"
        | "author_id"
      >
    >();
  if (!post || !post.published_at) return null;

  let coverUrl: string | null = null;
  if (post.cover_media_id) {
    const { data: media } = await admin
      .from("client_media" as never)
      .select("storage_path")
      .eq("id", post.cover_media_id)
      .maybeSingle<{ storage_path: string }>();
    if (media) {
      coverUrl = admin.storage.from(BUCKET).getPublicUrl(media.storage_path)
        .data.publicUrl;
    }
  }

  let authorName: string | null = null;
  if (post.author_id) {
    const { data: author } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", post.author_id)
      .maybeSingle<{ full_name: string | null }>();
    authorName = author?.full_name ?? null;
  }

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content_html: post.content_html,
    published_at: post.published_at,
    updated_at: post.updated_at,
    cover_url: coverUrl,
    reading_time_minutes: post.reading_time_minutes,
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    canonical_url: post.canonical_url,
    author_name: authorName,
  };
}

/** Pour le sitemap : seulement slug + dates, allégé. */
export async function listPublishedPostSlugs(): Promise<
  Array<{ slug: string; updated_at: string; published_at: string }>
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts" as never)
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .returns<Array<{ slug: string; updated_at: string; published_at: string }>>();
  return data ?? [];
}

/* ────────────────────────────────────────────────────────────────────── */

async function resolveCovers(
  admin: ReturnType<typeof createAdminClient>,
  rows: Array<
    Pick<
      BlogPostRow,
      | "id"
      | "slug"
      | "title"
      | "excerpt"
      | "published_at"
      | "updated_at"
      | "cover_media_id"
      | "reading_time_minutes"
    >
  >,
): Promise<PublishedPostListItem[]> {
  const coverIds = Array.from(
    new Set(
      rows.map((r) => r.cover_media_id).filter((v): v is string => !!v),
    ),
  );
  const coverPathById = new Map<string, string>();
  if (coverIds.length > 0) {
    const { data: medias } = await admin
      .from("client_media" as never)
      .select("id, storage_path")
      .in("id", coverIds)
      .returns<Array<{ id: string; storage_path: string }>>();
    for (const c of medias ?? []) coverPathById.set(c.id, c.storage_path);
  }
  return rows
    .filter((r) => !!r.published_at)
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      published_at: r.published_at as string,
      updated_at: r.updated_at,
      cover_url: r.cover_media_id
        ? admin.storage
            .from(BUCKET)
            .getPublicUrl(coverPathById.get(r.cover_media_id) ?? "").data
            .publicUrl ?? null
        : null,
      reading_time_minutes: r.reading_time_minutes,
    }));
}
