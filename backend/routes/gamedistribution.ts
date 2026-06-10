import { Router } from "express";

const router = Router();

router.get("/rss", async (req, res) => {
  try {
    const url = "https://catalog.api.gamedistribution.com/api/v2.0/rss/All/?collection=all&categories=All&type=all&amount=12&page=1&format=json";
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("GameDistribution Proxy Error:", error);
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

export default router;
