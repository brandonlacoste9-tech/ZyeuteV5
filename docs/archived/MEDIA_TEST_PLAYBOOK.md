# Media (Video/Image) Testing Playbook

**Date**: 2025-12-15  
**Purpose**: Comprehensive test scenarios for video and image functionality  
**Scope**: Upload, playback, error handling, fallbacks, and meta tag validation

---

## Overview

This playbook provides structured test scenarios for all media-related user flows in Zyeuté V3. Each scenario includes:

- **User Flow Description**
- **Device/Browser Coverage Matrix**
- **Expected Behavior**
- **Error & Fallback Testing**
- **Performance Criteria**

---

## Test Environment Matrix

### Device Coverage

| Device Type | Priority | Target Devices                          |
| ----------- | -------- | --------------------------------------- |
| Desktop     | P0       | Windows 10/11, macOS 13+, Ubuntu 22.04+ |
| Tablet      | P1       | iPad (iOS 15+), Android tablets         |
| Mobile      | P0       | iPhone 12+ (iOS 15+), Android 10+       |

### Browser Coverage

| Browser          | Desktop | Mobile | Notes                           |
| ---------------- | ------- | ------ | ------------------------------- |
| Chrome           | ✅ P0   | ✅ P0  | Latest 2 versions               |
| Firefox          | ✅ P1   | ✅ P2  | Latest 2 versions               |
| Safari           | ✅ P0   | ✅ P0  | Latest 2 versions (iOS + macOS) |
| Edge             | ✅ P1   | ❌     | Latest version                  |
| Samsung Internet | ❌      | ✅ P2  | Latest version                  |

### Network Conditions

| Condition | Speed    | Latency | Purpose          |
| --------- | -------- | ------- | ---------------- |
| Fast 4G   | 4 Mbps   | 20ms    | Baseline mobile  |
| 3G        | 1.5 Mbps | 100ms   | Poor mobile      |
| Slow 3G   | 400 Kbps | 400ms   | Worst case       |
| Offline   | 0 Kbps   | N/A     | Offline handling |

---

## Section 1: Image Testing

### 1.1 Image Upload Flow

#### Test Scenario: Upload Profile Avatar

**Steps:**

1. Navigate to profile settings
2. Click "Upload Avatar" button
3. Select image file from local device
4. Preview uploaded image
5. Confirm upload
6. Verify image displays correctly in profile

**Checklist:**

| Step                      | Chrome Desktop | Safari iOS | Chrome Android | Expected Result                     | Status |
| ------------------------- | -------------- | ---------- | -------------- | ----------------------------------- | ------ |
| File picker opens         | ⏳             | ⏳         | ⏳             | Native file picker appears          |        |
| Select .jpg image         | ⏳             | ⏳         | ⏳             | File loads successfully             |        |
| Select .png image         | ⏳             | ⏳         | ⏳             | File loads successfully             |        |
| Select .gif image         | ⏳             | ⏳         | ⏳             | File loads or rejected with message |        |
| Preview displays          | ⏳             | ⏳         | ⏳             | Thumbnail preview visible           |        |
| Upload progress shown     | ⏳             | ⏳         | ⏳             | Progress bar/spinner visible        |        |
| Success feedback          | ⏳             | ⏳         | ⏳             | Toast notification + updated avatar |        |
| Image persists on refresh | ⏳             | ⏳         | ⏳             | Avatar still visible after reload   |        |

**Error Cases:**

| Error Condition               | Expected Behavior                   | Status | Notes |
| ----------------------------- | ----------------------------------- | ------ | ----- |
| File too large (>5MB)         | Clear error message, upload blocked | ⏳     |       |
| Invalid file type (.txt)      | Clear error message, upload blocked | ⏳     |       |
| Network failure during upload | Error message + retry option        | ⏳     |       |
| Server error (500)            | User-friendly error message         | ⏳     |       |
| No storage space (client)     | Clear error message                 | ⏳     |       |
| Corrupt image file            | Error message, no crash             | ⏳     |       |

