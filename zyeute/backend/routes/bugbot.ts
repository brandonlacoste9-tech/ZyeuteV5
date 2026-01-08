/**
 * BugBot API Routes
 * Exposes bug detection and reporting endpoints
 */

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { bugBot } from "../colony/bugbot.js";

const router = express.Router();

/**
 * GET /api/bugbot/bugs
 * Get all bug reports
 */
router.get("/bugs", requireAuth, (req, res) => {
  const { severity, type, status } = req.query;
  const bugs = bugBot.getAllBugs({
    severity: severity as string,
    type: type as string,
    status: status as string,
  });

  res.json({ bugs, count: bugs.length });
});

/**
 * GET /api/bugbot/bugs/:bugId
 * Get specific bug report
 */
router.get("/bugs/:bugId", requireAuth, (req, res) => {
  const { bugId } = req.params;
  const bug = bugBot.getBug(bugId);

  if (!bug) {
    return res.status(404).json({ error: "Bug not found" });
  }

  res.json({ bug });
});

/**
 * POST /api/bugbot/bugs
 * Manually report a bug
 */
router.post("/bugs", requireAuth, async (req, res) => {
  try {
    const { severity, type, title, description, location, context, stackTrace } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ error: "title, description, and location required" });
    }

    const bug = await bugBot.detectBug({
      severity: severity || "medium",
      type: type || "error",
      title,
      description,
      location,
      context: context || {},
      stackTrace,
    });

    res.json({ success: true, bug });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bugbot/bugs/:bugId/fix
 * Mark bug as fixed
 */
router.post("/bugs/:bugId/fix", requireAuth, async (req, res) => {
  try {
    const { bugId } = req.params;
    await bugBot.markBugFixed(bugId, req.userId || "unknown");
    res.json({ success: true, message: "Bug marked as fixed" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bugbot/stats
 * Get bug statistics
 */
router.get("/stats", requireAuth, (req, res) => {
  const stats = bugBot.getBugStats();
  res.json({ stats });
});

export default router;
