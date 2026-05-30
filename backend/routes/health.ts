import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

/**
 * Feed health – checks that the feed pipeline can return data.
 * Used by monitoring/restarts. Returns 503 if DB explore fails.
 */
router.get("/feed", async (req: Request, res: Response) => {
  try {
    const { storage } = await import("../storage.js");
    const posts = await storage.getExplorePosts(0, 1, "quebec");
    const hasPosts = Array.isArray(posts) && posts.length > 0;
    res.status(200).json({
      status: hasPosts ? "ok" : "empty",
      feed: hasPosts ? "ready" : "no_content",
      count: posts?.length ?? 0,
    });
  } catch (error: any) {
    console.error("[Health] Feed check failed:", error?.message || error);
    res.status(503).json({
      status: "unhealthy",
      feed: "error",
      code: "FEED_HEALTH_FAIL",
      message: error?.message || "Feed check failed",
    });
  }
});

export default router;
