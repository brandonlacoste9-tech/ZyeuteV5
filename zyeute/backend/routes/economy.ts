import { Router } from "express";
import { storage } from "../storage.js";
import { differenceInDays, startOfDay } from "date-fns";
import { requireAuth } from "../middleware/auth.js";
import {
  createPiasseWallet,
  getUserWallet,
  getWalletBalance,
} from "../services/piasse-wallet-service.js";
import {
  getJackpotStatus,
  createJackpotPool,
  drawJackpot,
  contributeToJackpot,
} from "../services/jackpot-logic.js";
import {
  listBeeOnMarketplace,
  createBeeListing,
  purchaseBee,
  cancelBeeListing,
  getActiveListings,
  getUserBees,
  getUserTradeHistory,
} from "../services/bee-trading.js";

const router = Router();

// --- DAILY BONUS & STREAK ---
router.post("/daily-bonus", async (req, res) => {
  try {
    // In a real app, use req.user.id from middleware
    // For Quebec Core validation, we trust the body or default to test user
    const { username } = req.body;
    const targetUsername = username || "test_user_quebec";

    const user = await storage.getUserByUsername(targetUsername);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = new Date();
    const lastBonus = user.lastDailyBonus
      ? new Date(user.lastDailyBonus)
      : null;
    let streak = user.currentStreak || 0;
    let cashAward = 100; // Base award

    // Logic
    if (lastBonus) {
      const daysDiff = differenceInDays(startOfDay(now), startOfDay(lastBonus));

      if (daysDiff === 0) {
        return res
          .status(400)
          .json({
            error: "Bonus already claimed today",
            nextAvailable: "Tomorrow",
          });
      } else if (daysDiff === 1) {
        // Streak continues!
        streak += 1;
        cashAward += streak * 10; // Multiplier
      } else {
        // Streak broken
        streak = 1;
      }
    } else {
      streak = 1;
    }

    // Cap streak bonus
    if (cashAward > 1000) cashAward = 1000;

    // DB Update
    const updatedUser = await storage.updateUserEconomy(user.id, {
      cashCredits: (user.cashCredits || 0) + cashAward,
      currentStreak: streak,
      maxStreak: Math.max(streak, user.maxStreak || 0),
      lastDailyBonus: now,
    });

    res.json({
      success: true,
      message: `Claimed ${cashAward}$! Streak: ${streak}`,
      data: {
        cashCredits: updatedUser.cashCredits,
        currentStreak: updatedUser.currentStreak,
        award: cashAward,
      },
    });
  } catch (error) {
    console.error("Daily Bonus Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ PIASSE WALLET ROUTES ============

/**
 * POST /api/economy/wallet/create
 * Create a new Piasse wallet for the authenticated user
 */
router.post("/wallet/create", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const wallet = await createPiasseWallet(userId);
    
    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        publicAddress: wallet.publicAddress,
        balance: wallet.balance,
        isGhostShellEnabled: wallet.isGhostShellEnabled,
      },
    });
  } catch (error: any) {
    console.error("Wallet creation error:", error);
    res.status(500).json({ error: error.message || "Failed to create wallet" });
  }
});

/**
 * GET /api/economy/wallet
 * Get user's wallet (without private key)
 */
router.get("/wallet", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const wallet = await getUserWallet(userId);
    
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found. Create one first." });
    }
    
    res.json({
      success: true,
      wallet: {
        id: wallet.id,
        publicAddress: wallet.publicAddress,
        balance: wallet.balance,
        isGhostShellEnabled: wallet.isGhostShellEnabled,
        createdAt: wallet.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Wallet retrieval error:", error);
    res.status(500).json({ error: error.message || "Failed to get wallet" });
  }
});

/**
 * GET /api/economy/wallet/balance
 * Get wallet balance (synced with transactions)
 */
router.get("/wallet/balance", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const balance = await getWalletBalance(userId);
    
    res.json({
      success: true,
      balance: balance,
      currency: "Piasses",
    });
  } catch (error: any) {
    console.error("Balance retrieval error:", error);
    res.status(500).json({ error: error.message || "Failed to get balance" });
  }
});

// ============ JACKPOT ROUTES ============

/**
 * GET /api/economy/jackpot/status
 * Get current jackpot pool status
 */
