/**
 * TikTokVideoPlayer - Embed TikTok videos
 * Zyeuté V5 - Quebec social media
 */

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TikTokVideoPlayerProps {
  /** TikTok video URL (e.g., https://www.tiktok.com/@username/video/1234567890) */
  videoUrl: string;
  className?: string;
  autoPlay?: boolean;
}

export function TikTokVideoPlayer({
  videoUrl,
  className = "",
  autoPlay = false,
}: TikTokVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Load TikTok embed script
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      setIsLoading(false);
    };

    script.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
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
            Erreur de chargement TikTok
          </p>
          <p className="text-xs text-leather-500 mt-1">
            Vérifie l'URL de la vidéo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative video-motion-smooth", className)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 rounded-xl z-10">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
        </div>
      )}

      <blockquote
        className="tiktok-embed"
        cite={videoUrl}
        data-video-id={extractVideoId(videoUrl)}
        style={{ maxWidth: "605px", minWidth: "325px" }}
      >
        <section>
          <a
            target="_blank"
            rel="noopener noreferrer"
            title="TikTok"
            href={videoUrl}
          >
            Voir sur TikTok
          </a>
        </section>
      </blockquote>
    </div>
  );
}

/**
 * Extract TikTok video ID from URL
 * Example: https://www.tiktok.com/@username/video/1234567890 → 1234567890
 */
function extractVideoId(url: string): string | null {
  try {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
