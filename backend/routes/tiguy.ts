import express from "express";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { TIGUY_SYSTEM_PROMPT } from "../ai/orchestrator";

const router = express.Router();

// Initialize DeepSeek Model
// We use the OpenAI compatible interface with DeepSeek's base URL
const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com", // DeepSeek V3 API Endpoint
});

// Create model instance (DeepSeek V3 "chat" model)
const model = deepseek("deepseek-chat");

router.post("/chat", async (req, res) => {
  try {
    const { message, history, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({
        response: "Envoie-moi de quoi, câlisse! (Message empty)",
      });
    }

    // Convert history to Vercel AI SDK format if needed, or just append to prompt
    // For simple chat, we'll just pass the system prompt + user message
    // Ideally, we'd pass the conversation history properly

    // Simple implementation: System Prompt + Context + User Message
    const { text } = await generateText({
      model: model,
      system: TIGUY_SYSTEM_PROMPT,
      prompt: message, // TODO: Add history context if provided
      // maxTokens: 4096, // Optional constraint
    });

    res.json({
      response: text,
      type: "text",
      timestamp: new Date().toISOString(),
      isAi: true,
      metadata: { model: "deepseek-v3" },
    });
  } catch (error: any) {
    console.error("TI-GUY AI error:", error);

    // Detailed error logging for debugging
    if (error.response) {
      console.error("API Response:", error.response.data);
    }

    res.status(500).json({
      error: "Osti, j'ai eu un problème avec mon cerveau AI! Réessaye mon ami!",
      details: error.message,
    });
  }
});

router.get("/status", (req, res) => {
  res.json({
    status: "online",
    brain: "DeepSeek V3 (Trinity)",
    message: "TI-GUY est ben actif, mon chum!",
    timestamp: new Date().toISOString(),
  });
});

export default router;
