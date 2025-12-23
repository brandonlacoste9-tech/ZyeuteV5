import { Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const WORKER_NAME = 'zyeute-video-enhance';

console.log(`🐝 [${WORKER_NAME}] Worker started. Waiting for jobs...`);

const worker = new Worker(WORKER_NAME, async (job) => {
  const { postId, videoUrl, filterType } = job.data;
  console.log(`🎬 Processing Job ${job.id}: Post ${postId}`);

  const tempIn = path.join('/tmp', `${job.id}_in.mp4`);
  const tempOut = path.join('/tmp', `${job.id}_out.mp4`);

  try {
    // 1. Update Status
    await supabase.from('posts').update({ ai_status: 'processing' }).eq('id', postId);

    // 2. Download
    console.log(`⬇️ Downloading: ${videoUrl}`);
    const res = await fetch(videoUrl);
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(tempIn, Buffer.from(arrayBuffer));

    // 3. Run AI Upscale (Real-ESRGAN)
    console.log('🤖 Running AI Enhancement...');
    // MOCK AI (For now, just copy to prove flow works until GPU is set up)
    fs.copyFileSync(tempIn, tempOut); 
    
    // 4. Upload Result
    console.log('⬆️ Uploading Enhanced Version...');
    const fileName = `enhanced/${postId}_${Date.now()}.mp4`;
    const fileBuffer = fs.readFileSync(tempOut);
    
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, fileBuffer, { contentType: 'video/mp4' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(fileName);

    // 5. Finalize DB
    await supabase.from('posts').update({ 
      ai_status: 'completed', 
      enhanced_url: publicUrl 
    }).eq('id', postId);

    console.log(`✅ Job ${job.id} Completed!`);
    return { success: true, url: publicUrl };

  } catch (err: any) {
    console.error(`❌ Job ${job.id} Failed:`, err);
    await supabase.from('posts').update({ ai_status: 'failed', ai_error: err.message }).eq('id', postId);
    throw err;
  } finally {
    if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn);
    if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
  }
}, {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  }
});