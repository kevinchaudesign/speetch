import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedPostBySlug, listPublishedPosts } from "../_lib/queries";

const SITE_URL = "https://speetch.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;

export const revalidate = 60;

// Pré-rendu statique des articles publiés (build-time). Les nouveaux articles
// sont régénérés à la volée via ISR (revalidate 60s) ou via la
// revalidatePath appelée dans les server actions admin.
export async function generateStaticParams() {
  const posts = await listPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return { title: "Article introuvable — Speetch", robots: { index: false } };
  }
  const title = post.seo_title ?? post.title;
  const description =
    post.seo_description ?? post.excerpt ?? `Une chronique du studio Speetch.`;
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.cover_url ?? DEFAULT_OG_IMAGE;

  return {
    title: `${title} — Speetch`,
    description,
    alternates: { canonical: post.canonical_url ?? url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: [{ url: image }],
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = post.cover_url ?? DEFAULT_OG_IMAGE;
  const authorName = post.author_name ?? "Speetch";

  // ── JSON-LD : Article + BreadcrumbList ───────────────────────────────
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seo_description ?? post.excerpt ?? "",
    image: [image],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: "Speetch",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo/speetch-512.png`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Speetch", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Chroniques",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: url,
      },
    ],
  };

  return (
    <main className="relative min-h-svh w-full overflow-hidden bg-[#0B1220]">
      <script
        type="application/ld+json"
        // JSON-LD est de la data structurée pour les crawlers — pas de XSS
        // risk ici, contenu vient de notre DB validée.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_20%,rgba(125,211,252,0.08),transparent_60%)]"
      />

      <article className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16 md:px-8 md:py-24">
        {/* Fil d'Ariane */}
        <nav
          aria-label="Fil d'Ariane"
          className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65"
        >
          <Link href="/" className="transition-colors hover:text-cyan-100">
            Speetch
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <Link href="/blog" className="transition-colors hover:text-cyan-100">
            Chroniques
          </Link>
          <span className="mx-3 text-cyan-200/20">→</span>
          <span className="text-cyan-200/55 normal-case tracking-normal line-clamp-1">
            {post.title}
          </span>
        </nav>

        {/* Header */}
        <header className="flex flex-col gap-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            {post.updated_at !== post.published_at && (
              <>
                <span className="mx-2 text-white/25">·</span>
                <span className="text-white/55">
                  maj <time dateTime={post.updated_at}>{formatDate(post.updated_at)}</time>
                </span>
              </>
            )}
            <span className="mx-2 text-white/25">·</span>
            {post.reading_time_minutes} min
          </p>
          <h1
            className="font-sans font-extralight leading-[1] tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}
          >
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="max-w-2xl font-serif text-lg italic text-white/70 md:text-xl">
              {post.excerpt}
            </p>
          )}
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            par <span className="text-white/75">{authorName}</span>
          </p>
        </header>

        {/* Cover */}
        {post.cover_url && (
          <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={post.cover_url}
              alt={post.title}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              priority
              className="object-cover"
            />
          </div>
        )}

        {/* Corps */}
        <div
          className={[
            "font-serif text-[17px] leading-[1.8] text-[#F5F5F7]/92 md:text-[18px]",
            "[&_h2]:font-sans [&_h2]:text-3xl [&_h2]:font-extralight [&_h2]:tracking-[-0.02em] [&_h2]:text-[#F5F5F7] [&_h2]:mt-14 [&_h2]:mb-5",
            "[&_h3]:font-sans [&_h3]:text-2xl [&_h3]:font-extralight [&_h3]:tracking-[-0.01em] [&_h3]:text-[#F5F5F7] [&_h3]:mt-10 [&_h3]:mb-4",
            "[&_p]:my-5",
            "[&_strong]:text-cyan-100 [&_strong]:font-medium",
            "[&_em]:italic",
            "[&_a]:text-cyan-200 [&_a]:underline [&_a]:decoration-cyan-200/40 [&_a]:underline-offset-2 [&_a]:transition-colors hover:[&_a]:text-cyan-100",
            "[&_ul]:my-5 [&_ul]:pl-6 [&_ol]:my-5 [&_ol]:pl-6 [&_ul]:list-disc [&_ol]:list-decimal",
            "[&_li]:my-2",
            "[&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-200/45 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-white/75",
            "[&_code]:rounded [&_code]:border [&_code]:border-cyan-200/15 [&_code]:bg-cyan-200/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[14px] [&_code]:text-cyan-100",
            "[&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-cyan-200/15 [&_pre]:bg-black/60 [&_pre]:p-5 [&_pre]:font-mono [&_pre]:text-[13px]",
            "[&_img]:my-10 [&_img]:rounded-xl [&_img]:border [&_img]:border-white/10",
            "[&_hr]:my-12 [&_hr]:border-white/15",
          ].join(" ")}
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        {/* Footer */}
        <footer className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Une chronique de{" "}
            <span className="text-white/75">{authorName}</span> · Speetch
          </p>
          <Link
            href="/blog"
            className="text-[13px] uppercase tracking-[0.32em] text-cyan-200/85 transition-colors hover:text-cyan-100"
          >
            ← Toutes les chroniques
          </Link>
        </footer>
      </article>
    </main>
  );
}
