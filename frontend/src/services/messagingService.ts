/**
 * Messaging Service
 * User-to-user conversations and DMs
 */

const API_BASE = "/api/messaging";

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
    const response = await fetch(`${API_BASE}/conversations`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  },

  // Get or create direct conversation with user
  async getOrCreateDirectConversation(otherUserId: string): Promise<{ conversationId: string }> {
    const response = await fetch(`${API_BASE}/conversations/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ otherUserId }),
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    return response.json();
  },

  // Get messages in a conversation
  async getMessages(
    conversationId: string, 
    options?: { limit?: number; before?: string }
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.before) params.append('before', options.before);
    
    const response = await fetch(
      `${API_BASE}/conversations/${conversationId}/messages?${params}`,
      { credentials: 'include' }
    );
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
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
    const response = await fetch(
      `${API_BASE}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }
    );
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  // Add reaction to message
  async addReaction(messageId: string, emoji: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}/messages/${messageId}/reactions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emoji }),
      }
    );
    if (!response.ok) throw new Error('Failed to add reaction');
  },

  // Remove reaction
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      {
        method: 'DELETE',
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error('Failed to remove reaction');
  },

  // Mark message as read
  async markAsRead(messageId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}/messages/${messageId}/read`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error('Failed to mark as read');
  },

  // Search users
  async searchUsers(query: string): Promise<{ users: User[] }> {
    const response = await fetch(
      `${API_BASE}/users/search?q=${encodeURIComponent(query)}`,
      { credentials: 'include' }
    );
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  },
};

export default messagingService;
