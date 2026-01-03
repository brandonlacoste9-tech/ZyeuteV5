export interface User {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  karmaCredits?: number;
  cashCredits?: number;
  totalGiftsSent?: number;
  totalGiftsReceived?: number;
}

export interface Post {
  id: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  type: "video" | "photo";
  fireCount?: number;
  commentCount?: number;
  user: User;
  tiGuyInsight?: string;
  aiPerception?: string;
  createdAt: string;
}
