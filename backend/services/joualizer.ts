import { getGeminiModel } from "../ai/google.js";

export type JoualStyle = "street" | "old" | "enhanced";

/**
 * Joualizer - Transforms text into authentic Quebecois styles using Gemini.
 */
export async function joualizeText(
  text: string,
  style: JoualStyle,
): Promise<string> {
  const model = getGeminiModel("gemini-1.5-flash");
  if (!model) {
    throw new Error("Gemini model not initialized");
  }

  const prompts: Record<JoualStyle, string> = {
    street: `
      Tu es Ti-Guy, l'assistant expert en culture urbaine québécoise.
      Réécris le texte suivant en "Street Joual" moderne.
      Utilise des anglicismes courants (vibes, sick, fresh, legit), des contractions (t'sais, j'dis ça, check),
      et reste 100% authentique à la jeunesse montréalaise ou de Québec. 
      C'est pour une légende de vidéo virale sur Zyeuté.
      
      Texte original: "${text}"
      
      Réponds UNIQUEMENT avec le texte réécrit, pas de commentaires.
    `,
    old: `
      Tu es Ti-Guy, gardien des traditions et du parler "Pure Laine".
      Réécris le texte suivant dans un style québécois traditionnel et chaleureux.
      Utilise des expressions de campagne, un français imagé, authentique et fier.
      Fais-moi sentir l'odeur du sirop d'érable et la chaleur du poêle à bois.
      
      Texte original: "${text}"
      
      Réponds UNIQUEMENT avec le texte réécrit, pas de commentaires.
    `,
    enhanced: `
      Tu es Ti-Guy, stratège en viralité sur Zyeuté.
      Réécris ce texte pour qu'il devienne une "bombe" virale au Québec.
      Ajoute des emojis pertinents, crée un "hook" accrocheur au début, 
      et utilise un ton enthousiaste mais qui reste "Zyeuté style" (authentique).
      
      Texte original: "${text}"
      
      Réponds UNIQUEMENT avec le texte réécrit, pas de commentaires.
    `,
  };

  try {
    const result = await model.generateContent(prompts[style]);
    const response = await result.response;
    let rewrittenText = response.text().trim();

    // Clean up markdown markers if any
    rewrittenText = rewrittenText.replace(/^["']|["']$/g, "");

    return rewrittenText;
  } catch (error: any) {
    console.error(`[Joualizer] Error rewriting text:`, error.message);
    throw new Error("Failed to joualize text");
  }
}
