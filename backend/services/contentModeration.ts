/**
 * Content Moderation Service
 * Uses OpenAI Moderation API (free) for text + Gemini Flash for video frames
 */

import OpenAI from "openai";
import { supabaseAdmin } from "../supabase-auth.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ModerationResult {
  severity: "safe" | "low" | "medium" | "high" | "critical";
  categories: string[];
  confidence: number;
  reason: string;
  action: "none" | "flag" | "auto_remove" | "escalate";
  flagged: boolean;
}

/**
 * Moderate text content (captions, comments, DMs, bios)
 * Uses OpenAI Moderation API — free tier, very reliable
 */
export async function moderateText(text: string): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return {
      severity: "safe",
      categories: [],
      confidence: 100,
      reason: "Contenu vide",
      action: "none",
      flagged: false,
    };
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[Moderation] No OPENAI_API_KEY — skipping text moderation");
      return {
        severity: "safe",
        categories: [],
        confidence: 0,
        reason: "Service non configuré",
        action: "none",
        flagged: false,
      };
    }

    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    const result = response.results[0];
    const flaggedCategories: string[] = [];

    // Map OpenAI categories to our system
    const categoryMap: Record<string, string> = {
      hate: "haine",
      "hate/threatening": "haine_menace",
      harassment: "harcèlement",
      "harassment/threatening": "harcèlement_menace",
      "self-harm": "automutilation",
      "self-harm/intent": "automutilation_intention",
      "self-harm/instructions": "automutilation_instructions",
      sexual: "contenu_sexuel",
      "sexual/minors": "csam",
      violence: "violence",
      "violence/graphic": "violence_graphique",
      illicit: "illicite",
      "illicit/violent": "illicite_violent",
    };

    let maxScore = 0;
    for (const [category, score] of Object.entries(
      result.category_scores as Record<string, number>,
    )) {
      if (score > 0.1) {
        flaggedCategories.push(categoryMap[category] || category);
      }
      if (score > maxScore) maxScore = score;
    }

    // CSAM = always critical + auto_remove
    if ((result.categories as Record<string, boolean>)["sexual/minors"]) {
      return {
        severity: "critical",
        categories: ["csam"],
        confidence: 100,
        reason:
          "Contenu impliquant des mineurs détecté — suppression automatique",
        action: "auto_remove",
        flagged: true,
      };
    }

    if (!result.flagged && maxScore < 0.3) {
      return {
        severity: "safe",
        categories: [],
        confidence: Math.round((1 - maxScore) * 100),
        reason: "Contenu approuvé",
        action: "none",
        flagged: false,
      };
    }

    // Determine severity from score
    let severity: ModerationResult["severity"];
    let action: ModerationResult["action"];
    if (maxScore >= 0.9) {
      severity = "critical";
      action = "auto_remove";
    } else if (maxScore >= 0.7) {
      severity = "high";
      action = "escalate";
    } else if (maxScore >= 0.5) {
      severity = "medium";
      action = "flag";
    } else if (maxScore >= 0.3) {
      severity = "low";
      action = "flag";
    } else {
      severity = "safe";
      action = "none";
    }

    return {
      severity,
      categories:
        flaggedCategories.length > 0
          ? flaggedCategories
          : ["contenu_inapproprié"],
      confidence: Math.round(maxScore * 100),
      reason: `Contenu potentiellement problématique: ${flaggedCategories.join(", ") || "contenu inapproprié"}`,
      action,
      flagged: result.flagged || maxScore >= 0.3,
    };
  } catch (error: any) {
    console.error("[Moderation] OpenAI text moderation error:", error.message);
    // Fail open — don't block users if moderation is down
    return {
      severity: "safe",
      categories: [],
      confidence: 0,
      reason: "Service indisponible",
      action: "none",
      flagged: false,
    };
  }
}

/**
 * Moderate a video thumbnail/frame using Gemini Flash vision
 * Called with a public URL of a video frame or thumbnail
 */
