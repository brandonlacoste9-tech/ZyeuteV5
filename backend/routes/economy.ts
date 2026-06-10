import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, storage } from "../storage.js";
import { users } from "../../shared/schema.js";
import { hiveTapService } from "../services/hive-tap-service.js";
import { giftbitService } from "../services/giftbit-service.js";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const HiveTapTokenSchema = z.object({
  amount: z.number().int().min(1).max(5000),
  location: LocationSchema,
});

const HiveTapProcessSchema = z.object({
  token: z.string().min(8),
  location: LocationSchema,
});

// --- HIVE TAP ROUTES (Shadow Ledger) ---
router.get("/hive-tap/balance", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const [row] = await db
      .select({ cashCredits: users.cashCredits })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    res.json({ balance: row?.cashCredits ?? 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/hive-tap/token", requireAuth, async (req, res) => {
  const parsed = HiveTapTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const senderId = req.userId!;
    const { amount, location } = parsed.data;
    const [sender] = await db
      .select({ cashCredits: users.cashCredits })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);
    if ((sender?.cashCredits ?? 0) < amount) {
      return res.status(400).json({ error: "Solde insuffisant pour ce tap." });
    }
    const token = await hiveTapService.generateHandshakeToken(
      senderId,
      amount,
      location,
    );
    res.json({ token, expiresInMs: 30000 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/hive-tap/process", requireAuth, async (req, res) => {
  const parsed = HiveTapProcessSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const receiverId = req.userId!;
    const { token, location } = parsed.data;
    const result = await hiveTapService.processIncomingTap(
      receiverId,
      token,
      location,
    );
    const [row] = await db
      .select({ cashCredits: users.cashCredits })
      .from(users)
      .where(eq(users.id, receiverId))
      .limit(1);
    res.json({ ...result, balance: row?.cashCredits ?? 0 });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- VOUCHER & PAYOUT ROUTES (Giftbit Integration) ---
router.post("/vouchers/payout", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { brandCode, amountInCents, recipientEmail, firstName, lastName } =
      req.body;

    // 1. Initial deduction (Safe against race conditions)
    const success = await storage.deductCashCredits(userId, amountInCents);

    if (!success) {
      return res
        .status(400)
        .json({ error: "Balance insuffisante pour ce cadeau." });
    }

    // 2. Process Order via Giftbit
    const order = await giftbitService.placeOrder({
      userId,
      brandCode,
      priceInCents: amountInCents,
      recipientEmail,
      recipientFirstName: firstName,
      recipientLastName: lastName,
    });

    res.json({ success: true, order });
  } catch (error: any) {
    console.error("Payout error:", error);
    res.status(500).json({
      error: "Erreur lors de l'envoi du cadeau. Le remboursement est en cours.",
    });
  }
});

// Get user's transaction history
router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const transactions = await storage.getUserTransactions(userId, limit);

    res.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        status: t.status,
        receiverId: t.receiverId,
        senderId: t.senderId,
        createdAt: t.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Get user transactions error:", error);
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

export default router;
