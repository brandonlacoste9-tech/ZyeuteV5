# Tasks for Claude Code

> **Note**: See `TIKTOK_FEATURES_TO_ADD.md` for comprehensive list of TikTok features to implement

## Priority Tasks

### 1. **Admin UI for User Flagging System** 🔴 High Priority

**Location**: `frontend/src/components/admin/` or `frontend/src/pages/admin/`

**Requirements**:

- Create admin dashboard page for flagged users
- Display flagged users with severity levels (critical, high, medium, low)
- Show risk scores, related banned users, and evidence
- Allow admins to:
  - Review flagged users
  - Approve/reject flags
  - Manually ban users
  - View relationship analysis
  - See strike counts and history

**API Endpoints Available**:

- `GET /api/admin/flagging/flagged` - Get all flagged users
- `GET /api/admin/flagging/analyze/:userId` - Analyze user relationships
- `POST /api/admin/flagging/manual-flag` - Manually flag a user
- `POST /api/admin/flagging/ban-related/:userId` - Ban user + scan related
- `GET /api/admin/flagging/stats` - Get statistics

**Files to Create**:

- `frontend/src/pages/admin/FlaggedUsers.tsx` - Main flagged users page
- `frontend/src/components/admin/FlaggedUserCard.tsx` - User card component
- `frontend/src/components/admin/RelationshipGraph.tsx` - Visualize relationships
- `frontend/src/components/admin/StrikeHistory.tsx` - Show strike timeline

---

### 2. **TikTok-Style Strike System UI** 🟡 Medium Priority

**Location**: `frontend/src/components/user/` or `frontend/src/pages/settings/`

**Requirements**:

