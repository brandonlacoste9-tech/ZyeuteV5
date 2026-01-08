import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/types";

const PAGE_SIZE = 10;

export function useFeedVideos() {
  return useInfiniteQuery({
    queryKey: ["feed-videos"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // Fetch videos with user profile and reactions
      const { data, error } = await supabase
        .from("publications")
        .select(
          `
          *,
          user:user_profiles!user_id(
            id,
            username,
            display_name,
            avatar_url
          )
        `
        )
        .eq("processing_status", "completed")
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      // Fetch user's reactions for these posts in parallel
      const postIds = (data || []).map((post: any) => post.id);
      
      let userReactions: string[] = [];
      if (postIds.length > 0) {
        const { data: reactionsData } = await supabase
          .from("reactions")
          .select("publication_id")
          .eq("user_id", user.id)
          .in("publication_id", postIds);

        userReactions = (reactionsData || []).map((r: any) => r.publication_id);
      }

      // Transform data to include user_has_fired boolean
      return (data || []).map((video: any) => ({
        ...video,
        user_has_fired: userReactions.includes(video.id),
        user: video.user || null,
      })) as Post[];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length : undefined,
    initialPageParam: 0,
  });
}
