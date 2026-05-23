"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Sous-nav horizontale partagée par les pages /admin/crm/*. Permet de
 * switcher entre la liste Padawans et l'historique des Transmissions
 * (emailings) sans perdre le contexte de la section.
 */

type Tab = {
  href: string;
  label: string;
  /** Match strict (===) ou prefix (startsWith). */
  matches: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/admin/crm",
    label: "Padawans",
    matches: (p) => p === "/admin/crm" || /^\/admin\/crm\/[^/]+$/.test(p),
  },
  {
    href: "/admin/crm/transmissions",
    label: "Transmissions",
    matches: (p) => p.startsWith("/admin/crm/transmissions"),
  },
];

export function CrmSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-7 border-b border-cyan-200/15 pb-3"
      aria-label="Navigation CRM"
    >
      {TABS.map((tab) => {
        const active = tab.matches(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative inline-flex items-center gap-3 whitespace-nowrap pb-2 text-[11px] uppercase tracking-[0.32em] transition-colors duration-300",
              active
                ? "text-cyan-100"
                : "text-white/45 hover:text-cyan-100/85",
            )}
          >
            <span className={cn(active && "sw-hologram-text")}>
              {tab.label}
            </span>
            {active && (
              <span
                aria-hidden
                className="sw-hologram-line absolute -bottom-[1px] left-0 right-0 h-px"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
