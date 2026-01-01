import { getGeminiModel } from "../google.js";

interface QuebecMediaMetadata {
  caption_fr: string;
  caption_en: string;
  hashtags: string[];
  detected_themes: string[];
  detected_items: string[];
  suggested_title_fr?: string;
  suggested_title_en?: string;
  promo_code?: string;
  promo_url?: string;
}

/**
 * Promo Bee Agent
 * Sniffs video frames for products and generates monetization opportunities
 */
export async function runPromoBee(imageUrl: string): Promise<QuebecMediaMetadata> {
  const model = getGeminiModel("gemini-1.5-flash");
  if (!model) {
    throw new Error("Gemini model not initialized");
  }
  
  const prompt = `
    You are the 'Promotion Bee' of Zyeuté (The Quebec Social App).
    Analyze this video thumbnail and extract semantic metadata for a Quebec audience.

    TASK 1 (Bilingual Copy):
    - Write a short, punchy caption in Quebec French (Joual style: "Checkez ça!", "Malade!").
    - Write the same caption in English.
    - Generate 5 relevant hashtags including #zyeute and #quebec.

    TASK 2 (Product Discovery):
    - Detect any specific products, brands, or items (e.g., "poutine", "hockey jersey", "iphone").
    - If a product is detected, generate a playful 'promo_code' (e.g., BEE_POUTINE_10).
    - Create a 'promo_url' using this format: https://zyeute.com/shop/sniff?item=[item]&code=[PROMO_CODE]&ref=hound_bee.

    TASK 3 (Themes):
    - Categorize into themes: "Food", "Streetwear", "Humor", "Nature", "Nightlife", "Tech".

    Return a clean JSON object:
    {
      "caption_fr": "...",
      "caption_en": "...",
      "hashtags": ["...", "..."],
      "detected_themes": ["..."],
      "detected_items": ["..."],
      "promo_code": "...",
      "promo_url": "..."
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: await fetchImageBase64(imageUrl),
          mimeType: "image/jpeg",
        },
      },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid AI response");
  } catch (error) {
    console.error("Promo Bee Error:", error);
    return {
      caption_fr: "Nouveau contenu dans la ruche! 🐝",
      caption_en: "New content in the hive!",
      hashtags: ["#zyeute", "#quebec"],
      detected_themes: ["Lifestyle"],
      detected_items: [],
    };
  }
}

async function fetchImageBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