---

#### Test Scenario: Upload Post Image

**Steps:**

1. Navigate to create post page
2. Click "Add Image" button
3. Select image file
4. Add caption (optional)
5. Submit post
6. Verify image displays in feed

**Checklist:**

| Step                           | Chrome Desktop | Safari iOS | Chrome Android | Expected Result                  | Status |
| ------------------------------ | -------------- | ---------- | -------------- | -------------------------------- | ------ |
| Multiple images selectable     | ⏳             | ⏳         | ⏳             | If supported, select 1-10 images |        |
| Image preview grid             | ⏳             | ⏳         | ⏳             | All images visible in preview    |        |
| Remove image before upload     | ⏳             | ⏳         | ⏳             | Image removed from preview       |        |
| Reorder images (if applicable) | ⏳             | ⏳         | ⏳             | Drag-and-drop or buttons work    |        |
| Caption saves                  | ⏳             | ⏳         | ⏳             | Caption persists with image      |        |
| Post appears in feed           | ⏳             | ⏳         | ⏳             | Image + caption visible          |        |
| Image loads on slow network    | ⏳             | ⏳         | ⏳             | Progressive loading or skeleton  |        |

**Performance Criteria:**

| Metric                         | Target  | Measurement | Status |
| ------------------------------ | ------- | ----------- | ------ |
| Upload time (1MB image, 4G)    | < 3s    | ⏳          |        |
| Upload time (5MB image, 4G)    | < 10s   | ⏳          |        |
| Preview render time            | < 500ms | ⏳          |        |
| Feed image load (cached)       | < 200ms | ⏳          |        |
| Feed image load (uncached, 4G) | < 2s    | ⏳          |        |

---

### 1.2 Image Display & Rendering

#### Test Scenario: Image Gallery Viewing

**Steps:**

1. Open user profile with multiple posts
2. Scroll through image gallery
3. Click on image to open full-view
4. Navigate between images (if applicable)
5. Close full-view

**Checklist:**

| Step                   | Chrome Desktop | Safari iOS | Chrome Android | Expected Result                   | Status |
| ---------------------- | -------------- | ---------- | -------------- | --------------------------------- | ------ |
| Gallery grid loads     | ⏳             | ⏳         | ⏳             | All thumbnails visible            |        |
| Lazy loading works     | ⏳             | ⏳         | ⏳             | Images load as scrolled into view |        |
| Full-view opens        | ⏳             | ⏳         | ⏳             | High-res image loads              |        |
| Zoom/pinch works       | ⏳             | ⏳         | ⏳             | Image zooms on pinch/click        |        |
| Navigation arrows work | ⏳             | ⏳         | ⏳             | Next/previous images load         |        |
| Close button works     | ⏳             | ⏳         | ⏳             | Returns to gallery                |        |
| Keyboard navigation    | ⏳             | N/A        | N/A            | Arrow keys + Escape work          |        |

**Responsive Design:**

| Viewport            | Layout Check     | Status | Notes |
| ------------------- | ---------------- | ------ | ----- |
| 1920x1080 (Desktop) | Grid 4 columns   | ⏳     |       |
| 1366x768 (Laptop)   | Grid 3 columns   | ⏳     |       |
| 768x1024 (Tablet)   | Grid 2 columns   | ⏳     |       |
| 375x667 (Mobile)    | Grid 1-2 columns | ⏳     |       |

---

### 1.3 Image Error Handling & Fallbacks

**Test Scenarios:**

| Error Condition    | Expected Fallback                | Status | Device Tested |
| ------------------ | -------------------------------- | ------ | ------------- |
| Image URL 404      | Placeholder image or broken icon | ⏳     |               |
| Image URL 403      | "Access denied" message          | ⏳     |               |
| Image CDN down     | Retry logic + fallback image     | ⏳     |               |
| Slow loading image | Skeleton loader or blur-up       | ⏳     |               |
| Image decode error | Fallback to generic icon         | ⏳     |               |
| Missing alt text   | Default alt text provided        | ⏳     |               |

