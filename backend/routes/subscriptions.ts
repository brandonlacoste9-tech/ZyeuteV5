/**
 * Stripe Subscription Routes
 * POST /api/stripe/create-checkout  — start Stripe Checkout session
 * GET  /api/stripe/status           — current user's subscription status
 * POST /api/stripe/webhook          — Stripe webhook (signature-verified)
 */

import { Router, Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { fulfillCennePack } from "./cenne-packs.js";

const router = Router();

// ─── Stripe client ────────────────────────────────────────────────────────────
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover" as Stripe.LatestApiVersion,
  });
}

// ─── Supabase service-role client (bypasses RLS for webhook writes) ───────────
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

// ─── Confirmed Stripe price IDs (CAD) ────────────────────────────────────────
const PRICE_IDS: Record<string, string> = {
  // — Quebec (CAD) —
  bronze: "price_1SZuC6CzqBvMqSYF419Lh1xg", // $4.99 CAD/mo
  silver: "price_1SZuCACzqBvMqSYFpfpfFc9M", // $9.99 CAD/mo
  gold: "price_1SZuCDCzqBvMqSYFIl0C1r2T", // $19.99 CAD/mo
  // Legacy French aliases accepted from frontend
  argent: "price_1SZuCACzqBvMqSYFpfpfFc9M",
  or: "price_1SZuCDCzqBvMqSYFIl0C1r2T",
  // — Mexico (MXN) — IDs filled after Stripe creation
  mx_bronze: "price_1Td5QACzqBvMqSYFXsYrhL4F", // $59 MXN/mo
  mx_silver: "price_1Td5QPCzqBvMqSYF3uAy8vDn", // $119 MXN/mo
  mx_gold: "price_1Td5QWCzqBvMqSYF8JI9pJud", // $249 MXN/mo
  // — Brazil (BRL) —
  br_bronze: "price_1Td5lfCzqBvMqSYFd3v978yC", // R$19 BRL/mo
  br_silver: "price_1Td5lfCzqBvMqSYF6FlscDdZ", // R$39 BRL/mo
  br_gold: "price_1Td5lfCzqBvMqSYFoSarZKUF", // R$79 BRL/mo
  // — Argentina (ARS) —
  ar_bronze: "price_1Td5v5CzqBvMqSYF7FKflrH8", // $500 ARS/mo
  ar_silver: "price_1Td5v5CzqBvMqSYFpjgphuIs", // $999 ARS/mo
  ar_gold: "price_1Td5v5CzqBvMqSYFb2TISADL", // $1999 ARS/mo
};

const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  // Legacy French aliases
  argent: "Argent",
  or: "Or",
};

// ─── Auth guard ───────────────────────────────────────────────────────────────
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Non autorisé" });
  next();
};

// ─── POST /create-checkout ────────────────────────────────────────────────────
router.post("/create-checkout", requireAuth, async (req, res) => {
  if (!stripe) {
    return res
      .status(503)
      .json({ error: "Stripe non configuré sur ce serveur" });
  }

  const { tier = "silver", hive } = req.body as {
    tier?: string;
    hive?: string;
  };
  // For Mexico hive, try the mx_ prefixed price first
  const tierKey =
    hive === "mexico"
      ? `mx_${tier.toLowerCase()}`
      : hive === "brazil"
        ? `br_${tier.toLowerCase()}`
        : hive === "argentina"
          ? `ar_${tier.toLowerCase()}`
          : tier.toLowerCase();
  const priceId = PRICE_IDS[tierKey] || PRICE_IDS[tier.toLowerCase()];
  if (!priceId) {
    return res
      .status(400)
      .json({ error: `Niveau inconnu ou prix non configuré: ${tier}` });
  }

  try {
    // Look up user email from Supabase
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("id", req.userId)
      .single();

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      req.userId!,
    );
    const email = authUser?.user?.email ?? undefined;

    const origin = req.headers.origin || "https://zyeute.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/premium?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium?canceled=true`,
      customer_email: email,
      metadata: {
        userId: req.userId!,
        tier: tier.toLowerCase(),
      },
      subscription_data: {
        metadata: {
          userId: req.userId!,
          tier: tier.toLowerCase(),
        },
      },
      locale: "fr",
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("[Stripe] create-checkout error:", error);
    return res.status(500).json({ error: error.message || "Erreur Stripe" });
  }
});

