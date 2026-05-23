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

type Node = { x: number; y: number; r: number; orbit: 0 | 1 };
type Edge = { from: number; to: number };

const SIZE = 600;
const CX = SIZE / 2;
const CY = SIZE / 2;

/** Place N nœuds régulièrement sur un cercle, avec un offset angulaire. */
function placeRing(count: number, radius: number, offsetDeg = 0, orbit: 0 | 1 = 0): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    const a = ((i / count) * 360 + offsetDeg) * (Math.PI / 180);
    nodes.push({
      x: CX + Math.cos(a) * radius,
      y: CY + Math.sin(a) * radius,
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
  ambientOn,
  mouse,
  viewport,
}: {
  loaded: boolean;
  ambientOn: boolean;
  mouse: { x: number; y: number };
  viewport: { w: number; h: number };
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

  // Stabilise un set d'edges "scintillantes" qui change toutes les ~2.5s
  // → effet réseau neural qui s'allume par à-coups (plus marqué si ambient ON)
  const [activeEdges, setActiveEdges] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!loaded) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const pick = () => {
      const count = ambientOn ? 6 : 3;
      const next = new Set<number>();
      while (next.size < count) {
        next.add(Math.floor(Math.random() * edges.length));
      }
      setActiveEdges(next);
    };
    pick();
    const intervalMs = ambientOn ? 1100 : 2200;
    const id = window.setInterval(pick, intervalMs);
    return () => window.clearInterval(id);
  }, [edges.length, loaded, ambientOn]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center overflow-hidden"
      style={{
        opacity: loaded ? 1 : 0,
        transition: "opacity 2400ms cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: "700ms",
        perspective: "1200px",
      }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="speetch-orb h-auto w-[min(92vw,720px)]"
        style={{
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition:
            "transform 800ms cubic-bezier(0.22, 1, 0.36, 1)",
          transformStyle: "preserve-3d",
          willChange: "transform",
          filter: "drop-shadow(0 0 60px rgba(125, 211, 252, 0.18))",
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

        {/* Aura radiale au centre */}
        <circle cx={CX} cy={CY} r="220" fill="url(#orb-core-glow)" />

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
            const x1 = CX + Math.cos(a) * 282;
            const y1 = CY + Math.sin(a) * 282;
            const x2 = CX + Math.cos(a) * 292;
            const y2 = CY + Math.sin(a) * 292;
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
                cx={CX + Math.cos(a) * 245}
                cy={CY + Math.sin(a) * 245}
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
          {/* Nœuds */}
          {nodes.map((n, i) => (
            <g key={`n-${i}`}>
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
            </g>
          ))}
        </g>

        {/* ──────────────── 4. Kyber crystal central ──────────────── */}
        {/* Hexagramme 1 (triangle pointe haut) — rotation CW */}
        <g
          className={
            ambientOn
              ? "speetch-orb-rot-cw-fast speetch-orb-pulse-strong"
              : "speetch-orb-rot-cw-fast"
          }
          style={{ transformOrigin: `${CX}px ${CY}px` }}
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
          className={
            ambientOn
              ? "speetch-orb-rot-ccw-fast speetch-orb-pulse-strong"
              : "speetch-orb-rot-ccw-fast"
          }
          style={{ transformOrigin: `${CX}px ${CY}px` }}
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

        {/* Noyau central pulsant */}
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
      </svg>

      <style>{`
        @keyframes speetch-orb-rot-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes speetch-orb-rot-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }

        .speetch-orb-rot-cw-fast    { animation: speetch-orb-rot-cw  18s linear infinite; }
        .speetch-orb-rot-ccw-fast   { animation: speetch-orb-rot-ccw 22s linear infinite; }
        .speetch-orb-rot-cw-medium  { animation: speetch-orb-rot-cw  46s linear infinite; }
        .speetch-orb-rot-ccw-slow   { animation: speetch-orb-rot-ccw 72s linear infinite; }
        .speetch-orb-net            { animation: speetch-orb-rot-cw  120s linear infinite; }

        @keyframes speetch-orb-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%      { transform: scale(1.6); opacity: 1;   }
        }
        .speetch-orb-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: speetch-orb-pulse 3.2s ease-in-out infinite;
        }
        @keyframes speetch-orb-pulse-strong {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(125, 211, 252, 0.6)); }
          50%      { filter: drop-shadow(0 0 18px rgba(186, 230, 253, 1));   }
        }
        .speetch-orb-pulse-strong {
          animation-name: speetch-orb-pulse-strong;
          animation-duration: 1.8s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
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
