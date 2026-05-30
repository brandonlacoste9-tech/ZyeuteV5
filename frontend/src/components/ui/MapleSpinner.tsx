import React from "react";
import { cn } from "../../lib/utils";

interface MapleSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const MapleSpinner: React.FC<MapleSpinnerProps> = ({
  className,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label="Chargement"
    >
      {/* Outer Ring Pulse */}
      <div className="absolute inset-0 rounded-full border-2 border-gold-500/10 animate-ping" />

      {/* Spinning Container */}
      <div className="relative w-full h-full animate-[spin_3s_linear_infinite]">
        {/* Maple Leaf SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-full h-full text-gold-500 drop-shadow-[0_0_10px_rgba(244,196,48,0.5)]"
        >
          <path d="M11.96 0c.23 2.53.5 5.5.5 5.5l1.83-2.18.9 4.3 3.82-2.12-.55 3.32 4.1.37-3.4 2.6L24 16.27l-4.5 2.18-.32 4.45-3.8-2.65L12.02 24l-3.23-3.77-3.88 2.55-.3-4.43L0 16.15l4.63-4.32-3.32-2.5 4.07-.4-1-3.26 3.96 2.05.9-4.3 2.1 2.56S11.75 2.53 11.96 0" />
        </svg>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-gold-400 rounded-full blur-md opacity-50 animate-pulse" />
      <span className="sr-only">Chargement en cours...</span>
    </div>
  );
};
