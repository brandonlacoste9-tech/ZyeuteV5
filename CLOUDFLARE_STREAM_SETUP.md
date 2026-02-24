# 🎬 Cloudflare Stream Integration Guide

## Overview

Zyeuté now supports **Cloudflare Stream** as a video hosting provider alongside MUX. This provides:
- Global CDN delivery
- HLS adaptive streaming
- Automatic transcoding
- Cost-effective pricing

---

## Configuration

### 1. Environment Variables

Add these to your `.env` file:

```env
# Optional: Cloudflare Stream (for direct uploads via API)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### 2. Media Proxy Configuration

Cloudflare Stream URLs are automatically proxied through the backend for CORS handling:

**Backend:** `backend/routes/media-proxy.ts`
```typescript
ALLOWED_HOSTS = [
  // ... other hosts ...
  "cloudflarestream.com",
  "*.cloudflarestream.com",
];
```

**Frontend:** `frontend/src/utils/mediaProxy.ts`
```typescript
PROXY_DOMAINS = [
  // ... other domains ...
  "cloudflarestream.com",
];
```

### 3. Video Type Detection

Cloudflare Stream URLs are automatically detected as videos:

**File:** `shared/utils/validatePostType.ts`
```typescript
VIDEO_HOSTS = [
  // ... other hosts ...
  "cloudflare-stream.com",
  "cloudflarestream.com",
  "*.cloudflarestream.com",
];
```

---

## Video Player Selection

The VideoCard component automatically selects the right player:

| Source | URL Pattern | Player Used |
|--------|-------------|-------------|
| Mux | `stream.mux.com/*` | MuxVideoPlayer |
| Cloudflare Stream | `*.cloudflarestream.com/*` | VideoPlayer (HLS.js) |
| Pexels | `videos.pexels.com/*` | SimpleVideoPlayer |
| Direct MP4 | `*.mp4` | SimpleVideoPlayer |
| HLS streams | `*.m3u8` | VideoPlayer (HLS.js) |

---

## URL Formats Supported

### Cloudflare Stream HLS
```
https://cloudflarestream.com/{video-id}/manifest/video.m3u8
https://customer-{id}.cloudflarestream.com/{video-id}/manifest/video.m3u8
```

### Cloudflare Stream MP4 (Direct)
```
https://cloudflarestream.com/{video-id}/downloads/video.mp4
```

### Mux HLS
```
https://stream.mux.com/{playback-id}.m3u8
```

---

## Testing

Run the video system test:

```bash
# JavaScript test
node test-video-system.js

# TypeScript integration tests
npm test -- tests/video-system-integration.test.ts
```

### Manual Testing Checklist

- [ ] Cloudflare Stream HLS video plays
- [ ] Cloudflare Stream MP4 video plays
- [ ] Mux videos still work
- [ ] Pexels videos still work
- [ ] Direct MP4 uploads work
- [ ] Video thumbnails load
- [ ] Autoplay works (muted)
- [ ] Seeking works
- [ ] Fullscreen works

---

## Troubleshooting

### Videos not playing

1. Check browser console for errors
2. Verify URL is in ALLOWED_HOSTS
3. Check media-proxy logs
4. Ensure video has proper CORS headers

### Proxy errors

```bash
# Check backend logs for:
[MediaProxy] Domain not allowed: ...
```

Add the domain to `ALLOWED_HOSTS` if legitimate.

### Player not detected correctly

The VideoCard detects Cloudflare Stream by checking:
```typescript
const isCloudflareStream = url.includes('cloudflarestream.com') || 
                           url.includes('cloudflare-stream.com');
const isHLS = url.includes('.m3u8') || isCloudflareStream;
```

---

## Migration from Other Providers

To migrate existing videos to Cloudflare Stream:

1. Upload videos to Cloudflare Stream dashboard
2. Get the video ID from the URL
3. Update database records:

```sql
UPDATE publications 
SET 
  media_url = 'https://cloudflarestream.com/{video-id}/manifest/video.m3u8',
  type = 'video',
  processing_status = 'completed'
WHERE id = {post_id};
```

---

## Security Considerations

- Only allowlisted domains can be proxied
- Cloudflare Stream URLs must use HTTPS
- Webhook signatures should be verified (if using upload API)

---

## Resources

- [Cloudflare Stream Docs](https://developers.cloudflare.com/stream/)
- [Mux Docs](https://docs.mux.com/)
- [HLS.js Docs](https://github.com/video-dev/hls.js/)

---

**Last Updated:** 2026-02-23
**Status:** ✅ Active and tested
