"use client";

/**
 * <WorkflowFlow> — ligne de flux animée qui connecte les 3 cartes du
 * workflow (Brief → Création → Exécution) dans <LandingApproach>.
 *
 * Rendu :
 *  - Ligne horizontale dashed cyan qui traverse les 3 cartes
 *  - 3 nœuds (un par phase) qui pulsent en stagger
 *  - Particule lumineuse qui glisse de gauche à droite en boucle
 *    (suggestion : le travail qui « avance » dans le pipeline)
 *
 * Décor strictement décoratif (aria-hidden). Caché sur mobile car la
 * grille est vertical-stack (la ligne horizontale n'a plus de sens).
 */

export function WorkflowFlow() {
  return (
    <div
      aria-hidden
      className="speetch-flow pointer-events-none relative hidden h-px w-full md:block"
    >
      <svg
        viewBox="0 0 1000 40"
        preserveAspectRatio="none"
        className="absolute -top-5 left-0 h-10 w-full"
        overflow="visible"
      >
        <defs>
          <linearGradient id="flow-line-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0)" />
            <stop offset="15%" stopColor="rgba(125, 211, 252, 0.45)" />
            <stop offset="85%" stopColor="rgba(125, 211, 252, 0.45)" />
            <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
          </linearGradient>
          <filter id="flow-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ligne dashed traversante avec gradient fade aux extrémités */}
        <line
          x1="0"
          y1="20"
          x2="1000"
          y2="20"
          stroke="url(#flow-line-grad)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* 3 nœuds positionnés au centre de chaque colonne grid-cols-3 :
            16.67% / 50% / 83.33%. */}
        {[167, 500, 833].map((cx, i) => (
          <g key={cx}>
            <circle
              cx={cx}
              cy={20}
              r="9"
              fill="rgba(125, 211, 252, 0.12)"
              className="flow-pulse"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
            <circle
              cx={cx}
              cy={20}
              r="4"
              fill="rgb(186, 230, 253)"
              filter="url(#flow-glow)"
            />
          </g>
        ))}

        {/* Particule lumineuse qui glisse de gauche à droite */}
        <circle
          cx={0}
          cy={20}
          r="3"
          fill="rgb(186, 230, 253)"
          filter="url(#flow-glow)"
          className="flow-runner"
          opacity="0.95"
        />
      </svg>

      <style>{`
        @keyframes flow-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%      { transform: scale(1.4); opacity: 1;   }
        }
        @keyframes flow-run {
          0%   { transform: translateX(0);     opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(1000px); opacity: 0; }
        }
        .speetch-flow .flow-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: flow-pulse 2.4s ease-in-out infinite;
        }
        .speetch-flow .flow-runner {
          animation: flow-run 6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .speetch-flow * { animation: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