---

## Section 2: Video Testing

### 2.1 Video Upload Flow

#### Test Scenario: Upload Video Post

**Steps:**

1. Navigate to create post page
2. Click "Add Video" button
3. Select video file from device
4. Preview video thumbnail
5. Add caption
6. Submit post
7. Verify video plays in feed

**Checklist:**

| Step                     | Chrome Desktop | Safari iOS | Chrome Android | Expected Result                 | Status |
| ------------------------ | -------------- | ---------- | -------------- | ------------------------------- | ------ |
| File picker opens        | ⏳             | ⏳         | ⏳             | Native picker shows video files |        |
| Select .mp4 video        | ⏳             | ⏳         | ⏳             | File loads successfully         |        |
| Select .mov video        | ⏳             | ⏳         | ⏳             | File loads (or converted)       |        |
| Select .webm video       | ⏳             | ⏳         | ⏳             | File loads successfully         |        |
| Video duration check     | ⏳             | ⏳         | ⏳             | If > max length, error message  |        |
| Thumbnail auto-generated | ⏳             | ⏳         | ⏳             | Thumbnail preview appears       |        |
| Upload progress shown    | ⏳             | ⏳         | ⏳             | Progress bar with percentage    |        |
| Processing notification  | ⏳             | ⏳         | ⏳             | "Processing video..." message   |        |
| Video appears in feed    | ⏳             | ⏳         | ⏳             | Playable video visible          |        |

**Error Cases:**

| Error Condition               | Expected Behavior           | Status | Notes |
| ----------------------------- | --------------------------- | ------ | ----- |
| File too large (>100MB)       | Clear error message         | ⏳     |       |
| Invalid format (.avi)         | Error message or conversion | ⏳     |       |
| Network failure during upload | Retry option                | ⏳     |       |
| Video processing fails        | User-friendly error         | ⏳     |       |
| Corrupt video file            | Error message, no crash     | ⏳     |       |

---

### 2.2 Video Playback

#### Test Scenario: Feed Video Playback

**Steps:**

1. Scroll through feed with videos
2. Click/tap on video to play
3. Pause video
4. Seek forward/backward
5. Adjust volume (if applicable)
6. Toggle fullscreen
7. Close/scroll away

**Checklist:**

| Feature               | Chrome Desktop | Safari iOS | Chrome Android | Expected Result                   | Status |
| --------------------- | -------------- | ---------- | -------------- | --------------------------------- | ------ |
| Autoplay (if enabled) | ⏳             | ⏳         | ⏳             | Video plays on scroll into view   |        |
| Click to play         | ⏳             | ⏳         | ⏳             | Video starts playing              |        |
| Play/pause button     | ⏳             | ⏳         | ⏳             | Button toggles playback           |        |
| Progress bar          | ⏳             | ⏳         | ⏳             | Shows current position            |        |
| Seeking works         | ⏳             | ⏳         | ⏳             | Drag/click on progress bar seeks  |        |
| Volume control        | ⏳             | ⏳         | ⏳             | Volume slider/buttons work        |        |
| Mute button           | ⏳             | ⏳         | ⏳             | Mutes/unmutes audio               |        |
| Fullscreen button     | ⏳             | ⏳         | ⏳             | Enters/exits fullscreen           |        |
| Picture-in-picture    | ⏳             | ⏳         | ⏳             | PiP mode works (if supported)     |        |
| Keyboard shortcuts    | ⏳             | N/A        | N/A            | Space (play/pause), arrows (seek) |        |

**Playback Performance:**