- User-facing strike display (like TikTok's Safety Center)
- Show active strikes with expiration dates
- Display strike type and violation details
- Show countdown to strike expiration (90-day window)
- Warning when approaching cumulative strike threshold (5 strikes)
- Appeal functionality

**Components Needed**:

- `frontend/src/components/user/StrikeDisplay.tsx` - Show user's strikes
- `frontend/src/pages/settings/SafetyCenter.tsx` - Safety center page
- `frontend/src/components/user/StrikeAppeal.tsx` - Appeal form

**API Integration**:

- Use existing moderation logs (strikes are logged as `strike_*` actions)
- May need to add `GET /api/user/strikes` endpoint if not exists

---

### 3. **Video Moderation Status UI** 🟡 Medium Priority

**Location**: `frontend/src/components/features/`

**Requirements**:

- Show moderation status on video posts
- Display if video was rejected and why
- Show "Under Review" status during moderation
- User-friendly error messages when uploads are rejected

**Files to Update**:

- `frontend/src/components/features/SingleVideoView.tsx` - Add moderation status display
- `frontend/src/components/upload/VideoUpload.tsx` - Show moderation feedback

**Status Types**:

- `approved` - Video approved
- `rejected` - Video rejected (show reason)
- `pending` - Under review
- `flagged` - Flagged for manual review

---

### 4. **TypeScript Type Improvements** 🟢 Low Priority

**Location**: Various

**Tasks**:

- Review `backend/services/userFlaggingSystem.ts` for any `as any` casts
- Review `backend/services/userRelationshipAnalyzer.ts` for type safety
- Review `backend/services/tiktokStrikeSystem.ts` for proper types
- Ensure all moderation-related types are exported from `shared/types/`
- Add proper types for flagging API responses

**Files to Check**:

- `backend/services/userFlaggingSystem.ts`
- `backend/services/userRelationshipAnalyzer.ts`
- `backend/services/tiktokStrikeSystem.ts`
- `backend/routes/user-flagging.ts`
- `shared/types/moderation.ts` (may need to create)

---

### 5. **Integration Testing** 🟡 Medium Priority

**Location**: `backend/` or `tests/`

**Requirements**:

- Test video moderation flow (upload → moderation → approve/reject)
- Test user flagging system (ban user → scan related → flag)
- Test strike system (add strikes → check cumulative → ban)
- Test admin API endpoints

**Test Files to Create**:

- `backend/tests/videoModeration.test.ts`
- `backend/tests/userFlagging.test.ts`
- `backend/tests/strikeSystem.test.ts`
- `backend/tests/adminFlagging.test.ts`

---

### 6. **Documentation Updates** 🟢 Low Priority

**Location**: `docs/`

**Tasks**:

- Update main README with new moderation features
- Add API documentation for admin flagging endpoints
- Create user guide for strike system
- Document TikTok-style thresholds in main docs

**Files to Update/Create**:

- `README.md` - Add moderation section
- `docs/API.md` - Add admin flagging endpoints
- `docs/USER_GUIDE.md` - Strike system explanation

---

### 7. **Error Handling & Edge Cases** 🟡 Medium Priority

**Location**: `backend/services/`

**Tasks**:

- Add retry logic for failed moderation API calls
- Handle rate limiting from Gemini API
- Add fallback when moderation service is down
- Handle edge cases (user deleted mid-analysis, etc.)

**Files to Update**:

- `backend/services/videoModeration.ts` - Add retry/fallback
- `backend/services/userFlaggingSystem.ts` - Handle edge cases
- `backend/services/userRelationshipAnalyzer.ts` - Error recovery

---

### 8. **Performance Optimization** 🟢 Low Priority

**Location**: `backend/services/`

**Tasks**:

- Cache relationship analysis results
- Batch process related user scans
- Optimize database queries in relationship analyzer
- Add pagination to flagged users API

**Files to Optimize**:

- `backend/services/userRelationshipAnalyzer.ts` - Add caching
- `backend/routes/user-flagging.ts` - Add pagination
- `backend/services/flaggingWorker.ts` - Batch processing

---

## Quick Wins (Easy Tasks)

1. **Add strike count to user profile** - Show strike count in user settings
2. **Add moderation badge** - Show "Flagged" or "Under Review" badge on user profiles
3. **Email notifications** - Send emails when users receive strikes
4. **Logging improvements** - Add more detailed logging for moderation actions
5. **Metrics dashboard** - Create simple metrics page showing flagging stats

---

## Notes

- All backend APIs are already implemented and working
- Focus on frontend UI and user experience
- TypeScript improvements should follow the pattern already established (removing `as any` casts)
- Test with real data to ensure proper error handling
- Consider mobile responsiveness for admin UI

---

## Current Status

✅ **Completed**:

- Video moderation system (backend)
- User flagging system (backend)
- TikTok-style thresholds (backend)
- Strike system (backend)
- Admin API endpoints (backend)
- TypeScript cleanup (frontend schemas)

⏳ **In Progress**:

- None

📋 **Todo**:

- Admin UI (frontend)
- Strike system UI (frontend)
- Video moderation status UI (frontend)
- Integration testing
- Documentation
- **Code refactoring** (after core features - see below)

---

## 🔧 Code Refactoring Tasks (After Core Features)

### 1. **Consolidate Ban Logic** 🔴 High Priority

**Location**: `backend/services/` or `backend/utils/`

**Issue**: Ban logic is duplicated across multiple files:

- `backend/routes.ts` (lines 711-714, 772-775)
- `backend/routes/upload-surgical.ts` (lines ~110-120)
- `backend/services/userFlaggingSystem.ts` (executeBan function)
- `backend/services/videoModeration.ts` (ban on critical violations)

**Refactoring**:

- Create `backend/services/userBanService.ts`
- Centralize ban logic: `banUser(userId, reason, severity, autoScanRelated = true)`
- Include automatic related user scanning
- Standardize ban messages and moderation logs
- Return consistent ban result object

**Files to Create**:

- `backend/services/userBanService.ts` - Centralized ban service

**Files to Refactor**:

- `backend/routes.ts` - Replace ban logic with service call
- `backend/routes/upload-surgical.ts` - Replace ban logic with service call
- `backend/services/userFlaggingSystem.ts` - Use centralized service
- `backend/services/videoModeration.ts` - Use centralized service

---

### 2. **Extract Moderation Result Types** 🟡 Medium Priority

**Location**: `shared/types/moderation.ts`

**Issue**: Moderation result types are scattered:

- `backend/services/videoModeration.ts` - `VideoModerationResult`
- `frontend/src/services/moderationService.ts` - `ModerationResult`
- `backend/ai/vertex-moderation.ts` - `ModerationResult`
- `backend/v3-swarm.ts` - `V3ModResult`

**Refactoring**:

- Create unified `ModerationResult` type in `shared/types/moderation.ts`
- Standardize severity levels: `"safe" | "low" | "medium" | "high" | "critical"`
- Standardize actions: `"allow" | "flag" | "review" | "ban" | "shadowban"`
- Create type adapters for different moderation services
- Export from shared for use across frontend/backend

**Files to Create**:

- `shared/types/moderation.ts` - Unified moderation types

**Files to Refactor**:

- `backend/services/videoModeration.ts` - Use shared types
- `frontend/src/services/moderationService.ts` - Use shared types
- `backend/ai/vertex-moderation.ts` - Use shared types
- `backend/v3-swarm.ts` - Use shared types

---

### 3. **Standardize API Response Format** 🟡 Medium Priority

**Location**: `backend/utils/` or `backend/middleware/`

**Issue**: API responses have inconsistent formats:

- Some return `{ success: true, data: ... }`
- Some return `{ error: "..." }`
- Some return raw data
- Inconsistent error handling

**Refactoring**:

- Create `backend/utils/apiResponse.ts` with standardized response helpers:
  - `successResponse(data, message?)`
  - `errorResponse(error, statusCode?)`
  - `paginatedResponse(data, page, limit, total)`
- Create Express middleware for consistent error handling
- Update all routes to use standardized responses

**Files to Create**:

- `backend/utils/apiResponse.ts` - Response helpers
- `backend/middleware/errorHandler.ts` - Error handling middleware

**Files to Refactor**:

- `backend/routes/user-flagging.ts` - Use standardized responses
- `backend/routes/moderation.ts` - Use standardized responses
- All other route files - Gradually migrate

---

### 4. **Consolidate Relationship Analysis** 🟡 Medium Priority

**Location**: `backend/services/userRelationshipAnalyzer.ts`

**Issue**: Relationship strength calculation is duplicated:

- `calculateRelationshipStrength()` function
- Similar logic in `analyzeUserRelationships()`
- Risk score calculation could be extracted

**Refactoring**:

- Extract `calculateRelationshipStrength()` into separate utility
- Extract `calculateRiskScore()` into separate utility
- Create `RelationshipAnalyzer` class for better organization
- Cache relationship analysis results (avoid re-analyzing same users)

**Files to Refactor**:

- `backend/services/userRelationshipAnalyzer.ts` - Extract utilities, add caching

---

### 5. **Extract Configuration Management** 🟢 Low Priority

**Location**: `backend/config/`

**Issue**: Configuration scattered:

- Environment variables accessed directly
- Hard-coded thresholds in multiple files
- No centralized config validation

**Refactoring**:

- Create `backend/config/moderation.ts` - Moderation thresholds
- Create `backend/config/flagging.ts` - Flagging rules
- Create `backend/config/strikes.ts` - Strike system config
- Validate config on startup
- Type-safe config access

**Files to Create**:

- `backend/config/moderation.ts` - Moderation config
- `backend/config/flagging.ts` - Flagging config
- `backend/config/strikes.ts` - Strike config
- `backend/config/index.ts` - Config validator

**Files to Refactor**:

- `backend/services/userFlaggingSystem.ts` - Use config
- `backend/services/tiktokStrikeSystem.ts` - Use config
- `backend/services/videoModeration.ts` - Use config

---

### 6. **Improve Error Handling Patterns** 🟡 Medium Priority

**Location**: `backend/utils/` or `backend/middleware/`

**Issue**: Inconsistent error handling:

- Some use try/catch with console.error
- Some use logger
- Some return errors, some throw
- No standardized error types

**Refactoring**:

- Create custom error classes: `ModerationError`, `FlaggingError`, `StrikeError`
- Create error handler middleware
- Standardize error logging
- Add error context (userId, action, etc.)

**Files to Create**:

- `backend/utils/errors.ts` - Custom error classes
- `backend/middleware/errorHandler.ts` - Error handling middleware

**Files to Refactor**:

- All service files - Use custom errors
- All route files - Use error middleware

---

### 7. **Extract Constants and Enums** 🟢 Low Priority

**Location**: `shared/constants/` or `shared/enums/`

**Issue**: Magic strings and numbers scattered:

- Severity levels: `"low" | "medium" | "high" | "critical"`
- Actions: `"ban" | "flag" | "review"`
- Strike types: `"warning" | "feature_specific" | ...`
- Threshold values: `30`, `40`, `50`, etc.

**Refactoring**:

- Create `shared/enums/moderation.ts` - Moderation enums
- Create `shared/enums/flagging.ts` - Flagging enums
- Create `shared/constants/thresholds.ts` - Threshold constants
- Replace magic strings/numbers with constants

**Files to Create**:

- `shared/enums/moderation.ts` - Moderation enums
- `shared/enums/flagging.ts` - Flagging enums
- `shared/constants/thresholds.ts` - Threshold constants

**Files to Refactor**:

- All service files - Use enums/constants
- All route files - Use enums/constants

---

## Refactoring Priority Order

1. **Consolidate Ban Logic** (High) - Reduces duplication, improves maintainability
2. **Standardize API Response Format** (Medium) - Improves consistency
3. **Extract Moderation Result Types** (Medium) - Improves type safety
4. **Consolidate Relationship Analysis** (Medium) - Reduces duplication
5. **Improve Error Handling Patterns** (Medium) - Better debugging
6. **Extract Configuration Management** (Low) - Easier configuration
7. **Extract Constants and Enums** (Low) - Better maintainability
