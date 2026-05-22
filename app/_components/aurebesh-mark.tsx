/**
 * Aurebesh Mark — petite frise de glyphes décoratifs inspirés du script
 * Star Wars (Aurebesh). Pas la vraie typo (pas standardisée en Unicode),
 * juste 5 formes géométriques évocatrices : cercle pointé, carré entaillé,
 * triangle, demi-cercle, hexagone avec barre.
 *
 * Usage : signature visuelle dans les coins / footers. Décoratif uniquement.
 */

export function AurebeshMark({
  className = "",
  size = 12,
}: {
  className?: string;
  size?: number;
}) {
  const glyphs: Array<(s: number) => React.ReactNode> = [
    // 1. Cercle avec point central
    (s) => (
      <g key="0">
        <circle
          cx={s / 2}
          cy={s / 2}
          r={s / 2 - 1}
          fill="none"
          strokeWidth="1"
        />
        <circle cx={s / 2} cy={s / 2} r={1} fill="currentColor" />
      </g>
    ),
    // 2. Carré avec entaille en haut-droite
    (s) => (
      <g key="1">
        <path
          d={`M 1 1 L ${s - 3} 1 L ${s - 1} 3 L ${s - 1} ${s - 1} L 1 ${s - 1} Z`}
          fill="none"
          strokeWidth="1"
        />
      </g>
    ),
    // 3. Triangle pointant à droite
    (s) => (
      <g key="2">
        <path
          d={`M 2 2 L ${s - 1} ${s / 2} L 2 ${s - 2} Z`}
          fill="none"
          strokeWidth="1"
        />
      </g>
    ),
    // 4. Demi-cercle (arc) + barre verticale
    (s) => (
      <g key="3">
        <path
          d={`M ${s / 2} 1 A ${s / 2 - 1} ${s / 2 - 1} 0 0 1 ${s / 2} ${s - 1}`}
          fill="none"
          strokeWidth="1"
        />
        <line
          x1={s / 2}
          y1={1}
          x2={s / 2}
          y2={s - 1}
          strokeWidth="1"
        />
      </g>
    ),
    // 5. Hexagone avec barre horizontale au milieu
    (s) => (
      <g key="4">
        <path
          d={`M ${s / 4} 1 L ${(s * 3) / 4} 1 L ${s - 1} ${s / 2} L ${(s * 3) / 4} ${s - 1} L ${s / 4} ${s - 1} L 1 ${s / 2} Z`}
          fill="none"
          strokeWidth="1"
        />
        <line
          x1={s / 4}
          y1={s / 2}
          x2={(s * 3) / 4}
          y2={s / 2}
          strokeWidth="1"
        />
      </g>
    ),
  ];

  return (
    <span
      className={`inline-flex items-center gap-2 text-cyan-200/45 ${className}`}
      aria-hidden
    >
      {glyphs.map((render, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          stroke="currentColor"
          fill="none"
          className="shrink-0"
        >
          {render(size)}
        </svg>
      ))}
    </span>
  );
}
