"use client";

/**
 * <SkillPanel> — contenu d'une compétence affiché au CENTRE de
 * l'orbe, SANS chrome modal (pas de card, pas de border, pas de
 * backdrop). Le texte flotte directement sur la composition cosmique :
 * codename jaune brand, titre extralight blanc avec glow doré,
 * hairline gradient, description serif italique, CTA + signature.
 *
 * L'orbe est zoomé ×2.2 en arrière-plan (cf. HeroOrb.active) → le
 * texte se pose au centre de l'orbe agrandie.
 *
 * Fermeture : Esc, click outside (sur le wrapper), bouton X discret
 * en haut à droite de la zone texte.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { Skill } from "@/lib/skills";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function SkillPanel({
  skill,
  onClose,
}: {
  skill: Skill | null;
  onClose: () => void;
}) {
  // Esc pour fermer
  useEffect(() => {
    if (!skill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [skill, onClose]);

  return (
    <AnimatePresence>
      {skill && (
        <motion.div
          key="skill-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`skill-title-${skill.id}`}
        >
          {/* Zone cliquable d'arrière-plan — click outside ferme. Pas
              de dim ni de blur : le texte flotte directement sur la
              composition (orbe zoomée + starfield). */}
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
          />

          {/* Contenu texte — pas de card ni de border. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(4px)" }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="relative w-full max-w-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer — flottant en haut à droite de la zone */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute -top-6 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-cyan-200/75 transition-colors hover:bg-cyan-200/[0.08] hover:text-cyan-100 md:-top-10"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M5 5 L19 19 M19 5 L5 19" />
              </svg>
            </button>

            {/* Codename / label court — jaune brand */}
            <p
              className="font-mono text-[10px] uppercase tracking-[0.4em]"
              style={{ color: "var(--color-brand-yellow)" }}
            >
              {skill.label}
            </p>

            {/* Titre étendu — extralight, glow doré subtil */}
            <h2
              id={`skill-title-${skill.id}`}
              className="mt-3 font-sans font-extralight leading-[0.95] tracking-[-0.03em] text-[#F5F5F7]"
              style={{
                fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                textShadow:
                  "0 0 20px rgba(250, 204, 21, 0.2), 0 0 56px rgba(250, 204, 21, 0.1), 0 0 80px rgba(0, 0, 0, 0.6)",
              }}
            >
              {skill.title}
            </h2>

            {/* Hairline brand */}
            <span
              aria-hidden
              className="mx-auto mt-5 block h-px w-full max-w-xs"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(250, 204, 21, 0.55) 35%, rgba(125, 211, 252, 0.45) 65%, transparent)",
              }}
            />

            {/* Description — serif italique, glow noir derrière pour
                rester lisible sur les éléments lumineux de l'orbe */}
            <p
              className="mx-auto mt-5 max-w-lg whitespace-pre-line text-balance font-serif text-[15px] leading-relaxed italic text-white/90 md:text-base"
              style={{
                textShadow:
                  "0 0 12px rgba(0, 0, 0, 0.85), 0 0 32px rgba(0, 0, 0, 0.7)",
              }}
            >
              {skill.description}
            </p>

            {/* Footer — CTA seul, centré */}
            <div className="mt-7 flex items-center justify-center">
              <a
                href="#contact"
                onClick={onClose}
                className="group inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-cyan-100/90 transition-colors hover:text-cyan-100"
                style={{
                  textShadow: "0 0 10px rgba(0, 0, 0, 0.8)",
                }}
              >
                <span>Demander un brief</span>
                <span className="inline-block h-px w-6 bg-cyan-200/85 transition-all duration-500 ease-out group-hover:w-12 group-hover:bg-cyan-100" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
