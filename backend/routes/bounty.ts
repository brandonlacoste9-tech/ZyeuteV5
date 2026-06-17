import { Router } from "express";
import { db } from "../storage.js";
import { users } from "../../shared/schema.js";
import { eq, isNull } from "drizzle-orm";
import { requireAuth } from "../supabase-auth.js";
import { randomBytes } from "crypto";

const router = Router();

// Generate a random 8-character alphanumeric code
function generateReferralCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Generate or get the current user's referral code
 */
router.post("/generate", requireAuth, async (req: any, res) => {
  const userId = req.userId;

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.referralCode) {
      return res.json({ referralCode: user.referralCode, bountyEarned: user.bountyEarned });
    }

    // Attempt to generate a unique code
    let newCode = generateReferralCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const [existing] = await db.select().from(users).where(eq(users.referralCode, newCode)).limit(1);
      if (existing) {
        newCode = generateReferralCode();
        attempts++;
      } else {
        isUnique = true;
      }
    }

    if (!isUnique) {
      return res.status(500).json({ error: "Failed to generate unique code" });
    }

    const [updatedUser] = await db
      .update(users)
      .set({ referralCode: newCode })
      .where(eq(users.id, userId))
      .returning();

    return res.json({ referralCode: updatedUser.referralCode, bountyEarned: updatedUser.bountyEarned });
  } catch (error) {
    console.error("Error generating referral code:", error);
    res.status(500).json({ error: "Failed to generate referral code" });
  }
});

/**
 * Claim a bounty by providing a referral code
 */
router.post("/claim", requireAuth, async (req: any, res) => {
  const userId = req.userId;
  const { referralCode } = req.body;

  if (!referralCode) {
    return res.status(400).json({ error: "Referral code is required" });
  }

  try {
    const [newSignup] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!newSignup) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has already claimed a code
    if (newSignup.referredById) {
      return res.status(400).json({ error: "You have already claimed a referral bounty." });
    }

    const [referrer] = await db.select().from(users).where(eq(users.referralCode, referralCode.toUpperCase())).limit(1);

    if (!referrer) {
      return res.status(404).json({ error: "Invalid referral code" });
    }

    if (referrer.id === userId) {
      return res.status(400).json({ error: "You cannot refer yourself!" });
    }

    const BOUNTY_AMOUNT = 500; // 5.00 Piasse (500 Cennes)

    // Transaction to credit both
    await db.transaction(async (tx) => {
      // 1. Credit the new user
      await tx
        .update(users)
        .set({
          referredById: referrer.id,
          cashCredits: (newSignup.cashCredits || 0) + BOUNTY_AMOUNT
        })
        .where(eq(users.id, userId));

      // 2. Credit the referrer
      await tx
        .update(users)
        .set({
          cashCredits: (referrer.cashCredits || 0) + BOUNTY_AMOUNT,
          bountyEarned: (referrer.bountyEarned || 0) + BOUNTY_AMOUNT
        })
        .where(eq(users.id, referrer.id));
    });

    return res.json({ message: "Bounty successfully claimed!", amount: BOUNTY_AMOUNT });
  } catch (error) {
    console.error("Error claiming bounty:", error);
    res.status(500).json({ error: "Failed to claim bounty" });
  }
});

export default router;
