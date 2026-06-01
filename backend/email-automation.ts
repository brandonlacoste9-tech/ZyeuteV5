/**
 * Zyeuté Email Automation System
 *
 * Handles automated emails with React Email templates in Ti-Guy's joual voice:
 * - Welcome email on signup
 * - Onboarding sequence (3 emails over 7 days)
 * - Weekly digest
 * - Upgrade prompts
 * - Re-engagement emails
 *
 * Uses Resend integration for email delivery
 */

import { deepseek } from "./ai/deepseek.js";
import { storage } from "./storage.js";
import { sendEmail } from "./resend-client.js";
import { renderEmail, EmailType as ReactEmailType } from "./email-templates.js";

// Email automation configuration
export const EMAIL_CONFIG = {
  appUrl: process.env.APP_URL || "https://zyeute.com",
  fromEmail: "Ti-Guy <tiguy@zyeute.com>",
  replyTo: "support@zyeute.com",

  // Timing for onboarding sequence
  onboarding: {
    day1Delay: 24 * 60 * 60 * 1000, // 24 hours
    day3Delay: 3 * 24 * 60 * 60 * 1000, // 3 days
    day7Delay: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Re-engagement threshold
  inactiveDaysThreshold: 7,

  // Weekly digest day (0 = Sunday)
  digestDay: 0,

  // Free tier limits
  maxFreeAiGenerations: 10,
};

// Email types
export type EmailType =
  | "welcome"
  | "onboarding_day1"
  | "onboarding_day3"
  | "onboarding_day7"
  | "weekly_digest"
  | "upgrade_prompt"
  | "reengagement";

// Email queue entry
export interface QueuedEmail {
  id: string;
  userId: string;
  emailType: EmailType;
  scheduledFor: Date;
  sentAt?: Date;
  status: "pending" | "sent" | "failed" | "cancelled";
  metadata?: Record<string, unknown>;
}

// In-memory email queue (in production, use database)
const emailQueue: QueuedEmail[] = [];

/**
 * Generate personalized email content using DeepSeek in joual voice
 */
export async function generatePersonalizedContent(
  emailType: EmailType,
  username: string,
  context?: Record<string, unknown>,
): Promise<{ subject: string; content: string }> {
  const systemPrompt = `Tu es Ti-Guy, le castor mascotte de Zyeuté, l'app sociale du Québec.
Tu écris des courriels dans un style joual authentique et chaleureux:
- Utilise "tu" (informel)
- Expressions joual naturelles: icitte, ben, faque, pis, là-là
- Ton chaleureux et encourageant
- Langage inclusif (pas de suppositions genrées)
- Fierté locale sans être exclusif
- Personnalité enjouée avec des emojis appropriés

Garde le message concis mais engageant. Maximum 3-4 paragraphes courts.`;

  // Build context-aware prompts with fallback values
  const stats =
    (context?.stats as {
      firesReceived?: number;
      firesGiven?: number;
      newFollowers?: number;
      postsCreated?: number;
    }) || {};
  const aiUsed =
    typeof context?.aiGenerationsUsed === "number"
      ? context.aiGenerationsUsed
      : 0;
  const daysInactive =
    typeof context?.daysSinceLastVisit === "number"
      ? context.daysSinceLastVisit
      : 7;

  const statsText =
    stats.firesReceived !== undefined
      ? `feux reçus: ${stats.firesReceived}, feux donnés: ${stats.firesGiven || 0}, nouveaux abonnés: ${stats.newFollowers || 0}, posts créés: ${stats.postsCreated || 0}`
      : "activité normale cette semaine";

  const prompts: Record<EmailType, string> = {
    welcome: `Écris un courriel de bienvenue pour ${username} qui vient de s'inscrire sur Zyeuté. 
Présente-toi (Ti-Guy), explique brièvement ce qu'est Zyeuté (app sociale québécoise), 
et encourage-les à explorer.`,

    onboarding_day1: `Écris un courriel pour ${username} (jour 1 après inscription).
Présente Ti-Guy Studio - notre outil de création d'images AI.
Explique comment ça marche en 3-4 étapes simples.`,

    onboarding_day3: `Écris un courriel pour ${username} (jour 3 après inscription).
Explique notre système de 🔥 Feux (on remplace les likes par des feux).
Pourquoi des feux? Parce qu'au Québec on dit "c'est en feu" quand c'est hot!`,

    onboarding_day7: `Écris un courriel pour ${username} qui est avec nous depuis une semaine.
Remercie-les, mentionne subtilement nos plans Premium (Bronze 4.99$, Argent 9.99$, Or 19.99$)
sans être pushy.`,

    weekly_digest: `Écris un courriel de résumé hebdomadaire pour ${username}.
Stats de la semaine: ${statsText}.
Encourage-les selon leur activité.`,

    upgrade_prompt: `Écris un courriel pour ${username} qui a utilisé ${aiUsed} de leurs ${EMAIL_CONFIG.maxFreeAiGenerations} générations AI gratuites.
Présente Creator Pro (9.99$/mois) avec ses avantages: 500 images, 30 vidéos, badge vérifié.
Ton doux, pas agressif.`,

    reengagement: `Écris un courriel pour ${username} qu'on n'a pas vu depuis ${daysInactive} jours.
Dis qu'on s'ennuie d'eux, mentionne qu'il y a du nouveau contenu.
Invite-les à revenir.`,
  };

  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-v4-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            prompts[emailType] +
            '\n\nRéponds en JSON: {"subject": "...", "content": "..."}',
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || "";

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        subject: parsed.subject || `Hey ${username}!`,
        content: parsed.content || text,
      };
    }

    // Fallback if JSON parsing fails
    return {
      subject: `Hey ${username}! 🦫`,
      content: text,
    };
  } catch (error) {
    console.error("[Email] DeepSeek generation failed:", error);

    // Return fallback content
    return getFallbackContent(emailType, username);
  }
}

