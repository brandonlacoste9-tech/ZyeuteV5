/**
 * Group Chat API Routes
 * Extensions to messaging for N-participant conversations
 */

import { Router } from "express";
import { db, pool } from "../storage.js";
import { requireAuth as authenticateToken } from "../supabase-auth.js";
import {
  broadcastMessage,
  broadcastToConversation,
} from "../websocket/gateway";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/conversations/group
 * Create a new group conversation
 */
router.post("/group", async (req, res) => {
  const userId = req.user!.id;
  const { title, memberIds = [], description, avatarUrl } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Group title required" });
  }

  if (memberIds.length < 1) {
    return res.status(400).json({ error: "At least one member required" });
  }

  try {
    // Create conversation
    const convResult = await pool.query(
      `INSERT INTO conversations (type, title, description, avatar_url, created_by, created_at, updated_at)
       VALUES ('group', $1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [title, description, avatarUrl, userId],
    );

    const conversation = convResult.rows[0];

    // Add all members (including creator as owner)
    const allMembers = [...new Set([userId, ...memberIds])];

    for (const memberId of allMembers) {
      await pool.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
         VALUES ($1, $2, $3, NOW())`,
        [conversation.id, memberId, memberId === userId ? "owner" : "member"],
      );
    }

    // Create group settings
    await pool.query(
      `INSERT INTO group_settings (conversation_id) VALUES ($1)`,
      [conversation.id],
    );

    // Add system message
    await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content_type, content_text, created_at)
       VALUES ($1, $2, 'system', $3, NOW())`,
      [
        conversation.id,
        userId,
        `${req.user!.username} a créé le groupe "${title}"`,
      ],
    );

    res.status(201).json({
      conversation: {
        id: conversation.id,
        type: "group",
        title: conversation.title,
        description: conversation.description,
        avatarUrl: conversation.avatar_url,
        createdBy: conversation.created_by,
        createdAt: conversation.created_at,
      },
    });
  } catch (err) {
    console.error("[Group] Create error:", err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

/**
 * POST /api/conversations/:id/members
 * Add member to group
 */
router.post("/:id/members", async (req, res) => {
  const userId = req.user!.id;
  const { id: conversationId } = req.params;
  const { userId: newMemberId } = req.body;

  try {
    // Check if user is admin/owner
    const roleResult = await pool.query(
      `SELECT role FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    if (
      roleResult.rows.length === 0 ||
      !["owner", "admin"].includes(roleResult.rows[0].role)
    ) {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Add new member
    await pool.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
       VALUES ($1, $2, 'member', NOW())
       ON CONFLICT DO NOTHING`,
      [conversationId, newMemberId],
    );

    // Get new member info
    const userResult = await pool.query(
      `SELECT username, display_name FROM users WHERE id = $1`,
      [newMemberId],
    );

    const newMember = userResult.rows[0];

    // Add system message
    await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content_type, content_text, created_at)
       VALUES ($1, $2, 'system', $3, NOW())`,
      [conversationId, userId, `${newMember.display_name} a rejoint le groupe`],
    );

    // Broadcast to group
    const { io } = req.app.get("websocket") || {};
    if (io) {
      await broadcastToConversation(io, conversationId, "member:joined", {
        userId: newMemberId,
        username: newMember.username,
        displayName: newMember.display_name,
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Group] Add member error:", err);
    res.status(500).json({ error: "Failed to add member" });
  }
});

/**
 * DELETE /api/conversations/:id/members/:userId
 * Remove member from group (or leave)
 */
router.delete("/:id/members/:memberId", async (req, res) => {
  const userId = req.user!.id;
  const { id: conversationId, memberId } = req.params;
  const isSelfRemoval = memberId === "me" || memberId === userId;

  try {
    if (!isSelfRemoval) {
      // Check if user is admin/owner
      const roleResult = await pool.query(
        `SELECT role FROM conversation_participants
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId],
      );

      if (
        roleResult.rows.length === 0 ||
        !["owner", "admin"].includes(roleResult.rows[0].role)
      ) {
        return res
          .status(403)
          .json({ error: "Only admins can remove members" });
      }
    }

    const targetId = isSelfRemoval ? userId : memberId;

    // Get user info before removing
    const userResult = await pool.query(
      `SELECT username, display_name FROM users WHERE id = $1`,
      [targetId],
    );

    // Remove member
    await pool.query(
      `DELETE FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, targetId],
    );

    // Add system message
    const actionText = isSelfRemoval
      ? "a quitté le groupe"
      : "a été retiré du groupe";
    await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content_type, content_text, created_at)
       VALUES ($1, $2, 'system', $3, NOW())`,
      [
        conversationId,
        userId,
        `${userResult.rows[0].display_name} ${actionText}`,
      ],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("[Group] Remove member error:", err);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

/**
 * GET /api/conversations/:id/members
 * Get group members
 */
router.get("/:id/members", async (req, res) => {
  const userId = req.user!.id;
  const { id: conversationId } = req.params;

  try {
    // Check if user is member
    const memberCheck = await pool.query(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    // Get members with user info
    const result = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        cp.role,
        cp.joined_at,
        cp.muted_until,
        EXISTS (
          SELECT 1 FROM user_presence up 
          WHERE up.user_id = u.id 
          AND up.last_seen > NOW() - INTERVAL '5 minutes'
        ) as is_online
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = $1
      ORDER BY 
        CASE cp.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
        u.display_name`,
      [conversationId],
    );

    res.json({ members: result.rows });
  } catch (err) {
    console.error("[Group] Get members error:", err);
    res.status(500).json({ error: "Failed to get members" });
  }
});

/**
 * PATCH /api/conversations/:id
 * Update group info
 */
router.patch("/:id", async (req, res) => {
  const userId = req.user!.id;
  const { id: conversationId } = req.params;
  const { title, description, avatarUrl } = req.body;

  try {
    // Check if user is admin/owner
    const roleResult = await pool.query(
      `SELECT role FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId],
    );

    if (
      roleResult.rows.length === 0 ||
      !["owner", "admin"].includes(roleResult.rows[0].role)
    ) {
      return res.status(403).json({ error: "Only admins can edit group" });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (avatarUrl) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(avatarUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    values.push(conversationId);

    await pool.query(
      `UPDATE conversations SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      values,
    );

    res.json({ success: true });
  } catch (err) {
    console.error("[Group] Update error:", err);
    res.status(500).json({ error: "Failed to update group" });
  }
});

export default router;
