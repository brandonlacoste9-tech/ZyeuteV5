# 🎬 Zyeute Video Processing Pipeline Architecture

**Last Updated:** Current Session  
**Status:** Production-Ready Implementation

---

## Overview

Complete video processing pipeline with signed uploads, job status tracking, realtime updates, and Docker-based worker processing.

---

## 1. Signed Upload Flow

### Edge Function: `generate-upload-url`

**Location:** `supabase/functions/generate-upload-url/`

**Contract:**
- Issues signed PUT URLs for direct client uploads
- Enforces RLS: Only the authenticated user can upload to their own path
- Returns signed URL + file path for client-side upload

**Upload Path Structure:**
```
raw-uploads/{userId}/{uuid}.{ext}
```

**Security:**
- RLS policies ensure only the owner can write/read raw uploads
- Service-role key used for worker access

---

## 2. Storage Buckets

### Bucket: `raw-uploads`
- **Access:** Private (RLS-protected)
- **Purpose:** Original video files from users
- **Path:** `raw-uploads/{userId}/{uuid}.{ext}`
- **RLS:** Owner-only read/write

### Bucket: `enhanced-videos`
- **Access:** Public read, service-role write
- **Purpose:** Processed video files
- **Path:** `enhanced-videos/{postId}/v{version}/{filename}.mp4`
- **RLS:** Public read, service-role write

### Bucket: `thumbnails`
- **Access:** Public read, service-role write
- **Purpose:** Video thumbnail images
- **Path:** `thumbnails/{postId}/v{version}/{filename}.jpg`
- **RLS:** Public read, service-role write

**Note:** All RLS policies are already configured in Supabase.

---

## 3. Job Status System

### Database Table: `public.job_status`

**Schema:**
```sql
- id (uuid, primary key)
- post_id (uuid, foreign key to posts.id)
- status (text): queued | processing | completed | failed
- progress (integer): 0-100 percentage
- metadata (jsonb): Additional job metadata
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Realtime Updates

**Trigger:** Uses `realtime.broadcast_changes` on `job_status` table updates

**Channel Pattern:**
```
post:{post_id}:status
```

**Subscription:**
- Clients subscribe to private realtime channels
- Format: `post:{postId}:status`
- Receive updates when job_status changes

**Example Client Subscription:**
```typescript
const channel = supabase
  .channel(`post:${postId}:status`)
  .on('broadcast', { event: 'job_status_update' }, (payload) => {
    // Handle status update: payload.status, payload.progress, etc.
  })
  .subscribe();
```

---

## 4. BullMQ Worker (Node 18 + FFmpeg)

### Worker Location
`zyeute/backend/workers/videoProcessor.ts`

### Worker Responsibilities

1. **Download raw video** from Supabase Storage (`raw-uploads/{userId}/{uuid}.ext`)

2. **Run FFmpeg processing:**
   - Generate enhanced MP4 (720p, H.264, AAC)
   - Generate thumbnail (JPEG, 1 second frame)
   - Normalize format for web playback

3. **Upload outputs:**
   - Enhanced video → `enhanced-videos/{postId}/v{version}/{filename}.mp4`
   - Thumbnail → `thumbnails/{postId}/v{version}/{filename}.jpg`

4. **Update `posts` table:**
   - `enhanced_url`: URL to processed video
   - `thumbnail_url`: URL to thumbnail
   - `media_metadata`: JSONB with:
     - `renditions`: Video quality variants
     - `version`: Processing version number
     - `processed_at`: Timestamp

5. **Update `job_status` at each stage:**
   - `5%`: Job started
   - `20%`: Video downloaded
   - `70%`: FFmpeg processing complete
   - `85%`: Enhanced video uploaded
   - `95%`: Thumbnail uploaded
   - `100%`: Database updated, job complete

6. **Cleanup:**
   - Remove temporary files
   - Clean up `/tmp` directory

7. **Error handling:**
   - On failure: Set `job_status.status = "failed"`
   - Update `job_status.metadata` with error details
   - Realtime broadcast failure status

---

## 5. Dockerfile (Worker)

### Location
`zyeute/backend/Dockerfile` or worker-specific Dockerfile

### Configuration

**Base Image:** `node:18.20.0-bullseye-slim`

**Build Stages:**
1. **Builder:** Install dependencies, compile TypeScript
2. **Runtime:** Copy artifacts, install FFmpeg, set up non-root user

**FFmpeg Installation:**
```dockerfile
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

