/**
 * <ActivityFeed> — flux des derniers événements du Conseil. Mixe
 * Holocrons forgés, Padawans repérés, Transmissions envoyées. Tri par
 * date desc, déjà fait côté data.ts.
 */

import Link from "next/link";
import { CockpitPanel } from "./panel";
import type { ActivityEvent } from "./data";

const DOT_COLOR: Record<ActivityEvent["kind"], string> = {
  holocron: "bg-cyan-300",
  padawan: "bg-amber-300",
  transmission: "bg-emerald-300",
};

const KIND_LABEL: Record<ActivityEvent["kind"], string> = {
  holocron: "Holocron forgé",
  padawan: "Padawan repéré",
  transmission: "Transmission émise",
};

const ICONS: Record<ActivityEvent["kind"], () => React.ReactElement> = {
  holocron: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 L4 7 L4 17 L12 21 L20 17 L20 7 Z" />
    </svg>
  ),
  padawan: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="6" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17" cy="17" r="1.6" />
    </svg>
  ),
  transmission: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="19" rx="6" ry="1.2" />
      <path d="M7 19 L12 7 L17 19" />
    </svg>
  ),
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  const w = Math.floor(d / 7);
  if (w < 5) return `il y a ${w} sem`;
  const months = Math.floor(d / 30);
  return `il y a ${months} mois`;
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <CockpitPanel title="Journal de bord" subtitle="derniers signaux captés">
      {events.length === 0 ? (
        <p className="font-serif text-sm italic text-white/45">
          Pas encore de signal. Le journal s&apos;animera dès que le
          Conseil agira.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e, i) => {
            const Icon = ICONS[e.kind];
            const dotColor = DOT_COLOR[e.kind];
            const inner = (
              <div className="group flex items-start gap-4 border-b border-cyan-200/10 pb-3 last:border-b-0 last:pb-0">
                <span
                  className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`}
                  style={{
                    boxShadow: `0 0 6px currentColor`,
                  }}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cyan-200/55">
                    <span className="text-cyan-200/70">
                      <Icon />
                    </span>
                    {KIND_LABEL[e.kind]}
                  </span>
                  <span className="truncate text-sm font-light text-[#F5F5F7] transition-colors group-hover:text-cyan-100">
                    {e.title}
                  </span>
                  {e.detail && (
                    <span className="truncate font-mono text-[11px] text-white/45">
                      {e.detail}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-white/35">
                  {timeAgo(e.at)}
                </span>
              </div>
            );
            return (
              <li key={`${e.kind}-${i}-${e.at}`}>
                {e.href ? (
                  <Link href={e.href} className="block">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </CockpitPanel>
  );
}
