/**
 * useFeedEngagement - Efficient real-time engagement for feed
 *
 * Unlike usePresence (per-post channel), this uses a single Supabase
 * Realtime channel to listen for engagement updates across all visible
 * posts in the feed. This avoids N simultaneous channel subscriptions.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

const feedEngagementLogger = logger.withContext("FeedEngagement");

interface EngagementUpdate {
  postId: string;
  fireCount?: number;
  commentCount?: number;
  shareCount?: number;
}

interface FeedEngagementState {
  [postId: string]: {
    fireCount?: number;
    commentCount?: number;
    shareCount?: number;
  };
}

/**
 * Subscribe to real-time engagement updates for a batch of post IDs.
 * Returns a map of postId -> { fireCount, commentCount, shareCount }
 * that updates live as reactions come in.
 */
export function useFeedEngagement(postIds: string[]) {
  const [state, setState] = useState<FeedEngagementState>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const postIdsRef = useRef<string[]>([]);

  // Track which IDs changed
  const idsKey = postIds.slice(0, 20).join(","); // Limit to visible batch

  useEffect(() => {
    if (!postIds.length) return;

    postIdsRef.current = postIds;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Single channel for all feed engagement
    let channel: ReturnType<typeof supabase.channel>;
    try {
      channel = supabase.channel("feed:engagement", {
        config: { broadcast: { self: true } },
      });
    } catch (err) {
      feedEngagementLogger.warn("Failed to create engagement channel:", err);
      return;
    }

    channel
      .on("broadcast", { event: "engagement_update" }, (payload: any) => {
        const data = payload?.payload as EngagementUpdate | undefined;
        if (!data?.postId) return;

        // Only update if this post is in our current view
        if (postIdsRef.current.includes(data.postId)) {
          setState((prev) => ({
            ...prev,
            [data.postId]: {
              ...prev[data.postId],
              ...(data.fireCount !== undefined && {
                fireCount: data.fireCount,
              }),
              ...(data.commentCount !== undefined && {
                commentCount: data.commentCount,
              }),
              ...(data.shareCount !== undefined && {
                shareCount: data.shareCount,
              }),
            },
          }));
        }
      })
      // Listen for Postgres changes on reactions table (fires)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
        },
        (payload: any) => {
          const postId =
            payload.new?.publication_id || payload.old?.publication_id;
          if (postId && postIdsRef.current.includes(postId)) {
            feedEngagementLogger.debug("Reaction change for post:", postId);
            // We don't have the count here, but we can trigger a UI update hint
            setState((prev) => ({
              ...prev,
              [postId]: {
                ...prev[postId],
                // Optimistic increment/decrement
                fireCount:
                  payload.eventType === "INSERT"
                    ? (prev[postId]?.fireCount ?? 0) + 1
                    : payload.eventType === "DELETE"
                      ? Math.max(0, (prev[postId]?.fireCount ?? 1) - 1)
                      : prev[postId]?.fireCount,
              },
            }));
          }
        },
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          feedEngagementLogger.debug(
            `Feed engagement channel active for ${postIds.length} posts`,
          );
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [idsKey]); // Re-subscribe when visible post IDs change

  /**
   * Get engagement for a specific post, merging real-time updates
   * with the original post data.
   */
  const getEngagement = useCallback(
    (postId: string) => state[postId] || {},
    [state],
  );

  return { engagement: state, getEngagement };
}
