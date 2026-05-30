import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

// Get notifications
router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await storage.getUserNotifications(req.userId!);
    res.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

// Mark notification as read
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    await storage.markNotificationRead(req.params.id as string);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Failed to mark notification read" });
  }
});

// Mark all notifications as read
router.post("/read-all", requireAuth, async (req, res) => {
  try {
    await storage.markAllNotificationsRead(req.userId!);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Failed to mark notifications read" });
  }
});

export default router;
