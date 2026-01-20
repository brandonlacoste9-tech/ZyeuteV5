import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";

const execAsync = promisify(exec);
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      )
    : null;

const WORKER_NAME = "zyeute-video-enhance";

console.log(`🐝 [${WORKER_NAME}] Worker started. Waiting for jobs...`);

const worker = new Worker(
  WORKER_NAME,
  async (job) => {
    const { postId, videoUrl, filterType } = job.data;
    console.log(`🎬 Processing Job ${job.id}: Post ${postId}`);

    if (!supabase) {
      throw new Error("Worker configuration error: Supabase not initialized");
    }

    const tempIn = path.join(os.tmpdir(), `${job.id}_in.mp4`);
    const tempOut = path.join(os.tmpdir(), `${job.id}_out.mp4`);

    try {
      // 1. Update Status
      await supabase
        .from("posts")
        .update({ ai_status: "processing" })
        .eq("id", postId);

      // 2. Download
      console.log(`⬇️ Downloading: ${videoUrl}`);
      const res = await fetch(videoUrl);
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(tempIn, Buffer.from(arrayBuffer));

      // 3. Run AI Upscale (Real-ESRGAN)
      // 3. Run AI Upscale (Local LTX-2)
      console.log("🤖 Running AI Enhancement via Local LTX-2 Executor...");

      const scriptPath = path.resolve(__dirname, "../local-executor.py");
      // Use standard python command
      const pythonCmd = "python";

      try {
        const { stdout, stderr } = await execAsync(
          `${pythonCmd} "${scriptPath}" "${tempIn}" "${tempOut}"`,
        );
        console.log(stdout);
        if (stderr) console.warn(stderr); // LTX-2 logs might go to stderr
      } catch (pError: any) {
        throw new Error(`Executor Failed: ${pError.message}`);
      }

      // 4. Upload Result
      console.log("⬆️ Uploading Enhanced Version...");
      const fileName = `enhanced/${postId}_${Date.now()}.mp4`;
      const fileBuffer = fs.readFileSync(tempOut);

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, fileBuffer, { contentType: "video/mp4" });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("videos").getPublicUrl(fileName);

      // 5. Finalize DB
      await supabase
        .from("posts")
        .update({
          ai_status: "completed",
          enhanced_url: publicUrl,
        })
        .eq("id", postId);

      console.log(`✅ Job ${job.id} Completed!`);
      return { success: true, url: publicUrl };
    } catch (err: any) {
      console.error(`❌ Job ${job.id} Failed:`, err);
      await supabase
        .from("posts")
        .update({ ai_status: "failed", ai_error: err.message })
        .eq("id", postId);
      throw err;
    } finally {
      if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
      if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
    },
  },
);
