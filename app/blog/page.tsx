import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listPublishedPosts } from "./_lib/queries";

const SITE_URL = "https://speetch.com";

export const metadata: Metadata = {
  title: "Chroniques — Speetch · Studio de communication",
  description:
    "Notes, méthodes et analyses du studio Speetch sur la direction artistique, les marques et les outils sur-mesure à l'ère de l'IA.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: "Chroniques Speetch",
    description:
      "Notes, méthodes et analyses sur la communication à l'ère de l'IA.",
    type: "website",
    url: `${SITE_URL}/blog`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Chroniques Speetch",
    description:
      "Notes, méthodes et analyses sur la communication à l'ère de l'IA.",
  },
};

// ISR : la page se régénère au max toutes les 60 secondes.
export const revalidate = 60;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts();

  return (
    <main className="relative min-h-svh w-full overflow-hidden bg-[#0B1220] px-6 py-16 md:px-10 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_20%,rgba(125,211,252,0.08),transparent_60%)]"
      />

      <section className="mx-auto flex max-w-5xl flex-col gap-14">
        <header className="flex flex-col gap-4">
          <nav aria-label="Fil d'Ariane" className="text-[11px] uppercase tracking-[0.4em] text-cyan-200/65">
            <Link href="/" className="transition-colors hover:text-cyan-100">
              Speetch
            </Link>
            <span className="mx-3 text-cyan-200/20">→</span>
            <span className="text-cyan-200/55">Chroniques</span>
          </nav>
          <h1
            className="font-sans font-extralight leading-[0.85] tracking-[-0.05em] text-[#F5F5F7]"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            Chroniques{" "}
            <span className="font-serif italic font-normal text-cyan-200/85">
              du studio
            </span>
          </h1>
          <p className="max-w-2xl font-serif text-base italic text-white/65 md:text-lg">
            Notes, méthodes et analyses sur la direction artistique, les
            marques et les outils sur-mesure à l'ère de l'IA.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="py-12 font-serif text-base italic text-white/45">
            Les premières chroniques arrivent. Reviens bientôt.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-10 md:grid-cols-2">
            {posts.map((p, idx) => (
              <li key={p.id}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="group flex h-full flex-col gap-4"
                >
                  <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                    {p.cover_url ? (
                      <Image
                        src={p.cover_url}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        priority={idx === 0}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="absolute inset-0 flex items-center justify-center text-white/30"
                      >
                        <span className="text-[11px] uppercase tracking-[0.32em]">
                          Speetch · Chroniques
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/70">
                      <time dateTime={p.published_at}>
                        {formatDate(p.published_at)}
                      </time>
                      <span className="mx-2 text-white/20">·</span>
                      {p.reading_time_minutes} min
                    </p>
                    <h2 className="font-sans text-2xl font-extralight tracking-[-0.02em] text-[#F5F5F7] transition-colors group-hover:text-cyan-100 md:text-3xl">
                      {p.title}
                    </h2>
                    {p.excerpt && (
                      <p className="font-serif text-base italic text-white/65 line-clamp-3">
                        {p.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
