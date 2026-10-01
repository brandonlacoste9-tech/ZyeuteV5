/** Five Québec clips, no food scenes. Preview: npx tsx scripts/generate-quebec-batch.ts
 * Generate + publish: npx tsx scripts/generate-quebec-batch.ts --run
 * Requires FAL_API_KEY (or FAL_KEY), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createHash } from "node:crypto";
import { fal, ApiError } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";

const expectedBatchId = "qc-20261001-impossible-03";
const batch = [
  {
    title: "Une baleine survole le Vieux-Québec",
    region: "quebec",
    prompt:
      "One continuous five-second photorealistic handheld smartphone shot from a riverside viewpoint near Old Quebec. An enormous realistic humpback whale is already leaping from the Saint Lawrence River, arcs impossibly high across the sky above Old Quebec and the recognizable Chateau Frontenac, then splashes back into the river beyond the buildings. Detailed wet whale skin, believable scale, sunlight in falling water droplets, spectacular distant splash with no damage to the city. Tourists in the foreground calmly keep filming on phones. Authentic Quebec architecture, summer daylight, absurd impossible wildlife event treated as normal. Looks like genuine accidental camera footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "À Québec, même les baleines font le tour du Château. 🐋🏰 Scène fictive générée par IA. #VieuxQuebec #SaintLaurent #Quebec #Zyeute",
  },
  {
    title: "Les escaliers du Plateau prennent la route",
    region: "montreal",
    prompt:
      "One continuous five-second photorealistic smartphone shot from the sidewalk of a residential street in Montreal's Plateau-Mont-Royal. Two familiar exterior black metal spiral staircases are detached from their buildings and walk slowly across a quiet intersection on thin jointed metal legs like mechanical spiders. Adult residents calmly ride on the steps while holding the sturdy railings. The camera tracks the nearest walking staircase slightly. Authentic colorful Montreal brick duplexes, balconies, realistic cast-iron textures, coherent articulated movement and shadows, natural daylight. Absurd deadpan neighborhood scene, no injuries. Looks like genuine accidental camera footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Le Plateau a trouvé sa solution au stationnement : déplacer les escaliers. 🕷️🏘️ Scène fictive générée par IA. #PlateauMontRoyal #Montreal #Quebec #Zyeute",
  },
  {
    title: "Le bus STM devient un sous-marin",
    region: "montreal",
    prompt:
      "One continuous five-second photorealistic action-camera view alongside the front side of a blue-and-white STM city bus as it rolls gently down a riverside launch ramp into the Saint Lawrence River in Montreal. The camera lens crosses the waterline with the bus and stays underwater. The bus seals itself smoothly, its wheels retract and small submarine fins extend; it glides forward beneath the surface. Through the clear windows, calm seated passengers keep scrolling on phones, visibly dry inside. Realistic bubbles, water refraction, daylight rays, detailed Montreal transit vehicle, no panic or injuries. Clearly impossible deadpan commute, no cuts. Looks like genuine accidental camera footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "La STM teste une nouvelle ligne… sous le fleuve. 🚌🌊 Scène fictive générée par IA. #STM #Montreal #SaintLaurent #Quebec #Zyeute",
  },
  {
    title: "La neige québécoise remonte dans le ciel",
    region: "quebec",
    prompt:
      "One continuous five-second handheld smartphone shot of a snow-covered Quebec residential street during a winter storm. All snow suddenly reverses direction: flakes rise from the ground toward the clouds, and thick layers of snow lift smoothly off parked cars and steep house roofs in billowing white sheets, revealing clean surfaces underneath. One bundled-up adult tries to shovel upward in confusion while neighbours watch calmly. Photorealistic Quebec houses, realistic snow particles, coherent upward motion, soft grey winter daylight. Camera and people move normally, only the snow rises. Absurd impossible weather event. Looks like genuine accidental camera footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "L’hiver a décidé de reprendre sa neige. ❄️⬆️ Scène fictive générée par IA. #Hiver #Quebec #Zyeute",
  },
  {
    title: "Un renard géant dort sur le pont Jacques-Cartier",
    region: "montreal",
    prompt:
      "One continuous five-second photorealistic handheld smartphone shot from a waterfront viewpoint in Montreal at sunrise. A colossal living red fox is curled up asleep across the recognizable green steel Jacques Cartier Bridge. Its huge fluffy tail hangs gently over the Saint Lawrence River and sways in the breeze. Small cars creep slowly along a clear lane around its enormous resting paws without contact. Detailed realistic red fur, closed eyes, subtle breathing, convincing animal-to-bridge scale, authentic Montreal skyline, warm sunrise reflections on the river. Absurd peaceful impossible scene, no injuries. Looks like genuine accidental camera footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Le pont Jacques-Cartier est fermé pour une petite sieste. 🦊💤 Scène fictive générée par IA. #JacquesCartier #Montreal #Quebec #Zyeute",
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
