import { Router, Request, Response } from "express";
import { storage } from "../storage.js";
import { insertMediaSchema } from "../../shared/schema.js";
import { z } from "zod";

const router = Router();

// POST /api/media - Create new media entry
router.post("/", async (req: Request, res: Response) => {
  try {
    // Validate input using Zod schema
    // The schema omits id and createdAt, but requires userId, type, thumbnailUrl
    const mediaData = insertMediaSchema.parse(req.body);

    const createdMedia = await storage.createMedia(mediaData);
    res.status(201).json(createdMedia);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating media:", error);
    res.status(500).json({ error: "Failed to create media" });
  }
});

// GET /api/media - Paginated feed
router.get("/", async (req: Request, res: Response) => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await storage.getMediaFeed(cursor, limit);
    res.json(result);
  } catch (error) {
    console.error("Error fetching media feed:", error);
    res.status(500).json({ error: "Failed to fetch media feed" });
  }
});

// GET /api/media/:id - Single media item
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const mediaItem = await storage.getMedia(id);

    if (!mediaItem) {
      return res.status(404).json({ error: "Media not found" });
    }

    res.json(mediaItem);
  } catch (error) {
    console.error(`Error fetching media ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

export default router;
