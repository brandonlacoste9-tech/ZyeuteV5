import { Router } from "express";
import { db } from "../storage.js";
import {
  agentTraces,
  agentMemories,
  agentFacts,
  users,
} from "../../shared/schema.js";
import { eq, desc, and } from "drizzle-orm";
import { getPrivacyQueue } from "../queue.js";

const router = Router();

// Middleware: Admin Check
async function requireAdmin(req: any, res: any, next: any) {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId))
      .limit(1);
    const user = result[0];

    if (!user || !user.isAdmin) {
      // For the demo/hackathon context, we might want to be lenient or ensure the main user is admin.
      // But strictly speaking:
      // return res.status(403).json({ error: "Admin access required" });

      // For now, let's allow it if it's the specific user 'north' or 'dev'?
      // Or just proceed since the user told me to "polish".
      // I'll stick to the DB flag. The user can manually set isAdmin in Supabase if needed.
      // Actually, to avoid locking the user out during this demo, I'll log a warning but maybe allow if it's localhost?
      // No, let's stick to the protocol.
      // user.isAdmin is default false.
      if (!user?.isAdmin) {
        console.warn(`[Admin] Access denied for user ${req.userId}`);
        return res.status(403).json({ error: "Admin access required" });
      }
    }
    next();
  } catch (e) {
    console.error("Admin check failed:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// GET /api/admin/traces - Live Thinking Feed
router.get("/traces", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const traces = await db
      .select()
      .from(agentTraces)
      .orderBy(desc(agentTraces.createdAt))
      .limit(limit);

    res.json({ traces });
  } catch (error) {
    console.error("Get traces error:", error);
    res.status(500).json({ error: "Failed to fetch traces" });
  }
});

// GET /api/admin/memories/:userId - Memory Inspector
router.get("/memories/:targetUserId", requireAdmin, async (req, res) => {
  try {
    const { targetUserId } = req.params;

    // Fetch Memories
    const memories = await db
      .select()
      .from(agentMemories)
      .where(eq(agentMemories.userId, targetUserId))
      .orderBy(desc(agentMemories.createdAt));

    // Fetch Facts
    const facts = await db
      .select()
      .from(agentFacts)
      .where(eq(agentFacts.userId, targetUserId))
      .orderBy(desc(agentFacts.confidence));

    res.json({ memories, facts });
  } catch (error) {
    console.error("Get memories error:", error);
    res.status(500).json({ error: "Failed to fetch memories" });
  }
});

// DELETE /api/admin/traces - Clear Logs
router.delete("/traces", requireAdmin, async (req, res) => {
  try {
    await db.delete(agentTraces);
    res.json({ success: true, message: "Traces cleared" });
  } catch (error) {
    console.error("Clear traces error:", error);
    res.status(500).json({ error: "Failed to clear traces" });
  }
});

// POST /api/admin/audit - Trigger Loi 25 Compliance Audit
router.post("/audit", requireAdmin, async (req, res) => {
  try {
    const privacyQueue = getPrivacyQueue();
    // Add job to queue
    await privacyQueue.add("manual-audit", { userId: req.userId, force: true });

    res.json({ success: true, message: "Privacy Audit Triggered" });
  } catch (error) {
    console.error("Audit trigger error:", error);
    res.status(500).json({ error: "Failed to trigger audit" });
  }
});

export default router;
