"use client";

/**
 * Hero landing — composition cinématique FWA-grade.
 *
 * Architecture :
 *  - Preloader 0→100 (cubic-out, ~2.4s) qui se fade en blur
 *  - Big SPEETCH letters reveal staggered
 *  - Eyebrow positionnement + tagline rotating (3 phrases cyclées)
 *  - Curseur ghost cyan (spring follow)
 *  - Horloge Paris temps réel
 *  - Toggle ambient drone (Web Audio synthé hyperespace)
 *
 * Décor : starfield + scanlines + sabre vertical (utilitaires globales).
 * Sans référence Star Wars explicite dans la copy — lit comme « futuriste / IA ».
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { startAmbientDrone, type AmbientHandle } from "@/lib/sw/audio";
import { SpeetchLogo } from "../speetch-logo";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN_OUT_QUART: [number, number, number, number] = [0.65, 0, 0.35, 1];

const TAGLINES = [
  "Direction artistique × IA",
  "Marques · Produits · Plateformes",
  "Studio parisien · Depuis 2026",
];

export function LandingHero() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState("--:--:--");
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [ambientOn, setAmbientOn] = useState(false);
  const ambientRef = useRef<AmbientHandle | null>(null);

  const letters = useMemo(() => "SPEETCH".split(""), []);

  /* Preloader 0 → 100 (cubic-out) */
  useEffect(() => {
    const duration = 2200;
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.floor(eased * 100));
      if (t < 1) frame = requestAnimationFrame(tick);
      else window.setTimeout(() => setLoaded(true), 280);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  /* Horloge Paris */
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

  /* Curseur */
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  /* Cycle tagline toutes les 3.6s — start après loaded */
  useEffect(() => {
    if (!loaded) return;
    const id = window.setInterval(
      () => setTaglineIndex((i) => (i + 1) % TAGLINES.length),
      3600,
    );
    return () => window.clearInterval(id);
  }, [loaded]);

  /* Ambient drone toggle */
  function toggleAmbient() {
    if (ambientOn) {
      ambientRef.current?.stop();
      ambientRef.current = null;
      setAmbientOn(false);
    } else {
      const handle = startAmbientDrone();
      if (handle) {
        ambientRef.current = handle;
        setAmbientOn(true);
      }
    }
  }
  useEffect(() => () => ambientRef.current?.stop(), []);

  return (
    <section
      aria-label="Hero — Speetch, studio de communication à l'ère de l'IA"
      className="relative h-svh w-screen overflow-hidden"
    >
      {/* Décor cosmique */}
      <div
        aria-hidden
        className="sw-starfield pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="sw-scanlines pointer-events-none absolute inset-0 -z-10 opacity-40"
      />

      {/* Curseur ghost cyan — visible uniquement sur pointeur fin */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/50 mix-blend-difference md:block"
        animate={{ x: mouse.x, y: mouse.y }}
        transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.45 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[71] hidden h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 mix-blend-difference md:block"
        animate={{ x: mouse.x, y: mouse.y }}
        transition={{ type: "spring", stiffness: 800, damping: 36 }}
      />

      {/* Preloader cinématique */}
      <AnimatePresence mode="wait">
        {!loaded && (
          <motion.div
            key="loader"
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.7, ease: EASE_IN_OUT_QUART }}
            className="absolute inset-0 z-50 flex items-end justify-between bg-black px-6 py-8 md:px-12 md:py-12"
            role="status"
            aria-live="polite"
            aria-label={`Chargement ${progress}%`}
          >
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/55">
                Initialisation
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
                  style={{ boxShadow: "0 0 8px rgba(125, 211, 252, 0.6)" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sabre vertical décor */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: loaded ? 1 : 0, scaleY: loaded ? 1 : 0 }}
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
        <a
          href="#top"
          aria-label="Speetch — retour en haut"
          className="group inline-flex items-center gap-3 transition-opacity duration-300 hover:opacity-80"
        >
          <SpeetchLogo size="md" loading="eager" />
          <span className="hidden text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 md:inline">
            <span className="relative mr-3 inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-70" />
              <span className="sw-cyan-dot relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </span>
            Studio ouvert · prise de brief
          </span>
        </a>

        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={toggleAmbient}
            title={
              ambientOn ? "Couper l'ambient" : "Activer l'ambient sonore"
            }
            aria-pressed={ambientOn}
            className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors hover:text-cyan-100"
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                ambientOn ? "sw-cyan-dot bg-cyan-300" : "bg-cyan-200/30"
              }`}
            />
            <span>{ambientOn ? "Ambient · ON" : "Ambient"}</span>
          </button>
          <span
            className="font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-200/65 tabular-nums"
            aria-label={`Heure de Paris : ${time}`}
          >
            <span>{time}</span>
            <span className="text-cyan-200/25"> · </span>
            <span>PAR</span>
          </span>
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
          Studio de communication · à l&apos;ère de l&apos;IA
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

        {/* Tagline rotating */}
        <div className="relative mt-10 flex h-7 items-center md:mt-14">
          <AnimatePresence mode="wait">
            <motion.span
              key={taglineIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 8 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/85"
            >
              {TAGLINES[taglineIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 1, delay: 1.9 }}
          className="mt-10 max-w-md text-balance text-center font-serif text-base italic text-white/55 md:mt-12 md:text-lg"
        >
          Direction artistique, marques et expériences numériques pensées avec
          l&apos;IA comme partenaire créatif.
        </motion.p>

        {/* Scroll cue */}
        <motion.a
          href="#approche"
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 2.3 }}
          className="group absolute bottom-12 left-1/2 -translate-x-1/2 inline-flex flex-col items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-cyan-200/55 transition-colors duration-300 hover:text-cyan-100"
          aria-label="Découvrir l'approche Speetch"
        >
          <span>Découvrir</span>
          <motion.span
            className="inline-block h-8 w-px bg-current"
            animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: EASE_OUT_EXPO }}
          />
        </motion.a>
      </div>
    </section>
  );
}
