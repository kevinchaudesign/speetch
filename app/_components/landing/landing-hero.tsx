"use client";

/**
 * Hero landing — composition cinématique FWA-grade.
 *
 * Architecture :
 *  - Preloader 0→100 (cubic-out, ~2.4s) qui se fade en blur
 *  - Orbe holographique central (cf. <HeroOrb>) avec labels skills IA
 *    orbitants, scintillement réseau, kyber crystal contrarotatif
 *  - H1 éditorial 1 ligne « Direction artistique × IA » magnétique
 *    au curseur, IA en italique jaune brand + chromatic aberration
 *  - Tagline rotative (3 phrases cyclées) + sous-titre serif
 *  - Mots flottants asymétriques en counter-parallaxe
 *  - Marquee vertical droit (credentials)
 *  - Curseur ghost cyan (spring follow)
 *
 * Décor : starfield + scanlines (utilitaires globaux).
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SpeetchLogo } from "../speetch-logo";
import { HeroOrb } from "./hero-orb";

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN_OUT_QUART: [number, number, number, number] = [0.65, 0, 0.35, 1];

const TAGLINES = [
  "Marques · Produits · Plateformes",
  "Image · Voix · Code · Itération",
];

// Segments du H1 — rendus en ligne (inline), pas empilés. « IA » en
// italique jaune + glow brand pour signer la couleur.
const HEADLINE_WORDS = [
  { text: "Direction artistique ×", italic: false },
  { text: " IA", italic: true },
] as const;

/** Tokens du marquee vertical droit — défile en continu. */
const MARQUEE_TOKENS = [
  "Studio Paris",
  "·",
  "Direction artistique",
  "·",
  "Identité de marque",
  "·",
  "Produit & UX",
  "·",
  "Plateformes",
  "·",
  "IA générative",
  "·",
  "Édition 2026",
  "·",
];

/** Mots flottants en arrière-plan (counter-parallaxe). Positions
 *  ratios viewport [0..1] pour rester responsive. */
const FLOATING_LABELS = [
  { text: "MARQUE", x: 0.08, y: 0.18, delay: 1.4, size: 11 },
  { text: "PRODUIT", x: 0.86, y: 0.22, delay: 1.55, size: 10 },
  { text: "VOIX", x: 0.12, y: 0.78, delay: 1.7, size: 10 },
  { text: "CODE", x: 0.84, y: 0.74, delay: 1.85, size: 11 },
  { text: "IMAGE", x: 0.06, y: 0.48, delay: 2.0, size: 10 },
  { text: "ITÉRATION", x: 0.88, y: 0.48, delay: 2.15, size: 9 },
] as const;

