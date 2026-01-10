/**
 * P2P Bee Trading Service
 * Implements the "Hive Exchange" marketplace for trading specialized Bee agents
 */

import { db } from "../storage.js";
import {
  beeMarketplace,
  beeListings,
  beeTrades,
  transactions,
  users,
  type InsertBeeMarketplace,
  type InsertBeeListing,
  type BeeMarketplace,
  type BeeListing,
  type BeeTrade,
} from "../../shared/schema";
import { eq, and, sql, desc, ne, or } from "drizzle-orm";
import { logger } from "../utils/logger.js";

const PLATFORM_FEE_RATE = 0.10; // 10% platform fee on trades

/**
 * List a Bee on the marketplace
 */
export async function listBeeOnMarketplace(
  data: InsertBeeMarketplace
): Promise<BeeMarketplace> {
  try {
    // Create marketplace entry
    const marketplace = await db
      .insert(beeMarketplace)
      .values({
        beeName: data.beeName,
        beeType: data.beeType,
        ownerId: data.ownerId,
        beeMetadata: data.beeMetadata || {
          aestheticScore: 0,
          videoCount: 0,
          successRate: 0,
          specializations: [],
        },
        price: data.price,
        status: "active",
        hiveId: data.hiveId || "quebec",
      })
      .returning();

    logger.info(
      `[Bee Trading] Bee listed on marketplace: ${marketplace[0].id} by user ${data.ownerId}`
    );

    return marketplace[0];
  } catch (error: any) {
    logger.error(`[Bee Trading] Failed to list bee: ${error.message}`);
    throw error;
  }
}

/**
 * Create a listing (sale offer) for a bee
 */
export async function createBeeListing(
  marketplaceId: string,
  sellerId: string,
  listingPrice: number,
  description?: string,
  expiresAt?: Date
): Promise<BeeListing> {
  try {
    // Verify marketplace entry exists and is owned by seller
    const marketplace = await db
      .select()
      .from(beeMarketplace)
      .where(
        and(
          eq(beeMarketplace.id, marketplaceId),
          eq(beeMarketplace.ownerId, sellerId),
          eq(beeMarketplace.status, "active")
        )
      )
      .limit(1);

    if (marketplace.length === 0) {
      throw new Error(
        "Marketplace entry not found or not owned by seller, or already sold"
      );
    }

    // Create listing
    const listing = await db
      .insert(beeListings)
      .values({
        marketplaceId: marketplaceId,
        sellerId: sellerId,
        listingPrice: listingPrice,
        description: description || null,
        status: "active",
        expiresAt: expiresAt || null,
      })
      .returning();

    logger.info(
      `[Bee Trading] Listing created: ${listing[0].id} for bee ${marketplaceId}`
    );

    return listing[0];
  } catch (error: any) {
    logger.error(`[Bee Trading] Failed to create listing: ${error.message}`);
    throw error;
  }
}

/**
 * Purchase a bee from a listing
 */
export async function purchaseBee(
  listingId: string,
  buyerId: string
): Promise<BeeTrade> {
  try {
    // Get listing with marketplace details
    const listingResult = await db
      .select({
        listing: beeListings,
        marketplace: beeMarketplace,
      })
      .from(beeListings)
      .innerJoin(
        beeMarketplace,
        eq(beeListings.marketplaceId, beeMarketplace.id)
      )
      .where(
        and(
          eq(beeListings.id, listingId),
          eq(beeListings.status, "active"),
          ne(beeListings.sellerId, buyerId) // Can't buy from yourself
        )
      )
      .limit(1);

    if (listingResult.length === 0) {
      throw new Error("Listing not found, inactive, or buyer is the seller");
    }

    const { listing, marketplace } = listingResult[0];

    // Check if listing expired
    if (listing.expiresAt && new Date(listing.expiresAt) < new Date()) {
      throw new Error("Listing has expired");
    }

    // Verify buyer has sufficient balance
    const buyer = await db
      .select()
      .from(users)
      .where(eq(users.id, buyerId))
      .limit(1);

    if (buyer.length === 0) {
      throw new Error("Buyer not found");
    }

    const buyerBalance = buyer[0].cashCredits || 0;

    if (buyerBalance < listing.listingPrice) {
      throw new Error("Insufficient balance");
    }

    // Calculate platform fee
    const platformFee = Math.floor(listing.listingPrice * PLATFORM_FEE_RATE);
    const sellerPayout = listing.listingPrice - platformFee;

    // Start transaction
    await db.transaction(async (tx) => {
      // Deduct from buyer
      await tx
        .update(users)
        .set({
          cashCredits: sql`${users.cashCredits} - ${listing.listingPrice}`,
        })
        .where(eq(users.id, buyerId));

      // Credit seller (after platform fee)
      await tx
        .update(users)
        .set({
          cashCredits: sql`${users.cashCredits} + ${sellerPayout}`,
        })
        .where(eq(users.id, listing.sellerId));

      // Create transaction record
      const tradeTransaction = await tx
        .insert(transactions)
        .values({
          senderId: buyerId,
          receiverId: listing.sellerId,
          amount: sellerPayout,
          creditType: "cash",
          type: "purchase",
          status: "completed",
          feeAmount: platformFee,
          taxAmount: 0,
          metadata: {
            type: "bee_trade",
            listingId: listing.id,
            marketplaceId: marketplace.id,
            beeType: marketplace.beeType,
            beeName: marketplace.beeName,
          },
          hiveId: marketplace.hiveId || "quebec",
        })
        .returning();

      // Create trade record
      const trade = await tx
        .insert(beeTrades)
        .values({
          listingId: listing.id,
          sellerId: listing.sellerId,
          buyerId: buyerId,
          marketplaceId: marketplace.id,
          tradeAmount: listing.listingPrice,
          platformFee: platformFee,
          transactionId: tradeTransaction[0].id,
        })
        .returning();

      // Transfer ownership
      await tx
        .update(beeMarketplace)
        .set({
          ownerId: buyerId,
          status: "sold",
          soldAt: sql`NOW()`,
        })
        .where(eq(beeMarketplace.id, marketplace.id));

      // Close listing
      await tx
        .update(beeListings)
        .set({
          status: "sold",
        })
        .where(eq(beeListings.id, listing.id));

      logger.info(
        `[Bee Trading] Bee ${marketplace.id} sold: ${listing.sellerId} -> ${buyerId} for ${listing.listingPrice} Piasses`
      );

      return trade[0];
    });

    // Fetch and return trade record
    const tradeResult = await db
      .select()
      .from(beeTrades)
      .where(eq(beeTrades.listingId, listingId))
      .limit(1);

    return tradeResult[0];
  } catch (error: any) {
    logger.error(`[Bee Trading] Failed to purchase bee: ${error.message}`);
    throw error;
  }
}

