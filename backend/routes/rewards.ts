import { Router, Request, Response } from "express";
import { db } from "../storage.js";
import { users } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";
import { getRedisClient } from "../redis.js";

const router = Router();

// Middleware to ensure authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.userId) return res.status(401).json({ error: "Non autorisé" });
  next();
};

const DAILY_LIMIT_CENNES = 50;
const REWARD_AMOUNT = 5;

router.post("/skillwall", requireAuth, async (req: Request, res: Response) => {
  const userId = req.userId!;
  
  try {
    const redis = getRedisClient();
    
    if (redis) {
      // Use Redis to track daily rewards
      // Key format: skillwall:reward:{userId}:{YYYY-MM-DD}
      const date = new Date().toISOString().split("T")[0];
      const key = `skillwall:reward:${userId}:${date}`;
      
      const currentEarnedStr = await redis.get(key);
      const currentEarned = currentEarnedStr ? parseInt(currentEarnedStr) : 0;
      
      if (currentEarned + REWARD_AMOUNT > DAILY_LIMIT_CENNES) {
        return res.status(429).json({ 
          error: "Daily limit reached",
          message: "You have reached your daily limit for hacking intel.",
          earnedToday: currentEarned,
          limit: DAILY_LIMIT_CENNES
        });
      }
      
      // Increment Redis counter and set expiry to 24 hours if it's new
      await redis.incrby(key, REWARD_AMOUNT);
      if (currentEarned === 0) {
        await redis.expire(key, 86400); // 24 hours
      }
    }

    // Atomic update in Drizzle
    const result = await db
      .update(users)
      .set({ cashCredits: sql`${users.cashCredits} + ${REWARD_AMOUNT}` })
      .where(eq(users.id, userId))
      .returning({ cashCredits: users.cashCredits });

    if (!result.length) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      reward: REWARD_AMOUNT,
      newBalance: result[0].cashCredits,
      message: "INTEL DECRYPTED. CENNES TRANSFERRED."
    });

  } catch (err: any) {
    console.error("[Rewards] Skillwall error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
