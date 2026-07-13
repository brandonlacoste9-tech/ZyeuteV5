/**
 * Cenne Service — virtual currency (cennes) API client
 */

import { apiCall } from "./api";

export interface CennePack {
  id: string;
  name: string;
  cennes: number;
  priceCAD: number;
  priceCents: number;
  emoji: string;
  description: string;
  badge: string | null;
}

export interface GiftItem {
  id: string;
  emoji: string;
  name: string;
  cost: number;
}

export interface CenneCatalog {
  packs: CennePack[];
  gifts: GiftItem[];
}

export interface CenneBalance {
  balance: number;
  balanceDisplay: string;
}

export interface GiftResult {
  success: boolean;
  gift: { id: string; emoji: string; name: string; cost: number };
  giftRecordId?: string | null;
  newBalance: number;
  creatorEarned: number;
  message?: string;
}

// Get pack + gift catalog (public — no auth required)
export async function getCenneCatalog(): Promise<CenneCatalog> {
  const { data, error, code } = await apiCall<CenneCatalog>("/cennes/catalog");
  if (error || !data) {
    throw new Error(error || `Erreur catalogue${code ? ` (${code})` : ""}`);
  }
  // Normalize shapes (API always returns { packs, gifts })
  const gifts = Array.isArray(data.gifts) ? data.gifts : [];
  const packs = Array.isArray(data.packs) ? data.packs : [];
  return { ...data, gifts, packs };
}

// Get current user balance
export async function getCenneBalance(): Promise<CenneBalance> {
  const { data, error } = await apiCall<CenneBalance>("/cennes/balance");
  if (error || !data) throw new Error(error || "Erreur solde");
  return data;
}

// Redirect to Stripe one-time checkout for a pack
export async function buyPack(packId: string): Promise<void> {
  const { data, error } = await apiCall<{ url: string }>("/cennes/buy-pack", {
    method: "POST",
    body: JSON.stringify({ packId }),
  });
  if (error || !data?.url) throw new Error(error || "Erreur paiement");
  window.location.href = data.url;
}

// Send a gift from balance to a creator
export async function sendGift(
  recipientId: string,
  giftId: string,
  postId?: string,
  streamId?: string,
): Promise<GiftResult> {
  // Refresh auth token right before send — mobile often has a stale null cache
  try {
    const { refreshSessionCache } = await import("@/lib/supabase");
    await refreshSessionCache();
  } catch {
    /* ignore */
  }

  const { data, error, code } = await apiCall<GiftResult>("/cennes/gift", {
    method: "POST",
    body: JSON.stringify({ recipientId, giftId, postId, streamId }),
  });

  // One retry after hard session refresh if unauthorized
  if (
    (code === 401 ||
      error?.toLowerCase().includes("autoris") ||
      error?.toLowerCase().includes("unauthorized")) &&
    !data
  ) {
    try {
      const { refreshSessionCache } = await import("@/lib/supabase");
      const sess = await refreshSessionCache();
      if (sess?.access_token) {
        const retry = await apiCall<GiftResult>("/cennes/gift", {
          method: "POST",
          body: JSON.stringify({ recipientId, giftId, postId, streamId }),
        });
        if (retry.data && !retry.error) return retry.data;
        throw new Error(
          retry.error ||
            (retry.code === 401 ? "AUTH_REQUIRED" : "Erreur lors du cadeau"),
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message === "AUTH_REQUIRED") throw e;
    }
    throw new Error("AUTH_REQUIRED");
  }

  if (error || !data) {
    throw new Error(
      code === 401 || error?.toLowerCase().includes("autoris")
        ? "AUTH_REQUIRED"
        : error || "Erreur lors du cadeau",
    );
  }
  return data;
}
