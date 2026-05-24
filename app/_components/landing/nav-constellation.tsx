"use client";

/**
 * <NavConstellation> — bouton de navigation top-right + menu plein écran.
 *
 * Bouton au repos : mini-orbe orbital (anneau dashed cyan + 3 nœuds qui
 * pulsent + cœur central), évocation directe de la constellation du hero.
 * Plus de hamburger générique.
 *
 * Au clic : overlay plein écran holographique avec titres monumentaux
 * (font-sans extralight clamp 2.5→6rem), stagger reveal vertical, decor
 * cosmique (starfield + scanlines + aura cyan diffuse au centre).
 *
 * Fermeture : Esc, clic sur le backdrop, ou clic sur un item de section
 * (smooth-scroll vers l'ancre + fermeture).
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

type NavItem = { num: string; label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { num: "01", label: "Approche", href: "#approche" },
  { num: "02", label: "Disciplines", href: "#disciplines" },
  { num: "03", label: "Clients", href: "#clients" },
  { num: "04", label: "À propos", href: "#a-propos" },
  { num: "05", label: "Contact", href: "#contact" },
];

export function NavConstellation() {
  const [open, setOpen] = useState(false);

  // Esc pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock du scroll body quand l'overlay est ouvert (compensation
  // scrollbar pour éviter le layout shift).
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  function handleNavigate(href: string) {
    setOpen(false);
    // Petit délai pour laisser la fermeture s'amorcer avant le scroll
    requestAnimationFrame(() => {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.location.hash = href;
    });
  }

  return (
    <>
      {/* Bouton fixed top-right — z-60 > overlay (z-55) pour rester
          cliquable et permettre le toggle close. */}
      <div className="fixed right-5 top-5 z-[60] flex flex-col items-center md:right-8 md:top-8">
        <motion.button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE_OUT_EXPO }}
          className="speetch-nav-button group relative flex h-12 w-12 items-center justify-center rounded-full md:h-14 md:w-14"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(125, 211, 252, 0.18), rgba(125, 211, 252, 0.06) 60%, transparent 80%)",
            boxShadow: open
              ? "0 0 32px rgba(125, 211, 252, 0.55), inset 0 0 0 1px rgba(125, 211, 252, 0.6)"
              : "0 0 20px rgba(125, 211, 252, 0.2), inset 0 0 0 1px rgba(125, 211, 252, 0.3)",
            transition: "box-shadow 380ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(125, 211, 252, 0.55), transparent 60%)",
              filter: "blur(14px)",
              opacity: open ? 0.85 : 0,
              transition: "opacity 500ms ease-out",
            }}
          />

          <svg
            viewBox="0 0 56 56"
            width="56"
            height="56"
            className="relative h-9 w-9 md:h-11 md:w-11"
            overflow="visible"
          >
            <defs>
              <filter
                id="nav-glow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="rgba(186, 230, 253, 0.55)"
              strokeWidth="1"
              strokeDasharray="2 4"
              className="speetch-nav-rot-cw"
              style={{ transformOrigin: "28px 28px" }}
            />
            <circle
              cx="28"
              cy="28"
              r="14"
              fill="none"
              stroke="rgba(186, 230, 253, 0.35)"
              strokeWidth="1"
            />
            <g
              className="speetch-nav-rot-ccw"
              style={{ transformOrigin: "28px 28px" }}
            >
              {[0, 120, 240].map((deg) => {
                const a = (deg * Math.PI) / 180;
                const x = 28 + Math.cos(a) * 14;
                const y = 28 + Math.sin(a) * 14;
                return (
                  <circle
                    key={deg}
                    cx={x.toFixed(3)}
                    cy={y.toFixed(3)}
                    r="2.2"
                    fill="rgb(186, 230, 253)"
                    filter="url(#nav-glow)"
                  />
                );
              })}
            </g>
            <circle
              cx="28"
              cy="28"
              r="3"
              fill={open ? "rgb(250, 204, 21)" : "rgb(186, 230, 253)"}
              filter="url(#nav-glow)"
              className="speetch-nav-pulse"
              style={{
                transition: "fill 380ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </svg>

          <style>{`
            @keyframes speetch-nav-rot-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
            @keyframes speetch-nav-rot-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
            @keyframes speetch-nav-pulse {
              0%, 100% { transform: scale(1);   opacity: 0.85; }
              50%      { transform: scale(1.6); opacity: 1;    }
            }
            .speetch-nav-button .speetch-nav-rot-cw  { animation: speetch-nav-rot-cw  18s linear infinite; }
            .speetch-nav-button .speetch-nav-rot-ccw { animation: speetch-nav-rot-ccw 22s linear infinite; }
            .speetch-nav-button .speetch-nav-pulse {
              transform-box: fill-box;
              transform-origin: center;
              animation: speetch-nav-pulse 2.4s ease-in-out infinite;
            }
            .speetch-nav-button:hover .speetch-nav-rot-cw,
            .speetch-nav-button:hover .speetch-nav-rot-ccw {
              animation-duration: 6s;
            }
            @media (prefers-reduced-motion: reduce) {
              .speetch-nav-button * { animation: none !important; transform: none !important; }
            }
          `}</style>
        </motion.button>

        {/* Label « Menu » sous l'icône — fade out à l'ouverture
            (l'overlay plein écran rend le label redondant). */}
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: open ? 0 : 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: EASE_OUT_EXPO }}
          aria-hidden
          className="mt-2 select-none font-mono text-[9px] uppercase tracking-[0.4em] text-cyan-200/70"
          style={{
            textShadow:
              "0 0 8px rgba(125, 211, 252, 0.45), 0 0 4px rgba(0, 0, 0, 0.85)",
          }}
        >
          Menu
        </motion.span>
      </div>

      {/* Overlay plein écran — sibling du bouton, z-55 (sous le bouton
          à z-60 pour permettre le toggle close). */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="nav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="fixed inset-0 z-[55] flex items-center justify-center overflow-hidden bg-black/92 backdrop-blur-xl"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation principale"
          >
            {/* Décor cosmique en background */}
            <div
              aria-hidden
              className="sw-starfield pointer-events-none absolute inset-0 opacity-60"
            />
            <div
              aria-hidden
              className="sw-scanlines pointer-events-none absolute inset-0 opacity-25"
            />

            {/* Aura cyan diffuse au centre */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                width: "70vmin",
                height: "70vmin",
                background:
                  "radial-gradient(circle, rgba(125, 211, 252, 0.18) 0%, rgba(125, 211, 252, 0.06) 40%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />

            {/* Contenu menu — centré, max-w pour grands écrans */}
            <div
              className="relative flex w-full max-w-5xl flex-col gap-12 px-8 py-16 md:gap-16 md:px-16"
              onClick={(e) => e.stopPropagation()}
            >
              <ul className="flex flex-col">
                {NAV_ITEMS.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                    transition={{
                      duration: 0.6,
                      delay: 0.15 + i * 0.08,
                      ease: EASE_OUT_EXPO,
                    }}
                    className="border-b border-cyan-200/12 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      className="group flex w-full items-baseline gap-5 py-4 text-left transition-colors duration-300 md:gap-10 md:py-6"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-200/45 transition-colors duration-300 group-hover:text-cyan-200 md:text-[11px]">
                        {item.num}
                      </span>
                      <span
                        className="flex-1 font-sans font-extralight leading-[0.95] tracking-[-0.04em] text-[#F5F5F7] transition-colors duration-500 group-hover:text-cyan-100"
                        style={{
                          fontSize: "clamp(2rem, 7vw, 5.5rem)",
                          textShadow:
                            "0 0 24px rgba(125, 211, 252, 0.2), 0 0 60px rgba(125, 211, 252, 0.08)",
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        aria-hidden
                        className="hidden h-px w-10 bg-cyan-200/40 transition-all duration-700 ease-out group-hover:w-28 group-hover:bg-cyan-100 md:inline-block"
                      />
                    </button>
                  </motion.li>
                ))}
              </ul>

              {/* Footer overlay : email + signature */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.65, ease: EASE_OUT_EXPO }}
                className="flex flex-col items-start gap-4 border-t border-cyan-200/15 pt-6 md:flex-row md:items-center md:justify-between"
              >
                <a
                  href="mailto:hello@speetch.com"
                  className="font-sans text-[14px] text-white/75 transition-colors hover:text-cyan-100 md:text-[15px]"
                  onClick={() => setOpen(false)}
                >
                  hello@speetch.com
                </a>
                <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan-200/45">
                  Esc · Paris · 2026
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
