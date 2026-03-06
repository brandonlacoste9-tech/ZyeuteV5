/**
 * useWebSocket - Real-time messaging hook for Zyeuté
 * Connects to WebSocket gateway for live events
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";

// Event types (match backend)
export const SocketEvents = {
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_READ: "message:read",
  PRESENCE_UPDATE: "presence:update",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  AI_TYPING: "ai:typing",
  AI_REPLY: "ai:reply",
  CONNECTED: "connected",
  ERROR: "error",
} as const;

interface UseWebSocketOptions {
  onMessageNew?: (data: any) => void;
  onMessageUpdated?: (data: any) => void;
  onUserOnline?: (data: any) => void;
  onUserOffline?: (data: any) => void;
  onTypingStart?: (data: any) => void;
  onTypingStop?: (data: any) => void;
  onAIReply?: (data: any) => void;
  onAITyping?: (data: any) => void;
  onConnected?: () => void;
  onError?: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { session } = useAuth();
  const token = session?.access_token;

  // Connect to WebSocket
  useEffect(() => {
    if (!token) return;

    setIsConnecting(true);

    const socket = io(import.meta.env.VITE_WS_URL || "ws://localhost:3001", {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket.id);
      setIsConnected(true);
      setIsConnecting(false);
      options.onConnected?.();
    });

    socket.on("disconnect", (reason: string) => {
      console.log("[WebSocket] Disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error: any) => {
      console.error("[WebSocket] Connection error:", error);
      setIsConnecting(false);
      options.onError?.(error);
    });

    // Message events
    socket.on(SocketEvents.MESSAGE_NEW, (data: any) => {
      console.log("[WebSocket] New message:", data);
      options.onMessageNew?.(data);
    });

    socket.on(SocketEvents.MESSAGE_UPDATED, (data: any) => {
      console.log("[WebSocket] Message updated:", data);
      options.onMessageUpdated?.(data);
    });

    // Presence events
    socket.on(SocketEvents.USER_ONLINE, (data: any) => {
      console.log("[WebSocket] User online:", data);
      options.onUserOnline?.(data);
    });

    socket.on(SocketEvents.USER_OFFLINE, (data: any) => {
      console.log("[WebSocket] User offline:", data);
      options.onUserOffline?.(data);
    });

    // Typing events
    socket.on(SocketEvents.TYPING_START, (data: any) => {
      options.onTypingStart?.(data);
    });

    socket.on(SocketEvents.TYPING_STOP, (data: any) => {
      options.onTypingStop?.(data);
    });

    // AI events
    socket.on(SocketEvents.AI_REPLY, (data: any) => {
      console.log("[WebSocket] AI reply:", data);
      options.onAIReply?.(data);
    });

    socket.on(SocketEvents.AI_TYPING, (data: any) => {
      options.onAITyping?.(data);
    });

    // Cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Send typing indicator
  const sendTypingStart = useCallback((conversationId: string) => {
    socketRef.current?.emit(SocketEvents.TYPING_START, { conversationId });
  }, []);

  const sendTypingStop = useCallback((conversationId: string) => {
    socketRef.current?.emit(SocketEvents.TYPING_STOP, { conversationId });
  }, []);

  // Send heartbeat (presence)
  const sendHeartbeat = useCallback(() => {
    socketRef.current?.emit("presence:heartbeat");
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    sendTypingStart,
    sendTypingStop,
    sendHeartbeat,
  };
}

// Hook for conversation-specific real-time updates
export function useConversationSocket(
  conversationId: string | null,
  options: UseWebSocketOptions = {},
) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isAITyping, setIsAITyping] = useState(false);

  const handleTypingStart = useCallback(
    (data: any) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => new Set([...prev, data.username]));
        options.onTypingStart?.(data);
      }
    },
    [conversationId, options.onTypingStart],
  );

  const handleTypingStop = useCallback(
    (data: any) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.username);
          return next;
        });
        options.onTypingStop?.(data);
      }
    },
    [conversationId, options.onTypingStop],
  );

  const handleAIReply = useCallback(
    (data: any) => {
      if (data.conversationId === conversationId) {
        setIsAITyping(false);
        options.onAIReply?.(data);
      }
    },
    [conversationId, options.onAIReply],
  );

  const handleAITyping = useCallback(
    (data: any) => {
      if (data.conversationId === conversationId) {
        setIsAITyping(true);
        options.onAITyping?.(data);
      }
    },
    [conversationId, options.onAITyping],
  );

  const socket = useWebSocket({
    ...options,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
    onAIReply: handleAIReply,
    onAITyping: handleAITyping,
  });

  // Auto-stop typing after 3 seconds of inactivity
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(() => {
      socket.sendHeartbeat();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [conversationId, socket]);

  return {
    ...socket,
    typingUsers: Array.from(typingUsers),
    isAITyping,
  };
}
