/**
 * Piasse Wallet Service
 * Manages wallet creation, encryption, and balance operations
 */

import { db } from "../storage.js";
import {
  piasseWallets,
  users,
  type InsertPiasseWallet,
  type PiasseWallet,
} from "../../shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger.js";
import {
  encryptWalletKey,
  decryptWalletKey,
  generateWalletKeypair,
  formatEncryptionMetadata,
} from "./piasse-wallet-encryption.js";

/**
 * Create a new Piasse wallet for a user
 */
export async function createPiasseWallet(
  userId: string
): Promise<PiasseWallet> {
  try {
    // Check if wallet already exists
    const existing = await db
      .select()
      .from(piasseWallets)
      .where(eq(piasseWallets.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Wallet already exists for this user");
    }

    // Generate keypair
    const { privateKey, publicAddress } = generateWalletKeypair();

    // Encrypt private key
    const { encryptedData, iv, salt, authTag } = encryptWalletKey(privateKey);

    // Create wallet record
    const wallet = await db
      .insert(piasseWallets)
      .values({
        userId: userId,
        encryptedPrivateKey: encryptedData,
        publicAddress: publicAddress,
        balance: 0,
        encryptionMetadata: formatEncryptionMetadata(iv, salt, authTag),
        isGhostShellEnabled: true,
      })
      .returning();

    logger.info(`[Piasse Wallet] Wallet created for user ${userId}: ${publicAddress}`);

    return wallet[0];
  } catch (error: any) {
    logger.error(`[Piasse Wallet] Failed to create wallet: ${error.message}`);
    throw error;
  }
}

/**
 * Get wallet for a user (without decrypted private key)
 */
export async function getUserWallet(
  userId: string
): Promise<PiasseWallet | null> {
  try {
    const wallets = await db
      .select()
      .from(piasseWallets)
      .where(eq(piasseWallets.userId, userId))
      .limit(1);

    return wallets.length > 0 ? wallets[0] : null;
  } catch (error: any) {
    logger.error(`[Piasse Wallet] Failed to get wallet: ${error.message}`);
    throw error;
  }
}

/**
 * Get decrypted private key (for signing transactions)
 * WARNING: Only use in secure contexts (e.g., transaction signing endpoint)
 */
export async function getDecryptedPrivateKey(
  userId: string
): Promise<string> {
  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const metadata = wallet.encryptionMetadata as {
      iv: string;
      salt: string;
      authTag: string;
    };

    const privateKey = decryptWalletKey(
      wallet.encryptedPrivateKey,
      metadata.iv,
      metadata.salt,
      metadata.authTag
    );

    logger.info(`[Piasse Wallet] Private key decrypted for user ${userId}`);

    return privateKey;
  } catch (error: any) {
    logger.error(
      `[Piasse Wallet] Failed to decrypt private key: ${error.message}`
    );
    throw error;
  }
}

/**
 * Update wallet balance (syncs with transactions table)
 */
export async function syncWalletBalance(userId: string): Promise<number> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      throw new Error("User not found");
    }

    const balance = user[0].cashCredits || 0;

    // Update wallet balance
    await db
      .update(piasseWallets)
      .set({
        balance: balance,
        updatedAt: new Date(),
      })
      .where(eq(piasseWallets.userId, userId));

    return balance;
  } catch (error: any) {
    logger.error(`[Piasse Wallet] Failed to sync balance: ${error.message}`);
    throw error;
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(userId: string): Promise<number> {
  try {
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      // Create wallet if it doesn't exist
      const newWallet = await createPiasseWallet(userId);
      return newWallet.balance;
    }

    // Sync balance from user's cashCredits
    return await syncWalletBalance(userId);
  } catch (error: any) {
    logger.error(`[Piasse Wallet] Failed to get balance: ${error.message}`);
    throw error;
  }
}