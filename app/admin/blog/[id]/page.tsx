import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Eyebrow } from "@/lib/ds";
import { BlogEditor } from "../_components/blog-editor";
import type { BlogPostRow } from "../_lib/types";

export const metadata: Metadata = {
  title: "Édition · Chroniques",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const BUCKET = "page-media";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BlogEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/admin/blog/${id}`);
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts" as never)
    .select(
      "id, slug, title, excerpt, content_json, content_html, status, published_at, cover_media_id, seo_title, seo_description, canonical_url, reading_time_minutes, author_id, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle<BlogPostRow>();
  if (!post) notFound();

  let coverUrl: string | null = null;
  if (post.cover_media_id) {
    const { data: media } = await admin
      .from("client_media" as never)
      .select("storage_path")
      .eq("id", post.cover_media_id)
      .maybeSingle<{ storage_path: string }>();
    if (media) {
      coverUrl = admin.storage
        .from(BUCKET)
        .getPublicUrl(media.storage_path).data.publicUrl;
    }
  }

  return (
    <div className="relative min-h-svh w-full overflow-hidden px-6 py-10 md:px-16 md:py-14">
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

      <section className="mx-auto flex max-w-4xl flex-col gap-10 pt-12 md:pt-20">
        <header className="flex flex-col gap-4">
          <p className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link
              href="/admin/blog"
              className="transition-colors hover:text-cyan-100"
            >
              Chroniques
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/55">
              {post.status === "published" ? "Publié" : "Brouillon"}
            </span>
          </p>
          <Eyebrow tracking="md" intensity="strong">
            Édition de chronique
          </Eyebrow>
        </header>

        <BlogEditor
          postId={post.id}
          initial={{
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt ?? "",
            contentJson: post.content_json,
            contentHtml: post.content_html,
            coverMediaId: post.cover_media_id,
            coverUrl,
            seoTitle: post.seo_title ?? "",
            seoDescription: post.seo_description ?? "",
            canonicalUrl: post.canonical_url ?? "",
            status: post.status,
            publishedAt: post.published_at,
            readingTimeMinutes: post.reading_time_minutes,
          }}
        />
      </section>
    </div>
  );
}
