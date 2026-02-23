/**
 * OVHCloudBadge - "Powered by OVH Cloud Montréal" branding
 * For sponsor recognition and Quebec pride
 */

import React from "react";
import { cn } from "@/lib/utils";

interface OVHCloudBadgeProps {
  variant?: "minimal" | "full" | "hero";
  showFlag?: boolean;
  className?: string;
}

export const OVHCloudBadge: React.FC<OVHCloudBadgeProps> = ({
  variant = "full",
  showFlag = true,
  className,
}) => {
  const variants = {
    minimal: "text-xs px-2 py-1",
    full: "text-sm px-3 py-2",
    hero: "text-lg px-6 py-4",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg",
        "bg-gradient-to-r from-[#001b8f] to-[#000e4d]",
        "border border-[#d4af37]/30",
        "text-white font-medium",
        "shadow-lg shadow-blue-900/20",
        variants[variant],
        className
      )}
    >
      {/* OVH Logo mark */}
      <svg
        width={variant === "hero" ? 32 : 20}
        height={variant === "hero" ? 32 : 20}
        viewBox="0 0 32 32"
        fill="none"
        className="flex-shrink-0"
      >
        <rect width="32" height="32" rx="4" fill="#000e4d"/>
        <text
          x="50%"
          y="55%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="#d4af37"
          fontSize="14"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          OVH
        </text>
      </svg>

      {/* Text */}
      <div className="flex flex-col">
        <span className={cn("leading-tight", variant === "minimal" && "hidden")}>
          <span className="text-[#d4af37]">Powered by</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-bold">OVH Cloud</span>
          {showFlag && (
            <span className="text-base" title="Montréal, Québec">🇨🇦</span>
          )}
          <span className="text-[#d4af37] font-semibold">Montréal</span>
        </span>
      </div>
    </div>
  );
};

/**
 * Footer badge for site footer
 */
export const OVHCloudFooter: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <OVHCloudBadge variant="full" />
      
      <p className="text-xs text-muted-foreground max-w-md">
        Hébergé fièrement à Montréal sur l'infrastructure OVH Cloud.
        <br />
        Proudly hosted in Montreal on OVH Cloud infrastructure.
      </p>
      
      {/* Quebec flag colors accent */}
      <div className="flex gap-1">
        <div className="w-8 h-1 bg-[#003da5] rounded-full" />
        <div className="w-8 h-1 bg-white rounded-full" />
        <div className="w-8 h-1 bg-[#003da5] rounded-full" />
      </div>
    </div>
  );
};

/**
 * Hero section badge for landing pages
 */
export const OVHCloudHero: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-4 text-center py-8">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full" />
        
        <OVHCloudBadge variant="hero" showFlag />
      </div>
      
      <div className="space-y-1">
        <p className="text-lg font-medium text-[#d4af37]">
          Infrastructure québécoise
        </p>
        <p className="text-sm text-muted-foreground">
          Low latency • Data sovereignty • Local support
        </p>
      </div>
    </div>
  );
};

/**
 * Loading state with OVH branding
 */
export const OVHCloudLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      {/* Animated fleur-de-lys with OVH colors */}
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/30 blur-lg rounded-full animate-pulse" />
        <span className="relative text-4xl animate-bounce">
          ⚜️
        </span>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm font-medium">Chargement...</p>
        <OVHCloudBadge variant="minimal" />
      </div>
    </div>
  );
};

export default OVHCloudBadge;
