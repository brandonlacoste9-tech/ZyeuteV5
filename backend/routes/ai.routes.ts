import { Router } from "express";
import { getColonyEngine } from "../ai/colony-os-engine";
import { getSwarmBridge } from "../ai/swarm-bridge";
import { analyzeImageWithGenAI } from "../ai/genai-app-builder.js";
import { creditCheckMiddleware } from "../ai/credit-manager.js";
import { generateVideo } from "../ai/media/video-engine.js";
import { generateImage } from "../ai/media/image-engine.js";

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

// 6.5 Generate Image (Flux)
router.post("/generate-image", requireAuth, async (req: any, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });

    // Map frontend aspect ratio to backend engine size
    let imageSize: "square" | "portrait" | "landscape" = "square";
    if (aspectRatio === "9:16") imageSize = "portrait";
    else if (aspectRatio === "16:9") imageSize = "landscape";

    const result = await generateImage({
      prompt,
      imageSize,
      modelHint: "flux",
    });

    if (result.model === "placeholder") {
      return res.status(503).json({
        error: "Image generation not available",
        message: "FAL_API_KEY not configured",
      });
    }

    res.json({
      imageUrl: result.url,
      prompt: result.prompt,
      success: true,
    });
  } catch (error: any) {
    console.error("[AI Routes] Image generation error:", error.message);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// 7. Generate Video (Image-to-Video or Text-to-Video)
// Requires FAL_API_KEY or FAL_KEY to be set
router.post("/generate-video", requireAuth, async (req: any, res) => {
  let modelHint: "kling" | "wan" | "hunyuan_video" | "ltx2" | "ltx-2" = "kling";
  try {
    const { imageUrl, prompt, duration = 5, modelHint: hint } = req.body;
    if (
      hint &&
      ["kling", "wan", "hunyuan_video", "ltx2", "ltx-2", "pollo"].includes(
        hint,
      )
    ) {
      modelHint = hint as any;
    }

    if (!imageUrl && !prompt) {
      return res.status(400).json({ error: "Image URL or Prompt required" });
    }

    console.log(
      `[AI Routes] Generating video (${modelHint}) ${imageUrl ? "from image" : "from prompt"}: ${prompt?.substring(0, 50)}...`,
    );

    const result = await generateVideo({
      prompt: prompt || "Animate this image with natural motion",
      imageUrl,
      duration,
      modelHint,
    });

    if (result.model === "placeholder" || !result.url) {
      return res.status(503).json({
        error: "Video generation not available",
        message: "FAL_API_KEY not configured or video generation failed",
        videoUrl: null,
      });
    }

    res.json({
      videoUrl: result.url,
      cost: result.cost,
      model: result.model,
      duration: result.duration,
      prompt: prompt || "Animate this image with natural motion",
      success: true,
    });
  } catch (error: any) {
    console.error(
      `[AI Routes] Video generation error (${modelHint}):`,
      error.message,
    );
    res.status(500).json({
      error: "Failed to generate video",
      message: error.message,
      videoUrl: null,
    });
  }
});

// 8. Secure Proxies for Frontend AI Calls (preventing API keys exposure)
router.post("/proxy/deepseek", async (req, res) => {
  try {
    const { model, messages, temperature, response_format, max_tokens } =
      req.body;

    // In production, grab key from process.env, NOT the client
    const apiKey =
      process.env.DEEPSEEK_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OLLAMA_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ error: "Backend AI keys not configured" });
    }

    // Call actual DeepSeek API
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "deepseek-chat",
        messages,
        temperature: temperature || 0.8,
        response_format,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Upstream API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[AI Proxy] DeepSeek error:", error.message);
    res
      .status(500)
      .json({ error: "Backend proxy failed", message: error.message });
  }
});

router.post("/proxy/gemini", async (req, res) => {
  try {
    const { prompt, model } = req.body;

    // Server-side key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(503)
        .json({ error: "Backend Gemini key not configured" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash-exp"}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[AI Proxy] Gemini error:", error.message);
    res
      .status(500)
      .json({ error: "Backend proxy failed", message: error.message });
  }
});

export default router;
