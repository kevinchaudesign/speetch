"use client";

/**
 * Konami Code — easter egg admin.
 *
 * Séquence : ↑ ↑ ↓ ↓ ← → ← → B A
 *
 * Quand le Maître tape la séquence dans l'admin, un toast hologrammique
 * apparaît au centre avec une citation Yoda aléatoire, puis fade après ~4s.
 * Réutilisable — le composant peut être trigger plusieurs fois.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
] as const;

const YODA_QUOTES = [
  "Que la Force soit avec toi, Maître.",
  "Faire, ou ne pas faire. Il n'y a pas d'essai.",
  "Beaucoup à apprendre, tu as encore.",
  "Patience tu dois avoir, jeune Padawan.",
  "La peur est le chemin vers le côté obscur. Du Codex, pas. De la Force, oui.",
  "Différent, ton chemin est. Mais le Conseil te suit.",
];

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function KonamiCode() {
  const [matched, setMatched] = useState(false);
  const [quote, setQuote] = useState<string>("");

  useEffect(() => {
    let buffer: string[] = [];

    function onKey(e: KeyboardEvent) {
      // Ignore si l'utilisateur tape dans un champ (chatbot, forms, etc.)
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      buffer.push(e.code);
      // On garde uniquement les derniers N codes (taille de la séquence)
      if (buffer.length > SEQUENCE.length) {
        buffer = buffer.slice(-SEQUENCE.length);
      }
      if (
        buffer.length === SEQUENCE.length &&
        buffer.every((c, i) => c === SEQUENCE[i])
      ) {
        const q = YODA_QUOTES[Math.floor(Math.random() * YODA_QUOTES.length)];
        setQuote(q);
        setMatched(true);
        buffer = []; // reset pour ré-armer
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-dismiss après 4.5s
  useEffect(() => {
    if (!matched) return;
    const t = window.setTimeout(() => setMatched(false), 4500);
    return () => window.clearTimeout(t);
  }, [matched]);

  return (
    <AnimatePresence>
      {matched && (
        <motion.div
          key="konami"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center px-6"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="max-w-2xl rounded-2xl border border-cyan-200/35 bg-black/85 px-10 py-8 text-center backdrop-blur-2xl"
            style={{
              boxShadow:
                "0 0 60px rgba(125, 211, 252, 0.35), inset 0 0 24px rgba(125, 211, 252, 0.08)",
            }}
          >
            <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-cyan-200/70">
              Transmission holocron
            </p>
            <p
              className="font-serif text-2xl font-light italic leading-tight text-[#F5F5F7] md:text-3xl"
              style={{
                textShadow:
                  "0 0 12px rgba(125, 211, 252, 0.6), 0 0 32px rgba(125, 211, 252, 0.25)",
              }}
            >
              « {quote} »
            </p>
            <p className="mt-4 text-[10px] uppercase tracking-[0.4em] text-cyan-200/55">
              Maître Yoda
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
