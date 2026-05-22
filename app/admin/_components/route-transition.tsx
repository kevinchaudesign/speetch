"use client";

/**
 * Transition cinématique entre routes admin — bref "saut hyperespace".
 *
 * Quand le pathname change, un overlay full-screen flash :
 *  - 12 lignes blanches radiantes du centre vers les bords (effet warp)
 *  - vignette cyan subtile
 *  - ~450ms total puis se dissipe
 *
 * Caché si `prefers-reduced-motion`.
 *
 * Note : on n'unmount PAS les children (sinon Next.js perd la prefetched
 * page). On render uniquement l'overlay au-dessus + on déclenche
 * l'animation à chaque changement de pathname.
 */

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function RouteTransition() {
  const pathname = usePathname();
  const [warpKey, setWarpKey] = useState<string | null>(null);
  const firstRef = useRef(true);

  useEffect(() => {
    // Skip le premier mount (load initial) — pas de warp à l'arrivée.
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    // Skip si reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    // Déclenche un nouveau warp à chaque changement.
    setWarpKey(`${pathname}-${Date.now()}`);
  }, [pathname]);

  return (
    <AnimatePresence>
      {warpKey && (
        <motion.div
          key={warpKey}
          aria-hidden
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          onAnimationComplete={() => setWarpKey(null)}
          className="pointer-events-none fixed inset-0 z-[65] overflow-hidden"
        >
          {/* Vignette cyan globale */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at center, rgba(125,211,252,0.18), transparent 60%)",
            }}
          />
          {/* 12 lignes radiantes blanches qui filent du centre vers les bords */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (360 / 12) * i;
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 origin-left"
                style={{
                  width: "70vmax",
                  height: 1,
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.85), rgba(125,211,252,0.6) 50%, transparent)",
                  transform: `rotate(${angle}deg) translateX(0)`,
                  boxShadow: "0 0 8px rgba(125,211,252,0.5)",
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 0.9, 0] }}
                transition={{
                  duration: 0.45,
                  ease: EASE_OUT_EXPO,
                  delay: i * 0.01,
                }}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
