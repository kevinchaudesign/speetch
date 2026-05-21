/**
 * Catalogue des formats publicitaires Meta (Facebook + Instagram).
 *
 * Source de vérité unique pour :
 *  - la liste des formats proposés à l'admin (picker à la création d'un mockup)
 *  - le mapping format → plateforme / aspect ratio / label FR
 *  - la liste des CTA standards
 *
 * Pour ajouter un format : éditer META_AD_FORMATS, mettre à jour le type
 * MetaAdFormat dans `types/database.ts`, et brancher un renderer côté
 * `app/clients/[…]/[pageSlug]/_meta-ads/`.
 */

import type {
  MetaAdCta,
  MetaAdFormat,
  MetaAdPlatform,
} from "@/types/database";

export type MetaAdAspect =
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9"
  | "1.91:1"
  | "auto";

export type MetaAdFormatSpec = {
  value: MetaAdFormat;
  platform: MetaAdPlatform;
  label: string;
  tagline: string;
  /** Ratio par défaut du média principal. `auto` = laisse le média définir. */
  aspect: MetaAdAspect;
  /** Surface du chrome : feed = post normal, story/reel = plein écran 9:16. */
  surface: "feed" | "story" | "reel" | "right_column" | "in_stream" | "shop";
  /** Le format accepte-t-il un carrousel multi-cards ? */
  carousel: boolean;
  /**
   * Dimensions de référence du média à fournir, recommandations Meta
   * (largeur × hauteur en px). À jour 2026.
   */
  dimensions: { width: number; height: number };
};

export const META_AD_FORMATS: readonly MetaAdFormatSpec[] = [
  // ─── Facebook ────────────────────────────────────────────────────────────
  {
    value: "fb_feed_image",
    platform: "facebook",
    label: "Facebook · Feed image",
    tagline: "Post sponsorisé image dans le fil d'actualité.",
    aspect: "1:1",
    surface: "feed",
    carousel: false,
    dimensions: { width: 1080, height: 1080 },
  },
  {
    value: "fb_feed_video",
    platform: "facebook",
    label: "Facebook · Feed vidéo",
    tagline: "Post sponsorisé vidéo dans le fil d'actualité.",
    aspect: "1:1",
    surface: "feed",
    carousel: false,
    dimensions: { width: 1080, height: 1080 },
  },
  {
    value: "fb_feed_carousel",
    platform: "facebook",
    label: "Facebook · Feed carrousel",
    tagline: "Carrousel multi-cartes dans le fil d'actualité.",
    aspect: "1:1",
    surface: "feed",
    carousel: true,
    dimensions: { width: 1080, height: 1080 },
  },
  {
    value: "fb_story",
    platform: "facebook",
    label: "Facebook · Story",
    tagline: "Story plein écran 9:16 avec CTA en bas.",
    aspect: "9:16",
    surface: "story",
    carousel: false,
    dimensions: { width: 1080, height: 1920 },
  },
  {
    value: "fb_reel",
    platform: "facebook",
    label: "Facebook · Reel",
    tagline: "Reel 9:16 avec colonne d'actions à droite.",
    aspect: "9:16",
    surface: "reel",
    carousel: false,
    dimensions: { width: 1080, height: 1920 },
  },
  {
    value: "fb_right_column",
    platform: "facebook",
    label: "Facebook · Colonne droite",
    tagline: "Encart desktop dans la colonne de droite.",
    aspect: "1.91:1",
    surface: "right_column",
    carousel: false,
    dimensions: { width: 1200, height: 628 },
  },
  {
    value: "fb_marketplace",
    platform: "facebook",
    label: "Facebook · Marketplace",
    tagline: "Annonce dans le fil Marketplace.",
    aspect: "1:1",
    surface: "feed",
    carousel: false,
    dimensions: { width: 1080, height: 1080 },
  },
  {
    value: "fb_in_stream",
    platform: "facebook",
    label: "Facebook · In-stream",
    tagline: "Vidéo paysage 16:9 insérée dans des vidéos partenaires.",
    aspect: "16:9",
    surface: "in_stream",
    carousel: false,
    dimensions: { width: 1280, height: 720 },
  },

  // ─── Instagram ───────────────────────────────────────────────────────────
  {
    value: "ig_feed_image",
    platform: "instagram",
    label: "Instagram · Feed image",
    tagline: "Post sponsorisé image dans le feed Instagram.",
    aspect: "1:1",
    surface: "feed",
    carousel: false,
    dimensions: { width: 1080, height: 1080 },
  },
  {
    value: "ig_feed_video",
    platform: "instagram",
    label: "Instagram · Feed vidéo",
    tagline: "Post sponsorisé vidéo dans le feed Instagram.",
    aspect: "4:5",
    surface: "feed",
    carousel: false,
    dimensions: { width: 1080, height: 1350 },
  },
  {
    value: "ig_feed_carousel",
    platform: "instagram",
    label: "Instagram · Feed carrousel",
    tagline: "Carrousel multi-cartes 1:1 ou 4:5 dans le feed.",
    aspect: "1:1",
    surface: "feed",
    carousel: true,
    dimensions: { width: 1080, height: 1080 },
  },
  {
    value: "ig_story",
    platform: "instagram",
    label: "Instagram · Story",
    tagline: "Story plein écran 9:16 avec sticker CTA en bas.",
    aspect: "9:16",
    surface: "story",
    carousel: false,
    dimensions: { width: 1080, height: 1920 },
  },
  {
    value: "ig_reel",
    platform: "instagram",
    label: "Instagram · Reel",
    tagline: "Reel 9:16 avec colonne d'actions à droite, légende en bas.",
    aspect: "9:16",
    surface: "reel",
    carousel: false,
    dimensions: { width: 1080, height: 1920 },
  },
  {
    value: "ig_explore",
    platform: "instagram",
    label: "Instagram · Explore",
    tagline: "Post sponsorisé dans la grille Explore.",
    aspect: "1:1",
    surface: "feed",
    carousel: false,
    dimensions: { width: 1080, height: 1080 },
  },
  {
    value: "ig_shop",
    platform: "instagram",
    label: "Instagram · Shop",
    tagline: "Annonce dans l'onglet Shop / boutique.",
    aspect: "1:1",
    surface: "shop",
    carousel: false,
    dimensions: { width: 1080, height: 1080 },
  },
];

