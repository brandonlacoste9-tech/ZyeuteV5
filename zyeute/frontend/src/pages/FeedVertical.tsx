import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { VideoCard } from "@/components/feed/VideoCard";
import { FireAnimation } from "@/components/feed/FireAnimation";
import { useGestures } from "@/hooks/useGestures";
import { useFeedVideos } from "@/hooks/useFeedVideos";
import { firePost, markNotInterested } from "@/services/api";
import type { Post } from "@/types";

export default function FeedVertical() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fireAnimation, setFireAnimation] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fireCooldown = useRef(false);

  const { data, fetchNextPage, hasNextPage, isLoading } = useFeedVideos();

  const videos = data?.pages.flat() || [];

  // Preload next videos when approaching end
  useEffect(() => {
    if (currentIndex >= videos.length - 3 && hasNextPage) {
      fetchNextPage();
    }
  }, [currentIndex, videos.length, hasNextPage, fetchNextPage]);

  const triggerFire = (videoId: string, wasFired: boolean) => {
    if (fireCooldown.current) return;
    fireCooldown.current = true;

    // Show animation immediately
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setFireAnimation({ x: rect.width / 2, y: rect.height / 2 });
    }

    // Fire the post (toggle behavior)
    firePost(videoId).catch((error) => {
      console.error("Fire action error:", error);
    });

    setTimeout(() => {
      fireCooldown.current = false;
    }, 300);
  };

  const handleNotInterested = async (videoId: string) => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }

    try {
      await markNotInterested(videoId);
    } catch (error) {
      console.error("Not interested error:", error);
    }
  };

  const navigateToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const navigateToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const gestures = useGestures({
    onSwipeUp: navigateToNext,
    onSwipeDown: navigateToPrevious,
    onSwipeLeft: () => {
      if (videos[currentIndex]) {
        handleNotInterested(videos[currentIndex].id);
      }
    },
    onSwipeRight: () => {
      if (videos[currentIndex]) {
        triggerFire(videos[currentIndex].id, videos[currentIndex].user_has_fired || false);
      }
    },
    onDoubleTap: () => {
      if (videos[currentIndex]) {
        triggerFire(videos[currentIndex].id, videos[currentIndex].user_has_fired || false);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading feed...</div>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white">No videos available</div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div
        ref={containerRef}
        onTouchStart={gestures.handleTouchStart}
        onTouchMove={gestures.handleTouchMove}
        onTouchEnd={gestures.handleTouchEnd}
        className="relative w-full h-full touch-none"
      >
        <AnimatePresence mode="wait">
          {currentVideo && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <VideoCard
                video={currentVideo}
                isActive={true}
                onFire={() => {
                  triggerFire(currentVideo.id, currentVideo.user_has_fired || false);
                }}
                onNotInterested={() => handleNotInterested(currentVideo.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {fireAnimation && (
        <FireAnimation
          x={fireAnimation.x}
          y={fireAnimation.y}
          onComplete={() => setFireAnimation(null)}
        />
      )}

      <div className="absolute top-2 left-0 right-0 flex justify-center gap-1 px-4 z-30">
        {videos.slice(0, 10).map((_, index) => (
          <div
            key={index}
            className={`h-0.5 flex-1 rounded-full transition-all ${
              index === currentIndex % 10
                ? "bg-white"
                : index < currentIndex % 10
                  ? "bg-white/50"
                  : "bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
