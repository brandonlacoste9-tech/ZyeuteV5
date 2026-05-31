/**
 * Moderation Routes
 * Admin dashboard endpoints + user report/appeal endpoints
 */

import { Router } from "express";
import { supabaseAdmin } from "../supabase-auth.js";
import { getModerationQueue } from "../queue.js";

const router = Router();

/**
 * POST /api/moderation/report
 * Users report content (posts, comments, DMs)
 */
router.post("/report", async (req: any, res) => {
  try {
    const reporterId = req.userId;
    if (!reporterId) return res.status(401).json({ error: "Non authentifié" });

    const { contentType, contentId, reason, userId } = req.body;
    if (!contentType || !contentId || !userId) {
      return res
        .status(400)
        .json({ error: "contentType, contentId, userId requis" });
    }

    const validTypes = ["post", "comment", "message", "bio"];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({ error: "contentType invalide" });
    }

    if (!supabaseAdmin)
      return res.status(503).json({ error: "Service indisponible" });

    // Check for duplicate report from same user
    const { data: existing } = await supabaseAdmin
      .from("moderation_logs")
      .select("id, report_count")
      .eq("content_id", contentId)
      .eq("reporter_id", reporterId)
      .single();

    if (existing) {
      // Increment report count
      await supabaseAdmin
        .from("moderation_logs")
        .update({ report_count: (existing.report_count || 1) + 1 })
        .eq("id", existing.id);
      return res.json({
        success: true,
        message: "Signalement mis à jour. Merci.",
      });
    }

    // Queue AI moderation check
    try {
      const moderationQueue = getModerationQueue();
      await moderationQueue.add("moderate-report", {
        contentType,
        contentId,
        userId,
        reporterId,
        reportReason: reason || "Signalé par un utilisateur",
      });
    } catch (qErr: any) {
      console.warn(
        "[Moderation] Queue unavailable, saving directly:",
        qErr.message,
      );
      // Fallback: save directly without AI analysis
      await supabaseAdmin.from("moderation_logs").insert({
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        reporter_id: reporterId,
        ai_severity: "low",
        ai_categories: ["user_report"],
        ai_confidence: 0,
        ai_reason: reason || "Signalé par un utilisateur",
        ai_action: "flag",
        status: "pending",
        report_reason: reason || "Signalé par un utilisateur",
      });
    }

    res.json({
      success: true,
      message: "Signalement reçu. Merci pour votre aide!",
    });
  } catch (error: any) {
    console.error("[ModerationRoute] Report error:", error);
    res.status(500).json({ error: "Erreur lors du signalement" });
  }
});

/**
 * POST /api/moderation/report-content (legacy alias)
 */
router.post("/report-content", async (req: any, res) => {
  const reporterId = req.userId;
  if (!reporterId) return res.status(401).json({ error: "Non authentifié" });

  const { postId, reason, category } = req.body || {};
  if (!postId) return res.status(400).json({ error: "postId requis" });

  if (!supabaseAdmin)
    return res.status(503).json({ error: "Service indisponible" });

  try {
    const moderationQueue = getModerationQueue();
    await moderationQueue.add("moderate-report", {
      contentType: "post",
      contentId: postId,
      userId: req.body.userId || reporterId,
      reporterId,
      reportReason: reason || category || "Signalé par utilisateur",
    });
  } catch {
    await supabaseAdmin.from("moderation_logs").insert({
      content_type: "post",
      content_id: postId,
      user_id: req.body.userId || reporterId,
      reporter_id: reporterId,
      ai_severity: "low",
      ai_categories: [category || "user_report"],
      ai_confidence: 0,
      ai_reason: reason || "Signalé par utilisateur",
      ai_action: "flag",
      status: "pending",
    });
  }

  res.json({ success: true, message: "Signalement reçu. Merci." });
});

/**
 * POST /api/moderation/block-user (legacy compatibility)
 */
router.post("/block-user", async (req: any, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  res.json({ success: true, message: "Blocage enregistré." });
});

/**
 * GET /api/moderation/queue
 * Admin: get moderation queue
 */
router.get("/queue", async (req: any, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "Service indisponible" });

  try {
    const { status, severity, type, limit = "50", offset = "0" } = req.query;

    let query = supabaseAdmin
      .from("moderation_logs")
      .select(
        "*, user:user_profiles!moderation_logs_user_id_fkey(id, username, avatar_url)",
      )
      .order("created_at", { ascending: false })
      .range(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string) - 1,
      );

    if (status && status !== "all")
      query = query.eq("status", status as string);
    if (severity && severity !== "all")
      query = query.eq("ai_severity", severity as string);
    if (type && type !== "all")
      query = query.eq("content_type", type as string);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ success: true, logs: data || [], total: count });
  } catch (error: any) {
    console.error("[ModerationRoute] Queue error:", error);
    res.status(500).json({ error: "Erreur lors du chargement de la file" });
  }
});

/**
 * GET /api/moderation/stats
 * Admin: get moderation statistics
 */
