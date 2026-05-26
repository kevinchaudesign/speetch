"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Chip } from "@/lib/ds";
import type { BlogStatus } from "../_lib/types";

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: BlogStatus;
  published_at: string | null;
  cover_url: string | null;
  reading_time_minutes: number;
  updated_at: string;
  created_at: string;
};

type Filter = "all" | "published" | "draft";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Tout" },
  { key: "published", label: "Publiés" },
  { key: "draft", label: "Brouillons" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function BlogListView({ posts }: { posts: PostRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => p.status === filter);
  }, [posts, filter]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: posts.length,
      published: 0,
      draft: 0,
    };
    for (const p of posts) c[p.status] += 1;
    return c;
  }, [posts]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.32em] transition-colors",
              filter === f.key
                ? "border-cyan-200/50 bg-cyan-200/[0.08] text-cyan-100"
                : "border-white/15 text-white/55 hover:border-white/30 hover:text-white",
            )}
          >
            {f.label} <span className="ml-2 font-mono text-[10px] text-white/40">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center font-serif text-base italic text-white/35">
          {posts.length === 0
            ? "Aucune chronique pour l'instant. Commence par un brouillon ci-dessus."
            : "Rien à afficher dans ce filtre."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/blog/${p.id}`}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/25 hover:bg-white/[0.04]"
              >
                <div
                  aria-hidden
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-md border",
                    p.cover_url ? "border-white/10" : "border-dashed border-white/10 bg-white/[0.02]",
                  )}
                >
                  {p.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.cover_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-base text-white/90 group-hover:text-white">
                    {p.title || "(sans titre)"}
                  </span>
                  {p.excerpt && (
                    <span className="line-clamp-1 font-serif text-sm italic text-white/55">
                      {p.excerpt}
                    </span>
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                    {p.status === "published" ? `Publié ${formatDate(p.published_at)}` : `Brouillon · maj ${formatDate(p.updated_at)}`}
                    <span className="mx-2 text-white/15">·</span>
                    {p.reading_time_minutes} min
                    <span className="mx-2 text-white/15">·</span>
                    /{p.slug}
                  </span>
                </div>
                <Chip
                  tone={p.status === "published" ? "success" : "muted"}
                  className="shrink-0"
                >
                  {p.status === "published" ? "Publié" : "Brouillon"}
                </Chip>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
