import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { insertStorySchema } from "../../shared/schema.js";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  next();
};

const router = Router();

// Get active stories
router.get("/", optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const stories = await storage.getActiveStories(userId);
    res.json({ stories });
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({ error: "Failed to get stories" });
  }
});

// Create story
router.post("/", requireAuth, async (req, res) => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const parsed = insertStorySchema.safeParse({
      ...req.body,
      userId: req.userId,
      expiresAt,
    });

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const story = await storage.createStory(parsed.data);
    res.status(201).json({ story });
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ error: "Failed to create story" });
  }
});

// Mark story as viewed
router.post("/:id/view", requireAuth, async (req, res) => {
  try {
    await storage.markStoryViewed(req.params.id as string, req.userId!);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark story viewed error:", error);
    res.status(500).json({ error: "Failed to mark story viewed" });
  }
});

export default router;
