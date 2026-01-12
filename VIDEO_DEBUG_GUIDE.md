# Video Playback Debugging Guide

## Overview

This guide provides comprehensive debugging tools and instructions for resolving the "Shiny Black Screen" video rendering failure in ZyeuteV5.

## Quick Access

**Video Debug Dashboard**: Visit `/debug/video` in your browser when debug mode is enabled.

## Issues Addressed

1. **Repository Structure Issues**
   - Broken Git submodules
   - LFS pointer files (130 bytes)
   - Missing .gitmodules entries

2. **CSP (Content Security Policy) Violations**
   - Missing media-src directives
   - Incorrect domain whitelisting
   - CORS issues with external video sources

3. **Network State Problems**
   - Videos stuck in `networkState: 2` (NETWORK_LOADING)
   - Videos stuck in `networkState: 3` (NETWORK_NO_SOURCE)
   - Infinite loading states

4. **Auth Context Issues**
   - Infinite redirect loops
   - Session validation blocking UI thread
   - Race conditions in auth initialization

## Tools Provided

### 1. Video Source Validator (`videoSourceValidator.ts`)

Validates video URLs and checks for common issues:

```typescript
import { validateVideoSource } from '@/utils/videoSourceValidator';

const result = await validateVideoSource('https://videos.pexels.com/...');

if (!result.isValid) {
  console.error('Issues:', result.issues);
}
```

**Features:**
- URL format validation
- CSP compliance checking
- LFS pointer detection
- Domain verification (Pexels, Mux, etc.)
- File size estimation

### 2. Video Source Debug Hook (`useVideoSourceDebug.ts`)

React hook for debugging video sources:

```typescript
import { useVideoSourceDebug } from '@/hooks/useVideoSourceDebug';

function MyComponent() {
  const { validate, testPlayback, generateReport } = useVideoSourceDebug();
  
  // Validate a single source
  const result = await validate(videoUrl);
  
  // Test if video can actually play
  const playbackTest = await testPlayback(videoUrl);
  
  // Generate full diagnostic report
  const report = await generateReport([url1, url2, url3]);
}
```

### 3. Enhanced VideoPlayer Component

The VideoPlayer has been enhanced with:

- **Network State Monitoring**: Logs detailed network state transitions
- **Error Classification**: Distinguishes between CSP, CORS, and loading errors
- **Loading Timeout**: 15-second timeout to prevent infinite loading
- **Debug Mode**: Enable via URL parameter `?debug=1` or localStorage

**Enhanced Error Logging:**
```typescript
// Network state meanings:
// 0 = NETWORK_EMPTY
// 1 = NETWORK_IDLE
// 2 = NETWORK_LOADING (common stuck state)
// 3 = NETWORK_NO_SOURCE (CSP/CORS issue)
```

### 4. Video Debug Dashboard (`/debug/video`)

Interactive dashboard with:

- **Automatic System Checks**
  - Git repository structure
  - CSP header verification
  - Network connectivity
  - LFS pointer detection

- **Manual URL Testing**
  - Test any video URL
  - View validation results
  - Check playback capability

- **Diagnostic Reports**
  - Generate comprehensive reports
  - Export for debugging
  - Share with team

## Common Issues & Solutions

### Issue 1: Video Stuck in networkState: 2 (NETWORK_LOADING)

**Symptoms:**
- Black screen with loading spinner
- Video never starts playing
- Console shows "networkState: 2"

**Causes:**
- CSP blocking the video source
- Network connectivity issues
- CORS misconfiguration

**Solutions:**
1. Check CSP headers in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "media-src 'self' https://*.pexels.com https://video-files.pexels.com https://stream.mux.com blob: data: https:;"
        }
      ]
    }
  ]
}
```

2. Verify domain is whitelisted:
   - Check if video URL matches CSP media-src domains
   - Add missing domains to CSP policy

3. Test with debug mode:
   - Add `?debug=1` to URL
   - Check console for detailed logs

### Issue 2: Video Shows networkState: 3 (NETWORK_NO_SOURCE)

**Symptoms:**
- Error icon displayed
- Console shows "NETWORK_NO_SOURCE"
- Video element has no playable source

**Causes:**
- CSP violation (most common)
- Invalid video URL
- CORS blocking

**Solutions:**
1. Use the Video Debug Dashboard to validate the URL
2. Check browser console for CSP violation errors
3. Verify the domain is in the CSP whitelist

### Issue 3: LFS Pointer Files (130 bytes)

**Symptoms:**
- Video files in public/ folder are ~130 bytes
- Files contain Git LFS pointer text
- Playback fails with format errors

**Detection:**
```bash
# Check file sizes
find public -type f -name "*.mp4" -exec ls -lh {} \;

