/**
 * Ti-Guy Persistent Memory
 *
 * One compact summary row per user in `tiguy_memory`.
 * - readMemory(userId)   → returns the summary string (empty string if none yet)
 * - compactMemory(...)   → called async after each reply; asks DeepSeek to
 *                          merge the new exchange into the existing summary,
 *                          keeping it under MAX_SUMMARY_CHARS.
 *
 * The compaction prompt is intentionally lightweight — a single small
 * DeepSeek call that runs in the background after the user already got
 * their reply, so latency is zero.
 */

import { supabaseAdmin } from "../supabase-auth.js";

const MAX_SUMMARY_CHARS = 800;
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

// ─── Read ────────────────────────────────────────────────────────────────────

export async function readMemory(userId: string): Promise<string> {
  if (!supabaseAdmin) return "";
  try {
    const { data, error } = await supabaseAdmin
      .from("tiguy_memory")
      .select("summary")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[TI-GUY MEMORY] read error:", error.message);
      return "";
    }
    return data?.summary ?? "";
  } catch (err) {
    console.warn("[TI-GUY MEMORY] read exception:", err);
    return "";
  }
}

// ─── Compact & Save (runs async — never awaited by chat handler) ─────────────

export async function compactMemory(
  userId: string,
  existingSummary: string,
  userMessage: string,
  tiGuyReply: string,
): Promise<void> {
  try {
    const compactPrompt = `Tu es un assistant qui maintient un résumé compact de la mémoire d'un utilisateur pour Ti-Guy, l'IA de Zyeuté.

RÉSUMÉ ACTUEL (peut être vide si c'est la première conversation):
${existingSummary || "(aucun résumé pour l'instant)"}

NOUVEL ÉCHANGE:
Utilisateur: ${userMessage.slice(0, 400)}
Ti-Guy: ${tiGuyReply.slice(0, 400)}

Mets à jour le résumé en y intégrant les nouvelles informations pertinentes sur l'utilisateur: ses préférences, ses projets, ses goûts, son style de contenu, ce dont il a parlé, ce qu'il a demandé à Ti-Guy. 

RÈGLES STRICTES:
- Maximum ${MAX_SUMMARY_CHARS} caractères au total
- Écris en français, style télégraphique (pas de phrases complètes inutiles)
- Garde seulement les faits durables et utiles pour les prochaines conversations
- Supprime les détails dépassés ou redondants
- NE réponds PAS à l'échange — résume seulement
- Retourne UNIQUEMENT le résumé mis à jour, rien d'autre`;

    let newSummary = existingSummary;

    if (process.env.DEEPSEEK_API_KEY) {
      const response = await fetch(DEEPSEEK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: compactPrompt }],
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) newSummary = text.slice(0, MAX_SUMMARY_CHARS);
      }
    } else {
      // No DeepSeek key — do a simple append/truncate without AI compaction
      const appended =
        `${existingSummary}\n• ${userMessage.slice(0, 120)}`.trim();
      newSummary = appended.slice(-MAX_SUMMARY_CHARS);
    }

    // Upsert into tiguy_memory
    if (!supabaseAdmin) return;
    await supabaseAdmin.from("tiguy_memory").upsert(
      {
        user_id: userId,
        summary: newSummary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    // Increment turn_count
    await supabaseAdmin
      .rpc("increment_tiguy_turns", { p_user_id: userId })
      .throwOnError()
      .then(
        () => {},
        () => {
          // RPC doesn't exist yet — silently ignore, turn_count is cosmetic
        },
      );
  } catch (err) {
    // Memory compaction is best-effort — never crash the chat
    console.warn("[TI-GUY MEMORY] compact error:", err);
  }
}
