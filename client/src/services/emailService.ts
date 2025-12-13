/**
 * Email Service - Marketing and notification emails
 * Uses OpenAI for content generation
 */

import OpenAI from 'openai';
import { logger } from '@/lib/logger';

const emailServiceLogger = logger.withContext('EmailService');

// Initialize OpenAI
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
}) : null;

export const generateMarketingEmail = async (prompt: string): Promise<{ subject: string; body: string }> => {
  if (!openai) {
    // Mock response if no API key
    return {
      subject: "🔥 Nouvelles de Zyeuté!",
      body: `<h1>Salut la gang!</h1><p>Voici ce qui se passe sur Zyeuté...</p><p>(Contenu généré par IA non disponible sans clé API)</p>`
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en marketing par courriel pour une audience québécoise. Tu parles un français québécois engageant, amical et coloré (joual léger). Génère un objet et un corps de courriel HTML."
        },
        {
          role: "user",
          content: `Sujet de la campagne: "${prompt}". Génère un objet (subject) et un corps (body) en HTML. Réponds en JSON format: { "subject": "...", "body": "..." }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const resultText = response.choices[0].message.content || "{}";
    return JSON.parse(resultText);
  } catch (error) {
    emailServiceLogger.error('Error generating email:', error);
    return {
      subject: "Erreur de génération",
      body: "<p>Impossible de générer le courriel pour le moment.</p>"
    };
  }
};

export const sendMarketingEmail = async (
  recipients: string[],
  subject: string,
  body: string
): Promise<void> => {
  // Integration with Resend would go here
  emailServiceLogger.debug(`Sending email to ${recipients.length} recipients`);
  emailServiceLogger.debug(`Subject: ${subject}`);
  // In a real app, we would call the Resend API
  
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return Promise.resolve();
};
