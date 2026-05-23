"use client";

/**
 * <SatelliteOrb> — version simplifiée de <HeroOrb> pour les orbes
 * satellites en arrière-plan de la constellation. Affiche :
 *  - 1 anneau extérieur dashé
 *  - 1 anneau intérieur solide
 *  - 6 nœuds répartis (sans labels)
 *  - 1 mini kyber crystal (1 triangle simple)
 *  - 1 noyau central pulsant
 *  - Label du domaine en dessous
 *
 * Cliquable → onClick(domainId) — au clic, la satellite swap avec
 * la main dans la constellation (cf. LandingHero).
 *
 * Couleur dictée par le domaine (accent).
 */

import { SKILL_ACCENT_HEX } from "@/lib/skills";
import type { Domain } from "@/lib/domains";

const SIZE = 200; // viewBox interne, scale via CSS

export function SatelliteOrb({
  domain,
  size,
  position,
  onClick,
}: {
  domain: Domain;
  /** Taille CSS en px (côté carré). Détermine la « distance ». */
  size: number;
  /** Style positionnement absolu : top/right/bottom/left. */
  position: React.CSSProperties;
  onClick: (id: string) => void;
}) {
  const c = SKILL_ACCENT_HEX[domain.accent];
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  // 6 nœuds répartis sur un cercle r=60
  const nodes = Array.from({ length: 6 }, (_, i) => {
    const a = ((i / 6) * 360 - 90) * (Math.PI / 180);
    return {
      x: cx + Math.cos(a) * 60,
      y: cy + Math.sin(a) * 60,
    };
  });

  return (
    <button
      type="button"
      onClick={() => onClick(domain.id)}
      aria-label={`Voyager vers ${domain.label}`}
      className="group absolute flex flex-col items-center gap-2 transition-transform duration-500 ease-out hover:scale-110"
      style={{
        ...position,
        width: size,
      }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        overflow="visible"
        width={size}
        height={size}
        style={{
          filter: `drop-shadow(0 0 ${size * 0.18}px ${c}55)`,
          transition: "filter 400ms ease-out",
        }}
        className="speetch-satellite"
      >
        {/* Anneau extérieur dashé */}
        <circle
          cx={cx}
          cy={cy}
          r="90"
          fill="none"
          stroke={c}
          strokeOpacity="0.28"
          strokeWidth="1"
          strokeDasharray="2 6"
          className="speetch-sat-rot-cw"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Anneau intérieur solide */}
        <circle
          cx={cx}
          cy={cy}
          r="60"
          fill="none"
          stroke={c}
          strokeOpacity="0.3"
          strokeWidth="1"
        />

        {/* Nœuds sur l'anneau intérieur */}
        <g
          className="speetch-sat-rot-ccw"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {nodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r="3.5" fill={c} fillOpacity="0.18" />
              <circle cx={n.x} cy={n.y} r="1.6" fill={c} />
            </g>
          ))}
        </g>

        {/* Mini kyber crystal — triangle pointe haut */}
        <polygon
          points={`${cx},${cy - 18} ${cx - 16},${cy + 10} ${cx + 16},${cy + 10}`}
          fill="none"
          stroke={c}
          strokeWidth="1.3"
          strokeLinejoin="round"
          className="speetch-sat-rot-cw"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          opacity="0.85"
        />

        {/* Noyau central */}
        <circle
          cx={cx}
          cy={cy}
          r="2.5"
          fill={c}
          className="speetch-sat-pulse"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      </svg>

      {/* Label domaine en dessous */}
      <span
        className="font-mono text-[9px] uppercase tracking-[0.32em] text-white/75 transition-colors duration-300 group-hover:text-white"
        style={{
          textShadow: `0 0 6px ${c}80, 0 0 12px rgba(0,0,0,0.85)`,
        }}
      >
        {domain.shortLabel}
      </span>

      <style>{`
        @keyframes speetch-sat-rot-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes speetch-sat-rot-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes speetch-sat-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.65; }
          50%      { transform: scale(1.8); opacity: 1;    }
        }
        .speetch-sat-rot-cw  { animation: speetch-sat-rot-cw  60s linear infinite; }
        .speetch-sat-rot-ccw { animation: speetch-sat-rot-ccw 80s linear infinite; }
        .speetch-sat-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: speetch-sat-pulse 2.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .speetch-satellite * {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </button>
  );
}