| Metric                    | Target        | Measurement | Status |
| ------------------------- | ------------- | ----------- | ------ |
| Time to first frame       | < 1s          | ⏳          |        |
| Buffering events (4G)     | < 2 per video | ⏳          |        |
| Playback smoothness (FPS) | 30+ FPS       | ⏳          |        |
| Audio/video sync          | ±50ms         | ⏳          |        |

---

#### Test Scenario: Video Quality & Adaptive Streaming

**Checklist:**

| Feature                  | Chrome Desktop | Safari iOS | Chrome Android | Expected Result               | Status |
| ------------------------ | -------------- | ---------- | -------------- | ----------------------------- | ------ |
| Auto quality selection   | ⏳             | ⏳         | ⏳             | Quality matches network speed |        |
| Manual quality selection | ⏳             | ⏳         | ⏳             | User can choose quality       |        |
| Quality switch smooth    | ⏳             | ⏳         | ⏳             | No visible glitch             |        |
| Captions/subtitles       | ⏳             | ⏳         | ⏳             | If available, toggle on/off   |        |

---

### 2.3 Video Error Handling & Fallbacks

**Test Scenarios:**

| Error Condition       | Expected Fallback               | Status | Device Tested |
| --------------------- | ------------------------------- | ------ | ------------- |
| Video URL 404         | Error message + thumbnail       | ⏳     |               |
| Video URL 403         | "Access denied" message         | ⏳     |               |
| Video CDN down        | Retry logic + error message     | ⏳     |               |
| Unsupported codec     | Error message + fallback format | ⏳     |               |
| Network timeout       | Loading spinner + retry button  | ⏳     |               |
| Playback stalled      | Buffering indicator + retry     | ⏳     |               |
| DRM/protected content | Appropriate error message       | ⏳     |               |

---

### 2.4 Video Stories (if applicable)

#### Test Scenario: Upload & View Story Video

**Steps:**

1. Navigate to story upload
2. Record or select video
3. Add effects/text (if applicable)
4. Post story
5. View own story
6. View others' stories

**Checklist:**

| Feature                 | Chrome Desktop | Safari iOS | Chrome Android | Expected Result                   | Status |
| ----------------------- | -------------- | ---------- | -------------- | --------------------------------- | ------ |
| Camera access           | ⏳             | ⏳         | ⏳             | Permission prompt + camera opens  |        |
| Record video            | ⏳             | ⏳         | ⏳             | Recording indicator visible       |        |
| Duration limit enforced | ⏳             | ⏳         | ⏳             | Max 15s or configured limit       |        |
| Preview before posting  | ⏳             | ⏳         | ⏳             | Preview plays correctly           |        |
| Story appears in feed   | ⏳             | ⏳         | ⏳             | Story visible with ring indicator |        |
| Story auto-plays        | ⏳             | ⏳         | ⏳             | Plays without click               |        |
| Tap to advance          | ⏳             | ⏳         | ⏳             | Next story loads                  |        |
| Hold to pause           | ⏳             | ⏳         | ⏳             | Story pauses                      |        |
| Story expires           | ⏳             | ⏳         | ⏳             | Removed after 24h (or config)     |        |

---

## Section 3: Meta Tags & SEO

### 3.1 Open Graph Meta Tags

**Test Pages:**

- Homepage
- User profile page
- Individual post page
- Video post page

**Checklist per Page:**

| Meta Tag          | Required      | Validation                     | Status |
| ----------------- | ------------- | ------------------------------ | ------ |
| `og:title`        | ✅            | Unique, descriptive, <60 chars | ⏳     |
| `og:description`  | ✅            | Relevant, <155 chars           | ⏳     |
| `og:image`        | ✅            | Valid URL, min 1200x630px      | ⏳     |
| `og:url`          | ✅            | Canonical URL                  | ⏳     |
| `og:type`         | ✅            | website/profile/article        | ⏳     |
| `og:site_name`    | ✅            | "Zyeuté"                       | ⏳     |
| `og:video`        | If video post | Valid video URL                | ⏳     |
| `og:video:width`  | If video      | Correct dimensions             | ⏳     |
| `og:video:height` | If video      | Correct dimensions             | ⏳     |

