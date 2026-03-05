/**
 * SmartVideoPlayer - Only plays videos that pass validation
 * Automatically filters out bad/corrupted videos
 * 
 * PERF FIX: Skips validation for trusted sources (Mux, Supabase)
 * to eliminate 1-5s loading delay.
 */

import React, { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateVideoSource, VideoValidationResult } from "./VideoSourceValidator";

interface SmartVideoPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onError?: () => void;
  onPlay?: () => void;
}

// Trusted sources that don't need validation
const TRUSTED_DOMAINS = [
  'stream.mux.com',
  'chunk.mux.com',
  '.supabase.co',
  'supabase.co/storage',
  '.mux.com',
];

function isTrustedSource(url: string): boolean {
  return TRUSTED_DOMAINS.some(d => url.includes(d)) || url.includes('.m3u8');
}

export const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({
  src,
  className = "",
  autoPlay = false,
  muted = true,
  loop = true,
  onError,
  onPlay,
}) => {
  const [validation, setValidation] = useState<VideoValidationResult | null>(
    // Skip validation for trusted sources — render immediately
    isTrustedSource(src) ? { url: src, quality: "good", canPlay: true } : null
  );
  const [isChecking, setIsChecking] = useState(!isTrustedSource(src));
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Lazy-load: only validate when visible in viewport
  useEffect(() => {
    if (isTrustedSource(src)) {
      setIsVisible(true);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  // Only validate when visible (and not a trusted source)
  useEffect(() => {
    if (isTrustedSource(src) || !isVisible) return;

    let cancelled = false;

    const checkVideo = async () => {
      setIsChecking(true);
      const result = await validateVideoSource(src);

      if (!cancelled) {
        setValidation(result);
        setIsChecking(false);

        if (result.quality === "bad") {
          onError?.();
        }
      }
    };

    checkVideo();

    return () => { cancelled = true; };
  }, [src, onError, isVisible]);

  // Handle play
  const handlePlay = () => {
    if (videoRef.current && (validation?.canPlay || isTrustedSource(src))) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        onPlay?.();
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  // Not yet visible — render placeholder
  if (!isVisible && !isTrustedSource(src)) {
    return (
      <div ref={containerRef} className={cn("relative bg-zinc-900 rounded-xl", className)} style={{ minHeight: '200px' }} />
    );
  }

  // Still checking — show loader
  if (isChecking) {
    return (
      <div ref={containerRef} className={cn("relative flex items-center justify-center bg-zinc-900 rounded-xl", className)}>
        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        <span className="ml-2 text-white/60 text-sm">Vérification...</span>
      </div>
    );
  }

  // Bad video — show error placeholder
  if (validation?.quality === "bad") {
    return (
      <div className={cn("relative flex flex-col items-center justify-center bg-zinc-900 rounded-xl", className)}>
        <AlertCircle className="w-10 h-10 text-white/40 mb-2" />
        <p className="text-white/50 text-sm">Vidéo indisponible</p>
        <p className="text-white/30 text-xs mt-1">{validation.error || "Erreur inconnue"}</p>
      </div>
    );
  }

  // Good video — render player immediately
  return (
    <div className={cn("relative group rounded-xl overflow-hidden", className)}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop={loop}
        muted={muted}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => onError?.()}
      />

      {/* Play button overlay */}
      {!isPlaying && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/10 transition-colors"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-gold-500 to-gold-400 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
            <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Quality badge */}
      {validation?.duration && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white/70">
          ✅ Validée
        </div>
      )}
    </div>
  );
};

export default SmartVideoPlayer;
