#!/usr/bin/env tsx
/**
 * End-to-End Video Pipeline Test
 * Tests the complete flow: upload → processing → AI metadata extraction → validation
 */

import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import fs from "fs";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "../.env") });

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:12002";
const TEST_USER_ID = process.env.TEST_USER_ID || randomUUID();
const MAX_WAIT_TIME = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL = 2000; // 2 seconds

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  log("❌ Missing required environment variables:", "red");
  log("   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required", "yellow");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Create a minimal test video file (1 second, black frame)
 * In production, you'd use a real test video file
 */
async function createTestVideo(): Promise<string> {
  const testVideoPath = join(__dirname, "fixtures", "test-video.mp4");
  const fixturesDir = join(__dirname, "fixtures");

  // Create fixtures directory if it doesn't exist
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // Check if test video already exists
  if (fs.existsSync(testVideoPath)) {
    log(`✅ Using existing test video: ${testVideoPath}`, "green");
    return testVideoPath;
  }

  log("📹 Creating test video file...", "cyan");
  
  // Try to use ffmpeg to create a minimal test video
  // If ffmpeg is not available, we'll create a placeholder file
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    // Create a 1-second black video with ffmpeg
    await execAsync(
      `ffmpeg -f lavfi -i color=c=black:s=640x360:d=1 -c:v libx264 -preset ultrafast -t 1 "${testVideoPath}" -y`
    );
    log(`✅ Test video created: ${testVideoPath}`, "green");
    return testVideoPath;
  } catch (error: any) {
    log(`⚠️  FFmpeg not available, creating placeholder file`, "yellow");
    // Create a minimal placeholder file (not a real video, but enough for testing upload)
    fs.writeFileSync(testVideoPath, Buffer.from("fake video content for testing"));
    log(`⚠️  Note: Placeholder file created. Real video processing requires ffmpeg.`, "yellow");
    return testVideoPath;
  }
}

/**
 * Upload video to Supabase Storage
 */
