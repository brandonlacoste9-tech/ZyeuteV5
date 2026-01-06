import { Worker, Job } from "bullmq";
import { processVideo, VideoProcessingJob } from "./services/videoProcessor.js";
import { uploadProcessedVideo } from "./services/storage.js";
import {
  updatePostStatus,
  saveVideoUrls,
  isTiGuyCommentEnabled,
} from "./services/videoDatabase.js";
import { notifyCompletion, sendProgress } from "./services/notifications.js";
import { scoutVideo } from "./services/videoEnrichment.js";
import { postTiGuyFirstComment } from "./services/engagementService.js";
import { MemoryMinerBee } from "./ai/bees/memory-miner.js";
import { PrivacyAuditorBee } from "./ai/bees/privacy-auditor.js";
import { HiveTask } from "./ai/types.js";
import { db } from "./storage.js";
import { media } from "../shared/schema.js";
import { eq } from "drizzle-orm";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const videoWorker = new Worker<any>(
  "zyeute-video-enhance",
  async (job) => {
    console.log(`[Worker] Processing job ${job.name} (${job.id})`);

    // --- UPSCALE VIDEO PROCESSOR ---
    if (job.name === "upscale_video") {
      const { mediaId, muxAssetId, supabaseUrl, userId, filter } = job.data;
      console.log(`[Worker] Upscaling video for Media ${mediaId}`);

      try {
        // Update status to PROCESSING
        await db
          .update(media)
          .set({ enhanceStatus: "PROCESSING" })
          .where(eq(media.id, mediaId));

        // Determine download URL
        let videoUrl = supabaseUrl;
        if (muxAssetId) {
          // If Mux, use public playback URL (HLS) or MP4 if available
          // For simplicity, we'll try the HLS stream or assume download logic handles it
          // Ideally, we'd get a signed download URL or MP4 URL.
          // Assuming we use the HLS URL for now as ffmpeg can handle it.
          // Wait, need playback ID. We don't have it in payload.
          // But we can assume supabaseUrl is passed if it's there, or we fetch from DB.
          // Let's rely on what was passed or fetch from DB if needed.
          if (!videoUrl) {
            const mediaRecord = await db
              .select()
              .from(media)
              .where(eq(media.id, mediaId))
              .limit(1);
            // Mux asset ID doesn't give URL directly.
            // But we used supabaseUrl as mediaUrl in route.
            // Let's assume input has a valid URL.
            throw new Error("No video URL provided for Mux asset");
          }
        }

        if (!videoUrl) throw new Error("No video URL provided");

        // Process Video
        const processedFiles = await processVideo({
          videoUrl,
          userId,
          postId: "media-" + mediaId, // Placeholder
          visual_filter: filter,
        });

        // Upload Enhanced
        const urls = await uploadProcessedVideo(
          processedFiles,
          "media-" + mediaId,
        );

        // Update Media
        await db
          .update(media)
          .set({
            enhancedUrl: urls.videoHighUrl,
            enhanceStatus: "DONE",
            enhancedAt: new Date(),
          })
          .where(eq(media.id, mediaId));

        console.log(`[Worker] Upscale complete for Media ${mediaId}`);
        return urls;
      } catch (error: any) {
        console.error(`[Worker] Upscale failed for Media ${mediaId}:`, error);
        await db
          .update(media)
          .set({ enhanceStatus: "FAILED" })
          .where(eq(media.id, mediaId));
        throw error;
      }
    }

    // --- LEGACY PROCESS VIDEO (Keep for compatibility if needed) ---
    if (job.name === "processVideo" || !job.name) {
      // ... (Keep existing logic)
      const { postId, userId } = job.data;
      // ... (Logic from before)
      return legacyProcessVideo(job);
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "2"),
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

async function legacyProcessVideo(job: any) {
  const { postId, userId } = job.data;
  console.log(`[Worker] Starting legacy job for post ${postId}`);

  try {
    // 1. Update Status
    await updatePostStatus(postId, "processing");
    await sendProgress(userId, postId, 10, "Downloading");

    // 2. Process Video (Download, Transcode, Thumbnail)
    // This handles download, valid, transcode, filter, thumb generation
    const processedFiles = await processVideo(job.data);

    await sendProgress(userId, postId, 60, "Scouting");

    // 2.5 Scout Video (AI Enrichment)
    // We use the low-res version for AI scouting to save memory/tokens
    let scoutResult = null;
    try {
      scoutResult = await scoutVideo(processedFiles.videoLow, postId);

      // Safety Patrol: If rejected, we hide the post
      if (scoutResult && !scoutResult.safetyApproved) {
        console.warn(
          `🚨 [Worker] Safety Patrol REJECTED post ${postId}: ${scoutResult.safetyReason}`,
        );
        await updatePostStatus(postId, "failed"); // Mark as failed or we could add a 'hidden' status
        // We'll stop here to prevent notification/upload of bad content
        throw new Error(
          `Contenu rejeté par la Patrouille de Sécurité: ${scoutResult.safetyReason}`,
        );
      }

      // Automated Engagement: If safe, Ti-Guy leaves the first comment
      if (scoutResult && scoutResult.safetyApproved) {
        // Check if user has enabled Ti-Guy comments
        const isEnabled = await isTiGuyCommentEnabled(userId);

        if (isEnabled) {
          // Fire and forget engagement so it doesn't block the worker completion
          postTiGuyFirstComment(postId, {
            summary: scoutResult.summary,
            tags: scoutResult.tags,
          }).catch((e) => console.error("[Worker] Engagement failed:", e));
        } else {
          console.log(
            `[Worker] Ti-Guy comment skipped for user ${userId} (disabled in profile)`,
          );
        }
      }
    } catch (scoutError: any) {
      console.error(
        `[Worker] Scouting failed or rejected for ${postId}:`,
        scoutError.message,
      );
      if (scoutError.message.includes("Contenu rejeté")) throw scoutError;
      // If it's just a technical failure, we can continue to upload
    }

    await sendProgress(userId, postId, 80, "Uploading");

    // 3. Upload to Storage
    const urls = await uploadProcessedVideo(processedFiles, postId);

    // 4. Update Database
    await saveVideoUrls(postId, urls);

    // 5. Trigger AI Transcription (Phase 9)
    if (urls.videoHighUrl) {
      console.log(`[Worker] Triggering transcription for post ${postId}`);
      fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/transcribe-media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          publicationId: postId,
          mediaUrl: urls.videoHighUrl,
        }),
      }).catch((err) =>
        console.error(`[Worker] Transcription trigger failed:`, err),
      );
    }

    await sendProgress(userId, postId, 100, "Done");
    await notifyCompletion(userId, postId, true, urls.videoHighUrl);

    console.log(`[Worker] Job completed for post ${postId}`);
    return urls;
  } catch (error: any) {
    console.error(`[Worker] Job failed for post ${postId}:`, error);
    await updatePostStatus(postId, "failed");
    await notifyCompletion(userId, postId, false);
    throw error; // BullMQ handles retry
  }
}

