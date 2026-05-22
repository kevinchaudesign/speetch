"use client";

/**
 * ScrollReveal — wrapper qui fade-in son contenu quand il entre dans le
 * viewport. Utilise IntersectionObserver (pas de listener scroll → pas de
 * coût rAF), threshold 0.15.
 *
 * Respecte prefers-reduced-motion : si activé, le contenu apparaît
 * directement opacité 1 sans translation.
 */

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  className,
  as: As = "div",
  id,
  ariaLabel,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article";
  id?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  const MotionTag =
    As === "section"
      ? motion.section
      : As === "article"
        ? motion.article
        : motion.div;

  return (
    <MotionTag
      // @ts-expect-error ref polymorphic
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      animate={
        seen
          ? { opacity: 1, y: 0 }
          : reduced
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y }
      }
      transition={{ duration: 1.1, delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
