import {
  SearchServiceClient,
  GroundedGenerationServiceClient,
} from "@google-cloud/discoveryengine";
import { logger } from "../utils/logger";

/**
 * DiscoveryEngineBridge - Uses GenAI App Builder credits ($1,367.95)
 *
 * Provides grounded search results using Vertex AI Search.
 * This credit specifically applies to Enterprise AI Applications.
 */

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || "unique-spirit-482300-s4";
const LOCATION = "global";
const DATA_STORE_ID =
  process.env.VERTEX_SEARCH_DATA_STORE_ID || "zyeute-knowledge-base";

let client: SearchServiceClient | null = null;

async function getClient() {
  if (client) return client;

  try {
    client = new SearchServiceClient({
      // Use the same credential path logic as DialogflowBridge
      keyFilename:
        process.env.GOOGLE_APPLICATION_CREDENTIALS || "./zyeute-ai-key.json",
    });
    return client;
  } catch (error) {
    logger.error("[DiscoveryEngine] Failed to initialize client:", error);
    return null;
  }
}

export const DiscoveryEngineBridge = {
  /**
   * Search grounded data stores (GenAI App Builder Credit)
   *
   * @param query User search query
   * @param servingConfig Serving config ID (usually 'default_config')
   */
  async search(query: string, servingConfig: string = "default_config") {
    const searchClient = await getClient();
    if (!searchClient) {
      throw new Error("Discovery Engine client not available");
    }

    const servingConfigPath =
      searchClient.projectLocationCollectionDataStoreServingConfigPath(
        PROJECT_ID,
        LOCATION,
        "default_collection",
        DATA_STORE_ID,
        servingConfig,
      );

    try {
      logger.info(
        `[DiscoveryEngine] Searching for: "${query}" in ${DATA_STORE_ID}`,
      );

      const [response] = await searchClient.search({
        servingConfig: servingConfigPath,
        query: query,
        pageSize: 5,
        contentSearchSpec: {
          summarySpec: {
            summaryResultCount: 3,
            includeCitations: true,
          },
          snippetSpec: {
            maxSnippetCount: 3,
          },
        },
      });

      return {
        summary: (response as any).summary?.summaryText || "",
        results: response.map((r: any) => ({
          title:
            r.document.derivedStructData?.fields?.title?.stringValue ||
            "Untitled",
          link: r.document.derivedStructData?.fields?.link?.stringValue || "",
          snippet:
            r.document.derivedStructData?.fields?.snippets?.[0]?.snippet || "",
        })),
        citations:
          (response as any).summary?.summaryWithMetadata?.citationMetadata
            ?.citations || [],
      };
    } catch (error: any) {
      logger.error("[DiscoveryEngine] Search failed:", error);
      // Fallback to empty results if search not configured in GCP yet
      return {
        summary:
          "Désolé, ma base de connaissances Search n'est pas encore configurée dans GCP. Configure-la pour utiliser tes crédits de $1,367!",
        results: [],
        citations: [],
      };
    }
  },
};
