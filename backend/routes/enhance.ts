import { Router, Request, Response } from "express";
import { db } from "../storage.js";
import { posts, colonyTasks } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

export const enhancePostHandler = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    // Optional: visual_filter from body
    const { filter } = req.body;

    // Update Post status to 'pending'
    const [updatedPost] = await db
      .update(posts)
      .set({
        processingStatus: "pending",
        enhanceStartedAt: new Date(),
        visualFilter: filter || "none",
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

    // Enqueue task for Colony Worker
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

    res.json({
      status: "success",
      message: "Enhancement job started",
      data: {
        post: updatedPost,
        taskId: task.id,
      },
    });
  } catch (error) {
    console.error("Enhance API Error:", error);
    res.status(500).json({ error: "Failed to queue enhancement" });
  }
};

router.post("/posts/:id/enhance", enhancePostHandler);

export default router;
