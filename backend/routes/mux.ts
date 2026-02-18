/**
 * MUX Video API - Direct upload, status polling, webhooks
 * Zyeuté V5 - Quebec social media platform
 */

import { Router, Request, Response } from "express";
import Mux from "@mux/mux-node";
import { eq } from "drizzle-orm";
import { db } from "../storage.js";
import { posts } from "../../shared/schema.js";

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
        mp4_support: "standard",
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

export default router;
