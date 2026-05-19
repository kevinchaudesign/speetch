"use client";

/**
 * Bouton flottant bas-gauche qui active/désactive le mode édition admin sur
 * les pages d'un espace client. Visible uniquement quand un admin Speetch
 * est connecté (cf. AdminEditModeFlag).
 *
 * État géré côté UI ici. Diffusé via :
 *  - `window.dispatchEvent(new CustomEvent('speetch:edit-mode', { detail: { active } }))`
 *    → écouté par RawHtmlPageView qui forward à l'iframe en postMessage
 *  - `document.documentElement.dataset.speetchEditMode = "true"` / removed
 *    → permet à d'autres surfaces (chatbot, indicateur visuel) de réagir
 *
 * Reset à chaque page load (pas de persistance) — opt-in délibéré.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function EditModeToggle() {
  const [active, setActive] = useState(false);

  // Diffuse l'état à chaque flip.
  useEffect(() => {
    const root = document.documentElement;
    if (active) {
      root.dataset.speetchEditMode = "true";
    } else {
      delete root.dataset.speetchEditMode;
    }
    window.dispatchEvent(
      new CustomEvent("speetch:edit-mode", { detail: { active } }),
    );
  }, [active]);

  // Cleanup au démontage : on désarme.
  useEffect(() => {
    return () => {
      const root = document.documentElement;
      delete root.dataset.speetchEditMode;
      window.dispatchEvent(
        new CustomEvent("speetch:edit-mode", { detail: { active: false } }),
      );
    };
  }, []);

  const toggle = useCallback(() => setActive((v) => !v), []);

  return (
    <>
      <motion.button
        type="button"
        onClick={toggle}
        aria-pressed={active}
        aria-label={
          active ? "Quitter le mode édition" : "Activer le mode édition"
        }
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.3 }}
        className={cn(
          "group fixed bottom-6 left-6 z-[60] inline-flex items-center gap-3 rounded-full border px-4 py-2.5",
          "backdrop-blur-2xl transition-all duration-500 ease-out",
          "shadow-[0_18px_48px_-18px_rgba(0,0,0,0.85),inset_1px_1px_0_0_rgba(255,255,255,0.05)]",
          active
            ? "border-emerald-300/55 bg-emerald-300/[0.08] text-emerald-100"
            : "border-white/[0.12] bg-white/[0.04] text-white/85 hover:border-white/30 hover:text-white",
        )}
      >
        {/* Dot */}
        <span
          aria-hidden
          className={cn(
            "relative inline-block h-2 w-2 rounded-full transition-colors duration-300",
            active ? "bg-emerald-300" : "bg-white/35",
          )}
        >
          {active && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-emerald-300"
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em]">
          {active ? "Mode édition" : "Éditer"}
        </span>
        <span
          aria-hidden
          className={cn(
            "inline-block h-px bg-current transition-all duration-500 ease-out",
            active ? "w-6" : "w-4 group-hover:w-10",
          )}
        />
      </motion.button>

      {/* Liseré subtil tout autour du viewport pour signaler le mode édition */}
      <AnimatePresence>
        {active && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="pointer-events-none fixed inset-0 z-[55]"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(110, 231, 183, 0.35), inset 0 0 80px -10px rgba(110, 231, 183, 0.10)",
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