router.get("/stats", async (req: any, res) => {
  if (!supabaseAdmin)
    return res.status(503).json({ error: "Service indisponible" });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [pendingRes, reviewedRes, removedRes, bansRes] = await Promise.all([
      supabaseAdmin
        .from("moderation_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseAdmin
        .from("moderation_logs")
        .select("*", { count: "exact", head: true })
        .eq("human_reviewed", true)
        .gte("reviewed_at", todayISO),
      supabaseAdmin
        .from("moderation_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "removed")
        .gte("created_at", todayISO),
      supabaseAdmin
        .from("user_strikes")
        .select("*", { count: "exact", head: true })
        .or(
          `is_permanent_ban.eq.true,ban_until.gt.${new Date().toISOString()}`,
        ),
    ]);

    res.json({
      pending: pendingRes.count || 0,
      reviewed_today: reviewedRes.count || 0,
      removed_today: removedRes.count || 0,
      active_bans: bansRes.count || 0,
    });
  } catch (error: any) {
    console.error("[ModerationRoute] Stats error:", error);
    res.status(500).json({ error: "Erreur stats" });
  }
});

/**
 * POST /api/moderation/approve/:logId
 * Admin: approve content
 */
router.post("/approve/:logId", async (req: any, res) => {
  const reviewerId = req.userId;
  if (!reviewerId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    const { error } = await supabaseAdmin
      .from("moderation_logs")
      .update({
        status: "approved",
        human_reviewed: true,
        human_reviewer_id: reviewerId,
        human_decision: "approve",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", req.params.logId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Erreur approbation" });
  }
});

/**
 * POST /api/moderation/remove/:logId
 * Admin: remove content + update log
 */
router.post("/remove/:logId", async (req: any, res) => {
  const reviewerId = req.userId;
  if (!reviewerId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    // Get the log first
    const { data: log, error: fetchErr } = await supabaseAdmin
      .from("moderation_logs")
      .select("content_type, content_id, user_id")
      .eq("id", req.params.logId)
      .single();

    if (fetchErr || !log)
      return res.status(404).json({ error: "Log introuvable" });

    // Remove the content
    if (log.content_type === "post") {
      await supabaseAdmin
        .from("publications")
        .update({ est_masque: true, moderation_approved: false })
        .eq("id", log.content_id);
    } else if (log.content_type === "comment") {
      await supabaseAdmin
        .from("commentaires")
        .delete()
        .eq("id", log.content_id);
    } else if (log.content_type === "message") {
      await supabaseAdmin
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", log.content_id);
    }

    // Update log
    await supabaseAdmin
      .from("moderation_logs")
      .update({
        status: "removed",
        human_reviewed: true,
        human_reviewer_id: reviewerId,
        human_decision: "remove",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", req.params.logId);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Erreur suppression" });
  }
});

/**
 * POST /api/moderation/ban/:userId
 * Admin: ban a user (temp or permanent)
 */
router.post("/ban/:userId", async (req: any, res) => {
  const reviewerId = req.userId;
  if (!reviewerId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    const { duration, reason } = req.body; // duration: "temp" | "permanent"
    const banUntil =
      duration === "temp"
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    // Upsert strike record
    const { data: existing } = await supabaseAdmin
      .from("user_strikes")
      .select("id, strike_count")
      .eq("user_id", req.params.userId)
      .single();

    if (existing) {
      await supabaseAdmin
        .from("user_strikes")
        .update({
          strike_count: existing.strike_count + 1,
          ban_until: banUntil,
          is_permanent_ban: duration === "permanent",
          reason: reason || "Banni par modérateur",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", req.params.userId);
    } else {
      await supabaseAdmin.from("user_strikes").insert({
        user_id: req.params.userId,
        strike_count: 1,
        ban_until: banUntil,
        is_permanent_ban: duration === "permanent",
        reason: reason || "Banni par modérateur",
      });
    }

    res.json({
      success: true,
      message:
        duration === "permanent" ? "Banni définitivement" : "Banni 7 jours",
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erreur bannissement" });
  }
});

/**
 * POST /api/moderation/appeal
 */
router.post("/appeal", async (req: any, res) => {
  const userId = req.userId;
  if (!userId || !supabaseAdmin)
    return res.status(401).json({ error: "Non authentifié" });

  try {
    const { contentId, reason } = req.body;
    await supabaseAdmin.from("moderation_logs").insert({
      content_type: "post",
      content_id: contentId || "unknown",
      user_id: userId,
      ai_severity: "low",
      ai_categories: ["appel"],
      ai_confidence: 0,
      ai_reason: `Appel utilisateur: ${reason || "sans raison"}`,
      ai_action: "flag",
      status: "pending",
      report_reason: reason,
    });

    res.json({
      success: true,
      message: "Appel soumis. Nous examinerons votre contenu sous 48h.",
    });
  } catch (error: any) {
    res.status(500).json({ error: "Erreur appel" });
  }
});

export default router;
