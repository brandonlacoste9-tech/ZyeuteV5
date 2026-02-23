/**
 * Messaging API Routes
 * User-to-user conversations, DMs, group chats, media, and TI-GUY AI
 */

import express from "express";
import { requireAuth } from "../supabase-auth.js";
import { pool } from "../storage.js";
import { handleUserMessage } from "../ai/tiguy-dialogflow";

const router = express.Router();

// ─── CONVERSATIONS ──────────────────────────────────────

/**
 * GET /api/messaging/conversations
 * Get user's conversations (inbox)
 */
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.type,
        c.title,
        c.avatar_url,
        c.last_message_at,
        c.created_at,
        c.ephemeral_mode,
        c.encryption_enabled,
        (
          SELECT COUNT(*)::int
          FROM messages m 
          WHERE m.conversation_id = c.id 
            AND m.created_at > COALESCE(
              (SELECT last_read_at FROM conversation_participants 
               WHERE conversation_id = c.id AND user_id = $1), 
              '1970-01-01'
            )
            AND m.sender_id != $1
            AND m.deleted_at IS NULL
        ) as unread_count,
        (
          SELECT json_build_object(
            'id', u.id,
            'username', u.username,
            'display_name', u.display_name,
            'avatar_url', u.avatar_url,
            'is_verified', u.is_verified
          )
          FROM conversation_participants cp2
          JOIN users u ON u.id = cp2.user_id
          WHERE cp2.conversation_id = c.id 
            AND cp2.user_id != $1
            AND c.type = 'direct'
          LIMIT 1
        ) as other_user,
        (
          SELECT json_build_object(
            'type', m.content_type,
            'text', m.content_text,
            'created_at', m.created_at,
            'sender_id', m.sender_id
          )
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.deleted_at IS NULL
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message
      FROM conversations c
      INNER JOIN conversation_participants cp ON cp.conversation_id = c.id
      WHERE cp.user_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST
    `,
      [userId],
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error("[Messaging] Get conversations error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

/**
 * POST /api/messaging/conversations/direct
 * Get or create a direct conversation
 */
router.post("/conversations/direct", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { otherUserId, username } = req.body;

    // Support lookup by username or ID
    let targetUserId = otherUserId;
    if (!targetUserId && username) {
      const userResult = await pool.query(
        "SELECT id FROM users WHERE username = $1",
        [username],
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      targetUserId = userResult.rows[0].id;
    }

    if (!targetUserId) {
      return res
        .status(400)
        .json({ error: "otherUserId or username is required" });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: "Cannot message yourself" });
    }

    // Check if conversation already exists
    const existingResult = await pool.query(
      `
      SELECT c.id
      FROM conversations c
      INNER JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
      INNER JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
      WHERE c.type = 'direct'
        AND cp1.user_id = $1
        AND cp2.user_id = $2
      LIMIT 1
    `,
      [userId, targetUserId],
    );

    if (existingResult.rows.length > 0) {
      return res.json({
        conversationId: existingResult.rows[0].id,
        message: "Conversation already exists",
      });
    }

    // Create new conversation in a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const convResult = await client.query(
        `INSERT INTO conversations (type, created_by) VALUES ('direct', $1) RETURNING id`,
        [userId],
      );

      const conversationId = convResult.rows[0].id;

      // Add both participants
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         VALUES ($1, $2), ($1, $3)`,
        [conversationId, userId, targetUserId],
      );

      await client.query("COMMIT");
      res.status(201).json({ conversationId, message: "Conversation created" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[Messaging] Create conversation error:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// ─── MESSAGES ──────────────────────────────────────

/**
 * GET /api/messaging/conversations/:id/messages
 * Get messages in a conversation (paginated)
 */
router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const conversationId = req.params.id;
    const { limit = "50", before } = req.query;

    // Verify user is in conversation
    const accessCheck = await pool.query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Build query
    const params: any[] = [conversationId, parseInt(limit as string)];
    let query = `
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content_type,
        m.content_text,
        m.content_url,
        m.content_metadata,
        m.is_encrypted,
        m.is_ephemeral,
        m.expires_at,
        m.created_at,
        m.edited_at,
        m.read_at,
        m.reactions,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'display_name', u.display_name,
          'avatar_url', u.avatar_url
        ) as sender
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
        AND m.deleted_at IS NULL
    `;

    if (before) {
      params.push(before);
      query += ` AND m.created_at < $${params.length}`;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $2`;

    const result = await pool.query(query, params);

    // Update last read
    await pool.query(
      `UPDATE conversation_participants
       SET last_read_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    // Also mark messages as read (for the old schema read_at column)
    await pool.query(
      `UPDATE messages SET read_at = NOW()
       WHERE conversation_id = $1
         AND sender_id != $2
         AND read_at IS NULL`,
      [conversationId, userId],
    );

    res.json({
      messages: result.rows.reverse(), // Return oldest first
      hasMore: result.rows.length === parseInt(limit as string),
    });
  } catch (error) {
    console.error("[Messaging] Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * POST /api/messaging/conversations/:id/messages
 * Send a message
 */
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const conversationId = req.params.id;
    const {
      contentType = "text",
      contentText,
      contentUrl,
      contentMetadata,
      isEncrypted = false,
      encryptionIv,
      isEphemeral = false,
      ephemeralTtlSeconds = 86400,
    } = req.body;

    if (!contentText?.trim() && !contentUrl) {
      return res
        .status(400)
        .json({ error: "Message content or media required" });
    }

    // Verify user is in conversation
    const accessCheck = await pool.query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check conversation ephemeral settings
    const convResult = await pool.query(
      "SELECT ephemeral_mode FROM conversations WHERE id = $1",
      [conversationId],
    );
    const conv = convResult.rows[0];

    // Calculate expiry if ephemeral
    let expiresAt = null;
    if (isEphemeral || conv?.ephemeral_mode) {
      expiresAt = new Date(Date.now() + ephemeralTtlSeconds * 1000);
    }

    const result = await pool.query(
      `INSERT INTO messages (
        conversation_id, sender_id, content_type, content_text, content_url,
        content_metadata, is_encrypted, encryption_iv, is_ephemeral, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        conversationId,
        userId,
        contentType,
        contentText,
        contentUrl,
        contentMetadata ? JSON.stringify(contentMetadata) : null,
        isEncrypted,
        encryptionIv,
        isEphemeral || conv?.ephemeral_mode || false,
        expiresAt,
      ],
    );

    const message = result.rows[0];

    // Broadcast to conversation participants via WebSocket
    try {
      const { broadcastMessage } = await import("../websocket/gateway");
      const wsCtx = req.app.get("websocket");
      if (wsCtx?.io) {
        await broadcastMessage(wsCtx.io, conversationId as string, {
          id: message.id,
          senderId: message.sender_id,
          contentType: message.content_type,
          contentText: message.content_text,
          contentUrl: message.content_url,
          contentMetadata: message.content_metadata,
          isEphemeral: message.is_ephemeral,
          expiresAt: message.expires_at,
          createdAt: message.created_at,
        });

        // Trigger TI-GUY AI response if text message
        if (contentType === "text" && contentText) {
          handleUserMessage(
            conversationId as string,
            contentText as string,
            userId as string,
            wsCtx.io,
            {
              enableAI: true,
              aiTriggerKeywords: ["@ti-guy", "ti-guy", "aide", "help", "?"],
            },
          ).catch((err: any) => {
            console.error("[Messaging] TI-GUY handler error:", err);
          });
        }
      }
    } catch (wsErr) {
      // WebSocket not available — message still saved to DB
      console.warn("[Messaging] WebSocket broadcast skipped:", wsErr);
    }

    res.status(201).json({
      message: {
        id: message.id,
        senderId: message.sender_id,
        contentType: message.content_type,
        contentText: message.content_text,
        contentUrl: message.content_url,
        isEphemeral: message.is_ephemeral,
        expiresAt: message.expires_at,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    console.error("[Messaging] Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ─── REACTIONS ──────────────────────────────────────

/**
 * POST /api/messaging/messages/:id/reactions
 * Add reaction to message
 */
router.post("/messages/:id/reactions", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const messageId = req.params.id;
    const { reaction, emoji } = req.body;

    const reactionValue = reaction || emoji;
    if (!reactionValue) {
      return res.status(400).json({ error: "Reaction/emoji required" });
    }

    // Verify user has access to the message's conversation
    const accessCheck = await pool.query(
      `SELECT 1 FROM messages m
       INNER JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
       WHERE m.id = $1 AND cp.user_id = $2`,
      [messageId, userId],
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    await pool.query(
      `INSERT INTO message_reactions (message_id, user_id, reaction)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id, reaction) DO NOTHING`,
      [messageId, userId, reactionValue],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("[Messaging] Add reaction error:", error);
    res.status(500).json({ error: "Failed to add reaction" });
  }
});

/**
 * DELETE /api/messaging/messages/:id/reactions/:emoji
 * Remove reaction from message
 */
router.delete(
  "/messages/:id/reactions/:emoji",
  requireAuth,
  async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { id: messageId, emoji } = req.params;

      await pool.query(
        `DELETE FROM message_reactions
       WHERE message_id = $1 AND user_id = $2 AND reaction = $3`,
        [messageId, userId, decodeURIComponent(emoji as string)],
      );

      res.json({ success: true });
    } catch (error) {
      console.error("[Messaging] Remove reaction error:", error);
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  },
);

// ─── READ RECEIPTS ──────────────────────────────────────

/**
 * POST /api/messaging/messages/:id/read
 * Mark a message as read
 */
router.post("/messages/:id/read", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const messageId = req.params.id;

    // Update the message's read_at
    await pool.query(
      `UPDATE messages SET read_at = NOW()
       WHERE id = $1 AND sender_id != $2 AND read_at IS NULL`,
      [messageId, userId],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("[Messaging] Mark read error:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// ─── CONVERSATION MANAGEMENT ──────────────────────────────────────

/**
 * DELETE /api/messaging/conversations/:id
 * Soft-delete (leave) a conversation
 */
router.delete("/conversations/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const conversationId = req.params.id;

    await pool.query(
      `DELETE FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("[Messaging] Delete conversation error:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

/**
 * PATCH /api/messaging/conversations/:id/settings
 * Update conversation settings (ephemeral mode, encryption, etc.)
 */
router.patch("/conversations/:id/settings", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const conversationId = req.params.id;
    const { ephemeralMode, ephemeralTtlSeconds, encryptionEnabled } = req.body;

    // Verify user is part of conversation
    const memberCheck = await pool.query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Build update dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (ephemeralMode !== undefined) {
      updates.push(`ephemeral_mode = $${paramIndex++}`);
      values.push(ephemeralMode);
    }
    if (ephemeralTtlSeconds !== undefined) {
      updates.push(`ephemeral_ttl_seconds = $${paramIndex++}`);
      values.push(ephemeralTtlSeconds);
    }
    if (encryptionEnabled !== undefined) {
      updates.push(`encryption_enabled = $${paramIndex++}`);
      values.push(encryptionEnabled);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No settings to update" });
    }

    values.push(conversationId);

    await pool.query(
      `UPDATE conversations SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      values,
    );

    res.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("[Messaging] Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ─── MEDIA UPLOAD ──────────────────────────────────────

/**
 * POST /api/messaging/conversations/:id/upload
 * Initiate media upload for a conversation
 */
router.post("/conversations/:id/upload", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const conversationId = req.params.id;

    // Verify user is part of conversation
    const memberCheck = await pool.query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { fileType, fileName, fileSize } = req.body;

    // Generate unique file key
    const timestamp = Date.now();
    const fileKey = `chat-media/${conversationId}/${userId}/${timestamp}-${fileName}`;

    // TODO: Generate presigned URL from Supabase/S3
    // const presignedUrl = await generatePresignedUrl(fileKey, fileType);

    res.json({
      success: true,
      fileKey,
      uploadUrl: `/api/upload/chat-media`, // Placeholder
      message: "Upload endpoint ready - implement presigned URL generation",
    });
  } catch (error) {
    console.error("[Messaging] Upload error:", error);
    res.status(500).json({ error: "Failed to initiate upload" });
  }
});

// ─── USER SEARCH ──────────────────────────────────────

/**
 * GET /api/messaging/users/search
 * Search users to start a conversation
 */
router.get("/users/search", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.length < 2) {
      return res
        .status(400)
        .json({ error: "Query must be at least 2 characters" });
    }

    const result = await pool.query(
      `
      SELECT 
        id, username, display_name, avatar_url, is_verified
      FROM users
      WHERE id != $1
        AND (username ILIKE $2 OR display_name ILIKE $2)
      ORDER BY 
        CASE WHEN username ILIKE $3 THEN 0 ELSE 1 END,
        username
      LIMIT 20
    `,
      [userId, `%${q}%`, `${q}%`],
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error("[Messaging] User search error:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// ─── ADMIN: COST DASHBOARD ──────────────────────────────────────

/**
 * GET /api/messaging/admin/tiguy-cost
 * Get TI-GUY + GenAI combined spending dashboard
 */
router.get("/admin/tiguy-cost", requireAuth, async (req, res) => {
  // TODO: Add admin role check
  // if (!req.user.isAdmin) return res.status(403).json({ error: "Admin only" });

  try {
    const { getSpendingDashboard } = await import("../ai/tiguy-cost-monitor");
    const { getFullGoogleAIDashboard } =
      await import("../ai/genai-cost-monitor");

    const dialogflowDashboard = getSpendingDashboard();
    const genAIDashboard = getFullGoogleAIDashboard();

    res.json({
      dialogflow: dialogflowDashboard,
      genAI: genAIDashboard,
      combined: {
        totalSpending: genAIDashboard.totalSpending,
        totalCap: 1300,
        percentUsed: genAIDashboard.percentUsed,
        remaining: genAIDashboard.remaining,
        status: genAIDashboard.status,
      },
      message:
        genAIDashboard.status === "warning"
          ? "⚠️ CRÉDITS GOOGLE AI ÉPUISÉS!"
          : genAIDashboard.status === "caution"
            ? "⚡ Attention: 90% des crédits utilisés"
            : "✅ Crédits Google AI OK",
    });
  } catch (error) {
    console.error("[Messaging] Cost dashboard error:", error);
    res.status(500).json({ error: "Failed to load cost data" });
  }
});

export default router;
