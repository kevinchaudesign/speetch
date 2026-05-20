// Helpers pour construire des URLs vers l'optimiseur d'images de Next
// (`/_next/image`). Permet d'utiliser un `<img>` natif qui sert un AVIF/WebP
// sans avoir à passer par le composant `<Image>` (utile quand on n'a pas
// les dimensions intrinsèques à l'avance et qu'on veut laisser le navigateur
// déduire la taille de rendu depuis le fichier servi).
//
// Les `w` autorisés correspondent au `images.deviceSizes` par défaut de
// Next 15. Hors de cette liste, l'endpoint répond 400.

const DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];

export function nextImageUrl(
  originalUrl: string,
  width = 3840,
  quality = 75,
): string {
  return `/_next/image?url=${encodeURIComponent(originalUrl)}&w=${width}&q=${quality}`;
}

export function nextImageSrcSet(originalUrl: string, quality = 75): string {
  return DEVICE_SIZES.map(
    (w) => `${nextImageUrl(originalUrl, w, quality)} ${w}w`,
  ).join(", ");
}