/**
 * Fallback content if AI generation fails
 */
function getFallbackContent(
  emailType: EmailType,
  username: string,
): { subject: string; content: string } {
  const fallbacks: Record<EmailType, { subject: string; content: string }> = {
    welcome: {
      subject: `Bienvenue dans la gang, ${username}! 🦫🔥`,
      content: `Allô ${username}! C'est Ti-Guy! Content que tu sois là! Zyeuté, c'est l'app sociale du Québec. Icitte, on partage nos moments pis on se donne des 🔥 au lieu des likes. Viens faire un tour!`,
    },
    onboarding_day1: {
      subject: `${username}, as-tu essayé Ti-Guy Studio? 🎨`,
      content: `Hey ${username}! J'espère que tu t'installes ben! Aujourd'hui, je voulais te parler de Ti-Guy Studio. C'est mon petit coin création où tu peux faire des images avec l'IA. Tu décris ce que tu veux, pis pouf! Une image apparaît. Essaye-le!`,
    },
    onboarding_day3: {
      subject: `🔥 Comment les feux marchent sur Zyeuté`,
      content: `Salut ${username}! T'as peut-être remarqué qu'on a pas de "likes" icitte. À place, on donne des 🔥 Feux! Pourquoi? Ben, au Québec, on dit "c'est en feu" quand c'est hot! Faque c'était parfait. Vas-y, donne des feux au monde!`,
    },
    onboarding_day7: {
      subject: `Une semaine sur Zyeuté! 🎉 Merci ${username}`,
      content: `Hey ${username}, ça fait une semaine que t'es avec nous autres! Merci d'être là 🧡 Si t'aimes l'app pis tu veux nous supporter, check nos plans Premium. C'est pas obligatoire, mais c'est une belle façon de nous encourager!`,
    },
    weekly_digest: {
      subject: `Ta semaine sur Zyeuté, ${username} 📊`,
      content: `Salut ${username}! Voici ce qui s'est passé pour toi cette semaine. Continue comme ça, ton contenu fait réagir du monde!`,
    },
    upgrade_prompt: {
      subject: `${username}, débloque Ti-Guy Studio Pro! 🚀`,
      content: `Hey ${username}! J'ai vu que t'aimes créer avec l'IA. Si tu veux continuer sans limites, Creator Pro c'est fait pour toi! 9.99$/mois pour 500 images, 30 vidéos AI, pis un badge vérifié!`,
    },
    reengagement: {
      subject: `${username}, on s'ennuie de toi! 🦫`,
      content: `Allô ${username}! Ça fait un bout qu'on t'a pas vu! Ti-Guy s'ennuie de toi! Y'a eu plein de belles affaires sur Zyeuté. Viens voir ce qui se passe, on t'attend!`,
    },
  };

  return fallbacks[emailType];
}

/**
 * Queue an email for sending
 */
export function queueEmail(
  userId: string,
  emailType: EmailType,
  scheduledFor: Date,
  metadata?: Record<string, unknown>,
): QueuedEmail {
  const email: QueuedEmail = {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    emailType,
    scheduledFor,
    status: "pending",
    metadata,
  };

  emailQueue.push(email);
  console.log(
    `[Email] Queued ${emailType} for user ${userId} at ${scheduledFor.toISOString()}`,
  );

  return email;
}

