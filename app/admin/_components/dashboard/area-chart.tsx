/**
 * <AreaChart30> — courbe d'aire 30 jours, pure SVG. Plus grand format
 * que <Sparkline> et avec ticks axes Y + axis baseline. Pour la widget
 * "Transmissions émises" du cockpit.
 *
 * `values` : 30 buckets quotidiens du plus ancien (index 0) au plus
 * récent (index 29). Le total et le delta sont calculés à l'extérieur
 * (déjà dans CockpitData).
 */

const W = 600;
const H = 180;
const PAD_X = 16;
const PAD_TOP = 18;
const PAD_BOTTOM = 22;

export function AreaChart30({
  values,
  total,
  unit,
  tone = "cyan",
}: {
  values: number[];
  total: number;
  unit: string;
  tone?: "cyan" | "emerald";
}) {
  const data = values.length === 0 ? new Array(30).fill(0) : values;
  const max = Math.max(...data, 1);

  const stepX = (W - PAD_X * 2) / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => {
    const x = PAD_X + i * stepX;
    const y = PAD_TOP + (1 - v / max) * (H - PAD_TOP - PAD_BOTTOM);
    return { x, y, v };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const baseY = H - PAD_BOTTOM;
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${baseY} L ${points[0].x.toFixed(2)} ${baseY} Z`;

  const stroke = tone === "emerald" ? "#34d399" : "#7dd3fc";
  const gradient = tone === "emerald" ? "rgba(52, 211, 153, 0.35)" : "rgba(125, 211, 252, 0.32)";
  const gradId = `area-${tone}`;

  // 4 ticks horizontaux (baseline + 3 grilles intermédiaires)
  const grid = [0.25, 0.5, 0.75].map((t) => PAD_TOP + (1 - t) * (H - PAD_TOP - PAD_BOTTOM));

  // Labels J-30 / J-15 / J0 sous l'axe
  const tickXs = [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <span
            className="font-sans font-extralight leading-none tracking-[-0.04em] text-[#F5F5F7]"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              textShadow: "0 0 16px rgba(125, 211, 252, 0.25)",
            }}
          >
            {total}
          </span>
          <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/65">
            {unit}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
          30 jours
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradient} />
            <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
          </linearGradient>
        </defs>

        {/* Grille horizontale */}
        {grid.map((y, i) => (
          <line
            key={i}
            x1={PAD_X}
            y1={y}
            x2={W - PAD_X}
            y2={y}
            stroke="rgba(125, 211, 252, 0.08)"
            strokeDasharray="2 4"
          />
        ))}

        {/* Baseline */}
        <line
          x1={PAD_X}
          y1={baseY}
          x2={W - PAD_X}
          y2={baseY}
          stroke="rgba(125, 211, 252, 0.25)"
        />

        {/* Aire */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Ligne */}
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 6px ${stroke}aa)` }}
        />

        {/* Dot final pulsant */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4"
          fill={stroke}
          opacity="0.3"
        />
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2"
          fill={stroke}
        />

        {/* Ticks axe X — J-30 / J-15 / Aujourd'hui */}
        {tickXs.map((i) => (
          <text
            key={i}
            x={points[i].x}
            y={H - 6}
            fontSize="9"
            fill="rgba(255, 255, 255, 0.35)"
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            letterSpacing="0.15em"
          >
            {i === 0 ? "J-30" : i === data.length - 1 ? "AUJ" : `J-${data.length - 1 - i}`}
          </text>
        ))}
      </svg>
    </div>
  );
}
