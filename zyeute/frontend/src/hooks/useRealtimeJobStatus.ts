import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useRealtimeJobStatus(
  postId: string,
  onStatusChange: (status: string, enhancedUrl?: string) => void
) {
  useEffect(() => {
    if (!postId) return;

    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    const setupChannel = async () => {
      if (!isMounted) return;

      channel = supabase.channel(`post:${postId}:status`);

      channel
        .on("broadcast", { event: "status" }, ({ payload }) => {
          if (!isMounted) return;
          console.log("Status update:", payload);
          onStatusChange(payload.status, payload.enhanced_url);
        })
        .subscribe();
    };

    setupChannel();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [postId, onStatusChange]);
}
