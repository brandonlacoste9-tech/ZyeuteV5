import express from "express";
import Mux from "@mux/mux-node";
import { storage } from "../storage.js";
import { runPromoBee } from "../ai/bees/promo-bee.js";
import { runModeratorBee } from "../ai/bees/moderator-bee.js";

export const muxRouter = express.Router();
import multer from 'multer';
import axios from 'axios';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for now
});
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
 * 0. Sanity Check Endpoint
 */
muxRouter.get("/test-create-video", async (req, res) => {
  try {
    if (!mux) return res.status(500).json({ error: "Mux not configured" });
    
    const testUrl =
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4';
    const asset = await mux.video.assets.create({
      input: [{ url: testUrl }],
      playback_policy: ['public'],
    });
    res.json({
      success: true,
      assetId: asset.id,
      playbackId: asset.playback_ids?.[0]?.id,
      playbackUrl: `https://stream.mux.com/${asset.playback_ids?.[0]?.id}.m3u8`,
      dashboardUrl: `https://dashboard.mux.com/assets/${asset.id}`
    });
  } catch (e: any) {
    console.error('Test asset error →', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

import { verifyAuthToken } from "../supabase-auth.js";

/**
 * 1. Direct Upload Endpoint (Proxy)
 * Receives file -> Proxies to Mux Direct Upload
 */
muxRouter.post("/upload", upload.single('video'), async (req: any, res: any) => {
  try {
    if (!mux) return res.status(500).json({ error: "Mux not configured" });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // 0. Authenticate User
    let userId = req.headers['x-user-id'];
    
    // Try to extract from Bearer token if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const verifiedId = await verifyAuthToken(token);
      if (verifiedId) userId = verifiedId;
    }

    // Fallback or Validation
    if (!userId) {
       // Try system user
       userId = await storage.getSystemUserId();
    }
    
    // Ensure userId is a UUID (basic regex check) or fallback to 'anonymous' which might fail DB constraint
    // But let's assume if it came from x-user-id it's what they want, unless it's clearly invalid.
    // If we really can't find a user, we should probably error or accept it might fail.
    if (!userId) return res.status(401).json({ error: 'Unauthorized: No valid user found' });

    const { buffer, originalname, mimetype, size } = req.file;
    console.log(`📦 Received ${originalname} (${(size / 1024).toFixed(1)} KB)`);

    // 1. Ask Mux for direct upload URL
    const directUpload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        mp4_support: 'standard',
        input: [] // required by types to be present, though empty is fine for direct upload
      },
      cors_origin: '*', 
    });

    const { id: uploadId, url: uploadUrl } = directUpload;

    // 2. Proxy Stream: Server RAM -> Mux
    // Note: Railway has 256MB RAM limit. 
    await axios({
      method: "PUT",
      url: uploadUrl,
      data: buffer,
      headers: {
        'Content-Type': mimetype,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log(`✅ Uploaded to Mux via Proxy. Upload ID: ${uploadId}`);
    
    // 3. Save pending record
    const post = await storage.createPost({
        userId: userId, 
        content: `Video upload: ${originalname}`, // Required field
        caption: originalname,
        originalUrl: uploadUrl, // Temporarily store upload URL
        muxAssetId: uploadId, // Store upload ID here for now (will be replaced by Asset ID on webhook)
        processingStatus: 'processing',
    });

    res.status(201).json({
      success: true,
      message: 'Upload queued - Mux will process it',
      video: {
        id: post.id,
        uploadId: uploadId,
      },
    });

  } catch (err: any) {
    console.error('❌ Direct upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

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
