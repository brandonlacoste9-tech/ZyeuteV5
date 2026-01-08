import express from "express";
import { processQuery } from "../utils/tiguy-patterns.js";
import { getRandomJoke } from "../utils/tiguy-jokes.js";
import { orchestrator } from "../ai/cores/orchestrator-core.js";
import crypto from "crypto";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message, history, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({
        error: "Envoie-moi de quoi, câlisse!",
      });
    }

    // Prepare Hive Task for the Orchestrator
    const task = {
      id: crypto.randomUUID(),
      type: "chat",
      payload: {
        message: message || "Regarde ça!",
        history: history || [],
        image,
      },
      userId: (req as any).userId,
      createdAt: new Date(),
    };

    const result = await orchestrator.handleHiveTask(task);

    if (!result.success) {
      // Fallback to static patterns if AI is down
      const fallback = processQuery(message || "");
      return res.json({
        response: fallback.message,
        type: fallback.type,
        timestamp: new Date().toISOString(),
        isAi: false,
      });
    }

    res.json({
      response: (result.data as any).response,
      type: "text",
      timestamp: new Date().toISOString(),
      isAi: true,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("TI-GUY error:", error);
    res.status(500).json({
      error: "Osti, j'ai eu un problème! Réessaye mon ami!",
    });
  }
});

router.get("/joke", (req, res) => {
  res.json({
    joke: getRandomJoke(),
    timestamp: new Date().toISOString(),
  });
});

router.get("/status", (req, res) => {
  res.json({
    status: "online",
    message: "TI-GUY est ben actif, mon chum!",
    timestamp: new Date().toISOString(),
  });
});

export default router;
