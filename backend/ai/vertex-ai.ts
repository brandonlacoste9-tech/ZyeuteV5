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

// Ensure GOOGLE_APPLICATION_CREDENTIALS is set
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