**Validation Tools:**

- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Twitter Card Validator: https://cards-dev.twitter.com/validator

---

### 3.2 Twitter Card Meta Tags

**Checklist:**

| Meta Tag                | Required | Validation             | Status |
| ----------------------- | -------- | ---------------------- | ------ |
| `twitter:card`          | ✅       | summary_large_image    | ⏳     |
| `twitter:site`          | ✅       | @ZyeuteApp or handle   | ⏳     |
| `twitter:title`         | ✅       | Matches og:title       | ⏳     |
| `twitter:description`   | ✅       | Matches og:description | ⏳     |
| `twitter:image`         | ✅       | Matches og:image       | ⏳     |
| `twitter:player`        | If video | Valid video player URL | ⏳     |
| `twitter:player:width`  | If video | Correct dimensions     | ⏳     |
| `twitter:player:height` | If video | Correct dimensions     | ⏳     |

---

### 3.3 Image Meta Tag Validation

**Image Requirements:**

| Aspect               | Requirement                      | Validation | Status |
| -------------------- | -------------------------------- | ---------- | ------ |
| Minimum size         | 1200x630px (1.91:1 ratio)        | ⏳         |        |
| Maximum size         | <8MB                             | ⏳         |        |
| Format               | JPG, PNG, WebP                   | ⏳         |        |
| Aspect ratio         | 1.91:1 for feed, 1:1 for profile | ⏳         |        |
| Alt text present     | Yes                              | ⏳         |        |
| Accessible via HTTPS | Yes                              | ⏳         |        |

**Test Sharing:**

| Platform | Preview Displays | Image Renders | Video Plays | Status |
| -------- | ---------------- | ------------- | ----------- | ------ |
| Facebook | ⏳               | ⏳            | ⏳          |        |
| Twitter  | ⏳               | ⏳            | ⏳          |        |
| LinkedIn | ⏳               | ⏳            | ⏳          |        |
| WhatsApp | ⏳               | ⏳            | ⏳          |        |
| Discord  | ⏳               | ⏳            | ⏳          |        |
| Slack    | ⏳               | ⏳            | ⏳          |        |

---

## Section 4: Performance & Optimization

### 4.1 Image Optimization

**Checklist:**

| Optimization               | Implementation                     | Validation | Status |
| -------------------------- | ---------------------------------- | ---------- | ------ |
| Responsive images (srcset) | Multiple sizes available           | ⏳         |        |
| Lazy loading               | Images load on scroll              | ⏳         |        |
| WebP format support        | WebP served to supporting browsers | ⏳         |        |
| AVIF format support        | AVIF served if supported           | ⏳         |        |
| Progressive JPEG           | Progressive rendering              | ⏳         |        |
| Image compression          | Quality 80-85%, optimized size     | ⏳         |        |
| CDN delivery               | Images served from CDN             | ⏳         |        |
| Caching headers            | Long cache lifetime (1 year)       | ⏳         |        |

---

### 4.2 Video Optimization

**Checklist:**

| Optimization                          | Implementation              | Validation | Status |
| ------------------------------------- | --------------------------- | ---------- | ------ |
| Adaptive bitrate streaming (HLS/DASH) | Multiple quality levels     | ⏳         |        |
| Video preload strategy                | `preload="metadata"`        | ⏳         |        |
| Thumbnail generation                  | Poster image for each video | ⏳         |        |
| Video compression                     | H.264/VP9 codec             | ⏳         |        |
| CDN delivery                          | Videos served from CDN      | ⏳         |        |
| Caching headers                       | Long cache lifetime         | ⏳         |        |

---

## Section 5: Accessibility (A11y)

### 5.1 Image Accessibility

**Checklist:**

