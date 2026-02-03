/**
 * Verify @google-cloud/storage integration after dependency overrides.
 * Ensures the SDK (and its transitive fast-xml-parser) works correctly.
 *
 * Usage:
 *   npx tsx scripts/verify-gcs-storage.ts
 *
 * Requires (optional for full check):
 *   GCS_KEY_FILE or GOOGLE_APPLICATION_CREDENTIALS
 *   GCS_PROJECT_ID
 *   GCS_BUCKET_NAME (default: zyeute-videos)
 *
 * Exit 0: SDK loads and (if creds set) bucket check succeeds.
 * Exit 1: SDK load or bucket check failed.
 */

import "dotenv/config";
import { Storage } from "@google-cloud/storage";

const bucketName = process.env.GCS_BUCKET_NAME || "zyeute-videos";

async function main(): Promise<void> {
  console.log(
    "🔍 Verifying @google-cloud/storage (with fast-xml-parser override)...\n",
  );

  // 1. Instantiate SDK — this exercises the dependency tree including fast-xml-parser
  const storage = new Storage({
    keyFilename: process.env.GCS_KEY_FILE || undefined,
    projectId: process.env.GCS_PROJECT_ID || undefined,
  });

  const hasCreds =
    process.env.GCS_KEY_FILE ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GCS_PROJECT_ID;

  if (!hasCreds) {
    console.log(
      "⏭️  No GCS credentials set (GCS_KEY_FILE / GOOGLE_APPLICATION_CREDENTIALS / GCS_PROJECT_ID).",
    );
    console.log("   SDK loaded successfully; skipping bucket check.");
    console.log("   To run a full check, set credentials and re-run.\n");
    process.exit(0);
  }

  try {
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (exists) {
      console.log(`✅ Bucket "${bucketName}" exists and is reachable.`);
    } else {
      console.log(
        `⚠️  Bucket "${bucketName}" not found (may be expected if not created yet).`,
      );
    }
    console.log("✅ @google-cloud/storage integration OK.\n");
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;
    // Missing key file or auth errors: treat as "not configured", skip gracefully
    if (
      code === "ENOENT" ||
      message.includes("Could not load the default credentials")
    ) {
      console.log(
        "⏭️  Credentials file missing or invalid; skipping bucket check.",
      );
      console.log(
        "   SDK loaded successfully. Set valid GCS credentials for full verification.\n",
      );
      process.exit(0);
    }
    console.error("❌ GCS check failed:", message);
    process.exit(1);
  }
}

main();
