import { Router } from "express";
import { storage } from "../storage.js";
import { differenceInDays, startOfDay } from "date-fns";

const router = Router();

// --- DAILY BONUS & STREAK ---
router.post("/daily-bonus", async (req, res) => {
  try {
    // In a real app, use req.user.id from middleware
    // For Quebec Core validation, we trust the body or default to test user
    const { username } = req.body;
    const targetUsername = username || "test_user_quebec";

    const user = await storage.getUserByUsername(targetUsername);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();
    const lastBonus = user.lastDailyBonus
      ? new Date(user.lastDailyBonus)
      : null;
    let streak = user.currentStreak || 0;
    let cashAward = 100; // Base award

    // Logic
    if (lastBonus) {
      const daysDiff = differenceInDays(startOfDay(now), startOfDay(lastBonus));

      if (daysDiff === 0) {
        return res
          .status(400)
          .json({
            error: "Bonus already claimed today",
            nextAvailable: "Tomorrow",
          });
      } else if (daysDiff === 1) {
        // Streak continues!
        streak += 1;
        cashAward += streak * 10; // Multiplier
      } else {
        // Streak broken
        streak = 1;
      }
    } else {
      streak = 1;
    }

    // Cap streak bonus
    if (cashAward > 1000) cashAward = 1000;

    // DB Update
    const updatedUser = await storage.updateUserEconomy(user.id, {
      cashCredits: (user.cashCredits || 0) + cashAward,
      currentStreak: streak,
      maxStreak: Math.max(streak, user.maxStreak || 0),
      lastDailyBonus: now,
    });

    res.json({
      success: true,
      message: `Claimed ${cashAward}$! Streak: ${streak}`,
      data: {
        cashCredits: updatedUser.cashCredits,
        currentStreak: updatedUser.currentStreak,
        award: cashAward,
      },
    });
  } catch (error) {
    console.error("Daily Bonus Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export const economyRoutes = router;
