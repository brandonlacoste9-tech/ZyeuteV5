/**
 * Logo Component — Zyeuté gold flame-eye with wordmark
 * Matches the App Store icon: dark background, gold flame eye, ZYEUTE wordmark
 */

import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  linkTo?: string;
}

const ICON_SIZES = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  md: "w-10 h-10",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const TEXT_SIZES = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-5xl",
};

/** Inline gold flame-eye SVG — matches the app icon exactly */
export const FlameEyeIcon: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Outer eye shape */}
    <path
      d="M10 50 C30 20, 70 20, 90 50 C70 80, 30 80, 10 50Z"
      fill="url(#eyeGrad)"
      stroke="url(#goldStroke)"
      strokeWidth="2"
    />
    {/* Iris */}
    <circle cx="50" cy="50" r="18" fill="url(#irisGrad)" />
    {/* Pupil */}
    <circle cx="50" cy="50" r="8" fill="#0a0800" />
    {/* Iris glow ring */}
    <circle
      cx="50"
      cy="50"
      r="18"
      fill="none"
      stroke="url(#irisRing)"
      strokeWidth="2"
    />
    {/* Upper flame lash */}
    <path
      d="M38 32 C42 18, 52 12, 58 8 C60 16, 56 22, 52 26 C62 20, 70 18, 76 22 C72 30, 64 32, 56 30 C60 28, 62 24, 60 20 C56 26, 48 30, 44 36Z"
      fill="url(#flameGrad)"
    />
    {/* Lower eye line */}
    <path
      d="M18 54 C30 64, 70 64, 82 54"
      stroke="url(#goldStroke)"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Highlight */}
    <ellipse cx="44" cy="45" rx="4" ry="3" fill="rgba(255,255,200,0.25)" />
    <defs>
      <linearGradient id="eyeGrad" x1="10" y1="50" x2="90" y2="50">
        <stop offset="0%" stopColor="#1a1200" />
        <stop offset="100%" stopColor="#0d0800" />
      </linearGradient>
      <linearGradient id="goldStroke" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="50%" stopColor="#C9A227" />
        <stop offset="100%" stopColor="#8B6914" />
      </linearGradient>
      <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF8C00" />
        <stop offset="40%" stopColor="#D4500A" />
        <stop offset="100%" stopColor="#6B1A00" />
      </radialGradient>
      <linearGradient id="irisRing" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#C9A227" stopOpacity="0.4" />
      </linearGradient>
      <linearGradient id="flameGrad" x1="38" y1="36" x2="76" y2="8">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="40%" stopColor="#FF8C00" />
        <stop offset="100%" stopColor="#FF4500" />
      </linearGradient>
    </defs>
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = false,
  className,
  linkTo = "/",
}) => {
  const logoContent = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Icon */}
      <div
        className={cn("relative flex-shrink-0", ICON_SIZES[size])}
        style={{ filter: "drop-shadow(0 0 6px rgba(212,175,55,0.5))" }}
      >
        <FlameEyeIcon className="w-full h-full" />
      </div>

      {/* Wordmark */}
      {showText && (
        <span
          className={cn(
            "font-black tracking-widest uppercase leading-none",
            TEXT_SIZES[size],
          )}
          style={{
            background:
              "linear-gradient(135deg, #FFD700 0%, #C9A227 50%, #FFE566 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
            filter: "drop-shadow(0 0 4px rgba(212,175,55,0.4))",
          }}
        >
          Zyeuté
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-90 transition-opacity">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

/**
 * Full Logo — splash/loading screens
 */
export const LogoFull: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("relative flex flex-col items-center gap-4", className)}>
      <div
        className="relative w-28 h-28"
        style={{ filter: "drop-shadow(0 0 20px rgba(212,175,55,0.6))" }}
      >
        <FlameEyeIcon className="w-full h-full" />
      </div>
      <div className="text-center">
        <h1
          className="text-4xl font-black tracking-widest uppercase"
          style={{
            background:
              "linear-gradient(135deg, #FFD700 0%, #C9A227 50%, #FFE566 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Zyeuté
        </h1>
        <p className="text-gold-500/70 text-xs tracking-widest uppercase mt-1">
          L'App du Québec ⚜
        </p>
      </div>
    </div>
  );
};

export default Logo;