/**
 * Cancel a listing
 */
export async function cancelBeeListing(
  listingId: string,
  userId: string
): Promise<void> {
  try {
    // Verify ownership
    const listing = await db
      .select()
      .from(beeListings)
      .where(
        and(
          eq(beeListings.id, listingId),
          eq(beeListings.sellerId, userId),
          eq(beeListings.status, "active")
        )
      )
      .limit(1);

    if (listing.length === 0) {
      throw new Error("Listing not found or not owned by user");
    }

    // Cancel listing
    await db
      .update(beeListings)
      .set({
        status: "cancelled",
      })
      .where(eq(beeListings.id, listingId));

    logger.info(`[Bee Trading] Listing ${listingId} cancelled by user ${userId}`);
  } catch (error: any) {
    logger.error(`[Bee Trading] Failed to cancel listing: ${error.message}`);
    throw error;
  }
}

/**
 * Get active listings for a bee type
 */
export async function getActiveListings(
  beeType?: string,
  hiveId?: string
): Promise<Array<BeeListing & { marketplace: BeeMarketplace }>> {
  try {
    const conditions = [
      eq(beeListings.status, "active"),
      eq(beeMarketplace.status, "active"),
    ];

    if (beeType) {
      conditions.push(eq(beeMarketplace.beeType, beeType));
    }

    if (hiveId) {
      conditions.push(eq(beeMarketplace.hiveId, hiveId));
    }

    const results = await db
      .select({
        listing: beeListings,
        marketplace: beeMarketplace,
      })
      .from(beeListings)
      .innerJoin(
        beeMarketplace,
        eq(beeListings.marketplaceId, beeMarketplace.id)
      )
      .where(and(...conditions))
      .orderBy(desc(beeListings.createdAt));

    return results.map((r) => ({
      ...r.listing,
      marketplace: r.marketplace,
    })) as Array<BeeListing & { marketplace: BeeMarketplace }>;
  } catch (error: any) {
    logger.error(`[Bee Trading] Failed to get listings: ${error.message}`);
    throw error;
  }
}

/**
 * Get user's owned bees
 */
export async function getUserBees(
  userId: string
): Promise<BeeMarketplace[]> {
  try {
    const bees = await db
      .select()
      .from(beeMarketplace)
      .where(eq(beeMarketplace.ownerId, userId))
      .orderBy(desc(beeMarketplace.createdAt));

    return bees;
  } catch (error: any) {
    logger.error(`[Bee Trading] Failed to get user bees: ${error.message}`);
    throw error;
  }
}

/**
 * Get user's trading history
 */
export async function getUserTradeHistory(
  userId: string
): Promise<BeeTrade[]> {
  try {
    const trades = await db
      .select()
      .from(beeTrades)
      .where(
        or(eq(beeTrades.sellerId, userId), eq(beeTrades.buyerId, userId))
      )
      .orderBy(desc(beeTrades.createdAt));

    return trades;
  } catch (error: any) {
    logger.error(`[Bee Trading] Failed to get trade history: ${error.message}`);
    throw error;
  }
}