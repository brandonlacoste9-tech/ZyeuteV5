const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config();

// Configuration
const POOL_INTERVAL = 5000;
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY; 

// Initialize clients
const pool = new Pool({ connectionString: DATABASE_URL });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('👷 Upscale Worker started. Waiting for tasks...');

// Helper to download file
const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(dest));
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

// Main loop
async function runWorker() {
    while (true) {
        try {
            await processNextTask();
        } catch (error) {
            console.error('Work Cycle Error:', error);
        }
        await new Promise(resolve => setTimeout(resolve, POOL_INTERVAL));
    }
}

async function processNextTask() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Find pending task
        const res = await client.query(`
            SELECT * FROM colony_tasks 
            WHERE status = 'pending' AND command = 'upscale_video'
            ORDER BY created_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        `);

        if (res.rows.length === 0) {
            await client.query('COMMIT');
            return;
        }

        const task = res.rows[0];
        console.log(`🚀 Processing task ${task.id} for Post ${task.metadata.postId}`);

        // Update to processing
        await client.query(`
            UPDATE colony_tasks 
            SET status = 'processing', started_at = NOW() 
            WHERE id = $1
        `, [task.id]);

        await client.query('COMMIT'); // Commit the "picked up" state

        // --- PROCESSING ---
        try {
            const videoUrl = task.metadata.videoUrl;
            const inputPath = path.join(__dirname, `input_${task.id}.mp4`);
            const outputPath = path.join(__dirname, `output_${task.id}.mp4`);

            console.log(`Downloading ${videoUrl}...`);
            await downloadFile(videoUrl, inputPath);

            console.log('Upscaling...');
            // In dev/mock environment without binary, simply copy or rename
            if (process.env.NODE_ENV !== 'production' && !fs.existsSync('./realesrgan-ncnn-vulkan')) {
                 console.warn("⚠️ RealESRGAN binary not found. Mocking the process by copying input.");
                 fs.copyFileSync(inputPath, outputPath);
            } else {
                 // Real execution
                 await new Promise((resolve, reject) => {
                    exec(`./realesrgan-ncnn-vulkan -i ${inputPath} -o ${outputPath} -s 2`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`exec error: ${error}`);
                            return reject(error);
                        }
                        resolve(stdout);
                    });
                 });
            }

            console.log('Uploading result...');
            const filename = `enhanced/enhanced_${task.metadata.postId}_${Date.now()}.mp4`;
            const fileContent = fs.readFileSync(outputPath);
            
            const { data, error: uploadError } = await supabase
                .storage
                .from('videos') // Assuming 'videos' bucket
                .upload(filename, fileContent, {
                    contentType: 'video/mp4',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(filename);
            
            console.log(`Enhanced video uploaded to ${publicUrl}`);

            // Update Post
            await pool.query(`
                UPDATE publications 
                SET enhanced_url = $1, processing_status = 'ready', enhance_finished_at = NOW()
                WHERE id = $2
            `, [publicUrl, task.metadata.postId]);

            // Complete Task
            await pool.query(`
                UPDATE colony_tasks 
                SET status = 'completed', completed_at = NOW(), result = $1
                WHERE id = $2
            `, [{ publicUrl }, task.id]);

            // Cleanup
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

            console.log(`✅ Task ${task.id} completed successfully.`);

        } catch (processError) {
            console.error("Processing failed:", processError);
            
            // Fail Task
            await pool.query(`
                UPDATE colony_tasks 
                SET status = 'failed', error = $1, completed_at = NOW()
                WHERE id = $2
            `, [processError.message, task.id]);
            
            // Fail Post
            await pool.query(`
                UPDATE publications 
                SET processing_status = 'failed'
                WHERE id = $1
            `, [task.metadata.postId]);
        }

    } catch (dbError) {
        await client.query('ROLLBACK');
        throw dbError;
    } finally {
        client.release();
    }
}

runWorker();
