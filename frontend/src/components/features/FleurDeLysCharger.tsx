/**
 * FleurDeLysCharger - Gold charging animation component
 * TI-GUY boost/charging effect
 */

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/utils/haptics";

interface FleurDeLysChargerProps {
  progress: number; // 0-100
  isCharging: boolean;
  onComplete?: () => void;
  size?: "sm" | "md" | "lg";
}

export const FleurDeLysCharger: React.FC<FleurDeLysChargerProps> = ({
  progress,
  isCharging,
  onComplete,
  size = "md",
}) => {
  const [showFlash, setShowFlash] = useState(false);
  const [prevProgress, setPrevProgress] = useState(0);
  const haptics = useHaptics();

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  // Milestone haptics
  useEffect(() => {
    const milestones = [25, 50, 75];
    
    for (const milestone of milestones) {
      if (prevProgress < milestone && progress >= milestone) {
        haptics.fleurDeLysPulse();
      }
    }
    
    setPrevProgress(progress);
  }, [progress, prevProgress, haptics]);

  // Complete animation
  useEffect(() => {
    if (progress >= 100 && isCharging) {
      haptics.chargingComplete();
      setShowFlash(true);
      
      setTimeout(() => {
        setShowFlash(false);
        onComplete?.();
      }, 300);
    }
  }, [progress, isCharging, onComplete, haptics]);

  // Start haptic
  useEffect(() => {
    if (isCharging && progress === 0) {
      haptics.chargingStart();
    }
  }, [isCharging, progress, haptics]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative", sizeClasses[size])}>
      {/* Outer glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-500",
          isCharging && "animate-pulse"
        )}
        style={{
          background: `radial-gradient(circle, rgba(212,175,55,${0.1 + (progress / 200)}) 0%, transparent 70%)`,
          transform: `scale(${1 + progress / 500})`,
        }}
      />

      {/* Charging ring */}
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 100 100"
      >
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#2e1a12"
          strokeWidth="4"
        />
        
        {/* Progress ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 0.3s ease-out",
            filter: "drop-shadow(0 0 4px rgba(212,175,55,0.5))",
          }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset={`${progress}%`} stopColor="#d4af37" />
            <stop offset="100%" stopColor="#f4d03f" />
          </linearGradient>
        </defs>
      </svg>

      {/* Fleur-de-lys */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-300",
          showFlash && "scale-110"
        )}
      >
        <span
          className="text-4xl select-none"
          style={{
            filter: `
              brightness(${0.5 + progress / 200})
              drop-shadow(0 0 ${progress / 10}px rgba(212,175,55,${progress / 100}))
            `,
            transform: `scale(${1 + (progress >= 100 ? 0.05 : 0)})`,
            transition: "all 0.3s ease-out",
          }}
        >
          ⚜️
        </span>
      </div>

      {/* Gold highlight wipe */}
      <div
        className="absolute inset-4 rounded-full overflow-hidden pointer-events-none"
        style={{
          background: `linear-gradient(
            to top,
            transparent ${100 - progress}%,
            rgba(212,175,55,0.3) ${100 - progress}%,
            rgba(244,208,63,0.5) 100%
          )`,
          transition: "background 0.3s ease-out",
        }}
      />

      {/* Particles */}
      {isCharging && progress < 100 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${50 + Math.sin(i) * 30}%`,
                bottom: `${(progress / 100) * 80 + Math.random() * 20}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1.5s",
              }}
            />
          ))}
        </div>
      )}

      {/* Flash on complete */}
      {showFlash && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            background: "radial-gradient(circle, rgba(244,208,63,0.8) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Progress text */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <span className="text-gold-400 text-sm font-bold">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

export default FleurDeLysCharger;