/**
 * Cancel pending emails for a user
 */
export function cancelPendingEmails(
  userId: string,
  emailType?: EmailType,
): number {
  let cancelled = 0;

  emailQueue.forEach((email) => {
    if (email.userId === userId && email.status === "pending") {
      if (!emailType || email.emailType === emailType) {
        email.status = "cancelled";
        cancelled++;
      }
    }
  });

  console.log(
    `[Email] Cancelled ${cancelled} pending emails for user ${userId}`,
  );
  return cancelled;
}

/**
 * Schedule welcome + onboarding sequence for new user
 */
export function scheduleOnboardingSequence(userId: string): void {
  const now = new Date();

  // Welcome email - immediate
  queueEmail(userId, "welcome", now);

  // Day 1 - Ti-Guy Studio intro
  queueEmail(
    userId,
    "onboarding_day1",
    new Date(now.getTime() + EMAIL_CONFIG.onboarding.day1Delay),
  );

  // Day 3 - Fire reactions
  queueEmail(
    userId,
    "onboarding_day3",
    new Date(now.getTime() + EMAIL_CONFIG.onboarding.day3Delay),
  );

  // Day 7 - Premium soft pitch
  queueEmail(
    userId,
    "onboarding_day7",
    new Date(now.getTime() + EMAIL_CONFIG.onboarding.day7Delay),
  );

  console.log(`[Email] Scheduled onboarding sequence for user ${userId}`);
}

/**
 * Check and queue upgrade prompts based on AI usage
 */
export async function checkUpgradePromptEligibility(
  userId: string,
): Promise<boolean> {
  try {
    // Check if user has used significant portion of free AI generations
    // In production, query actual usage from database
    const usageThreshold = EMAIL_CONFIG.maxFreeAiGenerations * 0.7; // 70% usage

    // For now, return false - implement actual check when usage tracking exists
    return false;
  } catch (error) {
    console.error("[Email] Error checking upgrade eligibility:", error);
    return false;
  }
}

/**
 * Check and queue re-engagement emails for inactive users
 */
