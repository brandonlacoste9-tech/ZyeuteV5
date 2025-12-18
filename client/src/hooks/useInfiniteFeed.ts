/**
 * Infinite Scroll Feed Hook
 * Uses React Query for data fetching with cursor-based pagination
 * Compatible with both LaZyeute (TikTok) and Feed (grid) components
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import type { Post } from '@/types';

interface FeedResponse {
    posts: Post[];
    nextCursor: string | null;
    hasMore: boolean;
    feedType: string;
}

export type FeedType = 'feed' | 'explore' | 'smart';

export function useInfiniteFeed(feedType: FeedType = 'explore') {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch,
    } = useInfiniteQuery<FeedResponse>({
        queryKey: ['feed-infinite', feedType],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams({
                limit: '20',
                type: feedType,
                ...(pageParam && { cursor: pageParam as string }),
            });

            const response = await fetch(`/api/feed/infinite?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch feed');
            }

            return response.json();
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: null,
    });

    // Intersection observer for triggering load more
    const { ref, inView } = useInView({
        threshold: 0.1,
        rootMargin: '200px', // Start loading 200px before reaching the end
    });

    // Auto-fetch next page when scroll trigger becomes visible
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Flatten pages into single array of posts
    const posts = data?.pages.flatMap(page => page.posts) ?? [];

    return {
        posts,
        loadMoreRef: ref,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        error,
        refetch,
    };
}

/**
 * Simpler hook without intersection observer
 * For manual control over loading
 */
export function useInfiniteFeedManual(feedType: FeedType = 'explore') {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch,
    } = useInfiniteQuery<FeedResponse>({
        queryKey: ['feed-infinite-manual', feedType],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams({
                limit: '20',
                type: feedType,
                ...(pageParam && { cursor: pageParam as string }),
            });

            const response = await fetch(`/api/feed/infinite?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch feed');
            }

            return response.json();
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: null,
    });

    const posts = data?.pages.flatMap(page => page.posts) ?? [];

    return {
        posts,
        loadMore: fetchNextPage,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        error,
        refetch,
    };
}
