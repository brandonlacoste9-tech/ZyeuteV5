import { VideoProcessingJob, processVideo } from "./videoProcessor.js";
import { uploadProcessedVideo } from "./storage.js";
import {
  updatePostStatus,
  saveVideoUrls,
  isTiGuyCommentEnabled,
} from "./videoDatabase.js";
import { notifyCompletion, sendProgress } from "./notifications.js";
import { scoutVideo } from "./videoEnrichment.js";
import { postTiGuyFirstComment } from "./engagementService.js";

export const VideoOrchestrator = {
  async process(jobData: VideoProcessingJob) {
    const { postId, userId } = jobData;
    console.log(`[Orchestrator] Starting processing for post ${postId}`);

    try {
      // 1. Update Status
      await updatePostStatus(postId, "processing");
      await sendProgress(userId, postId, 10, "Downloading");

      // 2. Process Video (Download, Transcode, Thumbnail)
      // This handles download, valid, transcode, filter, thumb generation
      const processedFiles = await processVideo(jobData);

      await sendProgress(userId, postId, 60, "Scouting");

      // 2.5 Scout Video (AI Enrichment)
      // We use the low-res version for AI scouting to save memory/tokens
      let scoutResult = null;
      try {
        scoutResult = await scoutVideo(processedFiles.videoLow, postId);

        // Safety Patrol: If rejected, we hide the post
        if (scoutResult && !scoutResult.safetyApproved) {
          console.warn(
            `🚨 [Orchestrator] Safety Patrol REJECTED post ${postId}: ${scoutResult.safetyReason}`,
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
            }).catch((e) =>
              console.error("[Orchestrator] Engagement failed:", e),
            );
          } else {
            console.log(
              `[Orchestrator] Ti-Guy comment skipped for user ${userId} (disabled in profile)`,
            );
          }
        }
      } catch (scoutError: any) {
        console.error(
          `[Orchestrator] Scouting failed or rejected for ${postId}:`,
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
        console.log(`[Orchestrator] Triggering transcription for post ${postId}`);
        fetch(
          `${process.env.VITE_SUPABASE_URL}/functions/v1/transcribe-media`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              publicationId: postId,
              mediaUrl: urls.videoHighUrl,
            }),
          },
        ).catch((err) =>
          console.error(`[Orchestrator] Transcription trigger failed:`, err),
        );
      }

      await sendProgress(userId, postId, 100, "Done");
      await notifyCompletion(userId, postId, true, urls.videoHighUrl);

      console.log(`[Orchestrator] Job completed for post ${postId}`);
      return urls;
    } catch (error: any) {
      console.error(`[Orchestrator] Job failed for post ${postId}:`, error);
      await updatePostStatus(postId, "failed");
      await notifyCompletion(userId, postId, false);
      throw error;
    }
  },
};
