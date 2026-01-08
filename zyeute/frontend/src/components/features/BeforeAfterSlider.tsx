/**
 * BeforeAfterSlider - Video comparison slider component
 * Shows original vs processed video side-by-side with interactive slider
 * Premium Quebec Heritage Design with gold accents
 */

import React, { useRef, useState, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface BeforeAfterSliderProps {
  originalUrl: string;
  processedUrl: string;
  className?: string;
  filterName?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalUrl,
  processedUrl,
  filterName,
  className,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const processedVideoRef = useRef<HTMLVideoElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };
    const handleGlobalTouchEnd = () => setIsDragging(false);

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchmove", handleGlobalTouchMove);
    window.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isDragging]);

  // Sync video playback between original and processed
  useEffect(() => {
    if (!originalVideoRef.current || !processedVideoRef.current) return;
    const original = originalVideoRef.current;
    const processed = processedVideoRef.current;

    const syncPlayback = () => {
      if (Math.abs(original.currentTime - processed.currentTime) > 0.1) {
        processed.currentTime = original.currentTime;
      }
    };

    const syncPlay = () => {
      if (original.paused !== processed.paused) {
        if (original.paused) {
          processed.pause();
        } else {
          processed.play().catch(() => {});
        }
      }
    };

    original.addEventListener("timeupdate", syncPlayback);
    original.addEventListener("play", syncPlay);
    original.addEventListener("pause", syncPlay);

    return () => {
      original.removeEventListener("timeupdate", syncPlayback);
      original.removeEventListener("play", syncPlay);
      original.removeEventListener("pause", syncPlay);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black leather-card border-2 border-gold-500/30",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* Original Video (Background - Always Visible) */}
      <video
        ref={originalVideoRef}
        src={originalUrl}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        loop
        playsInline
        autoPlay
      />

      {/* Processed Video (Clipped Based on Slider Position) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <video
          ref={processedVideoRef}
          src={processedUrl}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          autoPlay
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-gold-500 shadow-[0_0_20px_rgba(255,191,0,0.8)] cursor-ew-resize z-10 transition-all"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gold-500 border-2 border-white shadow-[0_0_15px_rgba(255,191,0,0.6)] flex items-center justify-center hover:scale-110 transition-transform">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wider border border-leather-700">
        Original
      </div>
      <div className="absolute top-4 right-4 bg-gold-500/90 backdrop-blur-sm px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wider border border-gold-400 shadow-[0_0_10px_rgba(255,191,0,0.4)]">
        {filterName || "Amélioré"} ✨
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-xl text-white text-xs text-center border border-gold-500/30">
        <span className="text-gold-400">←</span> Glisse pour comparer{" "}
        <span className="text-gold-400">→</span>
      </div>
    </div>
  );
};
