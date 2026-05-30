import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage.js";
import { traceStripe } from "../tracer.js";
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

// Create checkout session for premium subscription
router.post("/create-checkout", requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const session = await traceStripe(
      "checkout.sessions.create",
      async (span) => {
        span.setAttributes({ "stripe.user_id": user.id });
        return stripe!.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          line_items: [
            {
              price_data: {
                currency: "cad",
                product_data: {
                  name: "Zyeuté VIP",
                  description:
                    "Accès premium avec Ti-Guy AI, création avancée, et plus!",
                },
                unit_amount: 999, // $9.99 CAD
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${req.headers.origin}/premium?success=true`,
          cancel_url: `${req.headers.origin}/premium?canceled=true`,
          customer_email: user.email || undefined,
          metadata: {
            userId: user.id,
          },
        });
      },
    );

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create checkout session" });
  }
});

// Get subscription status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      isPremium:
        user.subscriptionTier !== null && user.subscriptionTier !== "free",
      subscriptionEnd: null, // Would track in DB in production
    });
  } catch (error: any) {
    console.error("Subscription status error:", error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
});

export default router;
