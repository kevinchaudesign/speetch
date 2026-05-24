"use client";

/**
 * <HeroOrb> — graphique central du hero, pure SVG.
 *
 * Composition (de l'extérieur vers le centre) :
 *  1. Ondes sonar : 3 cercles qui se propagent en boucle (scale + fade)
 *  2. Anneaux orbitaux : 3 cercles concentriques rotatant à des vitesses
 *     et sens différents, avec ticks réguliers en marge
 *  3. Réseau neural : 16 nœuds répartis sur 2 orbites + connections
 *     filaires aléatoires entre nœuds voisins
 *  4. Kyber crystal central : 2 hexagrammes contrarotatifs + un noyau
 *     pulsant
 *
 * Audio-réactif : quand ambient ON, le noyau pulse 2× plus fort + les
 * connections du réseau scintillent par à-coups.
 *
 * Mouse-aware : l'ensemble se tilte légèrement (±8°) selon la position
 * du curseur — donne une sensation de profondeur 3D sans WebGL.
 *
 * Reduced-motion : tout est immobile (cf. media query CSS).
 */

import { useEffect, useMemo, useState } from "react";
import type { Skill } from "@/lib/skills";

type Node = { x: number; y: number; r: number; orbit: 0 | 1 };
type Edge = { from: number; to: number };

const SIZE = 600;
const CX = SIZE / 2;
const CY = SIZE / 2;

/* Les labels et leurs métadonnées vivent dans lib/skills.ts (source
   de vérité partagée avec le panneau de description). Ici on lit
   juste SKILLS[i].label pour l'affichage. */

/** Arrondi à 3 décimales — évite les mismatchs d'hydratation : Math.cos
 *  et Math.sin peuvent renvoyer des floats légèrement différents entre
 *  Node (SSR) et le moteur du navigateur. En arrondissant à la source,
 *  server et client produisent strictement la même chaîne pour les
 *  attributs SVG. */
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Place N nœuds régulièrement sur un cercle, avec un offset angulaire. */
function placeRing(count: number, radius: number, offsetDeg = 0, orbit: 0 | 1 = 0): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    const a = ((i / count) * 360 + offsetDeg) * (Math.PI / 180);
    nodes.push({
      x: round3(CX + Math.cos(a) * radius),
      y: round3(CY + Math.sin(a) * radius),
      r: 2.4,
      orbit,
    });
  }
  return nodes;
}

/** Connecte chaque nœud avec son voisin de gauche, son voisin de droite,
 *  et un nœud de l'orbite opposée le plus proche. Garde une trame
 *  graphique cohérente sans devenir un plat de spaghettis. */
