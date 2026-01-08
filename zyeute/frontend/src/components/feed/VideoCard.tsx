import { useState, useRef, useEffect } from "react";
import { Flame, MessageCircle, Share2, Loader2, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { getEnhancedVideoUrl, getThumbnailUrl } from "@/lib/supabase";
import { useRealtimeJobStatus } from "@/hooks/useRealtimeJobStatus";
import type { Post } from "@/types";

interface VideoCardProps {
  video: Post;
  isActive: boolean;
  onFire: () => void;
  onNotInterested: () => void;
}

export function VideoCard({
  video,
  isActive,
  onFire,
  onNotInterested,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localStatus, setLocalStatus] = useState<string>(
    (video as any).processing_status || "completed"
  );

  // Subscribe to realtime status updates
  useRealtimeJobStatus(video.id, (status, enhancedUrl) => {
    setLocalStatus(status);
    if (enhancedUrl && videoRef.current) {
      videoRef.current.src = enhancedUrl;
      videoRef.current.load();
    }
  });

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const videoUrl = getEnhancedVideoUrl(video);
  const thumbnailUrl = getThumbnailUrl(video);
  const userHasFired = video.user_has_fired || false;
  const fireCount = video.fire_count || 0;
  const commentCount = video.comment_count || 0;

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {localStatus !== "completed" && (
        <motion.div
          className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-2 rounded-full"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
            <span className="text-sm text-white font-medium">
              {localStatus === "processing" ? "Enhancing..." : "Queued"}
            </span>
          </div>
        </motion.div>
      )}

      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors z-20"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      <div className="absolute bottom-24 left-4 z-20 max-w-[70vw]">
        {video.user && (
          <div className="flex items-center gap-2 mb-2">
            <img
              src={video.user.avatar_url || ""}
              alt={video.user.username || ""}
              className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
            />
            <span className="text-white font-semibold text-lg drop-shadow-lg">
              @{video.user.username || ""}
            </span>
          </div>
        )}
        {video.caption && (
          <p className="text-white text-sm leading-relaxed drop-shadow-lg">
            {video.caption}
          </p>
        )}
      </div>

      <div className="absolute bottom-24 right-4 z-20 flex flex-col gap-6">
        <button onClick={onFire} className="flex flex-col items-center gap-1">
          <motion.div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              userHasFired
                ? "bg-gradient-to-br from-orange-500 to-red-600"
                : "bg-white/20 backdrop-blur-md"
            }`}
            whileTap={{ scale: 0.9 }}
          >
            <Flame className="w-7 h-7 text-white" />
          </motion.div>
          <span className="text-white text-xs font-bold drop-shadow-lg">
            {formatCount(fireCount)}
          </span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow-lg">
            {formatCount(commentCount)}
          </span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Share2 className="w-7 h-7 text-white" />
          </div>
        </button>
      </div>
    </div>
  );
}
