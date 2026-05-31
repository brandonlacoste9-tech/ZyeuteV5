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
  newBalance: number;
  creatorEarned: number;
}

// Get pack + gift catalog
export async function getCenneCatalog(): Promise<CenneCatalog> {
  const { data, error } = await apiCall<CenneCatalog>("/cennes/catalog");
  if (error || !data) throw new Error(error || "Erreur catalogue");
  return data;
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
): Promise<GiftResult> {
  const { data, error } = await apiCall<GiftResult>("/cennes/gift", {
    method: "POST",
    body: JSON.stringify({ recipientId, giftId, postId }),
  });
  if (error || !data) {
    throw new Error(error || "Erreur lors du cadeau");
  }
  return data;
}
