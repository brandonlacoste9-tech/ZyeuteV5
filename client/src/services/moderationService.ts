/**
 * AI Content Moderation Service
 * Uses OpenAI GPT-4o for Quebec-aware content moderation
 */

import { logger } from '@/lib/logger';
const moderationServiceLogger = logger.withContext('ModerationService');
import { supabase } from '../lib/supabase';

// API Keys
const deepSeekKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

export type ModerationSeverity = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type ModerationAction = 'allow' | 'flag' | 'hide' | 'remove' | 'ban';
export type ModerationCategory =
  | 'bullying'
  | 'hate_speech'
  | 'harassment'
  | 'violence'
  | 'spam'
  | 'nsfw'
  | 'illegal'
  | 'self_harm';

export interface ModerationResult {
  is_safe: boolean;
  severity: ModerationSeverity;
  categories: ModerationCategory[];
  confidence: number;
  reason: string;
  action: ModerationAction;
  context_note?: string;
}

const MODERATION_PROMPT = `Tu es un modérateur IA pour Zyeuté, plateforme sociale québécoise.

CONTEXTE CULTUREL QUÉBÉCOIS:
✅ ACCEPTER:
- Joual et expressions colorées ("crisse", "tabarnak", "câlisse", "ostie")
- Humour grinçant et sarcasme québécois
- Débats politiques passionnés (souveraineté, langue française)
- Critique sociale constructive
- Références culturelles locales (Ti-Guy, poutine, etc.)
- Blagues entre amis et taquineries amicales
- Expressions comme "malade", "sick", "en feu" (positif)

❌ BLOQUER:
1. INTIMIDATION:
   - Attaques personnelles répétées et ciblées
   - Moqueries sur apparence physique/poids/orientation
   - Harcèlement persistant
   - Menaces directes ou voilées

2. DISCOURS HAINEUX:
   - Racisme, sexisme, homophobie, transphobie
   - Xénophobie, discrimination religieuse
   - Suprémacisme blanc ou autre
   - Négation de génocides
   - Appels à la violence contre groupes

3. HARCÈLEMENT SEXUEL:
   - Messages sexuels non sollicités
   - Commentaires déplacés sur le corps
   - Demandes inappropriées
   - Partage d'images intimes sans consentement

4. VIOLENCE:
   - Menaces de violence physique
   - Incitation à l'automutilation ou suicide
   - Glorification de violence ou terrorisme
   - Instructions pour armes/explosifs

5. CONTENU ILLÉGAL:
   - Exploitation de mineurs (TOLÉRANCE ZÉRO)
   - Vente de drogues illégales
   - Activités criminelles
   - Contenu piraté ou volé

6. SPAM:
   - Liens malveillants répétés
   - Publicité excessive non sollicitée
   - Chaînes de lettres
   - Comportement de bot

NIVEAUX DE SÉVÉRITÉ:
- safe: Contenu OK, aucune action requise
- low: Borderline, flag pour révision humaine mais publier
- medium: Problématique, cacher du trending, révision nécessaire
- high: Violation claire, supprimer + avertissement utilisateur
- critical: Violation grave, supprimer + ban temporaire/permanent

RÉPONSE (JSON STRICT, AUCUN TEXTE AVANT OU APRÈS):
{
  "is_safe": boolean,
  "severity": "safe" | "low" | "medium" | "high" | "critical",
  "categories": ["bullying", "hate_speech", "harassment", "violence", "spam", "nsfw", "illegal", "self_harm"],
  "confidence": 0-100,
  "reason": "Explication claire en français du Québec",
  "action": "allow" | "flag" | "hide" | "remove" | "ban",
  "context_note": "Note sur le contexte culturel québécois si pertinent"
}

Analyse ce contenu:`;

/**
 * Analyze text content for violations
 */
