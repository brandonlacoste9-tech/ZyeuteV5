import React, { useState, useEffect } from "react";
import { Media } from "@/types";
import { X, Share2, Wand2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enhanceMedia } from "@/services/api";
import { MapleSpinner } from "@/components/ui/MapleSpinner";
import { Badge } from "@/components/ui/badge";

interface MediaViewerProps {
  media: Media | null;
  onClose: () => void;
  onEnhanceTriggered?: (mediaId: string) => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  media,
  onClose,
  onEnhanceTriggered,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    if (media?.enhanceStatus === "PROCESSING") {
      setIsEnhancing(true);
    } else {
      setIsEnhancing(false);
    }
  }, [media]);

  if (!media) return null;

  const isVideo = media.type === "VIDEO";
  const enhancedUrl = media.enhancedUrl;
  const originalUrl = media.supabaseUrl;
  const displayUrl = enhancedUrl || originalUrl;

  const handleEnhance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEnhancing || media.enhanceStatus === "DONE") return;
    setIsEnhancing(true);
    try {
      await enhanceMedia(media.id);
      onEnhanceTriggered?.(media.id);
    } catch (error) {
      console.error("Enhance failed", error);
      setIsEnhancing(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/10 rounded-full pointer-events-auto"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden bg-black"
        onClick={isVideo ? togglePlay : undefined}
      >
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={displayUrl || ""}
              poster={media.thumbnailUrl}
              className="max-h-full max-w-full object-contain"
              autoPlay
              loop
              playsInline
            />
            {/* Play/Pause Overlay Indicator */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                <Play className="w-16 h-16 text-white/80 fill-white/80" />
              </div>
            )}
          </>
        ) : (
          <img
            src={displayUrl || ""}
            alt={media.caption || "Full screen media"}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          {/* Caption */}
          {media.caption && (
            <p className="text-white mb-4 line-clamp-3 text-shadow-sm font-medium">
              {media.caption}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Enhance Button */}
              {(media.enhanceStatus === "PENDING" ||
                media.enhanceStatus === "FAILED") && (
                <Button
                  onClick={handleEnhance}
                  disabled={isEnhancing}
                  size="sm"
                  className="bg-gold-500 hover:bg-gold-600 text-black font-bold shadow-glow transition-all active:scale-95"
                >
                  {isEnhancing ? (
                    <>
                      <MapleSpinner size="sm" className="mr-2 text-black" />
                      Optimisation...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Améliorer (IA)
                    </>
                  )}
                </Button>
              )}

              {media.enhanceStatus === "PROCESSING" && (
                <Badge
                  variant="outline"
                  className="bg-black/40 border-gold-400 text-gold-400 h-9 px-3"
                >
                  <MapleSpinner size="sm" className="mr-2" />
                  Traitement...
                </Badge>
              )}

              {media.enhanceStatus === "DONE" && (
                <Badge className="bg-green-500/90 text-white font-bold h-9 px-3 shadow-glow-green">
                  ✨ Optimisé
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full"
            >
              <Share2 className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
