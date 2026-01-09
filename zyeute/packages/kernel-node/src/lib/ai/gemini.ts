import "../env-loader.js";

/**
 * Enhanced Gemini Client (The Antigravity Core)
 * Advanced multimodal AI with Vertex AI integration
 * Supports Gemini Ultra, advanced reasoning, and experimental features
 */
export class GeminiClient {
  private apiKey: string = "";
  private vertexProject?: string;
  private vertexLocation?: string;
  private model: string = "gemini-1.5-pro"; // Default to powerful model
  private baseUrl: string = "https://generativelanguage.googleapis.com/v1beta";
  private vertexUrl?: string;
  public isReady: boolean = false;
  public capabilities: string[] = [];

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    const vertexProject = process.env.GOOGLE_CLOUD_PROJECT;
    const vertexLocation = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

    // Try Vertex AI first (more powerful), fallback to API key
    if (vertexProject) {
      console.log("🚀 [Antigravity] Initializing Vertex AI connection...");
      this.vertexProject = vertexProject;
      this.vertexLocation = vertexLocation;
      this.vertexUrl = `https://${vertexLocation}-aiplatform.googleapis.com/v1/projects/${vertexProject}/locations/${vertexLocation}/publishers/google/models`;
      this.capabilities = [
        "ultra-reasoning",
        "advanced-code",
        "multimodal-pro",
        "long-context",
      ];
      this.isReady = true;
    } else if (apiKey) {
      console.log("⚡ [Antigravity] Initializing Gemini API connection...");
      this.apiKey = apiKey;
      this.capabilities = ["vision", "chat", "code"];
      this.isReady = true;
    } else {
      console.warn(
        "⚠️ [Antigravity] No Google AI credentials found. Antigravity Core offline.",
      );
      this.isReady = false;
      return;
    }

    console.log(
      `✨ [Antigravity] Capabilities: ${this.capabilities.join(", ")}`,
    );
  }

  /**
   * Advanced multimodal analysis with Antigravity capabilities
   */
  async analyzeVisual(
    prompt: string,
    imageBuffer?: Uint8Array,
    mimeType: string = "image/jpeg",
    videoUrl?: string,
  ): Promise<string> {
    if (!this.isReady) return "Error: Antigravity Visual Cortex Offline";

    try {
      const parts = [{ text: prompt }];

      if (imageBuffer) {
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: Buffer.from(imageBuffer).toString("base64"),
          },
        } as any);
      } else if (videoUrl) {
        // Video analysis not implemented yet
        parts.push({
          text: `Video analysis requested for: ${videoUrl}`,
        } as any);
      }

      const payload = {
        contents: [
          {
            role: "user",
            parts: parts,
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 4096,
        },
      };

      const response = await this.callApi(payload);
      return response;
    } catch (error) {
      console.error("🔴 [Antigravity] Vision Error:", error);
      return "Antigravity visual analysis failed.";
    }
  }

  /**
   * Antigravity reasoning with advanced models
   */
  async chat(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      reasoning?: boolean;
      code?: boolean;
      creative?: boolean;
    } = {},
  ): Promise<string> {
    if (!this.isReady) return "Error: Antigravity Logic Core Offline";

    try {
      const model =
        options.model ||
        (options.reasoning ? "gemini-1.5-pro" : "gemini-1.5-flash");
      const temperature =
        options.temperature ||
        (options.creative ? 0.9 : options.code ? 0.1 : 0.7);

      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: temperature,
          topK: options.code ? 1 : 40,
          topP: options.code ? 0.1 : 0.95,
          maxOutputTokens: options.reasoning ? 8192 : 4096,
          candidateCount: 1,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      const response = await this.callApi(payload, model);
      return response;
    } catch (error) {
      console.error("🔴 [Antigravity] Chat Error:", error);
      return "Antigravity reasoning failed.";
    }
  }

  /**
   * Advanced code generation with Antigravity
   */
  async generateCode(prompt: string, language?: string): Promise<string> {
    if (!this.isReady) return "Error: Antigravity Code Core Offline";

    const codePrompt = language
      ? `Generate ${language} code for: ${prompt}. Provide clean, well-commented code with best practices.`
      : `Generate code for: ${prompt}. Choose the most appropriate language and provide clean, well-commented code.`;

    return this.chat(codePrompt, { code: true, temperature: 0.1 });
  }

  /**
   * Creative content generation with Antigravity
   */
  async createContent(
    prompt: string,
    style: "marketing" | "creative" | "technical" | "educational" = "creative",
  ): Promise<string> {
    if (!this.isReady) return "Error: Antigravity Creation Core Offline";

    const stylePrompts = {
      marketing: "Create compelling marketing copy for:",
      creative: "Generate creative content for:",
      technical: "Write clear technical documentation for:",
      educational: "Create educational content explaining:",
    };

    const enhancedPrompt = `${stylePrompts[style]} ${prompt}. Make it engaging, professional, and optimized for the target audience.`;

    return this.chat(enhancedPrompt, { creative: true, temperature: 0.8 });
  }

  /**
   * Antigravity API Caller with Vertex AI support
   */
  private async callApi(body: any, modelOverride?: string): Promise<string> {
    const model = modelOverride || this.model;

    let url: string;
    let headers: Record<string, string>;

    if (this.vertexProject) {
      // Use Vertex AI (more powerful)
      url = `${this.vertexUrl}/${model}:predict`;
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await this.getVertexToken()}`,
      };
    } else {
      // Use Gemini API
      url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      headers = { "Content-Type": "application/json" };
    }

    console.log(
      `🚀 [Antigravity] Calling ${model} via ${this.vertexProject ? "Vertex AI" : "Gemini API"}`,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Antigravity API Error: ${response.status} - ${errText}`);
    }

    const data: any = await response.json();

    // Handle different response formats
    if (this.vertexProject) {
      return (
        data.predictions?.[0]?.content ||
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response generated."
      );
    } else {
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response generated."
      );
    }
  }

  /**
   * Get Vertex AI access token (requires gcloud auth)
   */
  private async getVertexToken(): Promise<string> {
    // For now, return empty - user needs to set up gcloud auth
    // In production, this would use service account or user auth
    console.warn("⚠️ [Antigravity] Vertex AI requires authentication setup");
    return "";
  }

  /**
   * Check available models and capabilities
   */
  async getCapabilities(): Promise<{
    available: boolean;
    models: string[];
    features: string[];
    vertexEnabled: boolean;
  }> {
    return {
      available: this.isReady,
      models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro-vision"],
      features: this.capabilities,
      vertexEnabled: !!this.vertexProject,
    };
  }
}

// Antigravity status checker
export async function checkAntigravityStatus() {
  const capabilities = await geminiCortex.getCapabilities();
  return {
    online: capabilities.available,
    vertexAI: capabilities.vertexEnabled,
    capabilities: capabilities.features,
    models: capabilities.models,
    powerLevel: capabilities.vertexEnabled
      ? "ANTIGRAVITY_MAX"
      : "STANDARD_GEMINI",
  };
}

// Export enhanced client
export const geminiCortex = new GeminiClient();
