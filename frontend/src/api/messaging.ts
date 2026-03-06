/**
 * Messaging API Client
 * Real user-to-user chat for ChatZyeute.tsx
 */

import { apiClient } from "./client";

export interface Conversation {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  lastMessage: {
    type: string;
    text: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  ephemeralMode: boolean;
  encryptionEnabled: boolean;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  sender: {
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  contentType: "text" | "image" | "video" | "voice" | "file";
  contentText?: string;
  contentUrl?: string;
  contentMetadata?: {
    duration?: number;
    width?: number;
    height?: number;
    size?: number;
  };
  isEncrypted: boolean;
  isEphemeral: boolean;
  expiresAt?: string;
  createdAt: string;
  editedAt?: string;
  readAt?: string;
  reactions: Array<{
    userId: string;
    reaction: string;
  }>;
}

// Get all conversations (inbox)
export async function getConversations(): Promise<Conversation[]> {
  const response = await apiClient.get("/conversations");
  return response.data.conversations;
}

// Start new conversation
export async function createConversation(
  username: string,
  ephemeralMode = false
): Promise<{ conversationId: string }> {
  const response = await apiClient.post("/conversations", {
    username,
    ephemeralMode
  });
  return response.data;
}

// Get messages in conversation
export async function getMessages(
  conversationId: string,
  options?: { before?: string; limit?: number }
): Promise<Message[]> {
  const params = new URLSearchParams();
  if (options?.before) params.append("before", options.before);
  if (options?.limit) params.append("limit", options.limit.toString());
  
  const response = await apiClient.get(
    `/conversations/${conversationId}/messages?${params}`
  );
  return response.data.messages;
}

// Send text message
export async function sendTextMessage(
  conversationId: string,
  text: string,
  options?: {
    isEphemeral?: boolean;
    ephemeralTtlSeconds?: number;
  }
): Promise<Message> {
  const response = await apiClient.post(
    `/conversations/${conversationId}/messages`,
    {
      contentType: "text",
      contentText: text,
      isEphemeral: options?.isEphemeral,
      ephemeralTtlSeconds: options?.ephemeralTtlSeconds
    }
  );
  return response.data.message;
}

// Send media message (image, video, voice)
export async function sendMediaMessage(
  conversationId: string,
  contentType: "image" | "video" | "voice",
  contentUrl: string,
  metadata?: {
    duration?: number;
    width?: number;
    height?: number;
    size?: number;
  }
): Promise<Message> {
  const response = await apiClient.post(
    `/conversations/${conversationId}/messages`,
    {
      contentType,
      contentUrl,
      contentMetadata: metadata
    }
  );
  return response.data.message;
}

// Add reaction to message
export async function addReaction(
  messageId: string,
  reaction: string
): Promise<void> {
  await apiClient.post(`/messages/${messageId}/reactions`, { reaction });
}

// Delete/hide conversation
export async function deleteConversation(conversationId: string): Promise<void> {
  await apiClient.delete(`/conversations/${conversationId}`);
}

// Upload file for chat (returns URL)
export async function uploadChatFile(
  conversationId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; metadata: { size: number; type: string; name: string } }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("conversationId", conversationId);

  const response = await apiClient.post("/upload/chat-file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    }
  });

  return {
    url: response.data.url,
    metadata: {
      size: file.size,
      type: file.type,
      name: file.name
    }
  };
}

// Update conversation settings
export async function updateConversationSettings(
  conversationId: string,
  settings: {
    ephemeralMode?: boolean;
    ephemeralTtlSeconds?: number;
    encryptionEnabled?: boolean;
  }
): Promise<void> {
  await apiClient.patch(`/conversations/${conversationId}/settings`, settings);
}
