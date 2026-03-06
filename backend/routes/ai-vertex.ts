import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import {
  generateWithTIGuy,
  moderateContent,
  transcribeAudio,
  generateImage,
  checkVertexAIHealth,
  type ContentGenerationRequest,
  type ModerationResult,
  type TranscriptionResult,
  type ImageGenerationRequest,
  type ImageGenerationResponse,
} from "../ai/vertex-service.js";
import { fal } from "@fal-ai/client";
import { traceExternalAPI } from "../tracer.js";

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

// Enhanced TI-GUY AI Chat (Vertex AI)
router.post("/chat", aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { message, conversationHistory = [], mode = "auto" } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    let aiMode: "content" | "customer_service" = "content";
    if (mode === "customer_service") {
      aiMode = "customer_service";
    } else if (mode === "auto") {
      const customerKeywords = [
        "help",
        "problem",
        "issue",
        "support",
        "question",
        "comment",
        "report",
        "aide",
        "problème",
        "question",
      ];
      const hasCustomerKeywords = customerKeywords.some((keyword) =>
        message.toLowerCase().includes(keyword),
      );
      aiMode = hasCustomerKeywords ? "customer_service" : "content";
    }

    const context = conversationHistory
      .slice(-5)
      .map((msg: any) => `${msg.sender}: ${msg.text}`)
      .join("\n");
    const request: ContentGenerationRequest = {
      mode: aiMode,
      message,
      context,
      language: "auto",
    };
    const response = await generateWithTIGuy(request);

    res.json({
      response: response.content,
      mode: response.mode,
      confidence: response.confidence,
      language: response.language,
    });
  } catch (error: any) {
    console.error("Enhanced TI-GUY AI error:", error);
    res
      .status(500)
      .json({
        error: error.message || "Ti-Guy est fatigué, réessaie plus tard!",
      });
  }
});

// Vertex AI Content Moderation
router.post("/moderate", aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { content, type = "text" } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const result: ModerationResult = await moderateContent(content, type);
    res.json(result);
  } catch (error: any) {
    console.error("Content moderation error:", error);
    res
      .status(500)
      .json({ error: "Moderation service unavailable", allowed: true });
  }
});

// Vertex AI Image Generation (Flux via Vertex)
router.post("/generate-image", aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { prompt, aspectRatio = "1:1" } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    if (!process.env.FAL_API_KEY)
      return res.status(500).json({ error: "FAL API key not configured" });

    const result = await traceExternalAPI(
      "fal-ai",
      "flux/schnell",
      "POST",
      async (span) => {
        span.setAttributes({
          "ai.model": "flux-schnell",
          "ai.prompt_length": prompt.length,
          "ai.aspect_ratio": aspectRatio,
        });
        return fal.subscribe("fal-ai/flux/schnell", {
          input: {
            prompt,
            image_size:
              aspectRatio === "16:9"
                ? "landscape_16_9"
                : aspectRatio === "9:16"
                  ? "portrait_16_9"
                  : aspectRatio === "4:3"
                    ? "landscape_4_3"
                    : aspectRatio === "3:4"
                      ? "portrait_4_3"
                      : "square",
            num_images: 1,
          },
          logs: true,
        });
      },
    );

    const images = (result.data as any)?.images || [];
    if (images.length === 0)
      return res.status(500).json({ error: "No image generated" });

    res.json({ imageUrl: images[0].url, prompt });
  } catch (error: any) {
    console.error("AI image generation error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate image" });
  }
});

// French Audio Transcription
router.post("/transcribe", aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { audioData, language = "fr-CA" } = req.body;
    if (!audioData)
      return res.status(400).json({ error: "Audio data is required" });

    const audioBuffer = Buffer.from(audioData, "base64");
    const result: TranscriptionResult = await transcribeAudio(
      audioBuffer,
      language as "fr-CA" | "fr-FR" | "en-US",
    );
    res.json(result);
  } catch (error: any) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: "Transcription failed" });
  }
});

// Health Check
router.get("/health", async (req, res) => {
  try {
    const health = await checkVertexAIHealth();
    res.json({
      status:
        health.vertexAI && health.speech && health.vision
          ? "healthy"
          : "degraded",
      services: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

export default router;
