import { useEffect, useState } from "react";
// TODO: Replace with realtime abstraction once alternative service is configured
import { createChannel, removeChannel } from "@/lib/legacySupabase";
import { useAuth } from "./useAuth";

/**
 * usePresence - Hook to track live viewers and real-time engagement
 * @param publicationId The ID of the post/video being viewed
 */
export function usePresence(publicationId: string) {
  const [viewerCount, setViewerCount] = useState(0);
  const [engagement, setEngagement] = useState<{
    fireCount?: number;
    commentCount?: number;
  }>({});
  const { user } = useAuth();

  useEffect(() => {
    // We only track presence if publicationId is provided and we are not in mock mode or have a user
    if (!publicationId) return;

    // Use a private channel for presence and engagement
    // TODO: Replace with alternative realtime service (Soketi/Pusher) if needed
    const channel = createChannel(`publication:${publicationId}:presence`, {
      presence: {
        key: user?.id || "guest-" + Math.random().toString(36).substr(2, 9),
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        // TODO: Fix type - Supabase channels have presenceState but our interface needs update
        const state = (channel as any).presenceState();
        // Number of unique keys in presence state
        setViewerCount(Object.keys(state).length);
      })
      .on("broadcast", { event: "counts_changed" }, (payload: any) => {
        // This payload comes from our database trigger in Phase 6
        if (payload?.post_id === publicationId) {
          setEngagement({
            fireCount: payload.reactions_count,
            commentCount: payload.comments_count,
          });
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          // Track the user's presence in this channel
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      removeChannel(channel);
    };
  }, [publicationId, user?.id]);

  return { viewerCount, engagement };
}
