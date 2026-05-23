/**
 * <QuickActions> — bar de raccourcis cockpit. Boutons "ENGAGER" stylés
 * comme des commandes de console (chevron animé + glow cyan au hover).
 */

import Link from "next/link";

type Action = {
  href: string;
  label: string;
  hint: string;
};

const ACTIONS: Action[] = [
  {
    href: "/admin/clients/new",
    label: "Forger Holocron",
    hint: "Nouveau client",
  },
  {
    href: "/admin/crm/new",
    label: "Repérer Padawan",
    hint: "Nouveau lead",
  },
  {
    href: "/admin/crm/transmissions/new",
    label: "Émettre Transmission",
    hint: "Nouvel emailing",
  },
  {
    href: "/admin/settings",
    label: "Ouvrir la Forge",
    hint: "Réglages",
  },
];

export function QuickActions() {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ACTIONS.map((a) => (
        <li key={a.href}>
          <Link
            href={a.href}
            className="group relative flex items-center justify-between gap-4 border border-cyan-200/15 bg-cyan-200/[0.018] px-5 py-4 transition-colors hover:border-cyan-200/55 hover:bg-cyan-200/[0.06]"
            style={{
              boxShadow:
                "inset 0 0 16px rgba(125, 211, 252, 0.02), 0 0 24px -16px rgba(125, 211, 252, 0.3)",
            }}
          >
            {/* Brackets HUD */}
            <span
              aria-hidden
              className="absolute left-0 top-0 h-1.5 w-1.5 border-l border-t border-cyan-200/55"
            />
            <span
              aria-hidden
              className="absolute right-0 bottom-0 h-1.5 w-1.5 border-r border-b border-cyan-200/55"
            />

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/55 transition-colors group-hover:text-cyan-200/85">
                {a.hint}
              </span>
              <span className="font-sans text-base font-light text-[#F5F5F7] transition-colors group-hover:text-cyan-100">
                {a.label}
              </span>
            </div>

            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-cyan-200/65 transition-colors group-hover:text-cyan-100">
              <span className="inline-block h-px w-3 bg-current transition-all duration-500 ease-out group-hover:w-8" />
              Engager
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
