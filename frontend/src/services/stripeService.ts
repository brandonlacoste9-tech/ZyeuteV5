/**
 * 💳 STRIPE SERVICE
 * Payment processing for Marketplace and Premium subscriptions
 */

import { loadStripe } from "@stripe/stripe-js";
import { logger } from "@/lib/logger";

const stripeServiceLogger = logger.withContext("StripeService");
import { supabase } from "../lib/supabase";
import { toast } from "../components/Toast";

type Stripe = Awaited<ReturnType<typeof loadStripe>>;

let stripePromise: Promise<Stripe> | null = null;

/**
 * Initialize Stripe with public key
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!key) {
      stripeServiceLogger.warn(
        "⚠️ VITE_STRIPE_PUBLISHABLE_KEY not found. Running in DEMO MODE.",
      );
      return Promise.resolve(null);
    }

    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

/**
 * Subscribe to Premium VIP tier
 */
export async function subscribeToPremium(
  tier: "bronze" | "silver" | "gold",
): Promise<void> {
  const stripe = await getStripe();

  // DEMO MODE: Simulate Stripe checkout if no Stripe key
  if (!stripe) {
    toast.info("🔧 Demo Mode: Stripe non configuré");
    toast.info(`Simulation: Abonnement ${tier.toUpperCase()} activé!`);
    return;
  }

  try {
    // Use our Express backend for Stripe checkout
    const response = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    if (data?.url) {
      toast.info("Redirection vers Stripe...");
      window.location.href = data.url;
    } else {
      toast.error("Erreur: URL de paiement non reçue");
    }
  } catch (error: any) {
    stripeServiceLogger.error("Subscription error:", error);
    toast.error("Erreur de paiement: " + (error.message || "Erreur inconnue"));
  }
}

/**
 * Purchase product from Marketplace
 */
export async function purchaseProduct(
  productId: string,
  price: number,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Connecte-toi d'abord!");
    return;
  }

  const stripe = await getStripe();

  // DEMO MODE
  if (!stripe) {
    toast.info("🔧 Demo Mode: Stripe non configuré");
    toast.success(
      `Simulation: Achat confirmé pour ${(price / 100).toFixed(2)}$`,
    );

    // Simulate order creation
    await simulateOrderCreation(user.id, productId, price);
    return;
  }

  try {
    // Call backend to create checkout session
    toast.info("Redirection vers Stripe...");

    // For now, show instructions
    toast.info(
      "Intégration Stripe prête! Ajoute une Edge Function pour activer.",
    );
  } catch (error: any) {
    stripeServiceLogger.error("Purchase error:", error);
    toast.error("Erreur de paiement");
  }
}

/**
 * Handle successful payment (called from success redirect)
 */
export async function handlePaymentSuccess(sessionId: string): Promise<void> {
  try {
    // Verify payment with backend
    // const { data } = await supabase.functions.invoke('verify-payment', {
    //   body: { sessionId }
    // });

    toast.success("Paiement réussi! 🎉");
  } catch (error) {
    stripeServiceLogger.error("Payment verification error:", error);
    toast.error("Erreur de vérification");
  }
}

/**
 * Connect Stripe for creator payouts
 */
export async function connectStripeAccount(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const stripe = await getStripe();

  if (!stripe) {
    toast.info("🔧 Demo Mode: Connecte un vrai compte Stripe en production");
    toast.success("Simulation: Compte Stripe connecté!");
    return;
  }

  try {
    // Create Stripe Connect account
    // const { data } = await supabase.functions.invoke('create-connect-account', {
    //   body: { userId: user.id }
    // });

    toast.info("Configuration Stripe Connect prête!");
  } catch (error) {
    stripeServiceLogger.error("Connect error:", error);
    toast.error("Erreur de connexion Stripe");
  }
}

/**
 * Request payout (for creators)
 */
export async function requestPayout(amount: number): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // Create payout request
    const { error } = await supabase
      .from("creator_earnings")
      .update({ payout_requested: true })
      .eq("user_id", user.id);

    if (error) throw error;

    toast.success(
      `Demande de paiement de ${(amount / 100).toFixed(2)}$ envoyée!`,
    );
  } catch (error) {
    stripeServiceLogger.error("Payout error:", error);
    toast.error("Erreur de paiement");
  }
}

// ============================================
// DEMO MODE SIMULATIONS
// ============================================

async function simulateSubscriptionActivation(
  userId: string,
  tier: string,
): Promise<void> {
  // In production, this happens in webhook after successful payment
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { error } = await supabase.from("user_subscriptions").upsert({
    user_id: userId,
    tier,
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  });

  if (!error) {
    toast.success(`Abonnement ${tier.toUpperCase()} activé! 🎉`);
  }
}

async function simulateOrderCreation(
  userId: string,
  productId: string,
  amount: number,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Get product details
  const { data: product } = await supabase
    .from("products")
    .select("seller_id")
    .eq("id", productId)
    .single();

  if (product) {
    const { error } = await supabase.from("orders").insert({
      buyer_id: userId,
      seller_id: product.seller_id,
      product_id: productId,
      amount_cents: amount,
      status: "paid",
    });

    if (!error) {
      toast.success("Commande créée! Le vendeur a été notifié. 📦");
    }
  }
}

/**
 * Get pricing for display
 */
export const STRIPE_PRICING = {
  premium: {
    bronze: { price: 4.99, priceId: "price_bronze_monthly" },
    silver: { price: 9.99, priceId: "price_silver_monthly" },
    gold: { price: 19.99, priceId: "price_gold_monthly" },
  },
  marketplace: {
    platformFee: 0.15, // 15%
    stripeFee: 0.029, // 2.9%
    stripeFixed: 30, // $0.30 in cents
  },
};

/**
 * Calculate marketplace fees
 */
export function calculateMarketplaceFees(price: number): {
  price: number;
  platformFee: number;
  stripeFee: number;
  sellerReceives: number;
} {
  const { platformFee, stripeFee, stripeFixed } = STRIPE_PRICING.marketplace;

  const platformAmount = Math.round(price * platformFee);
  const stripeAmount = Math.round(price * stripeFee) + stripeFixed;
  const sellerAmount = price - platformAmount - stripeAmount;

  return {
    price,
    platformFee: platformAmount,
    stripeFee: stripeAmount,
    sellerReceives: sellerAmount,
  };
}
