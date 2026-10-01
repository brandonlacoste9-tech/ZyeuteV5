/** Five Québec clips, no food scenes. Preview: npx tsx scripts/generate-quebec-batch.ts
 * Generate + publish: npx tsx scripts/generate-quebec-batch.ts --run
 * Requires FAL_API_KEY (or FAL_KEY), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import dotenv from "dotenv";
import { createHash } from "node:crypto";
import { fal } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ quiet: true });
dotenv.config({ path: ".env.local", quiet: true });

const batch = [
  {
    title: "Montréal à l'heure dorée",
    region: "montreal",
    prompt:
      "Cinematic vertical shot of Montreal's Old Port at golden hour, the Jacques Cartier Bridge in the background, warm sunlight reflected in the Saint Lawrence River, slow camera glide, gentle waves, realistic Quebec architecture, natural motion. No food, no text overlays, no logos.",
    caption:
      "Montréal, quand la lumière transforme le fleuve. ⚜️ Vidéo générée par IA. #Montreal #Quebec #Zyeute",
  },
  {
    title: "Une soirée dans le Vieux-Québec",
    region: "quebec",
    prompt:
      "Cinematic vertical street-level shot in Old Quebec's Petit Champlain district at blue hour, historic stone buildings and cobblestone streets, warm window lights, Chateau Frontenac in the distance, gentle forward camera movement, authentic Quebec atmosphere, realistic architecture. No food, no text overlays, no logos.",
    caption:
      "Une petite balade dans le Vieux-Québec. ✨ Vidéo générée par IA. #VieuxQuebec #Quebec #Zyeute",
  },
  {
    title: "Les couleurs des Laurentides",
    region: "laurentides",
    prompt:
      "Cinematic vertical shot of a quiet lake in the Laurentians in Quebec during peak autumn, vivid red and orange maple trees, morning mist over the water, gentle camera drift, subtle leaves moving in the wind, photorealistic natural scenery. No food, no text overlays, no logos.",
    caption:
      "Les Laurentides en automne, ça fait du bien. 🍁 Vidéo générée par IA. #Laurentides #Automne #Quebec #Zyeute",
  },
  {
    title: "Le fleuve à Charlevoix",
    region: "charlevoix",
    prompt:
      "Cinematic vertical shot of Quebec's Charlevoix coastline along the Saint Lawrence River, rolling green hills and a small coastal village, soft evening light, gentle river waves, slow lateral camera movement, realistic Canadian scenery. No food, no text overlays, no logos.",
    caption:
      "Le grand air de Charlevoix, au bord du fleuve. 🌊 Vidéo générée par IA. #Charlevoix #SaintLaurent #Quebec #Zyeute",
  },
  {
    title: "Un village sous la neige",
    region: "quebec",
    prompt:
      "Cinematic vertical shot of a small rural Quebec village in winter, traditional colorful wooden houses with steep snow-covered roofs, warm porch lights, soft snowflakes falling, peaceful blue-hour atmosphere, slow camera push, realistic gentle motion. No food, no text overlays, no logos.",
    caption:
      "La tranquillité d'un village québécois sous la neige. ❄️ Vidéo générée par IA. #Hiver #Quebec #Zyeute",
  },
];

async function main() {
  if (!process.argv.includes("--run")) {
    console.log(
      JSON.stringify(
        {
          mode: "preview",
          count: batch.length,
          durationSeconds: 5,
          aspectRatio: "9:16",
          videos: batch,
        },
        null,
        2,
      ),
    );
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!(process.env.FAL_API_KEY || process.env.FAL_KEY) || !url || !key) {
    throw new Error(
      "Configure FAL_API_KEY (or FAL_KEY), SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running. No videos generated.",
    );
  }
  const supabase = createClient(url, key);
  const { data: author, error: authorError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", "ti_guy_bot")
    .maybeSingle();
  if (authorError || !author)
    throw new Error("A ti_guy_bot author is required before generation.");
  const { data: buckets, error: bucketError } =
    await supabase.storage.listBuckets();
  if (
    bucketError ||
    !buckets?.some((bucket) => bucket.id === "zyeute-videos" && bucket.public)
  ) {
    throw new Error(
      "A public zyeute-videos storage bucket is required before generation.",
    );
  }

  // Each batch has stable publication IDs, so restarting the same batch resumes
  // provider requests or skips completed clips instead of paying for duplicates.
  const batchId = process.env.QUEBEC_BATCH_ID;
  if (!batchId)
    throw new Error("Set a unique QUEBEC_BATCH_ID before generation.");
  const model = "fal-ai/kling-video/v2.6/pro/text-to-video";
  fal.config({ credentials: process.env.FAL_API_KEY || process.env.FAL_KEY });
  const { downloadTikTokMp4, uploadMp4ToSupabase } =
    await import("../backend/services/tiktok-mirror-storage.js");

  async function publishClip(clip: (typeof batch)[number], index: number) {
    const hash = createHash("sha256")
      .update(`${batchId}:${index}`)
      .digest("hex");
    const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    const { data: existing, error: readError } = await supabase
      .from("publications")
      .select("id,media_url,processing_status,media_metadata")
      .eq("id", id)
      .maybeSingle();
    if (readError)
      throw new Error(`Batch preflight failed: ${readError.message}`);
    if (existing?.processing_status === "completed" && existing.media_url) {
      console.log(`Already published: ${clip.title} (${id})`);
      return;
    }
    let metadata = existing?.media_metadata || {
      source: "quebec-ai-batch",
      batch_id: batchId,
      model,
      prompt: clip.prompt,
    };
    if (!existing) {
      const { error } = await supabase.from("publications").insert({
        id,
        user_id: author!.id,
        type: "video",
        caption: clip.caption,
        content: clip.caption,
        visibility: "private",
        hive_id: "quebec",
        region_id: clip.region,
        ai_generated: true,
        video_source: "ai",
        processing_status: "pending",
        est_masque: false,
        aspect_ratio: "9:16",
        duration: 5,
        media_metadata: metadata,
      });
      if (error)
        throw new Error(`Could not prepare ${clip.title}: ${error.message}`);
    }
    let requestId = metadata.fal_request_id as string | undefined;
    if (!requestId) {
      // A previous submission interrupted before checkpointing is ambiguous:
      // don't automatically issue another paid request.
      if (metadata.submission_started)
        throw new Error(
          `Submission checkpoint missing for ${clip.title}; inspect the provider queue before retrying.`,
        );
      metadata = { ...metadata, submission_started: true };
      const { error: markError } = await supabase
        .from("publications")
        .update({ media_metadata: metadata })
        .eq("id", id);
      if (markError)
        throw new Error(
          `Could not checkpoint ${clip.title}: ${markError.message}`,
        );
      const submitted = await fal.queue.submit(model, {
        input: {
          prompt: `${clip.prompt} Natural ambient sound, no dialogue, no narration, no music.`,
          duration: "5",
          aspect_ratio: "9:16",
          generate_audio: true,
          negative_prompt:
            "poutine, food, text, subtitles, watermark, distorted architecture, warped objects, low quality",
        },
      });
      requestId = submitted.request_id;
      metadata = { ...metadata, fal_request_id: requestId };
      const { error } = await supabase
        .from("publications")
        .update({ media_metadata: metadata })
        .eq("id", id);
      if (error)
        throw new Error(
          `Request queued but could not checkpoint ${clip.title}: ${error.message}`,
        );
      console.log(`Queued ${index + 1}/5: ${clip.title} (${requestId})`);
    }
    await fal.queue.subscribeToStatus(model, { requestId, logs: false });
    const result = await fal.queue.result(model, { requestId });
    const video = (result.data as { video?: { url?: string } }).video;
    if (!video?.url) throw new Error(`No generated video for ${clip.title}`);
    const buffer = await downloadTikTokMp4(video.url);
    if (!buffer) throw new Error(`Could not download ${clip.title}`);
    const mediaUrl = await uploadMp4ToSupabase(
      supabase,
      `quebec-ai/${id}.mp4`,
      buffer,
    );
    if (!mediaUrl)
      throw new Error(`Permanent storage failed for ${clip.title}`);
    const check = await fetch(mediaUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(15000),
    });
    if (!check.ok)
      throw new Error(`Stored video is not accessible for ${clip.title}`);
    const { error } = await supabase
      .from("publications")
      .update({
        media_url: mediaUrl,
        visibility: "public",
        processing_status: "completed",
        created_at: new Date().toISOString(),
        media_metadata: { ...metadata, has_audio: true },
      })
      .eq("id", id);
    if (error)
      throw new Error(`Could not publish ${clip.title}: ${error.message}`);
    console.log(`Published: ${clip.title} (${id})`);
  }
  const results = await Promise.allSettled(batch.map(publishClip));
  for (const result of results)
    if (result.status === "rejected")
      console.error(
        result.reason instanceof Error ? result.reason.message : "Clip failed",
      );
  const count = results.filter((r) => r.status === "fulfilled").length;
  console.log(`Batch complete: ${count}/5 clips published.`);
  if (count !== 5) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
