/**
 * Messaging API Routes
<<<<<<< Updated upstream
 * Real user-to-user chat for Zyeuté
 */

import { Router } from "express";
import { db } from "../db";
import { authenticateToken } from "../middleware/auth";
import { handleUserMessage } from "../ai/tiguy-dialogflow";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/conversations
 * Get all conversations for current user (inbox)
 */
router.get("/conversations", async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `SELECT 
        c.id,
        c.participant_a,
        c.participant_b,
        c.last_message_at,
        c.ephemeral_mode,
        c.encryption_enabled,
        CASE 
          WHEN c.participant_a = $1 THEN c.unread_count_a 
          ELSE c.unread_count_b 
        END as unread_count,
        -- Other participant info
        u.id as other_user_id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.is_verified,
        -- Last message preview
        m.content_type as last_message_type,
        m.content_text as last_message_text,
        m.sender_id as last_message_sender_id,
        m.created_at as last_message_created_at
      FROM conversations c
      JOIN users u ON (
        CASE 
          WHEN c.participant_a = $1 THEN c.participant_b 
          ELSE c.participant_a 
        END
      ) = u.id
      LEFT JOIN messages m ON c.last_message_id = m.id
      WHERE (c.participant_a = $1 OR c.participant_b = $1)
        AND (c.deleted_by_a_at IS NULL OR c.participant_a != $1)
        AND (c.deleted_by_b_at IS NULL OR c.participant_b != $1)
      ORDER BY c.updated_at DESC`,
      [userId]
    );
    
    const conversations = result.rows.map(row => ({
      id: row.id,
      otherUser: {
        id: row.other_user_id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        isVerified: row.is_verified
      },
      lastMessage: row.last_message_type ? {
        type: row.last_message_type,
        text: row.last_message_text,
        senderId: row.last_message_sender_id,
        createdAt: row.last_message_created_at
      } : null,
      unreadCount: row.unread_count,
      ephemeralMode: row.ephemeral_mode,
      encryptionEnabled: row.encryption_enabled,
      updatedAt: row.last_message_at
    }));
    
    res.json({ conversations });
  } catch (err) {
    console.error("[Messaging] Get conversations error:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

/**
 * POST /api/conversations
 * Start a new conversation with a user
 */
router.post("/conversations", async (req, res) => {
  const userId = req.user.id;
  const { username, ephemeralMode = false } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: "Username required" });
  }
  
  try {
    // Find the other user
    const userResult = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const otherUserId = userResult.rows[0].id;
    
    if (otherUserId === userId) {
      return res.status(400).json({ error: "Cannot message yourself" });
    }
    
    // Check if conversation already exists
    const existingResult = await db.query(
      `SELECT id FROM conversations 
       WHERE (participant_a = $1 AND participant_b = $2)
          OR (participant_a = $2 AND participant_b = $1)
       LIMIT 1`,
      [userId, otherUserId]
    );
    
    if (existingResult.rows.length > 0) {
      return res.json({ 
        conversationId: existingResult.rows[0].id,
        message: "Conversation already exists" 
      });
    }
    
    // Create new conversation
    const insertResult = await db.query(
      `INSERT INTO conversations (participant_a, participant_b, ephemeral_mode)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, otherUserId, ephemeralMode]
    );
    
    res.status(201).json({ 
      conversationId: insertResult.rows[0].id,
      message: "Conversation created" 
    });
  } catch (err) {
    console.error("[Messaging] Create conversation error:", err);
=======
 * User-to-user conversations, DMs, and group chats
 */

import express from "express";
import { requireAuth } from "../lib/auth";
import { pool } from "../database-pool";

const router = express.Router();

// Get user's conversations
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.type,
        c.name,
        c.avatar_url,
        c.last_message_at,
        c.created_at,
        (
          SELECT COUNT(*) 
          FROM messages m 
          WHERE m.conversation_id = c.id 
          AND m.created_at > COALESCE(
            (SELECT last_read_at FROM conversation_participants 
             WHERE conversation_id = c.id AND user_id = $1), 
            '1970-01-01'
          )
          AND m.sender_id != $1
          AND m.is_deleted = false
        ) as unread_count,
        (
          SELECT json_build_object(
            'id', u.id,
            'username', u.username,
            'display_name', u.display_name,
            'avatar_url', u.avatar_url
          )
          FROM conversation_participants cp
          JOIN users u ON u.id = cp.user_id
          WHERE cp.conversation_id = c.id 
          AND cp.user_id != $1
          AND c.type = 'direct'
          LIMIT 1
        ) as other_user,
        (
          SELECT json_build_object(
            'text', m.content,
            'created_at', m.created_at,
            'sender_id', m.sender_id
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          AND m.is_deleted = false
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message
      FROM conversations c
      INNER JOIN conversation_participants cp ON cp.conversation_id = c.id
      WHERE cp.user_id = $1
        AND cp.left_at IS NULL
      ORDER BY c.last_message_at DESC NULLS LAST
    `, [userId]);

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get or create direct conversation
router.post("/conversations/direct", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: "otherUserId is required" });
    }

    // Check if conversation already exists
    const existingResult = await pool.query(`
      SELECT c.id
      FROM conversations c
      INNER JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
      INNER JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
      WHERE c.type = 'direct'
        AND cp1.user_id = $1
        AND cp2.user_id = $2
        AND cp1.left_at IS NULL
        AND cp2.left_at IS NULL
      LIMIT 1
    `, [userId, otherUserId]);

    if (existingResult.rows.length > 0) {
      return res.json({ conversationId: existingResult.rows[0].id });
    }

    // Create new conversation
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const convResult = await client.query(`
        INSERT INTO conversations (type, created_by)
        VALUES ('direct', $1)
        RETURNING id
      `, [userId]);

      const conversationId = convResult.rows[0].id;

      // Add both participants
      await client.query(`
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES ($1, $2), ($1, $3)
      `, [conversationId, userId, otherUserId]);

      await client.query('COMMIT');
      res.json({ conversationId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating conversation:", error);
>>>>>>> Stashed changes
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

<<<<<<< Updated upstream
/**
 * GET /api/conversations/:id/messages
 * Get messages in a conversation
 */
router.get("/conversations/:id/messages", async (req, res) => {
  const userId = req.user.id;
  const { id: conversationId } = req.params;
  const { before, limit = 50 } = req.query;
  
  try {
    // Verify user is part of this conversation
    const convResult = await db.query(
      `SELECT id FROM conversations 
       WHERE id = $1 AND (participant_a = $2 OR participant_b = $2)
       LIMIT 1`,
      [conversationId, userId]
    );
    
    if (convResult.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized for this conversation" });
    }
    
    // Build query
    let sql = `
      SELECT 
        m.*,
        u.username as sender_username,
        u.display_name as sender_display_name,
        u.avatar_url as sender_avatar_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
        AND m.deleted_at IS NULL
    `;
    
    const params = [conversationId];
    
    if (before) {
      sql += ` AND m.created_at < $2`;
      params.push(before);
    }
    
    sql += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await db.query(sql, params);
    
    // Mark messages as read
    await db.query(
      `UPDATE messages SET read_at = NOW()
       WHERE conversation_id = $1 
         AND sender_id != $2 
         AND read_at IS NULL`,
      [conversationId, userId]
    );
    
    // Reset unread count for this user
    await db.query(
      `UPDATE conversations 
       SET unread_count_a = CASE WHEN participant_a = $1 THEN 0 ELSE unread_count_a END,
           unread_count_b = CASE WHEN participant_b = $1 THEN 0 ELSE unread_count_b END
       WHERE id = $2`,
      [userId, conversationId]
    );
    
    const messages = result.rows.map(row => ({
      id: row.id,
      senderId: row.sender_id,
      sender: {
        username: row.sender_username,
        displayName: row.sender_display_name,
        avatarUrl: row.sender_avatar_url
      },
      contentType: row.content_type,
      contentText: row.content_text,
      contentUrl: row.content_url,
      contentMetadata: row.content_metadata,
      isEncrypted: row.is_encrypted,
      isEphemeral: row.is_ephemeral,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      editedAt: row.edited_at,
      readAt: row.read_at,
      reactions: row.reactions
    }));
    
    res.json({ messages: messages.reverse() }); // Oldest first
  } catch (err) {
    console.error("[Messaging] Get messages error:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Send a message
 */
router.post("/conversations/:id/messages", async (req, res) => {
  const userId = req.user.id;
  const { id: conversationId } = req.params;
  const { 
    contentType = "text",
    contentText,
    contentUrl,
    contentMetadata,
    isEncrypted = false,
    encryptionIv,
    isEphemeral = false,
    ephemeralTtlSeconds = 86400
  } = req.body;
  
  if (!contentText && !contentUrl) {
    return res.status(400).json({ error: "Message content required" });
  }
  
  try {
    // Verify user is part of conversation
    const convResult = await db.query(
      `SELECT ephemeral_mode FROM conversations 
       WHERE id = $1 AND (participant_a = $2 OR participant_b = $2)
       LIMIT 1`,
      [conversationId, userId]
    );
    
    if (convResult.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    const conv = convResult.rows[0];
    
    // Calculate expiry if ephemeral
    let expiresAt = null;
    if (isEphemeral || conv.ephemeral_mode) {
      expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (ephemeralTtlSeconds || 86400));
    }
    
    const insertResult = await db.query(
      `INSERT INTO messages (
        conversation_id, sender_id, content_type, content_text, content_url,
        content_metadata, is_encrypted, encryption_iv, is_ephemeral, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        conversationId, userId, contentType, contentText, contentUrl,
        contentMetadata, isEncrypted, encryptionIv, 
        isEphemeral || conv.ephemeral_mode, expiresAt
      ]
    );
    
    const message = insertResult.rows[0];
    
    // Broadcast to conversation participants via WebSocket
    const { broadcastMessage } = await import("../websocket/gateway");
    const { io } = req.app.get("websocket") || {};
    
    if (io) {
      await broadcastMessage(io, conversationId, {
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
      
      // Trigger TI-GUY AI response if needed
      if (contentType === "text" && contentText) {
        handleUserMessage(conversationId, contentText, userId, io, {
          enableAI: true,
          aiTriggerKeywords: ["@ti-guy", "ti-guy", "aide", "help", "?"],
        }).catch((err) => {
          console.error("[Messaging] TI-GUY handler error:", err);
        });
      }
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
        createdAt: message.created_at
      }
    });
  } catch (err) {
    console.error("[Messaging] Send message error:", err);
=======
// Get messages in a conversation
router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;
    const { limit = 50, before } = req.query;

    // Verify user is in conversation
    const accessCheck = await pool.query(`
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [conversationId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Build query
    let query = `
      SELECT 
        m.id,
        m.content,
        m.type,
        m.media_url,
        m.media_metadata,
        m.sender_id,
        m.created_at,
        m.is_edited,
        m.ephemeral_duration,
        m.expires_at,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'display_name', u.display_name,
          'avatar_url', u.avatar_url
        ) as sender,
        (
          SELECT json_agg(json_build_object(
            'emoji', r.emoji,
            'count', (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id AND emoji = r.emoji)
          ))
          FROM (SELECT DISTINCT emoji FROM message_reactions WHERE message_id = m.id) r
        ) as reactions,
        EXISTS(
          SELECT 1 FROM message_read_receipts 
          WHERE message_id = m.id AND user_id != $1
        ) as is_read
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
        AND m.is_deleted = false
        ${before ? "AND m.created_at < $3" : ""}
      ORDER BY m.created_at DESC
      LIMIT $2
    `;

    const params = before 
      ? [conversationId, parseInt(limit as string), before]
      : [conversationId, parseInt(limit as string)];

    const result = await pool.query(query, params);

    // Update last read
    await pool.query(`
      UPDATE conversation_participants
      SET last_read_at = NOW()
      WHERE conversation_id = $1 AND user_id = $2
    `, [conversationId, userId]);

    res.json({ 
      messages: result.rows.reverse(), // Return oldest first
      hasMore: result.rows.length === parseInt(limit as string)
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send a message
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id;
    const { content, type = 'text', mediaUrl, mediaMetadata, ephemeralDuration = 0 } = req.body;

    if (!content?.trim() && !mediaUrl) {
      return res.status(400).json({ error: "Message content or media required" });
    }

    // Verify user is in conversation
    const accessCheck = await pool.query(`
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [conversationId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Calculate expiration if ephemeral
    let expiresAt = null;
    if (ephemeralDuration > 0) {
      expiresAt = new Date(Date.now() + ephemeralDuration * 1000);
    }

    const result = await pool.query(`
      INSERT INTO messages (
        conversation_id, sender_id, type, content, media_url, 
        media_metadata, ephemeral_duration, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [conversationId, userId, type, content, mediaUrl, 
        JSON.stringify(mediaMetadata || {}), ephemeralDuration, expiresAt]);

    res.json({ message: result.rows[0] });
  } catch (error) {
    console.error("Error sending message:", error);
>>>>>>> Stashed changes
    res.status(500).json({ error: "Failed to send message" });
  }
});

<<<<<<< Updated upstream
/**
 * POST /api/messages/:id/reactions
 * Add reaction to message
 */
router.post("/messages/:id/reactions", async (req, res) => {
  const userId = req.user.id;
  const { id: messageId } = req.params;
  const { reaction } = req.body;
  
  if (!reaction) {
    return res.status(400).json({ error: "Reaction required" });
  }
  
  try {
    // Verify user can access this message
    const msgResult = await db.query(
      `SELECT m.id FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.id = $1 AND (c.participant_a = $2 OR c.participant_b = $2)`,
      [messageId, userId]
    );
    
    if (msgResult.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    await db.query(
      `INSERT INTO message_reactions (message_id, user_id, reaction)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id, reaction) DO NOTHING`,
      [messageId, userId, reaction]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error("[Messaging] Add reaction error:", err);
=======
// Add reaction to message
router.post("/messages/:id/reactions", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const messageId = req.params.id;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji required" });
    }

    // Verify user has access to the message's conversation
    const accessCheck = await pool.query(`
      SELECT 1 FROM messages m
      INNER JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = $1 AND cp.user_id = $2 AND cp.left_at IS NULL
    `, [messageId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    await pool.query(`
      INSERT INTO message_reactions (message_id, user_id, emoji)
      VALUES ($1, $2, $3)
      ON CONFLICT (message_id, user_id, emoji) DO NOTHING
    `, [messageId, userId, emoji]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding reaction:", error);
>>>>>>> Stashed changes
    res.status(500).json({ error: "Failed to add reaction" });
  }
});

<<<<<<< Updated upstream
/**
 * DELETE /api/conversations/:id
 * Delete/hide conversation for current user
 */
router.delete("/conversations/:id", async (req, res) => {
  const userId = req.user.id;
  const { id: conversationId } = req.params;
  
  try {
    await db.query(
      `UPDATE conversations 
       SET deleted_by_a_at = CASE WHEN participant_a = $1 THEN NOW() ELSE deleted_by_a_at END,
           deleted_by_b_at = CASE WHEN participant_b = $1 THEN NOW() ELSE deleted_by_b_at END
       WHERE id = $2 AND (participant_a = $1 OR participant_b = $1)`,
      [userId, conversationId]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error("[Messaging] Delete conversation error:", err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

/**
 * PATCH /api/conversations/:id/settings
 * Update conversation settings (ephemeral mode, encryption, etc.)
 */
router.patch("/conversations/:id/settings", async (req, res) => {
  const userId = req.user.id;
  const { id: conversationId } = req.params;
  const {
    ephemeralMode,
    ephemeralTtlSeconds,
    encryptionEnabled,
  } = req.body;

  try {
    // Verify user is part of conversation
    const convResult = await db.query(
      `SELECT id FROM conversations 
       WHERE id = $1 AND (participant_a = $2 OR participant_b = $2)
       LIMIT 1`,
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
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

    await db.query(
      `UPDATE conversations SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    res.json({ success: true, message: "Settings updated" });
  } catch (err) {
    console.error("[Messaging] Update settings error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

/**
 * POST /api/conversations/:id/upload
 * Upload media (image, video, file) for a conversation
 */
router.post("/conversations/:id/upload", async (req, res) => {
  const userId = req.user.id;
  const { id: conversationId } = req.params;

  try {
    // Verify user is part of conversation
    const convResult = await db.query(
      `SELECT id FROM conversations 
       WHERE id = $1 AND (participant_a = $2 OR participant_b = $2)
       LIMIT 1`,
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // TODO: Implement multipart upload handling
    // For now, return presigned URL for client-side upload
    const { fileType, fileName, fileSize } = req.body;

    // Generate unique file key
    const timestamp = Date.now();
    const fileKey = `chat-media/${conversationId}/${userId}/${timestamp}-${fileName}`;

    // TODO: Generate presigned URL from Supabase/S3
    // const presignedUrl = await generatePresignedUrl(fileKey, fileType);

    res.json({
      success: true,
      fileKey,
      // presignedUrl,
      uploadUrl: `/api/upload/chat-media`, // Placeholder
      message: "Upload endpoint ready - implement presigned URL generation"
    });
  } catch (err) {
    console.error("[Messaging] Upload error:", err);
    res.status(500).json({ error: "Failed to initiate upload" });
  }
});

/**
 * GET /api/admin/tiguy-cost
 * Get TI-GUY spending dashboard (admin only)
 */
router.get("/admin/tiguy-cost", async (req, res) => {
  // TODO: Add admin role check
  // if (!req.user.isAdmin) return res.status(403).json({ error: "Admin only" });
  
  try {
    const { getSpendingDashboard } = await import("../ai/tiguy-cost-monitor");
    const { getFullGoogleAIDashboard } = await import("../ai/genai-cost-monitor");
    
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
      message: genAIDashboard.status === "warning" 
        ? "⚠️ CRÉDITS GOOGLE AI ÉPUISÉS!"
        : genAIDashboard.status === "caution"
        ? "⚡ Attention: 90% des crédits utilisés"
        : "✅ Crédits Google AI OK"
    });
  } catch (err) {
    console.error("[Messaging] Cost dashboard error:", err);
    res.status(500).json({ error: "Failed to load cost data" });
=======
// Remove reaction
router.delete("/messages/:id/reactions/:emoji", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id: messageId, emoji } = req.params;

    await pool.query(`
      DELETE FROM message_reactions
      WHERE message_id = $1 AND user_id = $2 AND emoji = $3
    `, [messageId, userId, decodeURIComponent(emoji)]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing reaction:", error);
    res.status(500).json({ error: "Failed to remove reaction" });
  }
});

// Mark message as read
router.post("/messages/:id/read", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const messageId = req.params.id;

    await pool.query(`
      INSERT INTO message_read_receipts (message_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (message_id, user_id) DO NOTHING
    `, [messageId, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking read:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Search users to start conversation
router.get("/users/search", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ error: "Query must be at least 2 characters" });
    }

    const result = await pool.query(`
      SELECT 
        id, 
        username, 
        display_name,
        avatar_url,
        is_verified
      FROM users
      WHERE id != $1
        AND (username ILIKE $2 OR display_name ILIKE $2)
      ORDER BY 
        CASE WHEN username ILIKE $3 THEN 0 ELSE 1 END,
        username
      LIMIT 20
    `, [userId, `%${q}%`, `${q}%`]);

    res.json({ users: result.rows });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
>>>>>>> Stashed changes
  }
});

export default router;
