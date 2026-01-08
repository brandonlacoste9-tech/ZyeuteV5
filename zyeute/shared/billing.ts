/**
 * BILLING MODULE
 * 
 * Centralizes all Stripe/billing logic for easy maintenance and testing.
 * 
 * TODO: Fully wire up when Stripe keys are configured
 */

import Stripe from "stripe";

// Initialize Stripe client if key is available
let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe | null {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      stripeClient = new Stripe(secretKey, {
        apiVersion: "2025-12-15.clover",
      });
    }
  }
  return stripeClient;
}

export interface SubscriptionStatus {
  isPremium: boolean;
  subscriptionEnd: Date | null;
  tier: "free" | "bronze" | "silver" | "gold" | null;
  status: "active" | "canceled" | "past_due" | null;
}

export interface CheckoutSessionResult {
  url: string | null;
  error: Error | null;
}

/**
 * Create a Stripe checkout session for subscription
 * TODO: Fully implement when Stripe is configured
 */
export async function createCheckoutSession(
  userId: string,
  planId: string,
  origin: string,
): Promise<CheckoutSessionResult> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    return {
      url: null,
      error: new Error("Stripe not configured. Set STRIPE_SECRET_KEY environment variable."),
    };
  }

  try {
    // TODO: Map planId to Stripe price ID
    const priceMap: Record<string, string> = {
      bronze: "price_bronze_monthly", // TODO: Replace with actual Stripe price IDs
      silver: "price_silver_monthly",
      gold: "price_gold_monthly",
    };

    const priceId = priceMap[planId] || planId;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/premium?success=true`,
      cancel_url: `${origin}/premium?canceled=true`,
      metadata: {
        userId,
      },
    });

    return {
      url: session.url,
      error: null,
    };
  } catch (error) {
    return {
      url: null,
      error: error as Error,
    };
  }
}

/**
 * Get subscription status for a user
 * TODO: Query database for subscription status (not just Stripe)
 */
export async function getSubscriptionStatus(
  userId: string,
): Promise<SubscriptionStatus> {
  // TODO: Query user's subscription from database
  // For now, return default
  return {
    isPremium: false,
    subscriptionEnd: null,
    tier: "free",
    status: null,
  };
}

/**
 * Handle Stripe webhook events
 * TODO: Implement webhook handlers for subscription events
 */
export async function handleStripeWebhook(
  payload: any,
  signature: string,
): Promise<void> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    // TODO: Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        // TODO: Update user subscription in database
        console.log("Checkout session completed:", event.data.object);
        break;
      case "customer.subscription.updated":
        // TODO: Update subscription status
        console.log("Subscription updated:", event.data.object);
        break;
      case "customer.subscription.deleted":
        // TODO: Cancel subscription in database
        console.log("Subscription canceled:", event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
}

/**
 * Cancel a user's subscription
 * TODO: Implement cancellation logic
 */
export async function cancelSubscription(
  userId: string,
): Promise<{ success: boolean; error: Error | null }> {
  // TODO: Find user's Stripe subscription ID from database
  // TODO: Cancel subscription via Stripe API
  // TODO: Update database
  
  return {
    success: false,
    error: new Error("Not yet implemented"),
  };
}

/**
 * Create payment intent for one-time purchases (e.g., gifts, marketplace)
 */
export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata: Record<string, string>,
): Promise<{ clientSecret: string | null; error: Error | null }> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    return {
      clientSecret: null,
      error: new Error("Stripe not configured. Set STRIPE_SECRET_KEY environment variable."),
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      error: null,
    };
  } catch (error) {
    return {
      clientSecret: null,
      error: error as Error,
    };
  }
}

/**
 * Verify payment intent status
 */
export async function verifyPaymentIntent(
  paymentIntentId: string,
): Promise<{ status: string; metadata: Record<string, string>; error: Error | null }> {
  const stripe = getStripeClient();
  
  if (!stripe) {
    return {
      status: "unknown",
      metadata: {},
      error: new Error("Stripe not configured"),
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: paymentIntent.status,
      metadata: paymentIntent.metadata as Record<string, string>,
      error: null,
    };
  } catch (error) {
    return {
      status: "unknown",
      metadata: {},
      error: error as Error,
    };
  }
}
