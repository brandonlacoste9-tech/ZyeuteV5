/**
 * ContinuousFeed - Full-screen vertical video feed
 * Adapts the Player experience for the main feed
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SingleVideoView } from './SingleVideoView';
import { getExplorePosts, togglePostFire, getCurrentUser } from '@/services/api';
import { useHaptics } from '@/hooks/useHaptics';
import type { Post, User } from '@/types';
import { logger } from '../../lib/logger';
import { cn } from '../../lib/utils';

const feedLogger = logger.withContext('ContinuousFeed');

interface ContinuousFeedProps {
    className?: string;
    onVideoChange?: (index: number, post: Post) => void;
}

export const ContinuousFeed: React.FC<ContinuousFeedProps> = ({ className, onVideoChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { tap } = useHaptics();

    const [posts, setPosts] = useState<Array<Post & { user: User }>>([]);
    const [page, setPage] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch video feed (Latest Public Videos)
    const fetchVideoFeed = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getExplorePosts(0, 10);

            if (data) {
                // Ensure user property exists on posts (api returns Post, we need Post & { user })
                // The API getExplorePosts returns (Post & { user: User })[] based on the implementation
                const validPosts = data.filter(p => p.user) as Array<Post & { user: User }>;
                setPosts(validPosts);
                setHasMore(data.length === 10);
                setPage(0);
            }
        } catch (error) {
            feedLogger.error('Error fetching video feed:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load more videos
    const loadMoreVideos = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const data = await getExplorePosts(nextPage, 10);

            if (data && data.length > 0) {
                const validPosts = data.filter(p => p.user) as Array<Post & { user: User }>;
                setPosts((prev) => [...prev, ...validPosts]);
                setHasMore(data.length === 10);
                setPage(nextPage);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            feedLogger.error('Error loading more videos:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [page, loadingMore, hasMore]);

    // Initial fetch
    useEffect(() => {
        fetchVideoFeed();
    }, [fetchVideoFeed]);

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
            if (onVideoChange && posts[newIndex]) {
                onVideoChange(newIndex, posts[newIndex]);
            }

            // Load more videos when approaching the end
            if (newIndex >= posts.length - 3 && hasMore && !loadingMore) {
                loadMoreVideos();
            }
        }
    }, [currentIndex, posts, hasMore, loadingMore, loadMoreVideos, onVideoChange]);

    // Intersection Observer for auto-play logic
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const videoElement = entry.target.querySelector('video');
                    if (videoElement) {
                        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
                            // Video is mostly visible, play it
                            try {
                                videoElement.play();
                            } catch (e) {
                                // Auto-play might be blocked
                            }
                        } else {
                            // Video is not visible, pause it
                            videoElement.pause();
                        }
                    }
                });
            },
            {
                threshold: [0.6],
                root: containerRef.current,
            }
        );

        const videoViews = containerRef.current.querySelectorAll('[data-video-view]');
        videoViews.forEach((view) => observer.observe(view));

        return () => {
            observer.disconnect();
        };
    }, [posts]);

    // Handle fire (like) toggle
    const handleFireToggle = async (postId: string, _currentFire: number) => {
        // Optimistic UI update could be added here
        feedLogger.debug('Fire toggle for post:', postId);
        try {
            const user = await getCurrentUser();
            if (!user) return;

            await togglePostFire(postId, user.id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleComment = (postId: string) => {
        // Navigate to post detail
        window.location.href = `/p/${postId}`;
    };

    const handleShare = async (postId: string) => {
        // Share logic
        const url = `${window.location.origin}/p/${postId}`;
        if (navigator.share) {
            await navigator.share({ title: 'Zyeuté', url });
        } else {
            await navigator.clipboard.writeText(url);
        }
    };

    if (isLoading && posts.length === 0) {
        return (
            <div className={cn("w-full h-full flex items-center justify-center bg-zinc-900", className)}>
                <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className={cn("w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-8 text-center", className)}>
                <div className="text-4xl mb-4">📱</div>
                <p className="text-stone-400 mb-4">Aucun contenu disponible pour le moment.</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar",
                className
            )}
            onScroll={handleScroll}
        >
            <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

            {posts.map((post, index) => (
                <div key={post.id} data-video-view className="w-full h-full snap-start flex-shrink-0">
                    <SingleVideoView
                        post={post}
                        user={post.user}
                        isActive={index === currentIndex}
                        onFireToggle={handleFireToggle}
                        onComment={handleComment}
                        onShare={handleShare}
                    />
                </div>
            ))}

            {loadingMore && (
                <div className="w-full h-20 flex items-center justify-center snap-start">
                    <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};