| Feature           | Requirement                       | Status | Notes |
| ----------------- | --------------------------------- | ------ | ----- |
| Alt text present  | All images have descriptive alt   | ⏳     |       |
| Alt text quality  | Describes content, not "image of" | ⏳     |       |
| Decorative images | `alt=""` for decorative images    | ⏳     |       |
| Complex images    | Extended description available    | ⏳     |       |
| Image captions    | Captions available when needed    | ⏳     |       |

---

### 5.2 Video Accessibility

**Checklist:**

| Feature             | Requirement                       | Status | Notes |
| ------------------- | --------------------------------- | ------ | ----- |
| Captions/subtitles  | Available for speech content      | ⏳     |       |
| Audio description   | Available for visual-only content | ⏳     |       |
| Transcript          | Text transcript available         | ⏳     |       |
| Controls accessible | Keyboard navigable                | ⏳     |       |
| Autoplay disabled   | Or muted by default               | ⏳     |       |
| Pause mechanism     | Easy to pause/stop                | ⏳     |       |

---

## Section 6: Security

### 6.1 Upload Security

**Checklist:**

| Security Check                | Implementation                   | Status |
| ----------------------------- | -------------------------------- | ------ |
| File type validation (client) | Whitelist: jpg, png, mp4, etc.   | ⏳     |
| File type validation (server) | MIME type + magic number check   | ⏳     |
| File size limits enforced     | Max 5MB images, 100MB videos     | ⏳     |
| Malware scanning              | Upload scanned for malware       | ⏳     |
| Input sanitization            | Filenames sanitized              | ⏳     |
| CDN/S3 bucket security        | Public read, authenticated write | ⏳     |
| Content Security Policy       | CSP headers configured           | ⏳     |

---

## Testing Workflow

### Pre-Testing Setup

1. Set up test accounts (regular user, admin)
2. Prepare test media files (various sizes, formats)
3. Configure browser DevTools for network throttling
4. Install screen readers for a11y testing
5. Set up meta tag validation tools

### Testing Execution

1. Follow each scenario in order
2. Mark status: ✅ Pass, ❌ Fail, ⚠️ Partial, ⏳ Not Tested
3. Document all failures with screenshots
4. Note any unexpected behavior
5. Test on all required device/browser combinations

### Post-Testing

1. Compile findings into GitHub issues
2. Prioritize fixes (P0, P1, P2, P3)
3. Retest after fixes
4. Update status in this playbook
5. Final sign-off when all P0/P1 pass

---

## Issue Reporting Template

```markdown
### Issue: [Brief Description]

**Scenario**: Section 2.1 - Upload Video Post  
**Severity**: P0 Critical  
**Device**: iPhone 13, Safari iOS 16  
**Expected**: Video uploads successfully  
**Actual**: Upload fails with "Network error"  
**Steps to Reproduce**:

1. Navigate to create post
2. Click "Add Video"
3. Select 20MB .mp4 file
4. Observe upload failure after 5s

**Network**: Fast 4G  
**Screenshot/Recording**: [Link]  
**Console Errors**: [Paste]
```

---

## Progress Dashboard

| Section          | Total Tests | Passed | Failed | Not Tested | Completion |
| ---------------- | ----------- | ------ | ------ | ---------- | ---------- |
| 1. Images        | TBD         | 0      | 0      | TBD        | 0%         |
| 2. Videos        | TBD         | 0      | 0      | TBD        | 0%         |
| 3. Meta Tags     | TBD         | 0      | 0      | TBD        | 0%         |
| 4. Performance   | TBD         | 0      | 0      | TBD        | 0%         |
| 5. Accessibility | TBD         | 0      | 0      | TBD        | 0%         |
| 6. Security      | TBD         | 0      | 0      | TBD        | 0%         |
| **TOTAL**        | **TBD**     | **0**  | **0**  | **TBD**    | **0%**     |

---

**Last Updated**: 2025-12-15  
**Document Owner**: QA Team  
**Next Review**: Weekly
