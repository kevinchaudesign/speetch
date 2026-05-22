/**
 * Helpers Star Wars Day — easter eggs immersifs.
 */

/** Le 4 mai (May the 4th be with you). */
export function isStarWarsDay(date: Date = new Date()): boolean {
  return date.getMonth() === 4 && date.getDate() === 4;
}

/** Le 25 mai (anniversaire de la sortie de Star Wars en 1977). */
export function isRevengeOfTheFifth(date: Date = new Date()): boolean {
  return date.getMonth() === 4 && date.getDate() === 5;
}

/** L'un des deux jours iconiques. */
export function isAnyStarWarsDay(date: Date = new Date()): boolean {
  return isStarWarsDay(date) || isRevengeOfTheFifth(date);
}
