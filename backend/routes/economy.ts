import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { hiveTapService } from "../services/hive-tap-service.js";
import { giftbitService } from "../services/giftbit-service.js";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();

// --- HIVE TAP ROUTES (Shadow Ledger) ---
router.post("/hive-tap/token", requireAuth, async (req, res) => {
  try {
    const senderId = req.userId!;
    const { amount, location } = req.body;
    const token = await hiveTapService.generateHandshakeToken(
      senderId,
      amount,
      location,
    );
    res.json({ token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/hive-tap/process", requireAuth, async (req, res) => {
  try {
    const receiverId = req.userId!;
    const { token, location } = req.body;
    const result = await hiveTapService.processIncomingTap(
      receiverId,
      token,
      location,
    );
    res.json(result);
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
