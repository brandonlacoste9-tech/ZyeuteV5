/**
 * Piasse Wallet Encryption Service
 * Implements AES-256-GCM encryption for wallet private keys
 * "Sovereign Shield" - Wallet keys remain encrypted even if server is compromised
 */

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync, createHash } from "crypto";
import { logger } from "../utils/logger.js";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const TAG_LENGTH = 16; // 128 bits
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Get the master encryption key from environment or secret manager
 * In production, this should be retrieved from Google Secret Manager
 */
function getMasterKey(): Buffer {
  const masterKey = process.env.PIASSE_MASTER_KEY || process.env.COLONY_NECTAR;
  
  if (!masterKey) {
    logger.error("[Wallet Encryption] Master key not found in environment");
    throw new Error("Master encryption key not configured. Set PIASSE_MASTER_KEY or COLONY_NECTAR.");
  }

  // Ensure key is exactly 32 bytes (256 bits)
  if (masterKey.length < 32) {
    throw new Error("Master key must be at least 32 characters");
  }

  return Buffer.from(masterKey.slice(0, 32), "utf-8");
}

/**
 * Derive a key from the master key using PBKDF2
 * This adds an extra layer of security by requiring the master key + salt
 */
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Encrypt wallet private key using AES-256-GCM
 * Returns encrypted data, IV, salt, and auth tag
 */
export function encryptWalletKey(privateKey: string): {
  encryptedData: string;
  iv: string;
  salt: string;
  authTag: string;
} {
  try {
    const masterKey = getMasterKey();
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    
    // Derive key from master key + salt
    const derivedKey = deriveKey(masterKey, salt);
    
    // Create cipher
    const cipher = createCipheriv(ALGORITHM, derivedKey, iv);
    
    // Encrypt
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    // Get authentication tag (prevents tampering)
    const authTag = cipher.getAuthTag();
    
    logger.info("[Wallet Encryption] Private key encrypted successfully");
    
    return {
      encryptedData: encrypted,
      iv: iv.toString("hex"),
      salt: salt.toString("hex"),
      authTag: authTag.toString("hex"),
    };
  } catch (error: any) {
    logger.error(`[Wallet Encryption] Encryption failed: ${error.message}`);
    throw new Error(`Failed to encrypt wallet key: ${error.message}`);
  }
}

/**
 * Decrypt wallet private key using AES-256-GCM
 * Requires encrypted data, IV, salt, and auth tag
 */
export function decryptWalletKey(
  encryptedData: string,
  iv: string,
  salt: string,
  authTag: string
): string {
  try {
    const masterKey = getMasterKey();
    const saltBuffer = Buffer.from(salt, "hex");
    const ivBuffer = Buffer.from(iv, "hex");
    const authTagBuffer = Buffer.from(authTag, "hex");
    
    // Derive the same key using master key + salt
    const derivedKey = deriveKey(masterKey, saltBuffer);
    
    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, derivedKey, ivBuffer);
    decipher.setAuthTag(authTagBuffer);
    
    // Decrypt
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    logger.info("[Wallet Encryption] Private key decrypted successfully");
    
    return decrypted;
  } catch (error: any) {
    logger.error(`[Wallet Encryption] Decryption failed: ${error.message}`);
    
    // Don't leak information about why decryption failed
    if (error.message.includes("bad decrypt") || error.message.includes("auth")) {
      throw new Error("Invalid wallet credentials or corrupted encryption data");
    }
    
    throw new Error(`Failed to decrypt wallet key: ${error.message}`);
  }
}

/**
 * Generate a new wallet keypair
 * Returns private key (to be encrypted) and public address (derived from private key)
 */
export function generateWalletKeypair(): {
  privateKey: string;
  publicAddress: string;
} {
  try {
    // Generate a random 256-bit private key
    const privateKeyBytes = randomBytes(32);
    const privateKey = privateKeyBytes.toString("hex");
    
    // Derive public address from private key (simplified - in production, use proper secp256k1)
    // For now, we'll use a hash-based approach
    const hash = createHash("sha256").update(privateKey).digest("hex");
    const publicAddress = `0x${hash.slice(0, 40)}`; // Ethereum-style address format
    
    logger.info("[Wallet Encryption] New wallet keypair generated");
    
    return {
      privateKey,
      publicAddress,
    };
  } catch (error: any) {
    logger.error(`[Wallet Encryption] Keypair generation failed: ${error.message}`);
    throw new Error(`Failed to generate wallet keypair: ${error.message}`);
  }
}

/**
 * Format encryption metadata for database storage
 */
export function formatEncryptionMetadata(
  iv: string,
  salt: string,
  authTag: string
): Record<string, string> {
  return {
    iv,
    salt,
    authTag,
    algorithm: ALGORITHM,
    keyDerivation: "pbkdf2",
    iterations: ITERATIONS.toString(),
    version: "1.0",
  };
}