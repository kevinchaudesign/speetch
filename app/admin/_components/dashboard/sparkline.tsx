/**
 * <Sparkline> — micro-graph aire SVG pour les KPI cards. Pure SVG, pas
 * de dépendance externe. Trace une courbe smoothée + gradient de
 * remplissage cyan + dot lumineux sur le dernier point.
 *
 * `values` représente N buckets quotidiens (ou plus, selon le contexte).
 * Les axes ne sont pas affichés — c'est volontaire, c'est un sparkline.
 */

type Tone = "cyan" | "amber" | "emerald" | "rose";

const TONES: Record<Tone, { stroke: string; gradientFrom: string; dot: string }> = {
  cyan: {
    stroke: "#7dd3fc",
    gradientFrom: "rgba(125, 211, 252, 0.28)",
    dot: "#bae6fd",
  },
  amber: {
    stroke: "#fbbf24",
    gradientFrom: "rgba(251, 191, 36, 0.22)",
    dot: "#fde68a",
  },
  emerald: {
    stroke: "#34d399",
    gradientFrom: "rgba(52, 211, 153, 0.22)",
    dot: "#a7f3d0",
  },
  rose: {
    stroke: "#fb7185",
    gradientFrom: "rgba(251, 113, 133, 0.22)",
    dot: "#fecdd3",
  },
};

export function Sparkline({
  values,
  width = 160,
  height = 44,
  tone = "cyan",
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  tone?: Tone;
  className?: string;
}) {
  const pad = 3;
  // Au moins 2 points pour tracer une ligne. On normalise sur [0, max].
  const data = values.length === 0 ? [0, 0] : values.length === 1 ? [values[0], values[0]] : values;
  const max = Math.max(...data, 1);

  const stepX = (width - pad * 2) / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    // Garde 2px de marge en haut pour que le dot ne soit pas coupé.
    const y = height - pad - (v / max) * (height - pad - 4);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${height - pad} L ${points[0].x.toFixed(2)} ${height - pad} Z`;
  const last = points[points.length - 1];

  const gradientId = `spark-${tone}-${Math.random().toString(36).slice(2, 8)}`;

  const t = TONES[tone];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.gradientFrom} />
          <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
        </linearGradient>
      </defs>
      {/* Aire */}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* Ligne */}
      <path
        d={linePath}
        fill="none"
        stroke={t.stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${t.stroke}66)` }}
      />
      {/* Dot lumineux sur le dernier point */}
      <circle cx={last.x} cy={last.y} r="2.4" fill={t.dot} opacity="0.35" />
      <circle cx={last.x} cy={last.y} r="1.3" fill={t.dot} />
    </svg>
  );
}
