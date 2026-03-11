/**
 * tiguyService.ts
 * Ti-Guy AI service for Zyeuté
 * Simple mock service for now
 */

import type { ChatMessage } from "@/types/chat";

export const tiguyService = {
  async sendMessage(message: string, history: ChatMessage[]) {
    // Simple mock responses
    const responses = [
      "Ouais, je comprends! 🦫",
      "T'as vu ça? C'est incroyable!",
      "Allo? Quelqu'un est là? 🦫",
      "C'est quoi ton plan pour aujourd'hui?",
      "Tu veux une poutine? 🍟",
    ];

    // Check for keywords
    if (message.toLowerCase().includes("bonjour") || message.toLowerCase().includes("salut")) {
      return "Salut! Je suis Ti-Guy, ton assistant québécois! 🦫";
    }
    if (message.toLowerCase().includes("poutine")) {
      return "La poutine, c'est la vie! 🍟酱汁奶酪 fries";
    }
    if (message.toLowerCase().includes("habs")) {
      return "Go Habs! Go! 🏒";
    }

    // Random response
    return responses[Math.floor(Math.random() * responses.length)];
  },
};
