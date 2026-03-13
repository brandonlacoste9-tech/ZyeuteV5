import { Router, Request, Response } from "express";
import { RoyaleService } from "../services/royale-service.js";

const requireAuth = (req: any, res: Response, next: any) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

// Get active tournaments
router.get("/tournaments", async (_req, res) => {
  try {
    const tournaments = await RoyaleService.getActiveTournaments();
    res.json(tournaments);
  } catch (error: any) {
    console.error("Get tournaments error:", error);
    res.status(500).json({ error: "Failed to load tournaments" });
  }
});

// Join tournament
router.post("/join", requireAuth, async (req, res) => {
  try {
    const result = await RoyaleService.joinTournament(
      req.userId!,
      req.body.tournamentId,
    );
    res.json(result);
  } catch (error: any) {
    console.error("Join tournament error:", error);
    res.status(400).json({ error: "Failed to join tournament" });
  }
});

// Submit score
router.post("/submit", requireAuth, async (req, res) => {
  try {
    const { tournamentId, score, layers, metadata } = req.body;
    const result = await RoyaleService.submitScore(
      req.userId!,
      tournamentId,
      score,
      layers,
      metadata,
    );
    res.json(result);
  } catch (error: any) {
    console.error("Submit score error:", error);
    res.status(500).json({ error: "Failed to submit score" });
  }
});

// Get leaderboard
router.get("/leaderboard/:tournamentId", async (req, res) => {
  try {
    const leaderboard = await RoyaleService.getLeaderboard(
      req.params.tournamentId,
    );
    res.json(leaderboard);
  } catch (error: any) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

export default router;
