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
  isError?: boolean;
}
