import { Router, Response } from "express";
import { z } from "zod";
import {
  completeLevel,
  getProgressForUser,
  getPublicLevels,
} from "../services/carte-sucree-service.js";

const requireAuth = (
  req: { userId?: string },
  res: Response,
  next: () => void,
) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

router.get("/levels", (_req, res) => {
  try {
    res.json(getPublicLevels());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    res.status(500).json({ error: message });
  }
});

router.get("/progress", requireAuth, async (req: { userId?: string }, res) => {
  try {
    const progress = await getProgressForUser(req.userId!);
    res.json(progress);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    res.status(500).json({ error: message });
  }
});

const CompleteSchema = z.object({
  levelId: z.string().min(1),
  score: z.number().int().min(0),
});

router.post(
  "/complete",
  requireAuth,
  async (req: { userId?: string; body?: unknown }, res) => {
    const parsed = CompleteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Données invalides" });
    }

    try {
      const result = await completeLevel(
        req.userId!,
        parsed.data.levelId,
        parsed.data.score,
      );
      res.json(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur serveur";
      res.status(400).json({ error: message });
    }
  },
);

export default router;
