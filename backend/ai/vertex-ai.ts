import { createVertex } from "@ai-sdk/google-vertex";

/**
 * 🛠️ Google Cloud Vertex AI Provider
 * Replaces DeepSeek to utilize the $1,300 Cloud Credits.
 * Powered by Gemini 2.0 Flash for maximum speed and intelligence.
 */

const project =
  process.env.GOOGLE_CLOUD_PROJECT_ID || "unique-spirit-482300-s4";
const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";

const vertex = createVertex({
  project,
  location,
});

export const getVertexModel = (modelName: string = "gemini-2.0-flash") => {
  return vertex(modelName);
};

export default vertex;
