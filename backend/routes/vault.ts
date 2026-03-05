import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

// Vault a post (swipe right - legacy mode)
router.post("/:postId/vault", requireAuth, async (req, res) => {
  try {
    const { postId } = req.params as { postId: string };
    const post = await storage.getPost(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Update post to vaulted
    await storage.updatePost(postId, { isVaulted: true });
    res.json({ success: true, message: "Post vaulted" });
  } catch (error: any) {
    console.error("Vault error:", error);
    res.status(500).json({ error: "Failed to vault post" });
  }
});

// Mark post as "not interested" (swipe left - gesture mode)
router.post("/:postId/not-interested", requireAuth, async (req, res) => {
  try {
    const { postId } = req.params as { postId: string };
    const userId = req.userId!;
    const post = await storage.getPost(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Future: Update user's content preferences in database
    console.log(`User ${userId} marked post ${postId} as not interested`);

    res.json({
      success: true,
      message: "Preferences updated - you'll see less content like this",
    });
  } catch (error: any) {
    console.error("Not interested error:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

export default router;
