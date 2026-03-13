/**
 * 🦫 Ti-Guy Actions Service
 * Frontend service for Ti-Guy's AMAZING enhanced capabilities
 * Browser control, image/video generation, Quebec specialists, voice, and smart actions
 */

const API_BASE = "/api/tiguy";

/**
 * Helper to make API calls with consistent error handling
 * Returns the raw JSON response
 */
async function tiguyFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Ti-Guy request failed: ${response.status}`);
  }
  return response.json();
}

export interface TiGuyCapability {
  name: string;
  description: string;
  commands: string[];
  icon: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  style?:
    | "realistic"
    | "artistic"
    | "cartoon"
    | "quebec-heritage"
    | "winter-scene"
    | "urban-montreal"
    | "nature-laurentides";
  size?: "square" | "portrait" | "landscape";
  enhancePrompt?: boolean;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  prompt?: string;
  cost?: number;
  error?: string;
  response: string;
}

export interface VideoGenerationResponse {
  success: boolean;
  videoUrl?: string;
  prompt?: string;
  duration?: string;
  cost?: number;
  error?: string;
  response: string;
}

export interface BrowserActionResponse {
  success: boolean;
  result?: any;
  content?: string;
  image?: string;
  error?: string;
  response: string;
}

export interface SmartActionResponse {
  action: string;
  success: boolean;
  response: string;
  imageUrl?: string;
  videoUrl?: string;
  content?: string;
  error?: string;
}

export interface QuebecInfoResponse {
  success: boolean;
  response: string;
  data?: any;
}

/**
 * Ti-Guy Actions Service
 * Provides access to all Ti-Guy enhanced capabilities
 */
export const tiguyActionsService = {
  // ═══════════════════════════════════════════════════════════════
  // 🎨 IMAGE GENERATION
  // ═══════════════════════════════════════════════════════════════

  async generateImage(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse> {
    return tiguyFetch("/image/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  async generateAvatar(
    description: string,
    style: "realistic" | "cartoon" = "cartoon",
  ): Promise<ImageGenerationResponse> {
    return tiguyFetch("/image/avatar", {
      method: "POST",
      body: JSON.stringify({ description, style }),
    });
  },

  async generateThumbnail(
    topic: string,
    mood: "exciting" | "calm" | "funny" = "exciting",
  ): Promise<ImageGenerationResponse> {
    return tiguyFetch("/image/thumbnail", {
      method: "POST",
      body: JSON.stringify({ topic, mood }),
    });
  },

  async getImageIdeas(): Promise<{
    success: boolean;
    ideas: string[];
    response: string;
  }> {
    return tiguyFetch("/image/ideas");
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎬 VIDEO GENERATION
  // ═══════════════════════════════════════════════════════════════

  async generateVideo(
    prompt: string,
    duration: "5" | "10" = "5",
    aspectRatio: "16:9" | "9:16" | "1:1" = "9:16",
  ): Promise<VideoGenerationResponse> {
    return tiguyFetch("/video/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, duration, aspectRatio }),
    });
  },

  async getVideoIdeas(): Promise<{
    success: boolean;
    ideas: string[];
    response: string;
  }> {
    return tiguyFetch("/video/ideas");
  },

  // ═══════════════════════════════════════════════════════════════
  // 🌐 BROWSER CONTROL
  // ═══════════════════════════════════════════════════════════════

  async navigateTo(url: string): Promise<BrowserActionResponse> {
    return tiguyFetch("/browser/navigate", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  async search(
    query: string,
    platform: "google" | "youtube" | "tiktok" = "google",
  ): Promise<BrowserActionResponse> {
    return tiguyFetch("/browser/search", {
      method: "POST",
      body: JSON.stringify({ query, platform }),
    });
  },

  async screenshot(url?: string): Promise<BrowserActionResponse> {
    return tiguyFetch("/browser/screenshot", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  async extractContent(
    url: string,
    selector?: string,
  ): Promise<BrowserActionResponse> {
    return tiguyFetch("/browser/extract", {
      method: "POST",
      body: JSON.stringify({ url, selector }),
    });
  },

  // ═══════════════════════════════════════════════════════════════
  // 🏒 HOCKEY (CANADIENS DE MONTRÉAL)
  // ═══════════════════════════════════════════════════════════════

  async getHockeyStandings(): Promise<QuebecInfoResponse> {
    return tiguyFetch("/hockey/standings");
  },

  async getNextHabsGame(): Promise<QuebecInfoResponse> {
    return tiguyFetch("/hockey/next-game");
  },

  async getHabsFact(): Promise<QuebecInfoResponse> {
    return tiguyFetch("/hockey/facts");
  },

  // ═══════════════════════════════════════════════════════════════
  // 🌤️ WEATHER
  // ═══════════════════════════════════════════════════════════════

  async getWeather(city: string = "Montreal"): Promise<QuebecInfoResponse> {
    return tiguyFetch(`/weather/${encodeURIComponent(city)}`);
  },

  // ═══════════════════════════════════════════════════════════════
  // 🍟 FOOD RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════

  async getPoutineSpots(): Promise<QuebecInfoResponse> {
    return tiguyFetch("/food/poutine");
  },

  async getSmokedMeatSpots(): Promise<QuebecInfoResponse> {
    return tiguyFetch("/food/smoked-meat");
  },

  async getBagelSpots(): Promise<QuebecInfoResponse> {
    return tiguyFetch("/food/bagels");
  },

  async getFoodRecommendation(craving: string): Promise<QuebecInfoResponse> {
    return tiguyFetch("/food/recommend", {
      method: "POST",
      body: JSON.stringify({ craving }),
    });
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎵 CULTURE & MUSIC
  // ═══════════════════════════════════════════════════════════════

  async getFestivals(): Promise<QuebecInfoResponse> {
    return tiguyFetch("/culture/festivals");
  },

  async getQuebecMusic(): Promise<QuebecInfoResponse> {
    return tiguyFetch("/culture/music");
  },

  async getQuebecExpressions(): Promise<QuebecInfoResponse> {
    return tiguyFetch("/culture/expressions");
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎤 VOICE
  // ═══════════════════════════════════════════════════════════════

  async speak(
    text: string,
    voice: "quebec-male" | "quebec-female" | "ti-guy" = "ti-guy",
  ): Promise<{ success: boolean; audioBase64?: string; response: string }> {
    return tiguyFetch("/voice/speak", {
      method: "POST",
      body: JSON.stringify({ text, voice }),
    });
  },

  async getPronunciation(word?: string): Promise<QuebecInfoResponse> {
    const endpoint = word
      ? `/voice/pronunciation/${encodeURIComponent(word)}`
      : "/voice/pronunciation";
    return tiguyFetch(endpoint);
  },

  // ═══════════════════════════════════════════════════════════════
  // 🧠 SMART ACTIONS
  // ═══════════════════════════════════════════════════════════════

  async smartAction(
    message: string,
    type?: string,
  ): Promise<SmartActionResponse> {
    return tiguyFetch("/action", {
      method: "POST",
      body: JSON.stringify({ message, type }),
    });
  },

  async getCapabilities(): Promise<{
    response: string;
    capabilities: TiGuyCapability[];
  }> {
    return tiguyFetch("/capabilities");
  },

  // ═══════════════════════════════════════════════════════════════
  // 🔧 UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Detect action type from user message
   */
  detectActionType(message: string): string | null {
    const lowerMessage = message.toLowerCase();

    // Image generation
    if (
      lowerMessage.includes("image") ||
      lowerMessage.includes("génère") ||
      lowerMessage.includes("crée") ||
      lowerMessage.includes("dessine") ||
      lowerMessage.includes("picture") ||
      lowerMessage.includes("photo")
    ) {
      return "image";
    }

    // Video generation
    if (
      lowerMessage.includes("vidéo") ||
      lowerMessage.includes("video") ||
      lowerMessage.includes("anime") ||
      lowerMessage.includes("clip")
    ) {
      return "video";
    }

    // Web search
    if (
      lowerMessage.includes("cherche") ||
      lowerMessage.includes("search") ||
      lowerMessage.includes("trouve") ||
      lowerMessage.includes("google")
    ) {
      return "search";
    }

    // Navigation
    if (
      lowerMessage.includes("va sur") ||
      lowerMessage.includes("ouvre") ||
      lowerMessage.includes("navigate") ||
      lowerMessage.includes("website")
    ) {
      return "navigate";
    }

    // Screenshot
    if (
      lowerMessage.includes("screenshot") ||
      lowerMessage.includes("capture")
    ) {
      return "screenshot";
    }

    // Avatar
    if (lowerMessage.includes("avatar")) {
      return "avatar";
    }

    // Thumbnail
    if (
      lowerMessage.includes("thumbnail") ||
      lowerMessage.includes("vignette")
    ) {
      return "thumbnail";
    }

    // Hockey / Habs
    if (
      lowerMessage.includes("habs") ||
      lowerMessage.includes("canadiens") ||
      lowerMessage.includes("hockey") ||
      lowerMessage.includes("match")
    ) {
      return "hockey";
    }

    // Weather
    if (
      lowerMessage.includes("météo") ||
      lowerMessage.includes("weather") ||
      lowerMessage.includes("température") ||
      lowerMessage.includes("temps qu'il fait")
    ) {
      return "weather";
    }

    // Food
    if (
      lowerMessage.includes("poutine") ||
      lowerMessage.includes("manger") ||
      lowerMessage.includes("restaurant") ||
      lowerMessage.includes("faim") ||
      lowerMessage.includes("smoked meat") ||
      lowerMessage.includes("bagel")
    ) {
      return "food";
    }

    // Music
    if (
      lowerMessage.includes("musique") ||
      lowerMessage.includes("artiste") ||
      lowerMessage.includes("chanson") ||
      lowerMessage.includes("écouter")
    ) {
      return "music";
    }

    // Culture / Festivals
    if (
      lowerMessage.includes("festival") ||
      lowerMessage.includes("culture") ||
      lowerMessage.includes("expression") ||
      lowerMessage.includes("événement")
    ) {
      return "culture";
    }

    // Knowledge Search (Vertex AI)
    if (
      lowerMessage.includes("connaissance") ||
      lowerMessage.includes("cherche dans mes docs") ||
      lowerMessage.includes("archive") ||
      lowerMessage.includes("doc")
    ) {
      return "knowledge";
    }

    // Governance ⚖️
    if (
      lowerMessage.includes("gouvernance") ||
      lowerMessage.includes("boost") ||
      lowerMessage.includes("bannis") ||
      lowerMessage.includes("arbitre") ||
      lowerMessage.includes("momentum")
    ) {
      return "governance";
    }

    return null;
  },

  /**
   * Check if message is an action request
   */
  isActionRequest(message: string): boolean {
    return this.detectActionType(message) !== null;
  },
};

export default tiguyActionsService;
