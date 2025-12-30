/**
 * Subscription Service - Creator Monetization
 * Handles subscriptions, tiers, payments, and revenue tracking
 */

import { supabase } from "../lib/supabase";
import { logger } from "@/lib/logger";

const subscriptionServiceLogger = logger.withContext("SubscriptionService");
import { toast } from "../components/Toast";

export interface SubscriptionTier {
  id: string;
  creator_id: string;
  name: string;
  name_fr: string;
  description?: string;
  price: number;
  currency: string;
  benefits: string[];
  is_active: boolean;
  max_subscribers?: number;
  subscriber_count: number;
  monthly_revenue: number;
  stripe_price_id?: string;
  stripe_product_id?: string;
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  creator_id: string;
  tier_id: string;
  status: "active" | "canceled" | "past_due" | "paused" | "expired";
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  canceled_at?: string;
  tier?: SubscriptionTier;
}

export interface CreatorEarnings {
  id: string;
  creator_id: string;
  source: "subscription" | "gift" | "tip" | "sponsored";
  amount: number;
  platform_fee: number;
  creator_net: number;
  payout_status: "pending" | "paid" | "failed";
  created_at: string;
}

export interface RevenueSummary {
  total_earnings: number;
  pending_earnings: number;
  total_subscribers: number;
  monthly_recurring_revenue: number;
  this_month_revenue: number;
  last_month_revenue: number;
}

/**
 * Get creator's subscription tiers
 */
export async function getCreatorTiers(
  creatorId: string,
): Promise<SubscriptionTier[]> {
  try {
    const { data, error } = await supabase
      .from("subscription_tiers")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    subscriptionServiceLogger.error(
      "Error fetching subscription tiers:",
      error,
    );
    return [];
  }
}

/**
 * Create subscription tier
 */
export async function createSubscriptionTier(
  creatorId: string,
  tier: {
    name: string;
    name_fr: string;
    description?: string;
    price: number;
    benefits: string[];
    max_subscribers?: number;
  },
): Promise<SubscriptionTier | null> {
  try {
    if (tier.price < 4.99) {
      toast.error("Le prix minimum est 4.99$ CAD");
      return null;
    }

    const { data, error } = await supabase
      .from("subscription_tiers")
      .insert({
        creator_id: creatorId,
        ...tier,
        currency: "CAD",
      })
      .select()
      .single();

    if (error) throw error;

    toast.success(`Abonnement "${tier.name_fr}" créé!`);
    return data;
  } catch (error: any) {
    subscriptionServiceLogger.error("Error creating subscription tier:", error);
    toast.error("Erreur lors de la création");
    return null;
  }
}

/**
 * Check if user is subscribed to creator
 */
export async function isSubscribedTo(
  subscriberId: string,
  creatorId: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("is_subscribed_to", {
      p_subscriber_id: subscriberId,
      p_creator_id: creatorId,
    });

    if (error) throw error;
    return data === true;
  } catch (error) {
    subscriptionServiceLogger.error("Error checking subscription:", error);
    return false;
  }
}

/**
 * Get user's active subscriptions
 */
export async function getUserSubscriptions(
  userId: string,
): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, tier:subscription_tiers(*)")
      .eq("subscriber_id", userId)
      .eq("status", "active");

    if (error) throw error;
    return data || [];
  } catch (error) {
    subscriptionServiceLogger.error("Error fetching subscriptions:", error);
    return [];
  }
}

/**
 * Get creator's subscribers
 */
export async function getCreatorSubscribers(creatorId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "*, subscriber:users(id, username, avatar_url, is_verified), tier:subscription_tiers(name_fr, price)",
      )
      .eq("creator_id", creatorId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    subscriptionServiceLogger.error("Error fetching subscribers:", error);
    return [];
  }
}

/**
 * Subscribe to creator (simplified - in production use Stripe)
 */
