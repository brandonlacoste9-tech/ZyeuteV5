import { v1beta } from "@google-cloud/discoveryengine";
import { logger } from "../utils/logger";

// --- Configuration ---
// These should eventually come from env vars, populated by the Terraform output
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "zyeute-production";
const REGION = process.env.GOOGLE_CLOUD_REGION || "global";
// This ID comes from the Terraform output: docs_index_id or data_store_id
const DATA_STORE_ID =
  process.env.VERTEX_DATA_STORE_ID || "zyeute-knowledge-base";
const COLLECTION_ID = "default_collection";

const client = new v1beta.SearchServiceClient();

export const VertexBridge = {
  /**
   * Search the Swarm Memory (Vertex AI / Discovery Engine)
   * @param query The natural language query (e.g., "What is the vibe of Quebec?")
   */
  async searchMemory(query: string) {
    if (!process.env.VERTEX_DATA_STORE_ID) {
      console.warn(
        "[VertexBridge] VERTEX_DATA_STORE_ID not set. Mocking response.",
      );
      return mockSearchResponse(query);
    }

    try {
      const name = client.projectLocationCollectionDataStoreServingConfigPath(
        PROJECT_ID,
        REGION,
        COLLECTION_ID,
        DATA_STORE_ID,
        "default_search",
      );

      const request = {
        name,
        query,
        pageSize: 10,
        queryExpansionSpec: { condition: "AUTO" as const },
        spellCorrectionSpec: { mode: "AUTO" as const },
      };

      logger.info(`[VertexBridge] Searching Swarm Memory: "${query}"`);
      const response = await client.search(request);

      return response;
    } catch (error) {
      logger.error("[VertexBridge] Search failed:", error);
      throw error;
    }
  },

  /**
   * Upload a document to the Knowledge Base (via GCS Ingestion Bucket)
   * Note: This actually just writes to GCS. The Cloud Function trigger does the rest.
   * This is a placeholder for the logic we'll move from `storage.ts` or `upload.tsx`.
   */
  async ingestMemory(fileBuffer: Buffer, fileName: string, metadata: any) {
    // This logic duplicates functionality in storage.ts, but conceptually belongs here
    // for the "AI Memory" pipeline. for now, we leave it as a stub.
    logger.info(`[VertexBridge] Request to ingest memory: ${fileName}`);
    return { status: "delegated_to_gcs_trigger" };
  },
};

// --- Mock Data for Development without Credits ---
function mockSearchResponse(query: string) {
  return [
    {
      document: {
        name: "mock-doc-1",
        derivedStructData: {
          title: "The Ritual of Quebec",
          link: "/p/quebec-ritual-1",
        },
        snippets: [
          {
            content: `In the heart of the Hive, the ${query} resonates with a stitched leather frequency.`,
          },
        ],
      },
    },
  ];
}
