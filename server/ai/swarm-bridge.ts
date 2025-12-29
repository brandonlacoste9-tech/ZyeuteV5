import { fal } from "@fal-ai/client";
import { logger } from "../utils/logger";
import { VertexBridge } from "./vertex-bridge";

// Dynamic region detection - sync with client AppConfig
const getCurrentRegion = (): string => {
  // TODO: Read from environment variable or shared config
  // For now, default to AR (Argentina) for Zarpado Pilot
  return process.env.AI_REGION || "AR";
};

// Types and Interfaces
export interface UserContext {
  userId: string;
  time?: Date;
  location?: { lat: number; lng: number; label?: string };
}

export interface MediaAnalysis {
  suggestedFilter: string;
  quebecVibes: number; // 0-100
  luxuryFactor: number; // 0-100
  cost: number;
}

export interface FilterApplication {
  enhancedUrl: string;
  processingCost: number;
  filterUsed: string;
}

export interface QuebecFilter {
  id: string;
  name: string;
  falPrompt: string; // The prompt for the creative upscaler
  description: string;
}

// Regional Filter Registry
const REGIONAL_FILTERS: Record<string, Record<string, QuebecFilter>> = {
  BR: {
    "rio-sunset": {
      id: "rio-sunset",
      name: "Rio Sunset",
      description: "Golden hour, tropical.",
      falPrompt:
        "cinematic photo of Ipanema, sunset, golden hour, tropical luxury, 8k",
    },
    "sao-paulo-concrete": {
      id: "sao-paulo-concrete",
      name: "São Paulo Concrete",
      description: "Urban jungle, high contrast, modern chic",
      falPrompt:
        "urban photography of São Paulo skyline, concrete jungle, high contrast, sharp architectural lines, modern luxury, dramatic lighting",
    },
    "bahia-tropical": {
      id: "bahia-tropical",
      name: "Bahia Tropical",
      description: "Vibrant colors, high saturation, energetic",
      falPrompt:
        "vibrant street photography of Pelourinho Bahia, colorful colonial houses, bright sunlight, deep blues and greens, energetic, festive",
    },
    "amazon-green": {
      id: "amazon-green",
      name: "Amazon Green",
      description: "Lush greens, mystical, soft light",
      falPrompt:
        "nature photography of Amazon rainforest, deep lush greens, soft filtered sunlight, mystical atmosphere, high resolution, macro details",
    },
    "copacabana-night": {
      id: "copacabana-night",
      name: "Copacabana Night",
      description: "Neon lights, nightlife, lively",
      falPrompt:
        "night photography of Copacabana boardwalk, neon lights, busy nightlife, cinematic reflections, vibrant and lively, sharp focus",
    },
  },
  AR: {
    "baires-night": {
      id: "baires-night",
      name: "Baires Night 🇦🇷",
      description: "Obelisco lights, urban energy.",
      falPrompt:
        "night photography of Obelisco Buenos Aires, 9 de Julio, light trails, cinematic city, sharp focus, 8k",
    },
    "patagonia-wild": {
      id: "patagonia-wild",
      name: "Patagonia Wild",
      description: "Mountains, glaciers, crisp air.",
      falPrompt:
        "landscape photography of Perito Moreno Glacier, Patagonia, jagged peaks, ice blue water, cold atmosphere, sharp detail",
    },
    "palermo-chic": {
      id: "palermo-chic",
      name: "Palermo Soho",
      description: "Trendy, street art, coffee vibes.",
      falPrompt:
        "street style photography of Palermo Soho Buenos Aires, cobblestone streets, colorful murals, trendy cafe, soft daylight, bokeh",
    },
  },
  MX: {
    "tulum-jungle": {
      id: "tulum-jungle",
      name: "Tulum Jungle",
      description: "Boho, green, warm tropical vibes.",
      falPrompt:
        "vibrant boho photography of Tulum jungle, lush green foliage, white sand beaches, thatched roofs, turquoise cenotes, warm golden sunlight, relaxed atmosphere",
    },
    "cdmx-cyberpunk": {
      id: "cdmx-cyberpunk",
      name: "CDMX Cyberpunk",
      description: "Neon, dark, high contrast urban.",
      falPrompt:
        "cyberpunk photography of Mexico City streets, neon signs, crowded urban landscape, high contrast, dramatic shadows, vibrant colors, futuristic yet authentic",
    },
    "dia-de-muertos": {
      id: "dia-de-muertos",
      name: "Día de Muertos",
      description: "Vibrant orange, purple, deep blacks.",
      falPrompt:
        "colorful Día de Muertos photography, vibrant orange and purple marigolds, sugar skulls, traditional altars, warm candlelight, deep black backgrounds, festive and spiritual",
    },
  },
};

