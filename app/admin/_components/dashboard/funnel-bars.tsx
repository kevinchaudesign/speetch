/**
 * <FunnelBars> — funnel horizontal du CRM Padawans. Une ligne par
 * statut, barre normalisée sur le max (le statut le plus chargé fait
 * 100 %), couleur dictée par le tone du statut (cohérent avec les
 * StatusBadge ailleurs).
 */

import { CockpitPanel } from "./panel";
import { PADAWAN_STATUS_LABEL } from "@/lib/crm";
import type { PadawanStatus } from "@/lib/crm";

const TONE_COLORS: Record<
  "info" | "neutral" | "warning" | "success" | "danger",
  { bar: string; glow: string; text: string }
> = {
  info: {
    bar: "linear-gradient(90deg, rgba(125, 211, 252, 0.85), rgba(125, 211, 252, 0.25))",
    glow: "rgba(125, 211, 252, 0.45)",
    text: "rgba(186, 230, 253, 0.95)",
  },
  neutral: {
    bar: "linear-gradient(90deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.15))",
    glow: "rgba(255, 255, 255, 0.25)",
    text: "rgba(245, 245, 247, 0.85)",
  },
  warning: {
    bar: "linear-gradient(90deg, rgba(251, 191, 36, 0.85), rgba(251, 191, 36, 0.25))",
    glow: "rgba(251, 191, 36, 0.5)",
    text: "rgba(253, 230, 138, 0.95)",
  },
  success: {
    bar: "linear-gradient(90deg, rgba(52, 211, 153, 0.85), rgba(52, 211, 153, 0.25))",
    glow: "rgba(52, 211, 153, 0.5)",
    text: "rgba(167, 243, 208, 0.95)",
  },
  danger: {
    bar: "linear-gradient(90deg, rgba(251, 113, 133, 0.85), rgba(251, 113, 133, 0.25))",
    glow: "rgba(251, 113, 133, 0.45)",
    text: "rgba(254, 205, 211, 0.95)",
  },
};

export function FunnelBars({
  rows,
}: {
  rows: Array<{
    status: PadawanStatus;
    label: string;
    tone: "info" | "neutral" | "warning" | "success" | "danger";
    count: number;
  }>;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <CockpitPanel title="Funnel Padawans" subtitle="répartition par étape" pulsing>
      <ul className="flex flex-col gap-4">
        {rows.map((r) => {
          const pct = (r.count / max) * 100;
          const colors = TONE_COLORS[r.tone];
          return (
            <li key={r.status} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em]">
                <span style={{ color: colors.text }}>
                  {PADAWAN_STATUS_LABEL[r.status]}
                </span>
                <span className="font-mono text-white/55">{r.count}</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-sm bg-cyan-200/[0.04]">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${pct}%`,
                    background: colors.bar,
                    boxShadow: `0 0 12px ${colors.glow}`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </CockpitPanel>
  );
}
