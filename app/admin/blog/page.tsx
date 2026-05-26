import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Button, Eyebrow } from "@/lib/ds";
import type { BlogPostRow } from "./_lib/types";
import { BlogListView } from "./_components/blog-list-view";
import { createDraftPostAndRedirect } from "./actions";

export const metadata: Metadata = {
  title: "Chroniques · Conseil Jedi",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const BUCKET = "page-media";

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin/blog");
  const ownerEmail = process.env.SPEETCH_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail && user.email?.toLowerCase() !== ownerEmail) {
    redirect("/admin");
  }

  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("blog_posts" as never)
    .select(
      "id, slug, title, excerpt, status, published_at, cover_media_id, reading_time_minutes, updated_at, created_at",
    )
    .order("updated_at", { ascending: false })
    .returns<
      Array<
        Pick<
          BlogPostRow,
          | "id"
          | "slug"
          | "title"
          | "excerpt"
          | "status"
          | "published_at"
          | "cover_media_id"
          | "reading_time_minutes"
          | "updated_at"
          | "created_at"
        >
      >
    >();

  // Résout les URLs des covers en une seule passe.
  const coverIds = Array.from(
    new Set(
      (rows ?? []).map((r) => r.cover_media_id).filter((v): v is string => !!v),
    ),
  );
  const coverPathById = new Map<string, string>();
  if (coverIds.length > 0) {
    const { data: covers } = await admin
      .from("client_media" as never)
      .select("id, storage_path")
      .in("id", coverIds)
      .returns<Array<{ id: string; storage_path: string }>>();
    for (const c of covers ?? []) coverPathById.set(c.id, c.storage_path);
  }

  const posts = (rows ?? []).map((r) => ({
    ...r,
    cover_url: r.cover_media_id
      ? (admin.storage
          .from(BUCKET)
          .getPublicUrl(coverPathById.get(r.cover_media_id) ?? "").data
          .publicUrl ?? null)
      : null,
  }));

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

      <section className="mx-auto flex max-w-6xl flex-col gap-12 pt-12 md:pt-20">
        <header className="flex flex-col gap-6">
          <Eyebrow tracking="md" intensity="strong">
            Conseil Jedi · Studio Speetch
          </Eyebrow>
          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.25rem, 6vw, 4.5rem)" }}
          >
            Chroniques{" "}
            <span className="sw-hologram-text sw-hologram-glitch font-serif italic font-normal">
              du studio
            </span>
          </h1>
          <p className="max-w-xl font-serif text-base italic text-white/55 md:text-lg">
            Articles publiés sur{" "}
            <Link
              href="/blog"
              className="text-cyan-200 underline decoration-cyan-200/40 transition-colors hover:text-cyan-100"
            >
              speetch.com/blog
            </Link>
            . Pensés pour la lecture comme pour les moteurs.
          </p>
        </header>

        {sp.error && (
          <p
            role="alert"
            className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {sp.error}
          </p>
        )}

        <form action={createDraftPostAndRedirect}>
          <Button type="submit" variant="primary">
            ✦ Nouvelle chronique
          </Button>
        </form>

        <BlogListView posts={posts} />
      </section>
    </div>
  );
}
