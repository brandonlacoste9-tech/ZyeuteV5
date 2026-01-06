import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage.js";

const router = Router();

// GET /api/threads - List user threads
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const threads = await storage.getThreads(userId);
    res.json({ threads });
  } catch (error) {
    console.error("Get threads error:", error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

// POST /api/threads - Create new thread
router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const schema = z.object({
      title: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const thread = await storage.createThread({
      userId,
      title: parsed.data.title,
    });

    res.status(201).json({ thread });
  } catch (error) {
    console.error("Create thread error:", error);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

export default router;