/** "1080 × 1920 px" — formatter dimensions pour l'UI. */
export function formatDimensions(d: { width: number; height: number }): string {
  return `${d.width} × ${d.height} px`;
}

export type MetaCtaSpec = {
  value: MetaAdCta;
  label: string;
};

/**
 * Libellés FR officiels Meta (proches de leur copy d'interface).
 * Si tu veux ajouter un CTA : éditer ici + type MetaAdCta.
 */
export const META_CTAS: readonly MetaCtaSpec[] = [
  { value: "no_button", label: "Aucun bouton" },
  { value: "shop_now", label: "Acheter" },
  { value: "learn_more", label: "En savoir plus" },
  { value: "sign_up", label: "S'inscrire" },
  { value: "download", label: "Télécharger" },
  { value: "get_offer", label: "Profiter de l'offre" },
  { value: "contact_us", label: "Nous contacter" },
  { value: "send_message", label: "Envoyer un message" },
  { value: "book_now", label: "Réserver" },
  { value: "watch_more", label: "Voir plus" },
  { value: "subscribe", label: "S'abonner" },
  { value: "apply_now", label: "Postuler" },
  { value: "donate_now", label: "Faire un don" },
  { value: "install_now", label: "Installer" },
  { value: "play_game", label: "Jouer" },
  { value: "use_app", label: "Utiliser l'application" },
  { value: "listen_now", label: "Écouter" },
  { value: "request_time", label: "Demander un horaire" },
  { value: "see_menu", label: "Voir le menu" },
  { value: "order_now", label: "Commander" },
  { value: "get_quote", label: "Demander un devis" },
  { value: "get_directions", label: "Itinéraire" },
  { value: "get_showtimes", label: "Voir les séances" },
];

export function isValidMetaAdFormat(value: string): value is MetaAdFormat {
  return META_AD_FORMATS.some((f) => f.value === value);
}

export function isValidMetaCta(value: string): value is MetaAdCta {
  return META_CTAS.some((c) => c.value === value);
}

export function getMetaAdFormatSpec(
  value: MetaAdFormat,
): MetaAdFormatSpec | null {
  return META_AD_FORMATS.find((f) => f.value === value) ?? null;
}

export function getMetaCtaLabel(value: MetaAdCta): string {
  return META_CTAS.find((c) => c.value === value)?.label ?? value;
}

export function getMetaPlatformLabel(value: MetaAdPlatform): string {
  return value === "facebook" ? "Facebook" : "Instagram";
}

/**
 * Tailwind aspect ratio classes — `aspect-square` etc. ne suffisent pas pour
 * tous les ratios Meta, donc on utilise des valeurs personnalisées.
 */
export function getAspectStyle(aspect: MetaAdAspect): string {
  switch (aspect) {
    case "1:1":
      return "aspect-square";
    case "4:5":
      return "aspect-[4/5]";
    case "9:16":
      return "aspect-[9/16]";
    case "16:9":
      return "aspect-video";
    case "1.91:1":
      return "aspect-[1.91/1]";
    case "auto":
    default:
      return "";
  }
}
