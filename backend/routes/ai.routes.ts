import { Router } from "express";
import { getColonyEngine } from "../ai/colony-os-engine";
import { getSwarmBridge } from "../ai/swarm-bridge";
import { analyzeImageWithGenAI } from "../ai/genai-app-builder.js";
import { creditCheckMiddleware } from "../ai/credit-manager.js";

const router = Router();

// Middleware to ensure authentication (assuming req.user or req.userId is populated by parent)
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

// 1. Analyze Media (Uses GenAI App Builder - $1,367.95 credits)
// STOPs when credits run out
router.post(
  "/analyze-media",
  requireAuth,
  creditCheckMiddleware("genai-app-builder", "genai-image-analysis"),
  async (req: any, res) => {
    const startTime = Date.now();

    try {
      const { imageUrl, location } = req.body;
      if (!imageUrl)
        return res.status(400).json({ error: "Image URL required" });

      // Use GenAI App Builder for image analysis (separate credit pool from Dialogflow CX)
      const result = await analyzeImageWithGenAI(imageUrl, {
        generateJoual: true,
        location,
      });

      const responseTime = Date.now() - startTime;

      res.json({
        ...result,
        meta: {
          service: "genai-app-builder",
          response_time_ms: responseTime,
          credits_pool: "$1,367.95",
          note: "Separate from TI-GUY Dialogflow CX credits ($813.16)",
        },
      });
    } catch (error) {
      console.error("Analyze Media Error:", error);
      res.status(500).json({ error: "Failed to analyze media" });
    }
  },
);

// Alias: /analyze-image (for backward compatibility with logs)
// STOPs when credits run out
router.post(
  "/analyze-image",
  requireAuth,
  creditCheckMiddleware("genai-app-builder", "genai-image-analysis"),
  async (req: any, res) => {
    const startTime = Date.now();

    try {
      const { imageUrl, location } = req.body;
      if (!imageUrl)
        return res.status(400).json({ error: "Image URL required" });

      const result = await analyzeImageWithGenAI(imageUrl, {
        generateJoual: true,
        location,
      });

      const responseTime = Date.now() - startTime;

      res.json({
        ...result,
        meta: {
          service: "genai-app-builder",
          response_time_ms: responseTime,
          credits_pool: "$1,367.95",
          endpoint: "/analyze-image (alias of /analyze-media)",
        },
      });
    } catch (error) {
      console.error("Analyze Image Error:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  },
);

// 2. Apply Luxury Filter
router.post("/apply-filter", requireAuth, async (req, res) => {
  try {
    const { imageUrl, filterName } = req.body;
    if (!imageUrl || !filterName)
      return res
        .status(400)
        .json({ error: "Image URL and Filter Name required" });

    const swarm = getSwarmBridge();
    const result = await swarm.applyLuxuryFilter(imageUrl, filterName);
    res.json(result);
  } catch (error) {
    console.error("Apply Filter Error:", error);
    res.status(500).json({ error: "Failed to apply filter" });
  }
});

// 3. Generate Caption
router.post("/generate-caption", requireAuth, async (req, res) => {
  try {
    const { context, mood } = req.body;
    const swarm = getSwarmBridge();
    const captions = await swarm.generateCaption(
      context || "Montreal vibe",
      mood || "Cool",
    );
    res.json({ captions });
  } catch (error) {
    console.error("Generate Caption Error:", error);
    res.status(500).json({ error: "Failed to generate captions" });
  }
});

// 4. Metrics Dashboard (Admin Only)
// In a real app, check for admin role.
router.get("/metrics", requireAuth, async (req: any, res) => {
  // Basic protection (can be enhanced)
  // if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const engine = getColonyEngine();
  res.json(engine.getDashboard());
});

// 5. Public Filters List
router.get("/filters", async (req, res) => {
  // Start with static list, could pull from SwarmBridge constants
  res.json({
    filters: [
      {
        id: "montreal-winter",
        name: "Montreal Winter",
        description: "Golden hour, snowy urban, warm tones",
      },
      {
        id: "old-quebec",
        name: "Old Quebec",
        description: "Vintage film, sepia, European charm",
      },
      {
        id: "st-lawrence",
        name: "St. Lawrence",
        description: "Vibrant sunset, dramatic lighting",
      },
      {
        id: "plateau-vibrance",
        name: "Plateau Vibrance",
        description: "Street art, high saturation, urban energy",
      },
      {
        id: "mont-royal",
        name: "Mont-Royal",
        description: "Natural greens, serene, soft focus",
      },
    ],
  });
});

// 6. System Health
router.get("/health", (req, res) => {
  res.json({
    status: "online",
    ai_system: "Colony Swarm V1",
    budget_engine: "active",
    timestamp: new Date().toISOString(),
  });
});

export default router;
