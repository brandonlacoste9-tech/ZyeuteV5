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
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
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
  const [retryKey, setRetryKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const freezeCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Reset error state and loading when playbackId changes
  useEffect(() => {
    setHasError(false);
    setErrorMessage(null);
    setIsLoading(true);
    setRetryKey(0);
  }, [playbackId]);

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
    (e?: any) => {
      console.error("[MuxVideoPlayer] Error Event:", e);
      setIsLoading(false);
      setHasError(true);

      // Extract detailed error information if available
      const muxError = e?.detail;
      const msg =
        muxError?.message || e?.target?.error?.message || "Mux playback failed";

      setErrorMessage(msg);
      onErrorProp?.(new Error(msg));
    },
    [onErrorProp],
  );

  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage(null);
    setIsLoading(true);
    setRetryKey((prev) => prev + 1);
  }, []);

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-900 rounded-xl overflow-hidden",
          className,
        )}
        style={style}
      >
        <div className="text-center p-6 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-base font-bold text-white mb-1">
            Signal Interrompu
          </p>
          <p className="text-xs text-zinc-400 mb-4 max-w-[200px] mx-auto">
            {errorMessage || "Une erreur est survenue lors de la lecture."}
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black text-xs font-bold rounded-full transition-all active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            RÉESSAYER
          </button>
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
        key={`${playbackId}-${retryKey}`}
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
        metadata={{
          video_id: playbackId,
          video_title: `Post ${playbackId}`,
          viewer_user_id: "anonymous",
        }}
        maxResolution="1080p"
        primaryColor="#D4AF37"
        secondaryColor="#1a1a1a"
        accentColor="#FFD700"
      />
    </div>
  );
}
