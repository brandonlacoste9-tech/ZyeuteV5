/**
 * MUX Video API - Direct upload, status polling, webhooks
 * Zyeuté V5 - Quebec social media platform
 */

import { Router, Request, Response } from "express";
import Mux from "@mux/mux-node";
import { eq } from "drizzle-orm";
import { db } from "../storage.js";
import { posts } from "../../shared/schema.js";
import { supabaseAdmin, requireAuth } from "../supabase-auth.js";

const router = Router();

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;
const MUX_WEBHOOK_SECRET = process.env.MUX_WEBHOOK_SECRET;

let mux: Mux | null = null;
if (MUX_TOKEN_ID && MUX_TOKEN_SECRET) {
  mux = new Mux({
    tokenId: MUX_TOKEN_ID,
    tokenSecret: MUX_TOKEN_SECRET,
  });
  console.log("✅ Mux client initialized successfully");
} else {
  console.warn(
    "⚠️ MUX_TOKEN_ID or MUX_TOKEN_SECRET missing. MUX upload disabled.",
  );
}

const Video = mux?.video || null;

export interface MuxUploadResponse {
  uploadUrl: string;
  uploadId: string;
}

/**
 * POST /api/mux/create-upload
 * Create direct upload URL for MUX (chunked upload via UpChunk)
 */
router.post("/create-upload", async (req: Request, res: Response) => {
  if (!mux || !Video) {
    return res.status(503).json({
      success: false,
      error: "MUX non configuré. Vérifiez MUX_TOKEN_ID et MUX_TOKEN_SECRET.",
    });
  }

  try {
    const corsOrigin = req.body.cors_origin || process.env.FRONTEND_URL || "*";

    const upload = await Video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        // mp4_support: "standard", // Deprecated for basic assets
      },
      cors_origin: corsOrigin,
    });

    return res.status(200).json({
      success: true,
      data: {
        uploadUrl: upload.url,
        uploadId: upload.id,
      } as MuxUploadResponse,
    });
  } catch (error) {
    console.error("[MUX] Erreur création upload:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la création de l'upload",
    });
  }
});

/**
 * GET /api/mux/upload-status/:uploadId
 * Poll upload/processing status
 */
router.get("/upload-status/:uploadId", async (req: Request, res: Response) => {
  if (!mux || !Video) {
    return res.status(503).json({
      success: false,
      error: "MUX non configuré",
    });
  }

  try {
    const { uploadId } = req.params;
    const upload = await Video.uploads.retrieve(uploadId as string);
    const assetId = upload.asset_id;

    if (!assetId) {
      return res.status(200).json({
        success: true,
        data: {
          status: "preparing",
          uploadId,
          assetId: null,
          playbackId: null,
        },
      });
    }

    const asset = await Video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id ?? null;

    return res.status(200).json({
      success: true,
      data: {
        status: asset.status,
        uploadId,
        assetId,
        playbackId,
        duration: asset.duration,
      },
    });
  } catch (error) {
    console.error("[MUX] Erreur statut upload:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la vérification du statut",
    });
  }
});

/**
 * POST /api/mux/webhooks
 * MUX webhook for video.asset.ready, video.asset.errored
 */
