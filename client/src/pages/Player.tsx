/**
 * Player Page - Full-screen continuous video player
 * Instagram/TikTok-style vertical scrolling video feed
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SingleVideoView } from '@/components/features/SingleVideoView';
import { supabase } from '@/lib/supabase';
import { useHaptics } from '@/hooks/useHaptics';
import type { Post, User } from '@/types';
import { logger } from '../lib/logger';

const playerLogger = logger.withContext('Player');


export const Player: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { tap } = useHaptics();

  const [posts, setPosts] = useState<Array<Post & { user: User }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Find starting index
  const startIndex = posts.findIndex((p) => p.id === videoId);

  // Fetch video feed from Supabase
  const fetchVideoFeed = useCallback(async (startingPostId?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(
          `
          *,
          user:user_profiles!user_id(*)
        `
        )
        .eq('visibility', 'public')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(30);

      // If we have a starting post ID, try to fetch around it
      if (startingPostId) {
        // First, get the starting post and its position
        const { data: startingPost } = await supabase
          .from('posts')
          .select('created_at')
          .eq('id', startingPostId)
          .single();

        if (startingPost) {
          // Fetch posts around this timestamp
          query = supabase
            .from('posts')
            .select(
              `
              *,
              user:user_profiles!user_id(*)
            `
            )
            .eq('visibility', 'public')
            .eq('is_hidden', false)
            .order('created_at', { ascending: false })
            .limit(30);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Ensure starting post is in the list
        if (startingPostId && data.findIndex((p) => p.id === startingPostId) === -1) {
          // Fetch the starting post separately
          const { data: startingPostData } = await supabase
            .from('posts')
            .select(
              `
              *,
              user:user_profiles!user_id(*)
            `
            )
            .eq('id', startingPostId)
            .single();

          if (startingPostData) {
            // Insert at the beginning
            data.unshift(startingPostData);
          }
        }

        setPosts(data);
        setHasMore(data.length === 30);
      }
    } catch (error) {
      playerLogger.error('Error fetching video feed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more videos
  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !hasMore || posts.length === 0) return;

    setLoadingMore(true);
    try {
      const lastPost = posts[posts.length - 1];
      const { data, error } = await supabase
        .from('posts')
        .select(
          `
          *,
          user:user_profiles!user_id(*)
        `
        )
        .eq('visibility', 'public')
        .eq('is_hidden', false)
        .lt('created_at', lastPost.created_at)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        setPosts((prev) => [...prev, ...data]);
        setHasMore(data.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      playerLogger.error('Error loading more videos:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [posts, loadingMore, hasMore]);

  // Initial fetch
  useEffect(() => {
    if (videoId) {
      fetchVideoFeed(videoId);
    }
  }, [videoId, fetchVideoFeed]);

  // Scroll to starting video when posts are loaded
  useEffect(() => {
    if (containerRef.current && posts.length > 0 && startIndex > -1) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: startIndex * window.innerHeight,
            behavior: 'instant',
          });
          setCurrentIndex(startIndex);
        }
      }, 100);
    }
  }, [posts.length, startIndex]);

  // Handle scroll to detect current video
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const height = container.clientHeight;

    // Calculate which video is currently visible
    const newIndex = Math.round(scrollPosition / height);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
      setCurrentIndex(newIndex);

      // Update URL without navigation
      const newPostId = posts[newIndex]?.id;
      if (newPostId) {
        window.history.replaceState(null, '', `/video/${newPostId}`);
      }

      // Load more videos when approaching the end
      if (newIndex >= posts.length - 5 && hasMore && !loadingMore) {
        loadMoreVideos();
      }
    }
  }, [currentIndex, posts, hasMore, loadingMore, loadMoreVideos]);

  // Intersection Observer for better video management
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoElement = entry.target.querySelector('video');
          if (videoElement) {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
              // Video is mostly visible, play it
              videoElement.play().catch((error) => playerLogger.error('Video playback error:', error));
            } else {
              // Video is not visible, pause it
              videoElement.pause();
            }
          }
        });
      },
      {
        threshold: [0, 0.5, 1],
        root: containerRef.current,
      }
    );

    const videoViews = containerRef.current.querySelectorAll('[data-video-view]');
    videoViews.forEach((view) => observer.observe(view));

    return () => {
      observer.disconnect();
    };
  }, [posts]);

  // Handle close button
  const handleClose = () => {
    tap();
    navigate(-1);
  };

  // Handle fire toggle
  const handleFireToggle = async (postId: string, _currentFire: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Toggle fire logic here (similar to Feed.tsx)
      // This is a placeholder - implement actual fire toggle logic
      playerLogger.debug('Fire toggle for post:', postId);
    } catch (error) {
      playerLogger.error('Error toggling fire:', error);
    }
  };

  // Handle comment
  const handleComment = (postId: string) => {
    navigate(`/p/${postId}`, { state: { scrollToComments: true } });
  };

  // Handle share
  const handleShare = async (postId: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Zyeuté',
          text: 'Check out this video on Zyeuté!',
          url: `${window.location.origin}/video/${postId}`,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${window.location.origin}/video/${postId}`
        );
        // Show toast notification (you may need to import toast)
        playerLogger.debug('Link copied to clipboard');
      }
    } catch (error) {
      playerLogger.error('Error sharing:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(255,191,0,0.2)]" />
          <p className="text-white font-medium">Chargement de la vidéo...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-white text-xl mb-4">Aucune vidéo trouvée</p>
          <button
            onClick={handleClose}
            className="text-gold-400 hover:text-gold-300 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 left-4 z-50 p-3 text-white bg-black/50 rounded-full hover:bg-black/80 transition-all backdrop-blur-sm"
        aria-label="Fermer"
      >
        <svg
          className="w-6 h-6 text-gold-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Video Feed Container with CSS Scroll Snap */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {posts
          .filter((post) => post.user) // Filter out posts without users
          .map((post, index) => {
            if (!post.user) return null;

            return (
              <div key={post.id} data-video-view className="w-full h-full snap-center">
                <SingleVideoView
                  post={post}
                  user={post.user}
                  isActive={index === currentIndex}
                  onFireToggle={handleFireToggle}
                  onComment={handleComment}
                  onShare={handleShare}
                />
              </div>
            );
          })}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="w-full h-screen flex items-center justify-center snap-center snap-always">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mb-4" />
              <p className="text-white text-sm">Chargement de plus de vidéos...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;

