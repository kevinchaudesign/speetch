/**
 * <StatCard> — tuile KPI du cockpit. Grande valeur + label + delta 30j
 * + sparkline. Posée dans un CockpitPanel pour le chrome HUD.
 *
 * `delta30` : ce qui s'est passé sur les 30 derniers jours (count, pas
 * un pourcentage — on évite les divisions par zéro et c'est plus
 * lisible : "+3 sur 30j" parle plus que "+25%").
 */

import Link from "next/link";
import { CockpitPanel } from "./panel";
import { Sparkline } from "./sparkline";

type Tone = "cyan" | "amber" | "emerald" | "rose";

export function StatCard({
  label,
  value,
  spark,
  delta30,
  hint,
  href,
  tone = "cyan",
}: {
  label: string;
  value: number;
  spark: number[];
  delta30: number;
  hint?: string;
  href?: string;
  tone?: Tone;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/65">
            {label}
          </span>
          {hint && (
            <span className="font-serif text-[11px] italic text-white/40">
              {hint}
            </span>
          )}
        </div>
        <span className="sw-cyan-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span
          className="font-sans font-extralight leading-none tracking-[-0.05em] text-[#F5F5F7]"
          style={{
            fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
            textShadow: "0 0 18px rgba(125, 211, 252, 0.2)",
          }}
        >
          {value}
        </span>
        <span
          className="font-mono text-[11px] uppercase tracking-[0.28em]"
          style={{
            color:
              delta30 > 0
                ? "rgb(167, 243, 208)"
                : delta30 < 0
                  ? "rgb(252, 165, 165)"
                  : "rgba(255,255,255,0.35)",
          }}
        >
          {delta30 > 0 ? "+" : ""}
          {delta30} · 30j
        </span>
      </div>

      <div className="mt-4">
        <Sparkline values={spark} width={220} height={44} tone={tone} className="w-full" />
      </div>
    </>
  );

  return (
    <CockpitPanel className="h-full">
      {href ? (
        <Link
          href={href}
          className="group flex h-full flex-col transition-colors"
        >
          {content}
        </Link>
      ) : (
        <div className="flex h-full flex-col">{content}</div>
      )}
    </CockpitPanel>
  );
}
