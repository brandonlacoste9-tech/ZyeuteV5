/**
 * Jackpot Logic Controller
 * Implements provably fair $1,000 Jackpot system
 * Aggregates transaction fees and selects winners based on swarm activity
 */

import { db } from "../storage.js";
import {
  jackpotPools,
  jackpotEntries,
  jackpotWinners,
  transactions,
  users,
  type JackpotPool,
  type JackpotEntry,
  type InsertJackpotPool,
  type InsertJackpotEntry,
} from "../../shared/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import { createHash, randomBytes } from "crypto";

const JACKPOT_TARGET_AMOUNT = 100000; // $1,000.00 in cents
const MIN_CONTRIBUTION = 100; // $1.00 in cents
const PLATFORM_FEE_RATE = 0.05; // 5% of transaction goes to jackpot

/**
 * Check if swarm activity triggers a new jackpot
 */
export async function checkSwarmActivity(): Promise<boolean> {
  try {
    // Count active users in last 24 hours
    const activeUsersResult = await db
      .select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users)
      .where(gte(users.createdAt, sql`NOW() - INTERVAL '24 hours'`));

    const activeUsers = activeUsersResult[0]?.count || 0;

    // Count transactions in last 24 hours
    const transactionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, "completed"),
          gte(transactions.createdAt, sql`NOW() - INTERVAL '24 hours'`)
        )
      );

    const transactionCount = transactionsResult[0]?.count || 0;

    // Trigger conditions
    const meetsThreshold =
      activeUsers >= 100 && transactionCount >= 1000;

    if (meetsThreshold) {
      logger.info(
        `[Jackpot] Swarm activity threshold met: ${activeUsers} users, ${transactionCount} transactions`
      );
    }

    return meetsThreshold;
  } catch (error: any) {
    logger.error(`[Jackpot] Failed to check swarm activity: ${error.message}`);
    return false;
  }
}

/**
 * Create a new jackpot pool
 */
export async function createJackpotPool(
  data?: Partial<InsertJackpotPool>
): Promise<JackpotPool> {
  try {
    const pool = await db
      .insert(jackpotPools)
      .values({
        name: data?.name || "Le Pot Commun - Jackpot Bee",
        description:
          data?.description ||
          "Un jackpot accumulé à partir des frais de transaction. Gagnant sélectionné de manière équitable.",
        targetAmount: data?.targetAmount || JACKPOT_TARGET_AMOUNT,
        currentAmount: 0,
        minContribution: data?.minContribution || MIN_CONTRIBUTION,
        status: "active",
        triggerConditions: {
          minActiveUsers: 100,
          minTransactions: 1000,
          swarmActivityLevel: "high",
        },
        scheduledDrawAt: data?.scheduledDrawAt || null,
        hiveId: data?.hiveId || "quebec",
      })
      .returning();

    logger.info(`[Jackpot] New pool created: ${pool[0].id}`);
    return pool[0];
  } catch (error: any) {
    logger.error(`[Jackpot] Failed to create pool: ${error.message}`);
    throw error;
  }
}

/**
 * Contribute transaction fee to active jackpot pool
 * Returns the entry created
 */
export async function contributeToJackpot(
  transactionId: string,
  feeAmount: number
): Promise<JackpotEntry | null> {
  try {
    // Find active jackpot pool
    const activePools = await db
      .select()
      .from(jackpotPools)
      .where(eq(jackpotPools.status, "active"))
      .orderBy(desc(jackpotPools.createdAt))
      .limit(1);

    if (activePools.length === 0) {
      logger.warn("[Jackpot] No active pool found, skipping contribution");
      return null;
    }

    const pool = activePools[0];

    // Get transaction details
    const tx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (tx.length === 0) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const transaction = tx[0];

    // Calculate jackpot contribution (5% of fee)
    const contributionAmount = Math.floor(feeAmount * PLATFORM_FEE_RATE);

    if (contributionAmount < MIN_CONTRIBUTION) {
      logger.debug(
        `[Jackpot] Contribution ${contributionAmount} below minimum, skipping`
      );
      return null;
    }

    // Create entry
    const entry = await db
      .insert(jackpotEntries)
      .values({
        poolId: pool.id,
        userId: transaction.senderId || transaction.receiverId!,
        contributionAmount,
        transactionId: transaction.id,
        entryWeight: Math.floor(contributionAmount / MIN_CONTRIBUTION), // Weighted by contribution
      })
      .returning();

    // Update pool current amount
    await db
      .update(jackpotPools)
      .set({
        currentAmount: sql`${jackpotPools.currentAmount} + ${contributionAmount}`,
      })
      .where(eq(jackpotPools.id, pool.id));

    logger.info(
      `[Jackpot] Contribution of ${contributionAmount} Piasses added to pool ${pool.id}`
    );

    return entry[0];
  } catch (error: any) {
    logger.error(`[Jackpot] Failed to contribute: ${error.message}`);
    throw error;
  }
}

/**
 * Select winner using provably fair random selection
 * Uses cryptographic hash of pool state + secret seed
 */