router.post("/webhooks", async (req: Request, res: Response) => {
  const signature = req.headers["mux-signature"] as string;

  if (!signature) {
    return res.status(400).json({ error: "Signature manquante" });
  }

  if (!MUX_WEBHOOK_SECRET) {
    console.warn("[MUX] MUX_WEBHOOK_SECRET non configuré, webhook non vérifié");
  } else if (mux) {
    try {
      // Mux verifySignature expects headers object and throws on error
      mux.webhooks.verifySignature(
        JSON.stringify(req.body),
        req.headers as any,
        MUX_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("[MUX] Signature verification failed:", err);
      return res.status(401).json({ error: "Signature invalide" });
    }
  }

  const { type, data } = req.body;

  try {
    switch (type) {
      case "video.asset.ready": {
        const assetId = data?.id;
        if (!assetId || !Video) break;

        const asset = await Video.assets.retrieve(assetId);
        const playbackId = asset?.playback_ids?.[0]?.id;
        const duration = asset?.duration;
        const maxStorageDuration = asset?.max_stored_resolution;

        if (!playbackId) {
          console.warn(
            "[MUX] video.asset.ready: pas de playback_id pour",
            assetId,
          );
          break;
        }

        // Update post by mux_asset_id
        const hlsUrl = `https://stream.mux.com/${playbackId}.m3u8`;
        const posterUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

        await db
          .update(posts)
          .set({
            muxPlaybackId: playbackId,
            mediaUrl: hlsUrl,
            hlsUrl,
            thumbnailUrl: posterUrl,
            duration: duration ? Math.round(duration) : null,
            processingStatus: "completed",
            enhanceFinishedAt: new Date(),
          })
          .where(eq(posts.muxAssetId, assetId));

        console.log(
          "[MUX] Post mis à jour:",
          assetId,
          "playbackId:",
          playbackId,
        );
        break;
      }

      case "video.asset.errored":
        console.error("[MUX] Erreur traitement vidéo:", data?.id, data?.errors);
        await db
          .update(posts)
          .set({ processingStatus: "failed" })
          .where(eq(posts.muxAssetId, data?.id || ""));
        break;

      case "video.asset.created":
        console.log("[MUX] Vidéo créée:", data?.id);
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[MUX] Erreur webhook:", error);
    return res.status(500).json({ error: "Erreur traitement webhook" });
  }
});

// ─── LIVE STREAM ROUTES ────────────────────────────────────────────────────

/**
 * POST /api/mux/create-livestream
 * Create a Mux Live Stream and return RTMP URL + stream key to the broadcaster
 */
router.post(
  "/create-livestream",
  requireAuth,
  async (req: Request, res: Response) => {
    if (!mux || !Video) {
      return res.status(503).json({
        success: false,
        error: "MUX non configuré. Vérifiez MUX_TOKEN_ID et MUX_TOKEN_SECRET.",
      });
    }

    try {
      const { title = "Live Zyeuté", category = "général" } = req.body;
      const userId = (req as any).userId as string;

      const liveStream = await mux.video.liveStreams.create({
        playback_policy: ["public"],
        new_asset_settings: {
          playback_policy: ["public"],
        },
        latency_mode: "low",
      });

      const playbackId = liveStream.playback_ids?.[0]?.id ?? null;
      const streamKey = liveStream.stream_key;
      const rtmpUrl = "rtmps://global-live.mux.com:443/app";

      // Register stream in live_streams table so LiveDiscover can show it
      if (supabaseAdmin && userId) {
        const { error: insertError } = await supabaseAdmin
          .from("live_streams")
          .insert({
            id: liveStream.id,
            user_id: userId,
            title,
            category,
            playback_id: playbackId,
            status: "active",
          });
        if (insertError) {
          console.warn(
            "[MUX LIVE] Failed to insert into live_streams:",
            insertError.message,
          );
        }
      }

      console.log(
        `[MUX LIVE] Created live stream: ${liveStream.id} title="${title}" category="${category}"`,
      );

      return res.status(200).json({
        success: true,
        data: {
          streamId: liveStream.id,
          streamKey,
          rtmpUrl,
          playbackId,
          title,
          category,
        },
      });
    } catch (error) {
      console.error("[MUX LIVE] Erreur création live stream:", error);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la création du live",
      });
    }
  },
);

/**
 * GET /api/mux/livestream-status/:streamId
 * Get live stream status and playback ID (used by WatchLive to poll)
 * :streamId can be either the Mux stream ID or a playback ID
 */
router.get(
  "/livestream-status/:streamId",
  async (req: Request, res: Response) => {
    if (!mux || !Video) {
      return res
        .status(503)
        .json({ success: false, error: "MUX non configuré" });
    }

    try {
      const { streamId } = req.params;

      let liveStream;
      try {
        liveStream = await mux.video.liveStreams.retrieve(streamId as string);
      } catch {
        return res
          .status(404)
          .json({ success: false, error: "Live stream non trouvé" });
      }

      const playbackId = liveStream.playback_ids?.[0]?.id ?? null;

      return res.status(200).json({
        success: true,
        data: {
          streamId: liveStream.id,
          status: liveStream.status, // idle | active | disabled | reconnecting
          playbackId,
          recentAssetIds: liveStream.recent_asset_ids ?? [],
        },
      });
    } catch (error) {
      console.error("[MUX LIVE] Erreur statut live stream:", error);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la vérification du statut",
      });
    }
  },
);

/**
 * DELETE /api/mux/end-livestream/:streamId
 * Complete/disable a live stream
 */
