/**
 * VerifiedBadge - "Vérifié par Zyeuté" stamp for media cards
 * Modern Voyageur aesthetic: Gold, Smoked Glass, subtle glow
 * CSS-only, GPU-accelerated
 */

import React from "react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  variant?: "default" | "compact" | "glow";
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  variant = "default",
  className,
}) => {
  if (variant === "compact") {
    // Small icon-only version
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center",
          "w-6 h-6 rounded-full",
          "bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600",
          "shadow-[0_0_10px_rgba(255,215,0,0.4)]",
          "border border-gold-300/50",
          // GPU acceleration
          "transform-gpu",
          className,
        )}
        style={{ willChange: "transform" }}
        title="Vérifié par Zyeuté"
      >
        <svg
          className="w-3.5 h-3.5 text-black"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      </div>
    );
  }

  if (variant === "glow") {
    // Glowing version for featured content
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          // Smoked glass background
          "bg-black/60 backdrop-blur-md",
          // Gold border with glow
          "border border-gold-400/60",
          "shadow-[0_0_20px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          // Text
          "text-gold-400 text-xs font-bold tracking-wide uppercase",
          // Animation
          "animate-pulse",
          // GPU acceleration
          "transform-gpu",
          className,
        )}
        style={{ willChange: "transform, opacity" }}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
        </svg>
        <span>Vérifié</span>
      </div>
    );
  }

  // Default: Full badge with "Vérifié par Zyeuté"
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
        // Leather-like background with glass overlay
        "bg-gradient-to-r from-stone-900/90 via-stone-800/90 to-stone-900/90",
        "backdrop-blur-md",
        // Gold accent border
        "border border-gold-500/40",
        // Luxury shadow
        "shadow-[0_4px_12px_rgba(0,0,0,0.3),0_0_20px_rgba(255,215,0,0.15)]",
        // GPU acceleration
        "transform-gpu",
        className,
      )}
      style={{ willChange: "transform" }}
    >
      {/* Gold checkmark icon */}
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-[0_0_8px_rgba(255,215,0,0.5)]">
        <svg
          className="w-3 h-3 text-black"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className="text-gold-400 text-[10px] font-bold tracking-wider uppercase">
          Vérifié
        </span>
        <span className="text-stone-400 text-[8px] tracking-wide">
          par Zyeuté
        </span>
      </div>
    </div>
  );
};

export default VerifiedBadge;
