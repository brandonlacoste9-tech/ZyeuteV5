/**
 * Secret Loader - Loads secrets from Google Secret Manager
 * Used in production (Cloud Run) to load COLONY_NECTAR
 */

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

let secretCache: Map<string, string> = new Map();

/**
 * Load a secret from Google Secret Manager
 * Falls back to environment variables if not in Cloud Run
 */
export async function loadSecret(
  secretName: string,
): Promise<string | undefined> {
  // Check cache first
  if (secretCache.has(secretName)) {
    return secretCache.get(secretName);
  }

  // Check environment variable first (for local development)
  const envValue = process.env[secretName];
  if (envValue) {
    secretCache.set(secretName, envValue);
    return envValue;
  }

  // Try to load from Secret Manager (Cloud Run)
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.warn(
      `⚠️ [SECRET LOADER] GOOGLE_CLOUD_PROJECT not set, using env vars only`,
    );
    return undefined;
  }

  try {
    const client = new SecretManagerServiceClient();
    const name = `projects/${projectId}/secrets/COLONY_NECTAR/versions/latest`;

    const [version] = await client.accessSecretVersion({ name });
    const secretValue = version.payload?.data?.toString();

    if (secretValue) {
      // Parse .env format and extract the specific secret
      const lines = secretValue.split("\n");
      for (const line of lines) {
        if (line.startsWith(`${secretName}=`)) {
          const value = line.substring(secretName.length + 1).trim();
          secretCache.set(secretName, value);
          return value;
        }
      }

      // If secretName matches a key in the .env, return it
      // Otherwise, return the whole secret (for backward compatibility)
      secretCache.set(secretName, secretValue);
      return secretValue;
    }
  } catch (error: any) {
    console.warn(
      `⚠️ [SECRET LOADER] Failed to load ${secretName} from Secret Manager:`,
      error.message,
    );
    return undefined;
  }

  return undefined;
}

/**
 * Load all secrets from COLONY_NECTAR
 * Parses the .env format and returns as object
 */
export async function loadAllSecrets(): Promise<Record<string, string>> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    // In local dev, use environment variables directly
    return process.env as Record<string, string>;
  }

  try {
    const client = new SecretManagerServiceClient();
    const name = `projects/${projectId}/secrets/COLONY_NECTAR/versions/latest`;

    const [version] = await client.accessSecretVersion({ name });
    const secretValue = version.payload?.data?.toString();

    if (secretValue) {
      const secrets: Record<string, string> = {};
      const lines = secretValue.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            secrets[key.trim()] = valueParts.join("=").trim();
          }
        }
      }

      return secrets;
    }
  } catch (error: any) {
    console.warn(
      `⚠️ [SECRET LOADER] Failed to load secrets from Secret Manager:`,
      error.message,
    );
    // Fall back to environment variables
    return process.env as Record<string, string>;
  }

  return process.env as Record<string, string>;
}

/**
 * Clear the secret cache (useful for testing)
 */
export function clearSecretCache(): void {
  secretCache.clear();
}
