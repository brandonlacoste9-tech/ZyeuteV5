import { Router, Request, Response } from "express";
import { db } from "../storage.js";
import { posts, colonyTasks, media } from "../../shared/schema.js";
import { eq, or } from "drizzle-orm";
import { getVideoQueue } from "../queue.js";
import { z } from "zod";

const router = Router();

const enhanceSchema = z.object({
  filter: z.string().optional(),
});

export const enhancePostHandler = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    // Validate body
    const body = enhanceSchema.parse(req.body);
    const filter = body.filter || "none";

    // Update Post status to 'pending'
    const [updatedPost] = await db
      .update(posts)
      .set({
        processingStatus: "pending",
        enhanceStartedAt: new Date(),
        visualFilter: filter,
      })
      .where(eq(posts.id, postId))
      .returning();

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    const videoUrl = updatedPost.mediaUrl || updatedPost.originalUrl;
    if (!videoUrl) {
      return res.status(400).json({ error: "Post has no video URL" });
    }

    // Find the media record
    let mediaRecord = await db.query.media.findFirst({
      where: or(
        updatedPost.muxAssetId
          ? eq(media.muxAssetId, updatedPost.muxAssetId)
          : undefined,
        updatedPost.mediaUrl
          ? eq(media.supabaseUrl, updatedPost.mediaUrl)
          : undefined,
      ),
    });

    // Fallback: If no media record exists, create one (Robustness)
    if (!mediaRecord && updatedPost.userId) {
      console.log("Creating missing Media record for post enhancement...");
      [mediaRecord] = await db
        .insert(media)
        .values({
          userId: updatedPost.userId,
          type: "VIDEO",
          thumbnailUrl: updatedPost.thumbnailUrl || updatedPost.mediaUrl || "", // Placeholder
          muxAssetId: updatedPost.muxAssetId,
          supabaseUrl: updatedPost.mediaUrl,
          caption: updatedPost.caption,
        })
        .returning();
    }

    if (!mediaRecord) {
      return res.status(500).json({ error: "Could not resolve Media record" });
    }

    // Enqueue job to BullMQ
    const videoQueue = getVideoQueue();
    await videoQueue.add("upscale_video", {
      mediaId: mediaRecord.id,
      muxAssetId: mediaRecord.muxAssetId,
      supabaseUrl: mediaRecord.supabaseUrl,
      userId: updatedPost.userId,
      filter: filter, // Pass filter to worker
    });

    // Remove legacy Postgres task insert
    /*
    const [task] = await db
      .insert(colonyTasks)
      .values({
        command: "upscale_video",
        origin: "Deep Enhance API",
        status: "pending",
        priority: "high", // Deep Enhance is high priority for user experience
        metadata: {
          postId: updatedPost.id,
          videoUrl: videoUrl,
          filter: updatedPost.visualFilter,
        },
      })
      .returning();
    */

    res.json({
      status: "queued",
      message: "Enhancement job queued",
      data: {
        post: updatedPost,
        mediaId: mediaRecord.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }
    console.error("Enhance API Error:", error);
    res.status(500).json({ error: "Failed to queue enhancement" });
  }
};

router.post("/posts/:id/enhance", enhancePostHandler);

export default router;
