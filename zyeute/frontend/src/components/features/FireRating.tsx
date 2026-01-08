/**
 * FireRating - 5-fire rating system for posts
 */

import React, { useState } from "react";
import { cn } from "../../lib/utils";

export interface FireRatingProps {
  postId: string;
  currentRating?: number;
  averageRating?: number;
  totalRatings?: number;
  onRate?: (level: number) => Promise<void>;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const FireRating: React.FC<FireRatingProps> = ({
  postId: _postId,
  currentRating = 0,
  averageRating,
  totalRatings = 0,
  onRate,
  readonly = false,
  size = "md",
  className,
}) => {
  const [hoveredFire, setHoveredFire] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);

  const handleRate = async (level: number) => {
    if (readonly || isRating || !onRate) return;

    setIsRating(true);
    try {
      await onRate(level);
    } finally {
      setIsRating(false);
    }
  };

  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const displayRating = hoveredFire !== null ? hoveredFire : currentRating;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Fire icons */}
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => !readonly && setHoveredFire(null)}
      >
        {[1, 2, 3, 4, 5].map((level) => {
          const isActive = level <= displayRating;
          const isHovered = hoveredFire !== null && level <= hoveredFire;

          return (
            <button
              key={level}
              onClick={() => handleRate(level)}
              onMouseEnter={() => !readonly && setHoveredFire(level)}
              disabled={readonly || isRating}
              className={cn(
                sizes[size],
                "transition-all duration-200 cursor-pointer disabled:cursor-default",
                isActive && "scale-110",
                isHovered && "scale-125",
                readonly && "cursor-default",
              )}
              aria-label={`Rate ${level} fires`}
            >
              <span
                className={cn(
                  "inline-block transition-all duration-200",
                  isActive
                    ? "brightness-100 drop-shadow-[0_0_8px_rgba(255,165,0,0.8)]"
                    : "brightness-50 grayscale opacity-40",
                )}
                style={{
                  filter: isActive
                    ? `brightness(1) drop-shadow(0 0 8px rgba(255,165,0,0.8))`
                    : "brightness(0.5) grayscale(1)",
                }}
              >
                🔥
              </span>
            </button>
          );
        })}
      </div>

      {/* Rating info */}
      {averageRating !== undefined && totalRatings > 0 && (
        <div className="text-xs text-white/60">
          {averageRating.toFixed(1)} / 5.0 ({totalRatings}{" "}
          {totalRatings === 1 ? "vote" : "votes"})
        </div>
      )}

      {/* Loading state */}
      {isRating && (
        <div className="text-xs text-gold-400 animate-pulse">Envoi...</div>
      )}
    </div>
  );
};

/**
 * Compact fire count display
 */
export const FireCount: React.FC<{
  count: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ count, size = "md", className }) => {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={cn("flex items-center gap-1.5", sizes[size], className)}>
      <span className="text-orange-500">🔥</span>
      <span className="text-white font-semibold">
        {count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count}
      </span>
    </div>
  );
};
