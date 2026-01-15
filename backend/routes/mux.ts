import express from "express";
import Mux from "@mux/mux-node";
import { storage } from "../storage.js";
import { runPromoBee } from "../ai/bees/promo-bee.js";
import { runModeratorBee } from "../ai/bees/moderator-bee.js";

export const muxRouter = express.Router();
const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

// Check for Mux credentials
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

// Initialize Mux client (only if credentials exist)
let mux: Mux | null = null;
if (MUX_TOKEN_ID && MUX_TOKEN_SECRET) {
  mux = new Mux({
    tokenId: MUX_TOKEN_ID,
    tokenSecret: MUX_TOKEN_SECRET,
  });
  console.log("✅ Mux client initialized successfully");
} else {
  console.error("❌ MUX CREDENTIALS MISSING! Video uploads will fail.");
  console.error("   Required environment variables:");
  console.error("   - MUX_TOKEN_ID:", MUX_TOKEN_ID ? "✅ Set" : "❌ MISSING");
  console.error("   - MUX_TOKEN_SECRET:", MUX_TOKEN_SECRET ? "✅ Set" : "❌ MISSING");
}

/**
 * [NEW] Create a Mux Direct Upload URL
 * Allows the frontend to upload large videos directly to Mux securely.
 */
muxRouter.post("/mux/create-upload", async (req, res) => {
  try {
    // Check if Mux is configured
    if (!mux) {
      console.error("❌ Mux upload failed: Credentials not configured");
      return res.status(500).json({
        error: "Video uploads are not configured. Please contact support.",
        details: "MUX_TOKEN_ID or MUX_TOKEN_SECRET missing in environment variables"
      });
    }

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ["public"],
        mp4_support: "standard",
      },
      cors_origin: "*", // Adjust this for production
    });

    res.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error: any) {
    console.error("❌ Mux create upload error:", error);
    res.status(500).json({ error: "Failed to create upload URL" });
  }
});

muxRouter.post("/webhooks/mux", async (req, res) => {
  try {
    const signature = req.headers["mux-signature"] as string;

    if (!webhookSecret) {
      console.error("❌ MUX_WEBHOOK_SECRET is not defined");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!signature) {
      return res.status(401).json({ error: "No signature" });
    }

    // Capture raw body from the request (attached in backend/index.ts)
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      console.error("❌ Raw body not found for Mux webhook");
      return res.status(400).json({ error: "Raw body is required for verification" });
    }

    // Verify the signature using the latest Mux SDK (v8+)
    if (!mux) {
      console.error("❌ Mux webhook failed: Credentials not configured");
      return res.status(500).json({ error: "Mux not configured" });
    }

    const headers = { "mux-signature": signature };
    try {
      mux.webhooks.verifySignature(rawBody.toString(), headers, webhookSecret);
    } catch (err) {
      console.error("❌ Invalid Mux signature:", err);
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body;
    console.log("✅ Mux webhook received:", event.type);

    const assetId = event.data.id;

    switch (event.type) {
      case "video.asset.ready": {
        const playbackId = event.data.playback_ids?.[0]?.id;
        console.log("🎥 Video ready:", playbackId);

        if (assetId && playbackId) {
          const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;

          // Trigger AI Swarm Analysis (Parallel Execution)
          const [aiMetadata, modResult] = await Promise.all([
            runPromoBee(thumbnailUrl),
            runModeratorBee(thumbnailUrl)
          ]);

          await storage.updatePostByMuxAssetId(assetId, {
            muxPlaybackId: playbackId,
            thumbnailUrl,
            processingStatus: "completed",
            mediaUrl: `https://stream.mux.com/${playbackId}.m3u8?max_resolution=720p`,
            duration: Math.round(event.data.duration || 0),
            aspectRatio: event.data.aspect_ratio || "16:9",
            // AI generated content
            contentFr: aiMetadata.caption_fr,
            contentEn: aiMetadata.caption_en,
            hashtags: aiMetadata.hashtags,
            detectedThemes: aiMetadata.detected_themes,
            detectedItems: aiMetadata.detected_items,
            promoUrl: aiMetadata.promo_url,
            aiGenerated: true,
            // Moderation Results
            isModerated: true,
            moderationApproved: modResult.approved,
            moderationScore: modResult.score,
            isHidden: !modResult.approved,
            moderatedAt: new Date(),
          });
        }
        break;
      }
      case "video.asset.errored": {
        console.error("❌ Video error:", event.data.errors);
        if (assetId) {
          await storage.updatePostByMuxAssetId(assetId, {
            processingStatus: "failed",
          });
        }
        break;
      }
      default:
        console.log(`ℹ️ Mux event type ${event.type} not handled`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});
