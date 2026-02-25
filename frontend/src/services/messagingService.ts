/**
 * Messaging Service
 * User-to-user conversations and DMs
 */

const API_BASE = "/api/messaging";

/**
 * Helper to make API calls with consistent error handling
 * Returns the raw JSON response
 */
async function messagingFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) throw new Error(`Messaging API error: ${response.statusText}`);
  return response.json();
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_verified?: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  avatar_url?: string;
  last_message_at: string;
  created_at: string;
  unread_count: number;
  other_user?: User;
  last_message?: {
    text: string;
    created_at: string;
    sender_id: string;
  };
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  media_url?: string;
  media_metadata?: Record<string, any>;
  sender_id: string;
  sender?: User;
  created_at: string;
  is_edited: boolean;
  ephemeral_duration: number;
  expires_at?: string;
  reactions?: { emoji: string; count: number }[];
  is_read: boolean;
}

export const messagingService = {
  // Get all conversations
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return messagingFetch("/conversations");
  },

  // Get or create direct conversation with user
  async getOrCreateDirectConversation(otherUserId: string): Promise<{ conversationId: string }> {
    return messagingFetch("/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ otherUserId }),
    });
  },

  // Get messages in a conversation
  async getMessages(
    conversationId: string, 
    options?: { limit?: number; before?: string }
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.before) params.append('before', options.before);
    
    const endpoint = params.toString() 
      ? `/conversations/${conversationId}/messages?${params}`
      : `/conversations/${conversationId}/messages`;
    
    return messagingFetch(endpoint);
  },

  // Send a message
  async sendMessage(
    conversationId: string,
    data: {
      content: string;
      type?: 'text' | 'image' | 'video' | 'audio' | 'file';
      mediaUrl?: string;
      mediaMetadata?: Record<string, any>;
      ephemeralDuration?: number;
    }
  ): Promise<{ message: Message }> {
    return messagingFetch(
      `/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  // Add reaction to message
  async addReaction(messageId: string, emoji: string): Promise<void> {
    await messagingFetch(
      `/messages/${messageId}/reactions`,
      {
        method: "POST",
        body: JSON.stringify({ emoji }),
      }
    );
  },

  // Remove reaction
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await messagingFetch(
      `/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      {
        method: "DELETE",
      }
    );
  },

  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    await messagingFetch(
      `/messages/${messageId}/read`,
      {
        method: "POST",
      }
    );
  },

  // Search users
  async searchUsers(query: string): Promise<{ users: User[] }> {
    return messagingFetch(`/users/search?q=${encodeURIComponent(query)}`);
  },
};

export default messagingService;
