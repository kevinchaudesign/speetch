/**
 * <RadialGauge> — jauge semi-circulaire HUD : arc background + arc
 * valeur + pourcentage centré. Look "indicateur de bouclier / réacteur"
 * de cockpit. Pure SVG, server-renderable.
 */

const W = 240;
const H = 150;
const CX = W / 2;
const CY = H - 10;
const R = 95;
const STROKE = 10;

/**
 * Convertit un angle (en degrés, 0 = est, sens trigonométrique inversé
 * pour le SVG) en coordonnées sur le cercle de rayon R.
 */
function polar(angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}

/**
 * Construit un arc SVG entre deux angles (en degrés, dans le repère
 * "0 = est, 90 = sud, -90 = nord"). On va de 180° (gauche) à 360°
 * (droite) pour dessiner un demi-cercle ouvert vers le bas.
 */
function arcPath(startDeg: number, endDeg: number): string {
  const start = polar(startDeg);
  const end = polar(endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  // sweep=1 pour passer "par le haut" du cercle
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${R} ${R} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export function RadialGauge({
  rate,
  label,
  subLabel,
  tone = "cyan",
}: {
  /** 0..1 */
  rate: number;
  label: string;
  subLabel?: string;
  tone?: "cyan" | "emerald" | "amber";
}) {
  const safe = Math.min(1, Math.max(0, rate));
  // Demi-cercle ouvert vers le bas : start = 180 (à gauche), end = 360 (à droite)
  const startAngle = 180;
  const endAngle = 360;
  const valueEndAngle = startAngle + safe * (endAngle - startAngle);

  const arcBg = arcPath(startAngle, endAngle);
  const arcValue = arcPath(startAngle, valueEndAngle);

  const color =
    tone === "emerald"
      ? "#34d399"
      : tone === "amber"
        ? "#fbbf24"
        : "#7dd3fc";
  const gradId = `gauge-${tone}`;

  const pct = Math.round(safe * 100);

  // Marqueurs de tick tous les 10 % (sauf 0 et 100 — déjà cap par l'arc)
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const a = startAngle + ((i + 1) / 10) * (endAngle - startAngle);
    const inner = polar(a);
    const outer = {
      x: CX + (R + 6) * Math.cos((a * Math.PI) / 180),
      y: CY + (R + 6) * Math.sin((a * Math.PI) / 180),
    };
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[260px]" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* Arc fond */}
        <path
          d={arcBg}
          stroke="rgba(125, 211, 252, 0.12)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />

        {/* Ticks fins externes */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="rgba(125, 211, 252, 0.22)"
            strokeWidth="1"
          />
        ))}

        {/* Arc valeur */}
        <path
          d={arcValue}
          stroke={`url(#${gradId})`}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}aa)` }}
        />

        {/* Pourcentage centré */}
        <text
          x={CX}
          y={CY - 28}
          textAnchor="middle"
          fontSize="42"
          fontWeight="200"
          fill="#F5F5F7"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          letterSpacing="-2"
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        >
          {pct}
          <tspan fontSize="20" dy="-6" fill="rgba(255,255,255,0.55)">
            %
          </tspan>
        </text>
      </svg>

      <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/75">
        {label}
      </span>
      {subLabel && (
        <span className="font-serif text-[11px] italic text-white/45">
          {subLabel}
        </span>
      )}
    </div>
  );
}
