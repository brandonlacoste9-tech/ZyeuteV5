/**
 * Chat Message Types for TI-Guy Chat Modal
 */

export type Sender = "user" | "tiGuy";

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
  image?: string;
}

export type ConversationType = "tiguy" | "dm";

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  title: string;
  participants?: string[]; // For DMs
  lastMessageAt: Date;
  pinned?: boolean;
  archived?: boolean;
}
