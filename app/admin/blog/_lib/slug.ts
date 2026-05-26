/**
 * Slugify FR — minuscules, sans accents, tirets pour les espaces, sans
 * caractères spéciaux. Tronqué à 80 caractères pour rester URL-friendly.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Compte les mots dans une string HTML (strip tags, split sur whitespace).
 * Utilisé pour calculer le reading_time.
 */
export function countWordsInHtml(html: string): number {
  if (!html) return 0;
  const stripped = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

/**
 * 180 mots/min = cadence FR. Plancher à 1 min pour éviter "0 min" sur
 * un article court — visuellement bizarre côté UI.
 */
export function readingTimeFromHtml(html: string): number {
  const words = countWordsInHtml(html);
  return Math.max(1, Math.ceil(words / 180));
}
