import React from "react";
import { Medal, Trophy } from "lucide-react";
import {
  arcadeTextCyan,
  arcadeTextMagenta,
  arcadeTextYellow,
  arcadeTextDim,
} from "./arcade-ui";

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
        className={`w-5 h-5 ${arcadeTextYellow} ${className}`}
        aria-label="1er place"
      />
    );
  }
  if (rank === 2) {
    return (
      <Medal
        className={`w-5 h-5 ${arcadeTextCyan} ${className}`}
        aria-label="2e place"
      />
    );
  }
  if (rank === 3) {
    return (
      <Medal
        className={`w-5 h-5 ${arcadeTextMagenta} ${className}`}
        aria-label="3e place"
      />
    );
  }
  return (
    <span
      className={`font-bold text-sm ${arcadeTextDim} tabular-nums ${className}`}
    >
      #{rank}
    </span>
  );
}
