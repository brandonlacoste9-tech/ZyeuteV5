/**
 * LoadingScreen - Beautiful splash/loading screen with ornate logo
 */

import React from "react";
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
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold-400 rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative z-10 animate-fade-in">
        <LogoFull />
      </div>

      {/* Loading message and spinner */}
      <div className="relative z-10 mt-8 flex flex-col items-center gap-4">
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
