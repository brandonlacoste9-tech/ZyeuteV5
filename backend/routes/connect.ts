/**
 * Stripe Connect — Creator payout onboarding & withdrawal
 *
 * POST /api/connect/onboard        — create/resume Connect onboarding link
 * GET  /api/connect/status         — check account status + cenne balance
 * POST /api/connect/withdraw       — withdraw cennes → CAD payout to bank
 */

import { Router } from "express";
import Stripe from "stripe";
import { requireAuth } from "../supabase-auth.js";
import { supabaseAdmin } from "../supabase-auth.js";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover" as Stripe.LatestApiVersion,
});

const CENNE_TO_CAD = 0.01; // 1 cenne = $0.01 CAD
const PLATFORM_CUT = 0.3; // platform already deducted at gift time
const MIN_WITHDRAWAL_CENNES = 500; // $5.00 CAD minimum

// ── POST /onboard ─────────────────────────────────────────────────────────────
// Creates a Stripe Connect account (if needed) and returns an onboarding link.
router.post("/onboard", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;

    // Check if user already has a Connect account
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_connect_id, username, email")
      .eq("id", userId)
      .single();

    let accountId: string = profile?.stripe_connect_id || "";

    if (!accountId) {
      // Create a new Express account for the creator
      const account = await stripe.accounts.create({
        type: "express",
        country: "CA",
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          product_description: "Créateur de contenu sur Zyeuté",
        },
        metadata: { userId },
      });
      accountId = account.id;

      // Persist the account ID
      await supabaseAdmin
        .from("user_profiles")
        .update({ stripe_connect_id: accountId })
        .eq("id", userId);
    }

    // Generate onboarding link
    const origin = process.env.FRONTEND_URL || "https://zyeute.com";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/wallet?connect=refresh`,
      return_url: `${origin}/wallet?connect=success`,
      type: "account_onboarding",
    });

    return res.json({ url: accountLink.url, accountId });
  } catch (err: any) {
    console.error("[Connect] onboard error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /status ───────────────────────────────────────────────────────────────
router.get("/status", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_connect_id, cash_credits")
      .eq("id", userId)
      .single();

    const connectId: string | null = profile?.stripe_connect_id || null;
    const cennes: number = profile?.cash_credits || 0;

    let payoutsEnabled = false;
    let chargesEnabled = false;
    let requirements: string[] = [];

    if (connectId) {
      const account = await stripe.accounts.retrieve(connectId);
      payoutsEnabled = account.payouts_enabled ?? false;
      chargesEnabled = account.charges_enabled ?? false;
      requirements = [
        ...(account.requirements?.currently_due || []),
        ...(account.requirements?.past_due || []),
      ];
    }

    return res.json({
      connected: !!connectId,
      payoutsEnabled,
      chargesEnabled,
      requirements,
      connectId,
      cennes,
      cadValue: parseFloat((cennes * CENNE_TO_CAD).toFixed(2)),
      minWithdrawal: MIN_WITHDRAWAL_CENNES,
      minWithdrawalCAD: parseFloat(
        (MIN_WITHDRAWAL_CENNES * CENNE_TO_CAD).toFixed(2),
      ),
    });
  } catch (err: any) {
    console.error("[Connect] status error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /withdraw ────────────────────────────────────────────────────────────
router.post("/withdraw", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;
    const { cennes }: { cennes: number } = req.body;

    if (!cennes || cennes < MIN_WITHDRAWAL_CENNES) {
      return res.status(400).json({
        error: `Minimum de retrait: ${MIN_WITHDRAWAL_CENNES}¢ ($${(MIN_WITHDRAWAL_CENNES * CENNE_TO_CAD).toFixed(2)} CAD)`,
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("stripe_connect_id, cash_credits")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_connect_id) {
      return res.status(400).json({
        error: "Compte bancaire non connecté. Lance l'intégration d'abord.",
      });
    }

    if ((profile.cash_credits || 0) < cennes) {
      return res.status(400).json({ error: "Solde insuffisant." });
    }

    // Verify account is ready for payouts
    const account = await stripe.accounts.retrieve(profile.stripe_connect_id);
    if (!account.payouts_enabled) {
      return res.status(400).json({
        error: "Compte bancaire non vérifié. Complète ton profil Stripe.",
      });
    }

    const amountCAD = Math.floor(cennes * CENNE_TO_CAD * 100); // cents for Stripe

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: amountCAD,
      currency: "cad",
      destination: profile.stripe_connect_id,
      description: `Retrait Zyeuté — ${cennes}¢ cennes`,
      metadata: { userId, cennes: String(cennes) },
    });

    // Deduct cennes from user balance
    await supabaseAdmin
      .from("user_profiles")
      .update({ cash_credits: (profile.cash_credits || 0) - cennes })
      .eq("id", userId);

    return res.json({
      success: true,
      transferId: transfer.id,
      amountCAD: parseFloat((amountCAD / 100).toFixed(2)),
      cennesDeducted: cennes,
      remaining: (profile.cash_credits || 0) - cennes,
    });
  } catch (err: any) {
    console.error("[Connect] withdraw error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
