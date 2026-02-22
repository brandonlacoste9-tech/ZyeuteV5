/**
 * Infinite Scroll Feed Hook
 * Uses React Query for data fetching with cursor-based pagination
 * Compatible with both LaZyeute (TikTok) and Feed (grid) components
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo } from "react";
import type { Post } from "@/types";
import { normalizePostForFeed } from "@/services/api";

interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
  feedType: string;
}

export type FeedType = "feed" | "explore" | "smart";

export function useInfiniteFeed(feedType: FeedType = "explore") {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ["feed-infinite", feedType],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: "20",
        type: feedType,
        ...(pageParam ? { cursor: pageParam as string } : {}),
      });

      const response = await fetch(`/api/feed/infinite?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }

      const data = await response.json();
      // Normalize posts for consistent media_url, mux_playback_id shape
      const rawCount = (data.posts || []).length;
      const posts = (data.posts || [])
        .map((p: any) => normalizePostForFeed(p))
        .filter(
          (p: Post | null): p is Post =>
            p != null &&
            !!p.id &&
            !!(p.media_url || p.hls_url || p.mux_playback_id),
        );
      // Debug: log feed structure when ?debug=1
      if (
        typeof window !== "undefined" &&
        (new URLSearchParams(window.location.search).get("debug") === "1" ||
          localStorage.getItem("debug") === "true")
      ) {
        const muxCount = posts.filter((p) => p.mux_playback_id).length;
        const withMedia = posts.filter((p) => p.media_url).length;
        console.log("[FeedDiagnostic]", {
          rawPosts: rawCount,
          afterFilter: posts.length,
          withMuxId: muxCount,
          withMediaUrl: withMedia,
          sample: posts[0]
            ? {
                id: posts[0].id,
                type: posts[0].type,
                hasMux: !!posts[0].mux_playback_id,
                mediaUrlPreview: posts[0].media_url?.slice(0, 50),
              }
            : null,
        });
      }
      return { ...data, posts };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  // Intersection observer for triggering load more
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "200px", // Start loading 200px before reaching the end
  });

  // Auto-fetch next page when scroll trigger becomes visible
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten pages into single array of posts
  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data?.pages],
  );

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
export function useInfiniteFeedManual(feedType: FeedType = "explore") {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ["feed-infinite-manual", feedType],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: "20",
        type: feedType,
        ...(pageParam ? { cursor: pageParam as string } : {}),
      });

      const response = await fetch(`/api/feed/infinite?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feed");
      }

      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
  });

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data?.pages],
  );

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
