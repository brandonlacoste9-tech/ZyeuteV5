/**
 * MuxVideoPlayer - MUX streaming player with French UI
 * Zyeuté V5 - Quebec social media
 */

import { useState, useCallback } from "react";
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
}

export function MuxVideoPlayer({
  playbackId,
  thumbnailUrl,
  className = "",
  autoPlay = false,
  loop = true,
  muted = true,
  style,
}: MuxVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

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
