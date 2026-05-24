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
import { HeroOrb } from "./hero-orb";
import { SatelliteOrb, SatelliteVisual } from "./satellite-orb";
import { SkillPanel } from "./skill-panel";
import {
  DOMAINS,
  findSkillContext,
  getDomain,
  type Domain,
} from "@/lib/domains";

/* Timeline transition zoom satellite → central (en ms) :
 *  - 0       : clic — overlay zoom mount à startRect, central fade-out
 *  - SWAP_AT : central à opacity 0, on commit activeDomainId, central
 *              refait fade-in IMMÉDIATEMENT avec les nouveaux skills.
 *              L'overlay continue son transform et commence à fade-out
 *              → crossfade visuel entre overlay et nouveau central.
 *  - END_AT  : unmount overlay (déjà à opacity 0 depuis ~80ms).
 *  Symétrie 380/380 → pas de « trou » d'invisibilité perceptible. */
const ZOOM_SWAP_AT = 380;
const ZOOM_END_AT = 760;

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EASE_IN_OUT_QUART: [number, number, number, number] = [0.65, 0, 0.35, 1];

/** Positions cosmiques fixes des 4 orbes satellites.
 *  Taille et flou variables = depth of field (plus petit + plus flou
 *  = plus loin). Les satellites mirroient l'aspect du central (cf.
 *  <SatelliteVisual>), seule la profondeur change.
 *  Évite H1 top-left, scroll bottom-center, contact bottom-right. */
const SATELLITE_LAYOUT: ReadonlyArray<{
  size: number;
  blur: number;
  position: React.CSSProperties;
}> = [
  // top-right — moyenne distance, flou modéré
  { size: 210, blur: 1.4, position: { top: "8vh", right: "4vw" } },
  // mid-left — la plus proche, presque nette
  { size: 250, blur: 0.4, position: { top: "40vh", left: "3vw" } },
  // mid-right — distance moyenne
  { size: 220, blur: 0.9, position: { top: "44vh", right: "3vw" } },
  // bottom-left — la plus lointaine, très floue
  { size: 175, blur: 2.4, position: { bottom: "12vh", left: "5vw" } },
];

/** Layout mobile (< md = 768px) — l'orbe central occupe 100vw donc
 *  il ne reste pas de place sur les côtés. Les 4 satellites s'alignent
 *  en une rangée horizontale SOUS le H1 (lui-même posé sous l'orbe).
 *  Le `top` est calculé depuis le bord bas de l'orbe (pt-[7vh] +
 *  100vw) + hauteur réservée au H1 (~60px). Tailles asymétriques pour
 *  garder la sensation de profondeur. */
const MOBILE_SATELLITE_TOP = "calc(7vh + 100vw + 60px)";
const SATELLITE_LAYOUT_MOBILE: ReadonlyArray<{
  size: number;
  blur: number;
  position: React.CSSProperties;
}> = [
  { size: 70, blur: 0.6, position: { top: MOBILE_SATELLITE_TOP, left: "4vw" } },
  { size: 90, blur: 0.3, position: { top: MOBILE_SATELLITE_TOP, left: "25vw" } },
  { size: 82, blur: 0.45, position: { top: MOBILE_SATELLITE_TOP, right: "25vw" } },
  { size: 65, blur: 0.7, position: { top: MOBILE_SATELLITE_TOP, right: "4vw" } },
];

// Segments du H1 — rendus en ligne (inline), pas empilés. « IA » en
// italique jaune + glow brand pour signer la couleur.
type HeadlineSegment = { text: string; italic: boolean };

/** Construit le H1 à partir du label du domaine actif :
 *  « {label} × IA » avec « × IA » en italique jaune brand.
 *  Mis à jour à chaque swap de domaine via la constellation. */
function buildHeadlineWords(activeLabel: string): HeadlineSegment[] {
  return [
    { text: `${activeLabel} ×`, italic: false },
    { text: " IA", italic: true },
  ];
}

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

