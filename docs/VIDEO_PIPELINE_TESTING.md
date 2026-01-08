# Video Pipeline Testing Guide

## Overview

This guide covers end-to-end testing of the Zyeute video processing pipeline, including upload, normalization, thumbnail generation, and AI metadata extraction.

## Prerequisites

Before running video pipeline tests, ensure you have:

1. **Redis** running (for BullMQ)
   ```bash
   # Check Redis connection
   redis-cli ping
   ```

2. **Supabase Storage Buckets** configured:
   - `videos` bucket (for raw and enhanced videos)
   - `thumbnails` bucket (for generated thumbnails)

3. **FFmpeg** installed
   ```bash
   ffmpeg -version
   ```

4. **Environment Variables** set in `.env`:
   ```env
   DATABASE_URL=postgresql://...
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   SUPABASE_URL=https://...
   SUPABASE_SERVICE_ROLE_KEY=...
   GOOGLE_CLOUD_PROJECT=...
   GOOGLE_APPLICATION_CREDENTIALS=...
   ```

## Running the Test

### Automated Test Script

```bash
npm run test:video-pipeline
```

This script will:
1. Upload a test video to Supabase Storage
2. Create a post with `processing_status: "pending"`
3. Enqueue a video processing job
4. Poll for job completion
5. Verify the enhanced video and thumbnail exist
6. Check AI metadata extraction (if Vertex AI is configured)

### Manual Testing Steps

#### 1. Start the Worker

In a separate terminal:
```bash
npm run worker:video
```

You should see:
```
🐝 [zyeute-video-enhance] Worker started. Waiting for jobs...
```

#### 2. Start the Backend

In another terminal:
```bash
npm run dev
```

#### 3. Upload a Video via Frontend

1. Navigate to `/upload` in your browser
2. Select a video file (MP4, MOV, etc.)
3. Add a caption
4. Click "Publier"

#### 4. Monitor Processing

**In the Worker Terminal:**
- Watch for job processing logs
- Check for FFmpeg commands
- Verify uploads to Supabase

**In the Backend Terminal:**
- Monitor API requests
- Check for errors

**In Supabase Dashboard:**
- Navigate to Storage → `videos` bucket
- Verify `raw/{userId}/{fileName}` exists
- After processing, verify `enhanced/{postId}_{timestamp}.mp4` exists
- Navigate to Storage → `thumbnails` bucket
- Verify `thumbnails/{postId}_{timestamp}.jpg` exists

#### 5. Verify Database Updates

Check the `publications` table:
```sql
SELECT 
  id,
  processing_status,
  media_url,
  enhanced_url,
  thumbnail_url,
  ai_description,
  ai_labels,
  media_metadata->>'vibe_category' as vibe
FROM publications
WHERE processing_status = 'completed'
ORDER BY created_at DESC
LIMIT 5;
```

## Expected Results

### Successful Processing

1. **Job Status**: `completed`
2. **Processing Status**: `completed` in database
3. **Enhanced Video**: Available at `enhanced_url`
4. **Thumbnail**: Available at `thumbnail_url`
5. **AI Metadata** (if Vertex AI configured):
   - `ai_description`: Generated caption
   - `ai_labels`: Array of tags
   - `media_metadata.vibe_category`: Vibe classification

### Video Normalization

The enhanced video should:
- Be in H.264 codec (compatible with all devices)
- Have AAC audio
- Be max 1080p resolution (scaled down if larger)
- Have reasonable file size (CRF 23)

### Thumbnail Generation

- Extracted at 1 second mark
- JPEG format
- Reasonable file size (< 500KB)

## Troubleshooting

### Job Stuck in "pending"

**Possible Causes:**
- Worker not running
- Redis connection issue
- Queue name mismatch

**Solutions:**
1. Verify worker is running: `npm run worker:video`
2. Check Redis: `redis-cli ping`
3. Verify queue name in `queue.ts` matches worker name

### FFmpeg Errors

**Common Issues:**
- "No such file or directory" → FFmpeg not installed
- "Invalid data found" → Corrupted video file
- "Permission denied" → Temp directory not writable

**Solutions:**
1. Install FFmpeg: `brew install ffmpeg` (macOS) or `apt-get install ffmpeg` (Linux)
2. Check temp directory: `/tmp` should be writable
3. Test FFmpeg manually: `ffmpeg -i test.mp4 -c:v libx264 output.mp4`

### Supabase Upload Failures

**Common Issues:**
- "Bucket not found" → Create buckets in Supabase Dashboard
- "Permission denied" → Check `SUPABASE_SERVICE_ROLE_KEY`
- "File too large" → Check bucket size limits

**Solutions:**
1. Create buckets: Storage → Create Bucket
2. Set bucket policies: Public read for `videos` and `thumbnails`
3. Verify service role key has correct permissions

### Vertex AI Metadata Extraction Fails

**Note:** This is **non-blocking**. The video will still process successfully.

**Common Issues:**
- "Project not found" → Check `GOOGLE_CLOUD_PROJECT`
- "Authentication failed" → Check `GOOGLE_APPLICATION_CREDENTIALS`
- "API quota exceeded" → Check GCP billing

**Solutions:**
1. Verify GCP project ID
2. Ensure service account JSON is valid
3. Check Vertex AI API is enabled in GCP Console

### Job Fails After Retries

**Check Sentry:**
- Navigate to Sentry dashboard
- Look for errors with tag `job_id: {jobId}`
- Review breadcrumbs for step-by-step failure point

**Check Logs:**
```bash
# Worker logs show detailed error messages
# Look for "❌ Job {id} Failed:" messages
```

**Manual Retry:**
- Use the "Retry" button in the frontend (if implemented)
- Or manually re-enqueue the job via API

## Performance Benchmarks

Expected processing times:
- **Small video (< 10MB)**: 5-15 seconds
- **Medium video (10-50MB)**: 15-45 seconds
- **Large video (50-200MB)**: 45-120 seconds

Factors affecting speed:
- Video resolution (1080p+ takes longer)
- Video length
- Server CPU/RAM
- FFmpeg preset (`veryfast` is optimized for speed)

## Monitoring

### BullMQ Dashboard (Optional)

Install BullMQ dashboard for visual monitoring:
```bash
npm install @bull-board/express @bull-board/api
```

### Sentry Integration

All errors are automatically captured in Sentry:
- Worker errors
- API errors
- Job failures

Check Sentry dashboard for:
- Error frequency
- Performance metrics
- User context

## Manual Testing Checklist

- [ ] Worker starts successfully
- [ ] Video uploads to `videos/raw/` bucket
- [ ] Post created with `processing_status: "pending"`
- [ ] Job enqueued in BullMQ
- [ ] Worker picks up job
- [ ] FFmpeg normalization completes
- [ ] Enhanced video uploaded to `videos/enhanced/`
- [ ] Thumbnail generated and uploaded
- [ ] AI metadata extracted (if configured)
- [ ] Database updated with all fields
- [ ] Frontend shows "completed" status
- [ ] Enhanced video plays correctly
- [ ] Thumbnail displays correctly

## Next Steps

After successful testing:
1. Monitor production metrics
2. Set up alerts for failed jobs
3. Optimize FFmpeg settings based on file sizes
4. Fine-tune AI metadata extraction prompts
