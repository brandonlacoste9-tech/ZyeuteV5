/**
 * Generate Québec-style clips via BytePlus Seedance → Mux → publications.
 */
import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  generateSeedanceVideo,
  isBytePlusArkConfigured,
  getArkConfig,
} from "./byteplus-seedance.js";
import {
  ingestVideoUrlToMux,
  isMuxIngestConfigured,
} from "./tiktok-mux-ingest.js";
import {
  uploadMp4ToSupabase,
  downloadTikTokMp4,
} from "./tiktok-mirror-storage.js";

export const QUEBEC_SEEDANCE_PROMPTS = [
  "Vertical smartphone video, Montreal Old Port in winter, snow falling, warm street lights, cinematic handheld",
  "Close-up of poutine with cheese curds melting, steam rising, Quebec diner vibe, appetizing food video",
  "Young friends laughing on a Montreal metro platform, urban Quebec energy, natural motion, 9:16 social clip",
  "Sunset over the St. Lawrence River, Quebec City skyline, slow pan, golden hour cinematic",
  "Maple syrup pouring on pancakes, cozy Quebec kitchen, warm lighting, satisfying slow motion",
  "Street musician playing guitar on Saint-Denis, Montreal summer evening, lively crowd bokeh",
  "Hockey fans cheering in a Quebec sports bar, energetic vertical clip, authentic atmosphere",
  "Fresh snow on pine trees in Laurentians, peaceful Quebec nature, gentle camera drift",
];

export type SeedanceFeedSeedStats = {
  requested: number;
  generated: number;
  imported: number;
  muxIngested: number;
  mirrored: number;
  failed: number;
  skipped: number;
  errors: string[];
};

async function resolveAuthor(supabase: SupabaseClient): Promise<string | null> {
  for (const username of [
    "ti_guy_bot",
    "zyeute_scout",
    "zyeute_ai",
    "zyeute_seed",
  ]) {
    const { data } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  const { data } = await supabase.from("user_profiles").select("id").limit(1);
  return (data?.[0]?.id as string) ?? null;
}

export async function seedFeedFromSeedance(options: {
  supabaseUrl: string;
  supabaseServiceKey: string;
  limit?: number;
  hiveId?: string;
  prompts?: string[];
}): Promise<SeedanceFeedSeedStats> {
  const stats: SeedanceFeedSeedStats = {
    requested: options.limit ?? 1,
    generated: 0,
    imported: 0,
    muxIngested: 0,
    mirrored: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  if (!isBytePlusArkConfigured()) {
    stats.errors.push("ARK_API_KEY not configured");
    return stats;
  }

  const limit = Math.min(Math.max(options.limit ?? 1, 1), 5);
  stats.requested = limit;

  const supabase = createClient(
    options.supabaseUrl,
    options.supabaseServiceKey,
  );
  const userId = await resolveAuthor(supabase);
  if (!userId) {
    stats.errors.push("no_system_user");
    return stats;
  }

  const hiveId = options.hiveId ?? "quebec";
  const prompts = options.prompts?.length
    ? options.prompts
    : QUEBEC_SEEDANCE_PROMPTS;
  const { model } = getArkConfig();

  for (let i = 0; i < limit; i++) {
    const prompt = prompts[i % prompts.length];
    const seedId = randomUUID();

    try {
      const result = await generateSeedanceVideo({
        prompt,
        model,
        ratio: "9:16",
        resolution: "720p",
        duration: 5,
      });

      if (!result.videoUrl) {
        stats.failed++;
        stats.errors.push(
          result.error || `Task ${result.taskId} succeeded without video URL`,
        );
        continue;
      }

      stats.generated++;

      let mediaUrl = result.videoUrl;
      let muxPlaybackId: string | null = null;
      let hlsUrl: string | null = null;
      let thumbnailUrl: string | null = null;
      let processingStatus = "completed";

      if (isMuxIngestConfigured()) {
        const mux = await ingestVideoUrlToMux({
          sourceUrl: result.videoUrl,
          storageId: seedId,
          supabase,
        });
        if (mux) {
          mediaUrl = mux.hlsUrl;
          hlsUrl = mux.hlsUrl;
          muxPlaybackId = mux.muxPlaybackId;
          thumbnailUrl = mux.thumbnailUrl;
          processingStatus = "processing";
          stats.muxIngested++;
        }
      }

      if (!muxPlaybackId) {
        const buffer = await downloadTikTokMp4(result.videoUrl);
        if (buffer) {
          const mirrored = await uploadMp4ToSupabase(
            supabase,
            `seedance/${seedId}.mp4`,
            buffer,
          );
          if (mirrored) {
            mediaUrl = mirrored;
            stats.mirrored++;
          }
        }
      }

      if (!mediaUrl || mediaUrl === result.videoUrl) {
        stats.failed++;
        stats.errors.push(
          "Mux not configured and Supabase mirror failed — Seedance URL expires in ~24h",
        );
        continue;
      }

      const caption = `🎬 Zyeuté AI — ${prompt.slice(0, 120)} #Quebec #Zyeute`;
      const { error } = await supabase.from("publications").insert({
        user_id: userId,
        type: "video",
        media_url: mediaUrl,
        hls_url: hlsUrl,
        mux_playback_id: muxPlaybackId,
        thumbnail_url: thumbnailUrl,
        caption,
        content: caption,
        visibility: "public",
        hive_id: hiveId,
        region_id: "montreal",
        video_source: "seedance",
        processing_status: processingStatus,
        moderation_approved: true,
        is_moderated: true,
        est_masque: false,
        aspect_ratio: "9:16",
        viral_score: 5000,
        media_metadata: {
          source: "byteplus-seedance",
          seedance_task_id: result.taskId,
          model,
          prompt,
          original_url: result.videoUrl,
        },
      });

      if (error) {
        stats.failed++;
        stats.errors.push(error.message);
        continue;
      }

      stats.imported++;
    } catch (err: unknown) {
      stats.failed++;
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(msg.slice(0, 200));
      if (/ModelNotOpen|not activated/i.test(msg)) break;
    }
  }

  return stats;
}
