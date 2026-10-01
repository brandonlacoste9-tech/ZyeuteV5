/** Five Québec clips, no food scenes. Preview: npx tsx scripts/generate-quebec-batch.ts
 * Generate + publish: npx tsx scripts/generate-quebec-batch.ts --run
 * Requires FAL_API_KEY (or FAL_KEY), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createHash } from "node:crypto";
import { fal, ApiError } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";

const expectedBatchId = "qc-20261001-meanwhile-02";
const batch = [
  {
    title: "Pendant ce temps à Sherbrooke : pickups volants",
    region: "sherbrooke",
    prompt:
      "One continuous five-second photorealistic handheld smartphone shot from the sidewalk of a suburban street in Sherbrooke, Quebec. Three ordinary full-sized pickup trucks float and fly smoothly past at rooftop height like airplanes, with no wings or propellers. The nearest truck passes slowly enough to see a calm adult driver with one arm resting outside the open side window. Normal cars keep moving on the road underneath. Convincing truck metal, tires hanging freely, consistent moving shadows, authentic Quebec houses, distant green hills, natural afternoon light. Absurd impossible event treated as normal traffic. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps à Sherbrooke : les pickups ont trouvé un raccourci. 🛻☁️ Scène fictive générée par IA. #Sherbrooke #Quebec #Zyeute",
  },
  {
    title: "Pendant ce temps à Gatineau : chantier de castors géants",
    region: "gatineau",
    prompt:
      "One continuous five-second vertical smartphone worksite shot beside the river in Gatineau, Quebec. A team of three giant photorealistic beavers wearing bright reflective safety vests builds a tall wooden tower from entire tree trunks. One beaver lifts a huge tree trunk into place while another steadies it with its paws. A human construction supervisor in a hard hat stands well clear in the foreground, calmly checking a clipboard. Detailed brown fur, realistic reflective fabric, fresh wood grain, sawdust, coherent enormous scale, river and Quebec urban buildings in the background. Deadpan absurd construction documentary, no injuries. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps à Gatineau : le chantier avance à coups de dents. 🦫🚧 Scène fictive générée par IA. #Gatineau #Construction #Quebec #Zyeute",
  },
  {
    title: "Pendant ce temps à Montréal : escalier roulant vers les nuages",
    region: "montreal",
    prompt:
      "One continuous five-second photorealistic handheld smartphone shot from a sidewalk on Sainte-Catherine Street in Montreal. An ordinary outdoor escalator begins directly on the sidewalk and extends impossibly upward between buildings, thousands of feet into low clouds. The camera gently tilts upward from its base, revealing the enormous continuous escalator climbing into the sky. Several normal adult shoppers stand calmly in line and ride upward holding shopping bags, with secure handrails. Authentic Montreal storefront architecture, realistic escalator metal and moving steps, daylight city haze, deadpan impossible everyday scene. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps à Montréal : les boutiques du dernier étage sont un peu loin. 🛍️☁️ Scène fictive générée par IA. #SainteCatherine #Montreal #Quebec #Zyeute",
  },
  {
    title: "Pendant ce temps dans les Laurentides : migration de canots",
    region: "laurentides",
    prompt:
      "One continuous five-second handheld smartphone shot from a cottage dock beside a lake in Quebec's Laurentians at golden hour. Hundreds of empty full-sized canoes fly across the sky in a huge clear V-shaped migration formation like geese. The nearest red and green canoes glide smoothly overhead with realistic wood and fiberglass hulls, no wings or people, gently banking together. Cottage owners stand safely on docks below and wave casually at the migrating boats. Photorealistic forested hills, lake reflections, warm evening sunlight, convincing scale and coordinated motion, absurd deadpan nature documentary. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps dans les Laurentides : les canots partent dans le Sud. 🛶🍁 Scène fictive générée par IA. #Laurentides #Quebec #Zyeute",
  },
  {
    title: "Pendant ce temps à Montréal : tout marche à reculons",
    region: "montreal",
    prompt:
      "One continuous five-second fixed handheld smartphone shot at a Montreal intersection during a light winter snowfall. Everything in the street moves unmistakably backward while people stay calm: two cars reverse steadily through their lanes with their front ends facing away from their direction of travel, pedestrians walk backward on the sidewalk, a cyclist rolls backward while pedaling backward, and a blue-and-white STM city bus slowly reverses through the intersection. Snowflakes rise upward from the ground into the sky instead of falling. Keep the camera itself facing forward and time continuous. Authentic Montreal winter architecture, realistic people, vehicles, tire motion and lighting, coherent reversed movement, absurd deadpan documentary, no collisions. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps à Montréal : quelqu’un a appuyé sur rembobiner. ⏪❄️ Scène fictive générée par IA. #STM #Montreal #Quebec #Zyeute",
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
  if (batchId !== expectedBatchId)
    throw new Error(
      `Set QUEBEC_BATCH_ID to ${expectedBatchId}; refusing a mismatched batch.`,
    );
  const model = "fal-ai/kling-video/v2.6/pro/text-to-video";
  fal.config({ credentials: process.env.FAL_API_KEY || process.env.FAL_KEY });
  async function persistVideo(sourceUrl: string, id: string): Promise<string> {
    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok || !response.body)
      throw new Error("Generated video download failed");
    const maxBytes = 80 * 1024 * 1024;
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.byteLength;
      if (size > maxBytes) throw new Error("Generated video exceeds 80 MB");
      chunks.push(chunk);
    }
    if (size < 4096)
      throw new Error("Generated file is too small to be a video");
    const path = `quebec-ai/${id}.mp4`;
    const { error } = await supabase.storage
      .from("zyeute-videos")
      .upload(path, Buffer.concat(chunks), {
        contentType: "video/mp4",
        upsert: true,
        cacheControl: "31536000",
      });
    if (error) throw new Error(`Permanent storage failed: ${error.message}`);
    return supabase.storage.from("zyeute-videos").getPublicUrl(path).data
      .publicUrl;
  }

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
        visibility: "public",
        hive_id: "quebec",
        region_id: clip.region,
        ai_generated: true,
        processing_status: "pending",
        est_masque: true,
        aspect_ratio: "9:16",
        duration: 5,
        media_metadata: metadata,
      });
      if (error)
        throw new Error(`Could not prepare ${clip.title}: ${error.message}`);
    }
    if (metadata.batch_id !== batchId || metadata.prompt !== clip.prompt)
      throw new Error(
        `Existing batch prompt differs for ${clip.title}; refusing to submit.`,
      );
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
      let submitted;
      try {
        submitted = await fal.queue.submit(model, {
          input: {
            prompt: `${clip.prompt} Natural ambient sound, no dialogue, no narration, no music.`,
            duration: "5",
            aspect_ratio: "9:16",
            generate_audio: true,
            negative_prompt:
              "poutine, food, text, subtitles, watermark, distorted architecture, warped objects, low quality",
          },
        });
      } catch (error) {
        if (
          error instanceof ApiError &&
          [400, 401, 402, 403, 404, 422, 429].includes(error.status)
        ) {
          // Definitive rejection: no request was accepted. Network errors and
          // server errors remain ambiguous and keep the checkpoint locked.
          metadata = {
            ...metadata,
            submission_started: false,
            submission_rejected_status: error.status,
          };
          const { error: checkpointError } = await supabase
            .from("publications")
            .update({ media_metadata: metadata })
            .eq("id", id);
          if (checkpointError)
            throw new Error(`Could not record rejection for ${clip.title}`);
          const detail = JSON.stringify(error.body ?? error.message)
            .replace(/fal_sk_[A-Za-z0-9:_-]+/g, "[redacted]")
            .slice(0, 800);
          throw new Error(
            `FAL rejected ${clip.title} (HTTP ${error.status}): ${detail}`,
          );
        }
        throw error;
      }
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
    const mediaUrl = await persistVideo(video.url, id);
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
        est_masque: false,
        created_at: new Date().toISOString(),
        media_metadata: { ...metadata, has_audio: true },
      })
      .eq("id", id)
      .select("id,media_url,processing_status,est_masque")
      .single();
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
