import { cn } from "@/lib/utils";

/**
 * SpeetchLogo — brand mark officiel Speetch (perroquet ara bleu+jaune
 * en tourbillon de filets dégradés, style Firefox).
 *
 * Format SVG self-contained (PNG 384 encodé en base64 dans le SVG) :
 *  - Scalable sans pixellisation à toute taille
 *  - Servi statiquement depuis `/public/logo/speetch.svg` (~200 KB)
 *  - Mis en cache par le navigateur après le premier chargement
 *  - Utilisable comme `<img>`, en background CSS, ou inline
 *
 * Les variantes PNG redimensionnées (16/32/96/192/512) restent disponibles
 * dans `/public/logo/speetch-{N}.png` pour les favicons et apple-touch-icons,
 * où le format PNG natif est préféré par les navigateurs et OS.
 */

const SIZES = {
  sm: 24,
  md: 40,
  lg: 96,
  xl: 192,
} as const;

export function SpeetchLogo({
  size = "md",
  className,
  loading = "lazy",
}: {
  size?: keyof typeof SIZES;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  const px = SIZES[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/speetch.svg"
      alt="Speetch"
      width={px}
      height={px}
      loading={loading}
      decoding="async"
      className={cn("inline-block select-none", className)}
    />
  );
}
