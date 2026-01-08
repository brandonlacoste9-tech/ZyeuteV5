import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { analyzeVideoThumbnail } from "../ai/smart-ai-router.js";
import { initSentry, addBreadcrumb, captureException, flushSentry } from "../utils/sentry.js";
import { verifyPostOwnership } from "../utils/security.js";

// Initialize Sentry for worker
initSentry();

const execAsync = promisify(exec);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const WORKER_NAME = "zyeute-video-enhance";

console.log(`🐝 [${WORKER_NAME}] Worker started. Waiting for jobs...`);

const worker = new Worker(
  WORKER_NAME,
  async (job) => {
    const { postId, videoUrl, userId, filterType } = job.data as {
      postId: string; // Now required
      videoUrl: string;
      userId: string; // Required for security
      filterType?: string;
    };

    // 🔒 SECURITY: Verify ownership before processing
    // This prevents job injection attacks where someone could queue a job
    // to overwrite another user's video
    if (postId && userId) {
      try {
        await verifyPostOwnership(postId, userId);
      } catch (error: any) {
        console.error(`[${WORKER_NAME}] Ownership verification failed for post ${postId}:`, error.message);
        throw new Error(`Unauthorized: User ${userId} does not own post ${postId}`);
      }
    }

    // Validate required fields
    if (!postId) {
      throw new Error("postId is required for video processing");
    }
    if (!videoUrl) {
      throw new Error("videoUrl is required for video processing");
    }
    if (!userId) {
      throw new Error("userId is required for video processing");
    }

    console.log(
      `🎬 Processing Job ${job.id}: ${
        postId ? `Post ${postId}` : "No postId provided (legacy job)"
      }`,
    );

    // Add Sentry breadcrumb for job start
    addBreadcrumb("Job started", "video_processing", {
      jobId: job.id?.toString(),
      postId,
      videoUrl: videoUrl.substring(0, 100), // Truncate for privacy
    });

    const tempIn = path.join("/tmp", `${job.id}_in`);
    const tempOut = path.join("/tmp", `${job.id}_out.mp4`);
    const tempThumb = path.join("/tmp", `${job.id}_thumb.jpg`);

    try {
      // 1. Update Status in Supabase posts table (if postId is provided)
      if (postId) {
        addBreadcrumb("Updating post status to processing", "database", { postId });
        await supabase
          .from("posts")
          .update({ processing_status: "processing" })
          .eq("id", postId);
      }

      // 2. Download original video
      console.log(`⬇️ Downloading source video: ${videoUrl}`);
      addBreadcrumb("Downloading video", "network", { videoUrl: videoUrl.substring(0, 100) });
      const res = await fetch(videoUrl);
      if (!res.ok) {
        throw new Error(`Failed to download video: ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(tempIn, Buffer.from(arrayBuffer));
      addBreadcrumb("Video downloaded", "network", { size: arrayBuffer.byteLength });

      // 3. Normalize video with ffmpeg (H.264 + AAC, max 1080p)
      console.log("🎥 Normalizing video with ffmpeg...");
      const ffmpegCmd = [
        "ffmpeg",
        "-y",
        `-i "${tempIn}"`,
        '-vf "scale=\'min(1080,iw)\':-2"',
        "-c:v libx264",
        "-preset veryfast",
        "-crf 23",
        "-c:a aac",
        "-b:a 128k",
        `"${tempOut}"`,
      ].join(" ");

      addBreadcrumb("Running FFmpeg normalization", "ffmpeg", { command: ffmpegCmd.substring(0, 100) });
      await execAsync(ffmpegCmd);
      addBreadcrumb("FFmpeg normalization completed", "ffmpeg");

      // 4. Generate thumbnail at 1s
      console.log("📸 Generating thumbnail...");
      const thumbCmd = [
        "ffmpeg",
        "-y",
        `-i "${tempIn}"`,
        "-ss 00:00:01",
        "-vframes 1",
        `"${tempThumb}"`,
      ].join(" ");

      addBreadcrumb("Generating thumbnail", "ffmpeg", { command: thumbCmd.substring(0, 100) });
      await execAsync(thumbCmd);
      addBreadcrumb("Thumbnail generated", "ffmpeg");

      // 5. Upload normalized video to Supabase Storage (videos bucket)
      console.log("⬆️ Uploading enhanced video to Supabase...");
      const enhancedKey = `enhanced/${postId || "job"}_${Date.now()}.mp4`;
      const videoBuffer = fs.readFileSync(tempOut);

      addBreadcrumb("Uploading enhanced video", "storage", { key: enhancedKey });
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(enhancedKey, videoBuffer, {
          contentType: "video/mp4",
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl: enhancedUrl },
      } = supabase.storage.from("videos").getPublicUrl(enhancedKey);
      addBreadcrumb("Enhanced video uploaded", "storage", { url: enhancedUrl.substring(0, 100) });

      // 6. Upload thumbnail to Supabase Storage (thumbnails bucket)
      console.log("⬆️ Uploading thumbnail to Supabase...");
      let thumbnailUrl: string | null = null;
      if (fs.existsSync(tempThumb)) {
        const thumbKey = `thumbnails/${postId || "job"}_${Date.now()}.jpg`;
        const thumbBuffer = fs.readFileSync(tempThumb);

        addBreadcrumb("Uploading thumbnail", "storage", { key: thumbKey });
        const { error: thumbError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbKey, thumbBuffer, {
            contentType: "image/jpeg",
          });

        if (thumbError) {
          console.warn("⚠️ Thumbnail upload failed:", thumbError.message);
          addBreadcrumb("Thumbnail upload failed", "storage", { error: thumbError.message });
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("thumbnails").getPublicUrl(thumbKey);
          thumbnailUrl = publicUrl;
          addBreadcrumb("Thumbnail uploaded", "storage", { url: thumbnailUrl.substring(0, 100) });
        }
      }

      // 7. Extract metadata using Vertex AI (optional enhancement)
      let aiMetadata: any = null;
      if (fs.existsSync(tempThumb) && process.env.GOOGLE_CLOUD_PROJECT) {
        try {
          console.log("🤖 Extracting video metadata with Smart AI Router...");
          addBreadcrumb("Extracting AI metadata", "smart_ai_router", { postId });
          const thumbBase64 = fs.readFileSync(tempThumb).toString("base64");
          const analysis = await analyzeVideoThumbnail(thumbBase64, "image/jpeg");
          
          aiMetadata = {
            ai_caption: analysis.caption,
            ai_tags: analysis.tags,
            detected_objects: analysis.detected_objects,
            vibe_category: analysis.vibe_category,
            ai_confidence: analysis.confidence,
            extracted_at: new Date().toISOString(),
            service_used: (analysis as any)._service_used || "unknown", // Track which service was used
          };
          
          console.log(`✨ AI Metadata extracted: ${analysis.caption}`);
          addBreadcrumb("AI metadata extracted", "vertex_ai", {
            caption: analysis.caption.substring(0, 50),
            tags: analysis.tags.join(", "),
            vibe: analysis.vibe_category,
          });
        } catch (aiError: any) {
          console.warn("⚠️ Vertex AI metadata extraction failed (non-critical):", aiError.message);
          addBreadcrumb("AI metadata extraction failed (non-critical)", "vertex_ai", {
            error: aiError.message,
          });
          // Don't fail the job if AI extraction fails
        }
      }

      // 8. Finalize DB (only if postId is provided)
      if (postId) {
        const updateData: any = {
          processing_status: "completed",
          enhanced_url: enhancedUrl,
          thumbnail_url: thumbnailUrl,
        };

        // Add AI metadata if available
        if (aiMetadata) {
          updateData.ai_description = aiMetadata.ai_caption;
          updateData.ai_labels = aiMetadata.ai_tags;
          updateData.media_metadata = {
            ...aiMetadata,
            video_duration: null, // Could extract with ffprobe if needed
            resolution: null, // Could extract with ffprobe if needed
          };
        }

        addBreadcrumb("Updating post status to completed", "database", { postId });
        await supabase
          .from("posts")
          .update(updateData)
          .eq("id", postId);
      }

      addBreadcrumb("Job completed successfully", "video_processing", {
        jobId: job.id?.toString(),
        postId,
      });
      console.log(`✅ Job ${job.id} Completed!`);
      return {
        success: true,
        url: enhancedUrl,
        thumbnailUrl,
      };
    } catch (err: any) {
      console.error(`❌ Job ${job.id} Failed:`, err);

      // Capture error in Sentry with full context
      captureException(err, {
        tags: {
          job_type: "video_processing",
          processing_status: "failed",
          worker_name: WORKER_NAME,
        },
        extra: {
          jobId: job.id?.toString(),
          postId,
          videoUrl: videoUrl.substring(0, 100),
          filterType,
          errorMessage: err.message,
          errorStack: err.stack,
        },
      });

      addBreadcrumb("Job failed", "video_processing", {
        jobId: job.id?.toString(),
        postId,
        error: err.message,
      });

      if (postId) {
        await supabase
          .from("posts")
          .update({ 
            processing_status: "failed", 
            ai_error: err.message 
          })
          .eq("id", postId);
      }

      throw err;
    } finally {
      if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
      if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
      if (fs.existsSync(tempThumb)) fs.unlinkSync(tempThumb);
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
    },
    concurrency: 2, // Process 2 videos concurrently (adjust based on server capacity)
    limiter: {
      max: 10, // Max 10 jobs per interval
      duration: 60000, // Per minute
    },
  },
);

// Worker event handlers for better observability
worker.on("completed", (job) => {
  console.log(`✅ [${WORKER_NAME}] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ [${WORKER_NAME}] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error(`🚨 [${WORKER_NAME}] Worker error:`, err);
  captureException(err, {
    tags: {
      worker_name: WORKER_NAME,
      error_type: "worker_error",
    },
  });
});

// Handle process exit to flush Sentry events
process.on("SIGTERM", async () => {
  console.log("🛑 Worker shutting down, flushing Sentry...");
  await flushSentry(2000);
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Worker shutting down, flushing Sentry...");
  await flushSentry(2000);
  process.exit(0);
});