export async function subscribeToCreator(
  subscriberId: string,
  creatorId: string,
  tierId: string,
): Promise<boolean> {
  try {
    // Check if already subscribed
    const isSubscribed = await isSubscribedTo(subscriberId, creatorId);
    if (isSubscribed) {
      toast.warning("Tu es déjà abonné!");
      return false;
    }

    // Get tier details
    const { data: tier } = await supabase
      .from("subscription_tiers")
      .select("*")
      .eq("id", tierId)
      .single();

    if (!tier) {
      toast.error("Abonnement introuvable");
      return false;
    }

    // Check if user has enough cennes (for demo purposes)
    const { data: userData } = await supabase
      .from("user_profiles")
      .select("cennes")
      .eq("id", subscriberId)
      .single();

    const cennesRequired = Math.round(tier.price * 100); // $1 = 100 cennes

    if (!userData || (userData.cennes || 0) < cennesRequired) {
      toast.error(
        `Tu as besoin de ${cennesRequired} cennes (${tier.price}$ CAD)`,
      );
      return false;
    }

    // Deduct cennes
    await supabase
      .from("user_profiles")
      .update({ cennes: (userData.cennes || 0) - cennesRequired })
      .eq("id", subscriberId);

    // Create subscription
    const { error } = await supabase.from("subscriptions").insert({
      subscriber_id: subscriberId,
      creator_id: creatorId,
      tier_id: tierId,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 30 days
    });

    if (error) throw error;

    // Record revenue
    await supabase.rpc("record_subscription_revenue", {
      p_subscription_id: subscriberId, // This would be the actual subscription ID
      p_amount: tier.price,
    });

    // Create notification for creator
    await supabase.from("notifications").insert({
      user_id: creatorId,
      type: "subscription",
      message: `Nouvel abonné à ${tier.name_fr}! 💰`,
    });

    toast.success(`Abonné à ${tier.name_fr}! 🎉`);
    return true;
  } catch (error: any) {
    subscriptionServiceLogger.error("Error subscribing:", error);
    toast.error("Erreur lors de l'abonnement");
    return false;
  }
}

/**
 * Unsubscribe from creator
 */
export async function unsubscribeFromCreator(
  subscriberId: string,
  creatorId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("subscriber_id", subscriberId)
      .eq("creator_id", creatorId)
      .eq("status", "active");

    if (error) throw error;

    toast.success("Abonnement annulé");
    return true;
  } catch (error) {
    subscriptionServiceLogger.error("Error unsubscribing:", error);
    toast.error("Erreur lors de l'annulation");
    return false;
  }
}

/**
 * Get creator revenue summary
 */
export async function getCreatorRevenue(
  creatorId: string,
): Promise<RevenueSummary> {
  try {
    // Get user stats
    const { data: userData } = await supabase
      .from("user_profiles")
      .select("total_earnings, pending_earnings, total_subscribers")
      .eq("id", creatorId)
      .single();

    // Get MRR
    const { data: mrr } = await supabase.rpc("get_creator_mrr", {
      p_creator_id: creatorId,
    });

    // Get this month's revenue
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );

    const { data: thisMonthEarnings } = await supabase
      .from("creator_earnings")
      .select("creator_net")
      .eq("creator_id", creatorId)
      .gte("created_at", firstDayThisMonth.toISOString());

    const { data: lastMonthEarnings } = await supabase
      .from("creator_earnings")
      .select("creator_net")
      .eq("creator_id", creatorId)
      .gte("created_at", firstDayLastMonth.toISOString())
      .lt("created_at", firstDayThisMonth.toISOString());

    const thisMonthTotal =
      thisMonthEarnings?.reduce(
        (sum: number, e: any) => sum + parseFloat(e.creator_net),
        0,
      ) || 0;
    const lastMonthTotal =
      lastMonthEarnings?.reduce(
        (sum: number, e: any) => sum + parseFloat(e.creator_net),
        0,
      ) || 0;

    return {
      total_earnings: userData?.total_earnings || 0,
      pending_earnings: userData?.pending_earnings || 0,
      total_subscribers: userData?.total_subscribers || 0,
      monthly_recurring_revenue: mrr || 0,
      this_month_revenue: thisMonthTotal,
      last_month_revenue: lastMonthTotal,
    };
  } catch (error) {
    subscriptionServiceLogger.error("Error fetching revenue:", error);
    return {
      total_earnings: 0,
      pending_earnings: 0,
      total_subscribers: 0,
      monthly_recurring_revenue: 0,
      this_month_revenue: 0,
      last_month_revenue: 0,
    };
  }
}