export function LandingHero() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mouse, setMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewport, setViewport] = useState<{ w: number; h: number }>({
    w: 1,
    h: 1,
  });
  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);
  const activeSkillCtx = activeSkillId ? findSkillContext(activeSkillId) : null;
  const activeSkill = activeSkillCtx?.skill ?? null;
  const activeSkillDomain = activeSkillCtx?.domain ?? null;
  const [activeDomainId, setActiveDomainId] = useState<string>("ia");
  const activeDomain = getDomain(activeDomainId) ?? DOMAINS[0];
  const satelliteDomains = DOMAINS.filter((d) => d.id !== activeDomainId);
  const headlineWords = buildHeadlineWords(activeDomain.label);

  /* Zoom satellite → central : pendant la transition, on rend un
   * overlay <ZoomingOrb> ancré au rect de la satellite cliquée, puis
   * animé vers le centre. Le central fade out (centralHidden=true),
   * puis au SWAP_AT on commit activeDomainId + relâche centralHidden
   * pour que le central refasse fade-in avec les nouveaux skills. */
  const [zoom, setZoom] = useState<{
    domain: Domain;
    startRect: DOMRect;
    startBlur: number;
  } | null>(null);
  const [centralHidden, setCentralHidden] = useState(false);
  const zoomTimersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const id of zoomTimersRef.current) window.clearTimeout(id);
      zoomTimersRef.current = [];
    };
  }, []);

  function handleSatelliteClick(id: string, rect: DOMRect, blur: number) {
    if (zoom) return; // ignore les clics doubles pendant transition
    const domain = getDomain(id);
    if (!domain) return;
    setZoom({ domain, startRect: rect, startBlur: blur });
    setCentralHidden(true);
    zoomTimersRef.current.push(
      window.setTimeout(() => {
        setActiveDomainId(id);
        setCentralHidden(false);
      }, ZOOM_SWAP_AT),
    );
    zoomTimersRef.current.push(
      window.setTimeout(() => setZoom(null), ZOOM_END_AT),
    );
  }

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

  /* Curseur — alimente le ghost cursor (mix-blend-difference) + le
   * tilt 3D de l'orbe central via `mouse` state. Le magnétisme par
   * lettre du H1 (translate + variable font-weight) a été retiré. */
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    const onMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

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

      {/* Preloader cinématique — centré écran, sans texte. Juste le
          compteur numérique 000→100 + la barre de progression cyan. */}
      <AnimatePresence mode="wait">
        {!loaded && (
          <motion.div
            key="loader"
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.7, ease: EASE_IN_OUT_QUART }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black px-6 md:gap-8"
            role="status"
            aria-live="polite"
            aria-label={`Chargement ${progress}%`}
          >
            <span className="font-sans text-7xl font-light leading-none tabular-nums md:text-9xl">
              {String(progress).padStart(3, "0")}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────── Wordmark Speetch — top-left ──────
          Logo texte de la marque. Reste discret mais identifie le site
          en permanence. Fade out pendant le zoom skill / le swap de
          domaine pour ne pas concurrencer le panel ou le H1 dynamique. */}
      <motion.a
        href="#top"
        initial={{ opacity: 0, y: -8 }}
        animate={{
          opacity: loaded && !activeSkillId && !centralHidden ? 1 : 0,
          y: 0,
        }}
        transition={{ duration: 0.7, delay: 0.4, ease: EASE_OUT_EXPO }}
        aria-label="Speetch — retour en haut"
        className="group absolute left-6 top-[2vh] z-20 select-none font-sans font-light tracking-tight text-[#F5F5F7] transition-colors duration-300 hover:text-cyan-100 md:left-10 md:top-[2.5vh]"
        style={{
          fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
          textShadow:
            "0 0 14px rgba(125, 211, 252, 0.4), 0 0 36px rgba(125, 211, 252, 0.18)",
        }}
      >
        Speetch
        <span
          aria-hidden
          className="ml-0.5 inline-block text-cyan-200/85 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            textShadow: "0 0 10px rgba(125, 211, 252, 0.85)",
          }}
        >
          .
        </span>
      </motion.a>

      {/* ────── Couche 0 : orbe holographique central (domaine actif) ────── */}
      <HeroOrb
        loaded={loaded}
        mouse={mouse}
        viewport={viewport}
        onSkillClick={setActiveSkillId}
        active={!!activeSkillId}
        skills={activeDomain.skills}
        transitioning={centralHidden}
      />

      {/* ────── Couche 0.5 : 4 orbes satellites (autres domaines) ──────
          Desktop : positionnées dans les coins libres autour de l'orbe.
          Mobile : 4 satellites compacts en arc sous l'orbe (l'orbe
          occupe 100vw, plus de place sur les côtés). Cachées si un
          skill est ouvert. */}
      <div
        aria-label="Constellation des domaines Speetch"
        className="pointer-events-none absolute inset-0 z-[8]"
        style={{
          opacity: loaded && !activeSkillId ? 1 : 0,
          transition:
            "opacity 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          transitionDelay: activeSkillId ? "0ms" : "1400ms",
        }}
      >
        {/* Pas de div pointer-events-auto qui couvre inset-0 ici :
            ça interceptait TOUS les clics et masquait les labels de
            skills sur l'orbe centrale derrière (z-5). Les
            <SatelliteOrb> activent eux-mêmes pointer-events: auto sur
            leur <button>, donc seuls les boutons captent les clics.
            Le layout est choisi selon viewport.w (md = 768px). */}
        {satelliteDomains.map((d, i) => {
          const layout =
            viewport.w >= 768
              ? SATELLITE_LAYOUT[i]
              : SATELLITE_LAYOUT_MOBILE[i];
          return (
          <SatelliteOrb
            key={d.id}
            domain={d}
            size={layout.size}
            blur={layout.blur}
            position={layout.position}
            onClick={handleSatelliteClick}
            hidden={zoom?.domain.id === d.id}
            dimmed={zoom !== null && zoom.domain.id !== d.id}
          />
          );
        })}
      </div>

      {/* ────── Overlay de zoom — satellite vers centre ──────
          Rendu fixed-position au-dessus de tout (z-30) ; ancré au
          rect d'origine de la satellite cliquée, anime translate+scale
          vers le centre du viewport en 880ms, fade-out final pendant
          que le central refait fade-in (crossfade propre). */}
      {zoom && (
        <ZoomingOrb
          domain={zoom.domain}
          startRect={zoom.startRect}
          startBlur={zoom.startBlur}
          viewport={viewport}
        />
      )}

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

      {/* ────── Composition H1 éditorial kinétique ──────
          Anchorée en HAUT À GAUCHE du hero. Au zoom skill : s'éloigne
          vers le haut-gauche + fade out. */}
      <div
        className="absolute left-0 right-0 z-20 flex flex-col items-center px-6 md:px-10"
        style={{
          // Mobile : posé juste sous le bord bas de l'orbe central
          // (pt-[7vh] + orb de 100vw + 16px de marge visuelle).
          // Desktop : ancré bas du viewport (bottom-[8vh]), comme avant.
          top: viewport.w >= 768 ? "auto" : "calc(7vh + 100vw + 16px)",
          bottom: viewport.w >= 768 ? "8vh" : "auto",
          // Quand un skill est ouvert (orbe zoomée) ou pendant un swap
          // de domaine, le H1 fade out (et descend légèrement sur skill).
          // Revient avec le nouveau label « {domaine} × IA » au dézoom/swap.
          opacity: activeSkillId || centralHidden ? 0 : 1,
          transform: activeSkillId
            ? "translate(0, 20px)"
            : "translate(0, 0)",
          transition:
            // Symétrie 380/380 sans delay — mêmes timings que <HeroOrb>
            // pour que le H1 fade-in en synchro avec le nouveau central.
            "opacity 380ms cubic-bezier(0.22, 1, 0.36, 1), transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: activeSkillId ? "none" : "auto",
        }}
      >
        {/* H1 — éditorial centré SOUS l'orbe central, sans la chevaucher.
            RGB split jaune/cyan sur « × IA ». La key inclut
            activeDomainId → les DEUX segments remount à chaque swap
            pour que « × IA » re-staggere APRÈS le nouveau label,
            conformément au délai cumulé dans <KineticLine>. */}
        <h1
          className="select-none whitespace-nowrap text-center font-sans font-extralight leading-[0.95] tracking-[-0.04em] text-[#F5F5F7]"
          style={{ fontSize: "clamp(1.1rem, 3.4vw, 2.5rem)" }}
        >
          <span className="block overflow-hidden pt-[0.05em] pb-[0.3em]">
            {headlineWords.map((w, segIdx) => (
              <KineticLine
                key={`${segIdx}-${activeDomainId}`}
                text={w.text}
                italic={w.italic}
                lineIndex={segIdx}
                loaded={loaded}
                allWords={headlineWords}
              />
            ))}
          </span>
        </h1>
      </div>

      {/* ────── Scroll indicator — bottom-center ──────
          Mini glyph « SCROLL » + barre verticale dans laquelle un point
          lumineux descend en boucle. Anchore #approche au clic. Masqué
          quand un skill est ouvert (cohérent avec le H1). */}
      <motion.a
        href="#approche"
        initial={{ opacity: 0 }}
        animate={{
          opacity: loaded && !activeSkillId ? 0.85 : 0,
        }}
        transition={{ duration: 0.8, delay: 1.4, ease: EASE_OUT_EXPO }}
        className="group absolute bottom-4 left-1/2 z-20 inline-flex -translate-x-1/2 flex-col items-center gap-1.5 text-[9px] uppercase tracking-[0.32em] text-cyan-200/55 transition-colors duration-300 hover:text-cyan-100 md:bottom-5"
        aria-label="Faire défiler vers le contenu"
        style={{ pointerEvents: activeSkillId ? "none" : "auto" }}
      >
        <span>Scroll</span>
        <span className="relative inline-block h-4 w-px overflow-hidden bg-cyan-200/20">
          <span
            aria-hidden
            className="absolute left-0 top-0 h-1.5 w-px bg-cyan-200"
            style={{
              animation: "speetch-scroll-indicator 1.8s cubic-bezier(0.65, 0, 0.35, 1) infinite",
              boxShadow: "0 0 6px rgba(125, 211, 252, 0.85)",
            }}
          />
        </span>
      </motion.a>

      {/* Keyframes pour le marquee vertical + chromatic pulse audio-react.
          Pas dans globals.css : usage strictement local au hero, mieux
          de garder la définition à côté de l'usage. */}
      <style>{`
        @keyframes speetch-marquee-y {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        /* Point lumineux qui descend en boucle dans le scroll indicator. */
        @keyframes speetch-scroll-indicator {
          0%   { transform: translateY(-100%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(400%); opacity: 0; }
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

      {/* Modal de description quand une compétence est cliquée —
          reçoit aussi le domaine parent pour afficher le contexte
          workflow Speetch (phase + paragraphe explicatif). */}
      <SkillPanel
        skill={activeSkill}
        domain={activeSkillDomain}
        onClose={() => setActiveSkillId(null)}
      />
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * Sub-components
 * ─────────────────────────────────────────────────────────────────── */

/** Une ligne du H1 — split en lettres individuelles, animées en
 *  stagger reveal (slide-up letter-by-letter). Le segment italique
 *  (italic = true) porte un effet de chromatic aberration RGB
 *  statique (cyan / gold). Plus de déformation curseur ni de
 *  variable font-weight par lettre. */
function KineticLine({
  text,
  italic,
  lineIndex,
  loaded,
  allWords,
}: {
  text: string;
  italic: boolean;
  lineIndex: number;
  loaded: boolean;
  /** Tous les segments du H1 — sert à calculer le délai de base
   *  (les segments suivants attendent que le précédent ait fini). */
  allWords: HeadlineSegment[];
}) {
  // Délai de base de cette ligne — attend que la ligne précédente
  // ait visuellement terminé son stagger reveal avant de démarrer.
  // Calculé depuis la longueur du segment précédent : last-letter-
  // start (length × 0.018s) + visual-settle (~0.4s) + petite pause.
  // Résultat : « × IA » apparaît APRÈS le label de domaine.
  const baseDelaySec = allWords
    .slice(0, lineIndex)
    .reduce(
      (s, w) => s + Math.max(0.5, w.text.length * 0.022 + 0.35),
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
          const isSpace = ch === " ";
          return (
            <motion.span
              key={`${ch}-${i}`}
              initial={{ y: "110%" }}
              animate={{ y: loaded ? "0%" : "110%" }}
              transition={{
                duration: 1.1,
                delay: 0.58 + baseDelaySec + i * 0.018,
                ease: EASE_OUT_EXPO,
              }}
              className="inline-block"
              style={{
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

/** Overlay zoom satellite → centre. Rendu fixed-position au rect
 *  d'origine de la satellite, puis (au prochain frame) bascule sur un
 *  transform translate+scale qui l'amène pile au centre visuel de
 *  l'orbe centrale. Fade-out au dernier tiers pour croiser le
 *  fade-in du central qui réapparaît avec le nouveau domaine. */
function ZoomingOrb({
  domain,
  startRect,
  startBlur,
  viewport,
}: {
  domain: Domain;
  startRect: DOMRect;
  /** Flou initial — repris de la satellite cliquée pour continuité,
   *  puis animé à 0 pendant le zoom (mise au point sur le centre). */
  startBlur: number;
  viewport: { w: number; h: number };
}) {
  const [zoomed, setZoomed] = useState(false);
  const [blur, setBlur] = useState(startBlur);

  useEffect(() => {
    // Force un re-layout entre le mount (à startRect, blur initial) et
    // l'application du transform cible — sinon la transition CSS ne
    // joue pas. Le même frame déclenche la mise au point (blur → 0).
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setZoomed(true);
        setBlur(0);
      }),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  // Centre visuel approximatif de l'orbe centrale.
  // Desktop (≥ md) : pt-[10vh] + orb de min(78vw, 640px).
  // Mobile (< md)  : pt-[7vh] + orb de 100vw (cf. <HeroOrb>).
  const isDesktop = viewport.w >= 768;
  const orbVisualWidth = isDesktop
    ? Math.min(viewport.w * 0.78, 640)
    : viewport.w;
  const orbTopVh = isDesktop ? 0.1 : 0.07;
  const targetCenterX = viewport.w / 2;
  const targetCenterY = viewport.h * orbTopVh + orbVisualWidth / 2;

  // Scale tel que la satellite zoomée occupe à peu près la taille
  // visible de l'orbe centrale (apparence finale ≈ remplace le central).
  const targetScale = orbVisualWidth / Math.max(startRect.width, 1);

  // La boîte du satellite est désormais carrée (label centré sur l'orbe,
  // plus en-dessous) — son centre est simplement le centre du rect.
  const startCenterX = startRect.left + startRect.width / 2;
  const startCenterY = startRect.top + startRect.height / 2;

  const dx = targetCenterX - startCenterX;
  const dy = targetCenterY - startCenterY;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-30"
      style={{
        top: startRect.top,
        left: startRect.left,
        width: startRect.width,
        transform: zoomed
          ? `translate3d(${dx}px, ${dy}px, 0) scale(${targetScale})`
          : "translate3d(0, 0, 0) scale(1)",
        opacity: zoomed ? 0 : 1,
        transformOrigin: "center center",
        // Transform fluide 760ms. Fade-out de l'overlay : démarre PILE
        // au swap (380ms = ZOOM_SWAP_AT) pour croiser le fade-in du
        // nouveau central qui démarre au même instant. 300ms de crossfade.
        transition:
          "transform 760ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms cubic-bezier(0.22, 1, 0.36, 1) 380ms",
        willChange: "transform, opacity",
      }}
    >
      <SatelliteVisual domain={domain} size={startRect.width} blur={blur} />
    </div>
  );
}

