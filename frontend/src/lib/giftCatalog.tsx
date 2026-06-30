import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bot,
  Coffee,
  Crown,
  Flame,
  Flower2,
  Heart,
  Sparkles,
  ThumbsUp,
} from "lucide-react";

export type GiftTier = "common" | "rare" | "legendary";

/** Lucide icons where they fit; Quebec-specific ids fall back to emoji in UI. */
export const GIFT_ICON_MAP: Partial<Record<string, LucideIcon>> = {
  fleur: Flower2,
  bravo: ThumbsUp,
  cafe: Coffee,
  coeur: Heart,
  tiguy: Bot,
  feu: Flame,
  couronne: Crown,
  sceau_voyageur: Award,
  comete: Sparkles,
};

export const GIFT_ASSET_MAP: Partial<Record<string, string>> = {
  poutine: "/assets/emojis/poutine.png",
  caribou: "/assets/emojis/caribou.png",
  "fleur-de-lys": "/assets/emojis/fleur-de-lys.png",
  fleur_de_lys: "/assets/emojis/fleur-de-lys.png",
  "cone-orange": "/assets/emojis/cone-orange.png",
  erable: "/assets/emojis/sirop-erable.png",
  "sirop-erable": "/assets/emojis/sirop-erable.png",
  tourtiere: "/assets/emojis/tourtiere.png",
  biere: "/assets/emojis/biere.png",
  hockey: "/assets/emojis/hockey.png",
};

export function getGiftTier(cost: number): GiftTier {
  if (cost >= 500) return "legendary";
  if (cost >= 100) return "rare";
  return "common";
}

export function getCreatorShare(cost: number): number {
  return Math.floor(cost * 0.7);
}

export function giftTierBorderClass(tier: GiftTier): string {
  switch (tier) {
    case "legendary":
      return "border border-gold-500/50 shadow-[0_0_12px_rgba(212,175,55,0.15)]";
    case "rare":
      return "border border-gold-500/25";
    default:
      return "border border-transparent";
  }
}

interface GiftIconProps {
  id: string;
  emoji: string;
  assetUrl?: string;
  className?: string;
}

export function GiftIcon({ id, emoji, assetUrl, className = "w-8 h-8" }: GiftIconProps) {
  const finalAssetUrl = assetUrl || GIFT_ASSET_MAP[id];
  if (finalAssetUrl) {
    return <img src={finalAssetUrl} alt={id} className={`${className} object-contain drop-shadow-md`} aria-hidden />;
  }
  
  const Icon = GIFT_ICON_MAP[id];
  if (Icon) {
    return <Icon className={`${className} text-gold-400`} aria-hidden />;
  }
  return (
    <span className="text-3xl leading-none" aria-hidden>
      {emoji}
    </span>
  );
}
