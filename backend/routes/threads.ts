import { Router, Request, Response } from "express";
import { storage } from "../storage.js";
import { insertThreadSchema } from "../../shared/schema.js";
import { z } from "zod";

const router = Router();

// GET /api/threads - List threads for current user
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const threads = await storage.getThreads(req.userId);
    res.json(threads);
  } catch (error) {
    console.error("Error fetching threads:", error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// POST /api/threads - Create a new thread
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const threadData = insertThreadSchema.parse({
      ...req.body,
      userId: req.userId,
    });

    const thread = await storage.createThread(threadData);
    res.status(201).json(thread);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating thread:", error);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

export default router;
