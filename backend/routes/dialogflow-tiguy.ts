import express from "express";
import { DialogflowBridge } from "../ai/dialogflow-bridge.js";

const router = express.Router();

/**
 * Ti-Guy Voice Route via Dialogflow CX
 *
 * Uses Dialogflow CX credits ($813.16) for voice/text sessions
 * This is separate from the standard Ti-Guy chat route which uses DeepSeek
 *
 * POST /api/dialogflow/tiguy
 * Body: { message: string, userId: string, context?: object }
 */
router.post("/tiguy", async (req, res) => {
  try {
    const { message, userId, context } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
        response: "Envoie-moi de quoi, câlisse!",
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: "userId is required for session management",
      });
    }

    // Get Ti-Guy voice response via Dialogflow CX
    // This uses Dialogflow CX credits, NOT standard Gemini API credits
    const result = await DialogflowBridge.getTiGuyVoiceResponse(
      userId,
      message,
      context,
    );

    res.json({
      response: result.response,
      intent: result.intent,
      confidence: result.confidence,
      action: result.action, // Navigation/action payload from Dialogflow
      timestamp: new Date().toISOString(),
      isAi: true,
      metadata: {
        model: "dialogflow-cx",
        credits: "dialogflow-cx", // Uses Dialogflow CX credits
      },
    });
  } catch (error: any) {
    console.error("Dialogflow Ti-Guy error:", error);

    res.status(500).json({
      error: "Dialogflow CX request failed",
      response: "Désolé, j'ai eu un problème. Réessaye!",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * Detect Intent Route (Generic Dialogflow CX)
 *
 * POST /api/dialogflow/detect-intent
 * Body: { sessionId: string, queryInput: { text?: string, audio?: Buffer }, languageCode?: string }
 */
router.post("/detect-intent", async (req, res) => {
  try {
    const { sessionId, queryInput, languageCode = "fr-CA" } = req.body;

    if (!sessionId || !queryInput) {
      return res.status(400).json({
        error: "sessionId and queryInput are required",
      });
    }

    const result = await DialogflowBridge.detectIntent(
      sessionId,
      queryInput,
      languageCode,
    );

    res.json({
      intent: result.intent,
      confidence: result.confidence,
      fulfillmentText: result.fulfillmentText,
      parameters: result.parameters,
      payload: result.payload,
      metadata: {
        credits: "dialogflow-cx", // Uses Dialogflow CX credits
      },
    });
  } catch (error: any) {
    console.error("Dialogflow detect intent error:", error);

    res.status(500).json({
      error: "Dialogflow CX request failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