function wireNodes(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const add = (a: number, b: number) => {
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(k)) return;
    seen.add(k);
    edges.push({ from: a, to: b });
  };

  // Trie par orbit pour chaîner par orbite
  const byOrbit = [
    nodes.map((n, i) => ({ ...n, i })).filter((n) => n.orbit === 0),
    nodes.map((n, i) => ({ ...n, i })).filter((n) => n.orbit === 1),
  ];

  for (const ring of byOrbit) {
    for (let k = 0; k < ring.length; k++) {
      const a = ring[k].i;
      const b = ring[(k + 1) % ring.length].i;
      add(a, b);
    }
  }

  // Pont entre orbites : chaque nœud de l'orbit 0 → 2 voisins les plus
  // proches de l'orbit 1
  for (const n of byOrbit[0]) {
    const sorted = byOrbit[1]
      .map((m) => ({
        i: m.i,
        d: Math.hypot(m.x - n.x, m.y - n.y),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const s of sorted) add(n.i, s.i);
  }

  return edges;
}

export function HeroOrb({
  loaded,
  mouse,
  viewport,
  onSkillClick,
  active = false,
  skills,
  transitioning = false,
}: {
  loaded: boolean;
  mouse: { x: number; y: number };
  viewport: { w: number; h: number };
  /** Appelé quand un label de skill est cliqué — remonte l'id Skill. */
  onSkillClick?: (skillId: string) => void;
  /** Vrai quand un skill est ouvert dans le panel — l'orbe zoom vers
   *  son centre (scale 4) pour la sensation d'« entrer dedans ». */
  active?: boolean;
  /** Skills à afficher sur l'orbe (16 attendus). Vient du domaine
   *  actif passé par <LandingHero>. */
  skills: readonly Skill[];
  /** Vrai pendant qu'une orbe satellite zoome vers le centre : on
   *  fade out le central pour laisser place au zoom, puis on fade in
   *  avec les nouveaux skills une fois le swap commit côté parent. */
  transitioning?: boolean;
}) {
  // 8 nœuds sur orbite intérieure (r=140) + 8 sur orbite extérieure (r=215)
  const nodes = useMemo<Node[]>(
    () => [
      ...placeRing(8, 140, 0, 0),
      ...placeRing(8, 215, 22.5, 1),
    ],
    [],
  );
  const edges = useMemo<Edge[]>(() => wireNodes(nodes), [nodes]);

  // Tilt 3D doux selon position curseur (CSS variables → transform)
  const tiltX = ((mouse.y / viewport.h) * 16 - 8).toFixed(2);
  const tiltY = (8 - (mouse.x / viewport.w) * 16).toFixed(2);

  // Freeze des animations CSS quand on est zoomé sur un skill — APRÈS
  // que la transition de zoom (transform scale 1→4, ~900ms) ait fini.
  // Pendant la transition, rings/network/sonar continuent à tourner.
  // À la fermeture, on reprend immédiatement pour que le dézoom soit
  // « vivant ». Stoppe aussi les edges scintillants (cf. interval).
  const [frozen, setFrozen] = useState(false);
  useEffect(() => {
    if (active) {
      const id = window.setTimeout(() => setFrozen(true), 900);
      return () => window.clearTimeout(id);
    }
    setFrozen(false);
  }, [active]);

  // Stabilise un set d'edges "scintillantes" qui change toutes les ~2.2s
  // → effet réseau neural qui s'allume par à-coups. Pause quand frozen
  // pour que le zoom skill soit complètement immobile.
  const [activeEdges, setActiveEdges] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!loaded || frozen) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const pick = () => {
      const next = new Set<number>();
      while (next.size < 3) {
        next.add(Math.floor(Math.random() * edges.length));
      }
      setActiveEdges(next);
    };
    pick();
    const id = window.setInterval(pick, 2200);
    return () => window.clearInterval(id);
  }, [edges.length, loaded, frozen]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] flex items-start justify-center overflow-hidden pt-[7vh] md:pt-[10vh]"
      style={{
        opacity: loaded && !transitioning ? 1 : 0,
        // Initial load : fade lent (2400ms) avec delay esthétique.
        // Pendant un swap : symétrie 380/380 sans delay → le fade-in
        // démarre PILE quand le swap se commit, en parallèle du fade-
        // out de l'overlay zoom. Crossfade visuel propre, sans trou.
        transition: !loaded
          ? "opacity 2400ms cubic-bezier(0.22, 1, 0.36, 1) 700ms"
          : transitioning
            ? "opacity 380ms cubic-bezier(0.22, 1, 0.36, 1) 0ms"
            : "opacity 380ms cubic-bezier(0.22, 1, 0.36, 1) 0ms",
        perspective: "1200px",
      }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        overflow="visible"
        className={`speetch-orb h-auto w-[100vw] md:w-[min(78vw,640px)]${frozen ? " speetch-orb-frozen" : ""}`}
        style={{
          // Quand actif : scale 4 vers le centre + glow renforcé →
          // l'orbe sort largement du viewport. L'aura radiale reste
          // visible (sert de fond cyan au SkillPanel), seul le décor
          // (anneaux, réseau, labels, kyber, sonar) fade à opacity 0
          // via le <g.speetch-orb-decor> juste en dessous.
          transform: `scale(${active ? 4 : 1}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition:
            "transform 900ms cubic-bezier(0.22, 1, 0.36, 1), filter 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          transformStyle: "preserve-3d",
          transformOrigin: "center center",
          willChange: "transform, filter",
          filter: active
            ? "drop-shadow(0 0 120px rgba(125, 211, 252, 0.4))"
            : "drop-shadow(0 0 60px rgba(125, 211, 252, 0.18))",
        }}
      >
        <defs>
          {/* Gradient radial pour le glow du noyau */}
          <radialGradient id="orb-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0.55)" />
            <stop offset="50%" stopColor="rgba(125, 211, 252, 0.18)" />
            <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
          </radialGradient>

          {/* Filtre glow pour les lignes/nœuds */}
          <filter id="orb-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Filtre glow renforcé pour le noyau */}
          <filter id="orb-glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Aura radiale — TOUJOURS visible, sert de fond cyan au
            SkillPanel quand l'orbe est zoomée. À scale 4, le gradient
            (440px) couvre la majorité du viewport (1760px) → backdrop
            cohérent au lieu d'un fond noir/starfield. */}
        <circle cx={CX} cy={CY} r="220" fill="url(#orb-core-glow)" />

        {/* Décor — anneaux, réseau, kyber, sonar, labels. Fade à
            opacity 0 pendant les 400 dernières ms du zoom (delay 500ms,
            duration 400ms → fin pile au scale-up done à 900ms). Au
            close, fade-in 500ms sans delay pendant le dézoom. */}
        <g
          className="speetch-orb-decor"
          style={{
            opacity: active ? 0 : 1,
            transition: active
              ? "opacity 400ms cubic-bezier(0.22, 1, 0.36, 1) 500ms"
              : "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1) 0ms",
            willChange: "opacity",
          }}
        >
        {/* ──────────────── 1. Ondes sonar ──────────────── */}
        {[0, 1, 2].map((i) => (
          <circle
            key={`sonar-${i}`}
            cx={CX}
            cy={CY}
            r="40"
            fill="none"
            stroke="rgba(125, 211, 252, 0.5)"
            strokeWidth="1"
            className="speetch-orb-sonar"
            style={{ animationDelay: `${i * 1.4}s` }}
          />
        ))}

        {/* ──────────────── 2. Anneaux orbitaux ──────────────── */}
        {/* Anneau extérieur — rotation lente CCW */}
        <g
          className="speetch-orb-rot-ccw-slow"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <circle
            cx={CX}
            cy={CY}
            r="280"
            fill="none"
            stroke="rgba(125, 211, 252, 0.16)"
            strokeWidth="1"
            strokeDasharray="2 8"
          />
          {/* Ticks réguliers */}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const x1 = round3(CX + Math.cos(a) * 282);
            const y1 = round3(CY + Math.sin(a) * 282);
            const x2 = round3(CX + Math.cos(a) * 292);
            const y2 = round3(CY + Math.sin(a) * 292);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(125, 211, 252, 0.35)"
                strokeWidth="0.8"
              />
            );
          })}
        </g>

        {/* Anneau médian — rotation moyenne CW */}
        <g
          className="speetch-orb-rot-cw-medium"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <circle
            cx={CX}
            cy={CY}
            r="245"
            fill="none"
            stroke="rgba(125, 211, 252, 0.22)"
            strokeWidth="1.2"
          />
          {/* 4 marqueurs angulaires plus marqués */}
          {[0, 90, 180, 270].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={round3(CX + Math.cos(a) * 245)}
                cy={round3(CY + Math.sin(a) * 245)}
                r="3"
                fill="rgb(125, 211, 252)"
                filter="url(#orb-glow)"
              />
            );
          })}
        </g>

        {/* Anneau intérieur — rotation rapide CCW, pointillé */}
        <g
          className="speetch-orb-rot-ccw-fast"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <circle
            cx={CX}
            cy={CY}
            r="100"
            fill="none"
            stroke="rgba(125, 211, 252, 0.35)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        </g>

        {/* ──────────────── 3. Réseau neural (orbites de nœuds) ──────────────── */}
        <g className="speetch-orb-net" style={{ transformOrigin: `${CX}px ${CY}px` }}>
          {/* Connections */}
          {edges.map((e, i) => {
            const a = nodes[e.from];
            const b = nodes[e.to];
            const isActive = activeEdges.has(i);
            return (
              <line
                key={`e-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={
                  isActive
                    ? "rgba(186, 230, 253, 0.85)"
                    : "rgba(125, 211, 252, 0.16)"
                }
                strokeWidth={isActive ? 1.2 : 0.8}
                filter={isActive ? "url(#orb-glow)" : undefined}
                style={{ transition: "stroke 700ms ease-out, stroke-width 700ms ease-out" }}
              />
            );
          })}
          {/* Nœuds — cliquables avec le même handler que le label
              adjacent. Hit area = un cercle posé sur le MIDPOINT
              noeud↔label, dimensionné pour englober les deux. onClick
              directement sur le <circle> (même pattern que les <text>
              labels qui marchent) plutôt que via bubbling depuis le
              <g>, plus fiable sur tous les navigateurs. */}
          {nodes.map((n, i) => {
            const skill = skills[i];
            // Calcul du midpoint noeud↔label (même que la boucle labels)
            const dx = n.x - CX;
            const dy = n.y - CY;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const labelOffset = n.orbit === 0 ? 30 : 37;
            const lx = n.x + ux * labelOffset;
            const ly = n.y + uy * labelOffset;
            const midX = (n.x + lx) / 2;
            const midY = (n.y + ly) / 2;
            // Rayon : couvre noeud + label + ~22px de marge typo
            const hitR = labelOffset / 2 + 22;
            return (
              <g
                key={`n-${i}`}
                className={skill ? "speetch-orb-skill-group" : undefined}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r + 2.5}
                  fill="rgba(125, 211, 252, 0.15)"
                />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill="rgb(186, 230, 253)"
                  filter="url(#orb-glow)"
                />
                {skill && (
                  <circle
                    cx={midX}
                    cy={midY}
                    r={hitR}
                    // Légèrement teinté (alpha 0.001) pour être
                    // « painted » sans être visible — évite les coins
                    // navigateur où fill="transparent" + visiblePainted
                    // ne capture pas le clic.
                    fill="rgba(125, 211, 252, 0.001)"
                    onClick={() => onSkillClick?.(skill.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Découvrir ${skill.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSkillClick?.(skill.id);
                      }
                    }}
                    style={{
                      cursor: "pointer",
                      pointerEvents: "all",
                      outline: "none",
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* Labels skills IA — orbitent AVEC les nœuds (sont dans
              `.speetch-orb-net` qui tourne CW 120s). Chaque <text> a sa
              propre contre-rotation CCW 120s pivotée sur SON centre bbox
              → annule la rotation parent → reste lisible à l'horizontale.
              CLIQUABLES : pointer-events:auto surclasse le pointer-events:
              none du wrapper parent, le clic remonte onSkillClick(id). */}
          {nodes.map((n, i) => {
            const skill = skills[i];
            if (!skill) return null;
            const dx = n.x - CX;
            const dy = n.y - CY;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const offset = n.orbit === 0 ? 30 : 37;
            const lx = n.x + ux * offset;
            const ly = n.y + uy * offset;
            const fontSizeCss =
              n.orbit === 0
                ? "clamp(0.7rem, 1.7vw, 0.8rem)"
                : "clamp(0.78rem, 1.95vw, 0.92rem)";
            return (
              <text
                key={`label-${i}`}
                x={lx.toFixed(2)}
                y={ly.toFixed(2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(186, 230, 253, 0.82)"
                fontFamily="ui-monospace, SF Mono, Menlo, monospace"
                letterSpacing="0.22em"
                className="speetch-orb-label-counter speetch-orb-label-clickable"
                onClick={() => onSkillClick?.(skill.id)}
                role="button"
                aria-label={`Découvrir ${skill.title}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSkillClick?.(skill.id);
                  }
                }}
                style={{
                  fontSize: fontSizeCss,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  filter: "drop-shadow(0 0 5px rgba(125, 211, 252, 0.55))",
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
              >
                {skill.label}
              </text>
            );
          })}
        </g>

        {/* ──────────────── 4. Kyber crystal central ──────────────── */}
        {/* Hexagramme 1 (triangle pointe haut) — rotation CW */}
        <g
          className="speetch-orb-rot-cw-fast"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            opacity: active ? 0 : 1,
            transition: "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <polygon
            points={triPoints(CX, CY, 56, -90)}
            fill="none"
            stroke="rgba(186, 230, 253, 0.85)"
            strokeWidth="1.4"
            strokeLinejoin="round"
            filter="url(#orb-glow-strong)"
          />
        </g>

        {/* Hexagramme 2 (triangle pointe bas) — rotation CCW */}
        <g
          className="speetch-orb-rot-ccw-fast"
          style={{
            transformOrigin: `${CX}px ${CY}px`,
            opacity: active ? 0 : 1,
            transition: "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <polygon
            points={triPoints(CX, CY, 56, 90)}
            fill="none"
            stroke="rgba(186, 230, 253, 0.85)"
            strokeWidth="1.4"
            strokeLinejoin="round"
            filter="url(#orb-glow-strong)"
          />
        </g>

        {/* Noyau central pulsant — disparaît au zoom pour ne pas
            apparaître autour de la description. */}
        <g
          style={{
            opacity: active ? 0 : 1,
            transition: "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <circle
            cx={CX}
            cy={CY}
            r="10"
            fill="rgba(125, 211, 252, 0.2)"
            className="speetch-orb-pulse"
          />
          <circle
            cx={CX}
            cy={CY}
            r="4"
            fill="rgb(186, 230, 253)"
            filter="url(#orb-glow-strong)"
          />
        </g>
        </g>{/* /.speetch-orb-decor */}
      </svg>

      <style>{`
        @keyframes speetch-orb-rot-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes speetch-orb-rot-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }

        .speetch-orb-rot-cw-fast    { animation: speetch-orb-rot-cw  18s linear infinite; }
        .speetch-orb-rot-ccw-fast   { animation: speetch-orb-rot-ccw 22s linear infinite; }
        .speetch-orb-rot-cw-medium  { animation: speetch-orb-rot-cw  46s linear infinite; }
        .speetch-orb-rot-ccw-slow   { animation: speetch-orb-rot-ccw 72s linear infinite; }
        .speetch-orb-net            { animation: speetch-orb-rot-cw  120s linear infinite; }

        /* Counter-rotation des labels — annule exactement la rotation du
           parent .speetch-orb-net (même durée 120s, sens inverse).
           Pivot fixé sur le bbox de chaque texte via inline
           transformBox: fill-box + transformOrigin: center → chaque
           label tourne sur SON centre propre (pas autour de l origine
           du SVG) → reste à l horizontale. */
        .speetch-orb-label-counter {
          animation: speetch-orb-rot-ccw 120s linear infinite;
        }
        /* Hover/focus state des labels cliquables — éclat plus vif +
           texte plus lumineux, transition douce. */
        .speetch-orb-label-clickable {
          transition: fill 200ms ease-out, filter 200ms ease-out;
          outline: none;
        }
        .speetch-orb-label-clickable:hover,
        .speetch-orb-label-clickable:focus-visible {
          fill: rgba(253, 224, 71, 0.98) !important;
          filter: drop-shadow(0 0 8px rgba(253, 224, 71, 0.9)) drop-shadow(0 0 16px rgba(250, 204, 21, 0.5)) !important;
        }

        /* Skill group (noeud + halo + hit area) cliquable. Hover sur
           n'importe quel descendant déclenche le drop-shadow cyan
           plus vif sur le <g> entier → rejaillit uniquement sur les
           cercles VISIBLES (halo + point). La hit area est quasi-
           transparente donc reste invisible. focus-within pour le
           clavier. */
        .speetch-orb-skill-group {
          transition: filter 200ms ease-out;
        }
        .speetch-orb-skill-group:hover,
        .speetch-orb-skill-group:focus-within {
          filter: drop-shadow(0 0 8px rgba(186, 230, 253, 0.95))
                  drop-shadow(0 0 18px rgba(125, 211, 252, 0.5));
        }

        @keyframes speetch-orb-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%      { transform: scale(1.6); opacity: 1;   }
        }
        .speetch-orb-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: speetch-orb-pulse 3.2s ease-in-out infinite;
        }
        @keyframes speetch-orb-sonar {
          0%   { transform: scale(0.4); opacity: 0.7; }
          80%  { opacity: 0; }
          100% { transform: scale(6);   opacity: 0; }
        }
        .speetch-orb-sonar {
          transform-box: fill-box;
          transform-origin: center;
          animation: speetch-orb-sonar 4.2s ease-out infinite;
        }

        /* Mode « frozen » — activé 900ms après que l'orbe entre en
           mode skill zoom (cf. useEffect frozen côté React, après que
           le scale 1→4 ait fini). Met en pause TOUTES les animations
           internes : anneaux, réseau neural, labels counter-rotation,
           kyber, sonar, pulse du noyau. Le panneau de description se
           pose alors sur une composition immobile, plus lisible. */
        .speetch-orb-frozen .speetch-orb-rot-cw-fast,
        .speetch-orb-frozen .speetch-orb-rot-ccw-fast,
        .speetch-orb-frozen .speetch-orb-rot-cw-medium,
        .speetch-orb-frozen .speetch-orb-rot-ccw-slow,
        .speetch-orb-frozen .speetch-orb-net,
        .speetch-orb-frozen .speetch-orb-label-counter,
        .speetch-orb-frozen .speetch-orb-pulse,
        .speetch-orb-frozen .speetch-orb-sonar {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .speetch-orb * {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/** Génère 3 points d'un triangle équilatéral centré (cx,cy), de "rayon"
 *  donné, avec un angle de départ en degrés (-90 = pointe haut). */
function triPoints(cx: number, cy: number, r: number, startDeg: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const a = ((startDeg + i * 120) * Math.PI) / 180;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(" ");
}