**User:**
- Non-root user for security
- UID/GID configured appropriately

**Healthcheck:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ffmpeg -version || exit 1
```

**CMD:**
```dockerfile
CMD ["node", "dist/workers/videoProcessor.js"]
# Or: CMD ["tsx", "backend/workers/videoProcessor.ts"]
```

---

## 6. Environment Assumptions

For future development, assume:

- ✅ **FFmpeg is available** (installed in Docker container)
- ✅ **Redis is available** (BullMQ connection configured)
- ✅ **Supabase service-role key** available in environment
- ✅ **Worker runs inside Docker** (production environment)
- ✅ **All RLS policies configured** (no manual setup needed)
- ✅ **All database triggers configured** (realtime broadcasts work)

---

## 7. Processing Flow Diagram

```
User Upload
    ↓
[Edge Function] generate-upload-url
    ↓
Signed PUT URL → Client uploads to raw-uploads/{userId}/{uuid}.ext
    ↓
POST /api/posts → Create post record
    ↓
BullMQ Queue → Job added with postId, userId, videoUrl
    ↓
[Worker Container] Pulls job from queue
    ↓
Download from raw-uploads bucket
    ↓
Update job_status: progress=5%, status=processing
    ↓
FFmpeg Processing (720p + thumbnail)
    ↓
Update job_status: progress=70%
    ↓
Upload enhanced video → enhanced-videos/{postId}/v{version}/
    ↓
Update job_status: progress=85%
    ↓
Upload thumbnail → thumbnails/{postId}/v{version}/
    ↓
Update job_status: progress=95%
    ↓
Update posts table: enhanced_url, thumbnail_url, media_metadata
    ↓
Update job_status: progress=100%, status=completed
    ↓
[Trigger] Broadcast to post:{postId}:status channel
    ↓
Client receives realtime update → UI updates
```

---

## 8. Key Files Reference

| Component | File Path |
|-----------|-----------|
| Edge Function | `supabase/functions/generate-upload-url/index.ts` |
| Worker | `zyeute/backend/workers/videoProcessor.ts` |
| Queue Manager | `zyeute/backend/queue.ts` |
| Dockerfile | `zyeute/backend/Dockerfile` |
| Job Status Schema | `supabase/migrations/*_job_status.sql` |
| Realtime Trigger | `supabase/migrations/*_realtime_broadcast.sql` |

---

## 9. Integration Points

### Frontend Upload Flow
1. Call Edge Function: `POST /functions/v1/generate-upload-url`
2. Receive signed PUT URL
3. Upload file directly to signed URL
4. Create post via `POST /api/posts` with file path
5. Subscribe to realtime channel: `post:{postId}:status`
6. Update UI based on broadcast events

### Backend API
- `POST /api/posts` - Creates post and queues job
- `GET /api/posts/:id/status` - Fallback polling endpoint (if realtime unavailable)

### Worker Environment
- `REDIS_HOST` - Redis connection host
- `REDIS_PORT` - Redis connection port
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for worker access

---

## 10. Versioning Strategy

**Path Structure Includes Version:**
```
enhanced-videos/{postId}/v{version}/{filename}.mp4
```

**Version Increment:**
- Increment version on re-processing
- Allows A/B testing of processing parameters
- Enables rollback to previous versions

---

**This document serves as the canonical reference for the video processing pipeline architecture.**
