/**
 * AmbientGlow - Room lighting effects for chat
 */

import React from "react";
import { cn } from "@/lib/utils";

interface AmbientGlowProps {
  theme?: "default" | "ti-guy" | "gold" | "purple";
  intensity?: "low" | "medium" | "high";
  isPulsing?: boolean;
  children: React.ReactNode;
}

const THEME_COLORS = {
  default: {
    primary: "rgba(212, 175, 55, 0.1)",
    secondary: "rgba(139, 115, 85, 0.05)",
  },
  "ti-guy": {
    primary: "rgba(124, 58, 237, 0.15)",
    secondary: "rgba(91, 33, 182, 0.08)",
  },
  gold: {
    primary: "rgba(244, 208, 63, 0.2)",
    secondary: "rgba(212, 175, 55, 0.1)",
  },
  purple: {
    primary: "rgba(147, 51, 234, 0.15)",
    secondary: "rgba(126, 34, 206, 0.08)",
  },
};

const INTENSITY_MULTIPLIER = {
  low: 0.5,
  medium: 1,
  high: 1.5,
};

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  theme = "default",
  intensity = "medium",
  isPulsing = false,
  children,
}) => {
  const colors = THEME_COLORS[theme];
  const multiplier = INTENSITY_MULTIPLIER[intensity];

  return (
    <div className="relative">
      {/* Background glow */}
      <div
        className={cn(
          "absolute -inset-20 rounded-[100px] blur-3xl pointer-events-none transition-all duration-500",
          isPulsing && "animate-pulse"
        )}
        style={{
          background: `
            radial-gradient(
              circle at 50% 50%,
              ${colors.primary.replace(/[\d.]+\)$/, `${0.1 * multiplier})`)} 0%,
              ${colors.secondary.replace(/[\d.]+\)$/, `${0.05 * multiplier})`)} 50%,
              transparent 70%
            )
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * MessageGlow - New message pulse effect
 */
export const MessageGlow: React.FC<{
  isActive: boolean;
  isMention?: boolean;
}> = ({ isActive, isMention }) => {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 rounded-2xl animate-ping pointer-events-none",
        isMention ? "bg-purple-500/20" : "bg-gold-500/10"
      )}
      style={{
        animationDuration: "0.6s",
        animationIterationCount: "1",
      }}
    />
  );
};

/**
 * AITypingGlow - Breathing glow for TI-GUY typing
 */
export const AITypingGlow: React.FC<{ isTyping: boolean }> = ({ isTyping }) => {
  return (
    <div
      className={cn(
        "absolute -inset-4 rounded-full blur-xl transition-all duration-1000",
        isTyping ? "opacity-100 animate-pulse" : "opacity-0"
      )}
      style={{
        background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
        transform: isTyping ? "scale(1.1)" : "scale(1)",
      }}
    />
  );
};

export default AmbientGlow;
