import { Router } from "express";
import { PexelsService } from "../services/pexels-service.js"; // Ensure .js extension for ESM if configured

const router = Router();

// GET /api/pexels/curated
router.get("/curated", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 15;

    const data = await PexelsService.getCuratedVideos(perPage, page);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch curated videos" });
  }
});

// GET /api/pexels/collection/:id
router.get("/collection/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 15;

    const data = await PexelsService.getCollectionVideos(id, perPage, page);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

// GET /api/pexels/search (Bonus route)
router.get("/search", async (req, res) => {
  try {
    const query = req.query.query as string;
    if (!query)
      return res.status(400).json({ error: "Query parameter required" });

    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 15;

    const data = await PexelsService.searchVideos(query, perPage, page);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to search videos" });
  }
});

export default router;
