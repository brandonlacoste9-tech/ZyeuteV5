/**
 * Messaging API Routes — rewritten to use Supabase (no pool/DATABASE_URL needed)
 *
 * GET  /api/messaging/conversations          — inbox
 * POST /api/messaging/conversations/direct  — start or get DM thread
 * GET  /api/messaging/conversations/:id/messages  — message history
 * POST /api/messaging/conversations/:id/messages  — send message
 * POST /api/messaging/messages/:id/read     — mark read
 * DELETE /api/messaging/messages/:id        — soft-delete own message
 * POST /api/messaging/conversations/:id/upload — upload image/file to chat-media bucket
 * DELETE /api/messaging/conversations/:id   — delete conversation
 * GET  /api/messaging/users/search          — search users to DM
 */

import express from "express";
import { z } from "zod";
import multer from "multer";
import { requireAuth } from "../supabase-auth.js";
import { supabaseAdmin } from "../supabase-auth.js";

const router = express.Router();

// ─── GET /conversations ───────────────────────────────────────────────────────
router.get("/conversations", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;

    const { data, error } = await supabaseAdmin
      .from("conversations")
      .select(
        `
        id, created_at, updated_at, last_message_at, ephemeral_mode,
        participant_a, participant_b,
        unread_count_a, unread_count_b,
        last_message:last_message_id (
          id, content_text, created_at, sender_id
        )
      `,
      )
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .is("deleted_by_a_at", null)
      .is("deleted_by_b_at", null)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) throw error;

    // Enrich with other user's profile
    const otherIds = (data || []).map((c) =>
      c.participant_a === userId ? c.participant_b : c.participant_a,
    );
    const uniqueIds = [...new Set(otherIds)];

    const profiles: Record<string, any> = {};
    if (uniqueIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("user_profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", uniqueIds);
      (users || []).forEach((u) => (profiles[u.id] = u));
    }

    const conversations = (data || []).map((c) => {
      const otherId =
        c.participant_a === userId ? c.participant_b : c.participant_a;
      const unread =
        c.participant_a === userId ? c.unread_count_a : c.unread_count_b;
      const rawLast = Array.isArray(c.last_message)
        ? c.last_message[0] || null
        : c.last_message || null;
      return {
        id: c.id,
        createdAt: c.created_at,
        lastMessageAt: c.last_message_at,
        ephemeralMode: c.ephemeral_mode,
        unreadCount: unread || 0,
        otherUser: profiles[otherId] || {
          id: otherId,
          username: "Utilisateur",
        },
        lastMessage: rawLast
          ? {
              id: rawLast.id,
              content: rawLast.content_text,
              createdAt: rawLast.created_at,
              senderId: rawLast.sender_id,
            }
          : null,
      };
    });

    return res.json({ conversations });
  } catch (err: any) {
    console.error("[Messaging] conversations error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /conversations/direct ──────────────────────────────────────────────
const DirectConvSchema = z.object({
  recipientId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

router.post("/conversations/direct", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;
    const parsed = DirectConvSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0].message });
    const body = parsed.data;
    const targetId = body.recipientId || body.userId;

    if (!targetId) return res.status(400).json({ error: "recipientId requis" });
    if (targetId === userId)
      return res.status(400).json({ error: "Impossible de se DM soi-même" });

    // Check if conversation already exists
    const { data: existing } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .or(
        `and(participant_a.eq.${userId},participant_b.eq.${targetId}),and(participant_a.eq.${targetId},participant_b.eq.${userId})`,
      )
      .maybeSingle();

    if (existing)
      return res.json({
        conversation: { id: existing.id },
        conversationId: existing.id,
        isNew: false,
      });

    // Verify recipient exists
    const { data: recipient } = await supabaseAdmin
      .from("user_profiles")
      .select("id, username")
      .eq("id", targetId)
      .single();

    if (!recipient)
      return res.status(404).json({ error: "Utilisateur introuvable" });

    // Create new conversation
    const { data: conv, error } = await supabaseAdmin
      .from("conversations")
      .insert({
        participant_a: userId,
        participant_b: targetId,
      })
      .select("id")
      .single();

    if (error) throw error;

    return res.json({
      conversation: { id: conv.id },
      conversationId: conv.id,
      isNew: true,
    });
  } catch (err: any) {
    console.error("[Messaging] create direct error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /conversations/:id/messages ─────────────────────────────────────────
router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;
    const convId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string | undefined;

    // Verify user is participant
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("participant_a, participant_b")
      .eq("id", convId)
      .single();

    if (
      !conv ||
      (conv.participant_a !== userId && conv.participant_b !== userId)
    ) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    let query = supabaseAdmin
      .from("messages")
      .select(
        `id, content_text, content_type, content_url, created_at, sender_id, is_read,
         sender:sender_id (id, username, display_name, avatar_url)`,
      )
      .eq("conversation_id", convId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) query = query.lt("created_at", before);

    const { data: rawMessages, error } = await query;
    if (error) throw error;

    // Mark messages as read
    await supabaseAdmin
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", convId)
      .neq("sender_id", userId)
      .eq("is_read", false);

    // Reset unread count for this user
    const field =
      conv.participant_a === userId ? "unread_count_a" : "unread_count_b";
    await supabaseAdmin
      .from("conversations")
      .update({ [field]: 0 })
      .eq("id", convId);

    // Normalize to camelCase for frontend
    const messages = (rawMessages || []).reverse().map((m: any) => {
      const senderRaw = Array.isArray(m.sender) ? m.sender[0] : m.sender;
      return {
        id: m.id,
        content: m.content_text,
        contentType: m.content_type,
        contentUrl: m.content_url,
        senderId: m.sender_id,
        isRead: m.is_read,
        createdAt: m.created_at,
        sender: senderRaw
          ? {
              id: senderRaw.id,
              username: senderRaw.username,
              displayName: senderRaw.display_name,
              avatarUrl: senderRaw.avatar_url,
            }
          : undefined,
      };
    });

    return res.json({ messages });
  } catch (err: any) {
    console.error("[Messaging] get messages error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /conversations/:id/messages ────────────────────────────────────────
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;
    const convId = req.params.id;
    const SendMessageSchema = z.object({
      content: z.string().min(1).max(5000),
      contentType: z
        .enum(["text", "image", "file", "audio"])
        .optional()
        .default("text"),
      contentUrl: z.string().url().optional(),
    });
    const parsed = SendMessageSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.issues[0].message });
    const { content, contentType = "text", contentUrl } = parsed.data;

    // Verify participant
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("participant_a, participant_b")
      .eq("id", convId)
      .single();

    if (
      !conv ||
      (conv.participant_a !== userId && conv.participant_b !== userId)
    ) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // Insert message
    const { data: msg, error } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: convId,
        sender_id: userId,
        content_text: content.trim(),
        content_type: contentType,
        ...(contentUrl ? { content_url: contentUrl } : {}),
      })
      .select(
        "id, content_text, content_type, content_url, created_at, sender_id, is_read",
      )
      .single();

    if (error) throw error;

    // Increment recipient's unread counter atomically, then update last_message pointer
    const isA = conv.participant_a === userId;
    const unreadField = isA ? "unread_count_b" : "unread_count_a";

    await supabaseAdmin.rpc("increment_unread", {
      conv_id: convId,
      field_name: unreadField,
    });

    await supabaseAdmin
      .from("conversations")
      .update({
        last_message_id: msg.id,
        last_message_at: msg.created_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", convId);

    return res.json({
      message: {
        id: msg.id,
        content: msg.content_text,
        contentType: msg.content_type,
        contentUrl: msg.content_url ?? null,
        senderId: msg.sender_id,
        isRead: msg.is_read,
        createdAt: msg.created_at,
      },
    });
  } catch (err: any) {
    console.error("[Messaging] send message error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /messages/:id/read ──────────────────────────────────────────────────
router.post("/messages/:id/read", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    await supabaseAdmin
      .from("messages")
      .update({ is_read: true })
      .eq("id", req.params.id)
      .neq("sender_id", req.userId!);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /conversations/:id ────────────────────────────────────────────────
router.delete("/conversations/:id", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;
    const convId = req.params.id;

    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("participant_a, participant_b")
      .eq("id", convId)
      .single();

    if (
      !conv ||
      (conv.participant_a !== userId && conv.participant_b !== userId)
    ) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const field =
      conv.participant_a === userId ? "deleted_by_a_at" : "deleted_by_b_at";

    await supabaseAdmin
      .from("conversations")
      .update({ [field]: new Date().toISOString() })
      .eq("id", convId);

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /messages/:id ───────────────────────────────────────────────────
// Soft-deletes a message (sets deleted_at). Only the sender can delete their own.
router.delete("/messages/:id", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const userId = req.userId!;
    const msgId = req.params.id;

    // Verify sender owns this message
    const { data: msg } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, conversation_id")
      .eq("id", msgId)
      .single();

    if (!msg) return res.status(404).json({ error: "Message introuvable" });
    if (msg.sender_id !== userId)
      return res
        .status(403)
        .json({ error: "Tu ne peux supprimer que tes propres messages" });

    await supabaseAdmin
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", msgId);

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("[Messaging] delete message error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── POST /conversations/:id/upload ──────────────────────────────────────────
// Uploads a file to chat-media bucket and returns its public URL.
// Client then calls POST /conversations/:id/messages with content_type + content_url.
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

router.post(
  "/conversations/:id/upload",
  requireAuth,
  chatUpload.single("file"),
  async (req, res) => {
    if (!supabaseAdmin)
      return res.status(503).json({ error: "DB not configured" });
    try {
      const userId = req.userId!;
      const convId = req.params.id;

      if (!req.file)
        return res.status(400).json({ error: "Aucun fichier reçu" });

      // Verify participant
      const { data: conv } = await supabaseAdmin
        .from("conversations")
        .select("participant_a, participant_b")
        .eq("id", convId)
        .single();

      if (
        !conv ||
        (conv.participant_a !== userId && conv.participant_b !== userId)
      )
        return res.status(403).json({ error: "Accès refusé" });

      const ext =
        req.file.originalname.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${userId}/${convId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from("chat-media")
        .upload(path, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabaseAdmin.storage
        .from("chat-media")
        .getPublicUrl(path);

      // Determine content type for the message
      const mime = req.file.mimetype;
      let contentType = "file";
      if (mime.startsWith("image/")) contentType = "image";
      else if (mime.startsWith("video/")) contentType = "video";

      return res.json({
        url: urlData.publicUrl,
        contentType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: mime,
      });
    } catch (err: any) {
      console.error("[Messaging] upload error:", err);
      return res.status(500).json({ error: err.message });
    }
  },
);

// ─── GET /users/search ────────────────────────────────────────────────────────
router.get("/users/search", requireAuth, async (req, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "DB not configured" });
  try {
    const q = ((req.query.q as string) || "").trim();
    if (!q || q.length < 2) return res.json({ users: [] });

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq("id", req.userId!)
      .limit(10);

    if (error) throw error;
    return res.json({ users: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
