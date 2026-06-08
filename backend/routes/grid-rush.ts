import { Router, Response } from "express";
import { GridRushService } from "../services/grid-rush-service.js";

const requireAuth = (req: any, res: Response, next: any) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

router.get("/wallet", requireAuth, async (req: any, res) => {
  try {
    const tokenBalance = await GridRushService.getWalletBalance(req.userId!);
    res.json({ tokenBalance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/match/:matchId", requireAuth, async (req: any, res) => {
  try {
    const match = await GridRushService.getMatch(req.params.matchId);
    if (!match) return res.status(404).json({ error: "Partie introuvable" });

    const userId = req.userId as string;
    if (match.player1Id !== userId && match.player2Id !== userId) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    res.json(match);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/queue", requireAuth, async (req: any, res) => {
  try {
    const stakeTokens = Number(req.body?.stakeTokens ?? 500);
    const match = await GridRushService.quickMatch(req.userId!, stakeTokens);
    res.json(match);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/invite", requireAuth, async (req: any, res) => {
  try {
    const stakeTokens = Number(req.body?.stakeTokens ?? 500);
    const match = await GridRushService.createInvite(req.userId!, stakeTokens);
    res.json(match);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/bot", requireAuth, async (req: any, res) => {
  try {
    // userId comes from verified JWT; RPC is service_role-only and trusts this id.
    const stakeTokens = Number(req.body?.stakeTokens ?? 500);
    const match = await GridRushService.createBotMatch(
      req.userId!,
      stakeTokens,
    );
    res.json(match);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/join/:matchId", requireAuth, async (req: any, res) => {
  try {
    const match = await GridRushService.joinMatch(
      req.userId!,
      req.params.matchId,
    );
    res.json(match);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/score/:matchId", requireAuth, async (req: any, res) => {
  try {
    const match = await GridRushService.incrementScore(
      req.userId!,
      req.params.matchId,
    );
    res.json(match);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/finish/:matchId", requireAuth, async (req: any, res) => {
  try {
    const match = await GridRushService.finishMatch(
      req.userId!,
      req.params.matchId,
    );
    res.json(match);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/cancel/:matchId", requireAuth, async (req: any, res) => {
  try {
    const match = await GridRushService.cancelMatch(
      req.userId!,
      req.params.matchId,
    );
    res.json(match);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
