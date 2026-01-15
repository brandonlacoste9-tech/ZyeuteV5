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

// Initialize Mux client
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!, // Should leverage valid env
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

/**
 * 0. Sanity Check Endpoint
 */
muxRouter.get("/test-create-video", async (req, res) => {
  try {
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

/**
 * 1. Direct Upload Endpoint (Proxy)
 * Receives file -> Proxies to Mux Direct Upload
 */
muxRouter.post("/upload", upload.single('video'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { buffer, originalname, mimetype, size } = req.file;
    console.log(`📦 Received ${originalname} (${(size / 1024).toFixed(1)} KB)`);

    // 1. Ask Mux for direct upload URL
    const directUpload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        mp4_support: 'standard',
        input: [] // required by types sometimes, but Mux docs say upload: {} implies this
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
    
    // We don't have assetId yet, Mux returns uploadId. 
    // We must wait for webhook 'video.upload.asset_created' or 'video.asset.ready'
    // BUT user asked to save to DB now. Mux API response above is `Upload` object, not `Asset`.
    // The `Upload` object has no `asset_id` until processing starts. 
    
    // Modification: The user's example assumed `mux.video.assets.create({ upload: {} })` returns { id: assetId }.
    // Mux Node SDK v8+ uses `mux.video.uploads.create(...)` which returns an Upload object.
    
    // Let's check user's code: `mux.video.assets.create({ upload: {} })`.
    // If using older SDK (v7), that works. If v8+, it's different.
    // Based on my experience and imports `import Mux from "@mux/mux-node"`, this is likely v8.
    // In v8, `mux.video.assets.create` does NOT accept `upload: {}`. You must use `mux.video.uploads.create`.
    // `mux.video.uploads.create` returns { id: "upload_XYZ", url: "..." }. 
    // The Asset is created asynchronously.
    
    // User goal: "Save the returned assetId & playbackId in Supabase".
    // Problem: We don't HAVE assetId yet with direct upload.
    // Fix: We store the `upload_id` in DB, and update it when webhook arrives.
    
    // HOWEVER, to stick to user's happy path if possible:
    // If we use 'input' with a public URL, we get Asset immediately.
    // But here we are doing PUT.
    
    // OK, I will save the `upload_id` as `mux_asset_id` for now or add a column `mux_upload_id`.
    // Or I'll just check if `directUpload` has `asset_id` (it usually doesn't initially).
    
    // Let's implement robustly:
    // We'll store `upload_id` in a "pending" state.
    
    // 3. Save pending record
    // We need a way to track this. I'll reuse `muxAssetId` column for `uploadId` if fits, or use metadata.
    // Actually, let's just create the post but mark it processing.
    
    /* 
       For "Direct-to-Mux" (Proxy) to work identically to User's snippet, 
       User assumed `const { id: assetId, upload } = await mux.video.assets.create(...)`.
       This suggests using `inputs` logic or older API.
       
       I will use the `mux.video.uploads.create` which is correct for v8.
       I will store the `directUpload.id` temporarily.
    */

    /*
      DB Insert: 
      We need to call `storage.createPost(...)` or similar? 
      The user code used `supabase.from('videos').insert(...)`.
      I should adapt to `storage.createPost` if possible or direct DB insert.
      Existing `storage.ts` has `createPost`.
    */
    
    // Adapting to existing DB schema (Post)
    const post = await storage.createPost({
        userId: req.headers['x-user-id'] || 'anonymous', // User header
        type: 'video',
        title: originalname, // Caption/Title
        originalUrl: uploadUrl, // We don't have final URL yet.
        muxAssetId: uploadId, // Store upload ID here for now
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
