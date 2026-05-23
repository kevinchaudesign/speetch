/**
 * Icônes SVG des 6 droïdes du Conseil. Silhouettes stylisées et
 * reconnaissables à 32px comme à 96px. Stroke variable selon la taille
 * du composant parent (via currentColor + classes Tailwind).
 *
 * Convention : viewBox 32×40 (légèrement portrait) pour donner de la
 * verticalité aux humanoïdes (3PO, K2) sans pénaliser les ronds (BB-8)
 * ou les cylindres (R2).
 */

type IconProps = { className?: string; size?: number };

function Svg({
  children,
  size = 56,
  className,
}: {
  children: React.ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size * (40 / 32)}
      viewBox="0 0 32 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** C-3PO — humanoïde élancé, antennes courtes, plaque pectorale. */
export function C3POIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Tête ovale */}
      <ellipse cx="16" cy="9" rx="4.5" ry="5" />
      {/* Yeux */}
      <circle cx="14" cy="9" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="18" cy="9" r="0.8" fill="currentColor" stroke="none" />
      {/* Antennes */}
      <path d="M13.5 4 L13 2" />
      <path d="M18.5 4 L19 2" />
      {/* Cou */}
      <path d="M15 14 L17 14" />
      {/* Torse — plaque pectorale rectangulaire */}
      <path d="M10 15 L22 15 L23 26 L9 26 Z" />
      {/* Détails pectoraux (4 boutons) */}
      <circle cx="14" cy="20" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="23" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="23" r="0.5" fill="currentColor" stroke="none" />
      {/* Bras */}
      <path d="M10 16 L7 25" />
      <path d="M22 16 L25 25" />
      {/* Jambes */}
      <path d="M12 27 L11 38" />
      <path d="M20 27 L21 38" />
    </Svg>
  );
}

/** K-2SO — humanoïde grand, tête anguleuse, épaules carrées. */
export function K2SOIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Tête hexagonale allongée */}
      <path d="M13 4 L19 4 L21 9 L19 14 L13 14 L11 9 Z" />
      {/* Yeux étroits */}
      <path d="M13.5 8.5 L15 8.5" strokeWidth="1.4" />
      <path d="M17 8.5 L18.5 8.5" strokeWidth="1.4" />
      {/* Épaules carrées prononcées */}
      <path d="M9 16 L23 16 L24 19 L23 19" />
      {/* Torse étroit */}
      <path d="M11 19 L21 19 L21 28 L11 28 Z" />
      {/* Détail pectoral central */}
      <path d="M14 22 L18 22" />
      <path d="M14 25 L18 25" />
      {/* Bras longs */}
      <path d="M9 17 L8 30" />
      <path d="M23 17 L24 30" />
      {/* Jambes longues */}
      <path d="M13 28 L12 38" />
      <path d="M19 28 L20 38" />
    </Svg>
  );
}

/** BB-8 — sphère + dôme. Iconique : très peu de traits suffisent. */
export function BB8Icon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Dôme */}
      <path d="M11 14 A 5 5 0 0 1 21 14" />
      {/* Antenne */}
      <path d="M16 9 L16 7" />
      <circle cx="16" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
      {/* Œil principal */}
      <circle cx="16" cy="12" r="1.4" />
      <circle cx="16" cy="12" r="0.6" fill="currentColor" stroke="none" />
      {/* Œil secondaire */}
      <circle cx="19" cy="13" r="0.6" />
      {/* Ligne de séparation dôme/corps */}
      <path d="M11 14 L21 14" />
      {/* Corps sphérique */}
      <circle cx="16" cy="25" r="11" />
      {/* Détails motifs corps : 3 ronds disposés */}
      <circle cx="12" cy="22" r="1.3" />
      <circle cx="20" cy="22" r="1.3" />
      <circle cx="16" cy="30" r="1.3" />
      {/* Petit point central dans chaque cercle */}
      <circle cx="12" cy="22" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="20" cy="22" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="16" cy="30" r="0.4" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** R2-D2 — dôme + cylindre + 2 pattes. Très iconique. */
