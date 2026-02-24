import { createVertex } from "@ai-sdk/google-vertex";
import fs from "fs";
import path from "path";

/**
 * 🛠️ Google Cloud Vertex AI Provider
 * Uses the $1,300 Cloud Credits on project gen-lang-client-0092649281.
 * Powered by Gemini 2.0 Flash for maximum speed and intelligence.
 *
 * Authentication priority:
 * 1. GOOGLE_APPLICATION_CREDENTIALS env var (standard GCP auth)
 * 2. ./zyeute-vertex-key.json (primary — gen-lang-client project)
 * 3. ./zyeute-ai-key.json (fallback — unique-spirit project)
 * 4. Application Default Credentials (gcloud auth)
 */

const project =
  process.env.GOOGLE_CLOUD_PROJECT_ID || "gen-lang-client-0092649281";
const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

// Ensure GOOGLE_APPLICATION_CREDENTIALS is set or credentials provided via env
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Support for JSON string in GOOGLE_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON (for Railway/Render)
  const credsJson =
    process.env.GOOGLE_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (credsJson) {
    try {
      // Normalize: strip BOM, trim, handle double-encoded JSON
      let raw = credsJson.replace(/^\uFEFF/, "").trim();
      let parsed: unknown = JSON.parse(raw);
      // If result is a string, it was double-encoded
      if (typeof parsed === "string") parsed = JSON.parse(parsed as string);
      const credentials = parsed as Record<string, unknown>;
      if (!credentials || typeof credentials !== "object") {
        throw new Error("Parsed value is not a valid credentials object");
      }
      const tempKeyPath = path.resolve(process.cwd(), "temp-vertex-key.json");
      fs.writeFileSync(tempKeyPath, JSON.stringify(credentials));
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;
      console.log(
        "🔑 [Vertex AI] Using credentials from env var (GOOGLE_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON)",
      );
    } catch (e) {
      console.warn(
        "⚠️ [Vertex AI] Failed to parse credentials JSON. Check GOOGLE_CREDENTIALS in Railway: must be valid JSON (no trailing commas, proper quotes). AI features may be disabled.",
      );
      if (process.env.NODE_ENV === "development") {
        console.warn("Parse error:", e);
      }
    }
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const candidates = [
      "zyeute-vertex-key.json", // Primary: gen-lang-client project
      "zyeute-ai-key.json", // Fallback: unique-spirit project
    ];

    for (const file of candidates) {
      const keyPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(keyPath)) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
        console.log(`🔑 [Vertex AI] Using credentials: ${file}`);
        break;
      }
    }
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(
      "⚠️ [Vertex AI] No credentials found. Provide zyeute-vertex-key.json or set GOOGLE_APPLICATION_CREDENTIALS",
    );
  }
}

const vertex = createVertex({
  project,
  location,
});

console.log(
  `🧠 [Vertex AI] Initialized: project=${project}, location=${location}`,
);

export const getVertexModel = (modelName: string = "gemini-2.0-flash") => {
  return vertex(modelName);
};

export default vertex;
