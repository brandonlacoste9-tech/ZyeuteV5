/** Five Québec clips, no food scenes. Preview: npx tsx scripts/generate-quebec-batch.ts
 * Generate + publish: npx tsx scripts/generate-quebec-batch.ts --run
 * Requires FAL_API_KEY (or FAL_KEY), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createHash } from "node:crypto";
import { fal, ApiError } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";

const expectedBatchId = "qc-20261001-meanwhile-01";
const batch = [
  {
    title: "Pendant ce temps à Laval : lave-auto pour orignal",
    region: "laval",
    prompt:
      "One continuous five-second photorealistic smartphone shot filmed through the window of an automatic car wash in Laval, Quebec. A giant living moose, without any car, calmly stands on the moving conveyor belt inside the wash tunnel. Soft rotating blue and red brushes gently scrub its wet brown fur as soapy water sprays around it. Its enormous antlers stay clear of the machinery. Two car-wash employees watch through the glass with deadpan expressions. Convincing wet fur, foam, water droplets on the window, realistic Quebec suburban setting and car-wash lighting. Absurd but treated as normal. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps à Laval : lavage extérieur, intérieur… et bois inclus. 🫎🧼 Scène fictive générée par IA. #Laval #Quebec #Zyeute",
  },
  {
    title: "Pendant ce temps à Montréal : course de déneigeuses",
    region: "montreal",
    prompt:
      "One continuous five-second handheld spectator smartphone shot from the sidewalk of a wide snowy Montreal boulevard. Two enormous municipal snowplows are lined up side by side at a red traffic light. The light turns green and both snowplows accelerate together in a ridiculous short drag race down the empty street, spraying huge harmless rooster tails of powdery snow behind them. Authentic Montreal winter buildings, snowbanks, overcast daylight, realistic diesel machinery, tire motion and flying snow. A few bundled-up spectators film calmly from the sidewalk. Fictional absurd event, no collisions or injuries. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps à Montréal : le Grand Prix du déneigement. 🚜❄️ Scène fictive générée par IA. #Montreal #Hiver #Quebec #Zyeute",
  },
  {
    title: "Pendant ce temps à Québec : embouteillage médiéval",
    region: "quebec",
    prompt:
      "One continuous five-second photorealistic smartphone shot at street level in Old Quebec near historic stone buildings and with Chateau Frontenac visible in the distance. Several medieval knights in realistic steel armor sit on horses stuck in ordinary modern rush-hour traffic beside a city bus and taxis. In the foreground one knight lifts the visor with one hand and angrily checks a smartphone in the other, while the horse gently shifts its weight. Modern drivers behave normally. Believable historical armor, detailed horses, natural late-afternoon light, convincing historical-modern mashup and deadpan humor. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps à Québec : même les chevaliers sont pris dans le trafic. 🐎📱 Scène fictive générée par IA. #VieuxQuebec #Quebec #Zyeute",
  },
  {
    title: "Pendant ce temps à Longueuil : canard géant à la piscine",
    region: "longueuil",
    prompt:
      "One continuous five-second vertical smartphone shot filmed from an apartment balcony overlooking a swimming pool in Longueuil, Quebec, in summer. A bright yellow inflatable rubber duck the size of the surrounding apartment building floats in the pool, towering above the courtyard while its base rests in the water. Several normal adult residents sit comfortably on its wide back like a floating island, sunbathing and chatting without reacting to its impossible size. Gentle buoyant rocking and small realistic water ripples. Convincing yellow rubber texture, summer sunlight, authentic Quebec apartment balconies, coherent enormous scale, absurd deadpan pool-party scene. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps à Longueuil : le canard a réservé toute la piscine. 🐤☀️ Scène fictive générée par IA. #Longueuil #Quebec #Zyeute",
  },
  {
    title: "Pendant ce temps à Montréal : arrêt de bus téléporteur",
    region: "montreal",
    prompt:
      "One continuous five-second handheld smartphone shot from across a quiet Montreal street, keeping both sidewalks and an ordinary STM bus shelter in the same fixed wide frame. Three adult commuters wait at the bus stop. One after another, two of them disappear in brief soft flashes of light and instantly reappear intact on the opposite sidewalk, each pausing and looking confused. The third commuter calmly continues scrolling on a phone. No cuts; clearly visible matching people before and after each teleportation. Photorealistic Montreal surroundings, authentic shelter, realistic people, daylight, natural reflections and shadows, subtle impossible effect, deadpan humor. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Pendant ce temps à Montréal : le bus était trop lent, on a installé la téléportation. 🚌✨ Scène fictive générée par IA. #STM #Montreal #Quebec #Zyeute",
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
