/**
 * Infinite Scroll Feed Hook
 * Uses React Query for data fetching with cursor-based pagination
 * Compatible with both Zyeute (TikTok feed) and Feed (grid) components
 */

import {
  useInfiniteQuery,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Post } from "@/types";
import { normalizePostForFeed, postHasPlayableMedia } from "@/services/api";
import { getSessionWithTimeout } from "@/lib/supabase";
import {
  getOrCreateFeedSessionId,
  markFeedHidden,
  maybeRotateFeedSessionAfterBackground,
  rotateFeedSessionId,
} from "@/lib/feedSession";

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

/** Remove a post from all infinite-feed React Query caches (Pour toi / Abonnements). */
export function removePostFromFeedCache(
  queryClient: QueryClient,
  postId: string,
): void {
  queryClient.setQueriesData<InfiniteData<FeedResponse>>(
    { queryKey: ["feed-infinite"] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.filter((p) => p.id !== postId),
        })),
      };
    },
  );
}

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

function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms = 20_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  const signal = init.signal;
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}

export function useInfiniteFeed(feedType: FeedType = "explore") {
  // Fresh shuffle seed on each entry to the feed: rotating the session id on
  // mount means every time the user opens/returns to the feed they get a newly
  // shuffled order (the backend derives its block-shuffle seed from this id).
  const [feedSessionId, setFeedSessionId] = useState(rotateFeedSessionId);

  /** Force a brand-new shuffle (e.g. re-tapping the active feed tab). */
  const reshuffle = useCallback(() => {
    setFeedSessionId(rotateFeedSessionId());
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        markFeedHidden();
      } else if (maybeRotateFeedSessionAfterBackground()) {
        setFeedSessionId(getOrCreateFeedSessionId());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isFetching,
    error,
    refetch,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ["feed-infinite", feedType, getStoredHive(), feedSessionId],
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    retryDelay: 1500,
    refetchOnWindowFocus: false,
    queryFn: async ({ pageParam, signal }) => {
      const cursorStr = pageParam ? String(pageParam) : "";

      const params = new URLSearchParams({
        limit: "30",
        type: feedType,
        hive: getStoredHive(),
        session: feedSessionId,
        ...(cursorStr ? { cursor: cursorStr } : {}),
      });

      const headers =
        feedType === "feed"
          ? await getAuthHeaders()
          : { "Content-Type": "application/json" };

      const response = await fetchWithTimeout(
        `/api/feed/infinite?${params}`,
        { headers, credentials: "include", signal },
        20_000,
      );

      if (!response.ok) {
        throw new Error(`Feed ${response.status}`);
      }

      const data = await response.json();
      const rawCount = (data.posts || []).length;
      const posts = (data.posts || [])
        .map((p: Record<string, unknown>) => normalizePostForFeed(p))
        .filter(
          (p: Post | null): p is Post =>
            p != null && !!p.id && postHasPlayableMedia(p),
        );

      if (
        typeof window !== "undefined" &&
        (new URLSearchParams(window.location.search).get("debug") === "1" ||
          localStorage.getItem("debug") === "true")
      ) {
        console.log("[FeedDiagnostic]", {
          rawPosts: rawCount,
          afterFilter: posts.length,
          sample: posts[0]?.media_url?.slice(0, 60),
        });
      }
      return {
        ...data,
        posts,
        nextCursor: data.nextCursor || null,
        hasMore: data.hasMore !== false && rawCount > 0,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore === false) return undefined;
      return lastPage.nextCursor || undefined;
    },
    initialPageParam: null,
  });

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "200px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // API returned rows but filter emptied the page — advance cursor (max 15 tries)
  useEffect(() => {
    const pages = data?.pages ?? [];
    if (isPending || isFetchingNextPage || !hasNextPage || pages.length === 0)
      return;
    const total = pages.flatMap((p) => p.posts).length;
    const last = pages[pages.length - 1];
    const lastPageEmpty = last && last.posts.length === 0;
    if (
      (total === 0 || lastPageEmpty) &&
      pages.length < 15 &&
      last?.hasMore !== false
    ) {
      fetchNextPage();
    }
  }, [data?.pages, isPending, isFetchingNextPage, hasNextPage, fetchNextPage]);

  const posts = useMemo(() => {
    const seen = new Set<string>();
    const flat = data?.pages.flatMap((page) => page.posts) ?? [];
    return flat.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [data?.pages]);

  return {
    posts,
    loadMoreRef: ref,
    fetchNextPage,
    isLoading: isPending,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    error,
    refetch,
    reshuffle,
  };
}

export function useInfiniteFeedManual(feedType: FeedType = "explore") {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    error,
    refetch,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ["feed-infinite-manual", feedType, getStoredHive()],
    queryFn: async ({ pageParam, signal }) => {
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

      const headers =
        feedType === "feed"
          ? await getAuthHeaders()
          : { "Content-Type": "application/json" };

      const response = await fetchWithTimeout(
        `/api/feed/infinite?${params}`,
        { headers, credentials: "include", signal },
        20_000,
      );

      if (!response.ok) {
        throw new Error(`Feed ${response.status}`);
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
    isLoading: isPending,
    isFetchingNextPage,
    hasNextPage,
    error,
    refetch,
  };
}