class ColonySwarmBridge {
  private static instance: ColonySwarmBridge;
  private totalSpend: number = 0;

  // Costs (Estimated per call)
  private readonly COST_DEEPSEEK_ANALYSIS = 0.005;
  private readonly COST_FAL_UPSCALER = 0.025;

  private constructor() {
    // Check required keys
    if (!process.env.DEEPSEEK_API_KEY)
      logger.warn("DEEPSEEK_API_KEY missing in SwarmBridge");
    if (!process.env.FAL_API_KEY)
      logger.warn("FAL_API_KEY missing in SwarmBridge");
  }

  public static getInstance(): ColonySwarmBridge {
    if (!ColonySwarmBridge.instance) {
      ColonySwarmBridge.instance = new ColonySwarmBridge();
    }
    return ColonySwarmBridge.instance;
  }

  /**
   * Analyzes media using DeepSeek
   */
  async analyzeMedia(
    imageUrl: string,
    context: UserContext,
  ): Promise<MediaAnalysis> {
    const startTime = Date.now();
    let cost = 0;

    try {
      // 1. Detect Region dynamically
      const currentRegion = getCurrentRegion();
      const regionFilters =
        REGIONAL_FILTERS[currentRegion] || REGIONAL_FILTERS["BR"];

      // 2. Log the attempt
      logger.info(
        `[SwarmBridge] Analyzing media for ${context.userId} (Region: ${currentRegion})`,
      );

      // 3. Real Neural Analysis via Python Kernel
      let regionalVibes: number;
      let luxuryFactor: number;

      try {
        const KERNEL_URL =
          process.env.PYTHON_KERNEL_URL || "http://localhost:8000";
        logger.info(
          `[SwarmBridge] Calling Python Kernel at ${KERNEL_URL}/analyze`,
        );

        const response = await fetch(`${KERNEL_URL}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrl,
            region: currentRegion,
          }),
        });

        if (!response.ok) {
          throw new Error(`Python Kernel returned ${response.status}`);
        }

        const brainData = await response.json();
        regionalVibes = brainData.vibes_score; // 0-100
        luxuryFactor = brainData.luxury_score; // 0-100

        logger.info(
          `[SwarmBridge] Python analysis complete: vibes=${regionalVibes}, luxury=${luxuryFactor}`,
        );
      } catch (error: any) {
        logger.warn(
          `⚠️ Colony Kernel unreachable (${error.message || error}), using fallback mock logic.`,
        );
        // Fallback: Keep the mock logic here as a fallback!
        regionalVibes = Math.floor(Math.random() * 40) + 60; // 60-100
        luxuryFactor = Math.floor(Math.random() * 50) + 40; // 40-90
      }

      // Select filter based on "vibes" from regional filters
      let suggestedFilter = "baires-night"; // Default fallback
      if (currentRegion === "AR") {
        if (luxuryFactor > 80) suggestedFilter = "palermo-chic";
        else if (regionalVibes > 90) suggestedFilter = "patagonia-wild";
      } else if (currentRegion === "MX") {
        if (luxuryFactor > 80) suggestedFilter = "cdmx-cyberpunk";
        else if (regionalVibes > 90) suggestedFilter = "tulum-jungle";
        else suggestedFilter = "dia-de-muertos";
      } else {
        // Brazil logic
        if (luxuryFactor > 80) suggestedFilter = "sao-paulo-concrete";
        else if (regionalVibes > 90) suggestedFilter = "rio-sunset";
        else suggestedFilter = "bahia-tropical";
      }

      cost += this.COST_DEEPSEEK_ANALYSIS;
      this.trackCost(cost);

      return {
        suggestedFilter,
        quebecVibes: regionalVibes, // Repurposed field
        luxuryFactor,
        cost,
      };
    } catch (error) {
      logger.error("[SwarmBridge] Analysis failed:", error);
      // Fallback - region-appropriate
      const currentRegion = getCurrentRegion();
      let fallbackFilter = "rio-sunset"; // Default fallback
      if (currentRegion === "AR") fallbackFilter = "baires-night";
      else if (currentRegion === "MX") fallbackFilter = "tulum-jungle";

      return {
        suggestedFilter: fallbackFilter,
        quebecVibes: 50,
        luxuryFactor: 50,
        cost: 0,
      };
    }
  }

  /**
   * Applies a "Luxury Filter" using Fal.ai Creative Upscaler
   */
  async applyLuxuryFilter(
    imageUrl: string,
    filterName: string,
  ): Promise<FilterApplication> {
    // Detect region and get appropriate filter
    const currentRegion = getCurrentRegion();
    const regionFilters =
      REGIONAL_FILTERS[currentRegion] || REGIONAL_FILTERS["BR"];
    let defaultFilterKey = "rio-sunset"; // Default fallback
    if (currentRegion === "AR") defaultFilterKey = "baires-night";
    else if (currentRegion === "MX") defaultFilterKey = "tulum-jungle";
    const filter = regionFilters[filterName] || regionFilters[defaultFilterKey];
    let cost = 0;

    try {
      logger.info(`[SwarmBridge] Applying filter '${filter.name}' via Fal.ai`);

      const result: any = await fal.subscribe("fal-ai/creative-upscaler", {
        input: {
          image_url: imageUrl,
          prompt: filter.falPrompt,
          creativity: 0.35,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            // logger.debug(update.logs.map(l => l.message).join('\n'));
          }
        },
      });

      cost += this.COST_FAL_UPSCALER;
      this.trackCost(cost);

      if (result.image && result.image.url) {
        return {
          enhancedUrl: result.image.url,
          processingCost: cost,
          filterUsed: filter.id,
        };
      } else {
        throw new Error("No image URL in Fal response");
      }
    } catch (error) {
      logger.error("[SwarmBridge] Filter application failed:", error);
      // Return original on failure
      return {
        enhancedUrl: imageUrl,
        processingCost: 0,
        filterUsed: "none",
      };
    }
  }

  /**
   * Generates region-specific captions using DeepSeek (Text)
   */
  async generateCaption(context: string, mood: string): Promise<string[]> {
    const cost = this.COST_DEEPSEEK_ANALYSIS;
    this.trackCost(cost);

    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) throw new Error("No DeepSeek API Key");

      // Dynamic prompts for regional localization
      const PROMPTS = {
        BR: `Generate 3 authentic Brazilian captions. Use slang like "Mano", "Top", "Beleza".`,
        AR: `Generá 3 copetes para Instagram bien argentinos. Usá lunfardo como "Che", "Boludo", "Zarpado", "Tremendo". Contexto: Buenos Aires. Mood: ${mood}.`,
        MX: `Genera 3 captions para Instagram bien mexicanas. Usa slang como "Wey", "Chido", "Órale", "Padre", "No manches". Contexto: CDMX. Mood: ${mood}.`,
      };

      const region = getCurrentRegion() as keyof typeof PROMPTS;
      const userPrompt = PROMPTS[region] || PROMPTS["BR"];

      const prompt = `
          ${userPrompt}
          Context: ${context}.
          Return only the captions as a JSON string array.
        `;

      const response = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.9,
          }),
        },
      );

      if (!response.ok)
        throw new Error(`DeepSeek API error: ${response.status}`);

      const data = await response.json();
      const content = data.choices[0].message.content;

      try {
        const captions = JSON.parse(
          content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim(),
        );
        return Array.isArray(captions) ? captions : [content];
      } catch (e) {
        return [content];
      }
    } catch (error) {
      logger.error("[SwarmBridge] Caption generation failed:", error);
      // Region-appropriate fallbacks
      const region = getCurrentRegion();
      if (region === "AR") {
        return [
          "¡Qué noche, che! 🌃",
          "Tremenda vista, mal. 🔥",
          "Buenos Aires nunca duerme. ✨",
        ];
      } else if (region === "MX") {
        return [
          "¡Qué padre, wey! 🌮",
          "Tremendo rollo, órale. 🔥",
          "CDMX nunca duerme. ✨",
        ];
      } else {
        return [
          "✨ Rio vibes hoje 🌴",
          "Mano do céu, que dia! ☀️",
          "Só vibrando alto ✨",
        ];
      }
    }
  }

  /**
   * Search the Knowledge Base (Delegates to VertexBridge)
   */
  async searchSwarmMemory(query: string) {
    // This allows the SwarmBridge to be the "Unified Brain" interface
    return VertexBridge.searchMemory(query);
  }

  private trackCost(amount: number) {
    this.totalSpend += amount;
    // In a real implementation we might write this to DB/Redis
    if (this.totalSpend > 5.0) {
      logger.warn(
        `[SwarmBridge] DAILY SPEND ALERT: $${this.totalSpend.toFixed(2)}`,
      );
    }
  }
}

export const getSwarmBridge = () => ColonySwarmBridge.getInstance();
