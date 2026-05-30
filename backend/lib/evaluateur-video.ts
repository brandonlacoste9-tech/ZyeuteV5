import { VertexAI } from "@google-cloud/vertexai";

/**
 * 🦫 L'ÉVALUATEUR VIDÉO (Les Yeux Automatisés)
 * Utilise Gemini 1.5 Flash sur Vertex AI pour analyser et scorer les vidéos.
 */

// 1. Initialisation de Vertex AI
const projet_gcp =
  process.env.GOOGLE_CLOUD_PROJECT || process.env.GCS_PROJECT_ID;
const region_gcp = "us-central1"; // Supporte Gemini 1.5 Flash

if (!projet_gcp) {
  console.warn(
    "⚠️ GOOGLE_CLOUD_PROJECT non configuré. L'évaluateur vidéo sera limité.",
  );
}

const vertex_ai = projet_gcp
  ? new VertexAI({ project: projet_gcp, location: region_gcp })
  : null;
const modele_vision = vertex_ai
  ? vertex_ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // Faible température pour des jugements constants
      },
    })
  : null;

export interface ResultatEvaluation {
  decision: "promouvoir" | "neutre" | "bannir";
  score_culturel: number; // 0 à 100
  raison_joual: string;
}

/**
 * 2. La fonction principale d'évaluation
 * @param uri_video_gcs URI de type gs://bucket-name/video.mp4
 */
export async function evaluerPublication(
  uri_video_gcs: string,
): Promise<ResultatEvaluation> {
  if (!modele_vision) {
    return {
      decision: "neutre",
      score_culturel: 50,
      raison_joual: "Vertex AI non initialisé.",
    };
  }

  try {
    const prompt_systeme = `
            Tu es l'Abeille Visuelle de Zyeuté, le réseau social québécois. 
            Analyse cette vidéo (images et audio).
            
            Critères d'évaluation :
            1. Authenticité Québécoise : Parlent-ils en "Joual" ? Y a-t-il des références culturelles du Québec ?
            2. Esthétique : La vidéo a-t-elle une bonne qualité visuelle ou correspond-elle à notre style "Souverain" (luxe, cuir, or) ?
            3. Sécurité : Rejette immédiatement tout contenu toxique, violent ou spam.

            Tu dois retourner un objet JSON exact avec cette structure :
            {
              "decision": "promouvoir" | "neutre" | "bannir",
              "score_culturel": entier entre 0 et 100,
              "raison_joual": "Explication courte en français de ton choix"
            }
            
            - Si le score est > 85, la décision DOIT être "promouvoir".
            - Si la vidéo viole les règles, la décision DOIT être "bannir".
        `;

    const requete = {
      contents: [
        {
          role: "user",
          parts: [
            { fileData: { mimeType: "video/mp4", fileUri: uri_video_gcs } },
            { text: prompt_systeme },
          ],
        },
      ],
    };

    const reponse = await modele_vision.generateContent(requete);
    const texte_resultat =
      reponse.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texte_resultat) {
      throw new Error("Le modèle n'a rien retourné.");
    }

    // 3. Retourner le verdict formaté
    const verdict: ResultatEvaluation = JSON.parse(texte_resultat);
    console.log(`[Abeille Visuelle] Verdict pour ${uri_video_gcs}:`, verdict);

    return verdict;
  } catch (erreur) {
    console.error("Erreur lors de l'évaluation vidéo Vertex AI:", erreur);
    // Fallback de sécurité
    return {
      decision: "neutre",
      score_culturel: 50,
      raison_joual: "Échec de l'analyse, mis en quarantaine neutre.",
    };
  }
}
