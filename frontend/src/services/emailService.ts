/**
 * Email Service - Marketing and notification emails
 * Uses OpenAI for content generation
 */

import { logger } from "@/lib/logger";

const emailServiceLogger = logger.withContext("EmailService");

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const generateMarketingEmail = async (
  prompt: string,
): Promise<{ subject: string; body: string }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/proxy/deepseek`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "Tu es un expert en marketing par courriel pour une audience québécoise. Tu parles un français québécois engageant, amical et coloré (joual léger). Génère un objet et un corps de courriel HTML.",
          },
          {
            role: "user",
            content: `Sujet de la campagne: "${prompt}". Génère un objet (subject) et un corps (body) en HTML. Réponds en JSON format: { "subject": "...", "body": "..." }`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok)
      throw new Error(`DeepSeek Proxy error: ${response.status}`);

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content || "{}";
    return JSON.parse(resultText);
  } catch (error) {
    emailServiceLogger.error("Error generating email:", error);
    return {
      subject: "Erreur de génération",
      body: "<p>Impossible de générer le courriel pour le moment.</p>",
    };
  }
};

export const sendMarketingEmail = async (
  recipients: string[],
  subject: string,
  body: string,
): Promise<void> => {
  // Integration with Resend would go here
  emailServiceLogger.debug(`Sending email to ${recipients.length} recipients`);
  emailServiceLogger.debug(`Subject: ${subject}`);
  // In a real app, we would call the Resend API

  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return Promise.resolve();
};
