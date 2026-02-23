import "dotenv/config";
import { DiscoveryEngineServiceClient } from "@google-cloud/discoveryengine";
import fs from "fs";
import path from "path";

/**
 * setup-vertex-search.ts
 *
 * This script helps you utilize your $1,367.95 GenAI App Builder credit.
 * It prepares data for Vertex AI Search, which is a core service covered by this credit.
 *
 * Usage:
 *   npx tsx scripts/setup-vertex-search.ts
 */

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || "unique-spirit-482300-s4";
const LOCATION = "global"; // Vertex AI Search often uses global or us
const DATA_STORE_ID = "zyeute-knowledge-base";

async function setupSearch() {
  console.log(
    "🚀 Initializing Vertex AI Search Setup (GenAI App Builder Credits)...",
  );

  const client = new DiscoveryEngineServiceClient();

  // 1. Identify local documentation to index
  const docsDir = path.resolve(process.cwd(), "docs");
  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));

  console.log(`\nfound ${files.length} documents in /docs to index.`);

  // Note: Vertex AI Search typically indexes from GCS buckets.
  // This script helps you prepare the JSONL metadata for a GCS upload.

  const metadata = files.map((file) => {
    const content = fs.readFileSync(path.join(docsDir, file), "utf-8");
    return {
      id: file.replace(".md", ""),
      jsonData: JSON.stringify({
        title: file,
        content: content,
        url: `https://zyeute.com/docs/${file}`,
      }),
    };
  });

  const outputPath = path.resolve(process.cwd(), "vertex_search_data.jsonl");
  const stream = fs.createWriteStream(outputPath);

  metadata.forEach((item) => {
    stream.write(JSON.stringify(item) + "\n");
  });

  stream.end();

  console.log(`\n✅ Created ${outputPath}`);
  console.log("\n--- NEXT STEPS TO USE YOUR $1,367.95 CREDIT ---");
  console.log(
    "1. Upload 'vertex_search_data.jsonl' to a Google Cloud Storage bucket.",
  );
  console.log(
    "2. Go to Google Cloud Console -> Vertex AI -> Search & Conversation.",
  );
  console.log("3. Create a new 'Search' app.");
  console.log(`4. Create a Data Store using the GCS bucket upload.`);
  console.log(
    "5. This usage will be 100% covered by your GenAI App Builder promotional credit.",
  );
  console.log(
    "\nTi-Guy will then be able to answer questions grounded in these docs!",
  );
}

setupSearch().catch(console.error);
