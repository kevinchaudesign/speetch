"use client";

/**
 * <SatelliteOrb> — orbe satellite dans la constellation hero.
 *
 * Aspect visuel = miniature de <HeroOrb> :
 *   - ondes sonar
 *   - 3 anneaux orbitaux (extérieur dashé + ticks, médian + 4 marqueurs,
 *     intérieur dashé rapide)
 *   - réseau neural 16 nœuds (8 inner + 8 outer) + connections
 *   - kyber crystal 2 hexagrammes contrarotatifs
 *   - noyau pulsant
 *
 * Différences avec <HeroOrb> :
 *   - taille plus petite (prop `size`)
 *   - flou variable (`blur`) pour simuler l'éloignement (depth of field)
 *   - pas de skills labels (pas la focale)
 *   - pas de mouse tilt 3D, pas de scintillement audio-réactif
 *   - couleurs cyan identiques au central (continuité visuelle parfaite
 *     lors du zoom-then-swap)
 *
 *  Au clic, remonte (id, DOMRect, blur) à <LandingHero> qui rend un
 *  overlay <ZoomingOrb> animé jusqu'au centre + swap du domaine.
 */

import { useId, useMemo, useRef } from "react";
import type { Domain } from "@/lib/domains";

/* Mêmes constantes que <HeroOrb> pour parité géométrique. */
const SIZE = 600;
const CX = SIZE / 2;
const CY = SIZE / 2;

type Node = { x: number; y: number; r: number; orbit: 0 | 1 };
type Edge = { from: number; to: number };

/** Arrondi à 3 décimales — évite les mismatchs d'hydratation : Math.cos
 *  et Math.sin peuvent renvoyer des floats légèrement différents entre
 *  Node (SSR) et le navigateur. En arrondissant à la source, server et
 *  client produisent strictement la même chaîne pour les attributs SVG. */
const round3 = (n: number) => Math.round(n * 1000) / 1000;