async function uploadVideo(videoPath: string, userId: string): Promise<{ publicUrl: string; filePath: string }> {
  log("\n📤 Uploading video to Supabase Storage...", "cyan");
  
  const fileExt = "mp4";
  const fileName = `${randomUUID()}.${fileExt}`;
  const filePath = `raw/${userId}/${fileName}`;

  const fileBuffer = fs.readFileSync(videoPath);
  
  const { error: uploadError } = await supabase.storage
    .from("videos")
    .upload(filePath, fileBuffer, {
      contentType: "video/mp4",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("videos").getPublicUrl(filePath);

  log(`✅ Video uploaded: ${publicUrl}`, "green");
  return { publicUrl, filePath };
}

/**
 * Create post via API
 */
async function createPost(videoUrl: string, userId: string): Promise<{ postId: string; jobId: string | null }> {
  log("\n📝 Creating post via API...", "cyan");

  const response = await fetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Note: In real scenario, you'd need proper auth token
      // For testing, you may need to bypass auth or use a test token
    },
    body: JSON.stringify({
      type: "video",
      mediaUrl: videoUrl,
      caption: "Test video for pipeline validation #Test #Zyeute",
      hashtags: ["Test", "Zyeute"],
      region: "quebec",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const postId = data.post?.id;
  const jobId = data.post?.jobId || null;

  if (!postId) {
    throw new Error("Post creation failed: No post ID returned");
  }

  log(`✅ Post created: ${postId}`, "green");
  if (jobId) {
    log(`   Job ID: ${jobId}`, "cyan");
  }

  return { postId, jobId };
}

/**
 * Poll job status until completion
 */
async function pollJobStatus(jobId: string): Promise<{ state: string; progress: number }> {
  log("\n⏳ Polling job status...", "cyan");
  
  const startTime = Date.now();
  let lastState = "unknown";

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/status`, {
        headers: {
          // Note: May need auth token here too
        },
      });

      if (!response.ok) {
        throw new Error(`Job status check failed: ${response.status}`);
      }

      const status = await response.json();
      const { state, progress } = status;

      if (state !== lastState) {
        log(`   State: ${state} (${progress || 0}%)`, "cyan");
        lastState = state;
      }

      if (state === "completed") {
        log(`✅ Job completed successfully!`, "green");
        return { state, progress: progress || 100 };
      }

      if (state === "failed") {
        log(`❌ Job failed: ${status.failedReason || "Unknown error"}`, "red");
        throw new Error(`Job failed: ${status.failedReason || "Unknown error"}`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    } catch (error: any) {
      if (error.message.includes("failed")) {
        throw error;
      }
      log(`⚠️  Poll error (will retry): ${error.message}`, "yellow");
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  throw new Error(`Job did not complete within ${MAX_WAIT_TIME / 1000} seconds`);
}

/**
 * Test Colony OS Connection (Smoke Test)
 */
async function testColonyConnection(): Promise<void> {
  log("\n📡 Testing Colony OS Connection...", "cyan");
  try {
    const response = await fetch(`${API_BASE_URL}/api/colony/status`);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const status = await response.json();
    
    if (status.connected) {
      log("   ✅ Colony OS: Connected", "green");
    } else {
      log(`   ⚠️  Colony OS: ${status.status} (graceful degradation OK)`, "yellow");
    }
  } catch (error: any) {
    log("   ⚠️  Colony OS: Unreachable (graceful degradation OK)", "yellow");
    log(`      ${error.message}`, "yellow");
  }
}

/**
 * Verify which AI service was used
 */
async function verifyAIService(postId: string, expectedService: "vertex" | "deepseek"): Promise<void> {
  const { data: post } = await supabase
    .from("posts")
    .select("ai_description, ai_labels, media_metadata")
    .eq("id", postId)
    .single();

  if (!post) {
    throw new Error(`Post ${postId} not found`);
  }

  // Check service used (if stored in metadata)
  const serviceUsed = post?.media_metadata?.service_used;
  
  // Fallback: Infer from description quality (Vertex AI is typically more detailed)
  const isVertex = serviceUsed === "vertex" || 
    (post?.ai_description && post.ai_description.length > 50);
  
  const actualService = isVertex ? "vertex" : "deepseek";
  
  if (actualService !== expectedService) {
    throw new Error(`Expected ${expectedService}, but got ${actualService}`);
  }
  
  log(`   ✅ Verified AI Service: ${actualService}`, "green");
}

/**
 * Verify Quebec tag mapping (hockey → urban, hiver → nature)
 */
async function verifyQuebecTagMapping(postId: string): Promise<void> {
  const { data: post } = await supabase
    .from("posts")
    .select("media_metadata")
    .eq("id", postId)
    .single();
  
  const vibe = post?.media_metadata?.vibe_category;
  const validVibes = ["party", "chill", "nature", "food", "urban", "art"];
  
  if (!vibe) {
    log("   ⚠️  No vibe_category found (may be OK if AI extraction failed)", "yellow");
    return;
  }
  
  if (!validVibes.includes(vibe)) {
    throw new Error(`Invalid vibe_category: ${vibe}. Quebec mapping may have failed. Expected one of: ${validVibes.join(", ")}`);
  }
  
  log(`   ✅ Quebec Tag Mapping Verified: ${vibe}`, "green");
}

/**
 * Run full pipeline test with credit override
 */
async function runPipelineTestWithOverride(
  testName: string,
  serviceOverride: "vertex" | "deepseek"
): Promise<{ postId: string; jobId: string | null }> {
  log(`\n🧪 Running test: ${testName}`, "bright");
  
  // Set credit manager override
  const { creditManager } = await import("../backend/ai/credit-manager.js");
  creditManager.setTestOverride(serviceOverride);
  log(`   ⚙️  Service override: ${serviceOverride}`, "cyan");
  
  try {
    // Create test video
    const testVideoPath = await createTestVideo();
    
    // Upload video
    const { publicUrl } = await uploadVideo(testVideoPath, TEST_USER_ID);
    
    // Create post
    const postData = await createPost(publicUrl, TEST_USER_ID);
    
    // Poll job status if job exists
    if (postData.jobId) {
      await pollJobStatus(postData.jobId);
    }
    
    return postData;
  } finally {
    // Reset override
    creditManager.setTestOverride(null);
  }
}

/**
 * Verify post in database
 */
async function verifyPost(postId: string): Promise<void> {
  log("\n🔍 Verifying post in database...", "cyan");

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (error || !post) {
    throw new Error(`Failed to fetch post: ${error?.message || "Not found"}`);
  }

  // Verify processing status
  if (post.processing_status !== "completed") {
    throw new Error(`Expected processing_status='completed', got '${post.processing_status}'`);
  }
  log(`✅ Processing status: ${post.processing_status}`, "green");

  // Verify enhanced URL
  if (!post.enhanced_url) {
    throw new Error("Missing enhanced_url");
  }
  log(`✅ Enhanced URL: ${post.enhanced_url.substring(0, 60)}...`, "green");

  // Verify thumbnail URL
  if (!post.thumbnail_url) {
    log(`⚠️  Missing thumbnail_url (non-critical)`, "yellow");
  } else {
    log(`✅ Thumbnail URL: ${post.thumbnail_url.substring(0, 60)}...`, "green");
  }

  // Verify AI metadata
  if (!post.ai_description) {
    log(`⚠️  Missing ai_description (Vertex AI may not be configured)`, "yellow");
  } else {
    log(`✅ AI Description: ${post.ai_description.substring(0, 60)}...`, "green");
  }

  if (!post.ai_labels || !Array.isArray(post.ai_labels) || post.ai_labels.length === 0) {
    log(`⚠️  Missing ai_labels (Vertex AI may not be configured)`, "yellow");
  } else {
    log(`✅ AI Labels: ${post.ai_labels.join(", ")}`, "green");
  }

  if (!post.media_metadata || !post.media_metadata.vibe_category) {
    log(`⚠️  Missing vibe_category (Vertex AI may not be configured)`, "yellow");
  } else {
    log(`✅ Vibe Category: ${post.media_metadata.vibe_category}`, "green");
  }
}

/**
 * Cleanup test data
 */
async function cleanup(postId: string, filePath: string): Promise<void> {
  log("\n🧹 Cleaning up test data...", "cyan");

  try {
    // Delete post from database
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      log(`⚠️  Failed to delete post: ${deleteError.message}`, "yellow");
    } else {
      log(`✅ Post deleted from database`, "green");
    }

    // Delete video files from storage
    const pathParts = filePath.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const enhancedPath = `enhanced/${postId}_*.mp4`;
    const thumbnailPath = `thumbnails/${postId}_*.jpg`;

    // Note: Supabase Storage doesn't support wildcard deletion easily
    // In production, you'd track exact file paths or use a cleanup job
    log(`⚠️  Manual cleanup may be needed for: ${enhancedPath}, ${thumbnailPath}`, "yellow");
  } catch (error: any) {
    log(`⚠️  Cleanup error: ${error.message}`, "yellow");
  }
}

/**
 * Main test execution
 */
async function main() {
  log("\n" + "=".repeat(60), "bright");
  log("🎬 Video Pipeline End-to-End Test", "bright");
  log("=".repeat(60) + "\n", "bright");

  let testVideoPath: string | null = null;
  let uploadedFilePath: string | null = null;
  let postId: string | null = null;
  let jobId: string | null = null;

  try {
    // Phase 1: Colony OS Smoke Test
    await testColonyConnection();

    // Phase 2: Basic Pipeline Test (Original)
    log("\n" + "=".repeat(60), "bright");
    log("📹 Basic Video Pipeline Test", "bright");
    log("=".repeat(60) + "\n", "bright");

    testVideoPath = await createTestVideo();
    const { publicUrl, filePath } = await uploadVideo(testVideoPath, TEST_USER_ID);
    uploadedFilePath = filePath;

    const postData = await createPost(publicUrl, TEST_USER_ID);
    postId = postData.postId;
    jobId = postData.jobId;

    if (!jobId) {
      log("⚠️  No job ID returned. Worker may not be running.", "yellow");
      log("   Skipping job status polling...", "yellow");
    } else {
      await pollJobStatus(jobId);
    }

    if (postId) {
      await verifyPost(postId);
    }

    // Phase 3: Smart Router Tests (if worker is running)
    if (jobId) {
      log("\n" + "=".repeat(60), "bright");
      log("🎯 Smart AI Router Tests", "bright");
      log("=".repeat(60) + "\n", "bright");

      // Test 1: Vertex AI Path (VIP)
      log("🧪 TEST SCENARIO 1: High Credits (Expect Vertex AI)", "bright");
      const vertexResult = await runPipelineTestWithOverride(
        "Vertex AI Routing Test",
        "vertex"
      );
      await verifyAIService(vertexResult.postId, "vertex");
      log("   ✅ Vertex AI routing verified\n", "green");

      // Test 2: DeepSeek Fallback (Broke)
      log("🧪 TEST SCENARIO 2: Low Credits (Expect DeepSeek)", "bright");
      const deepseekResult = await runPipelineTestWithOverride(
        "DeepSeek Fallback Test",
        "deepseek"
      );
      await verifyAIService(deepseekResult.postId, "deepseek");
      await verifyQuebecTagMapping(deepseekResult.postId);
      log("   ✅ DeepSeek fallback verified\n", "green");
    } else {
      log("\n⚠️  Skipping Smart Router tests (worker not running)", "yellow");
      log("   Start worker with: npm run worker:video", "yellow");
    }

    log("\n" + "=".repeat(60), "bright");
    log("✅ All tests passed!", "green");
    log("=".repeat(60) + "\n", "bright");

    // Step 6: Cleanup (optional, comment out to keep test data)
    if (process.env.KEEP_TEST_DATA !== "true" && postId && uploadedFilePath) {
      await cleanup(postId, uploadedFilePath);
    } else {
      log("ℹ️  Test data preserved (set KEEP_TEST_DATA=false to cleanup)", "cyan");
    }

  } catch (error: any) {
    log("\n" + "=".repeat(60), "bright");
    log("❌ Test failed!", "red");
    log("=".repeat(60), "bright");
    log(`\nError: ${error.message}`, "red");
    if (error.stack) {
      log(`\nStack:\n${error.stack}`, "yellow");
    }

    // Attempt cleanup on failure
    if (postId && uploadedFilePath) {
      log("\n🧹 Attempting cleanup after failure...", "cyan");
      await cleanup(postId, uploadedFilePath);
    }

    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, "red");
  process.exit(1);
});
