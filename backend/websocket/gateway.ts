/**
 * WebSocket Gateway for Zyeuté Messaging
 * Real-time events: messages, presence, typing, TI-GUY responses
 */

import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import jwt from "jsonwebtoken";
import { db } from "./db";

// Event types
export const Events = {
  // Messages
  MESSAGE_NEW: "message:new",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_READ: "message:read",
  MESSAGE_REACTION: "message:reaction",
  
  // Presence
  PRESENCE_UPDATE: "presence:update",
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  
  // Typing
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  
  // TI-GUY AI
  AI_TYPING: "ai:typing",
  AI_REPLY: "ai:reply",
  
  // System
  ERROR: "error",
  CONNECTED: "connected",
} as const;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export async function createWebSocketGateway(httpServer: any) {
  // Redis clients for adapter (horizontal scaling)
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  
  await pubClient.connect();
  await subClient.connect();

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
    transports: ["websocket", "polling"], // Fallback for compatibility
  });

  // Use Redis adapter for multi-server scaling
  io.adapter(createAdapter(pubClient, subClient));

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      
      // Store user connection in Redis
      await pubClient.hSet("user:sockets", socket.userId, socket.id);
      
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: AuthenticatedSocket) => {
    console.log(`[WebSocket] User ${socket.username} connected: ${socket.id}`);
    
    // Notify friends that user is online
    await broadcastPresence(io, socket.userId!, "online");

    // Join user's conversation rooms
    await joinConversationRooms(socket);

    // Send initial connection success
    socket.emit(Events.CONNECTED, {
      userId: socket.userId,
      timestamp: new Date().toISOString(),
    });

    // Handle typing events
    socket.on(Events.TYPING_START, async (data: { conversationId: string }) => {
      await handleTyping(socket, data.conversationId, true);
    });

    socket.on(Events.TYPING_STOP, async (data: { conversationId: string }) => {
      await handleTyping(socket, data.conversationId, false);
    });

    // Handle presence heartbeat
    socket.on("presence:heartbeat", async () => {
      await pubClient.expire(`user:presence:${socket.userId}`, 60);
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      console.log(`[WebSocket] User ${socket.username} disconnected`);
      await pubClient.hDel("user:sockets", socket.userId!);
      await broadcastPresence(io, socket.userId!, "offline");
    });
  });

  return { io, pubClient };
}

// Join all conversation rooms for a user
async function joinConversationRooms(socket: AuthenticatedSocket) {
  try {
    const result = await db.query(
      `SELECT id FROM conversations 
       WHERE participant_a = $1 OR participant_b = $1`,
      [socket.userId]
    );

    for (const row of result.rows) {
      socket.join(`conversation:${row.id}`);
      console.log(`[WebSocket] ${socket.username} joined room: conversation:${row.id}`);
    }
  } catch (err) {
    console.error("[WebSocket] Error joining rooms:", err);
  }
}

// Handle typing indicators
async function handleTyping(
  socket: AuthenticatedSocket, 
  conversationId: string, 
  isTyping: boolean
) {
  const event = isTyping ? Events.TYPING_START : Events.TYPING_STOP;
  
  socket.to(`conversation:${conversationId}`).emit(event, {
    conversationId,
    userId: socket.userId,
    username: socket.username,
    timestamp: new Date().toISOString(),
  });
}

// Broadcast presence to friends
async function broadcastPresence(io: Server, userId: string, status: "online" | "offline") {
  try {
    // Get all conversations this user is in
    const result = await db.query(
      `SELECT 
        CASE 
          WHEN participant_a = $1 THEN participant_b 
          ELSE participant_a 
        END as friend_id
       FROM conversations 
       WHERE participant_a = $1 OR participant_b = $1`,
      [userId]
    );

    const event = status === "online" ? Events.USER_ONLINE : Events.USER_OFFLINE;
    
    for (const row of result.rows) {
      const friendSocketId = await io.redisClient?.hGet("user:sockets", row.friend_id);
      if (friendSocketId) {
        io.to(friendSocketId).emit(event, {
          userId,
          status,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error("[WebSocket] Error broadcasting presence:", err);
  }
}

// Helper to broadcast new message to conversation
export async function broadcastMessage(
  io: Server,
  conversationId: string,
  message: any
) {
  io.to(`conversation:${conversationId}`).emit(Events.MESSAGE_NEW, {
    conversationId,
    message,
    timestamp: new Date().toISOString(),
  });
}

// Helper to broadcast TI-GUY AI response
export async function broadcastAIResponse(
  io: Server,
  conversationId: string,
  response: any
) {
  io.to(`conversation:${conversationId}`).emit(Events.AI_REPLY, {
    conversationId,
    response,
    timestamp: new Date().toISOString(),
  });
}

// Helper to broadcast typing indicator from AI
export async function broadcastAITyping(
  io: Server,
  conversationId: string,
  isTyping: boolean
) {
  const event = isTyping ? Events.AI_TYPING : Events.TYPING_STOP;
  io.to(`conversation:${conversationId}`).emit(event, {
    conversationId,
    isAI: true,
    timestamp: new Date().toISOString(),
  });
}