router.delete(
  "/end-livestream/:streamId",
  async (req: Request, res: Response) => {
    if (!mux || !Video) {
      return res
        .status(503)
        .json({ success: false, error: "MUX non configuré" });
    }

    try {
      const { streamId } = req.params;
      await mux.video.liveStreams.complete(streamId as string);

      // Remove from live_streams table so LiveDiscover stops showing it
      if (supabaseAdmin) {
        await supabaseAdmin
          .from("live_streams")
          .update({ status: "ended", ended_at: new Date().toISOString() })
          .eq("id", streamId);
      }

      console.log(`[MUX LIVE] Ended live stream: ${streamId}`);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("[MUX LIVE] Erreur fin live stream:", error);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la fin du live",
      });
    }
  },
);

/**
 * GET /api/mux/asset-captions/:assetId
 * Retrieve Mux auto-generated text tracks (transcription) for a VOD asset.
 * Returns an array of CaptionLine { startTime, endTime, text }.
 */
router.get("/asset-captions/:assetId", async (req: Request, res: Response) => {
  if (!mux || !Video) {
    return res.status(503).json({ success: false, error: "MUX non configuré" });
  }

  try {
    const { assetId } = req.params;
    const asset = await Video.assets.retrieve(assetId as string);
    const tracks = asset.tracks ?? [];

    // Find the auto-generated transcription track
    const textTrack = tracks.find(
      (t: any) =>
        t.type === "text" &&
        (t.text_type === "subtitles" || t.text_source === "auto-generated"),
    );

    if (!textTrack) {
      return res.status(200).json({
        success: true,
        data: [], // No captions yet — asset may still be processing
      });
    }

    // Mux delivers tracks as a WebVTT URL — fetch and parse it
    const vttUrl = `https://stream.mux.com/${asset.playback_ids?.[0]?.id}/text/${textTrack.id}.vtt`;

    const vttRes = await fetch(vttUrl);
    if (!vttRes.ok) {
      return res.status(200).json({ success: true, data: [] });
    }

    const vttText = await vttRes.text();
    const captions = parseWebVTT(vttText);

    return res.status(200).json({ success: true, data: captions });
  } catch (error) {
    console.error("[MUX] Erreur captions:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des captions",
    });
  }
});

/**
 * GET /api/mux/playback-captions/:playbackId
 * Same as asset-captions but identified by playback ID (for client-side use).
 */
router.get(
  "/playback-captions/:playbackId",
  async (req: Request, res: Response) => {
    if (!mux || !Video) {
      return res
        .status(503)
        .json({ success: false, error: "MUX non configuré" });
    }

    try {
      const { playbackId } = req.params;

      // Find asset by playback ID — list recent assets and match
      const assets = await Video.assets.list({ limit: 100 });
      const asset = assets.data?.find((a: any) =>
        a.playback_ids?.some((p: any) => p.id === playbackId),
      );

      if (!asset) {
        return res
          .status(404)
          .json({ success: false, error: "Asset non trouvé" });
      }

      const tracks = asset.tracks ?? [];
      const textTrack = tracks.find(
        (t: any) =>
          t.type === "text" &&
          (t.text_type === "subtitles" || t.text_source === "auto-generated"),
      );

      if (!textTrack) {
        return res.status(200).json({ success: true, data: [] });
      }

      const vttUrl = `https://stream.mux.com/${playbackId}/text/${textTrack.id}.vtt`;
      const vttRes = await fetch(vttUrl);
      if (!vttRes.ok) {
        return res.status(200).json({ success: true, data: [] });
      }

      const vttText = await vttRes.text();
      const captions = parseWebVTT(vttText);

      return res.status(200).json({ success: true, data: captions });
    } catch (error) {
      console.error("[MUX] Erreur playback captions:", error);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la récupération des captions",
      });
    }
  },
);

/**
 * Parse a WebVTT string into an array of { startTime, endTime, text } objects.
 */
function parseWebVTT(
  vtt: string,
): { startTime: number; endTime: number; text: string }[] {
  const captions: { startTime: number; endTime: number; text: string }[] = [];
  const blocks = vtt.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timeLine = lines.find((l) => l.includes("--> "));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split(" --> ");
    const textLines = lines
      .filter((l) => !l.includes("--> ") && !/^\d+$/.test(l.trim()))
      .join(" ")
      .trim();

    if (!textLines) continue;

    captions.push({
      startTime: vttTimeToSeconds(startStr.trim()),
      endTime: vttTimeToSeconds(endStr.trim()),
      text: textLines,
    });
  }

  return captions;
}

