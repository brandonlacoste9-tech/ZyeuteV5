/**
 * 🦫 Ti-Guy Actions Service
 * Frontend service for Ti-Guy's AMAZING enhanced capabilities
 * Browser control, image/video generation, Quebec specialists, voice, and smart actions
 */

const API_BASE = "/api/tiguy";

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
    const response = await fetch(`${API_BASE}/image/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    });
    return response.json();
  },

  async generateAvatar(
    description: string,
    style: "realistic" | "cartoon" = "cartoon",
  ): Promise<ImageGenerationResponse> {
    const response = await fetch(`${API_BASE}/image/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ description, style }),
    });
    return response.json();
  },

  async generateThumbnail(
    topic: string,
    mood: "exciting" | "calm" | "funny" = "exciting",
  ): Promise<ImageGenerationResponse> {
    const response = await fetch(`${API_BASE}/image/thumbnail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ topic, mood }),
    });
    return response.json();
  },

  async getImageIdeas(): Promise<{
    success: boolean;
    ideas: string[];
    response: string;
  }> {
    const response = await fetch(`${API_BASE}/image/ideas`, {
      credentials: "include",
    });
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎬 VIDEO GENERATION
  // ═══════════════════════════════════════════════════════════════

  async generateVideo(
    prompt: string,
    duration: "5" | "10" = "5",
    aspectRatio: "16:9" | "9:16" | "1:1" = "9:16",
  ): Promise<VideoGenerationResponse> {
    const response = await fetch(`${API_BASE}/video/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ prompt, duration, aspectRatio }),
    });
    return response.json();
  },

  async getVideoIdeas(): Promise<{
    success: boolean;
    ideas: string[];
    response: string;
  }> {
    const response = await fetch(`${API_BASE}/video/ideas`, {
      credentials: "include",
    });
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════
  // 🌐 BROWSER CONTROL
  // ═══════════════════════════════════════════════════════════════

  async navigateTo(url: string): Promise<BrowserActionResponse> {
    const response = await fetch(`${API_BASE}/browser/navigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url }),
    });
    return response.json();
  },

  async search(
    query: string,
    platform: "google" | "youtube" | "tiktok" = "google",
  ): Promise<BrowserActionResponse> {
    const response = await fetch(`${API_BASE}/browser/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query, platform }),
    });
    return response.json();
  },

  async screenshot(url?: string): Promise<BrowserActionResponse> {
    const response = await fetch(`${API_BASE}/browser/screenshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url }),
    });
    return response.json();
  },

  async extractContent(
    url: string,
    selector?: string,
  ): Promise<BrowserActionResponse> {
    const response = await fetch(`${API_BASE}/browser/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url, selector }),
    });
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════
  // 🏒 HOCKEY (CANADIENS DE MONTRÉAL)
  // ═══════════════════════════════════════════════════════════════

  async getHockeyStandings(): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/hockey/standings`, {
      credentials: "include",
    });
    return response.json();
  },

  async getNextHabsGame(): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/hockey/next-game`, {
      credentials: "include",
    });
    return response.json();
  },

  async getHabsFact(): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/hockey/facts`, {
      credentials: "include",
    });
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════
  // 🌤️ WEATHER
  // ═══════════════════════════════════════════════════════════════

  async getWeather(city: string = "Montreal"): Promise<QuebecInfoResponse> {
    const response = await fetch(
      `${API_BASE}/weather/${encodeURIComponent(city)}`,
      { credentials: "include" },
    );
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════
  // 🍟 FOOD RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════

  async getPoutineSpots(): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/food/poutine`, {
      credentials: "include",
    });
    return response.json();
  },

  async getSmokedMeatSpots(): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/food/smoked-meat`, {
      credentials: "include",
    });
    return response.json();
  },

  async getBagelSpots(): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/food/bagels`, {
      credentials: "include",
    });
    return response.json();
  },

  async getFoodRecommendation(craving: string): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/food/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ craving }),
    });
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎵 CULTURE & MUSIC
  // ═══════════════════════════════════════════════════════════════

  async getFestivals(): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/culture/festivals`, {
      credentials: "include",
    });
    return response.json();
  },

  async getQuebecMusic(): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/culture/music`, {
      credentials: "include",
    });
    return response.json();
  },

  async getQuebecExpressions(): Promise<QuebecInfoResponse> {
    const response = await fetch(`${API_BASE}/culture/expressions`, {
      credentials: "include",
    });
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════
  // 🎤 VOICE
  // ═══════════════════════════════════════════════════════════════

  async speak(
    text: string,
    voice: "quebec-male" | "quebec-female" | "ti-guy" = "ti-guy",
  ): Promise<{ success: boolean; audioBase64?: string; response: string }> {
    const response = await fetch(`${API_BASE}/voice/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text, voice }),
    });
    return response.json();
  },

  async getPronunciation(word?: string): Promise<QuebecInfoResponse> {
    const url = word
      ? `${API_BASE}/voice/pronunciation/${encodeURIComponent(word)}`
      : `${API_BASE}/voice/pronunciation`;
    const response = await fetch(url, { credentials: "include" });
    return response.json();
  },

  // ═══════════════════════════════════════════════════════════════
  // 🧠 SMART ACTIONS
  // ═══════════════════════════════════════════════════════════════

  async smartAction(
    message: string,
    type?: string,
  ): Promise<SmartActionResponse> {
    const response = await fetch(`${API_BASE}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, type }),
    });
    return response.json();
  },

  async getCapabilities(): Promise<{
    response: string;
    capabilities: TiGuyCapability[];
  }> {
    const response = await fetch(`${API_BASE}/capabilities`, {
      credentials: "include",
    });
    return response.json();
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
