/**
 * LoadingScreen - Beautiful splash/loading screen with ornate logo
 * Shows logo for 1 second, then fades in loading spinner
 */

import React, { useState, useEffect } from "react";
import { LogoFull } from "./Logo";
import { cn } from "../lib/utils";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Chargement...",
  className,
}) => {
  const [showSpinner, setShowSpinner] = useState(false);

  // Generate stable particle positions (memoized to avoid re-render issues)
  const particles = React.useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      key: i,
      left: `${(i * 17) % 100}%`,
      top: `${(i * 23) % 100}%`,
      delay: `${(i * 0.15) % 3}s`,
      duration: `${2 + (i % 3)}s`,
    }));
  }, []);

  useEffect(() => {
    // Show spinner after 1 second (logo-only intro)
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center",
        "bg-gradient-to-br from-black via-gray-900 to-black",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(circle at center, rgba(245, 200, 66, 0.1) 0%, transparent 70%)",
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.key}
            className="absolute w-1 h-1 bg-gold-400 rounded-full opacity-20 animate-pulse"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Logo - always visible */}
      <div className="relative z-10 animate-fade-in">
        <LogoFull />
      </div>

      {/* Loading message and spinner - fade in after 1 second */}
      <div
        className={`relative z-10 mt-8 flex flex-col items-center gap-4 transition-all duration-500 ${
          showSpinner ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <p className="text-white/80 text-lg font-medium animate-pulse">
          {message}
        </p>

        {/* Loading spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gold-400/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-gold-400 rounded-full animate-spin" />
        </div>
      </div>

      {/* Bottom tagline */}
      <div className="absolute bottom-8 text-center">
        <p className="text-white/40 text-sm">
          Fait au Québec, pour le Québec 🇨🇦⚜️
        </p>
      </div>
    </div>
  );
};

/**
 * Mini loading spinner (for inline use)
 */
export const LoadingSpinner: React.FC<{
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ size = "md", className }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <div className="absolute inset-0 border border-gold-400/20 rounded-full" />
      <div className="absolute inset-0 border border-transparent border-t-gold-400 rounded-full animate-spin" />
    </div>
  );
};

export default LoadingScreen;
