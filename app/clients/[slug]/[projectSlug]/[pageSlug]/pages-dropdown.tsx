"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type PageNavItem = {
  slug: string;
  name: string;
  lot_id: string | null;
  lot_name: string | null;
  lot_position: number | null;
};

/**
 * Dropdown de navigation entre les pages d'un projet. Le menu est segmenté
 * par lot : une étiquette « Lot 01 · {nom} » introduit chaque groupe, les
 * pages sans lot sont rassemblées en fin sous « Hors lot ». L'ordre des
 * pages reflète celui défini en admin (clé de tri lot.position puis
 * page.position, gérée côté requête).
 */
export function PagesDropdown({
  clientSlug,
  projectSlug,
  currentSlug,
  pages,
  theme = "dark",
}: {
  clientSlug: string;
  projectSlug: string;
  currentSlug: string;
  pages: PageNavItem[];
  theme?: "dark" | "light";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (pages.length === 0) return null;

  const currentIdx = pages.findIndex((p) => p.slug === currentSlug);
  const total = pages.length;
  const position = currentIdx >= 0 ? currentIdx + 1 : null;

  const isDark = theme === "dark";

  // Regroupe par lot — pages déjà ordonnées côté requête, donc les pages
  // d'un même lot sont contiguës. Numérote les lots dans l'ordre où ils
  // apparaissent (1, 2, …) pour matcher l'affichage admin.
  type Group = {
    key: string;
    label: string;
    pages: PageNavItem[];
  };
  const groups: Group[] = [];
  let lotDisplayIdx = 0;
  for (const p of pages) {
    const key = p.lot_id ?? "__orphan__";
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) {
      const label = p.lot_id
        ? `Lot ${String(++lotDisplayIdx).padStart(2, "0")}${p.lot_name ? ` · ${p.lot_name}` : ""}`
        : "Hors lot";
      groups.push({ key, label, pages: [p] });
    } else {
      last.pages.push(p);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] transition-colors md:gap-3 md:text-[11px]",
          isDark
            ? open
              ? "text-white"
              : "text-white/55 hover:text-white"
            : open
              ? "text-[#6E0410]"
              : "text-[#6E0410]/65 hover:text-[#6E0410]",
        )}
      >
        <span>
          {position !== null ? `Page ${position}/${total}` : "Pages"}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden
          className={cn(
            "transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
        >
          <path
            d="M1 3 L5 7 L9 3"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-40 mt-3 flex w-[min(calc(100vw-2.5rem),320px)] flex-col overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md md:w-[320px]",
            isDark
              ? "border-white/10 bg-black/90"
              : "border-[rgba(110,4,16,0.18)] bg-[#F8F1E0]/95",
          )}
        >
          <div
            className={cn(
              "border-b px-4 py-3",
              isDark ? "border-white/5" : "border-[rgba(110,4,16,0.12)]",
            )}
          >
            <span
              className={cn(
                "text-[10px] uppercase tracking-[0.32em]",
                isDark ? "text-white/40" : "text-[#6E0410]/55",
              )}
            >
              Pages du projet · {total}
            </span>
          </div>
          <ul className="flex max-h-[60vh] flex-col overflow-y-auto py-1">
            {groups.map((group, gi) => (
              <Fragment key={group.key}>
                <li
                  role="presentation"
                  className={cn(
                    "px-4 pb-2 pt-4",
                    gi > 0 &&
                      (isDark
                        ? "mt-1 border-t border-white/[0.06]"
                        : "mt-1 border-t border-[rgba(110,4,16,0.08)]"),
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.32em]",
                      isDark ? "text-white/40" : "text-[#6E0410]/55",
                    )}
                  >
                    {group.label}
                  </span>
                </li>
                {group.pages.map((p, pi) => {
                  const isCurrent = p.slug === currentSlug;
                  if (isCurrent) {
                    return (
                      <li
                        key={p.slug}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 text-[12px]",
                          isDark ? "text-white/75" : "text-[#6E0410]",
                        )}
                        role="menuitem"
                        aria-current="page"
                      >
                        <span
                          className={cn(
                            "font-mono text-[10px]",
                            isDark ? "text-white/35" : "text-[#6E0410]/45",
                          )}
                        >
                          {String(pi + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 truncate">{p.name}</span>
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-[0.32em]",
                            isDark ? "text-white/35" : "text-[#6E0410]/55",
                          )}
                        >
                          Page courante
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={p.slug} role="menuitem">
                      <Link
                        href={`/clients/${clientSlug}/${projectSlug}/${p.slug}`}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 px-4 py-3 text-[12px] transition-colors",
                          isDark
                            ? "text-white/65 hover:bg-white/[0.06] hover:text-white"
                            : "text-[#6E0410]/80 hover:bg-[rgba(110,4,16,0.06)] hover:text-[#6E0410]",
                        )}
                      >
                        <span
                          className={cn(
                            "font-mono text-[10px]",
                            isDark ? "text-white/30" : "text-[#6E0410]/40",
                          )}
                        >
                          {String(pi + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 truncate">{p.name}</span>
                        <span
                          className={cn(
                            "transition-transform group-hover:translate-x-0.5",
                            isDark ? "text-white/30" : "text-[#6E0410]/45",
                          )}
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </Fragment>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