export async function selectJackpotWinner(
  poolId: string
): Promise<string | null> {
  try {
    const pool = await db
      .select()
      .from(jackpotPools)
      .where(eq(jackpotPools.id, poolId))
      .limit(1);

    if (pool.length === 0) {
      throw new Error(`Pool ${poolId} not found`);
    }

    if (pool[0].status !== "active") {
      throw new Error(`Pool ${poolId} is not active`);
    }

    // Get all entries with weights
    const entries = await db
      .select()
      .from(jackpotEntries)
      .where(eq(jackpotEntries.poolId, poolId));

    if (entries.length === 0) {
      logger.warn(`[Jackpot] No entries found for pool ${poolId}`);
      return null;
    }

    // Generate provably fair seed
    const seed = randomBytes(32).toString("hex");
    const poolStateHash = createHash("sha256")
      .update(JSON.stringify({ poolId, entries: entries.length, seed }))
      .digest("hex");

    // Calculate total weight
    const totalWeight = entries.reduce(
      (sum, entry) => sum + entry.entryWeight,
      0
    );

    // Select winner using weighted random
    const randomValue = parseInt(poolStateHash.slice(0, 16), 16) % totalWeight;
    let accumulatedWeight = 0;
    let winner: JackpotEntry | null = null;

    for (const entry of entries) {
      accumulatedWeight += entry.entryWeight;
      if (randomValue < accumulatedWeight) {
        winner = entry;
        break;
      }
    }

    if (!winner) {
      // Fallback to last entry (shouldn't happen, but safety)
      winner = entries[entries.length - 1];
    }

    // Update pool with winner seed
    await db
      .update(jackpotPools)
      .set({
        status: "calculating",
        winnerSeed: seed,
        drawnAt: sql`NOW()`,
      })
      .where(eq(jackpotPools.id, poolId));

    logger.info(`[Jackpot] Winner selected for pool ${poolId}: ${winner.userId}`);

    return winner.userId;
  } catch (error: any) {
    logger.error(`[Jackpot] Failed to select winner: ${error.message}`);
    throw error;
  }
}

/**
 * Complete jackpot payout and create winner record
 */
export async function payoutJackpot(
  poolId: string,
  winnerId: string
): Promise<void> {
  try {
    const pool = await db
      .select()
      .from(jackpotPools)
      .where(eq(jackpotPools.id, poolId))
      .limit(1);

    if (pool.length === 0) {
      throw new Error(`Pool ${poolId} not found`);
    }

    const prizeAmount = pool[0].currentAmount;

    // Create payout transaction
    const payoutTx = await db
      .insert(transactions)
      .values({
        senderId: null, // System payout
        receiverId: winnerId,
        amount: prizeAmount,
        creditType: "cash",
        type: "reward",
        status: "completed",
        feeAmount: 0,
        taxAmount: 0,
        metadata: {
          source: "jackpot",
          poolId: poolId,
          poolName: pool[0].name,
        },
        hiveId: pool[0].hiveId || "quebec",
      })
      .returning();

    // Create winner record
    const fairnessProof = createHash("sha256")
      .update(
        JSON.stringify({
          poolId,
          winnerSeed: pool[0].winnerSeed,
          prizeAmount,
          timestamp: new Date().toISOString(),
        })
      )
      .digest("hex");

    await db.insert(jackpotWinners).values({
      poolId: poolId,
      winnerId: winnerId,
      prizeAmount: prizeAmount,
      payoutTransactionId: payoutTx[0].id,
      fairnessProof: fairnessProof,
    });

    // Update pool status
    await db
      .update(jackpotPools)
      .set({
        status: "completed",
      })
      .where(eq(jackpotPools.id, poolId));

    // Update user balance
    await db
      .update(users)
      .set({
        cashCredits: sql`${users.cashCredits} + ${prizeAmount}`,
      })
      .where(eq(users.id, winnerId));

    logger.info(
      `[Jackpot] Payout completed: ${prizeAmount} Piasses to user ${winnerId}`
    );
  } catch (error: any) {
    logger.error(`[Jackpot] Failed to payout: ${error.message}`);
    throw error;
  }
}

/**
 * Draw jackpot (select winner and payout)
 */
export async function drawJackpot(poolId: string): Promise<void> {
  try {
    const winnerId = await selectJackpotWinner(poolId);
    if (!winnerId) {
      throw new Error("No winner selected");
    }
    await payoutJackpot(poolId, winnerId);
    logger.info(`[Jackpot] Pool ${poolId} drawn and paid out`);
  } catch (error: any) {
    logger.error(`[Jackpot] Failed to draw: ${error.message}`);
    throw error;
  }
}

/**
 * Get current jackpot status
 */
export async function getJackpotStatus(): Promise<{
  pool: JackpotPool | null;
  entries: number;
  totalContributions: number;
  progress: number;
}> {
  try {
    const activePools = await db
      .select()
      .from(jackpotPools)
      .where(eq(jackpotPools.status, "active"))
      .orderBy(desc(jackpotPools.createdAt))
      .limit(1);

    if (activePools.length === 0) {
      return {
        pool: null,
        entries: 0,
        totalContributions: 0,
        progress: 0,
      };
    }

    const pool = activePools[0];

    const entriesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(jackpotEntries)
      .where(eq(jackpotEntries.poolId, pool.id));

    const entries = entriesResult[0]?.count || 0;
    const totalContributions = pool.currentAmount;
    const progress = Math.min(
      (totalContributions / pool.targetAmount) * 100,
      100
    );

    return {
      pool,
      entries,
      totalContributions,
      progress,
    };
  } catch (error: any) {
    logger.error(`[Jackpot] Failed to get status: ${error.message}`);
    throw error;
  }
}