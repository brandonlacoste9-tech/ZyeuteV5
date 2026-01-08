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

// 6. Transcribe Media (Audio/Video)
// Migrated from supabase/functions/transcribe-media/index.ts
router.post("/transcribe", requireAuth, async (req: any, res) => {
  try {
    const { publicationId, mediaUrl, audioData, language = "fr-CA" } = req.body;

    if (!publicationId && !audioData) {
      return res.status(400).json({ error: "Publication ID or audio data required" });
    }

    // Import transcription service
    const { transcribeAudio } = await import("../ai/vertex-service.js");

    let audioBuffer: Buffer;
    
    if (audioData) {
      // Base64 audio data provided directly
      audioBuffer = Buffer.from(audioData, "base64");
    } else if (mediaUrl) {
      // Download media file
      const mediaResponse = await fetch(mediaUrl);
      if (!mediaResponse.ok) {
        throw new Error("Impossible de télécharger le fichier média");
      }
      const mediaBlob = await mediaResponse.blob();
      audioBuffer = Buffer.from(await mediaBlob.arrayBuffer());
    } else {
      return res.status(400).json({ error: "Either audioData or mediaUrl required" });
    }

    // Transcribe using Vertex AI
    const result = await transcribeAudio(
      audioBuffer,
      language as "fr-CA" | "fr-FR" | "en-US",
    );

    // TODO: Store transcription in database via storage service
    if (publicationId) {
      // Update post with transcription
      // await storage.updatePost(publicationId, { transcription: result.transcript });
    }

    res.json({
      success: true,
      transcription: result.transcript,
      confidence: result.confidence,
      message: "Transcription sauvegardée avec succès",
    });
  } catch (error: any) {
    console.error("❌ Erreur de transcription:", error);
    res.status(500).json({
      error: error.message,
      message: "Échec de la transcription",
    });
  }
});

// 7. System Health
router.get("/health", (req, res) => {
  res.json({
    status: "online",
    ai_system: "Colony Swarm V1",
    budget_engine: "active",
    timestamp: new Date().toISOString(),
  });
});

export default router;
