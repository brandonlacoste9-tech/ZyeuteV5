/**
 * TIGuyBatteryTotem - Low battery indicator with fleur-de-lys
 * Graded warnings: normal → low → critical
 */

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/utils/haptics";

interface TIGuyBatteryTotemProps {
  level: number; // 0-1
  isCharging?: boolean;
  showBanner?: boolean;
}

type BatteryStatus = "normal" | "low" | "critical";

const STATUS_CONFIG = {
  normal: {
    color: "#D4AF37", // Gold
    glowOpacity: 0.3,
    pulseSpeed: "3s",
    message: null,
  },
  low: {
    color: "#FF9500", // Amber
    glowOpacity: 0.2,
    pulseSpeed: "4s",
    message: "TI-GUY: batterie faible, branche-toi bientôt.",
  },
  critical: {
    color: "#FF3B30", // Red
    glowOpacity: 0.15,
    pulseSpeed: "2s",
    message: "TI-GUY risque de s'endormir. Branche l'appareil maintenant.",
  },
};

export const TIGuyBatteryTotem: React.FC<TIGuyBatteryTotemProps> = ({
  level,
  isCharging = false,
  showBanner = true,
}) => {
  const [status, setStatus] = useState<BatteryStatus>("normal");
  const [prevStatus, setPrevStatus] = useState<BatteryStatus>("normal");
  const [showShake, setShowShake] = useState(false);
  const haptics = useHaptics();

  // Determine status from level
  useEffect(() => {
    const newStatus: BatteryStatus =
      level > 0.25 ? "normal" : level > 0.1 ? "low" : "critical";

    if (newStatus !== status) {
      setPrevStatus(status);
      setStatus(newStatus);
    }
  }, [level, status]);

  // Haptic feedback on status change
  useEffect(() => {
    if (prevStatus === status) return;

    if (status === "low") {
      haptics.tap(); // Light warning
    } else if (status === "critical") {
      haptics.error(); // Stronger warning
      setShowShake(true);
      setTimeout(() => setShowShake(false), 500);
    }
  }, [status, prevStatus, haptics]);

  const config = STATUS_CONFIG[status];
  const isLow = status !== "normal";

  return (
    <div className="relative">
      {/* Banner notification */}
      {showBanner && isLow && (
        <div
          className={cn(
            "absolute -top-16 left-0 right-0 px-4 py-2 rounded-lg",
            "text-sm font-medium text-center",
            "animate-in slide-in-from-top-2",
            status === "low" && "bg-amber-500/20 border border-amber-500/50 text-amber-300",
            status === "critical" && "bg-red-500/20 border border-red-500/50 text-red-300"
          )}
        >
          {config.message}
        </div>
      )}

      {/* Fleur-de-lys totem */}
      <div
        className={cn(
          "relative w-16 h-16 flex items-center justify-center",
          showShake && "animate-shake"
        )}
      >
        {/* Glow halo */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${config.color}${Math.round(
              config.glowOpacity * 255
            ).toString(16)} 0%, transparent 70%)`,
            animationDuration: config.pulseSpeed,
          }}
        />

        {/* Inner ring - thinner when low */}
        <div
          className="absolute inset-2 rounded-full border-2"
          style={{
            borderColor: config.color,
            opacity: isLow ? 0.5 : 0.8,
          }}
        />

        {/* Fleur-de-lys icon */}
        <span
          className="relative text-3xl transition-colors duration-500"
          style={{
            color: config.color,
            filter: `drop-shadow(0 0 8px ${config.color})`,
          }}
        >
          ⚜️
        </span>

        {/* Charging indicator */}
        {isCharging && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">
            ⚡
          </div>
        )}

        {/* Low battery drip particles */}
        {status === "low" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full animate-ping"
                style={{
                  background: config.color,
                  left: `${40 + i * 10}%`,
                  top: "80%",
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: "2s",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Percentage text */}
      <div
        className={cn(
          "text-center text-xs font-bold mt-1",
          status === "normal" && "text-gold-400",
          status === "low" && "text-amber-400",
          status === "critical" && "text-red-400"
        )}
      >
        {Math.round(level * 100)}%
      </div>
    </div>
  );
};

/**
 * Hook for web battery API
 */
export function useDeviceBattery() {
  const [level, setLevel] = useState(1);
  const [isCharging, setIsCharging] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!("getBattery" in navigator)) {
      setSupported(false);
      return;
    }

    let battery: any;

    navigator.getBattery().then((bat) => {
      battery = bat;
      setLevel(bat.level);
      setIsCharging(bat.charging);

      const handleLevelChange = () => setLevel(bat.level);
      const handleChargingChange = () => setIsCharging(bat.charging);

      bat.addEventListener("levelchange", handleLevelChange);
      bat.addEventListener("chargingchange", handleChargingChange);

      return () => {
        bat.removeEventListener("levelchange", handleLevelChange);
        bat.removeEventListener("chargingchange", handleChargingChange);
      };
    });
  }, []);

  return { level, isCharging, supported };
}

/**
 * Shake animation keyframes
 */
const shakeKeyframes = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-3px); }
    75% { transform: translateX(3px); }
  }
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = shakeKeyframes;
  document.head.appendChild(style);
}

export default TIGuyBatteryTotem;