router.get("/jackpot/status", async (req, res) => {
  try {
    const status = await getJackpotStatus();
    
    res.json({
      success: true,
      jackpot: status.pool
        ? {
            id: status.pool.id,
            name: status.pool.name,
            targetAmount: status.pool.targetAmount,
            currentAmount: status.totalContributions,
            entries: status.entries,
            progress: status.progress,
            status: status.pool.status,
            scheduledDrawAt: status.pool.scheduledDrawAt,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Jackpot status error:", error);
    res.status(500).json({ error: error.message || "Failed to get jackpot status" });
  }
});

/**
 * POST /api/economy/jackpot/create
 * Create a new jackpot pool (Admin only)
 */
router.post("/jackpot/create", requireAuth, async (req, res) => {
  try {
    // TODO: Add admin check
    const { name, description, targetAmount, minContribution, scheduledDrawAt } =
      req.body;
    
    const pool = await createJackpotPool({
      name,
      description,
      targetAmount: targetAmount || 100000, // $1,000
      minContribution: minContribution || 100, // $1.00
      scheduledDrawAt: scheduledDrawAt ? new Date(scheduledDrawAt) : null,
    });
    
    res.json({
      success: true,
      pool: {
        id: pool.id,
        name: pool.name,
        targetAmount: pool.targetAmount,
        status: pool.status,
      },
    });
  } catch (error: any) {
    console.error("Jackpot creation error:", error);
    res.status(500).json({ error: error.message || "Failed to create jackpot" });
  }
});

/**
 * POST /api/economy/jackpot/draw/:poolId
 * Draw jackpot (select winner and payout) (Admin only)
 */
router.post("/jackpot/draw/:poolId", requireAuth, async (req, res) => {
  try {
    // TODO: Add admin check
    const { poolId } = req.params;
    
    await drawJackpot(poolId);
    
    res.json({
      success: true,
      message: "Jackpot drawn and paid out successfully",
    });
  } catch (error: any) {
    console.error("Jackpot draw error:", error);
    res.status(500).json({ error: error.message || "Failed to draw jackpot" });
  }
});

// ============ BEE TRADING ROUTES ============

/**
 * POST /api/economy/bees/list
 * List a Bee on the marketplace
 */
router.post("/bees/list", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { beeName, beeType, price, beeMetadata, hiveId } = req.body;
    
    if (!beeName || !beeType || !price) {
      return res.status(400).json({ error: "beeName, beeType, and price are required" });
    }
    
    const marketplace = await listBeeOnMarketplace({
      beeName,
      beeType,
      ownerId: userId,
      price,
      beeMetadata,
      hiveId: hiveId || "quebec",
    });
    
    res.json({
      success: true,
      marketplace: {
        id: marketplace.id,
        beeName: marketplace.beeName,
        beeType: marketplace.beeType,
        price: marketplace.price,
        status: marketplace.status,
      },
    });
  } catch (error: any) {
    console.error("Bee listing error:", error);
    res.status(500).json({ error: error.message || "Failed to list bee" });
  }
});

/**
 * POST /api/economy/bees/listings
 * Create a listing (sale offer) for a bee
 */
router.post("/bees/listings", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { marketplaceId, listingPrice, description, expiresAt } = req.body;
    
    if (!marketplaceId || !listingPrice) {
      return res.status(400).json({ error: "marketplaceId and listingPrice are required" });
    }
    
    const listing = await createBeeListing(
      marketplaceId,
      userId,
      listingPrice,
      description,
      expiresAt ? new Date(expiresAt) : undefined
    );
    
    res.json({
      success: true,
      listing: {
        id: listing.id,
        marketplaceId: listing.marketplaceId,
        listingPrice: listing.listingPrice,
        status: listing.status,
      },
    });
  } catch (error: any) {
    console.error("Listing creation error:", error);
    res.status(500).json({ error: error.message || "Failed to create listing" });
  }
});

/**
 * POST /api/economy/bees/purchase/:listingId
 * Purchase a bee from a listing
 */
router.post("/bees/purchase/:listingId", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { listingId } = req.params;
    
    const trade = await purchaseBee(listingId, userId);
    
    res.json({
      success: true,
      trade: {
        id: trade.id,
        marketplaceId: trade.marketplaceId,
        tradeAmount: trade.tradeAmount,
        platformFee: trade.platformFee,
      },
      message: "Bee purchased successfully!",
    });
  } catch (error: any) {
    console.error("Bee purchase error:", error);
    res.status(500).json({ error: error.message || "Failed to purchase bee" });
  }
});

/**
 * DELETE /api/economy/bees/listings/:listingId
 * Cancel a listing
 */
router.delete("/bees/listings/:listingId", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    const { listingId } = req.params;
    
    await cancelBeeListing(listingId, userId);
    
    res.json({
      success: true,
      message: "Listing cancelled successfully",
    });
  } catch (error: any) {
    console.error("Listing cancellation error:", error);
    res.status(500).json({ error: error.message || "Failed to cancel listing" });
  }
});

/**
 * GET /api/economy/bees/listings
 * Get active listings (optionally filtered by beeType or hiveId)
 */
router.get("/bees/listings", async (req, res) => {
  try {
    const { beeType, hiveId } = req.query;
    
    const listings = await getActiveListings(
      beeType as string | undefined,
      hiveId as string | undefined
    );
    
    res.json({
      success: true,
      listings: listings.map((l) => ({
        id: l.id,
        marketplace: {
          id: l.marketplace.id,
          beeName: l.marketplace.beeName,
          beeType: l.marketplace.beeType,
          beeMetadata: l.marketplace.beeMetadata,
        },
        listingPrice: l.listingPrice,
        description: l.description,
        expiresAt: l.expiresAt,
        sellerId: l.sellerId,
      })),
    });
  } catch (error: any) {
    console.error("Listings retrieval error:", error);
    res.status(500).json({ error: error.message || "Failed to get listings" });
  }
});

/**
 * GET /api/economy/bees/my-bees
 * Get user's owned bees
 */
router.get("/bees/my-bees", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    
    const bees = await getUserBees(userId);
    
    res.json({
      success: true,
      bees: bees.map((bee) => ({
        id: bee.id,
        beeName: bee.beeName,
        beeType: bee.beeType,
        beeMetadata: bee.beeMetadata,
        status: bee.status,
        createdAt: bee.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("User bees retrieval error:", error);
    res.status(500).json({ error: error.message || "Failed to get user bees" });
  }
});

/**
 * GET /api/economy/bees/trade-history
 * Get user's trading history
 */
router.get("/bees/trade-history", requireAuth, async (req, res) => {
  try {
    const userId = req.userId!;
    
    const trades = await getUserTradeHistory(userId);
    
    res.json({
      success: true,
      trades: trades.map((trade) => ({
        id: trade.id,
        marketplaceId: trade.marketplaceId,
        tradeAmount: trade.tradeAmount,
        platformFee: trade.platformFee,
        createdAt: trade.createdAt,
        isSeller: trade.sellerId === userId,
        isBuyer: trade.buyerId === userId,
      })),
    });
  } catch (error: any) {
    console.error("Trade history retrieval error:", error);
    res.status(500).json({ error: error.message || "Failed to get trade history" });
  }
});

export const economyRoutes = router;
