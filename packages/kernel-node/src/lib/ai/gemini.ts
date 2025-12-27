import dotenv from 'dotenv';
dotenv.config();

/**
 * Gemini Client (The Visual Cortex)
 * Adds multimodal capabilities (Vision/Video) to the Colony.
 * Refactored to use Vertex AI Endpoint via REST for "App Builder" credits.
 */
export class GeminiClient {
  private apiKey: string;
  private model: string = "gemini-2.5-flash-lite"; // User specified model
  private baseUrl: string = "https://aiplatform.googleapis.com/v1/publishers/google/models";
  public isReady: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ [Gemini] Missing GEMINI_API_KEY. Visual Cortex is dormant.');
      this.isReady = false;
      this.apiKey = '';
      return;
    }
    this.apiKey = apiKey;
    this.isReady = true;
  }

  /**
   * Analyze an image or video frame
   */
  async analyzeVisual(prompt: string, imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<string> {
    if (!this.isReady) return "Error: Visual Cortex Offline";

    try {
      const payload = {
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageBuffer.toString("base64")
              }
            }
          ]
        }]
      };

      const response = await this.callApi(payload);
      return response;
    } catch (error) {
      console.error('🔴 [Gemini] Vision Error:', error);
      return "I could not see the image clearly.";
    }
  }

  /**
   * Fast text inference
   */
  async chat(prompt: string): Promise<string> {
    if (!this.isReady) return "Error: Logic Core Offline";
    
    try {
      const payload = {
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }]
      };

      const response = await this.callApi(payload);
      return response;
    } catch (error) {
        console.error('🔴 [Gemini] Chat Error:', error);
        return "I am unable to process this thought.";
    }
  }

  /**
   * Internal API Caller
   */
  private async callApi(body: any): Promise<string> {
      const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
      });

      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      // Extract text from parts
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  }
}

export const geminiCortex = new GeminiClient();
