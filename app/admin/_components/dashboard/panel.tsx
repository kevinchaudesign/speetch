/**
 * <CockpitPanel> — encadré "instrument de bord" pour les widgets du
 * dashboard /admin. Quatre brackets cyan aux coins (vibe HUD vaisseau),
 * fond légèrement teinté, optionnellement un titre + dot pulsant.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CockpitPanel({
  title,
  subtitle,
  pulsing = false,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  pulsing?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative border border-cyan-200/15 bg-cyan-200/[0.018] px-5 py-5 backdrop-blur-[2px] md:px-6 md:py-6",
        className,
      )}
      style={{
        boxShadow:
          "inset 0 0 24px rgba(125, 211, 252, 0.02), 0 0 32px -16px rgba(125, 211, 252, 0.18)",
      }}
    >
      {/* Brackets HUD aux 4 coins */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute right-0 top-0 h-2 w-2 border-r border-t border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-cyan-200/55"
      />
      <span
        aria-hidden
        className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-200/55"
      />

      {title && (
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-cyan-200/15 pb-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
              {title}
            </span>
            {subtitle && (
              <span className="font-serif text-[12px] italic text-white/45">
                {subtitle}
              </span>
            )}
          </div>
          {pulsing ? (
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping-soft rounded-full bg-cyan-300" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </span>
          ) : (
            <span className="sw-cyan-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
          )}
        </div>
      )}
      {children}
    </div>
  );
}
