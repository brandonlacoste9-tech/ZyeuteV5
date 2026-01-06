import React from "react";
import { Media } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { MapleSpinner } from "@/components/ui/MapleSpinner";
import { Play } from "lucide-react";

interface MediaFeedItemProps {
  media: Media;
  onClick: (media: Media) => void;
}

export const MediaFeedItem: React.FC<MediaFeedItemProps> = ({
  media,
  onClick,
}) => {
  const isVideo = media.type === "VIDEO";
  const isEnhancing = media.enhanceStatus === "PROCESSING";
  const isEnhanced = media.enhanceStatus === "DONE";
  const isFailed = media.enhanceStatus === "FAILED";

  return (
    <div
      className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-neutral-900 shadow-lg cursor-pointer group touch-manipulation ring-1 ring-white/10"
      onClick={() => onClick(media)}
    >
      {/* Thumbnail / Image */}
      <img
        src={
          media.thumbnailUrl ||
          media.enhancedUrl ||
          media.supabaseUrl ||
          "/placeholder-image.jpg"
        }
        alt={media.caption || "Media content"}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      {/* Video Indicator */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-4 border border-white/20 shadow-xl">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none" />

      {/* Enhance Status Badge */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        {isEnhancing && (
          <Badge
            variant="outline"
            className="bg-black/60 border-gold-400 text-gold-400 flex items-center gap-1 backdrop-blur-md"
          >
            <MapleSpinner size="sm" />
            <span className="text-[10px]">Optimisation...</span>
          </Badge>
        )}
        {isEnhanced && (
          <Badge
            variant="secondary"
            className="bg-gold-500 text-black text-[10px] font-black shadow-[0_0_10px_rgba(255,191,0,0.5)] border border-yellow-200"
          >
            ✨ HD
          </Badge>
        )}
        {isFailed && (
          <Badge variant="destructive" className="text-[10px]">
            Échec
          </Badge>
        )}
      </div>

      {/* User Info & Caption */}
      <div className="absolute bottom-0 left-0 w-full p-4 text-white z-10">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="w-8 h-8 border border-white/20">
            <AvatarImage src={media.user?.avatar_url || ""} />
            <AvatarFallback className="bg-neutral-800 text-xs text-stone-400">
              {media.user?.username?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none text-white drop-shadow-md">
              {media.user?.display_name ||
                media.user?.username ||
                "Utilisateur"}
            </span>
            <span className="text-[10px] text-stone-400">
              {formatDistanceToNow(new Date(media.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
        </div>

        {media.caption && (
          <p className="text-sm text-stone-200 line-clamp-2 drop-shadow-sm">
            {media.caption}
          </p>
        )}
      </div>
    </div>
  );
};
