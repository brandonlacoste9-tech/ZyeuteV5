import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

// Link child account (by specific 6-digit Hive Code or username)
router.post("/link", requireAuth, async (req: Request, res: Response) => {
  try {
    const parentId = req.userId!;
    const { childIdentifier } = req.body;

    if (!childIdentifier) {
      return res.status(400).json({ error: "Identifiant de l'enfant requis." });
    }

    // Attempt to find child by username first
    let child = await storage.getUserByUsername(childIdentifier);

    if (!child) {
      return res.status(404).json({ error: "Enfant non trouvé." });
    }

    // Link in DB
    const updated = await storage.updateUser(child.id, { parentId });
    res.json({ success: true, child: updated });
  } catch (error: any) {
    console.error("Link child error:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// Get linked children
router.get("/children", requireAuth, async (req, res) => {
  try {
    const parentId = req.userId!;
    const children = await storage.getChildren(parentId);
    res.json({ children });
  } catch (error: any) {
    console.error("Get children error:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// Get parental control settings for a child
router.get("/controls/:childUserId", requireAuth, async (req, res) => {
  try {
    const parentId = req.userId!;
    const { childUserId } = req.params;

    // Verify parent owns this child
    const child = await storage.getUser(childUserId as string);
    if (!child || child.parentId !== parentId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const controls = await storage.getParentalControls(childUserId as string);
    res.json({ controls });
  } catch (error: any) {
    console.error("Get controls error:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// Update parental control settings
router.post("/controls", requireAuth, async (req, res) => {
  try {
    const parentId = req.userId!;
    const { childUserId, ...controlsData } = req.body;

    if (!childUserId) {
      return res.status(400).json({ error: "ID de l'enfant requis." });
    }

    // Verify parent owns this child
    const child = await storage.getUser(childUserId);
    if (!child || child.parentId !== parentId) {
      return res.status(403).json({ error: "Accès refusé." });
    }

    const updated = await storage.upsertParentalControls({
      childUserId,
      ...controlsData,
    });

    res.json({ success: true, controls: updated });
  } catch (error: any) {
    console.error("Update controls error:", error);
    res.status(500).json({ error: "Erreur lors de la sauvegarde." });
  }
});

export default router;
