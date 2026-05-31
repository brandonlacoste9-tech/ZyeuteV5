/**
 * Live Streaming Routes
 * Manages live stream lifecycle + real-time chat
 */
import { Router } from "express";
import { supabaseAdmin } from "../supabase-auth.js";

const router = Router();

// GET /api/live — get active live streams
router.get("/", async (req: any, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "Service indisponible" });
  try {
    const { data, error } = await supabaseAdmin
      .from("live_streams")
      .select(
        "*, user:user_profiles!live_streams_user_id_fkey(id, username, avatar_url, subscription_tier)",
      )
      .eq("status", "active")
      .order("viewer_count", { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ streams: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live/start — start a live stream
router.post("/start", async (req: any, res) => {
  const userId = req.userId;
  if (!userId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    const { title, description, region } = req.body;

    // Check for existing active stream
    const { data: existing } = await supabaseAdmin
      .from("live_streams")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (existing) {
      return res.json({ stream: existing, alreadyLive: true });
    }

    // Create stream record
    const { data, error } = await supabaseAdmin
      .from("live_streams")
      .insert({
        user_id: userId,
        title: title || "Live en cours",
        description: description || "",
        region: region || "montreal",
        status: "active",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ stream: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live/:id/end — end a live stream
router.post("/:id/end", async (req: any, res) => {
  const userId = req.userId;
  if (!userId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    const { error } = await supabaseAdmin
      .from("live_streams")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("user_id", userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/live/:id — get single stream info
router.get("/:id", async (req: any, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "Service indisponible" });
  try {
    const { data, error } = await supabaseAdmin
      .from("live_streams")
      .select(
        "*, user:user_profiles!live_streams_user_id_fkey(id, username, avatar_url, subscription_tier)",
      )
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    res.json({ stream: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/live/:id/messages — get live chat messages
router.get("/:id/messages", async (req: any, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "Service indisponible" });
  try {
    const { data, error } = await supabaseAdmin
      .from("live_messages")
      .select("*")
      .eq("stream_id", req.params.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ messages: (data || []).reverse() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live/:id/message — send a chat message
router.post("/:id/message", async (req: any, res) => {
  const userId = req.userId;
  if (!userId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    const { message, username, avatarUrl } = req.body;
    if (!message || message.trim().length === 0)
      return res.status(400).json({ error: "Message vide" });

    const { data, error } = await supabaseAdmin
      .from("live_messages")
      .insert({
        stream_id: req.params.id,
        user_id: userId,
        username: username || "Anonyme",
        avatar_url: avatarUrl || null,
        message: message.substring(0, 200),
        message_type: "chat",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live/:id/gift — send a gift during live
router.post("/:id/gift", async (req: any, res) => {
  const userId = req.userId;
  if (!userId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    const { giftName, giftAmount, username, avatarUrl } = req.body;

    await supabaseAdmin.from("live_messages").insert({
      stream_id: req.params.id,
      user_id: userId,
      username: username || "Anonyme",
      avatar_url: avatarUrl || null,
      message: `a envoyé ${giftName}! 🎁`,
      message_type: "gift",
      gift_name: giftName,
      gift_amount: giftAmount || 0,
    });

    // Update stream gift total
    await supabaseAdmin
      .rpc("increment_stream_gifts", {
        stream_id: req.params.id,
        amount: giftAmount || 0,
      })
      .then(
        () => {},
        () => {},
      );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live/:id/viewer — increment viewer count
router.post("/:id/viewer", async (req: any, res) => {
  if (!supabaseAdmin) return res.json({ success: true });
  try {
    const { action } = req.body; // "join" or "leave"
    if (action === "join") {
      await supabaseAdmin
        .rpc("increment_viewer_count", { stream_id: req.params.id })
        .then(
          () => {},
          () => {},
        );
    }
    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

export default router;
