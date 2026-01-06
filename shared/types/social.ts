import { User } from "./user";
import { Post } from "./media";

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  content: string; // Alias
  parent_id?: string | null;
  likes: number;
  created_at: string;
  user?: User;
}

export type NotificationType =
  | "fire"
  | "comment"
  | "follow"
  | "gift"
  | "mention"
  | "story_view";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string;
  post_id?: string | null;
  comment_id?: string | null;
  story_id?: string | null;
  reference_id?: string | null;
  is_read: boolean;
  created_at: string;
  actor?: User;
  post?: Partial<Post>;
}