export function R2D2Icon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Dôme */}
      <path d="M9 12 A 7 7 0 0 1 23 12" />
      <path d="M9 12 L23 12" />
      {/* Œil principal du dôme */}
      <circle cx="16" cy="9" r="1.8" />
      <circle cx="16" cy="9" r="0.7" fill="currentColor" stroke="none" />
      {/* Petits détails dôme */}
      <circle cx="12" cy="10" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="20" cy="10" r="0.4" fill="currentColor" stroke="none" />
      {/* Antenne radio */}
      <path d="M20 6.5 L20 4" />
      {/* Corps cylindrique */}
      <path d="M10 12 L10 32 L22 32 L22 12" />
      {/* Bande horizontale médiane */}
      <path d="M10 18 L22 18" />
      <path d="M10 26 L22 26" />
      {/* Détail central — power port + boutons */}
      <rect x="14" y="20" width="4" height="4" />
      <circle cx="13" cy="29" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="29" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="29" r="0.5" fill="currentColor" stroke="none" />
      {/* Pattes */}
      <path d="M10 32 L8 38 L12 38" />
      <path d="M22 32 L24 38 L20 38" />
    </Svg>
  );
}

/** AP-5 — droïde analytique, tête rectangulaire avec écran. */
export function AP5Icon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Tête rectangulaire avec coins coupés */}
      <path d="M11 4 L21 4 L23 6 L23 12 L21 14 L11 14 L9 12 L9 6 Z" />
      {/* Bande visuelle (slit type Cylon mais horizontal) */}
      <rect x="11" y="8" width="10" height="2" />
      <path d="M12 9 L14 9" strokeWidth="1.4" />
      <path d="M18 9 L20 9" strokeWidth="1.4" />
      {/* Cou */}
      <path d="M14 14 L14 16 L18 16 L18 14" />
      {/* Torse — boîte analytique avec écran intégré */}
      <path d="M9 16 L23 16 L23 28 L9 28 Z" />
      {/* Écran central */}
      <rect x="12" y="19" width="8" height="5" />
      {/* Lignes données dans l'écran */}
      <path d="M13 21 L19 21" />
      <path d="M13 22.5 L17 22.5" />
      {/* Boutons sous l'écran */}
      <circle cx="13" cy="26" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="26" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="26" r="0.5" fill="currentColor" stroke="none" />
      {/* Bras */}
      <path d="M9 18 L6 26" />
      <path d="M23 18 L26 26" />
      {/* Jambes courtes */}
      <path d="M13 28 L12 38" />
      <path d="M19 28 L20 38" />
    </Svg>
  );
}

/** Chopper — astromech anguleux, têtes ronde + corps box. */
export function ChopperIcon(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Dôme rond mais avec un quartier découpé (caractéristique) */}
      <circle cx="16" cy="11" r="5" />
      {/* Quartier découpé */}
      <path d="M16 6 L21 11" strokeWidth="1.4" />
      {/* Œil */}
      <circle cx="14" cy="11" r="1.2" />
      <circle cx="14" cy="11" r="0.5" fill="currentColor" stroke="none" />
      {/* Petit œil secondaire */}
      <circle cx="18" cy="13" r="0.6" />
      {/* Antenne tordue */}
      <path d="M19 7 L21 4 L20 3" />
      {/* Corps trapézoïdal (plus large en bas) */}
      <path d="M11 17 L21 17 L23 30 L9 30 Z" />
      {/* Bande horizontale */}
      <path d="M10 22 L22 22" />
      {/* Détails techniques — outils sortants */}
      <path d="M10 19 L7 19 L7 17" />
      <path d="M22 19 L25 19 L25 17" />
      {/* Boutons + jauge */}
      <rect x="13" y="24" width="6" height="3" />
      <path d="M14 25.5 L18 25.5" />
      {/* Pattes asymétriques */}
      <path d="M11 30 L9 38 L12 38" />
      <path d="M21 30 L23 38 L20 38" />
    </Svg>
  );
}

/** Lookup par codename pour le composant <DroidIcon codename="r2-d2" />. */
export function DroidIcon({
  codename,
  className,
  size,
}: {
  codename: string;
  className?: string;
  size?: number;
}) {
  const props = { className, size };
  switch (codename) {
    case "c-3po":
      return <C3POIcon {...props} />;
    case "k-2so":
      return <K2SOIcon {...props} />;
    case "bb-8":
      return <BB8Icon {...props} />;
    case "r2-d2":
      return <R2D2Icon {...props} />;
    case "ap-5":
      return <AP5Icon {...props} />;
    case "chopper":
      return <ChopperIcon {...props} />;
    default:
      return null;
  }
}
