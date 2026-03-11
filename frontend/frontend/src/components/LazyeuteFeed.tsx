/**
 * LazyeuteFeed.tsx
 * TikTok-style vertical feed for Zyeuté
 * French social media platform
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FixedSizeList as List, areEqual } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { VideoPlayer } from "./VideoPlayer";
import { cn } from "@/lib/utils";
import {
  IoChatbubbleOutline,
  IoShareSocialOutline,
  IoMusicNoteOutline,
  IoHeartOutline,
  IoHeart,
} from "react-icons/io5";

interface Video {
  id: string;
  media_url: string;
  user_id: string;
  userId?: string;
  caption?: string | null;
  fire_count?: number;
  fireCount?: number;
  comment_count?: number;
  commentCount?: number;
  created_at?: string;
  createdAt?: string;
  user?: {
    display_name?: string;
    avatar_url?: string;
  };
}

interface FeedResponse {
  posts: Video[];
  hasMore: boolean;
  nextCursor?: string;
}

interface VideoCardProps {
  index: number;
  style: React.CSSProperties;
  data: {
    videos: Video[];
    onLike: (videoId: string) => void;
  };
}

const VideoCard: React.FC<VideoCardProps> = React.memo(({ index, style, data }) => {
  const video = data.videos[index];
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video?.fireCount || video?.fire_count || 0);

  const handleLike = () => {
    if (!isLiked) {
      setLikeCount((prev) => prev + 1);
    } else {
      setLikeCount((prev) => prev - 1);
    }
    setIsLiked(!isLiked);
    data.onLike(video.id);
  };

  if (!video) return null;

  return (
    <div style={style} className="w-full">
      <div className="relative w-full aspect-[9/16] max-h-[85vh] bg-black rounded-xl overflow-hidden">
        <VideoPlayer
          videoUrl={video.media_url}
          autoPlay={true}
          muted={true}
        />
        
        {/* Right side: Interactive buttons */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-6 z-20">
          {/* Avatar */}
          <div className="relative mb-2">
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
              <img
                src={video.user?.avatar_url || "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=avatar"}
                alt={video.user?.display_name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#d4af37] rounded-full border-2 border-black"></div>
          </div>

          {/* Like */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1"
          >
            {isLiked ? (
              <IoHeart className="w-8 h-8 text-red-500 fill-current" />
            ) : (
              <IoHeartOutline className="w-8 h-8 text-white" />
            )}
            <span className="text-xs font-semibold text-white drop-shadow-md">
              {likeCount}
            </span>
          </button>

          {/* Comment */}
          <button className="flex flex-col items-center gap-1">
            <IoChatbubbleOutline className="w-8 h-8 text-white" />
            <span className="text-xs font-semibold text-white drop-shadow-md">
              {video.commentCount || video.comment_count || 0}
            </span>
          </button>

          {/* Share */}
          <button className="flex flex-col items-center gap-1">
            <IoShareSocialOutline className="w-8 h-8 text-white" />
            <span className="text-xs font-semibold text-white drop-shadow-md">
              Partager
            </span>
          </button>

          {/* Music */}
          <button className="flex flex-col items-center gap-1 animate-bounce">
            <IoMusicNoteOutline className="w-8 h-8 text-white" />
          </button>
        </div>

        {/* Bottom: Caption */}
        <div className="absolute bottom-4 left-4 right-20 z-10">
          <p className="text-white font-semibold text-sm drop-shadow-md line-clamp-2">
            {video.caption || "Vidéo"}
          </p>
          <p className="text-white/80 text-xs mt-1 drop-shadow-md">
            {video.user?.display_name || "Utilisateur"}
          </p>
        </div>
      </div>
    </div>
  );
}, areEqual);

export const LazyeuteFeed: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const listRef = useRef<List<VideoCardProps["data"]>>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const fetchFeed = useCallback(async (cursor?: string) => {
    try {
      const url = cursor
        ? `/api/feed/infinite?limit=20&cursor=${encodeURIComponent(cursor)}`
        : "/api/feed/infinite?limit=20";
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }
      
      const data: FeedResponse = await response.json();
      
      setVideos((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Error fetching feed:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Handle scroll to load more
  const handleScroll = (scrollOffset: number) => {
    const threshold = 200;
    const list = listRef.current;
    
    if (!list || !hasMore || isScrolling) return;
    
    const { clientHeight, scrollHeight } = list.node;
    const scrollTop = scrollOffset;
    
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      setIsScrolling(true);
      fetchFeed(nextCursor);
      setTimeout(() => setIsScrolling(false), 1000);
    }
  };

  const handleLike = (videoId: string) => {
    console.log(`Liked video: ${videoId}`);
  };

  if (isLoading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg">Chargement des vidéos...</p>
        </div>
      </div>
    );
  }

  if (hasError && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <p className="text-white text-lg">Erreur de chargement</p>
          <button
            onClick={() => {
              setHasError(false);
              setVideos([]);
              fetchFeed();
            }}
            className="px-6 py-2 bg-[#d4af37] text-black rounded-full font-semibold hover:bg-[#c5a028] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden">
      <div className="h-full w-full max-w-md mx-auto relative">
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              className="w-full"
              height={height}
              itemCount={videos.length}
              itemSize={height}
              itemData={{ videos, onLike: handleLike }}
              onScroll={({ scrollOffset }) => {
                handleScroll(scrollOffset);
              }}
              onScrollStateChange={(scrollState) => {
                setIsScrolling(scrollState.isScrolling);
              }}
            >
              {VideoCard}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};
