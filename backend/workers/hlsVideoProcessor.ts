/**
 * HLS Video Processor Worker
 * Transcodes uploaded videos to HLS format for adaptive bitrate streaming.
 * Runs as a separate BullMQ worker on the video-hls-processing queue.
 */

import { Worker, Job } from "bullmq";
import fs from "fs/promises";
import path from "path";
import { getBullMQConnection } from "../redis.js";
import { processVideoToHLS } from "../services/videoProcessor.js";
import { uploadHLSToStorage } from "../services/storage.js";
import { updatePostStatus, saveHLSUrls } from "../services/videoDatabase.js";

export interface HLSVideoJob {
  postId: string;
  videoUrl: string;
  userId: string;
}

const connection = getBullMQConnection();

let worker: Worker<HLSVideoJob>;

if (!connection) {
  worker = {
    close: async () => {},
    on: () => {},
  } as unknown as Worker<HLSVideoJob>;
} else {
  worker = new Worker<HLSVideoJob>(
    "video-hls-processing",
    async (job: Job<HLSVideoJob>) => {
      const { postId, videoUrl, userId } = job.data;

      console.log(`[HLS Worker] Processing post ${postId}`);

      try {
        await updatePostStatus(postId, "processing");

        const result = await processVideoToHLS({ postId, videoUrl });

        const { hlsUrl, thumbnailUrl } = await uploadHLSToStorage(
          result,
          postId,
        );

        await saveHLSUrls(postId, { hlsUrl, thumbnailUrl });

        await updatePostStatus(postId, "completed");

        // Cleanup temp directory
        try {
          await fs.rm(result.outDir, { recursive: true, force: true });
        } catch (e) {
          console.warn(`[HLS Worker] Cleanup failed for ${result.outDir}:`, e);
        }

        // Notify API for cache invalidation
        const apiBase =
          process.env.API_BASE_URL ||
          process.env.RAILWAY_STATIC_URL ||
          "http://localhost:3000";
        await fetch(`${apiBase}/api/webhook/video-processed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: postId }),
        }).catch((err) =>
          console.warn("[HLS Worker] Webhook failed:", err.message),
        );

        console.log(`[HLS Worker] Completed post ${postId}`);
        return { success: true, hlsUrl, thumbnailUrl };
      } catch (error: any) {
        console.error(`[HLS Worker] Failed post ${postId}:`, error.message);
        await updatePostStatus(postId, "failed");
        throw error;
      }
    },
    {
      connection,
      concurrency: parseInt(process.env.HLS_WORKER_CONCURRENCY || "1"),
      limiter: { max: 5, duration: 60000 },
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[HLS Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[HLS Worker] Redis error:", err.message);
  });
}

export { worker as hlsVideoWorker };