export async function analyzeText(text: string): Promise<ModerationResult> {
  try {
    if (!text || text.trim().length === 0) {
      return {
        is_safe: true,
        severity: 'safe',
        categories: [],
        confidence: 100,
        reason: 'Contenu vide',
        action: 'allow',
      };
    }

    if (!deepSeekKey) {
      moderationServiceLogger.warn('⚠️ No DeepSeek API Key. Skipping moderation.');
      return { is_safe: true, severity: 'safe', categories: [], confidence: 0, reason: 'Modération inactive', action: 'allow' };
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepSeekKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: MODERATION_PROMPT },
          { role: "user", content: `TEXTE: "${text}"` }
        ],
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) throw new Error(`DeepSeek API error: ${response.status}`);
    
    const data = await response.json();
    const resultText = data.choices[0].message.content;
    if (!resultText) throw new Error("No response from DeepSeek");

    const moderationResult: ModerationResult = JSON.parse(resultText);
    return moderationResult;

  } catch (error) {
    moderationServiceLogger.error('Error in analyzeText:', error);
    // Fail open - allow content if moderation fails
    return {
      is_safe: true,
      severity: 'safe',
      categories: [],
      confidence: 0,
      reason: 'Erreur du système de modération',
      action: 'allow',
      context_note: 'Service de modération temporairement indisponible',
    };
  }
}

/**
 * Analyze image content using OpenAI Vision
 */
export async function analyzeImage(imageUrl: string): Promise<ModerationResult> {
  try {
    if (!openaiKey) {
      moderationServiceLogger.warn('⚠️ No OpenAI API Key for Vision. Skipping image moderation.');
      return { is_safe: true, severity: 'safe', categories: [], confidence: 0, reason: 'Modération image inactive', action: 'allow' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: MODERATION_PROMPT },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Analyse cette image pour détecter: Nudité, violence, haine, drogues, armes." },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 300,
      })
    });

    if (!response.ok) throw new Error(`OpenAI Vision API error: ${response.status}`);

    const data = await response.json();
    const resultText = data.choices[0].message.content || "{}";
    // Cleanup JSON if needed (sometimes model adds markdown)
    const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const moderationResult: ModerationResult = JSON.parse(cleanJson);
      return moderationResult;
    } catch (e) {
      moderationServiceLogger.error("Failed to parse JSON from vision response", resultText);
      return { is_safe: true, severity: 'safe', categories: [], confidence: 50, reason: 'Analyse incertaine', action: 'allow' };
    }

  } catch (error) {
    moderationServiceLogger.error('Error in analyzeImage:', error);
    return {
      is_safe: true,
      severity: 'safe',
      categories: [],
      confidence: 0,
      reason: 'Erreur d\'analyse d\'image',
      action: 'allow',
    };
  }
}

/**
 * Analyze video content (analyze key frames)
 */
export async function analyzeVideo(videoUrl: string): Promise<ModerationResult> {
  try {
    // For now, return safe (video analysis requires frame extraction)
    // TODO: Implement frame extraction and analysis
    moderationServiceLogger.debug('Video analysis not yet implemented:', videoUrl);
    
    return {
      is_safe: true,
      severity: 'safe',
      categories: [],
      confidence: 50,
      reason: 'Analyse vidéo en développement',
      action: 'allow',
      context_note: 'L\'analyse complète des vidéos arrive bientôt',
    };
  } catch (error) {
    moderationServiceLogger.error('Error in analyzeVideo:', error);
    return {
      is_safe: true,
      severity: 'safe',
      categories: [],
      confidence: 0,
      reason: 'Erreur d\'analyse vidéo',
      action: 'allow',
    };
  }
}

/**
 * Universal content moderation function
 */
export async function moderateContent(
  content: { text?: string; imageUrl?: string; videoUrl?: string },
  contentType: 'post' | 'comment' | 'bio' | 'message',
  userId: string,
  contentId?: string
): Promise<ModerationResult> {
  try {
    let result: ModerationResult;

    // Analyze based on content type
    if (content.text) {
      result = await analyzeText(content.text);
    } else if (content.imageUrl) {
      result = await analyzeImage(content.imageUrl);
    } else if (content.videoUrl) {
      result = await analyzeVideo(content.videoUrl);
    } else {
      return {
        is_safe: true,
        severity: 'safe',
        categories: [],
        confidence: 100,
        reason: 'Aucun contenu à analyser',
        action: 'allow',
      };
    }

    // Log moderation result
    if (contentId) {
      await logModeration(contentType, contentId, userId, result);
    }

    // Take automatic action based on severity
    if (result.severity === 'high' || result.severity === 'critical') {
      await handleViolation(userId, result);
    }

    return result;
  } catch (error) {
    moderationServiceLogger.error('Error in moderateContent:', error);
    return {
      is_safe: true,
      severity: 'safe',
      categories: [],
      confidence: 0,
      reason: 'Erreur de modération',
      action: 'allow',
    };
  }
}

