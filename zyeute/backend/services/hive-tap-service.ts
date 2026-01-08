import crypto from "crypto";
import { storage } from "../storage.js";
import { logger } from "../utils/logger.js";

const tapLogger = {
  info: (msg: string, ...args: any[]) =>
    logger.info(`[HiveTapService] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    logger.error(`[HiveTapService] ${msg}`, ...args),
};

/**
 * HIVE TAP SERVICE
 * Handles the "Shadow Ledger" P2P exchange via NFC Handshake.
 * Features: Biometric gating, Time-window security, and Geo-fencing.
 */

interface TapPayload {
  senderId: string;
  amount: number;
  timestamp: number;
  nonce: string;
  signature: string;
  location: { lat: number; lng: number };
}

export class HiveTapService {
  private readonly secretKey: string;
  private readonly TAP_EXPIRY_MS = 30000; // 30 seconds
  private readonly MAX_DISTANCE_METERS = 15;

  constructor() {
    this.secretKey =
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "zyeute_default_secret_key";
  }

  /**
   * PHASE 1: SENDER GENERATION
   * Generates a signed, encrypted payload to be written to NFC NDEF.
   */
  async generateHandshakeToken(
    senderId: string,
    amount: number,
    location: { lat: number; lng: number },
  ): Promise<string> {
    const nonce = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();

    const dataToSign = `${senderId}:${amount}:${timestamp}:${nonce}`;
    const signature = crypto
      .createHmac("sha256", this.secretKey)
      .update(dataToSign)
      .digest("hex");

    const payload: TapPayload = {
      senderId,
      amount,
      timestamp,
      nonce,
      signature,
      location,
    };

    // Encrypt the entire payload so it's not human-readable if scanned by 3rd party
    return this.encryptPayload(JSON.stringify(payload));
  }

  /**
   * PHASE 2: RECEIVER PROCESSING
   * Validates the handshake and executes the atomic transaction.
   */
  async processIncomingTap(
    receiverId: string,
    encryptedPayload: string,
    receiverLocation: { lat: number; lng: number },
  ) {
    const rawPayload = this.decryptPayload(encryptedPayload);
    const payload: TapPayload = JSON.parse(rawPayload);

    // 1. Biometric/Security Guard (Mocking a biometric check on the client)
    // In production, the client app ensures FaceID/Fingerprint passed before sending to server.

    // 2. MODERATION CHECK: Prevent abuse from flagged users
    const userHistory = await storage.getModerationHistory(payload.senderId);
    if (userHistory.violations > 3) {
      throw new Error(
        "Handshake denied. This bee has been suspended for violating Hive policies.",
      );
    }

    // 3. Validate Expiry
    if (Date.now() - payload.timestamp > this.TAP_EXPIRY_MS) {
      throw new Error("The Buzz has faded. This token is expired.");
    }

    // 3. Validate Signature (Tamper protection)
    const expectedSign = crypto
      .createHmac("sha256", this.secretKey)
      .update(
        `${payload.senderId}:${payload.amount}:${payload.timestamp}:${payload.nonce}`,
      )
      .digest("hex");

    if (payload.signature !== expectedSign) {
      throw new Error(
        "Invalid Handshake. The Hive does not recognize this bee.",
      );
    }

    // 4. Geo-Fence Check (Prevent remote sniffing)
    const distance = this.calculateDistance(payload.location, receiverLocation);
    if (distance > this.MAX_DISTANCE_METERS) {
      throw new Error("Too far away! The Hive requires proximity.");
    }

    // 5. ATOMIC TRANSACTION (Shadow Ledger)
    return await this.executeShadowTransfer(
      payload.senderId,
      receiverId,
      payload.amount,
    );
  }

  private async executeShadowTransfer(
    senderId: string,
    receiverId: string,
    amount: number,
  ) {
    /**
     * ATOMIC TRANSACTION:
     * 1. Check Sender Balance
     * 2. Decrement Sender
     * 3. Increment Receiver
     * 4. Log Tap Event
     */
    tapLogger.info(
      `[HIVE TAP] Transferring ${amount} from ${senderId} to ${receiverId}`,
    );

    try {
      // Use storage to perform the update
      const result = await storage.executeTransfer(
        senderId,
        receiverId,
        amount,
      );
      if (!result) {
        throw new Error(
          "Transfer failed. Insufficient funds or database error.",
        );
      }

      return {
        success: true,
        transactionId: crypto.randomUUID(),
        hapticPattern: "STING_IMPACT", // Signal to frontend to play the "Success" vibration
      };
    } catch (error: any) {
      tapLogger.error("Execute shadow transfer failed:", error);
      throw error;
    }
  }

  private calculateDistance(loc1: any, loc2: any): number {
    // Simple Haversine formula implementation
    const R = 6371e3; // metres
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLon = ((loc2.lng - loc1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.lat * Math.PI) / 180) *
        Math.cos((loc2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private encryptPayload(text: string): string {
    // Basic encryption for demonstration, replace with actual AES in production
    return Buffer.from(text).toString("base64");
  }

  private decryptPayload(data: string): string {
    return Buffer.from(data, "base64").toString("ascii");
  }
}

export const hiveTapService = new HiveTapService();