export async function moderateVideoFrame(
  frameUrl: string,
): Promise<ModerationResult> {
  try {
    if (!process.env.GOOGLE_API_KEY && !process.env.VITE_GEMINI_API_KEY) {
      console.warn("[Moderation] No Gemini key — skipping frame moderation");
      return {
        severity: "safe",
        categories: [],
        confidence: 0,
        reason: "Service non configuré",
        action: "none",
        flagged: false,
      };
    }

    const apiKey =
      process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;

    // Fetch the image as base64
    const response = await fetch(frameUrl);
    if (!response.ok) {
      return {
        severity: "safe",
        categories: [],
        confidence: 0,
        reason: "Image inaccessible",
        action: "none",
        flagged: false,
      };
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/jpeg";

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Tu es un modérateur de contenu pour Zyeute, une app sociale québécoise. 
Analyse cette image et retourne UNIQUEMENT un JSON valide:
{
  "safe": boolean,
  "severity": "safe" | "low" | "medium" | "high" | "critical",
  "categories": ["haine", "violence", "contenu_sexuel", "csam", "nudité", "automutilation"],
  "confidence": number (0-100),
  "reason": "explication courte en français"
}

RÈGLES STRICTES:
- "critical" + "csam" si enfants en situation sexuelle (toujours signaler)
- "critical" si violence graphique extrême
- "high" si nudité adulte explicite
- "medium" si contenu violent ou choquant
- "low" si contenu ambigu
- "safe" si contenu normal
Retourne SEULEMENT le JSON, rien d'autre.`,
                },
                {
                  inline_data: { mime_type: mimeType, data: base64 },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 256 },
        }),
      },
    );

    const geminiData = (await geminiResponse.json()) as any;
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        severity: "safe",
        categories: [],
        confidence: 0,
        reason: "Analyse impossible",
        action: "none",
        flagged: false,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const action: ModerationResult["action"] =
      parsed.severity === "critical"
        ? "auto_remove"
        : parsed.severity === "high"
          ? "escalate"
          : parsed.severity === "medium"
            ? "flag"
            : parsed.severity === "low"
              ? "flag"
              : "none";

    return {
      severity: parsed.severity || "safe",
      categories: parsed.categories || [],
      confidence: parsed.confidence || 0,
      reason: parsed.reason || "Analyse visuelle complétée",
      action,
      flagged: !parsed.safe,
    };
  } catch (error: any) {
    console.error("[Moderation] Video frame moderation error:", error.message);
    return {
      severity: "safe",
      categories: [],
      confidence: 0,
      reason: "Erreur d'analyse visuelle",
      action: "none",
      flagged: false,
    };
  }
}

/**
 * Save a moderation result to the database
 */
export async function saveModerationLog(params: {
  contentType: "post" | "comment" | "message" | "bio";
  contentId: string;
  userId: string;
  reporterId?: string;
  result: ModerationResult;
  contentText?: string;
  reportReason?: string;
}): Promise<string | null> {
  if (!supabaseAdmin) {
    console.error("[Moderation] supabaseAdmin not initialized");
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("moderation_logs")
      .insert({
        content_type: params.contentType,
        content_id: params.contentId,
        user_id: params.userId,
        reporter_id: params.reporterId || null,
        ai_severity: params.result.severity,
        ai_categories: params.result.categories,
        ai_confidence: params.result.confidence,
        ai_reason: params.result.reason,
        ai_action: params.result.action,
        status: params.result.action === "auto_remove" ? "removed" : "pending",
        content_text: params.contentText || null,
        report_reason: params.reportReason || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Moderation] Error saving log:", error);
      return null;
    }

    return data.id;
  } catch (err: any) {
    console.error("[Moderation] Save log error:", err.message);
    return null;
  }
}

/**
 * Auto-remove content if severity is critical
 */
export async function autoRemoveContent(
  contentType: "post" | "comment" | "message",
  contentId: string,
): Promise<void> {
  if (!supabaseAdmin) return;

  try {
    if (contentType === "post") {
      await supabaseAdmin
        .from("publications")
        .update({
          est_masque: true,
          is_moderated: true,
          moderation_approved: false,
        })
        .eq("id", contentId);
    } else if (contentType === "comment") {
      await supabaseAdmin.from("commentaires").delete().eq("id", contentId);
    } else if (contentType === "message") {
      await supabaseAdmin
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", contentId);
    }
    console.log(`[Moderation] Auto-removed ${contentType} ${contentId}`);
  } catch (err: any) {
    console.error("[Moderation] Auto-remove error:", err.message);
  }
}
