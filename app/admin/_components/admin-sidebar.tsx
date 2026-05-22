"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/lib/ds";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const COLLAPSE_DURATION_MS = 500;

type NavItem = {
  label: string;
  href: string;
  matches: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/admin",
    matches: (p) => p === "/admin",
  },
  {
    label: "Clients",
    href: "/admin/clients",
    matches: (p) => p.startsWith("/admin/clients"),
  },
  {
    label: "Réglages",
    href: "/admin/settings",
    matches: (p) =>
      p.startsWith("/admin/settings") || p.startsWith("/admin/templates"),
  },
];

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "transition-transform duration-500 ease-out",
        collapsed && "rotate-180",
      )}
      aria-hidden="true"
    >
      <path d="M6 2L3 5L6 8" />
    </svg>
  );
}

export function AdminSidebar({
  email,
  collapsed,
  onToggle,
}: {
  email: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: EASE_OUT_EXPO }}
      style={{
        // Transition CSS pure pour le width — fluide même avec framer-motion
        // qui anime opacity/x à l'entrée.
        transitionProperty: "width",
        transitionDuration: `${COLLAPSE_DURATION_MS}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      className={cn(
        "fixed inset-y-4 left-4 z-20 hidden flex-col justify-between overflow-hidden",
        // Largeur conditionnelle
        collapsed ? "w-16" : "w-56",
        // Pas de contour ni de fond : la sidebar flotte directement sur la page
        "bg-transparent",
        collapsed ? "px-3 py-8" : "px-6 py-8",
        "md:flex",
      )}
    >
      {/* Brand + toggle + Admin label */}
      <div className="relative flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href="/"
            aria-label="Speetch — Accueil"
            className="block min-w-0 select-none overflow-hidden whitespace-nowrap font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]"
            style={{ fontSize: "1.5rem" }}
          >
            Speetch
          </Link>
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              collapsed
                ? "Étendre la barre latérale"
                : "Replier la barre latérale"
            }
            aria-expanded={!collapsed}
            className="group flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/55 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>
        <Eyebrow
          tracking="lg"
          intensity="muted"
          className={cn(
            "text-[10px] transition-opacity duration-300",
            collapsed && "pointer-events-none opacity-0",
          )}
        >
          Admin
        </Eyebrow>
      </div>

      {/* Navigation */}
      <nav
        className="relative flex flex-col gap-6"
        aria-label="Navigation principale"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.matches(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group inline-flex items-center gap-3 whitespace-nowrap text-[10px] uppercase tracking-[0.32em] transition-colors duration-300",
                isActive ? "text-[#F5F5F7]" : "text-white/45 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "inline-block h-px shrink-0 transition-all duration-500 ease-out",
                  isActive
                    ? collapsed
                      ? "w-6 bg-[#F5F5F7]"
                      : "w-10 bg-[#F5F5F7]"
                    : collapsed
                      ? "w-4 bg-current group-hover:w-6"
                      : "w-3 bg-current group-hover:w-8",
                )}
              />
              <span
                className={cn(
                  "transition-opacity duration-300",
                  collapsed && "pointer-events-none opacity-0",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Session + logout */}
      <div className="relative flex flex-col gap-5 border-t border-white/[0.08] pt-6">
        <div
          className={cn(
            "flex flex-col gap-1.5 overflow-hidden transition-all duration-500 ease-out",
            collapsed
              ? "max-h-0 opacity-0"
              : "max-h-32 opacity-100",
          )}
        >
          <Eyebrow tracking="lg" intensity="muted" className="text-[10px] text-white/30">
            Session
          </Eyebrow>
          <span className="break-all text-[13px] font-light text-white/70">
            {email}
          </span>
        </div>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title={collapsed ? "Déconnexion" : undefined}
            className="group inline-flex items-center gap-3 whitespace-nowrap text-[10px] uppercase tracking-[0.32em] text-white/55 transition-colors duration-300 hover:text-white"
          >
            <span
              className={cn(
                "inline-block h-px shrink-0 bg-current transition-all duration-500 ease-out",
                collapsed
                  ? "w-4 group-hover:w-6"
                  : "w-3 group-hover:w-8",
              )}
            />
            <span
              className={cn(
                "transition-opacity duration-300",
                collapsed && "pointer-events-none opacity-0",
              )}
            >
              Déconnexion
            </span>
          </button>
        </form>
      </div>
    </motion.aside>
  );
}