function placeRing(
  count: number,
  radius: number,
  offsetDeg = 0,
  orbit: 0 | 1 = 0,
): Node[] {
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

function wireNodes(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const add = (a: number, b: number) => {
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(k)) return;
    seen.add(k);
    edges.push({ from: a, to: b });
  };

  const byOrbit = [
    nodes.map((n, i) => ({ ...n, i })).filter((n) => n.orbit === 0),
    nodes.map((n, i) => ({ ...n, i })).filter((n) => n.orbit === 1),
  ];

  for (const ring of byOrbit) {
    for (let k = 0; k < ring.length; k++) {
      add(ring[k].i, ring[(k + 1) % ring.length].i);
    }
  }
  for (const n of byOrbit[0]) {
    const sorted = byOrbit[1]
      .map((m) => ({ i: m.i, d: Math.hypot(m.x - n.x, m.y - n.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const s of sorted) add(n.i, s.i);
  }
  return edges;
}

function triPoints(cx: number, cy: number, r: number, startDeg: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const a = ((startDeg + i * 120) * Math.PI) / 180;
    pts.push(
      `${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`,
    );
  }
  return pts.join(" ");
}

/** Visuel pur (SVG + label) — sans <button>, sans positionnement
 *  absolu, sans interaction. Utilisé par <SatelliteOrb> (slot
 *  constellation) ET par <ZoomingOrb> (overlay zoom) pour continuité
 *  visuelle parfaite. */
export function SatelliteVisual({
  domain,
  size,
  blur = 0,
}: {
  domain: Domain;
  /** Taille CSS en px de la boîte (carrée). Détermine la « distance ». */
  size: number;
  /** Flou CSS en px appliqué au SVG — plus grand = plus éloigné. */
  blur?: number;
}) {
  const uid = useId(); // IDs uniques pour defs (filtres / gradients)

  const nodes = useMemo<Node[]>(
    () => [...placeRing(8, 140, 0, 0), ...placeRing(8, 215, 22.5, 1)],
    [],
  );
  const edges = useMemo<Edge[]>(() => wireNodes(nodes), [nodes]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        overflow="visible"
        width={size}
        height={size}
        style={{
          // Halo cyan (parité central) + blur CSS variable (depth of field).
          // Transition longue pour que le zoom puisse animer blur → 0.
          filter: `drop-shadow(0 0 ${size * 0.18}px rgba(125, 211, 252, 0.45)) blur(${blur}px)`,
          transition: "filter 760ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="speetch-satellite"
      >
        <defs>
          <radialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0.55)" />
            <stop offset="50%" stopColor="rgba(125, 211, 252, 0.18)" />
            <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
          </radialGradient>
          <filter
            id={`${uid}-glow`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id={`${uid}-glow-strong`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
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
            className="speetch-sat-sonar"
            style={{ animationDelay: `${i * 1.4}s` }}
          />
        ))}

        {/* Aura radiale au centre */}
        <circle cx={CX} cy={CY} r="220" fill={`url(#${uid}-core)`} />

        {/* ──────────────── 2. Anneaux orbitaux ──────────────── */}
        {/* Anneau extérieur — rotation lente CCW */}
        <g
          className="speetch-sat-rot-ccw-slow"
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
          className="speetch-sat-rot-cw-medium"
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
          {[0, 90, 180, 270].map((deg) => {
            const a = (deg * Math.PI) / 180;
            return (
              <circle
                key={deg}
                cx={round3(CX + Math.cos(a) * 245)}
                cy={round3(CY + Math.sin(a) * 245)}
                r="3"
                fill="rgb(125, 211, 252)"
                filter={`url(#${uid}-glow)`}
              />
            );
          })}
        </g>

        {/* Anneau intérieur — rotation rapide CCW, pointillé */}
        <g
          className="speetch-sat-rot-ccw-fast"
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

        {/* ──────────────── 3. Réseau neural ──────────────── */}
        <g
          className="speetch-sat-net"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          {edges.map((e, i) => {
            const a = nodes[e.from];
            const b = nodes[e.to];
            return (
              <line
                key={`e-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="rgba(125, 211, 252, 0.16)"
                strokeWidth="0.8"
              />
            );
          })}
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
                filter={`url(#${uid}-glow)`}
              />
            </g>
          ))}
        </g>

        {/* ──────────────── 4. Kyber crystal central ──────────────── */}
        <g
          className="speetch-sat-rot-cw-fast"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <polygon
            points={triPoints(CX, CY, 56, -90)}
            fill="none"
            stroke="rgba(186, 230, 253, 0.85)"
            strokeWidth="1.4"
            strokeLinejoin="round"
            filter={`url(#${uid}-glow-strong)`}
          />
        </g>
        <g
          className="speetch-sat-rot-ccw-fast"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <polygon
            points={triPoints(CX, CY, 56, 90)}
            fill="none"
            stroke="rgba(186, 230, 253, 0.85)"
            strokeWidth="1.4"
            strokeLinejoin="round"
            filter={`url(#${uid}-glow-strong)`}
          />
        </g>

        {/* Noyau central pulsant */}
        <circle
          cx={CX}
          cy={CY}
          r="10"
          fill="rgba(125, 211, 252, 0.2)"
          className="speetch-sat-pulse"
        />
        <circle
          cx={CX}
          cy={CY}
          r="4"
          fill="rgb(186, 230, 253)"
          filter={`url(#${uid}-glow-strong)`}
        />
      </svg>

      {/* Label domaine — centré PAR-DESSUS l'orbe (au-dessus du noyau).
          Hors du <svg> donc épargné par le blur CSS : reste lisible
          même sur les satellites les plus éloignés. Blanc pur avec
          glow cyan léger (cohérence palette) + backing noir pour le
          contraste sur les zones claires de l'orbe. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono uppercase text-white"
        style={{
          fontSize: `${Math.max(11, Math.round(size * 0.085))}px`,
          letterSpacing: "0.28em",
          fontWeight: 500,
          textShadow:
            "0 0 8px rgba(255, 255, 255, 0.6), 0 0 18px rgba(125, 211, 252, 0.45), 0 0 4px rgba(0, 0, 0, 0.95)",
        }}
      >
        {domain.shortLabel}
      </span>

      <style>{`
        @keyframes speetch-sat-rot-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes speetch-sat-rot-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes speetch-sat-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%      { transform: scale(1.6); opacity: 1;   }
        }
        @keyframes speetch-sat-sonar {
          0%   { transform: scale(0.4); opacity: 0.7; }
          80%  { opacity: 0; }
          100% { transform: scale(6);   opacity: 0; }
        }

        .speetch-sat-rot-cw-fast    { animation: speetch-sat-rot-cw  18s linear infinite; }
        .speetch-sat-rot-ccw-fast   { animation: speetch-sat-rot-ccw 22s linear infinite; }
        .speetch-sat-rot-cw-medium  { animation: speetch-sat-rot-cw  46s linear infinite; }
        .speetch-sat-rot-ccw-slow   { animation: speetch-sat-rot-ccw 72s linear infinite; }
        .speetch-sat-net            { animation: speetch-sat-rot-cw  120s linear infinite; }

        .speetch-sat-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: speetch-sat-pulse 3.2s ease-in-out infinite;
        }
        .speetch-sat-sonar {
          transform-box: fill-box;
          transform-origin: center;
          animation: speetch-sat-sonar 4.2s ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .speetch-satellite * {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/** Slot constellation — <button> absolument positionné qui rend
 *  <SatelliteVisual> et remonte (id, DOMRect, blur) au clic.
 *  - `hidden` : invisible pendant le zoom (l'overlay prend le relais)
 *  - `dimmed` : autres satellites pendant qu'un est en train de zoomer */
export function SatelliteOrb({
  domain,
  size,
  blur,
  position,
  onClick,
  hidden = false,
  dimmed = false,
}: {
  domain: Domain;
  size: number;
  /** Flou CSS de base (depth of field) — varie par slot. */
  blur: number;
  position: React.CSSProperties;
  onClick: (id: string, rect: DOMRect, blur: number) => void;
  hidden?: boolean;
  dimmed?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        if (!ref.current) return;
        onClick(domain.id, ref.current.getBoundingClientRect(), blur);
      }}
      aria-label={`Voyager vers ${domain.label}`}
      className="group absolute transition-transform duration-500 ease-out hover:scale-110"
      style={{
        ...position,
        width: size,
        opacity: hidden ? 0 : dimmed ? 0.2 : 1,
        pointerEvents: hidden || dimmed ? "none" : "auto",
        transition:
          "opacity 360ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms ease-out, filter 360ms ease-out",
        filter: dimmed ? "blur(1.5px)" : "none",
      }}
    >
      <SatelliteVisual domain={domain} size={size} blur={blur} />
    </button>
  );
}
