/**
 * ContinuousFeed - Full-screen vertical video feed
 * Adapts the Player experience for the main feed
 * NOW WITH VIRTUALIZATION by REACT-WINDOW
 */

import React, { useState, useEffect, useRef, useCallback, memo, ReactElement } from 'react';
import { List, ListImperativeAPI } from 'react-window';

// Support for react-window 2.x which renamed FixedSizeList to List
interface RowData {
  posts: Array<Post & { user: User }>;
  currentIndex: number;
  handleFireToggle: (postId: string, currentFire: number) => Promise<void>;
  handleComment: (postId: string) => void;
  handleShare: (postId: string) => Promise<void>;
}

interface FeedRowProps extends RowData {
  index: number;
  style: React.CSSProperties;
  ariaAttributes?: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
}

import AutoSizer from 'react-virtualized-auto-sizer';
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

const FeedRow = memo(({ 
  index, 
  style, 
  posts, 
  currentIndex, 
  handleFireToggle, 
  handleComment, 
  handleShare 
}: FeedRowProps): ReactElement => {
    const post = posts[index];
    const isActive = index === currentIndex;

    // Use a ref to ensure we only try to play properly mounted videos
    const rowRef = useRef<HTMLDivElement>(null);

    if (!post) return <div style={style} />;

    return (
        <div style={style} ref={rowRef} data-video-index={index} className="w-full h-full">
            <SingleVideoView
                post={post}
                user={post.user}
                isActive={isActive}
                onFireToggle={handleFireToggle}
                onComment={handleComment}
                onShare={handleShare}
            />
        </div>
    );
}, (prevProps, nextProps) => {
    // Only re-render if the active status changes or the post data itself changes
    const isPrevActive = prevProps.index === prevProps.currentIndex;
    const isNextActive = nextProps.index === nextProps.currentIndex;

    return (
        isPrevActive === isNextActive &&
        prevProps.posts[prevProps.index] === nextProps.posts[nextProps.index] &&
        prevProps.style === nextProps.style
    );
});

export const ContinuousFeed: React.FC<ContinuousFeedProps> = ({ className, onVideoChange }) => {
    const listRef = useRef<ListImperativeAPI>(null);
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

    // Handle rows rendered (new API name in 2.x)
    const onRowsRendered = useCallback((visibleRows: { startIndex: number; stopIndex: number }) => {
        const { startIndex, stopIndex } = visibleRows;
        // We assume the top-most visible item is the "current" one in a snap-scroll context
        const newIndex = startIndex;

        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
            setCurrentIndex(newIndex);
            if (onVideoChange && posts[newIndex]) {
                onVideoChange(newIndex, posts[newIndex]);
            }
        }

        // Pagination trigger
        if (stopIndex >= posts.length - 2 && hasMore && !loadingMore) {
            loadMoreVideos();
        }
    }, [currentIndex, posts, hasMore, loadingMore, loadMoreVideos, onVideoChange]);


    // Handle fire (like) toggle
    const handleFireToggle = useCallback(async (postId: string, _currentFire: number) => {
        feedLogger.debug('Fire toggle for post:', postId);
        try {
            const user = await getCurrentUser();
            if (!user) return;
            await togglePostFire(postId, user.id);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const handleComment = useCallback((postId: string) => {
        window.location.href = `/p/${postId}`;
    }, []);

    const handleShare = useCallback(async (postId: string) => {
        const url = `${window.location.origin}/p/${postId}`;
        if (navigator.share) {
            await navigator.share({ title: 'Zyeuté', url });
        } else {
            await navigator.clipboard.writeText(url);
        }
    }, []);

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

    // Data object passed to rows
    const itemData: RowData = {
        posts,
        currentIndex,
        handleFireToggle,
        handleComment,
        handleShare
    };

    return (
        <div className={cn("w-full h-full bg-black", className)}>
            <AutoSizer>
                {({ height, width }) => (
                    <List<RowData>
                        listRef={listRef}
                        className="no-scrollbar snap-y snap-mandatory scroll-smooth"
                        style={{ height, width }}
                        rowCount={posts.length}
                        rowHeight={height} // Full screen height per item
                        rowProps={itemData}
                        rowComponent={FeedRow as unknown as (props: FeedRowProps) => ReactElement}
                        onRowsRendered={onRowsRendered}
                        overscanCount={1} // Only render 1 item above/below viewport
                    />
                )}
            </AutoSizer>

            {loadingMore && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
                    <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};
