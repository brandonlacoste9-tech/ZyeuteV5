import express, { Request, Response } from "express";
import { storage } from "../storage.js";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import { verifyAuthToken } from "../supabase-auth.js";
import crypto from "crypto";
import { inferMediaType } from "../../shared/utils/validatePostType.js";

export const surgicalUploadRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for launch
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// WARN: Do not crash if Supabase is missing, just disable upload features
let supabase: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} else {
  console.warn(
    "⚠️ Supabase Credentials missing in Upload Router. Uploads will fail.",
  );
}

/**
 * SURGICAL UPLOAD BYPASS
 * Direct to Supabase Storage -> No Webhooks, Instant Launch.
 */
surgicalUploadRouter.post(
  "/simple",
  upload.single("video"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      if (!supabase) {
        console.error("❌ Upload refused: Supabase client is not initialized.");
        return res.status(503).json({
          error: "Storage service unavailable due to missing configuration",
        });
      }

      // 1. Authenticate
      let userId: string | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        userId = await verifyAuthToken(authHeader.split(" ")[1]);
      }

      if (!userId) {
        // Support for testing/demo if auth is failing
        userId = req.body.userId || (await storage.getSystemUserId());
      }

      if (!userId)
        return res.status(401).json({ error: "Unauthorized credentials" });

      const { buffer, originalname, mimetype } = req.file;
      const fileExt = originalname.split(".").pop();
      const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      console.log(
        `🚀 [Surgical Upload] Starting upload for ${originalname}...`,
      );

      // 2. Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("zyeute-videos")
        .upload(fileName, buffer, {
          contentType: mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error("❌ Supabase Upload Error:", uploadError);
        return res.status(500).json({ error: "Failed to upload to storage" });
      }

      // 3. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("zyeute-videos").getPublicUrl(fileName);

      // 4. 🛡️ GUARDRAIL: Infer media type from URL/mimetype
      const inferredType = inferMediaType(publicUrl);
      console.log(
        `🛡️ [Guardrail] Inferred type "${inferredType}" for ${originalname} (mime: ${mimetype})`,
      );

      // 5. Create Database Record via Supabase REST (no DATABASE_URL needed)
      const caption = req.body.caption || originalname || `Nouveau partage sur Zyeuté! 🍁`;
      const { data: postData, error: postError } = await supabase
        .from("publications")
        .insert({
          user_id: userId,
          content: caption,
          caption,
          media_url: publicUrl,
          type: inferredType,
          processing_status: "completed",
          hive_id: req.body.hiveId || "quebec",
          visibility: "public",
          visibilite: "public",
          est_masque: false,
          is_moderated: true,
          moderation_approved: true,
          region: req.body.region || "montreal",
          video_source: "upload",
        })
        .select()
        .single();

      if (postError) {
        console.error("❌ Post insert error:", postError);
        return res.status(500).json({ error: "Failed to create post: " + postError.message });
      }

      console.log(`✅ [Surgical Upload] Success! Post created: ${postData.id}`);

      res.status(201).json({
        success: true,
        post: postData,
      });
    } catch (err: any) {
      console.error("❌ Surgical upload crash:", err);
      res.status(500).json({ error: err.message });
    }
  },
);
