/**
 * Types locaux pour le blog studio Speetch — la table `blog_posts` n'est
 * pas (encore) régénérée dans `types/database.ts`.
 */

import type { Json } from "@/types/database";

export type BlogStatus = "draft" | "published";

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_json: Json;
  content_html: string;
  status: BlogStatus;
  published_at: string | null;
  cover_media_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  reading_time_minutes: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Vue enrichie : row + URL publique du cover (résolu côté server). */
export type BlogPostWithCover = BlogPostRow & {
  cover_url: string | null;
};
