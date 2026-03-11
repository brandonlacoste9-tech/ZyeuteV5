export interface ChatMessage {
  id: string;
  timestamp: Date;
  sender: "user" | "tiguy";
  text: string;
  image?: string;
}
