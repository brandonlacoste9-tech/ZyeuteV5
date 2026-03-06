import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { GIFT_CATALOG, type GiftType } from "../../shared/schema.js";
import Stripe from "stripe";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
  next();
};

const router = Router();
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.acacia" as Stripe.LatestApiVersion,
  });
}

// Get gift catalog
router.get("/catalog", (req, res) => {
  res.json({
    gifts: Object.entries(GIFT_CATALOG).map(([type, info]) => ({
      type,
      ...info,
      priceDisplay: `$${(info.price / 100).toFixed(2)}`,
    })),
  });
});

// Get available gifts for a hive
router.get("/catalog/:hiveId", async (req, res) => {
  try {
    const hiveId = req.params.hiveId || "quebec";
    const availableGifts = Object.entries(
      GIFT_CATALOG as Record<string, any>,
    ).filter(([key, gift]) => !gift.hive || gift.hive === hiveId);

    const giftCatalog = Object.fromEntries(availableGifts);
    res.json({ hiveId, gifts: giftCatalog });
  } catch (error: any) {
    console.error("Get gift catalog error:", error);
    res.status(500).json({ error: "Failed to get gift catalog" });
  }
});

// Create payment intent for gift purchase
router.post("/create-payment-intent", requireAuth, async (req, res) => {
  try {
    const { giftType, postId } = req.body;
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    if (!giftType || !(giftType in GIFT_CATALOG)) {
      return res.status(400).json({ error: "Invalid gift type" });
    }

    const post = await storage.getPost(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const senderId = req.userId!;
    const recipientId = post.userId;

    if (senderId === recipientId) {
      return res
        .status(400)
        .json({ error: "Tu peux pas t'envoyer un cadeau à toi-même! 🎁" });
    }

    const giftInfo = GIFT_CATALOG[giftType as GiftType];
    const amount = giftInfo.price;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "cad",
      metadata: {
        type: "gift",
        giftType,
        postId,
        senderId,
        recipientId,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      giftInfo,
    });
  } catch (error: any) {
    console.error("Gift payment intent error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create payment intent" });
  }
});

// Confirm gift after successful payment
router.post("/confirm", requireAuth, async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, giftType, postId } = req.body;
    const senderId = req.userId!;

    if (!paymentIntentId || !giftType || !postId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    if (
      paymentIntent.metadata.postId !== postId ||
      paymentIntent.metadata.giftType !== giftType ||
      paymentIntent.metadata.senderId !== senderId
    ) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const recipientId = paymentIntent.metadata.recipientId;
    const recipient = await storage.getUser(recipientId);
    const recipientHive = recipient?.hiveId || "quebec";

    const availableGifts = Object.entries(
      GIFT_CATALOG as Record<string, any>,
    ).filter(([key, gift]) => !gift.hive || gift.hive === recipientHive);

    const availableGiftTypes = Object.fromEntries(availableGifts);
    const giftInfo = availableGiftTypes[giftType as GiftType];

    if (!giftInfo) {
      return res.status(400).json({
        error: `Gift type '${giftType}' not available in hive '${recipientHive}'`,
      });
    }

    const gift = await storage.createGift({
      senderId,
      recipientId,
      postId,
      giftType,
      amount: giftInfo.price,
      stripePaymentId: paymentIntentId,
    });

    const sender = await storage.getUser(senderId);
    await storage.createNotification({
      userId: recipientId,
      type: "gift",
      fromUserId: senderId,
      postId,
      giftId: gift.id,
      message: `${sender?.displayName || sender?.username} t'a envoyé un ${giftInfo.emoji} ${giftInfo.name}!`,
    });

    res.json({ success: true, gift, giftInfo });
  } catch (error: any) {
    console.error("Gift confirm error:", error);
    res.status(500).json({ error: error.message || "Failed to confirm gift" });
  }
});

// Get gifts for a post
router.get("/post/:id", async (req, res) => {
  try {
    const postId = req.params.id as string;
    const gifts = await storage.getGiftsByPost(postId);
    const count = await storage.getPostGiftCount(postId);

    const giftCounts: Record<string, number> = {};
    gifts.forEach((g) => {
      giftCounts[g.giftType] = (giftCounts[g.giftType] || 0) + 1;
    });

    res.json({
      totalCount: count,
      giftCounts,
      recentGifts: gifts.slice(0, 5).map((g) => ({
        id: g.id,
        type: g.giftType,
        sender: {
          id: g.sender.id,
          username: g.sender.username,
          displayName: g.sender.displayName,
          avatarUrl: g.sender.avatarUrl,
        },
        createdAt: g.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Get post gifts error:", error);
    res.status(500).json({ error: "Failed to get gifts" });
  }
});

// Get current user's received gifts
router.get("/me/received", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const gifts = await storage.getUserReceivedGifts(userId);

    res.json({
      gifts: gifts.map((g) => ({
        id: g.id,
        type: g.giftType,
        amount: g.amount,
        sender: {
          id: g.sender.id,
          username: g.sender.username,
          displayName: g.sender.displayName,
          avatarUrl: g.sender.avatarUrl,
        },
        post: {
          id: g.post.id,
          mediaUrl: g.post.mediaUrl,
        },
        createdAt: g.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Get user gifts error:", error);
    res.status(500).json({ error: "Failed to get gifts" });
  }
});

export default router;