/** Convert VTT timestamp (HH:MM:SS.mmm or MM:SS.mmm) to seconds */
function vttTimeToSeconds(ts: string): number {
  const parts = ts.split(":").map(parseFloat);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

/**
 * GET /api/mux/video-stats
 * Returns per-video view count and engagement from Mux metrics API
 * Requires auth — returns stats for videos owned by the requesting user
 */
router.get("/video-stats", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!mux || !Video) {
      return res
        .status(503)
        .json({ success: false, error: "Mux non configuré" });
    }

    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: "Non autorisé" });

    // Get this user's posts that have a mux_asset_id
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      "";
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: userPosts } = await supabase
      .from("publications")
      .select(
        "id, caption, mux_asset_id, mux_playback_id, thumbnail_url, view_count, reactions_count, comments_count",
      )
      .eq("user_id", userId)
      .not("mux_asset_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!userPosts || userPosts.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get Mux asset details for each post
    const stats = await Promise.allSettled(
      userPosts.map(async (post: any) => {
        try {
          const asset = await Video.assets.retrieve(post.mux_asset_id);
          return {
            postId: post.id,
            caption: post.caption || "Sans titre",
            thumbnailUrl: post.mux_playback_id
              ? `https://image.mux.com/${post.mux_playback_id}/thumbnail.jpg?width=120&height=214&fit_mode=smartcrop`
              : post.thumbnail_url,
            duration: asset.duration ? Math.round(asset.duration) : null,
            viewCount: post.view_count || 0,
            reactionsCount: post.reactions_count || 0,
            commentsCount: post.comments_count || 0,
            muxStatus: asset.status,
            resolution: asset.max_stored_resolution,
          };
        } catch {
          return {
            postId: post.id,
            caption: post.caption || "Sans titre",
            thumbnailUrl: post.thumbnail_url,
            duration: null,
            viewCount: post.view_count || 0,
            reactionsCount: post.reactions_count || 0,
            commentsCount: post.comments_count || 0,
            muxStatus: "unknown",
            resolution: null,
          };
        }
      }),
    );

    const data = stats
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value);

    return res.json({ success: true, data });
  } catch (error) {
    console.error("[MUX] video-stats error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Erreur stats vidéo" });
  }
});

/**
 * POST /api/mux/create-whip-livestream
 * Create a Mux Live Stream with WHIP ingest enabled so the browser
 * can publish directly via WebRTC (no OBS needed).
 * Returns the WHIP endpoint URL + stream key + playback ID.
 */
router.post(
  "/create-whip-livestream",
  requireAuth,
  async (req: Request, res: Response) => {
    if (!mux || !Video) {
      return res.status(503).json({
        success: false,
        error: "MUX non configuré.",
      });
    }

    try {
      const { title = "Live Zyeuté", category = "général" } = req.body;
      const userId = (req as any).userId as string;

      // Create a low-latency live stream with WHIP enabled
      const liveStream = await mux.video.liveStreams.create({
        playback_policy: ["public"],
        new_asset_settings: { playback_policy: ["public"] },
        latency_mode: "ultra-low",
      });

      const playbackId = liveStream.playback_ids?.[0]?.id ?? null;
      const streamKey = liveStream.stream_key;
      // Mux WHIP endpoint format
      const whipUrl = `https://global-live.mux.com:443/app/${streamKey}/whip`;

      // Register in live_streams table
      if (supabaseAdmin && userId) {
        const { error: insertError } = await supabaseAdmin
          .from("live_streams")
          .insert({
            id: liveStream.id,
            user_id: userId,
            title,
            category,
            playback_id: playbackId,
            status: "active",
          });
        if (insertError) {
          console.warn(
            "[MUX WHIP] Failed to insert live_streams:",
            insertError.message,
          );
        }
      }

      console.log(
        `[MUX WHIP] Created WHIP stream: ${liveStream.id} title="${title}"`,
      );

      return res.status(200).json({
        success: true,
        data: {
          streamId: liveStream.id,
          streamKey,
          whipUrl,
          playbackId,
          title,
          category,
        },
      });
    } catch (error) {
      console.error("[MUX WHIP] Erreur création:", error);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la création du live WHIP",
      });
    }
  },
);

export default router;
