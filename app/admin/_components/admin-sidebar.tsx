"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AudioToggle } from "./audio-toggle";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const COLLAPSE_DURATION_MS = 500;

/* ── Icônes Conseil / Holocrons / Forge — viewBox 24×24, stroke 1.3 ─── */

function ConseilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      aria-hidden
    >
      {/* Cercle extérieur + pastille centrale = projection holo / sphère du Conseil */}
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HolocronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Cube isométrique — cohérent avec l'icône Holocrons du dashboard */}
      <path d="M12 3 L4 7 L4 17 L12 21 L20 17 L20 7 Z" />
      <path d="M12 3 L12 12 M12 12 L4 7 M12 12 L20 7 M12 12 L12 21" />
    </svg>
  );
}

function GalerieIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Cadre + lune + soleil — cristal kyber holographique stylisé */}
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M3 17 L9 12 L13 15 L21 9" />
    </svg>
  );
}

function ForgeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Hexagone avec 3 points — console / panneau de contrôle Jedi */}
      <polygon points="12,3 21,8 21,16 12,21 3,16 3,8" />
      <circle cx="9" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

type NavItem = {
  label: string;
  href: string;
  matches: (pathname: string) => boolean;
  Icon: ({ className }: { className?: string }) => React.ReactElement;
};

function buildNavItems(ownerProfileId: string | null): NavItem[] {
  const galleryPath = ownerProfileId
    ? `/admin/clients/${ownerProfileId}/media`
    : null;

  const base: NavItem[] = [
    {
      label: "Conseil",
      href: "/admin",
      matches: (p) => p === "/admin",
      Icon: ConseilIcon,
    },
    {
      label: "Holocrons",
      href: "/admin/clients",
      matches: (p) => {
        if (!p.startsWith("/admin/clients")) return false;
        // La médiathèque du studio (owner profile) appartient à Galerie,
        // pas à Holocrons.
        if (galleryPath && p.startsWith(galleryPath)) return false;
        return true;
      },
      Icon: HolocronIcon,
    },
  ];

  if (galleryPath) {
    base.push({
      label: "Galerie",
      href: galleryPath,
      matches: (p) => p.startsWith(galleryPath),
      Icon: GalerieIcon,
    });
  }

  base.push({
    label: "Forge",
    href: "/admin/settings",
    matches: (p) =>
      p.startsWith("/admin/settings") || p.startsWith("/admin/templates"),
    Icon: ForgeIcon,
  });

  return base;
}

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
  ownerProfileId,
  collapsed,
  onToggle,
}: {
  ownerProfileId: string | null;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const navItems = buildNavItems(ownerProfileId);

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
      {/* Wordmark "Conseil Jedi" — logo signature de la zone admin.
          Double typographie Inter ExtraLight + Fraunces italic cyan glow
          avec glitch holocron, héritage du DS Speetch. Quand collapsed,
          se résume à un sw-cyan-dot pulsant. */}
      <Link
        href="/admin"
        aria-label="Conseil Jedi — Accueil admin"
        className="relative block transition-opacity duration-300 hover:opacity-90"
      >
        {/* Version développée */}
        <div
          className={cn(
            "flex flex-col leading-[0.95] transition-opacity duration-300",
            collapsed && "pointer-events-none absolute inset-0 opacity-0",
          )}
        >
          <span
            className="font-sans font-extralight tracking-[-0.03em] text-[#F5F5F7]"
            style={{ fontSize: "1.75rem" }}
          >
            Conseil
          </span>
          <span
            className="sw-hologram-text sw-hologram-glitch self-start pl-4 font-serif italic font-normal"
            style={{ fontSize: "1.5rem" }}
          >
            Jedi
          </span>
        </div>

        {/* Version collapsed : dot holocron pulsant */}
        <div
          className={cn(
            "flex h-12 items-center justify-center transition-opacity duration-300",
            !collapsed && "pointer-events-none absolute inset-0 opacity-0",
          )}
          aria-hidden={!collapsed}
        >
          <span
            className="sw-cyan-dot inline-block h-2 w-2 rounded-full bg-cyan-300"
            title="Conseil Jedi"
          />
        </div>
      </Link>

      {/* Navigation — chaque item a son icône SVG ; l'actif est marqué par un
          sabre cyan vertical à gauche (sw-lightsaber-bar) et un glow texte. */}
      <nav
        className="relative flex flex-col gap-5"
        aria-label="Navigation principale"
      >
        {navItems.map((item) => {
          const isActive = item.matches(pathname);
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative inline-flex items-center gap-3 whitespace-nowrap text-[10px] uppercase tracking-[0.32em] transition-colors duration-300",
                isActive
                  ? "text-cyan-100"
                  : "text-white/45 hover:text-cyan-100/85",
              )}
            >
              {/* Sabre vertical — marqueur d'item actif, glow cyan */}
              {isActive && (
                <span
                  aria-hidden
                  className={cn(
                    "sw-lightsaber-bar absolute top-0 h-full w-[2px] rounded-full",
                    collapsed ? "-left-1.5" : "-left-3",
                  )}
                />
              )}
              <Icon
                className={cn(
                  "shrink-0 transition-transform duration-300 group-hover:scale-110",
                  isActive && "sw-hologram-text",
                )}
              />
              <span
                className={cn(
                  "transition-opacity duration-300",
                  collapsed && "pointer-events-none opacity-0",
                  isActive && "sw-hologram-text",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bas de sidebar : audio + signature Aurebesh + toggle replier.
          L'identifiant et la déconnexion sont désormais dans le menu
          profil de la topbar (avatar en haut à droite). */}
      <div className="relative flex flex-col gap-5 pt-6">
        <div
          aria-hidden
          className="sw-hologram-line absolute -top-px left-0 right-0"
        />

        <AudioToggle collapsed={collapsed} />

        {/* "Quitter le Temple" a été déplacé dans le menu profil de la
            topbar (avatar en haut à droite). */}

        {/* Toggle replier / déplier — placé en bas pour rester accessible
            sans bouger l'œil du logo. */}
        <div
          className={cn(
            "flex pt-2",
            collapsed ? "justify-center" : "justify-end",
          )}
        >
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              collapsed
                ? "Étendre la barre latérale"
                : "Replier la barre latérale"
            }
            aria-expanded={!collapsed}
            title={
              collapsed
                ? "Étendre la barre latérale"
                : "Replier la barre latérale"
            }
            className="group flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cyan-200/15 bg-cyan-100/[0.03] text-cyan-200/65 transition-colors duration-300 hover:border-cyan-200/40 hover:bg-cyan-100/[0.08] hover:text-cyan-100"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