// ─── GET /status ──────────────────────────────────────────────────────────────
router.get("/status", requireAuth, async (req, res) => {
  try {
    const { data: sub, error } = await supabaseAdmin
      .from("subscription_tiers")
      .select("*")
      .eq("user_id", req.userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[Stripe] status query error:", error);
      return res.json({ isPremium: false, tier: "free" });
    }

    if (!sub) {
      return res.json({ isPremium: false, tier: "free" });
    }

    return res.json({
      isPremium: true,
      tier: sub.tier_name,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      stripeSubscriptionId: sub.stripe_subscription_id,
    });
  } catch (error: any) {
    console.error("[Stripe] status error:", error);
    return res.json({ isPremium: false, tier: "free" });
  }
});

// ─── POST /webhook ────────────────────────────────────────────────────────────
// Must use raw body — registered BEFORE express.json() in index.ts
router.post("/webhook", async (req: Request, res: Response) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe] Webhook received but Stripe not configured");
    return res.sendStatus(200);
  }

  const sig = req.headers["stripe-signature"] as string;
  const rawBody = (req as any).rawBody as Buffer | undefined;

  if (!rawBody) {
    console.error("[Stripe] No raw body for webhook signature verification");
    return res.status(400).send("Raw body missing");
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(
      "[Stripe] Webhook signature verification failed:",
      err.message,
    );
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe] Webhook: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          await handleSubscriptionActivated(
            session.metadata?.userId,
            session.subscription as string,
            session.metadata?.tier || "silver",
          );
        } else if (
          session.mode === "payment" &&
          session.metadata?.type === "cenne_pack" &&
          session.payment_status === "paid"
        ) {
          // Fulfill cenne pack purchase
          const userId = session.metadata?.userId;
          const cennes = parseInt(session.metadata?.cennes || "0", 10);
          if (userId && cennes > 0) {
            await fulfillCennePack(userId, cennes);
            console.log(
              `[Stripe] Cenne pack fulfilled: ${cennes}¢ → user ${userId}`,
            );
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const userId =
          sub.metadata?.userId ||
          (await lookupUserByStripeCustomer(sub.customer as string));
        if (userId) {
          const tier = sub.metadata?.tier || tierFromPriceId(sub);
          await upsertSubscription(userId, sub.id, tier, sub.status, sub);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from("subscription_tiers")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        console.log(`[Stripe] Subscription cancelled: ${sub.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subIdFailed = (invoice as unknown as { subscription?: string })
          .subscription;
        if (subIdFailed) {
          await supabaseAdmin
            .from("subscription_tiers")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subIdFailed);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subIdSucceeded = (invoice as unknown as { subscription?: string })
          .subscription;
        if (subIdSucceeded) {
          await supabaseAdmin
            .from("subscription_tiers")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subIdSucceeded);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe] Webhook handler error:", err);
    // Still return 200 to prevent Stripe retries on logic errors
  }

  return res.sendStatus(200);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleSubscriptionActivated(
  userId: string | undefined,
  subscriptionId: string,
  tier: string,
) {
  if (!userId) {
    console.error("[Stripe] checkout.session.completed: no userId in metadata");
    return;
  }

  // Fetch full subscription from Stripe to get period dates
  const sub = await stripe!.subscriptions.retrieve(subscriptionId);
  await upsertSubscription(userId, subscriptionId, tier, "active", sub);
  console.log(`[Stripe] Activated ${tier} for user ${userId}`);
}

async function upsertSubscription(
  userId: string,
  stripeSubId: string,
  tier: string,
  status: string,
  sub: Stripe.Subscription,
) {
  const subAny = sub as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const rawStart =
    subAny.current_period_start ??
    sub.items?.data?.[0]?.current_period_start ??
    0;
  const rawEnd =
    subAny.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? 0;
  const periodStart = new Date(rawStart * 1000).toISOString();
  const periodEnd = new Date(rawEnd * 1000).toISOString();

  const { error } = await supabaseAdmin.from("subscription_tiers").upsert(
    {
      stripe_subscription_id: stripeSubId,
      user_id: userId,
      tier_name: normalizeTier(tier),
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (error) {
    console.error("[Stripe] upsertSubscription error:", error);
  }
}

async function lookupUserByStripeCustomer(
  customerId: string,
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("subscription_tiers")
    .select("user_id")
    .contains("stripe_subscription_id", customerId)
    .limit(1)
    .maybeSingle();
  return data?.user_id ?? null;
}

function tierFromPriceId(sub: Stripe.Subscription): string {
  const priceId = sub.items?.data?.[0]?.price?.id;
  const reversed = Object.entries(PRICE_IDS).find(([, v]) => v === priceId);
  return reversed?.[0] ?? "silver";
}

function normalizeTier(tier: string): string {
  const map: Record<string, string> = {
    // English names (canonical DB values)
    silver: "silver",
    gold: "gold",
    bronze: "bronze",
    // Legacy French aliases → map to English
    argent: "silver",
    or: "gold",
  };
  return map[tier.toLowerCase()] ?? tier.toLowerCase();
}

export default router;
