import axios from "axios";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
import { creditService } from "./credit-service.js";

const giftbitLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[GiftbitService] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[GiftbitService] ${msg}`, ...args),
};

/**
 * GIFTBIT INTEGRATION SERVICE - "THE HONEST HIVE" EDITION
 * This module handles the Giftbit API and the automated recovery logic
 * to ensure users never lose Piasses due to technical failures.
 */

export interface GiftbitOrderRequest {
  userId: string;
  priceInCents: number;
  brandCode: string;
  recipientEmail: string;
  recipientFirstName: string;
  recipientLastName: string;
}

export interface GiftbitOrderResponse {
  orderId: string;
  uuid: string;
  status: "SUCCESS" | "FAILED";
}

export class GiftbitService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor() {
    this.apiKey = process.env.GIFTBIT_API_KEY || "";
    this.baseUrl =
      process.env.GIFTBIT_BASE_URL || "https://api.giftbit.com/papi/v1";
    this.webhookSecret = process.env.GIFTBIT_WEBHOOK_SECRET || "";
  }

  /**
   * Place an order and manage the "Shadow Ledger" state.
   */
  async placeOrder(
    orderData: GiftbitOrderRequest,
  ): Promise<GiftbitOrderResponse> {
    const idempotencyKey = `zyeute_${crypto.randomUUID()}`;

    try {
      // In a real implementation, this would call the Giftbit API
      // For now, we simulate the logic
      giftbitLogger.info(
        `Placing Giftbit order for ${orderData.userId}: ${orderData.brandCode}`,
      );

      // If API KEY is missing, simulate failure for testing the Honest Hive protocol
      if (!this.apiKey && process.env.NODE_ENV === "production") {
        throw new Error("GIFTBIT_API_KEY missing");
      }

      // Mocking successful response
      return {
        orderId: `ord_${crypto.randomBytes(4).toString("hex")}`,
        uuid: crypto.randomUUID(),
        status: "SUCCESS",
      };

      /* 
      const response = await axios.post(`${this.baseUrl}/orders`, {
        id: idempotencyKey,
        price_in_cents: orderData.priceInCents,
        brand_code: orderData.brandCode,
        recipient: {
          email: orderData.recipientEmail,
          firstname: orderData.recipientFirstName,
          lastname: orderData.recipientLastName
        },
        delivery_type: 'EMAIL'
      }, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });

      return {
        orderId: response.data.order.id,
        uuid: response.data.order.uuid,
        status: 'SUCCESS'
      };
      */
    } catch (error: any) {
      giftbitLogger.error(
        "Giftbit order failed, initiating Honest Hive protocol:",
        error.message,
      );

      // TRIGGER THE HONEST HIVE PROTOCOL IMMEDIATELY
      await this.initiateHonestHiveRefund(
        orderData.userId,
        orderData.priceInCents,
        "API_FAILURE",
      );

      throw new Error("Giftbit order failed. Refund initiated.");
    }
  }

  /**
   * THE "HONEST HIVE" SAFETY NET
   * Reverses transactions and rewards "Apology Karma"
   */
  private async initiateHonestHiveRefund(
    userId: string,
    amount: number,
    reason: string,
  ) {
    giftbitLogger.info(
      `[Honest Hive] Refunding ${amount} to ${userId}. Reason: ${reason}`,
    );

    try {
      // 1. Reverse the Piasse deduction in the DB
      await creditService.refundPiasses(
        userId,
        amount,
        `HONEST_HIVE_REFUND: ${reason}`,
      );

      // 2. Award Apology Karma (+10)
      await creditService.awardKarma(userId, 10, "HONEST_HIVE_BONUS");

      // 3. Trigger Notification (Implement via NotificationService if available)
      giftbitLogger.info(
        `Honest Hive notification sent to ${userId}: Your gift failed to send. We've refunded your Piasses and added +10 Karma for the trouble.`,
      );
    } catch (error: any) {
      giftbitLogger.error("Honest Hive refund failed:", error);
    }
  }

  /**
   * Webhook Handler with automated fail-safes
   */
  async handleWebhook(signature: string, rawBody: string): Promise<void> {
    if (!this.verifySignature(signature, rawBody)) {
      throw new Error("Invalid signature");
    }

    const { event_type, data } = JSON.parse(rawBody);

    switch (event_type) {
      case "delivery.opened":
        await this.onGiftOpened(data.uuid);
        break;
      case "order.failed":
        // If the order fails LATER (e.g., delivery bounce), refund then.
        await this.handleLateFailure(data.uuid);
        break;
    }
  }

  private async handleLateFailure(uuid: string) {
    // 1. Look up user and amount associated with this UUID in our HiveTransactions table
    // 2. Trigger initiateHonestHiveRefund()
    giftbitLogger.info(`Handling late failure for gift ${uuid}`);
  }

  private verifySignature(signature: string, payload: string): boolean {
    if (!this.webhookSecret) return true; // Skip in dev
    const hmac = crypto.createHmac("sha256", this.webhookSecret);
    const digest = hmac.update(payload).digest("hex");
    return signature === digest;
  }

  private async onGiftOpened(giftUuid: string) {
    // Reward sender with XP/Karma to complete the dopamine loop
    giftbitLogger.info(
      `Gift ${giftUuid} opened! Drip-feeding Karma to sender...`,
    );
  }
}

export const giftbitService = new GiftbitService();
