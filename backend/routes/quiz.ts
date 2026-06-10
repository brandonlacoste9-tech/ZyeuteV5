import { Router, Response } from "express";
import { z } from "zod";
import {
  getDailyQuiz,
  getMyQuizAttempt,
  getQuizLeaderboard,
  submitDailyQuiz,
} from "../services/quiz-service.js";

const requireAuth = (req: any, res: Response, next: any) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

router.get("/today", async (_req, res) => {
  try {
    res.json(getDailyQuiz());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const board = await getQuizLeaderboard(limit);
    res.json(board);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/my-score", requireAuth, async (req: any, res) => {
  try {
    const attempt = await getMyQuizAttempt(req.userId!);
    res.json(attempt ?? { score: null, correctCount: null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const SubmitSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
});

router.post("/submit", requireAuth, async (req: any, res) => {
  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const result = await submitDailyQuiz(req.userId!, parsed.data.answers);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
