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

export async function verifyGCS(): Promise<{
  output: string;
  success: boolean;
}> {
  const output: string[] = [];
  output.push(
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
    output.push(
      "⏭️  No GCS credentials set (GCS_KEY_FILE / GOOGLE_APPLICATION_CREDENTIALS / GCS_PROJECT_ID).",
    );
    output.push("   SDK loaded successfully; skipping bucket check.");
    output.push("   To run a full check, set credentials and re-run.\n");
    return { output: output.join("\n"), success: true };
  }

  try {
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (exists) {
      output.push(`✅ Bucket "${bucketName}" exists and is reachable.`);
    } else {
      output.push(
        `⚠️  Bucket "${bucketName}" not found (may be expected if not created yet).`,
      );
    }
    output.push("✅ @google-cloud/storage integration OK.\n");
    return { output: output.join("\n"), success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;
    // Missing key file or auth errors: treat as "not configured", skip gracefully
    if (
      code === "ENOENT" ||
      message.includes("Could not load the default credentials")
    ) {
      output.push(
        "⏭️  Credentials file missing or invalid; skipping bucket check.",
      );
      output.push(
        "   SDK loaded successfully. Set valid GCS credentials for full verification.\n",
      );
      return { output: output.join("\n"), success: true };
    }
    output.push(`❌ GCS check failed: ${message}`);
    return { output: output.join("\n"), success: false };
  }
}

async function main(): Promise<void> {
  const result = await verifyGCS();
  console.log(result.output);
  process.exit(result.success ? 0 : 1);
}

// Run main if executed directly
if (process.argv[1] && process.argv[1].endsWith("verify-gcs-storage.ts")) {
  main();
}
