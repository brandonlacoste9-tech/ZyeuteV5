/**
 * AmbientGlow - Room lighting effects for TI-GUY
 * Subtle, mood-based ambient lighting with breathing animation
 */

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type AmbientMode = 
  | "default"
  | "ti-guy-thinking"
  | "ti-guy-charging"
  | "ti-guy-royal"
  | "night"
  | "warning";

interface AmbientGlowProps {
  mode?: AmbientMode;
  charge?: number; // 0-1 for charging animations
  intensity?: "low" | "medium" | "high";
  children: React.ReactNode;
  className?: string;
}

// Color palettes for each mode
const MODE_COLORS: Record<AmbientMode, { start: string; end: string; accent: string }> = {
  default: {
    start: "rgba(30, 58, 95, 0.15)",    // Deep navy
    end: "rgba(20, 40, 60, 0.05)",      // Muted teal
    accent: "rgba(212, 175, 55, 0.1)",  // Gold hint
  },
  "ti-guy-thinking": {
    start: "rgba(124, 58, 237, 0.2)",   // Purple
    end: "rgba(91, 33, 182, 0.08)",     // Deep purple
    accent: "rgba(167, 139, 250, 0.15)", // Light purple
  },
  "ti-guy-charging": {
    start: "rgba(212, 175, 55, 0.25)",  // Gold
    end: "rgba(139, 115, 85, 0.1)",     // Warm brown
    accent: "rgba(244, 208, 63, 0.2)",  // Bright gold
  },
  "ti-guy-royal": {
    start: "rgba(30, 58, 95, 0.2)",     // Royal blue
    end: "rgba(20, 30, 50, 0.1)",       // Deep navy
    accent: "rgba(212, 175, 55, 0.25)", // Gold edge
  },
  night: {
    start: "rgba(15, 23, 42, 0.3)",     // Cool dark blue
    end: "rgba(10, 15, 30, 0.15)",      // Almost black
    accent: "rgba(100, 116, 139, 0.1)", // Cool gray
  },
  warning: {
    start: "rgba(239, 68, 68, 0.15)",   // Red
    end: "rgba(153, 27, 27, 0.08)",     // Dark red
    accent: "rgba(252, 165, 165, 0.1)", // Light red
  },
};

const INTENSITY_MULTIPLIER = {
  low: 0.5,
  medium: 1,
  high: 1.5,
};

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  mode = "default",
  charge = 1,
  intensity = "medium",
  children,
  className,
}) => {
  const colors = MODE_COLORS[mode];
  const multiplier = INTENSITY_MULTIPLIER[intensity];
  const breathRef = useRef<HTMLDivElement>(null);

  // Breathing animation - 10s cycle
  useEffect(() => {
    if (!breathRef.current) return;

    const element = breathRef.current;
    let startTime: number;
    const duration = 10000; // 10s breath cycle

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;

      // Sine wave for smooth breathing
      const breath = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
      const opacity = 0.3 + breath * 0.2; // 0.3 to 0.5

      element.style.opacity = String(opacity);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Calculate charge-shifted colors for charging mode
  const getChargingColors = () => {
    if (mode !== "ti-guy-charging") return colors;

    // Shift toward gold as charge increases
    const goldIntensity = charge;
    return {
      start: `rgba(${30 + 182 * goldIntensity}, ${58 + 117 * goldIntensity}, ${95 - 20 * goldIntensity}, ${0.15 + 0.1 * goldIntensity})`,
      end: colors.end,
      accent: `rgba(244, 208, 63, ${0.1 + 0.15 * goldIntensity})`,
    };
  };

  const activeColors = getChargingColors();

  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* Base ambient layer with breathing */}
      <div
        ref={breathRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, ${activeColors.start} 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, ${activeColors.end} 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, ${activeColors.accent} 0%, transparent 70%)
          `,
          opacity: 0.4 * multiplier,
        }}
      />

      {/* Mode-specific accent glow */}
      <div
        className={cn(
          "fixed inset-0 pointer-events-none transition-all duration-1000",
          mode === "ti-guy-thinking" && "animate-pulse"
        )}
        style={{
          background:
            mode === "ti-guy-thinking"
              ? `radial-gradient(circle at 20% 80%, ${colors.accent} 0%, transparent 40%)`
              : mode === "ti-guy-royal"
              ? `linear-gradient(135deg, transparent 0%, ${colors.accent} 50%, transparent 100%)`
              : "none",
          opacity: 0.3 * multiplier,
        }}
      />

      {/* Vignette for night mode */}
      {mode === "night" && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * Hook for ambient lighting based on TI-GUY state
 */
export function useAmbientLighting(
  isThinking: boolean,
  isCharging: boolean,
  chargeLevel: number,
  isNightMode: boolean
): { mode: AmbientMode; charge: number } {
  let mode: AmbientMode = "default";

  if (isNightMode) {
    mode = "night";
  } else if (isCharging) {
    mode = "ti-guy-charging";
  } else if (isThinking) {
    mode = "ti-guy-thinking";
  }

  return { mode, charge: chargeLevel };
}

/**
 * Message glow effect for new messages
 */
export const MessageGlow: React.FC<{
  isActive: boolean;
  isMention?: boolean;
}> = ({ isActive, isMention }) => {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 rounded-2xl pointer-events-none",
        isMention ? "bg-purple-500/10" : "bg-gold-500/5"
      )}
      style={{
        animation: "messagePulse 0.6s ease-out",
      }}
    />
  );
};

// Add keyframes
const keyframes = `
  @keyframes messagePulse {
    0% { opacity: 0; transform: scale(0.95); }
    50% { opacity: 1; }
    100% { opacity: 0; transform: scale(1.05); }
  }
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = keyframes;
  document.head.appendChild(style);
}

export default AmbientGlow;
