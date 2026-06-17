import { Router } from "express";
import { db } from "../storage.js";
import { users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth } from "../supabase-auth.js";

const router = Router();

/**
 * Helper to get the current date in EST timezone formatted as YYYY-MM-DD
 */
function getCurrentESTDateString(): string {
  const options: Intl.DateTimeFormatOptions = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD
  return formatter.format(new Date());
}

/**
 * Helper to parse a Date object to EST YYYY-MM-DD
 */
function getESTDateString(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  const options: Intl.DateTimeFormatOptions = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(d);
}

/**
 * Calculate days between two YYYY-MM-DD strings
 */
function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get the current streak status for a user
 */
router.get("/status", requireAuth, async (req: any, res) => {
  const userId = req.userId;

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const todayEST = getCurrentESTDateString();
    const lastClaimEST = getESTDateString(user.lastDailyBonus);

    const hasClaimedToday = todayEST === lastClaimEST;

    return res.json({
      currentStreak: user.currentStreak || 0,
      maxStreak: user.maxStreak || 0,
      hasClaimedToday,
      nextReward: (user.currentStreak || 0) % 7 === 6 ? 100 : 10
    });
  } catch (err) {
    console.error("Error fetching streak status:", err);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

/**
 * Claim the daily bonus
 */
router.post("/claim", requireAuth, async (req: any, res) => {
  const userId = req.userId;

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });

    const todayEST = getCurrentESTDateString();
    const lastClaimEST = getESTDateString(user.lastDailyBonus);

    if (todayEST === lastClaimEST) {
      return res.status(400).json({ error: "Daily bonus already claimed today." });
    }

    let newStreak = 1;
    if (lastClaimEST) {
      const daysDiff = getDaysDifference(lastClaimEST, todayEST);
      if (daysDiff === 1) {
        // Claimed yesterday, increment
        newStreak = (user.currentStreak || 0) + 1;
      }
    }

    // Reward scaling
    const dayInCycle = ((newStreak - 1) % 7) + 1;
    const rewardAmount = dayInCycle === 7 ? 100 : 10;
    
    const newMaxStreak = Math.max(user.maxStreak || 0, newStreak);

    // Apply the transaction
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          currentStreak: newStreak,
          maxStreak: newMaxStreak,
          lastDailyBonus: new Date(),
          cashCredits: (user.cashCredits || 0) + rewardAmount
        })
        .where(eq(users.id, userId));
    });

    if (rewardAmount === 100) {
      import("../bot/ti-guy.js").then(({ broadcastEmbed }) => {
        broadcastEmbed(
          "🚨 JACKPOT DE SÉQUENCE! 🚨",
          `**@${user.username || "Quelqu'un"}** vient de péter le feu pis de ramasser 100 Cennes pour sa séquence de ${newStreak} jours consécutifs! C'est malade! 🔥`,
          0xFF4500
        );
      }).catch(err => console.error("Could not trigger Ti-Guy broadcast:", err));
    }

    return res.json({
      success: true,
      reward: rewardAmount,
      currentStreak: newStreak,
      maxStreak: newMaxStreak,
      dayInCycle
    });

  } catch (err) {
    console.error("Error claiming streak:", err);
    res.status(500).json({ error: "Failed to claim bonus" });
  }
});

export default router;
