/**
 * Cenne Packs — Buy virtual currency (cennes) via Stripe one-time checkout
 *
 * POST /api/cennes/buy-pack        — create Stripe one-time checkout session
 * GET  /api/cennes/balance         — get current user's cenne balance
 * POST /api/cennes/gift            — gift cennes to a creator (no Stripe — from balance)
 * GET  /api/cennes/catalog         — get gift item catalog
 * POST /api/cennes/webhook-fulfill — called internally by stripe webhook after payment
 */

import { Router, Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { db } from "../storage.js";
import { users } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";

const router = Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://zyeute.com";

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY);
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) return res.status(401).json({ error: "Non autorisé" });
  next();
};

// ─── Cenne pack catalog ────────────────────────────────────────────────────────
// Zyeuté keeps 30% — creators receive 70% of gifted cennes as real CAD
// 1 cenne = $0.01 CAD face value. Packs sold at slight premium for margin.
export const CENNE_PACKS = [
  {
    id: "ptit",
    name: "P'tit 10",
    cennes: 100,
    priceCAD: 1.99,
    priceCents: 199,
    emoji: "🌿",
    description: "Pour commencer",
    badge: null,
  },
  {
    id: "moyen",
    name: "Moyen",
    cennes: 550,
    priceCAD: 7.99,
    priceCents: 799,
    emoji: "⚜️",
    description: "Le plus populaire",
    badge: "POPULAIRE",
  },
  {
    id: "gros",
    name: "Gros",
    cennes: 1400,
    priceCAD: 14.99,
    priceCents: 1499,
    emoji: "🔥",
    description: "Meilleure valeur",
    badge: "VALEUR",
  },
  {
    id: "mega",
    name: "Méga",
    cennes: 3500,
    priceCAD: 29.99,
    priceCents: 2999,
    emoji: "👑",
    description: "Pour les vrais",
    badge: null,
  },
] as const;

export type CennePackId = (typeof CENNE_PACKS)[number]["id"];

// ─── Gift catalog (items users can send) ──────────────────────────────────────
export const GIFT_ITEMS = [
  { id: "fleur", emoji: "🌸", name: "Fleur", cost: 10 },
  { id: "cafe", emoji: "☕", name: "Café", cost: 25 },
  { id: "coeur", emoji: "💛", name: "Coeur d'or", cost: 50 },
  { id: "feu", emoji: "🔥", name: "Feu", cost: 100 },
  { id: "erable", emoji: "🍁", name: "Érable", cost: 150 },
  { id: "fleur_de_lys", emoji: "⚜️", name: "Fleur de Lys", cost: 250 },
  { id: "couronne", emoji: "👑", name: "Couronne", cost: 500 },
  { id: "comete", emoji: "☄️", name: "Comète", cost: 1000 },
] as const;

export type GiftItemId = (typeof GIFT_ITEMS)[number]["id"];

// ─── GET /catalog ─────────────────────────────────────────────────────────────
router.get("/catalog", (_req, res) => {
  res.json({ packs: CENNE_PACKS, gifts: GIFT_ITEMS });
});

// ─── GET /balance ─────────────────────────────────────────────────────────────
router.get("/balance", requireAuth, async (req, res) => {
  try {
    const result = await db
      .select({ cashCredits: users.cashCredits })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);

    const balance = result[0]?.cashCredits ?? 0;
    res.json({ balance, balanceDisplay: `${balance}¢` });
  } catch (err: any) {
    console.error("[cennes] balance error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── POST /buy-pack ───────────────────────────────────────────────────────────
router.post("/buy-pack", requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Stripe non configuré" });
  }

  const { packId } = req.body as { packId: string };
  const pack = CENNE_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return res.status(400).json({ error: `Pack inconnu: ${packId}` });
  }

  try {
    // Get user email for Stripe pre-fill
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
      req.userId!,
    );
    const email = authUser?.user?.email ?? undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: pack.priceCents,
            product_data: {
              name: `${pack.cennes} Cennes Zyeuté — Pack ${pack.name}`,
              description: `Ajoute ${pack.cennes}¢ à ton solde pour gifter tes créateurs préférés`,
              images: ["https://zyeute.com/zyeute_app_icon.png"],
            },
          },
        },
      ],
      metadata: {
        type: "cenne_pack",
        packId: pack.id,
        userId: req.userId!,
        cennes: String(pack.cennes),
      },
      success_url: `${FRONTEND_URL}/store?success=true&pack=${pack.id}&cennes=${pack.cennes}`,
      cancel_url: `${FRONTEND_URL}/store?canceled=true`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("[cennes] buy-pack error:", err);
    res.status(500).json({ error: err.message || "Erreur lors du paiement" });
  }
});

// ─── POST /gift ───────────────────────────────────────────────────────────────
// Deduct from sender balance, credit creator (minus 30% platform fee)
router.post("/gift", requireAuth, async (req, res) => {
  const { recipientId, giftId, postId } = req.body as {
    recipientId: string;
    giftId: string;
    postId?: string;
  };

  const gift = GIFT_ITEMS.find((g) => g.id === giftId);
  if (!gift) {
    return res.status(400).json({ error: `Cadeau inconnu: ${giftId}` });
  }

  const senderId = req.userId!;
  if (senderId === recipientId) {
    return res
      .status(400)
      .json({ error: "Tu peux pas t'envoyer un cadeau à toi-même!" });
  }

  const cost = gift.cost;
  const creatorEarns = Math.floor(cost * 0.7); // 70% to creator

  try {
    // Atomic: deduct from sender (guard balance >= cost)
    const deductResult = await db
      .update(users)
      .set({ cashCredits: sql`${users.cashCredits} - ${cost}` })
      .where(sql`${users.id} = ${senderId} AND ${users.cashCredits} >= ${cost}`)
      .returning({ id: users.id });

    if (!deductResult.length) {
      return res.status(400).json({
        error: "Solde insuffisant. Achète des cennes dans la boutique!",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    // Credit creator (70% share)
    await db
      .update(users)
      .set({ cashCredits: sql`${users.cashCredits} + ${creatorEarns}` })
      .where(eq(users.id, recipientId));

    // Notify creator via Supabase (real schema: actor_id, post_id, payload jsonb)
    await supabaseAdmin.from("notifications").insert({
      user_id: recipientId,
      type: "gift",
      actor_id: senderId,
      post_id: postId || null,
      payload: {
        emoji: gift.emoji,
        name: gift.name,
        cost: gift.cost,
        message: `Tu as reçu un ${gift.emoji} ${gift.name} (${gift.cost}¢)!`,
      },
      lu: false,
      created_at: new Date().toISOString(),
    });

    // Fetch updated sender balance
    const balanceResult = await db
      .select({ cashCredits: users.cashCredits })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    res.json({
      success: true,
      gift: { id: gift.id, emoji: gift.emoji, name: gift.name, cost },
      newBalance: balanceResult[0]?.cashCredits ?? 0,
      creatorEarned: creatorEarns,
    });
  } catch (err: any) {
    console.error("[cennes] gift error:", err);
    res.status(500).json({ error: err.message || "Erreur lors du cadeau" });
  }
});

// ─── POST /fulfill (called by Stripe webhook in subscriptions.ts) ─────────────
// This is an internal handler — not a public endpoint
export async function fulfillCennePack(
  userId: string,
  cennes: number,
): Promise<void> {
  await db
    .update(users)
    .set({ cashCredits: sql`${users.cashCredits} + ${cennes}` })
    .where(eq(users.id, userId));
  console.log(`[cennes] Fulfilled ${cennes}¢ to user ${userId}`);
}

export default router;
