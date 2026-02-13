// Colony OS: Supabase Webhook trigger for video processing
// This function listens for new uploads to the 'raw-uploads' bucket
// and triggers the Railway Video Worker.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WORKER_URL =
  Deno.env.get("VIDEO_WORKER_URL") ||
  "https://video-worker-production.up.railway.app";
const WORKER_SECRET = Deno.env.get("WORKER_SECRET"); // Secret for authentication

console.log("Colony OS Webhook Initialized");

serve(async (req) => {
  try {
    const payload = await req.json();

    // Check if event is an INSERT to storage.objects
    if (
      payload.type === "INSERT" &&
      payload.table === "objects" &&
      payload.schema === "storage"
    ) {
      const record = payload.record;

      // Only process video files in 'raw-uploads' bucket
      if (
        record.bucket_id === "raw-uploads" &&
        record.name.match(/\.(mp4|mov|avi|mkv)$/i)
      ) {
        console.log(`[Colony OS] New video detected: ${record.name}`);

        // Trigger the Railway Worker
        const response = await fetch(`${WORKER_URL}/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${WORKER_SECRET}`,
          },
          body: JSON.stringify({
            videoId: record.id,
            filePath: record.name,
            bucket: record.bucket_id,
            owner: record.owner,
            config: {
              hls_time: 10,
              level: "3.0",
              profile: "baseline",
            },
          }),
        });

        if (!response.ok) {
          console.error(
            `[Colony OS] Worker trigger failed: ${response.statusText}`,
          );
          return new Response(JSON.stringify({ error: "Worker failed" }), {
            status: 500,
          });
        }

        const data = await response.json();
        console.log(`[Colony OS] Worker triggered successfully:`, data);

        return new Response(
          JSON.stringify({ success: true, workerResponse: data }),
          {
            headers: { "Content-Type": "application/json" },
            status: 200,
          },
        );
      }
    }

    return new Response(
      JSON.stringify({ message: "Ignored (not a raw video upload)" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("[Colony OS] Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
