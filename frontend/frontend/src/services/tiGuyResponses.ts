/**
 * tiGuyResponses.ts
 * Ti-Guy response utilities and welcome messages
 */

import type { ChatMessage } from "@/types/chat";

export function getTiGuyWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome-message',
    sender: 'tiguy',
    text: "Yo! C'est moi, Ti-Guy! 🦫 Bienvenue dans ma cabane! Qu'est-ce que tu veux jaser?",
    timestamp: new Date(),
  };
}