import React from "react";
import { Medal, Trophy } from "lucide-react";

interface ArcadeRankBadgeProps {
  rank: number;
  className?: string;
}

export function ArcadeRankBadge({
  rank,
  className = "",
}: ArcadeRankBadgeProps) {
  if (rank === 1) {
    return (
      <Trophy
        className={`w-5 h-5 text-gold-400 ${className}`}
        aria-label="1er place"
      />
    );
  }
  if (rank === 2) {
    return (
      <Medal
        className={`w-5 h-5 text-zinc-300 ${className}`}
        aria-label="2e place"
      />
    );
  }
  if (rank === 3) {
    return (
      <Medal
        className={`w-5 h-5 text-amber-700 ${className}`}
        aria-label="3e place"
      />
    );
  }
  return (
    <span
      className={`font-black text-sm text-leather-400 tabular-nums ${className}`}
    >
      #{rank}
    </span>
  );
}
