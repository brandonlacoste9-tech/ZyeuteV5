import { db } from "../storage.js";
import { comments, users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { getGeminiModel } from "../ai/google.js";

/**
 * Engagement Service - Ti-Guy's automated community interactions.
 * Generates and posts the "First Comment" on high-potential videos.
 */
export async function postTiGuyFirstComment(
  postId: string,
  videoInfo: { summary: string; tags: string[] },
): Promise<void> {
  const model = getGeminiModel("gemini-1.5-flash");
  if (!model) return;

  try {
    // 1. Get Ti-Guy user ID
    const results = await db
      .select()
      .from(users)
      .where(eq(users.username, "TiGuyScouter"))
      .limit(1);
    const tiGuy = results[0];

    if (!tiGuy) {
      console.warn(
        "[Engagement] User @TiGuyScouter not found. Comment skipped.",
      );
      return;
    }

    // 2. Generate a personalized Joual comment based on the scout result
    const prompt = `
      Tu es Ti-Guy (@TiGuyScouter), l'assistant mascotte de Zyeuté.
      Tu viens de "Scouter" une vidéo avec ce résultat:
      Résumé: ${videoInfo.summary}
      Tags: ${videoInfo.tags.join(", ")}

      Écris un premier commentaire ultra-enthousiaste, court (max 15 mots), et 100% Joual (Québec).
      Utilise des emojis comme 🦫, 🍁, 🔥.
      Parle de ce que tu as vu dans la vidéo de façon naturelle.
      
      Réponds UNIQUEMENT avec le texte du commentaire.
    `;

    const result = await model.generateContent(prompt);
    const commentText = result.response.text().trim().replace(/^"|"$/g, "");

    // 3. Post the comment
    await db.insert(comments).values({
      postId: postId,
      userId: tiGuy.id,
      content: commentText,
    });

    console.log(
      `💬 [Engagement] Ti-Guy a commenté sur le post ${postId}: "${commentText}"`,
    );
  } catch (error: any) {
    console.error(
      `❌ [Engagement] Erreur lors du commentaire de Ti-Guy:`,
      error.message,
    );
  }
}
