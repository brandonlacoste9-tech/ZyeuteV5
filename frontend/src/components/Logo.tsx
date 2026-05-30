/**
 * Zyeuté Logo Component
 * Golden Stitched Fleur-de-lys Emblem on Dark Leather
 * Premium Quebec Heritage Design
 */

import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  linkTo?: string | null;
  className?: string;
  glowing?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  linkTo = "/",
  className = "",
  glowing = true,
}) => {
  const sizeConfig = {
    sm: {
      container: "w-10 h-10",
      icon: "w-6 h-6",
      text: "text-lg",
      blur: "8px",
      stitch: "3px",
    },
    md: {
      container: "w-14 h-14",
      icon: "w-8 h-8",
      text: "text-2xl",
      blur: "12px",
      stitch: "4px",
    },
    lg: {
      container: "w-20 h-20",
      icon: "w-12 h-12",
      text: "text-3xl",
      blur: "16px",
      stitch: "5px",
    },
    xl: {
      container: "w-28 h-28",
      icon: "w-16 h-16",
      text: "text-5xl",
      blur: "24px",
      stitch: "6px",
    },
  };

  const config = sizeConfig[size];

  const logoContent = (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Logo Container - Leather Badge with Golden Stitching */}
      <div className="relative">
        {/* Outer Glow Effect */}
        {glowing && (
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255,215,0,0.35) 0%, transparent 70%)",
              filter: `blur(${config.blur})`,
              transform: "scale(1.6)",
            }}
          />
        )}

        {/* Main Logo Box - Leather with Stitching */}
        <div
          className={`${config.container} relative rounded-2xl flex items-center justify-center overflow-visible`}
          style={{
            background: `
              radial-gradient(ellipse at 40% 30%, rgba(80, 60, 45, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 60% 70%, rgba(60, 45, 35, 0.3) 0%, transparent 50%),
              linear-gradient(145deg, #3a2a22 0%, #251a15 50%, #1a1210 100%)
            `,
            boxShadow: glowing
              ? `0 0 25px rgba(255,215,0,0.4), 0 0 50px rgba(255,215,0,0.15), 0 8px 25px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)`
              : "0 8px 25px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)",
          }}
        >
          {/* Gold Stitching Border */}
          <div
            className="absolute rounded-xl pointer-events-none"
            style={{
              inset: config.stitch,
              border: "2px dashed rgba(218, 165, 32, 0.8)",
              boxShadow: glowing
                ? "0 0 8px rgba(255, 215, 0, 0.6), inset 0 0 6px rgba(255, 215, 0, 0.3)"
                : "0 0 4px rgba(255, 215, 0, 0.3)",
            }}
          />

          {/* Corner Stitch Reinforcements */}
          <div
            className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 rounded-tl"
            style={{
              borderColor: "rgba(255,215,0,0.7)",
              borderStyle: "dashed",
            }}
          />
          <div
            className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 rounded-tr"
            style={{
              borderColor: "rgba(255,215,0,0.7)",
              borderStyle: "dashed",
            }}
          />
          <div
            className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 rounded-bl"
            style={{
              borderColor: "rgba(255,215,0,0.7)",
              borderStyle: "dashed",
            }}
          />
          <div
            className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 rounded-br"
            style={{
              borderColor: "rgba(255,215,0,0.7)",
              borderStyle: "dashed",
            }}
          />

          {/* Fleur-de-lys SVG with Stitched Embroidery Effect */}
          <svg
            viewBox="0 0 100 120"
            className={`${config.icon} relative z-10`}
            style={{
              filter: glowing
                ? "drop-shadow(0 0 6px rgba(255,215,0,0.9)) drop-shadow(0 0 12px rgba(255,215,0,0.5)) drop-shadow(0 0 20px rgba(255,215,0,0.3))"
                : "drop-shadow(0 0 4px rgba(255,215,0,0.5))",
            }}
          >
            <defs>
              {/* Golden thread gradient */}
              <linearGradient id="goldThread" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE55C" />
                <stop offset="25%" stopColor="#FFD700" />
                <stop offset="50%" stopColor="#FFC125" />
                <stop offset="75%" stopColor="#DAA520" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
              {/* Inner highlight */}
              <linearGradient
                id="goldHighlight"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FFF8DC" />
                <stop offset="50%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#CD9B1D" />
              </linearGradient>
              {/* Glow filter for embroidery effect */}
              <filter
                id="embroideryGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="1" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Main Fleur-de-lys with embroidered look */}
            <g
              fill="url(#goldThread)"
              stroke="url(#goldHighlight)"
              strokeWidth="2"
              filter="url(#embroideryGlow)"
            >
              {/* Center Petal */}
              <path d="M50 8 C50 8 42 25 42 35 C42 42 45 48 50 52 C55 48 58 42 58 35 C58 25 50 8 50 8 Z" />

              {/* Left Petal */}
              <path d="M38 38 C28 32 18 35 18 48 C18 58 28 62 38 58 C45 55 48 50 50 45 C48 42 44 40 38 38 Z" />

              {/* Right Petal */}
              <path d="M62 38 C72 32 82 35 82 48 C82 58 72 62 62 58 C55 55 52 50 50 45 C52 42 56 40 62 38 Z" />

              {/* Center Stem */}
              <path d="M46 52 L46 75 L54 75 L54 52 C52 54 48 54 46 52 Z" />

              {/* Left Curl */}
              <path d="M46 65 C40 70 32 75 28 82 C24 90 28 98 38 96 C44 94 46 88 46 82 L46 65 Z" />

              {/* Right Curl */}
              <path d="M54 65 C60 70 68 75 72 82 C76 90 72 98 62 96 C56 94 54 88 54 82 L54 65 Z" />

              {/* Base Band */}
              <rect x="38" y="72" width="24" height="6" rx="2" />
            </g>

            {/* Stitch detail lines */}
            <g
              stroke="rgba(255,248,220,0.5)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              fill="none"
            >
              <path d="M50 12 C50 12 44 26 44 35 C44 40 46 46 50 50" />
              <path d="M50 12 C50 12 56 26 56 35 C56 40 54 46 50 50" />
            </g>
          </svg>
        </div>

        {/* "Québec" Text Under Logo */}
        {size === "xl" && (
          <p
            className="text-center text-xs font-bold tracking-[0.25em] mt-2"
            style={{
              color: "#DAA520",
              textShadow: glowing
                ? "0 0 10px rgba(255,215,0,0.6), 0 1px 2px rgba(0,0,0,0.8)"
                : "0 1px 2px rgba(0,0,0,0.8)",
            }}
          >
            QUÉBEC
          </p>
        )}
      </div>

      {/* Brand Text - Golden Stitched Leather Lettering */}
      {showText && (
        <div className="flex flex-col items-center">
          <span
            className={`${config.text} font-black tracking-wide relative`}
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: 900,
              letterSpacing: "0.02em",
              background:
                "linear-gradient(180deg, #FFF8DC 0%, #FFE55C 15%, #FFD700 30%, #DAA520 60%, #B8860B 85%, #8B6914 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: glowing
                ? "drop-shadow(0 0 8px rgba(255,215,0,0.7)) drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
                : "drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
              WebkitTextStroke: glowing ? "0.5px rgba(184,134,11,0.3)" : "none",
            }}
          >
            Zyeuté
          </span>
          {size !== "sm" && (
            <span
              className="text-[0.55em] font-semibold tracking-[0.2em] uppercase mt-0.5"
              style={{
                color: "#B8860B",
                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
              }}
            >
              L&apos;app sociale du Québec
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo === null) {
    return logoContent;
  }

  return (
    <Link
      to={linkTo}
      className="transition-transform hover:scale-105 duration-300"
    >
      {logoContent}
    </Link>
  );
};

// Compact logo for headers
export const LogoCompact: React.FC<{ className?: string }> = ({
  className,
}) => <Logo size="sm" showText={false} className={className} />;

// Full logo for splash screens
export const LogoFull: React.FC<{ className?: string }> = ({ className }) => (
  <Logo size="xl" showText={true} linkTo={null} className={className} />
);

export default Logo;
