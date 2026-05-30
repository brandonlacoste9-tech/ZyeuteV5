import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import {
  v3TiGuyChat,
  v3Flow,
  v3Feed,
  v3Microcopy,
  FAL_PRESETS,
} from "../v3-swarm.js";
import { generateVideo } from "../ai/media/video-engine.js";
import { storage } from "../storage.js";
import { volumePricingService } from "../services/volume-pricing-service.js";
import { joualizeText, type JoualStyle } from "../services/joualizer.js";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Trop de requêtes AI. Réessaie dans quelques minutes! 🦫" },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// Ti-Guy Chat (V3 Swarm)
router.post("/chat", aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: "DeepSeek API key not configured" });
    }

    const reply = await v3TiGuyChat(message, context);
    res.json({ reply });
  } catch (error: any) {
    console.error("V3 Chat error:", error);
    res
      .status(500)
      .json({ error: error.message || "Ti-Guy is currently busy" });
  }
});

// V3 Flow - Complex task orchestration
router.post("/flow", aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { action, context } = req.body;
    if (!action) return res.status(400).json({ error: "Action is required" });

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: "DeepSeek API key not configured" });
    }

    const result = await v3Flow(action, context);
    res.json(result);
  } catch (error: any) {
    console.error("V3 Flow error:", error);
    res.status(500).json({ error: error.message || "V3 flow failed" });
  }
});

// V3 Feed - Generate AI feed items
router.post("/feed-item", aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { context } = req.body;
    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: "DeepSeek API key not configured" });
    }

    const feedItem = await v3Feed(context);
    res.json(feedItem);
  } catch (error: any) {
    console.error("V3 Feed error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate feed item" });
  }
});

// V3 Microcopy - Generate UI text in Ti-Guy voice
router.post("/microcopy", aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { type, context } = req.body;
    const validTypes = [
      "loading",
      "error",
      "success",
      "onboarding",
      "empty_state",
    ];

    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: "Valid type is required" });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: "DeepSeek API key not configured" });
    }

    const text = await v3Microcopy(type, context);
    res.json({ text });
  } catch (error: any) {
    console.error("V3 Microcopy error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate microcopy" });
  }
});

// Get FAL presets
router.get("/fal-presets", (req, res) => {
  res.json(FAL_PRESETS);
});

// Generate video with AI (Supports Text-to-Video and Image-to-Video)
router.post("/generate-video", aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    const userId = req.userId!;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!process.env.FAL_API_KEY && !process.env.FAL_KEY) {
      return res.status(500).json({ error: "FAL API key not configured" });
    }

    // Use centralized video engine
    const result = await generateVideo({
      prompt,
      imageUrl,
      duration: req.body.duration || 5,
      modelHint: req.body.modelHint || "wan",
    });

    if (!result.url) {
      return res.status(500).json({ error: "No video generated" });
    }

    // Track credit usage
    await volumePricingService.trackCost({
      userId,
      postId: "generation_temp",
      service: "fal",
      operation: "video",
    });

    res.json({
      videoUrl: result.url,
      prompt,
      model: result.model,
    });
  } catch (error: any) {
    console.error("AI video generation error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate video" });
  }
});

// Regenerate video
router.post("/regenerate-video", requireAuth, async (req, res) => {
  try {
    const { postId, prompt } = req.body;
    const userId = req.userId!;

    if (!postId) return res.status(400).json({ error: "Post ID is required" });

    const post = await storage.getPost(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    if (!post.mediaUrl && !post.thumbnailUrl) {
      return res.status(400).json({ error: "Post has no media to regenerate" });
    }

    const videoResult = await generateVideo({
      imageUrl: post.thumbnailUrl || post.mediaUrl || undefined,
      prompt:
        prompt || post.caption || "Animate this image with natural movement",
      duration: 5,
      modelHint: "kling",
    });

    if (!videoResult.url)
      return res.status(500).json({ error: "Video generation failed" });

    await storage.updatePost(postId, {
      mediaUrl: videoResult.url,
      processingStatus: "completed",
    });

    await volumePricingService.trackCost({
      userId,
      postId,
      service: "fal",
      operation: "regenerate",
    });

    res.json({ videoUrl: videoResult.url });
  } catch (error: any) {
    console.error("Regenerate video error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to regenerate video" });
  }
});

// Joualizer Rewrite Engine
router.post("/joualize", requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const { text, style } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    const validStyles: JoualStyle[] = ["street", "old", "enhanced"];
    if (!style || !validStyles.includes(style as JoualStyle)) {
      return res.status(400).json({
        error: "Invalid style. Use 'street', 'old', or 'enhanced'.",
      });
    }

    const rewrittenText = await joualizeText(text, style as JoualStyle);
    res.json({ originalText: text, rewrittenText, style });
  } catch (error) {
    console.error("Joualizer error:", error);
    res.status(500).json({ error: "Failed to joualize text" });
  }
});

export default router;
