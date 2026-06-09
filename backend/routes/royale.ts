import { Router, Response } from "express";
import { z } from "zod";
import {
  getOrCreateDailyTournament,
  getLeaderboard,
  getMyRank,
  submitScore,
} from "../services/royale-service.js";

const requireAuth = (req: any, res: Response, next: any) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

// GET /api/royale/today — get (or auto-create) today's daily tournament
router.get("/today", async (_req, res) => {
  try {
    const tournament = await getOrCreateDailyTournament();
    res.json(tournament);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy: GET /api/royale/tournaments — redirects to today
router.get("/tournaments", async (_req, res) => {
  try {
    const tournament = await getOrCreateDailyTournament();
    res.json([tournament]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/royale/leaderboard/:tournamentId
router.get("/leaderboard/:tournamentId", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const board = await getLeaderboard(req.params.tournamentId, limit);
    res.json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/royale/my-rank/:tournamentId — auth required
router.get("/my-rank/:tournamentId", requireAuth, async (req: any, res) => {
  try {
    const result = await getMyRank(req.userId!, req.params.tournamentId);
    res.json(result ?? { rank: null, score: null, layers: null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/royale/submit — submit score
const SubmitSchema = z.object({
  tournamentId: z.string().uuid(),
  score: z.number().int().min(0).max(200),
  layers: z.number().int().min(0),
  metadata: z.record(z.unknown()).optional().default({}),
});

router.post("/submit", requireAuth, async (req: any, res) => {
  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.issues[0].message });

  try {
    const { tournamentId, score, layers, metadata } = parsed.data;
    const result = await submitScore(
      req.userId!,
      tournamentId,
      score,
      layers,
      metadata,
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Legacy join endpoint
router.post("/join", requireAuth, async (_req, res) => {
  res.json({ success: true });
});

export default router;
