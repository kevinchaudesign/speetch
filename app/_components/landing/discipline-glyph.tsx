"use client";

/**
 * <DisciplineGlyph> — graphiques animés cosmiques par discipline.
 * Chaque variant a sa propre identité visuelle ancrée dans la métaphore
 * orbitale de Speetch (anneaux, nœuds, sonar, kyber) du <HeroOrb>, mais
 * décliné selon la phase du workflow :
 *  - 1 Marque     : sceau / signet identitaire (anneau + 6 nœuds + cœur)
 *  - 2 Produit    : wireframes empilés rotatifs (architecture build)
 *  - 3 Contenu    : sonar radiant (broadcast multi-canal)
 *  - 4 Croissance : sparkline ascendante + dots (mesure & itération)
 *
 * Décor strictement décoratif (aria-hidden). Animations CSS only,
 * pausées en prefers-reduced-motion.
 */

const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;

export function DisciplineGlyph({ variant }: { variant: 1 | 2 | 3 | 4 }) {
  return (
    <div
      aria-hidden
      className="speetch-glyph relative"
      style={{
        width: 120,
        height: 120,
        filter: "drop-shadow(0 0 12px rgba(125, 211, 252, 0.35))",
      }}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={120}
        height={120}
        overflow="visible"
      >
        <defs>
          <radialGradient id={`gly-aura-${variant}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0.35)" />
            <stop offset="60%" stopColor="rgba(125, 211, 252, 0.1)" />
            <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
          </radialGradient>
          <filter
            id={`gly-glow-${variant}`}
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
        </defs>

        {/* Aura douce sous tous les variants */}
        <circle cx={CX} cy={CY} r="80" fill={`url(#gly-aura-${variant})`} />

        {variant === 1 && <MarqueGlyph />}
        {variant === 2 && <ProduitGlyph />}
        {variant === 3 && <ContenuGlyph />}
        {variant === 4 && <CroissanceGlyph />}
      </svg>

      <style>{`
        @keyframes gly-rot-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes gly-rot-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes gly-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.7; }
          50%      { transform: scale(1.35); opacity: 1;   }
        }
        @keyframes gly-sonar {
          0%   { transform: scale(0.3); opacity: 0.85; }
          80%  { opacity: 0; }
          100% { transform: scale(3);   opacity: 0; }
        }
        @keyframes gly-stack {
          0%, 30%   { transform: translateY(0)    scaleX(1);   opacity: 0.55; }
          50%       { transform: translateY(-4px) scaleX(1.04); opacity: 1;    }
          70%, 100% { transform: translateY(0)    scaleX(1);   opacity: 0.55; }
        }
        @keyframes gly-draw {
          0%   { stroke-dashoffset: 240; opacity: 0;   }
          15%  { opacity: 1; }
          100% { stroke-dashoffset: 0;   opacity: 1;   }
        }
        @keyframes gly-rise {
          0%, 100% { transform: translateY(0);    opacity: 0.55; }
          50%      { transform: translateY(-3px); opacity: 1;    }
        }

        .speetch-glyph .rot-cw-slow    { animation: gly-rot-cw  60s linear infinite; transform-origin: ${CX}px ${CY}px; }
        .speetch-glyph .rot-cw-fast    { animation: gly-rot-cw  18s linear infinite; transform-origin: ${CX}px ${CY}px; }
        .speetch-glyph .rot-ccw-slow   { animation: gly-rot-ccw 80s linear infinite; transform-origin: ${CX}px ${CY}px; }
        .speetch-glyph .gly-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: gly-pulse 2.4s ease-in-out infinite;
        }
        .speetch-glyph .gly-sonar {
          transform-box: fill-box;
          transform-origin: center;
          animation: gly-sonar 3.6s ease-out infinite;
        }
        .speetch-glyph .gly-stack-1 { animation: gly-stack 3.6s ease-in-out infinite;          transform-box: fill-box; transform-origin: center; }
        .speetch-glyph .gly-stack-2 { animation: gly-stack 3.6s ease-in-out infinite 0.4s;     transform-box: fill-box; transform-origin: center; }
        .speetch-glyph .gly-stack-3 { animation: gly-stack 3.6s ease-in-out infinite 0.8s;     transform-box: fill-box; transform-origin: center; }
        .speetch-glyph .gly-stack-4 { animation: gly-stack 3.6s ease-in-out infinite 1.2s;     transform-box: fill-box; transform-origin: center; }
        .speetch-glyph .gly-draw {
          stroke-dasharray: 240;
          animation: gly-draw 3.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .speetch-glyph .gly-rise-1 { animation: gly-rise 2.4s ease-in-out infinite;          transform-box: fill-box; transform-origin: center; }
        .speetch-glyph .gly-rise-2 { animation: gly-rise 2.4s ease-in-out infinite 0.3s;     transform-box: fill-box; transform-origin: center; }
        .speetch-glyph .gly-rise-3 { animation: gly-rise 2.4s ease-in-out infinite 0.6s;     transform-box: fill-box; transform-origin: center; }
        .speetch-glyph .gly-rise-4 { animation: gly-rise 2.4s ease-in-out infinite 0.9s;     transform-box: fill-box; transform-origin: center; }

        @media (prefers-reduced-motion: reduce) {
          .speetch-glyph * { animation: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── 1. Marque — Sceau identitaire ─────────────────────────────── */
function MarqueGlyph() {
  // 6 nœuds orbitaux + anneau dashé + cœur pulsant. Métaphore d'une
  // identité qui rayonne autour d'un noyau (la marque).
  const nodes = Array.from({ length: 6 }, (_, i) => {
    const a = ((i / 6) * 360 - 90) * (Math.PI / 180);
    return {
      x: Math.round((CX + Math.cos(a) * 56) * 1000) / 1000,
      y: Math.round((CY + Math.sin(a) * 56) * 1000) / 1000,
    };
  });
  return (
    <g>
      {/* Anneau extérieur dashé en rotation lente */}
      <circle
        cx={CX}
        cy={CY}
        r="74"
        fill="none"
        stroke="rgba(125, 211, 252, 0.32)"
        strokeWidth="1"
        strokeDasharray="2 6"
        className="rot-cw-slow"
      />
      {/* Anneau intérieur solide */}
      <circle
        cx={CX}
        cy={CY}
        r="56"
        fill="none"
        stroke="rgba(125, 211, 252, 0.35)"
        strokeWidth="1"
      />
      {/* 6 nœuds orbitaux */}
      <g className="rot-ccw-slow">
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r="5"
              fill="rgba(125, 211, 252, 0.18)"
            />
            <circle
              cx={n.x}
              cy={n.y}
              r="2.4"
              fill="rgb(186, 230, 253)"
              filter="url(#gly-glow-1)"
            />
          </g>
        ))}
      </g>
      {/* Cœur pulsant */}
      <circle
        cx={CX}
        cy={CY}
        r="8"
        fill="rgba(125, 211, 252, 0.25)"
        className="gly-pulse"
      />
      <circle
        cx={CX}
        cy={CY}
        r="3.5"
        fill="rgb(186, 230, 253)"
        filter="url(#gly-glow-1)"
      />
    </g>
  );
}

/* ─── 2. Produit — Wireframes empilés ───────────────────────────── */
function ProduitGlyph() {
  // 4 barres empilées qui « breathe » en stagger → métaphore d'un
  // produit qu'on assemble couche par couche (UX, design system, code).
  return (
    <g>
      {/* Cadre extérieur */}
      <rect
        x={CX - 60}
        y={CY - 60}
        width="120"
        height="120"
        fill="none"
        stroke="rgba(125, 211, 252, 0.25)"
        strokeWidth="1"
        rx="4"
      />
      {/* 4 barres horizontales empilées avec animation stagger */}
      <rect
        x={CX - 48}
        y={CY - 42}
        width="96"
        height="14"
        fill="rgba(125, 211, 252, 0.15)"
        stroke="rgba(125, 211, 252, 0.6)"
        strokeWidth="1"
        rx="2"
        className="gly-stack-1"
      />
      <rect
        x={CX - 48}
        y={CY - 22}
        width="72"
        height="14"
        fill="rgba(125, 211, 252, 0.15)"
        stroke="rgba(125, 211, 252, 0.6)"
        strokeWidth="1"
        rx="2"
        className="gly-stack-2"
      />
      <rect
        x={CX - 48}
        y={CY - 2}
        width="88"
        height="14"
        fill="rgba(125, 211, 252, 0.15)"
        stroke="rgba(125, 211, 252, 0.6)"
        strokeWidth="1"
        rx="2"
        className="gly-stack-3"
      />
      <rect
        x={CX - 48}
        y={CY + 18}
        width="56"
        height="14"
        fill="rgba(125, 211, 252, 0.15)"
        stroke="rgba(125, 211, 252, 0.6)"
        strokeWidth="1"
        rx="2"
        className="gly-stack-4"
      />
      {/* Cursor / point d'interaction en bas-droite */}
      <circle
        cx={CX + 42}
        cy={CY + 42}
        r="3"
        fill="rgb(186, 230, 253)"
        filter="url(#gly-glow-2)"
        className="gly-pulse"
      />
    </g>
  );
}

/* ─── 3. Contenu — Sonar radiant ────────────────────────────────── */
function ContenuGlyph() {
  // 4 cercles sonar concentriques + 8 directions de diffusion →
  // métaphore d'un contenu qui se propage sur tous les canaux.
  const directions = Array.from({ length: 8 }, (_, i) => {
    const a = ((i / 8) * 360) * (Math.PI / 180);
    return {
      x1: Math.round((CX + Math.cos(a) * 30) * 1000) / 1000,
      y1: Math.round((CY + Math.sin(a) * 30) * 1000) / 1000,
      x2: Math.round((CX + Math.cos(a) * 72) * 1000) / 1000,
      y2: Math.round((CY + Math.sin(a) * 72) * 1000) / 1000,
    };
  });
  return (
    <g>
      {/* 3 ondes sonar décalées */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={CX}
          cy={CY}
          r="20"
          fill="none"
          stroke="rgba(125, 211, 252, 0.55)"
          strokeWidth="1"
          className="gly-sonar"
          style={{ animationDelay: `${i * 1.2}s` }}
        />
      ))}
      {/* 8 rais de diffusion */}
      {directions.map((d, i) => (
        <line
          key={i}
          x1={d.x1}
          y1={d.y1}
          x2={d.x2}
          y2={d.y2}
          stroke="rgba(125, 211, 252, 0.3)"
          strokeWidth="1"
        />
      ))}
      {/* Cœur émetteur */}
      <circle
        cx={CX}
        cy={CY}
        r="12"
        fill="rgba(125, 211, 252, 0.18)"
        className="gly-pulse"
      />
      <circle
        cx={CX}
        cy={CY}
        r="5"
        fill="rgb(186, 230, 253)"
        filter="url(#gly-glow-3)"
      />
    </g>
  );
}

/* ─── 4. Croissance — Sparkline ascendante ──────────────────────── */
function CroissanceGlyph() {
  // Axe + sparkline ascendante qui se dessine en boucle + 4 dots qui
  // « breathe » → mesure et itération.
  // Path : du coin bas-gauche au coin haut-droite, avec petits creux.
  const path =
    "M 40 150  L 60 130  L 80 138  L 100 115  L 120 95  L 140 78  L 160 60";
  return (
    <g>
      {/* Axe horizontal de référence */}
      <line
        x1="32"
        y1="155"
        x2="168"
        y2="155"
        stroke="rgba(125, 211, 252, 0.2)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      {/* Axe vertical */}
      <line
        x1="32"
        y1="40"
        x2="32"
        y2="155"
        stroke="rgba(125, 211, 252, 0.2)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      {/* Sparkline qui se dessine en boucle */}
      <path
        d={path}
        fill="none"
        stroke="rgb(186, 230, 253)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#gly-glow-4)"
        className="gly-draw"
      />
      {/* 4 dots de mesure sur la trajectoire qui « breathe » */}
      <circle
        cx="60"
        cy="130"
        r="3"
        fill="rgb(186, 230, 253)"
        className="gly-rise-1"
      />
      <circle
        cx="100"
        cy="115"
        r="3"
        fill="rgb(186, 230, 253)"
        className="gly-rise-2"
      />
      <circle
        cx="140"
        cy="78"
        r="3"
        fill="rgb(186, 230, 253)"
        className="gly-rise-3"
      />
      <circle
        cx="160"
        cy="60"
        r="5"
        fill="rgb(186, 230, 253)"
        filter="url(#gly-glow-4)"
        className="gly-rise-4"
      />
    </g>
  );
}
