/**
 * tiGuyResponses.ts
 * Ti-Guy response utilities
 */

import type { ChatMessage } from "@/types/chat";

export function getTiGuyWelcomeMessage(): ChatMessage {
  return {
    id: "welcome-tiguy",
    timestamp: new Date(),
    sender: "tiguy",
    text: "Salut! Je suis Ti-Guy, ton assistant québécois! 🦫\n\nJ'ai les yeux partout et je connais tout ce qui se passe sur Zyeuté. Tu veux parler de quoi?",
  };
}
