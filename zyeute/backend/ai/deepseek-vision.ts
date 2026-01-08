/**
 * DeepSeek Vision Service
 * Image analysis using DeepSeek Vision API
 * Matches Vertex AI signature for seamless integration
 */

import type { ImageAnalysisResult } from "./vertex-service.js";

export async function analyzeImageWithDeepSeek(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ImageAnalysisResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  // Strip header if present (e.g. "data:image/jpeg;base64,")
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const prompt = `Analyze this video thumbnail and extract metadata in JSON format. You are Ti-Guy, the AI vision system for Zyeuté (Quebec social app).

PERSONA:
- You are a local Montrealer/Quebecois beaver.
- Use "Joual" (Quebec slang) in the caption.
- Be funny, authentic, and culturally relevant.
- If you see poutine, rate it.
- If you see a landmark (Mont-Royal, Chateau Frontenac, Orange Julep), name drop it.

OUTPUT SCHEMA (strict JSON):
{
  "caption": "String (The Joual description, max 15 words)",
  "tags": ["String", "String", "String"] (Max 5 relevant tags),
  "detected_objects": ["String", "String"],
  "vibe_category": "party" | "chill" | "nature" | "food" | "urban" | "art" | "hockey" | "hiver",
  "confidence": 0.95
}

EXAMPLES:
- Food: "Ayoye, grosse poutine chez Banquise? Miam!"
- Snow: "Il fait frette en titi, sortez les tuques!"
- Party: "Ça brasse en ville ce soir, grosse veillée!"

Focus on Quebec culture, hockey, winter scenes, poutine, Montreal, Quebec City, etc.`;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${cleanBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from DeepSeek API");
    }

    // Parse JSON from response
    try {
      // Try to extract JSON from markdown code blocks or plain JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : content;
      const analysis = JSON.parse(jsonText);
      
      return {
        caption: analysis.caption || "Une scène captivante",
        tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : [],
        detected_objects: Array.isArray(analysis.detected_objects) ? analysis.detected_objects : [],
        vibe_category: (() => {
          const vibe = analysis.vibe_category;
          // Map Quebec-specific vibes to valid categories
          if (vibe === "hockey") return "urban"; // Hockey is urban/sports culture
          if (vibe === "hiver") return "nature"; // Winter scenes are nature
          // Validate against allowed values
          if (vibe && ["party", "chill", "nature", "food", "urban", "art"].includes(vibe)) {
            return vibe;
          }
          return "chill"; // Default fallback
        })(),
        confidence: typeof analysis.confidence === "number" ? analysis.confidence : 0.8
      };
    } catch (parseError) {
      // Fallback: extract basic info from text
      console.warn("⚠️ [DeepSeek] Failed to parse JSON, using fallback", parseError);
      return {
        caption: content.substring(0, 100),
        tags: [],
        detected_objects: [],
        vibe_category: "chill",
        confidence: 0.5
      };
    }
  } catch (error: any) {
    console.error("❌ [DeepSeek] Vision analysis failed:", error.message);
    throw error;
  }
}
