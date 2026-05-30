# Media Handling Playbook - Zyeuté v3

**Version:** 1.0.0  
**Last Updated:** December 15, 2025  
**Status:** ✅ Active Documentation

---

## 🎯 Purpose

This playbook provides comprehensive guidance for handling media (images, videos, audio) in Zyeuté v3, including upload, storage, optimization, delivery, and edge cases.

---

## 📋 Table of Contents

1. [Media Types](#media-types)
2. [Upload Flow](#upload-flow)
3. [Storage Strategy](#storage-strategy)
4. [Optimization](#optimization)
5. [Delivery](#delivery)
6. [Edge Cases](#edge-cases)
7. [Troubleshooting](#troubleshooting)
8. [Security](#security)
9. [Performance](#performance)
10. [Testing Scenarios](#testing-scenarios)

---

## 🎬 Media Types

### Supported Formats

#### Images

- **Formats:** JPEG, PNG, WebP, AVIF, GIF
- **Max Size:** 10 MB
- **Max Dimensions:** 4096x4096 pixels
- **Use Cases:** Profile avatars, post images, thumbnails, stories

#### Videos

- **Formats:** MP4, WebM, MOV
- **Max Size:** 100 MB
- **Max Duration:** 60 seconds (stories), 300 seconds (posts)
- **Codec:** H.264/H.265 for MP4, VP9 for WebM
- **Use Cases:** Video posts, video stories, live streams

#### Audio

- **Formats:** MP3, AAC, OGG
- **Max Size:** 20 MB
- **Max Duration:** 600 seconds (10 minutes)
- **Use Cases:** Voice messages, audio posts, podcasts

### File Validation

```typescript
// Example validation (from services/imageService.ts)
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

function validateImage(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Format d'image non supporté" };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Image trop grande (max 10 MB)" };
  }
  return { valid: true };
}
```

---

## 📤 Upload Flow

### Scenario 1: Image Upload (Profile Avatar)

**User Story:** As a user, I want to upload a profile picture so others can recognize me.

**Flow:**

1. **Client-Side Validation**
   - Check file type (JPEG, PNG, WebP only)
   - Check file size (<10 MB)
   - Display preview before upload

2. **Image Optimization (Client)**
   - Resize to 512x512 pixels (avatar standard)
   - Compress to ~200 KB target size
   - Convert to WebP if browser supports

3. **Upload to Supabase Storage**
   - Bucket: `avatars`
   - Path: `{userId}/avatar.webp`
   - Public URL: `https://[project].supabase.co/storage/v1/object/public/avatars/{userId}/avatar.webp`

4. **Update User Profile**
   - Store avatar URL in `users.avatar_url` column
   - Invalidate CDN cache for old avatar
   - Trigger profile update event

**Code Example:**

```typescript
// client/src/services/imageService.ts
async function uploadAvatar(file: File, userId: string): Promise<string> {
  // Validate
  const validation = validateImage(file);
  if (!validation.valid) throw new Error(validation.error);

  // Optimize
  const optimized = await optimizeImage(file, { width: 512, height: 512 });

  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(`${userId}/avatar.webp`, optimized, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}
```

---

### Scenario 2: Video Upload (Post)

**User Story:** As a user, I want to post a video of a Quebec festival so others can see the culture.

**Flow:**

1. **Client-Side Validation**
   - Check file type (MP4, WebM, MOV)
   - Check file size (<100 MB)
   - Check duration (<300 seconds)

2. **Generate Thumbnail (Client)**
   - Extract frame at 1 second mark
   - Resize to 640x360 pixels
   - Save as JPEG thumbnail

3. **Upload Video**
   - Bucket: `videos`
   - Path: `{userId}/{postId}/video.mp4`
   - Upload with progress tracking

4. **Upload Thumbnail**
   - Bucket: `thumbnails`
   - Path: `{userId}/{postId}/thumb.jpg`

5. **Create Post Record**
   - Store video URL in `posts.media_url`
   - Store thumbnail URL in `posts.thumbnail_url`
   - Set post type to `video`

**Code Example:**

```typescript
async function uploadVideoPost(
  file: File,
  userId: string,
  postId: string,
): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  // Validate
  if (file.size > 100 * 1024 * 1024) {
    throw new Error("Vidéo trop grande (max 100 MB)");
  }

  // Generate thumbnail
  const thumbnail = await generateVideoThumbnail(file, 1); // 1 second

  // Upload video
  const { data: videoData, error: videoError } = await supabase.storage
    .from("videos")
    .upload(`${userId}/${postId}/video.mp4`, file);

  if (videoError) throw videoError;

  // Upload thumbnail
  const { data: thumbData, error: thumbError } = await supabase.storage
    .from("thumbnails")
    .upload(`${userId}/${postId}/thumb.jpg`, thumbnail);

  if (thumbError) throw thumbError;

  return {
    videoUrl: supabase.storage.from("videos").getPublicUrl(videoData.path).data
      .publicUrl,
    thumbnailUrl: supabase.storage
      .from("thumbnails")
      .getPublicUrl(thumbData.path).data.publicUrl,
  };
}
```

---

### Scenario 3: Multiple Image Upload (Gallery Post)

**User Story:** As a user, I want to upload multiple photos from a trip to create a gallery post.

**Flow:**

1. **Select Multiple Files**
   - User selects 2-10 images
   - Display grid preview

2. **Batch Validation**
   - Validate each image individually
   - Show progress bar for each upload

3. **Parallel Upload**
   - Upload all images concurrently (max 3 at a time)
   - Handle individual upload failures gracefully

4. **Create Gallery Post**
   - Store array of image URLs in `posts.media_url` (JSON array)
   - First image becomes thumbnail

**Code Example:**

```typescript
async function uploadGallery(
  files: File[],
  userId: string,
  postId: string,
): Promise<string[]> {
  if (files.length > 10) {
    throw new Error("Maximum 10 images par galerie");
  }

  const uploadPromises = files.map(async (file, index) => {
    const optimized = await optimizeImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
    });
    const { data, error } = await supabase.storage
      .from("images")
      .upload(`${userId}/${postId}/image-${index}.webp`, optimized);

    if (error) throw error;
    return supabase.storage.from("images").getPublicUrl(data.path).data
      .publicUrl;
  });

  // Upload with max 3 concurrent requests
  const urls: string[] = [];
  for (let i = 0; i < uploadPromises.length; i += 3) {
    const batch = uploadPromises.slice(i, i + 3);
    const results = await Promise.all(batch);
    urls.push(...results);
  }

  return urls;
}
```

---

## 🗄️ Storage Strategy

### Supabase Storage Buckets

| Bucket Name  | Purpose                  | Max File Size | Public Access | CDN Cached      |
| ------------ | ------------------------ | ------------- | ------------- | --------------- |
| `avatars`    | User profile pictures    | 10 MB         | ✅ Yes        | ✅ Yes (1 hour) |
| `images`     | Post images, gallery     | 10 MB         | ✅ Yes        | ✅ Yes (1 day)  |
| `videos`     | Video posts, stories     | 100 MB        | ✅ Yes        | ✅ Yes (1 day)  |
| `thumbnails` | Video thumbnails         | 1 MB          | ✅ Yes        | ✅ Yes (1 day)  |
| `audio`      | Voice messages, podcasts | 20 MB         | ✅ Yes        | ✅ Yes (1 day)  |
| `temp`       | Temporary uploads        | 100 MB        | ❌ No         | ❌ No           |

### File Naming Convention

```
{bucket}/{userId}/{resourceId}/{filename}.{ext}

Examples:
- avatars/user-123/avatar.webp
- videos/user-456/post-789/video.mp4
- images/user-456/post-789/image-0.webp
- thumbnails/user-456/post-789/thumb.jpg
```

### Storage Lifecycle

- **Temp Files:** Auto-delete after 24 hours
- **Deleted Posts:** Media files deleted within 7 days
- **User Deletion:** All user media deleted immediately

---

## 🎨 Optimization

### Image Optimization

**Techniques:**

1. **Resizing:** Reduce dimensions to match display size
2. **Compression:** Reduce file size without visible quality loss
3. **Format Conversion:** Convert to modern formats (WebP, AVIF)
4. **Lazy Loading:** Load images only when visible

**Optimization Levels:**

```typescript
const OPTIMIZATION_PRESETS = {
  avatar: { width: 512, height: 512, quality: 85 },
  thumbnail: { width: 640, height: 360, quality: 80 },
  post: { maxWidth: 1920, maxHeight: 1080, quality: 90 },
  story: { width: 1080, height: 1920, quality: 85 },
};
```

### Video Optimization

**Techniques:**

1. **Transcoding:** Convert to H.264 for compatibility
2. **Bitrate Reduction:** Target 2 Mbps for 1080p
3. **Resolution Capping:** Max 1080p for mobile
4. **Adaptive Streaming:** HLS or DASH for large videos

**Server-Side Processing (Future):**

```typescript
// Example using FFmpeg (to be implemented)
async function transcodeVideo(inputPath: string, outputPath: string) {
  await ffmpeg(inputPath)
    .videoCodec("libx264")
    .videoBitrate("2000k")
    .size("1920x1080")
    .audioCodec("aac")
    .audioBitrate("128k")
    .output(outputPath)
    .run();
}
```

---

## 🚀 Delivery

### CDN Strategy

**Primary CDN:** Supabase Storage (built-in CDN)  
**Fallback CDN:** Vercel Edge Network (for static assets)

**Cache Headers:**

```typescript
const CACHE_HEADERS = {
  avatar: "public, max-age=3600", // 1 hour
  post: "public, max-age=86400", // 1 day
  story: "public, max-age=300", // 5 minutes (ephemeral)
};
```

### Responsive Images

**Technique:** Use `srcset` for different screen sizes

```tsx
<img
  src={image.url}
  srcSet={`
    ${image.url}?width=640 640w,
    ${image.url}?width=1280 1280w,
    ${image.url}?width=1920 1920w
  `}
  sizes="(max-width: 640px) 640px, (max-width: 1280px) 1280px, 1920px"
  alt="Post image"
/>
```

### Video Streaming

**Approach:** Progressive download (not true streaming yet)

**Future Enhancement:** Implement HLS for adaptive bitrate streaming

---

## 🐛 Edge Cases

### Scenario 1: Upload Failure Mid-Transfer

**Problem:** Network drops during upload, leaving partial file.

**Solution:**

- Use Supabase Storage resumable uploads
- Implement retry logic with exponential backoff
- Show upload progress and allow resume

```typescript
async function resumableUpload(file: File, path: string) {
  const chunkSize = 5 * 1024 * 1024; // 5 MB chunks
  let uploadedBytes = 0;

  while (uploadedBytes < file.size) {
    const chunk = file.slice(uploadedBytes, uploadedBytes + chunkSize);
    try {
      await supabase.storage
        .from("videos")
        .uploadChunk(path, chunk, uploadedBytes);
      uploadedBytes += chunk.size;
    } catch (error) {
      // Retry after delay
      await sleep(1000);
    }
  }
}
```

---

### Scenario 2: Corrupted Image Upload

**Problem:** User uploads corrupted or malformed image file.

**Solution:**

- Validate file header (magic bytes) before upload
- Try to decode image on client before upload
- Show specific error: "Fichier image corrompu"

```typescript
async function validateImageIntegrity(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}
```

---

### Scenario 3: Unsupported Video Codec

**Problem:** User uploads MP4 with unsupported codec (e.g., AV1).

**Solution:**

- Check codec before upload using `MediaInfo.js`
- Reject unsupported codecs with clear message
- Suggest conversion tools or supported formats

```typescript
async function detectVideoCodec(file: File): Promise<string> {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  await video.play().catch(() => {});
  const codec = video.canPlayType(file.type);
  return codec === "probably" || codec === "maybe"
    ? "supported"
    : "unsupported";
}
```

---

### Scenario 4: Extremely Large File

**Problem:** User tries to upload 500 MB video (exceeds limit).

**Solution:**

- Reject immediately with clear message
- Suggest compression or editing to reduce size
- Show size limit prominently in UI

---

### Scenario 5: Slow Network (2G/3G)

**Problem:** Upload takes 10+ minutes on slow connection.

**Solution:**

- Show estimated time remaining
- Allow background upload (continue browsing)
- Save draft post until upload completes

---

### Scenario 6: Orientation Mismatch (EXIF Rotation)

**Problem:** Photo appears rotated after upload due to EXIF orientation tag.

**Solution:**

- Read EXIF orientation tag on client
- Rotate image canvas before upload
- Strip EXIF data to reduce file size

```typescript
import EXIF from "exif-js";

async function fixImageOrientation(file: File): Promise<Blob> {
  const exif = await new Promise((resolve) => {
    EXIF.getData(file as any, function (this: any) {
      resolve(EXIF.getTag(this, "Orientation"));
    });
  });

  if (!exif || exif === 1) return file; // No rotation needed

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const img = await loadImage(file);

  // Apply rotation based on EXIF orientation
  // (implementation details omitted for brevity)
}
```

---

### Scenario 7: Animated GIF Upload

**Problem:** Animated GIF loses animation after optimization.

**Solution:**

- Detect animated GIFs before processing
- Skip optimization for animated GIFs (preserve animation)
- Or convert to video (MP4) for better compression

```typescript
async function isAnimatedGif(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const view = new Uint8Array(buffer);
  // Check for multiple frames (simplified)
  let frameCount = 0;
  for (let i = 0; i < view.length - 3; i++) {
    if (view[i] === 0x21 && view[i + 1] === 0xf9) frameCount++;
  }
  return frameCount > 1;
}
```

---

### Scenario 8: Duplicate Upload

**Problem:** User clicks upload button twice, uploading same file twice.

**Solution:**

- Disable upload button during upload
- Check for duplicate files by hash (MD5)
- Deduplicate on server side

---

### Scenario 9: Browser Incompatibility

**Problem:** WebP not supported in old Safari versions.

**Solution:**

- Feature detection: check `canvas.toBlob('image/webp')`
- Fallback to JPEG if WebP unsupported
- Serve WebP to modern browsers, JPEG to legacy

---

### Scenario 10: Out of Storage Quota

**Problem:** User exceeds Supabase storage quota (e.g., 1 GB free tier).

**Solution:**

- Check available quota before upload
- Show storage usage in profile settings
- Prompt upgrade to premium for more storage

---

## 🔒 Security

### Content Security Policy (CSP)

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  img-src 'self' https://*.supabase.co;
  media-src 'self' https://*.supabase.co;
"
/>
```

### File Type Validation

**Server-Side Validation (Required):**

```typescript
// Validate MIME type by reading file header
function validateFileType(buffer: Buffer): string {
  const header = buffer.slice(0, 12).toString("hex");

  if (header.startsWith("ffd8ff")) return "image/jpeg";
  if (header.startsWith("89504e47")) return "image/png";
  if (
    header.startsWith("52494646") &&
    buffer.slice(8, 12).toString() === "WEBP"
  ) {
    return "image/webp";
  }

  throw new Error("Type de fichier non supporté");
}
```

### Malware Scanning

**Future Enhancement:** Integrate ClamAV or VirusTotal API for uploaded files.

---

## ⚡ Performance

### Metrics to Track

- **Upload Time:** Target <10 seconds for 10 MB image
- **First Contentful Paint (FCP):** <1 second
- **Largest Contentful Paint (LCP):** <2.5 seconds
- **CDN Hit Rate:** >90%

### Optimization Checklist

- [x] Use WebP format for images
- [x] Implement lazy loading for images
- [ ] Add srcset for responsive images
- [ ] Implement video thumbnail generation
- [ ] Use CDN for all media delivery
- [ ] Add compression for API responses
- [ ] Implement image placeholder (blur-up)

---

## 🧪 Testing Scenarios

### Manual Test Cases

1. ✅ Upload 1 MB JPEG → Should succeed
2. ✅ Upload 15 MB image → Should fail with "trop grande" error
3. ✅ Upload .txt file → Should fail with "format non supporté" error
4. ✅ Upload corrupted JPEG → Should fail gracefully
5. ✅ Upload video with upload progress → Should show progress bar
6. ✅ Cancel upload mid-transfer → Should stop and clean up
7. ✅ Upload on slow 3G → Should show estimated time
8. ✅ Upload duplicate file → Should deduplicate or warn
9. ✅ Upload rotated iPhone photo → Should auto-rotate
10. ✅ Upload animated GIF → Should preserve animation

### Automated Tests (E2E)

```typescript
describe("Media Upload", () => {
  it("should upload valid image", async () => {
    const file = new File(["..."], "test.jpg", { type: "image/jpeg" });
    const url = await uploadAvatar(file, "user-123");
    expect(url).toMatch(/^https:\/\/.*\.supabase\.co/);
  });

  it("should reject oversized image", async () => {
    const file = new File([new ArrayBuffer(20 * 1024 * 1024)], "large.jpg");
    await expect(uploadAvatar(file, "user-123")).rejects.toThrow("trop grande");
  });
});
```

---

## 📚 Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [MDN: File API](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [Web.dev: Image Optimization](https://web.dev/fast/#optimize-your-images)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

---

**Document Owner:** Backend Team  
**Last Review:** December 15, 2025  
**Next Review:** January 15, 2026  
**Status:** ✅ Living Document