/**
 * Log moderation result to database
 */
async function logModeration(
  contentType: string,
  contentId: string,
  userId: string,
  result: ModerationResult
): Promise<void> {
  try {
    await supabase.from('moderation_logs').insert({
      content_type: contentType,
      content_id: contentId,
      user_id: userId,
      ai_severity: result.severity,
      ai_categories: result.categories,
      ai_confidence: result.confidence,
      ai_reason: result.reason,
      ai_action: result.action,
      status: result.action === 'allow' ? 'approved' : 'pending',
    });
  } catch (error) {
    moderationServiceLogger.error('Error logging moderation:', error);
  }
}

/**
 * Handle content violation (add strike, ban if needed)
 */
async function handleViolation(
  userId: string,
  result: ModerationResult
): Promise<void> {
  try {
    // Get current user strikes
    const { data: strikeData } = await supabase
      .from('user_strikes')
      .select('*')
      .eq('user_id', userId)
      .single();

    const currentStrikes = strikeData?.strike_count || 0;
    const newStrikeCount = currentStrikes + 1;

    const newStrike = {
      date: new Date().toISOString(),
      reason: result.reason,
      severity: result.severity,
      categories: result.categories,
    };

    // Determine ban duration
    let banUntil = null;
    let isPermanentBan = false;

    if (newStrikeCount === 2) {
      // 24 hour ban
      banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (newStrikeCount === 3) {
      // 7 day ban
      banUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (newStrikeCount === 4) {
      // 30 day ban
      banUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (newStrikeCount >= 5) {
      // Permanent ban
      isPermanentBan = true;
    }

    // Update or create strike record
    if (strikeData) {
      const strikes = [...(strikeData.strikes || []), newStrike];
      
      await supabase
        .from('user_strikes')
        .update({
          strike_count: newStrikeCount,
          strikes,
          ban_until: banUntil,
          is_permanent_ban: isPermanentBan,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      await supabase.from('user_strikes').insert({
        user_id: userId,
        strike_count: newStrikeCount,
        strikes: [newStrike],
        ban_until: banUntil,
        is_permanent_ban: isPermanentBan,
      });
    }

    // Create notification for user
    let notificationMessage = `⚠️ Avertissement ${newStrikeCount}/5: ${result.reason}`;
    
    if (newStrikeCount === 2) {
      notificationMessage += ' | Suspension 24h';
    } else if (newStrikeCount === 3) {
      notificationMessage += ' | Suspension 7 jours';
    } else if (newStrikeCount === 4) {
      notificationMessage += ' | Suspension 30 jours';
    } else if (newStrikeCount >= 5) {
      notificationMessage += ' | Bannissement permanent';
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'system',
      message: notificationMessage,
    });
  } catch (error) {
    moderationServiceLogger.error('Error handling violation:', error);
  }
}

/**
 * Check if user is currently banned
 */
export async function isUserBanned(userId: string): Promise<{
  isBanned: boolean;
  reason?: string;
  until?: string;
}> {
  try {
    const { data } = await supabase
      .from('user_strikes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) {
      return { isBanned: false };
    }

    if (data.is_permanent_ban) {
      return {
        isBanned: true,
        reason: 'Bannissement permanent pour violations répétées',
      };
    }

    if (data.ban_until) {
      const banUntil = new Date(data.ban_until);
      if (banUntil > new Date()) {
        return {
          isBanned: true,
          reason: 'Suspension temporaire',
          until: data.ban_until,
        };
      }
    }

    return { isBanned: false };
  } catch (error) {
    moderationServiceLogger.error('Error checking ban status:', error);
    return { isBanned: false };
  }
}

export default {
  analyzeText,
  analyzeImage,
  analyzeVideo,
  moderateContent,
  isUserBanned,
};