/**
 * Get creator earnings history
 */
export async function getCreatorEarnings(
  creatorId: string,
  limit = 50,
): Promise<CreatorEarnings[]> {
  try {
    const { data, error } = await supabase
      .from("creator_earnings")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    subscriptionServiceLogger.error("Error fetching earnings:", error);
    return [];
  }
}

/**
 * Request payout
 */
export async function requestPayout(
  creatorId: string,
  amount: number,
): Promise<boolean> {
  try {
    const minimumPayout = 100; // $100 CAD minimum

    if (amount < minimumPayout) {
      toast.error(`Montant minimum: ${minimumPayout}$ CAD`);
      return false;
    }

    // Check pending earnings
    const { data: userData } = await supabase
      .from("user_profiles")
      .select("pending_earnings, payout_email")
      .eq("id", creatorId)
      .single();

    if (!userData || (userData.pending_earnings || 0) < amount) {
      toast.error("Fonds insuffisants");
      return false;
    }

    if (!userData.payout_email) {
      toast.error("Configure ton email de paiement dans les paramètres");
      return false;
    }

    // Create payout request
    const { error } = await supabase.from("creator_payouts").insert({
      creator_id: creatorId,
      amount,
      currency: "CAD",
      payout_method: "stripe",
      payout_destination: userData.payout_email,
      status: "pending",
    });

    if (error) throw error;

    // Update pending earnings
    await supabase
      .from("user_profiles")
      .update({
        pending_earnings: (userData.pending_earnings || 0) - amount,
      })
      .eq("id", creatorId);

    toast.success(`Demande de paiement de ${amount}$ CAD envoyée!`);
    return true;
  } catch (error) {
    subscriptionServiceLogger.error("Error requesting payout:", error);
    toast.error("Erreur lors de la demande");
    return false;
  }
}

/**
 * Mark post as exclusive
 */
export async function markPostExclusive(
  postId: string,
  creatorId: string,
  minTierId?: string,
  previewText?: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("exclusive_content").insert({
      post_id: postId,
      creator_id: creatorId,
      min_tier_id: minTierId,
      is_exclusive: true,
      preview_text: previewText,
    });

    if (error) throw error;
    toast.success("Post marqué comme exclusif!");
    return true;
  } catch (error) {
    subscriptionServiceLogger.error("Error marking exclusive:", error);
    toast.error("Erreur");
    return false;
  }
}

/**
 * Check if user can view exclusive content
 */
export async function canViewExclusiveContent(
  userId: string,
  postId: string,
): Promise<boolean> {
  try {
    // Get exclusive content info
    const { data: exclusive } = await supabase
      .from("exclusive_content")
      .select("creator_id")
      .eq("post_id", postId)
      .single();

    if (!exclusive) return true; // Not exclusive

    // Check if user is creator
    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (post?.user_id === userId) return true; // Creator can view own content

    // Check subscription
    return await isSubscribedTo(userId, exclusive.creator_id);
  } catch (error) {
    subscriptionServiceLogger.error("Error checking exclusive access:", error);
    return false;
  }
}

export default {
  getCreatorTiers,
  createSubscriptionTier,
  isSubscribedTo,
  getUserSubscriptions,
  getCreatorSubscribers,
  subscribeToCreator,
  unsubscribeFromCreator,
  getCreatorRevenue,
  getCreatorEarnings,
  requestPayout,
  markPostExclusive,
  canViewExclusiveContent,
};
