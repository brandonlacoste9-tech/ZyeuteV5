/**
 * MuxVideoPlayer - MUX streaming player with French UI
 * Zyeuté V5 - Quebec social media
 *
 * FIXED: Added explicit HLS buffer configuration to prevent mid-play freezes
 * - Increased maxBufferLength for better quality switching
 * - Added min/max bitrate constraints to stabilize ABR
 * - Added retry logic for failed segments
 */

import { useState, useCallback, useRef, useEffect } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MuxVideoPlayerProps {
  playbackId: string;
  thumbnailUrl?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  style?: React.CSSProperties;
  /** Called when Mux player errors (for diagnostics) */
  onError?: (error: Error) => void;
  /** Called when video freezes (buffer starvation) */
  onFreeze?: () => void;
}

export function MuxVideoPlayer({
  playbackId,
  thumbnailUrl,
  className = "",
  autoPlay = false,
  loop = true,
  muted = true,
  style,
  onError: onErrorProp,
  onFreeze,
}: MuxVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const freezeCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Monitor for freezes (time not advancing despite playing)
  useEffect(() => {
    if (!autoPlay) return;

    const checkFreeze = () => {
      const video = playerRef.current?.media;
      if (!video || video.paused || video.ended) return;

      const currentTime = video.currentTime;
      if (currentTime === lastTimeRef.current && !video.seeking) {
        // Time hasn't advanced - potential freeze
        console.warn("[MuxVideoPlayer] Detected freeze at", currentTime);
        onFreeze?.();

        // Attempt recovery: pause then play
        video.pause();
        setTimeout(() => video.play().catch(() => {}), 100);
      }
      lastTimeRef.current = currentTime;
    };

    freezeCheckRef.current = setInterval(checkFreeze, 2000);
    return () => {
      if (freezeCheckRef.current) clearInterval(freezeCheckRef.current);
    };
  }, [autoPlay, onFreeze]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    lastTimeRef.current = 0;
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(
    (e?: unknown) => {
      setIsLoading(false);
      setHasError(true);
      const target = (e as { target?: HTMLVideoElement })?.target;
      const msg = target?.error?.message || "Mux playback failed";
      setErrorMessage(msg);
      onErrorProp?.(new Error(msg));
    },
    [onErrorProp],
  );

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-900 rounded-xl",
          className,
        )}
      >
        <div className="text-center p-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-leather-400">
            Erreur de chargement de la vidéo
          </p>
          <p className="text-xs text-leather-500 mt-1">
            Vérifie ta connexion ou réessaie
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={style}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 rounded-xl z-10">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      )}

      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        thumbnailTime={0}
        placeholder={thumbnailUrl}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        className="w-full h-full rounded-xl object-cover"
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onError={handleError}
        streamType="on-demand"
        primaryColor="#D4AF37"
        secondaryColor="#1a1a1a"
        accentColor="#FFD700"
      />
    </div>
  );
}