videoWorker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed!`);
});

videoWorker.on("failed", (job, err) => {
  console.log(`[Worker] Job ${job?.id} failed with ${err.message}`);
});

// --- MEMORY MINER WORKER ---
export const memoryWorker = new Worker(
  "zyeute-memory-miner",
  async (job) => {
    const { userId } = job.data;
    const taskId = job.id || `mininator-${Date.now()}`;

    console.log(
      `[MemoryWorker] ⛏️ Starting mining for user ${userId} (Task: ${taskId})`,
    );

    try {
      const miner = new MemoryMinerBee();

      // Construct a HiveTask payload for the Bee
      const task: HiveTask = {
        id: taskId,
        type: "text_chat",
        payload: {
          userId,
          systemInstruction: "MINE_MEMORY",
        },
        userId, // HiveTask has dedicated userId field
        createdAt: new Date(),
      };

      const result = await miner.run(task);
      console.log(`[MemoryWorker] ✅ Mining complete for ${userId}:`, result);
      return result;
    } catch (error: any) {
      console.error(`[MemoryWorker] 🚨 Mining failed for ${userId}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Keep concurrency low to save tokens/rate limits
    limiter: {
      max: 5,
      duration: 60000, // Max 5 mining jobs per minute per worker
    },
  },
);

memoryWorker.on("completed", (job) => {
  console.log(`[MemoryWorker] Job ${job.id} completed!`);
});

memoryWorker.on("failed", (job, err) => {
  console.log(`[MemoryWorker] Job ${job?.id} failed with ${err.message}`);
});

// --- PRIVACY AUDITOR WORKER ---
export const privacyWorker = new Worker(
  "zyeute-privacy-auditor",
  async (job) => {
    console.log(`[PrivacyWorker] 🔒 Starting Privacy Audit...`);
    try {
      const auditor = new PrivacyAuditorBee();
      const result = await auditor.run({ limit: 50, force: true });
      console.log(`[PrivacyWorker] ✅ Compliance Check Complete:`, result);
      return result;
    } catch (error) {
      console.error(`[PrivacyWorker] 🚨 Audit failed:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 1,
  },
);
