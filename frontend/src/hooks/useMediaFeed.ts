import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { getMediaFeed } from "@/services/api";

export function useMediaFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["media-feed"],
    queryFn: async ({ pageParam }) => {
      // getMediaFeed returns { items, nextCursor }
      return getMediaFeed(pageParam as string | undefined);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "400px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return {
    items,
    loadMoreRef: ref,
    isLoading,
    isFetchingNextPage,
    error,
    refetch,
  };
}