# Files under 200 bytes are likely LFS pointers
```

**Solutions:**
1. Pull actual files from LFS:
```bash
git lfs pull
```

2. Or use external video sources (Pexels, Mux) instead

### Issue 4: Infinite Redirect Loops

**Symptoms:**
- Page constantly reloading
- AuthContext never stabilizes
- `isLoading` stays true

**Fixed in AuthContext:**
- Emergency timeout (2 seconds) forces UI render
- Resilient profile fetching with fallback
- Prevents redirect loops on auth errors

**Monitor with:**
```typescript
// Check AuthContext state in console
console.log('[Auth] State:', {
  isAuthenticated,
  isLoading,
  userId: user?.id
});
```

## Vercel.json CSP Configuration

**Current Configuration:**
```json
{
  "version": 2,
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self' https://vuanulvyqkfefmjcikfk.supabase.co https://*.supabase.co https://*.pexels.com https://*.stripe.com https://fonts.googleapis.com https://fonts.gstatic.com https://vercel.live https://zyeutev5-production.up.railway.app; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.pexels.com https://videos.pexels.com https://images.pexels.com https://api.pexels.com https://video-files.pexels.com https://zyeutev5-production.up.railway.app https://*.stripe.com https://*.mux.com; img-src 'self' data: https://images.pexels.com https://*.supabase.co https://*.pexels.com https://image.mux.com blob: https:; media-src 'self' https://*.pexels.com https://videos.pexels.com https://images.pexels.com https://video-files.pexels.com https://stream.mux.com blob: data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; frame-src 'self' https://js.stripe.com https://vercel.live;"
        }
      ]
    }
  ]
}
```

**Key Directives:**
- ✅ `media-src` includes all Pexels domains
- ✅ `media-src` includes Mux streaming
- ✅ `media-src` allows blob: and data: URLs
- ✅ `connect-src` allows API calls to Pexels

## Debugging Workflow

### Step 1: Run Automatic Checks
1. Visit `/debug/video`
2. Review all system checks
3. Fix any errors or warnings

### Step 2: Test Video URLs
1. Copy a failing video URL
2. Paste into debug dashboard
3. Review validation results
4. Check playback test

### Step 3: Check Browser Console
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Or add to URL
window.location.href = window.location.href + '?debug=1';
```

### Step 4: Monitor Network State
Look for these log messages:
- `⚠️ Video stuck in NETWORK_LOADING state (networkState: 2)`
- `❌ NETWORK_NO_SOURCE - CSP or CORS issue likely`
- `Video loading timeout for...`

### Step 5: Generate Diagnostic Report
```typescript
import { generateDiagnosticReport } from '@/utils/videoSourceValidator';

const report = await generateDiagnosticReport([
  'https://videos.pexels.com/...',
  'https://stream.mux.com/...',
]);

console.log('Report:', report);
```

## Repository Structure Fix

**Issue Found:**
- `gemini-cli` directory was a broken submodule
- No entry in `.gitmodules`
- Caused `fatal: no submodule mapping found`

**Fix Applied:**
```bash
git rm --cached gemini-cli
rm -rf gemini-cli
```

## Testing Video Playback

### Manual Test
```typescript
// Create test video element
const video = document.createElement('video');
video.src = 'https://videos.pexels.com/...';
video.muted = true;
video.playsInline = true;

video.addEventListener('canplay', () => {
  console.log('✅ Video can play');
});

video.addEventListener('error', (e) => {
  console.error('❌ Video error:', {
    code: video.error?.code,
    message: video.error?.message,
    networkState: video.networkState,
  });
});

video.load();
```

### Automated Test
Use the `testVideoPlayback` function:
```typescript
import { testVideoPlayback } from '@/utils/videoSourceValidator';

const result = await testVideoPlayback('https://...');

if (!result.canPlay) {
  console.error('Playback failed:', result.error);
  console.error('Network state:', result.networkState);
}
```

## Browser Compatibility

### Network State Support
All modern browsers support the `networkState` property:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

### CSP Support
Ensure CSP headers are served by the deployment platform:
- Vercel: ✅ Configured via `vercel.json`
- Railway: Configure via middleware
- Local dev: May require additional setup

## Monitoring & Logging

### Enable Debug Mode
```javascript
// In browser console
localStorage.setItem('debug', 'true');

// Or via URL
?debug=1
```

### View Logs
```javascript
// Filter video-related logs
console.log('[VideoPlayer]', ...);
console.log('[useVideoSourceDebug]', ...);
console.log('[VideoSourceValidator]', ...);
```

### Network State Meanings
```
0 = NETWORK_EMPTY    // No data loaded
1 = NETWORK_IDLE     // Data loaded, not downloading
2 = NETWORK_LOADING  // Actively downloading (stuck here = problem)
3 = NETWORK_NO_SOURCE // No valid source (CSP/CORS issue)
```

## Support

For additional help:
1. Visit `/debug/video` dashboard
2. Generate diagnostic report
3. Check browser console logs
4. Review CSP configuration in `vercel.json`
5. Test URLs with validation tools

## Changelog

### 2026-01-12
- ✅ Fixed broken `gemini-cli` submodule
- ✅ Enhanced VideoPlayer with network state logging
- ✅ Created video source validator utility
- ✅ Added useVideoSourceDebug hook
- ✅ Built Video Debug Dashboard
- ✅ Verified CSP headers include all Pexels domains
- ✅ Added loading timeout to prevent infinite loading
- ✅ Enhanced error messages with network state details
