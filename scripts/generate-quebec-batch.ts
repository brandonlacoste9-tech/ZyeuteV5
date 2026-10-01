/** Five Québec clips, no food scenes. Preview: npx tsx scripts/generate-quebec-batch.ts
 * Generate + publish: npx tsx scripts/generate-quebec-batch.ts --run
 * Requires FAL_API_KEY (or FAL_KEY), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createHash } from "node:crypto";
import { fal, ApiError } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";

const expectedBatchId = "qc-20261001-impossible-04";
const batch = [
  {
    title: "Les pigeons de Montréal deviennent un hélicoptère",
    region: "montreal",
    prompt:
      "One continuous five-second photorealistic handheld smartphone shot from a downtown Montreal sidewalk, looking upward between buildings. Thousands of realistic pigeons are already flying together in the unmistakable silhouette of a helicopter: a dense bird-shaped fuselage, tail and a large circular rotor formation made entirely of swirling pigeons. The coordinated bird-helicopter moves slowly overhead while individual birds visibly flap their wings and maintain the shape. Pedestrians below film with phones. Authentic Montreal architecture and skyline, realistic feather detail, coherent flock motion, natural daylight, absurd impossible event. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "À Montréal, les pigeons ont lancé leur service d’hélicoptère. 🐦🚁 Scène fictive générée par IA. #Montreal #Quebec #Zyeute",
  },
  {
    title: "Un lac des Laurentides se vide vers le ciel",
    region: "laurentides",
    prompt:
      "One continuous five-second photorealistic handheld smartphone shot from the shore of a peaceful lake in Quebec's Laurentians. A huge continuous column of lake water pours upward like a reverse waterfall, visibly connecting the lake surface to low clouds. Two intact canoes near the column slowly rise with the swirling water, while adult hikers stand safely on shore watching in disbelief. Dense green forest and rounded hills around the lake, realistic water texture, spray, reflections and sunlight refraction, clear upward flow and coherent enormous scale. Absurd impossible natural event, no injuries. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Dans les Laurentides, le lac a décidé de déménager dans les nuages. 🛶☁️ Scène fictive générée par IA. #Laurentides #Quebec #Zyeute",
  },
  {
    title: "Une déneigeuse dévore les bancs de neige",
    region: "quebec",
    prompt:
      "One continuous five-second photorealistic shaky smartphone shot from a sidewalk on a suburban Quebec winter street. A huge municipal snowplow has an enormous articulated mechanical mouth built into its front blade. It drives slowly forward, opens its metal jaws and scoops up a tall snowbank, visibly chewing and swallowing only the snow. Perfectly dry clean pavement appears behind it. Bundled-up neighbours on the sidewalk clap calmly. Detailed realistic steel machinery, hydraulic motion, powdery snow and tiny flying flakes, Quebec houses with steep roofs, soft winter daylight. Absurd machine comedy, no food, no people or animals inside the mouth. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "La déneigeuse avait une petite fringale de neige. 🚜❄️ Scène fictive générée par IA. #Hiver #Quebec #Zyeute",
  },
  {
    title: "Les gratte-ciel de Montréal deviennent gonflables",
    region: "montreal",
    prompt:
      "One continuous five-second photorealistic smartphone shot from a downtown Montreal plaza looking upward at three tall glass office towers. The buildings suddenly behave like giant inflatable versions of themselves while retaining realistic architectural facade details: one tower bends softly toward its neighbour in the wind, briefly folds sideways, then springs gently back upright like a bounce house. Reflections move coherently on flexible glass-like surfaces. Adult pedestrians below continue walking calmly at a safe distance. Authentic Montreal skyline, realistic daylight and shadows, clear enormous scale, absurd impossible architecture, no debris or injuries. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Montréal a commandé ses gratte-ciel en version gonflable. 🏙️🎈 Scène fictive générée par IA. #Montreal #Quebec #Zyeute",
  },
  {
    title: "Un orignal roule en BIXI",
    region: "montreal",
    prompt:
      "One continuous five-second dead-serious photorealistic handheld smartphone street shot in downtown Montreal. A massive realistic moose rides an ordinary small grey Montreal BIXI shared bicycle, balancing perfectly with its front hooves on the handlebars and hind legs pedaling. It coasts toward a nearby BIXI docking station, rings the bicycle bell and stops with the front wheel correctly entering an empty dock. Pedestrians glance casually at it. Detailed natural brown fur and large antlers, convincing bicycle geometry, wheel rotation and shadows, recognizable BIXI-style bike and docking station, authentic Montreal architecture, sunny daylight, absurd deadpan documentary, no cartoon animals. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Quebec surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "L’orignal a pris un BIXI pour éviter le trafic. 🫎🚲 Scène fictive générée par IA. #BIXI #Montreal #Quebec #Zyeute",
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
