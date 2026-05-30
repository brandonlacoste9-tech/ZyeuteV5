import axios from "axios";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const BASE_URL = "https://api.pexels.com";

if (!PEXELS_API_KEY) {
  console.warn("⚠️ PEXELS_API_KEY is missing. Pexels integration will fail.");
}

// Types for TypeScript safety
interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFile[];
}

interface PexelsResponse {
  page: number;
  per_page: number;
  total_results: number;
  videos: PexelsVideo[];
  url?: string;
}

export const PexelsService = {
  /**
   * Fetch curated/popular videos from Pexels
   * Note: Pexels uses '/videos/popular' for their trending video feed.
   */
  async getCuratedVideos(perPage: number = 15, page: number = 1) {
    try {
      const response = await axios.get<PexelsResponse>(
        `${BASE_URL}/videos/popular`,
        {
          headers: { Authorization: PEXELS_API_KEY },
          params: {
            per_page: perPage,
            page: page,
            min_width: 720, // Prefer HD
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching curated videos from Pexels:", error);
      throw new Error("Failed to fetch curated videos");
    }
  },

  /**
   * Fetch videos from a specific collection
   * Pexels Collections API is generic, so we filter by type=videos
   */
  async getCollectionVideos(
    id: string,
    perPage: number = 15,
    page: number = 1,
  ) {
    try {
      // The collections endpoint is under /v1/, not /videos/
      // We explicitly request 'type=videos' to get video content
      const response = await axios.get(`${BASE_URL}/v1/collections/${id}`, {
        headers: { Authorization: PEXELS_API_KEY },
        params: {
          type: "videos",
          per_page: perPage,
          page: page,
        },
      });

      // Pexels collection response structure is slightly different (media array)
      // We map it to look like the standard video response for consistency if needed
      return response.data;
    } catch (error) {
      console.error(`Error fetching collection ${id} from Pexels:`, error);
      throw new Error("Failed to fetch collection videos");
    }
  },

  /**
   * Search for videos (Bonus helper if needed later)
   */
  async searchVideos(query: string, perPage: number = 15, page: number = 1) {
    try {
      const response = await axios.get<PexelsResponse>(
        `${BASE_URL}/videos/search`,
        {
          headers: { Authorization: PEXELS_API_KEY },
          params: {
            query: query,
            per_page: perPage,
            page: page,
            orientation: "portrait", // Optimized for mobile app
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error searching Pexels:", error);
      throw new Error("Failed to search videos");
    }
  },
};