export function LandingHero() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewport, setViewport] = useState<{ w: number; h: number }>({
    w: 1,
    h: 1,
  });
  const [taglineIndex, setTaglineIndex] = useState(0);

  /* Initialise et tient à jour les dimensions viewport (SSR-safe). */
  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  /* Curseur — double système :
   *  - `mouse` (state) → ghost cursor + parallaxes (orbe tilt, floating
   *    labels counter-parallaxe). React rerender, acceptable car peu
   *    de listeners abonnés.
   *  - `mouseRef` (ref) → magnétisme des lettres du H1 (lu en raf,
   *    zéro rerender React pour rester à 60fps avec 30+ spans)
   */
  const mouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  /* Boucle raf — applique le magnétisme à chaque lettre du H1.
   * Lit `mouseRef`, calcule la distance cursor → centre de la lettre,
   * applique un displacement inverse-distance via CSS variables (pas de
   * React rerender). Auto-arrêté en cas de prefers-reduced-motion. */
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  useEffect(() => {
    if (!loaded) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;

    const MAX_DISPLACE = 12; // px, displacement max d'une lettre
    const INFLUENCE = 260; // rayon d'influence du curseur en px

    let rafId = 0;
    const tick = () => {
      const { x: mx, y: my } = mouseRef.current;
      for (const el of letterRefs.current) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > INFLUENCE) {
          el.style.setProperty("--mx", "0px");
          el.style.setProperty("--my", "0px");
          el.style.setProperty("--w", "200");
          continue;
        }
        const power = 1 - dist / INFLUENCE; // 0..1
        // Attraction subtile vers le curseur
        const tx = (dx / dist || 0) * power * MAX_DISPLACE;
        const ty = (dy / dist || 0) * power * MAX_DISPLACE;
        // Variable weight 200 → 600 selon proximité
        const w = Math.round(200 + power * 400);
        el.style.setProperty("--mx", `${tx.toFixed(1)}px`);
        el.style.setProperty("--my", `${ty.toFixed(1)}px`);
        el.style.setProperty("--w", String(w));
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [loaded]);

  /* Cycle tagline toutes les 3.6s — start après loaded */
  useEffect(() => {
    if (!loaded) return;
    const id = window.setInterval(
      () => setTaglineIndex((i) => (i + 1) % TAGLINES.length),
      3600,
    );
    return () => window.clearInterval(id);
  }, [loaded]);

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
        </a>
      </motion.header>

      {/* ────── Couche 0 : orbe holographique central (réseau neural) ────── */}
      <HeroOrb loaded={loaded} mouse={mouse} viewport={viewport} />

      {/* ────── Couche 1 : mots flottants asymétriques (counter-parallaxe) ────── */}
      <FloatingLabels loaded={loaded} mouse={mouse} viewport={viewport} />

      {/* ────── Couche 2 : marquee vertical droite — credentials ────── */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 1.4, delay: 1.6, ease: EASE_OUT_EXPO }}
        className="pointer-events-none absolute bottom-20 right-4 top-24 z-10 hidden w-7 overflow-hidden md:block"
        style={{
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      >
        <div
          className="flex flex-col items-center gap-7 whitespace-nowrap text-[10px] uppercase tracking-[0.4em] text-cyan-200/45"
          style={{
            animation: "speetch-marquee-y 38s linear infinite",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
        >
          {MARQUEE_TOKENS.map((t, i) => (
            <span key={`${t}-${i}`}>{t}</span>
          ))}
          {/* Boucle : duplicate pour scroll infini */}
          {MARQUEE_TOKENS.map((t, i) => (
            <span key={`${t}-loop-${i}`}>{t}</span>
          ))}
        </div>
      </motion.div>

      {/* ────── Composition centrale : H1 éditorial kinétique ──────
          Anchorée en BAS du hero (sous le graphique orb qui occupe la
          partie haute). Ordre : H1 → tagline → sous-titre. Padding
          bottom large pour libérer le scroll cue. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-6 pb-[22vh] md:pb-[24vh]">
        {/* H1 — UNE seule ligne, segments inline. Magnétique au curseur,
            variable weight per letter sur le sans, glow + RGB split sur
            le segment italique « IA ». Lettres animées via CSS variables
            (--mx/--my/--w) pilotées par raf hors React. */}
        <h1
          className="select-none whitespace-nowrap text-center font-sans font-extralight leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(1.5rem, 5.4vw, 4.5rem)" }}
        >
          <span className="block overflow-hidden py-[0.05em]">
            {HEADLINE_WORDS.map((w, segIdx) => (
              <KineticLine
                key={w.text}
                text={w.text}
                italic={w.italic}
                lineIndex={segIdx}
                loaded={loaded}
                letterRefs={letterRefs}
              />
            ))}
          </span>
        </h1>

        {/* Tagline rotating — sous le titre, 11px caps cyan */}
        <div className="relative mt-2 flex h-7 items-center md:mt-3">
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

      {/* Keyframes pour le marquee vertical + chromatic pulse audio-react.
          Pas dans globals.css : usage strictement local au hero, mieux
          de garder la définition à côté de l'usage. */}
      <style>{`
        @keyframes speetch-marquee-y {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        /* Chromatic aberration jaune (brand) + halo cyan (logo ara
           bleu+jaune). Offset gauche = cyan, offset droit = gold,
           glow doré central. */
        .speetch-rgb-static {
          text-shadow:
            -1px 0 0 rgba(56, 189, 248, 0.5),
            1px 0 0 rgba(253, 224, 71, 0.6),
            0 0 22px rgba(250, 204, 21, 0.38),
            0 0 56px rgba(250, 204, 21, 0.15);
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Sub-components
 * ─────────────────────────────────────────────────────────────────── */

/** Une ligne du H1 — split en lettres individuelles, chaque lettre
 *  reçoit une ref enregistrée dans `letterRefs` pour le magnétisme,
 *  et est animée en stagger reveal. Le segment italique (italic = true)
 *  porte un effet de chromatic aberration RGB statique (cyan / gold). */
function KineticLine({
  text,
  italic,
  lineIndex,
  loaded,
  letterRefs,
}: {
  text: string;
  italic: boolean;
  lineIndex: number;
  loaded: boolean;
  letterRefs: React.MutableRefObject<Array<HTMLSpanElement | null>>;
}) {
  // Calcule un offset global stable pour les refs (cumule les lignes
  // précédentes — chaque KineticLine connaît son numéro de ligne).
  const baseIndex = HEADLINE_WORDS.slice(0, lineIndex).reduce(
    (s, w) => s + w.text.length,
    0,
  );

  return (
    <span
      className={
        italic
          ? "inline-block font-serif italic font-normal speetch-rgb-static"
          : "inline-block"
      }
      style={
        italic
          ? { color: "var(--color-brand-yellow)" }
          : undefined
      }
    >
        {Array.from(text).map((ch, i) => {
          const refIndex = baseIndex + i;
          const isSpace = ch === " ";
          return (
            <motion.span
              key={`${ch}-${i}`}
              ref={(el) => {
                letterRefs.current[refIndex] = el;
              }}
              initial={{ y: "110%" }}
              animate={{ y: loaded ? "0%" : "110%" }}
              transition={{
                duration: 1.1,
                delay: 0.58 + lineIndex * 0.16 + i * 0.018,
                ease: EASE_OUT_EXPO,
              }}
              className="inline-block"
              style={{
                // CSS variables alimentées par la raf loop (magnétisme).
                // Fallback `0px` / `200` si la loop n'a pas encore tourné
                // ou si reduced-motion / coarse pointer.
                transform: "translate(var(--mx, 0px), var(--my, 0px))",
                fontVariationSettings: !italic
                  ? "'wght' var(--w, 200)"
                  : undefined,
                fontWeight: !italic ? "var(--w, 200)" : undefined,
                transition:
                  "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), font-weight 240ms ease-out",
                willChange: "transform, font-weight",
                whiteSpace: isSpace ? "pre" : undefined,
              }}
            >
              {ch}
            </motion.span>
          );
        })}
    </span>
  );
}

/** Mots flottants en arrière-plan (counter-parallaxe au curseur).
 *  Positionnés en ratios viewport, drift continu via framer + nudge
 *  inverse de la souris pour donner une profondeur. */
function FloatingLabels({
  loaded,
  mouse,
  viewport,
}: {
  loaded: boolean;
  mouse: { x: number; y: number };
  viewport: { w: number; h: number };
}) {
  // Counter-parallaxe : amplitude max 18px, inverse de la position curseur
  const offsetX = -((mouse.x / viewport.w) * 18 - 9);
  const offsetY = -((mouse.y / viewport.h) * 18 - 9);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 hidden md:block"
      style={{
        transform: `translate3d(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px, 0)`,
        transition: "transform 600ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
      }}
    >
      {FLOATING_LABELS.map((l) => (
        <motion.span
          key={l.text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: loaded ? 0.32 : 0, y: loaded ? 0 : 8 }}
          transition={{
            duration: 1.4,
            delay: l.delay,
            ease: EASE_OUT_EXPO,
          }}
          className="absolute font-mono uppercase tracking-[0.4em] text-cyan-200/40"
          style={{
            left: `${l.x * 100}%`,
            top: `${l.y * 100}%`,
            fontSize: `${l.size}px`,
            transform: "translate(-50%, -50%)",
            textShadow: "0 0 12px rgba(125, 211, 252, 0.25)",
          }}
        >
          {l.text}
        </motion.span>
      ))}
    </div>
  );
}
