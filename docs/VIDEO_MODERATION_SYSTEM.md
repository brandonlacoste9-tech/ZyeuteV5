# Video Moderation Security System

## Overview

A comprehensive video moderation system has been implemented to automatically analyze and block videos that don't meet Zyeuté's safety criteria before they are published.

## What Was Implemented

### 1. **Backend Video Moderation Service** (`backend/services/videoModeration.ts`)

- Uses Gemini 1.5 Flash Vision API to analyze video content directly
- Analyzes both video content and captions/text
- Returns detailed moderation results with severity levels

**Key Features:**

- ✅ **Zero Tolerance Policies:**
  - Child safety violations (grooming, inappropriate content with minors)
  - Hate speech and discrimination
  - Explicit nudity or sexual content
  - Extreme violence or gore
  - Illegal activities

- ✅ **Severity Levels:**
  - `safe`: Content approved
  - `low`: Borderline, flagged for review
  - `medium`: Problematic, hidden from trending
  - `high`: Violation, rejected and removed
  - `critical`: Severe violation, user banned

- ✅ **Automatic Actions:**
  - **Critical violations**: Immediate user ban + content deletion
  - **High severity**: Content rejected, user warned
  - **Medium severity**: Content hidden, flagged for review
  - **Low severity**: Content allowed but flagged

### 2. **Integration Points**

#### A. Surgical Upload Route (`backend/routes/upload-surgical.ts`)

- Videos are moderated **before** being saved to database
- If moderation fails:
  - Uploaded file is deleted from storage
  - Moderation log is created
  - User is banned if critical violation detected
  - Error response returned to client

#### B. Main Post Creation Route (`backend/routes.ts`)

- Videos uploaded via main API are also moderated
- Uses `moderateVideoFromUrl()` to analyze already-uploaded videos
- Same blocking/rejection logic applies

#### C. Frontend Moderation Service (`frontend/src/services/moderationService.ts`)

- Updated `analyzeVideo()` to call backend moderation API
- Properly maps backend results to frontend format
- Handles errors gracefully with fail-safe behavior

## How It Works

### Upload Flow with Moderation:

```
1. User uploads video
   ↓
2. Video saved to Supabase Storage (temporarily)
   ↓
3. 🛡️ Video moderation check:
   - Caption/text analyzed via v3Mod
   - Video content analyzed via Gemini Vision API
   ↓
4. Decision:
   ├─ APPROVED → Post created, video published
   ├─ REJECTED → Video deleted, error returned
   └─ CRITICAL → User banned, account deactivated
```

### Moderation Process:

1. **Text Analysis**: Caption/content checked first (fast)
2. **Video Analysis**: Video content analyzed using Gemini Vision API
3. **Combined Result**: Both checks must pass for approval
4. **Action Taken**: Based on severity level

## Security Features

### ✅ **Zero Tolerance Enforcement**

- Child safety violations result in immediate ban
- No appeals for critical violations
- Persistent moderation logs for audit trail

### ✅ **Automatic Cleanup**

- Rejected videos are automatically deleted from storage
- Prevents storage of inappropriate content
- Saves storage costs

### ✅ **User Accountability**

- All violations logged with user ID
- Strike system tracks repeat offenders
- Graduated penalties (warn → hide → reject → ban)

### ✅ **Fail-Safe Behavior**

- If moderation service fails, content is flagged for manual review
- Prevents service outages from blocking legitimate content
- Ensures platform remains functional

## Configuration

### Required Environment Variables:

- `GEMINI_API_KEY` or `GOOGLE_API_KEY` - For Gemini Vision API
- `DEEPSEEK_API_KEY` - For text moderation (v3Mod)

### Optional Configuration:

- Moderation can be disabled by removing API keys (fail-safe mode)
- Severity thresholds can be adjusted in `videoModeration.ts`

## Testing

To test video moderation:

1. **Upload a safe video**: Should be approved and published
2. **Upload with inappropriate caption**: Should be rejected
3. **Upload inappropriate video**: Should be rejected (if Gemini detects it)
4. **Upload child safety violation**: Should result in immediate ban

## Monitoring

Check moderation logs:

- Database: `moderation_logs` table
- Console logs: Look for `[VideoModeration]` and `[Security]` prefixes
- User strikes: `user_strikes` table

## Future Enhancements

Potential improvements:

- [ ] Frame extraction for more detailed analysis
- [ ] Audio transcription for speech analysis
- [ ] Real-time moderation during upload (progress feedback)
- [ ] Admin dashboard for reviewing flagged content
- [ ] Appeal system for false positives
- [ ] Machine learning model training on Quebec-specific content

## Related Files

- `backend/services/videoModeration.ts` - Core moderation logic
- `backend/routes/upload-surgical.ts` - Upload route with moderation
- `backend/routes.ts` - Main post creation with moderation
- `frontend/src/services/moderationService.ts` - Frontend moderation service
- `backend/v3-swarm.ts` - Text moderation (v3Mod)
- `backend/services/videoEnrichment.ts` - Video enrichment (separate from moderation)

## Notes

- **Quebec Context**: Moderation respects Quebec French (joual) and cultural context
- **Performance**: Video moderation adds ~2-5 seconds to upload time
- **Costs**: Gemini Vision API usage for video analysis (check Google Cloud pricing)
- **Privacy**: Videos are analyzed but not stored by moderation service
