
import { Router } from "express";
import { RoyaleService } from "../services/royale-service";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/royale/tournaments
router.get("/tournaments", async (req, res) => {
  try {
    const tournaments = await RoyaleService.getActiveTournaments();
    res.json(tournaments);
  } catch (error: any) {
    console.error("Get tournaments error:", error);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

// POST /api/royale/join
router.post("/join", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { tournamentId } = req.body;

    if (!tournamentId) {
      return res.status(400).json({ error: "Missing tournamentId" });
    }

    const result = await RoyaleService.joinTournament(userId, tournamentId);
    res.json(result);
  } catch (error: any) {
    console.error("Join tournament error:", error);
    res.status(400).json({ error: error.message || "Failed to join tournament" });
  }
});

// POST /api/royale/submit
router.post("/submit", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { tournamentId, score, layers, metadata } = req.body;

    if (!tournamentId || score === undefined || layers === undefined) {
      return res.status(400).json({ error: "Missing score data" });
    }

    const entry = await RoyaleService.submitScore(
      userId,
      tournamentId,
      score,
      layers,
      metadata
    );

    res.json({ success: true, entry });
  } catch (error: any) {
    console.error("Submit score error:", error);
    res.status(500).json({ error: "Failed to submit score" });
  }
});

// GET /api/royale/leaderboard/:tournamentId
router.get("/leaderboard/:tournamentId", async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const leaderboard = await RoyaleService.getLeaderboard(tournamentId);
    res.json(leaderboard);
  } catch (error: any) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ADMIN: Create tournament (For testing)
router.post("/create", requireAuth, async (req, res) => {
  try {
    // TODO: Add admin check
    const { title, entryFee } = req.body;
    const tournament = await RoyaleService.createTournament(title, entryFee);
    res.json(tournament);
  } catch (error: any) {
    console.error("Create tournament error:", error);
    res.status(500).json({ error: "Failed to create tournament" });
  }
});

export default router;
