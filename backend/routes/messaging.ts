/**
 * Messaging API Routes
 * Real user-to-user chat for Zyeuté
 */

import { Router } from "express";
import { db } from "../db";
import { authenticateToken } from "../middleware/auth";

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
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

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
    
    // TODO: Send real-time notification via WebSocket
    
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
    res.status(500).json({ error: "Failed to send message" });
  }
});

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
    res.status(500).json({ error: "Failed to add reaction" });
  }
});

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

export default router;
