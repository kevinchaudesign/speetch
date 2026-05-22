"use client";

/**
 * Curseur ghost cyan qui suit le pointeur dans tout l'admin.
 *
 * - Spring follow (Framer Motion) → traînée fluide
 * - mix-blend-difference → contraste auto sur fonds clairs ou foncés
 * - Caché sur mobile (touch) et si `prefers-reduced-motion`
 * - Pas de hover variants : volontairement simple, présence subtile
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AdminCursor() {
  const [mouse, setMouse] = useState<{ x: number; y: number }>({
    x: -100,
    y: -100,
  });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Détecte si le device a un pointeur fin (= souris/trackpad), sinon
    // on désactive complètement (touch screens, etc.).
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (!fine || reduced) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Anneau extérieur — spring lent, lag visible */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/50 mix-blend-difference"
        animate={{ x: mouse.x, y: mouse.y }}
        transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.45 }}
      />
      {/* Point central — spring rapide, suit de très près */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[71] h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 mix-blend-difference"
        animate={{ x: mouse.x, y: mouse.y }}
        transition={{ type: "spring", stiffness: 800, damping: 36 }}
      />
    </>
  );
}
