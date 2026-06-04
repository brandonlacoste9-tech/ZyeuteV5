/**
 * Infinite Scroll Feed Hook
 * Uses React Query for data fetching with cursor-based pagination
 * Compatible with both Zyeute (TikTok feed) and Feed (grid) components
 *
 * CRITICAL: Uses Supabase session token (not localStorage "token")
 * to match backend JWT validation.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useMemo } from "react";
import type { Post } from "@/types";
import { normalizePostForFeed, postHasPlayableMedia } from "@/services/api";
import { getSessionWithTimeout } from "@/lib/supabase";

/** Read current hive from localStorage — mirrors HiveContext default */
function getStoredHive(): string {
  try {
    return localStorage.getItem("zyeute_hive_id") || "quebec";
  } catch {
    return "quebec";
  }
}

interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
  feedType: string;
}

export type FeedType = "feed" | "explore" | "smart";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await getSessionWithTimeout(3000);
  const token = session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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
    queryKey: ["feed-infinite", feedType, getStoredHive()],
    staleTime: 30_000, // 30s - avoid aggressive refetch on mount
    gcTime: 5 * 60 * 1000, // 5 min cache
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    queryFn: async ({ pageParam }) => {
      const cursorStr = pageParam ? String(pageParam) : "";
      const cursorOffset = cursorStr
        ? parseInt(cursorStr.split("-")[0], 10) || 0
        : 0;

      const params = new URLSearchParams({
        limit: "30",
        type: feedType,
        hive: getStoredHive(),
        ...(cursorOffset > 0 ? { cursor: String(cursorOffset) } : {}),
      });

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/feed/infinite?${params}`, {
        headers,
        credentials: "include",
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
            p != null && !!p.id && postHasPlayableMedia(p),
        );
      // Debug: log feed structure when ?debug=1
      if (
        typeof window !== "undefined" &&
        (new URLSearchParams(window.location.search).get("debug") === "1" ||
          localStorage.getItem("debug") === "true")
      ) {
        const muxCount = posts.filter((p: any) => p.mux_playback_id).length;
        const withMedia = posts.filter((p: any) => p.media_url).length;
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
      const nextRaw = data.nextCursor;
      const nextOffset =
        nextRaw != null && String(nextRaw).length > 0
          ? parseInt(String(nextRaw).split("-")[0], 10) || 0
          : 0;
      return {
        ...data,
        posts,
        nextCursor: nextOffset > 0 ? String(nextOffset) : null,
        hasMore: data.hasMore !== false && rawCount > 0,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore === false) return undefined;
      const c = lastPage.nextCursor;
      if (!c) return undefined;
      const off = parseInt(String(c), 10);
      return off > 0 ? String(off) : undefined;
    },
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

  // API returned rows but filter emptied the page — advance cursor (max 8 tries)
  useEffect(() => {
    const pages = data?.pages ?? [];
    if (isLoading || isFetchingNextPage || !hasNextPage || pages.length === 0)
      return;
    const total = pages.flatMap((p) => p.posts).length;
    const last = pages[pages.length - 1];
    if (total === 0 && pages.length < 8 && last?.hasMore !== false) {
      fetchNextPage();
    }
  }, [data?.pages, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  // Flatten pages into single array of posts
  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data?.pages],
  );

  return {
    posts,
    loadMoreRef: ref,
    fetchNextPage,
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
    queryKey: ["feed-infinite-manual", feedType, getStoredHive()],
    queryFn: async ({ pageParam }) => {
      const cursorStr = pageParam ? String(pageParam) : "";
      const cursorOffset = cursorStr
        ? parseInt(cursorStr.split("-")[0], 10) || 0
        : 0;

      const params = new URLSearchParams({
        limit: "30",
        type: feedType,
        hive: getStoredHive(),
        ...(cursorOffset > 0 ? { cursor: String(cursorOffset) } : {}),
      });

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/feed/infinite?${params}`, {
        headers,
        credentials: "include",
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