export async function checkReengagementEligibility(
  userId: string,
  lastActiveDate: Date,
): Promise<boolean> {
  const now = new Date();
  const daysSinceActive = Math.floor(
    (now.getTime() - lastActiveDate.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (daysSinceActive >= EMAIL_CONFIG.inactiveDaysThreshold) {
    // Check if we already sent a re-engagement email recently
    const recentReengagement = emailQueue.find(
      (e) =>
        e.userId === userId &&
        e.emailType === "reengagement" &&
        e.status === "sent" &&
        e.sentAt &&
        now.getTime() - e.sentAt.getTime() < 7 * 24 * 60 * 60 * 1000,
    );

    if (!recentReengagement) {
      queueEmail(userId, "reengagement", now, {
        daysSinceLastVisit: daysSinceActive,
      });
      return true;
    }
  }

  return false;
}

/**
 * Get pending emails ready to be sent
 */
export function getPendingEmails(): QueuedEmail[] {
  const now = new Date();
  return emailQueue.filter(
    (email) => email.status === "pending" && email.scheduledFor <= now,
  );
}

/**
 * Mark email as sent
 */
export function markEmailSent(emailId: string): void {
  const email = emailQueue.find((e) => e.id === emailId);
  if (email) {
    email.status = "sent";
    email.sentAt = new Date();
  }
}

/**
 * Mark email as failed
 */
export function markEmailFailed(emailId: string): void {
  const email = emailQueue.find((e) => e.id === emailId);
  if (email) {
    email.status = "failed";
  }
}

/**
 * Process email queue using React Email templates and Resend
 */
export async function processEmailQueue(): Promise<number> {
  const pendingEmails = getPendingEmails();
  let sentCount = 0;

  for (const email of pendingEmails) {
    try {
      const user = await storage.getUser(email.userId);
      if (!user || !user.email) {
        markEmailFailed(email.id);
        continue;
      }

      const username = user.displayName || user.username;
      const { subject, html } = await renderEmail({
        emailType: email.emailType as ReactEmailType,
        username,
        context: email.metadata as Record<string, any>,
      });

      const result = await sendEmail({ to: user.email, subject, html });

      if (result.success) {
        markEmailSent(email.id);
        sentCount++;
        console.log(
          `[Email] Sent ${email.emailType} to ${user.email} (ID: ${result.messageId})`,
        );
      } else {
        console.error(
          `[Email] Failed to send ${email.emailType} to ${user.email}: ${result.error}`,
        );
        markEmailFailed(email.id);
      }
    } catch (error) {
      console.error(`[Email] Failed to process email ${email.id}:`, error);
      markEmailFailed(email.id);
    }
  }

  return sentCount;
}

/**
 * Send a single email immediately (bypasses queue)
 */
export async function sendEmailNow(
  userId: string,
  emailType: EmailType,
  context?: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await storage.getUser(userId);
    if (!user || !user.email) {
      return { success: false, error: "User not found or no email" };
    }

    const username = user.displayName || user.username;
    const { subject, html } = await renderEmail({
      emailType: emailType as ReactEmailType,
      username,
      context: context as Record<string, any>,
    });

    const result = await sendEmail({ to: user.email, subject, html });

    if (result.success) {
      console.log(`[Email] Sent ${emailType} immediately to ${user.email}`);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    console.error(`[Email] Failed to send immediate email:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Build HTML email from content
 */
function buildEmailHtml(content: string, emailType: EmailType): string {
  const appUrl = EMAIL_CONFIG.appUrl;

  // Map email type to CTA
  const ctaMap: Record<EmailType, { text: string; url: string }> = {
    welcome: { text: "Commence à zyeuter →", url: `${appUrl}/` },
    onboarding_day1: {
      text: "Essayer Ti-Guy Studio →",
      url: `${appUrl}/ai-studio`,
    },
    onboarding_day3: {
      text: "Découvrir du contenu →",
      url: `${appUrl}/explore`,
    },
    onboarding_day7: {
      text: "Voir les plans Premium →",
      url: `${appUrl}/premium`,
    },
    weekly_digest: { text: "Voir ton profil →", url: `${appUrl}/profile` },
    upgrade_prompt: {
      text: "Passer à Creator Pro →",
      url: `${appUrl}/premium?plan=silver`,
    },
    reengagement: { text: "Revenir sur Zyeuté →", url: `${appUrl}/` },
  };

  const cta = ctaMap[emailType];

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zyeuté</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 20px; background-color: #0a0a0a; font-family: 'Inter', sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3B1E3D 0%, #5A2A4A 100%); padding: 32px; text-align: center; border-bottom: 2px dashed #FFBF00;">
      <div style="font-size: 32px; font-weight: 800; color: #FFBF00; text-shadow: 0 0 20px rgba(255, 191, 0, 0.5);">Zyeuté</div>
      <p style="margin: 8px 0 0 0; color: #d4d4d4; font-size: 14px;">L'app sociale du Québec 🦫⚜️</p>
    </div>
    
    <!-- Body -->
    <div style="padding: 32px; color: #d4d4d4; line-height: 1.7;">
      <div style="font-size: 48px; text-align: center; margin-bottom: 16px;">🦫</div>
      <div style="font-size: 16px; white-space: pre-line;">
        ${content}
      </div>
      
      <!-- CTA -->
      <div style="text-align: center; margin-top: 32px;">
        <a href="${cta.url}" style="display: inline-block; background: linear-gradient(135deg, #FFBF00 0%, #FFD700 100%); color: #000; font-weight: 700; padding: 16px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 0 20px rgba(255, 191, 0, 0.3);">
          ${cta.text}
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px; text-align: center; border-top: 1px solid #333; font-size: 12px; color: #737373;">
      <p style="margin: 0 0 8px 0;">Fait au Québec, pour le Québec 🦫⚜️</p>
      <p style="margin: 0 0 8px 0;">
        <a href="${appUrl}/settings/notifications" style="color: #FFBF00; text-decoration: none;">Gérer mes notifications</a>
        &nbsp;•&nbsp;
        <a href="${appUrl}/unsubscribe" style="color: #737373; text-decoration: none;">Se désabonner</a>
      </p>
      <p style="margin: 0; color: #525252;">© ${new Date().getFullYear()} Zyeuté Inc. • Montréal, Québec</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Weekly digest generator
 */
export async function generateWeeklyDigests(): Promise<void> {
  console.log("[Email] Starting weekly digest generation...");

  try {
    // Get all active users (simplified - in production, query from database)
    // This would be called by a cron job on Sundays

    // For each user, calculate their weekly stats and queue digest
    // Implementation depends on analytics/stats tracking being available

    console.log("[Email] Weekly digest generation complete");
  } catch (error) {
    console.error("[Email] Weekly digest generation failed:", error);
  }
}

export default {
  EMAIL_CONFIG,
  generatePersonalizedContent,
  queueEmail,
  cancelPendingEmails,
  scheduleOnboardingSequence,
  checkUpgradePromptEligibility,
  checkReengagementEligibility,
  processEmailQueue,
  generateWeeklyDigests,
  getPendingEmails,
  sendEmailNow,
};
