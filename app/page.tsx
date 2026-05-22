"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN_OUT_QUART: [number, number, number, number] = [0.65, 0, 0.35, 1];

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState("--:--:--");
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const letters = useMemo(() => "SPEETCH".split(""), []);

  // Préchargement simulé 0 → 100 (easing cubic-out)
  useEffect(() => {
    const duration = 2400;
    const start = performance.now();
    let frame = 0;

    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.floor(eased * 100));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => setLoaded(true), 320);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Horloge Paris (mise à jour seconde par seconde)
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date());

    setTime(fmt());
    const id = window.setInterval(() => setTime(fmt()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Curseur custom — suit la souris
  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="relative h-svh w-screen overflow-hidden">
      {/* Star field + scanlines hologramme — fond cinématique Conseil Jedi */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-40"
      />

      {/* Curseur personnalisé — passe cyan une fois loaded */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/55 mix-blend-difference md:block"
        animate={{ x: mouse.x, y: mouse.y }}
        transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.4 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[71] hidden h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 mix-blend-difference md:block"
        animate={{ x: mouse.x, y: mouse.y }}
        transition={{ type: "spring", stiffness: 800, damping: 36 }}
      />

      {/* Preloader — « Réception transmission » */}
      <AnimatePresence mode="wait">
        {!loaded && (
          <motion.div
            key="loader"
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.7, ease: EASE_IN_OUT_QUART }}
            className="absolute inset-0 z-50 flex items-end justify-between bg-black px-6 py-8 md:px-12 md:py-12"
          >
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/55">
                Transmission entrante
              </span>
              <span className="font-sans text-7xl font-light leading-none tabular-nums md:text-9xl">
                {String(progress).padStart(3, "0")}
              </span>
            </div>

            <div className="flex max-w-[40%] flex-col items-end gap-3">
              <span className="text-right text-[10px] uppercase tracking-[0.32em] text-cyan-200/55">
                Speetch — Édition 2026
              </span>
              <div className="h-px w-40 overflow-hidden bg-cyan-200/15 md:w-64">
                <motion.div
                  className="h-full origin-left bg-cyan-200"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: progress / 100 }}
                  transition={{ ease: "linear" }}
                  style={{
                    boxShadow: "0 0 8px rgba(125, 211, 252, 0.6)",
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sabre vertical — accent immersif (desktop seulement) */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{
          opacity: loaded ? 1 : 0,
          scaleY: loaded ? 1 : 0,
        }}
        transition={{ duration: 1.4, delay: 0.4, ease: EASE_OUT_EXPO }}
        className="sw-lightsaber-bar pointer-events-none absolute bottom-20 left-6 top-24 hidden w-[2px] origin-bottom rounded-full md:block"
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : -8 }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
        className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 md:px-12"
      >
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
            <span className="sw-cyan-dot relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
          </span>
          Conseil Jedi en formation
        </div>

        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 tabular-nums">
          <span>{time}</span>
          <span className="text-cyan-200/25"> · </span>
          <span>PAR</span>
        </div>
      </motion.header>

      {/* Composition centrale */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: EASE_OUT_EXPO }}
          className="mb-6 text-[11px] uppercase tracking-[0.4em] text-cyan-200/65 md:mb-10"
        >
          Groupe de communication · ère de l&apos;IA
        </motion.p>

        <h1
          aria-label="Speetch"
          className="select-none text-center font-sans font-extralight leading-[0.82] tracking-[-0.06em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(4.5rem, 22vw, 22rem)" }}
        >
          <span className="flex overflow-hidden">
            {letters.map((letter, i) => (
              <motion.span
                key={`${letter}-${i}`}
                initial={{ y: "115%" }}
                animate={{ y: loaded ? "0%" : "115%" }}
                transition={{
                  duration: 1.2,
                  delay: 0.55 + i * 0.06,
                  ease: EASE_OUT_EXPO,
                }}
                className="inline-block"
                style={{
                  textShadow: loaded
                    ? "0 0 24px rgba(125, 211, 252, 0.18), 0 0 60px rgba(125, 211, 252, 0.08)"
                    : undefined,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 8 }}
          transition={{ duration: 0.9, delay: 1.55, ease: EASE_OUT_EXPO }}
          className="mt-10 flex items-center gap-6 text-[11px] uppercase tracking-[0.32em] text-cyan-200/65 md:mt-14"
        >
          <span>Temple Jedi · Paris</span>
          <span
            className="block h-px w-10"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(125,211,252,0.85), transparent)",
              boxShadow: "0 0 6px rgba(125, 211, 252, 0.5)",
            }}
          />
          <span>25 ans d&apos;expérience</span>
        </motion.div>

        {/* Signature serif discrète */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 1, delay: 1.9 }}
          className="mt-12 max-w-md text-balance text-center font-serif text-base italic text-white/55 md:text-lg"
        >
          Direction artistique, marques, expériences forgées avec la Force.
        </motion.p>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.9, delay: 1.8, ease: EASE_OUT_EXPO }}
        className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-6 py-6 text-[11px] uppercase tracking-[0.28em] text-white/45 md:px-12"
      >
        <span className="text-cyan-200/55">Transmission imminente</span>
        <span className="text-white/40">Temple Jedi · An 2026</span>
      </motion.footer>
    </div>
  );
}
