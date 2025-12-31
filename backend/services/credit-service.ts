import { storage } from "../storage.js";
import { logger } from "../utils/logger.js";
import { moderateContent } from "../ai/vertex-moderation.js";

const creditLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[CreditService] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[CreditService] ${msg}`, ...args),
};

/**
 * CREDIT SERVICE
 * Manages Piasses (cashCredits) and Karma (karmaCredits).
 * Implements the "Honest Hive" logic and general balance operations.
 */
export class CreditService {
  /**
   * Award Piasses for a post after verifying its safety via Vertex AI.
   */
  async awardPiassesForPost(userId: string, content: string, piasses: number) {
    // Check content safety first
    const modResult = await moderateContent(content);

    if (!modResult.allowed) {
      // Block post and log violation
      await storage.createModerationLog({
        userId,
        action: "block",
        reason: `Vertex AI detected: ${modResult.reasons.join(", ")}`,
        details: content,
        score: modResult.severity === "high" ? 50 : 20,
      });

      throw new Error(`Content blocked: ${modResult.reasons.join(", ")}`);
    }

    // Content is safe, proceed with Piasses award
    return await storage.creditPiasses(userId, piasses);
  }
  /**
   * Refund Piasses to a user and log the event.
   */
  async refundPiasses(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    creditLogger.info(`Refunding ${amount} Piasses to ${userId}: ${reason}`);
    await storage.refundPiasses(userId, amount, reason);
  }

  /**
   * Award Karma to a user.
   */
  async awardKarma(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    creditLogger.info(`Awarding ${amount} Karma to ${userId}: ${reason}`);
    await storage.awardKarma(userId, amount, reason);
  }

  /**
   * Execute a P2P transfer between users.
   */
  async transfer(
    senderId: string,
    receiverId: string,
    amount: number,
  ): Promise<boolean> {
    creditLogger.info(
      `Transferring ${amount} from ${senderId} to ${receiverId}`,
    );
    return await storage.executeTransfer(senderId, receiverId, amount);
  }

  /**
   * Deduct Piasses for a purchase or entry fee.
   */
  async deductPiasses(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<boolean> {
    creditLogger.info(`Deducting ${amount} Piasses from ${userId}: ${reason}`);

    // For deduction, we can reuse the transfer logic with a system account if needed,
    // but a direct decrement is simpler.
    const user = await storage.getUser(userId);
    if (!user || (user.cashCredits || 0) < amount) {
      return false;
    }

    await storage.updateUser(userId, {
      cashCredits: (user.cashCredits || 0) - amount,
    });
    return true;
  }
}

export const creditService = new CreditService();
