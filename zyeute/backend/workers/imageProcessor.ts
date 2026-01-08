/**
 * Image Processing Worker - BullMQ worker for image enhancement
 * Uses Sharp for fast, efficient image processing
 */

import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { processImage, generateImageThumbnail } from "../services/imageProcessor.js";
import { saveImageUrls } from "../services/imageDatabase.js";
import { updatePostStatus } from "../services/videoDatabase.js";
import { sendProgress, notifyCompletion } from "../services/notifications.js";
import { verifyPostOwnership } from "../utils/security.js";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
};

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface ImageProcessingJob {
  postId: string;
  userId: string;
  imageUrl: string;
  visualFilter?: string;
}

export const imageWorker = new Worker<ImageProcessingJob>(
  "processImage",
  async (job) => {
    const { postId, userId, imageUrl, visualFilter } = job.data;
    console.log(`[Image Worker] Starting job for post ${postId}`);

    try {
      // 🔒 SECURITY: Verify ownership before processing
      // This prevents job injection attacks where someone could queue a job
      // to overwrite another user's image
      await verifyPostOwnership(postId, userId);

      // 1. Update Status
      await updatePostStatus(postId, "processing");
      await sendProgress(userId, postId, 10, "Downloading");

      // 2. Download Image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      const imageBuffer = Buffer.from(await response.arrayBuffer());

      await sendProgress(userId, postId, 30, "Processing");

      // 3. Process Image (Apply Filter)
      const processed = await processImage(imageBuffer, visualFilter);

      await sendProgress(userId, postId, 50, "Generating Thumbnail");

      // 4. Generate Thumbnail
      const thumbnailBuffer = await generateImageThumbnail(imageBuffer, 400);

      await sendProgress(userId, postId, 60, "Uploading");

      // 5. Upload to Supabase Storage (buffers directly, no temp files)
      const timestamp = Date.now();
      const basePath = `posts/${postId}/${timestamp}`;
      
      // Upload processed image
      const processedKey = `${basePath}/processed.webp`;
      const { error: processedError } = await supabase.storage
        .from("videos") // Using videos bucket for consistency (or create images bucket)
        .upload(processedKey, processed.processedBuffer, {
          contentType: "image/webp",
        });

      if (processedError) {
        throw new Error(`Failed to upload processed image: ${processedError.message}`);
      }

      const {
        data: { publicUrl: processedUrl },
      } = supabase.storage.from("videos").getPublicUrl(processedKey);

      // Upload thumbnail
      const thumbnailKey = `${basePath}/thumbnail.webp`;
      const { error: thumbnailError } = await supabase.storage
        .from("videos")
        .upload(thumbnailKey, thumbnailBuffer, {
          contentType: "image/webp",
        });

      if (thumbnailError) {
        console.warn("⚠️ Thumbnail upload failed:", thumbnailError.message);
      }

      const {
        data: { publicUrl: thumbnailUrl },
      } = supabase.storage.from("videos").getPublicUrl(thumbnailKey);

      await sendProgress(userId, postId, 80, "Saving");

      // 6. Update Database
      await saveImageUrls(postId, {
        processedUrl,
        thumbnailUrl: thumbnailError ? null : thumbnailUrl,
        width: processed.width,
        height: processed.height,
      });

      await sendProgress(userId, postId, 100, "Done");
      await notifyCompletion(userId, postId, true, processedUrl);

      console.log(`[Image Worker] Job completed for post ${postId}`);
      return { processedUrl, thumbnailUrl };
    } catch (error: any) {
      console.error(`[Image Worker] Job failed for post ${postId}:`, error);
      await updatePostStatus(postId, "failed");
      await notifyCompletion(userId, postId, false);
      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.IMAGE_WORKER_CONCURRENCY || "3"),
    limiter: {
      max: 20,
      duration: 1000,
    },
  }
);

console.log(`🐝 [Image Worker] Worker started. Waiting for jobs...`);
