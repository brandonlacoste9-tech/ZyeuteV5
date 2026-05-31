/**
 * Content Moderation Service
 * Uses DeepSeek for text moderation + Gemini Flash for video frame analysis
 */

import { deepseek } from "../ai/deepseek.js";
import { supabaseAdmin } from "../supabase-auth.js";

export interface ModerationResult {
  severity: "safe" | "low" | "medium" | "high" | "critical";
  categories: string[];
  confidence: number;
  reason: string;
  action: "none" | "flag" | "auto_remove" | "escalate";
  flagged: boolean;
}

const MODERATION_PROMPT = `Tu es un modérateur de contenu strict pour Zyeute, une app sociale québécoise.
Analyse le texte et retourne UNIQUEMENT un JSON valide sans markdown:
{
  "safe": boolean,
  "severity": "safe" | "low" | "medium" | "high" | "critical",
  "categories": [],
  "confidence": number (0-100),
  "reason": "explication courte en français"
}

Catégories possibles: "haine", "harcèlement", "menace", "violence", "contenu_sexuel", "csam", "automutilation", "spam", "intimidation"

RÈGLES STRICTES:
- "critical" si contenu impliquant des mineurs de manière sexuelle (CSAM) — toujours signaler
- "critical" si menaces de mort ou violence graphique extrême
- "high" si harcèlement direct, haine ciblée, contenu sexuel explicite
- "medium" si insultes graves, intimidation, contenu choquant
- "low" si langage vulgaire léger, contenu ambigu
- "safe" si contenu normal (le joual québécois et sacres légers = safe)
Retourne SEULEMENT le JSON.`;

/**
 * Moderate text content (captions, comments, DMs, bios) using DeepSeek
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
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: MODERATION_PROMPT },
        {
          role: "user",
          content: `Texte à analyser: "${text.substring(0, 1000)}"`,
        },
      ],
      temperature: 0,
      max_tokens: 256,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
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
          : parsed.severity === "medium" || parsed.severity === "low"
            ? "flag"
            : "none";

    return {
      severity: parsed.severity || "safe",
      categories: parsed.categories || [],
      confidence: parsed.confidence || 0,
      reason: parsed.reason || "Analyse complétée",
      action,
      flagged: !parsed.safe,
    };
  } catch (error: any) {
    console.error(
      "[Moderation] DeepSeek text moderation error:",
      error.message,
    );
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
 */
export async function moderateVideoFrame(
  frameUrl: string,
): Promise<ModerationResult> {
  try {
    const apiKey =
      process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
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

    const imgResponse = await fetch(frameUrl);
    if (!imgResponse.ok) {
      return {
        severity: "safe",
        categories: [],
        confidence: 0,
        reason: "Image inaccessible",
        action: "none",
        flagged: false,
      };
    }
    const buffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = imgResponse.headers.get("content-type") || "image/jpeg";

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
  "categories": ["haine","violence","contenu_sexuel","csam","nudité","automutilation"],
  "confidence": number (0-100),
  "reason": "explication courte en français"
}
RÈGLES: critical si CSAM ou violence extrême, high si nudité adulte explicite, medium si choquant, low si ambigu.
Retourne SEULEMENT le JSON.`,
                },
                { inline_data: { mime_type: mimeType, data: base64 } },
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
          : parsed.severity === "medium" || parsed.severity === "low"
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
        content_text: params.contentText?.substring(0, 500) || null,
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
