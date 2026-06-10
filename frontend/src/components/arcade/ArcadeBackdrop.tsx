import React, { type ReactNode } from "react";
import "./arcade-retro.css";

interface ArcadeBackdropProps {
  children: ReactNode;
  className?: string;
  /** Show CRT scanline overlay (default true). */
  scanlines?: boolean;
}

export function ArcadeBackdrop({
  children,
  className = "",
  scanlines = true,
}: ArcadeBackdropProps) {
  return (
    <div
      className={`arcade-room arcade-vignette arcade-font-body ${scanlines ? "arcade-crt" : ""} ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
