import { Router } from "express";
import { getColonyEngine } from "../ai/colony-os-engine";
import { getSwarmBridge } from "../ai/swarm-bridge";

const router = Router();

// Dynamic import to avoid circular dependency issues during startup
// import { analyzeImageWithGemini } from "../ai/vertex-service.js";

// Middleware to ensure authentication (assuming req.user or req.userId is populated by parent)
const requireAuth = (req: any, res: any, next: any) => {
  // requireAuth middleware handles initial verification
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// 0. AI Cameraman (Gemini Vision)
// Direct analysis for immediate feedback before upload
router.post("/analyze-image", requireAuth, async (req: any, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    // validation
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    // Dynamic import here
    const { analyzeImageWithGemini } = await import("../ai/vertex-service.js");

    // Limit payload size check passed to express config, but good to be aware
    const result = await analyzeImageWithGemini(imageBase64, mimeType);
    res.json(result);
  } catch (error: any) {
    console.error("AI Cameraman Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze image" });
  }
});

// 1. Analyze Media
router.post("/analyze-media", requireAuth, async (req: any, res) => {
  try {
    const { imageUrl, location } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "Image URL required" });

    const engine = getColonyEngine();
    const context = {
      userId: req.userId,
      time: new Date(),
      location,
    };

    const result = await engine.orchestrateMediaRequest(imageUrl, context);
    res.json(result);
  } catch (error) {
    console.error("Analyze Media Error:", error);
    res.status(500).json({ error: "Failed to analyze media" });
  }
});

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
