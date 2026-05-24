"use client";

/**
 * <ContactBackdrop> — décor orbital qui converge derrière le CTA email.
 * Métaphore : le parcours visiteur arrive à son point de contact, tout
 * converge ici. Composé de :
 *  - 1 aura radiale très diffuse au centre
 *  - 2 anneaux orbitaux contrarotatifs (echo du <HeroOrb>)
 *  - 8 nœuds qui pulsent en stagger sur l'anneau extérieur
 *  - 2 ondes sonar qui se propagent depuis le centre
 *
 * Décor strictement décoratif (aria-hidden), pause en reduced-motion.
 */

const SIZE = 600;
const CX = SIZE / 2;
const CY = SIZE / 2;

export function ContactBackdrop() {
  // 8 nœuds régulièrement répartis sur l'anneau extérieur (r=240)
  const nodes = Array.from({ length: 8 }, (_, i) => {
    const a = ((i / 8) * 360 - 90) * (Math.PI / 180);
    return {
      x: Math.round((CX + Math.cos(a) * 240) * 1000) / 1000,
      y: Math.round((CY + Math.sin(a) * 240) * 1000) / 1000,
    };
  });

  return (
    <div
      aria-hidden
      className="speetch-contact-backdrop pointer-events-none absolute inset-0 -z-[1] flex items-center justify-center overflow-hidden opacity-60"
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        overflow="visible"
        className="h-auto w-[120vw] max-w-[1100px]"
        style={{ filter: "drop-shadow(0 0 60px rgba(125, 211, 252, 0.15))" }}
      >
        <defs>
          <radialGradient id="cb-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0.22)" />
            <stop offset="40%" stopColor="rgba(125, 211, 252, 0.08)" />
            <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
          </radialGradient>
          <filter id="cb-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Aura centrale très diffuse */}
        <circle cx={CX} cy={CY} r="240" fill="url(#cb-aura)" />

        {/* Ondes sonar concentriques (2 décalées) */}
        {[0, 1].map((i) => (
          <circle
            key={i}
            cx={CX}
            cy={CY}
            r="60"
            fill="none"
            stroke="rgba(125, 211, 252, 0.5)"
            strokeWidth="1"
            className="cb-sonar"
            style={{ animationDelay: `${i * 2.4}s` }}
          />
        ))}

        {/* Anneau extérieur dashed en rotation lente CCW */}
        <g
          className="cb-rot-ccw"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <circle
            cx={CX}
            cy={CY}
            r="240"
            fill="none"
            stroke="rgba(125, 211, 252, 0.2)"
            strokeWidth="1"
            strokeDasharray="3 8"
          />
        </g>

        {/* Anneau intérieur solide en rotation CW */}
        <g
          className="cb-rot-cw"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <circle
            cx={CX}
            cy={CY}
            r="170"
            fill="none"
            stroke="rgba(125, 211, 252, 0.18)"
            strokeWidth="1"
          />
        </g>

        {/* 8 nœuds qui pulsent sur l'anneau extérieur, stagger 0.3s */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle
              cx={n.x}
              cy={n.y}
              r="6"
              fill="rgba(125, 211, 252, 0.18)"
              className="cb-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r="2.5"
              fill="rgb(186, 230, 253)"
              filter="url(#cb-glow)"
            />
          </g>
        ))}
      </svg>

      <style>{`
        @keyframes cb-rot-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes cb-rot-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
        @keyframes cb-sonar {
          0%   { transform: scale(0.5); opacity: 0.55; }
          80%  { opacity: 0; }
          100% { transform: scale(4);   opacity: 0; }
        }
        @keyframes cb-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.6; }
          50%      { transform: scale(1.7); opacity: 1;   }
        }
        .speetch-contact-backdrop .cb-rot-cw  { animation: cb-rot-cw  90s linear infinite; }
        .speetch-contact-backdrop .cb-rot-ccw { animation: cb-rot-ccw 110s linear infinite; }
        .speetch-contact-backdrop .cb-sonar {
          transform-box: fill-box;
          transform-origin: center;
          animation: cb-sonar 5s ease-out infinite;
        }
        .speetch-contact-backdrop .cb-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: cb-pulse 3.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .speetch-contact-backdrop * {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
