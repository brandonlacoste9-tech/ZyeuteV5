import { Router } from "express";
import { supabaseAdmin } from "../supabase-auth.js";
import Stripe from "stripe";

const router = Router();

// Lazy placeholder so a missing STRIPE_SECRET_KEY degrades the route instead of
// crashing the server at import time.
function makeStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (key) return new Stripe(key);
  return new Proxy({} as Stripe, {
    get() {
      throw new Error("Stripe not configured (STRIPE_SECRET_KEY missing)");
    },
  });
}

const stripe = makeStripe();

// GET /api/creator/revenue — get creator earnings summary
router.get("/revenue", async (req: any, res) => {
  const userId = req.userId;
  if (!userId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    // Get gifts received
    const { data: gifts } = await supabaseAdmin
      .from("gifts")
      .select(
        "*, sender:user_profiles!gifts_sender_id_fkey(username, avatar_url)",
      )
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    // Total gift earnings (gifts have a cenne/coin value)
    const totalCenneReceived = (gifts || []).reduce(
      (sum: number, g: any) => sum + (g.amount || g.cenne_amount || 0),
      0,
    );

    // Get user's stripe_connect_id
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_connect_id, subscription_tier")
      .eq("id", userId)
      .single();

    // Get follower count
    const { count: followerCount } = await supabaseAdmin
      .from("abonnements")
      .select("*", { count: "exact", head: true })
      .eq("suivi_id", userId);

    // Get total video views
    const { data: posts } = await supabaseAdmin
      .from("publications")
      .select("vue_count, like_count")
      .eq("user_id", userId);

    const totalViews = (posts || []).reduce(
      (sum: number, p: any) => sum + (p.vue_count || 0),
      0,
    );
    const totalLikes = (posts || []).reduce(
      (sum: number, p: any) => sum + (p.like_count || 0),
      0,
    );

    let stripePayouts: any[] = [];
    if (profile?.stripe_connect_id) {
      try {
        const payouts = await stripe.payouts.list(
          { limit: 10 },
          { stripeAccount: profile.stripe_connect_id },
        );
        stripePayouts = payouts.data;
      } catch {
        // Stripe Connect not fully set up yet — ignore silently
      }
    }

    res.json({
      totalCenneReceived,
      gifts: gifts || [],
      followerCount: followerCount || 0,
      totalViews,
      totalLikes,
      stripeConnectId: profile?.stripe_connect_id || null,
      stripePayouts,
      subscriptionTier: profile?.subscription_tier || "free",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creator/stripe-connect — start Stripe Connect onboarding
router.post("/stripe-connect", async (req: any, res) => {
  const userId = req.userId;
  if (!userId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_connect_id, email, username")
      .eq("id", userId)
      .single();

    let accountId = profile?.stripe_connect_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "CA",
        email: profile?.email,
        capabilities: { transfers: { requested: true } },
        business_profile: { name: `@${profile?.username} — Zyeute Creator` },
      });
      accountId = account.id;

      await supabaseAdmin
        .from("user_profiles")
        .update({ stripe_connect_id: accountId })
        .eq("id", userId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL || "https://zyeute.com"}/creator/revenue`,
      return_url: `${process.env.FRONTEND_URL || "https://zyeute.com"}/creator/revenue?connected=true`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
