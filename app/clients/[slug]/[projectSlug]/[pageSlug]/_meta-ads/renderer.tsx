/**
 * Dispatch d'un mockup Meta Ads vers le bon renderer (FB ou IG, par format).
 *
 * Extrait de `meta-ads-page-view.tsx` pour pouvoir être réutilisé côté admin
 * (preview live dans le formulaire d'édition).
 */

import type { MetaAdMockup } from "@/types/database";
import {
  FacebookCarousel,
  FacebookFeed,
  FacebookInStream,
  FacebookMarketplace,
  FacebookReel,
  FacebookRightColumn,
  FacebookStory,
} from "./facebook";
import {
  InstagramCarousel,
  InstagramExplore,
  InstagramFeed,
  InstagramReel,
  InstagramShop,
  InstagramStory,
} from "./instagram";

export function MockupRenderer({ mockup }: { mockup: MetaAdMockup }) {
  switch (mockup.format) {
    case "fb_feed_image":
    case "fb_feed_video":
      return <FacebookFeed mockup={mockup} />;
    case "fb_feed_carousel":
      return <FacebookCarousel mockup={mockup} />;
    case "fb_story":
      return <FacebookStory mockup={mockup} />;
    case "fb_reel":
      return <FacebookReel mockup={mockup} />;
    case "fb_right_column":
      return <FacebookRightColumn mockup={mockup} />;
    case "fb_marketplace":
      return <FacebookMarketplace mockup={mockup} />;
    case "fb_in_stream":
      return <FacebookInStream mockup={mockup} />;
    case "ig_feed_image":
      return <InstagramFeed mockup={mockup} videoAspect={false} />;
    case "ig_feed_video":
      return <InstagramFeed mockup={mockup} videoAspect={true} />;
    case "ig_feed_carousel":
      return <InstagramCarousel mockup={mockup} />;
    case "ig_story":
      return <InstagramStory mockup={mockup} />;
    case "ig_reel":
      return <InstagramReel mockup={mockup} />;
    case "ig_explore":
      return <InstagramExplore mockup={mockup} />;
    case "ig_shop":
      return <InstagramShop mockup={mockup} />;
    default:
      return (
        <p className="rounded border border-amber-400/40 bg-amber-400/5 p-4 text-center text-[11px] uppercase tracking-[0.32em] text-amber-200/70">
          Format de mockup inconnu : {(mockup as { format: string }).format}
        </p>
      );
  }
}
