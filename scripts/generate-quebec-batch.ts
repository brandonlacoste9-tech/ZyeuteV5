/** Five Québec clips, no food scenes. Preview: npx tsx scripts/generate-quebec-batch.ts
 * Generate + publish: npx tsx scripts/generate-quebec-batch.ts --run
 * Requires FAL_API_KEY (or FAL_KEY), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */
import { createHash } from "node:crypto";
import { fal, ApiError } from "@fal-ai/client";
import { createClient } from "@supabase/supabase-js";

const expectedBatchId = "qc-20261001-impossible-01";
const batch = [
  {
    title: "Le mont Royal prend son envol",
    region: "montreal",
    prompt:
      "One continuous five-second smartphone shot of an impossible event in Montreal: Mount Royal, with its intact wooded slopes, park trails and cross, is already floating high above the city and slowly rises higher. Joggers calmly continue on a visible path along its edge. Viewed from a downtown street, stopped cars and a few people filming on phones give a convincing sense of enormous scale. Authentic Montreal skyline, warm daylight and city haze. Photorealistic trees, architecture and people, absurd deadpan humor. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Montreal surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Le mont Royal a décidé de changer d’adresse. 😭⚜️ Scène fictive générée par IA. #MontRoyal #Montreal #Quebec #Zyeute",
  },
  {
    title: "Un homard géant sur Sainte-Catherine",
    region: "montreal",
    prompt:
      "One continuous five-second handheld smartphone shot from a Montreal sidewalk: a building-sized living lobster walks slowly down Sainte-Catherine Street between authentic Montreal storefronts. It stops calmly at a red traffic light and lowers one eye toward a shop window. A cyclist in the foreground rings a bicycle bell at it while pedestrians barely react. Realistic wet red shell, articulated legs, believable shadows, strong giant-to-human scale. No food or cooked lobster; this is a living giant animal. Photorealistic, ridiculous deadpan street documentary. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Montreal surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "Même le homard respecte les feux sur Sainte-Catherine. 🦞🚦 Scène fictive générée par IA. #Montreal #SainteCatherine #Quebec #Zyeute",
  },
  {
    title: "La Biosphère devient une boule de hamster",
    region: "montreal",
    prompt:
      "One continuous five-second accidental smartphone shot in Montreal's Parc Jean-Drapeau: the huge familiar steel geodesic sphere of the Biosphere is already detached from its base and rolls slowly across an open grassy path like an enormous hamster ball. Its glass-enclosed central visitor platform stays upright inside while tourists keep taking photographs. Trees and benches establish its enormous scale. Photorealistic steel lattice and glass reflections, detailed park vegetation, overcast daylight, physically coherent slow rolling motion, absurd deadpan humor. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Montreal surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "La Biosphère est partie faire un tour. 🐹⚜️ Scène fictive générée par IA. #Biosphere #ParcJeanDrapeau #Montreal #Zyeute",
  },
  {
    title: "L’escalier roulant du métro va trop loin",
    region: "montreal",
    prompt:
      "One continuous five-second realistic smartphone POV on an impossibly long Montreal Metro escalator. Start just above an open station roof and smoothly ascend far above Montreal's downtown skyline into a thin layer of clouds. The escalator rails remain continuous and stable in the foreground. Two normal commuters ahead stand calmly on the right holding the handrail, one scrolling on a phone. Ordinary Metro materials transition naturally into open sky without cuts or collisions. Realistic perspective, daylight haze, mild exposure adjustment, absurd deadpan commuter documentary. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Montreal surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "J’ai pris la mauvaise sortie du métro. ☁️🚇 Scène fictive générée par IA. #STM #Metro #Montreal #Quebec #Zyeute",
  },
  {
    title: "Une feuille d’érable recouvre Montréal",
    region: "montreal",
    prompt:
      "One continuous five-second handheld smartphone shot from a Montreal rooftop overlooking downtown: an enormous red maple leaf spanning several city blocks drifts slowly downward from just above the buildings, its detailed veins and ragged leaf edges visible. It settles gently across rooftops and a street like a flexible autumn blanket, with no damage. A few pedestrians at its street-level edge calmly step out from underneath it. Authentic Montreal architecture, realistic autumn sunlight, coherent shadows moving across buildings, ultra-photorealistic texture, absurd deadpan humor. Looks like genuine accidental smartphone footage of a fictional impossible event, authentic Montreal surroundings, realistic people, imperfect autofocus, natural camera shake, vertical 9:16, no cartoon style, no obvious CGI, no added text, no captions, no watermark, no poutine.",
    caption:
      "À Montréal, l’automne ne fait pas les choses à moitié. 🍁😂 Scène fictive générée par IA. #Montreal #Automne #Quebec #Zyeute",
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
