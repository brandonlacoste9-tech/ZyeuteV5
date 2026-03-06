# Design Document: TikTok-Style Video Playback

## Overview

The TikTok-style video playback system is a comprehensive solution for delivering video content with adaptive bitrate streaming, intelligent fallback strategies, and robust error handling. The system bridges the backend video infrastructure with the frontend VideoPlayer component, ensuring seamless playback across diverse network conditions and device capabilities.

### Key Design Goals

1. **Reliability**: Multiple fallback strategies ensure videos play even when primary delivery mechanisms fail
2. **Performance**: Adaptive bitrate streaming and intelligent prefetching optimize for user experience
3. **Maintainability**: Clear separation of concerns between data retrieval, URL resolution, and playback
4. **Observability**: Comprehensive logging and metrics enable debugging and performance monitoring
5. **Scalability**: Efficient caching and resource management support high-volume concurrent playback

### System Scope

The system encompasses:

- Database schema alignment for video metadata storage
- API endpoints for video data retrieval with complete metadata
- URL resolution engine with intelligent fallback strategy
- HLS streaming with adaptive bitrate delivery
- Media Source Extensions (MSE) for chunked delivery
- Continuous feed playback with auto-play and prefetching
- Error handling with exponential backoff and stall recovery
- Performance optimization through caching and lazy loading
- Comprehensive monitoring and observability

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  VideoPlayer Component (React)                           │   │
│  │  - Playback controls, progress bar, fullscreen           │   │
│  │  - HLS.js integration for adaptive streaming             │   │
│  │  - MSE pipeline for chunked delivery                     │   │
│  │  - Error handling and recovery                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ▲                                    │
│                              │ Video metadata + URLs              │
└──────────────────────────────┼────────────────────────────────────┘
                               │
┌──────────────────────────────┼────────────────────────────────────┐
│                        API Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Feed Endpoints                                          │   │
│  │  - GET /api/feed (paginated, filtered)                   │   │
│  │  - GET /api/videos/:id (single video)                    │   │
│  │  - Metadata caching (5 min TTL)                          │   │
│  │  - Request deduplication                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ▲                                    │
│                              │ Publications data                  │
└──────────────────────────────┼────────────────────────────────────┘
                               │
┌──────────────────────────────┼────────────────────────────────────┐
│                      Backend Layer                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Database (Publications Table)                           │   │
│  │  - media_url, hls_url, enhanced_url, original_url        │   │
│  │  - mux_playback_id, processing_status                    │   │
│  │  - thumbnail_url, duration, aspect_ratio                 │   │
│  │  - Indexes: (user_id, created_at), (region_id, ...)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  External Services                                       │   │
│  │  - Mux (HLS streaming, playback IDs)                     │   │
│  │  - Media Proxy (URL optimization)                        │   │
│  │  - Telemetry Service (metrics aggregation)               │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Requests Feed
        │
        ▼
API Endpoint (with filters: hive_id, processing_status)
        │
        ▼
Query Publications Table (with indexes)
        │
        ▼
Apply Visibility/Moderation Filters
        │
        ▼
Return Video Metadata (all URL variants)
        │
        ▼
Frontend Receives Response
        │
        ▼
VideoPlayer Component
        │
        ├─► URL Resolution Engine
        │   ├─► Check hls_url (preferred)
        │   ├─► Fallback to enhanced_url
        │   ├─► Fallback to media_url
        │   └─► Fallback to original_url
        │
        ├─► Playback Strategy Selection
        │   ├─► HLS.js (if hls_url available)
        │   ├─► MSE Pipeline (if chunks available)
        │   └─► Direct URL (fallback)
        │
        └─► Playback with Error Handling
            ├─► Monitor for stalls (>8s)
            ├─► Exponential backoff retry (1s, 2s, 4s)
            └─► Fallback to next URL variant
```

### Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                    VideoPlayer Component                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  URL Resolution Engine                               │  │
│  │  - Selects best available URL based on priority      │  │
│  │  - Validates URL format and type                     │  │
│  │  - Handles external URLs via media_proxy             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Playback Strategy Selector                          │  │
│  │  - Determines HLS vs MSE vs Direct URL               │  │
│  │  - Checks browser capabilities                       │  │
│  │  - Selects fallback strategy                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  HLS.js      │ │  MSE         │ │  Direct URL  │        │
│  │  Pipeline    │ │  Pipeline    │ │  Playback    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│          │               │               │                  │
│          └───────────────┼───────────────┘                  │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Error Handler & Recovery                            │  │
│  │  - Monitors playback health                          │  │
│  │  - Detects stalls and timeouts                       │  │
│  │  - Triggers recovery mechanisms                      │  │
│  │  - Logs metrics and errors                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HTML5 Video Element                                 │  │
│  │  - Renders video with controls                       │  │
│  │  - Manages playback state                            │  │
│  │  - Handles user interactions                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### 1. URL Resolution Engine

**Purpose**: Intelligently select the best available video URL based on availability, network conditions, and device capabilities.

**Interface**:

```typescript
interface VideoURLs {
  hls_url?: string; // Mux HLS manifest (preferred)
  enhanced_url?: string; // Upscaled version
  media_url?: string; // Original processed version
  original_url?: string; // Original upload
  mux_playback_id?: string; // Mux playback ID
}

interface ResolvedVideoSource {
  url: string;
  type: "hls" | "mse" | "direct";
  mimeType?: string;
  requiresProxy: boolean;
}

function resolveVideoURL(
  urls: VideoURLs,
  processingStatus: string,
  networkCondition?: "fast" | "slow" | "offline",
): ResolvedVideoSource;
```

**Resolution Priority**:

1. If `processing_status === 'completed'` and `hls_url` exists → use HLS
2. Else if `enhanced_url` exists → use enhanced URL
3. Else if `media_url` exists → use media URL
4. Else if `original_url` exists → use original URL
5. Else → error state

**Validation Rules**:

- URL must be valid HTTP(S) or relative path
- URL must point to video content (not image)
- External URLs routed through media_proxy
- Mux URLs use playback ID for direct streaming

### 2. HLS Streaming Pipeline

**Purpose**: Deliver adaptive bitrate video using HTTP Live Streaming protocol.

**Configuration**:

```typescript
interface HLSConfig {
  backBuffer: number; // 90 seconds
  maxBufferLength: number; // 30 seconds
  maxBufferSize: number; // 60MB
  enableWorker: boolean; // true
  capLevelOnFPSDrop: boolean; // true
  levelCapping: number; // based on player size
  autoStartLoad: boolean; // true
  startLevel: number; // auto-select
}
```

**Behavior**:

- Automatically adjusts quality based on network bandwidth
- Maintains 90-second back buffer for smooth playback
- Uses worker threads for manifest parsing
- Caps video level to player dimensions
- Handles manifest updates for long-duration videos
- Falls back to direct URL on fatal errors

### 3. MSE (Media Source Extensions) Pipeline

**Purpose**: Support chunked video delivery for advanced playback control.

**Interface**:

```typescript
interface VideoChunk {
  data: ArrayBuffer;
  mimeType: string;
  startTime: number;
  endTime: number;
}

interface MSEConfig {
  bufferMode: "sequence" | "segments";
  maxBufferSize: number; // 60MB
  keepBehindPlayhead: number; // 30 seconds
}
```

**Behavior**:

- Appends chunks sequentially as they arrive
- Clears played content when buffer quota reached
- Validates MIME type support before creating SourceBuffer
- Processes pending chunks asynchronously
- Calls `endOfStream()` when all chunks appended
- Falls back to direct URL if MSE fails

### 4. Error Handler and Recovery

**Purpose**: Detect and recover from playback failures with exponential backoff.

**Error Types**:

```typescript
enum PlaybackError {
  NETWORK_ERROR = "network_error",
  TIMEOUT = "timeout",
  STALL = "stall",
  UNSUPPORTED_FORMAT = "unsupported_format",
  PROCESSING_FAILED = "processing_failed",
  UNKNOWN = "unknown",
}

interface RecoveryStrategy {
  type: "retry" | "fallback" | "skip";
  backoffMs: number;
  maxAttempts: number;
}
```

**Recovery Mechanisms**:

1. **Stall Recovery** (>8s stall):
   - Nudge playback position forward by 1 second
   - If nudge fails, reload video
   - Log stall event with duration

2. **Timeout Recovery** (>15s loading):
   - Trigger exponential backoff retry (1s, 2s, 4s)
   - After 3 retries, attempt URL fallback
   - If all URLs fail, display permanent error

3. **Fallback Strategy**:
   - HLS → enhanced_url → media_url → original_url
   - Each fallback resets retry counter
   - Log fallback event for monitoring

### 5. Continuous Feed Manager

**Purpose**: Manage auto-play, prefetching, and resource cleanup for TikTok-style feed.

**Behavior**:

- Auto-play when video enters viewport
- Pause when video leaves viewport
- Prefetch next video at 70% progress
- Cancel prefetch if user scrolls past video
- Limit concurrent loads to prevent resource exhaustion
- Prioritize current video over prefetch videos
- Clear buffer from memory when scrolled past

**Prefetch Strategy**:

```typescript
interface PrefetchConfig {
  triggerThreshold: number; // 70% progress
  maxConcurrentLoads: number; // 2
  priorityBoost: number; // 2x for current video
  cancelOnScroll: boolean; // true
}
```

### 6. Metadata Parser and Serializer

**Purpose**: Parse and serialize video metadata with validation.

**Interface**:

```typescript
interface VideoMetadata {
  id: string;
  media_url?: string;
  hls_url?: string;
  enhanced_url?: string;
  original_url?: string;
  mux_playback_id?: string;
  processing_status: "pending" | "processing" | "completed" | "failed";
  thumbnail_url?: string;
  duration?: number;
  aspect_ratio?: string;
  user_id: string;
  created_at: string;
}

function parseVideoMetadata(data: unknown): VideoMetadata;
function serializeVideoMetadata(metadata: VideoMetadata): string;
```

**Validation Rules**:

- `processing_status` must be one of: pending, processing, completed, failed
- `aspect_ratio` must match format "W:H" (e.g., "9:16")
- URLs must be valid HTTP(S) or relative paths
- `duration` must be positive integer
- At least one URL variant must be available
- Handle both snake_case (database) and camelCase (frontend)

---

## Data Models

### Publications Table Schema

```sql
CREATE TABLE publications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,

  -- Video URLs (multiple variants for fallback)
  media_url VARCHAR(2048),           -- Original processed version
  hls_url VARCHAR(2048),             -- Mux HLS manifest (preferred)
  enhanced_url VARCHAR(2048),        -- Upscaled version
  original_url VARCHAR(2048),        -- Original upload

  -- Mux Integration
  mux_playback_id VARCHAR(255),      -- Mux playback ID for direct streaming

  -- Processing Pipeline
  processing_status VARCHAR(50),     -- pending, processing, completed, failed
  processing_error TEXT,             -- Error details if failed

  -- Video Metadata
  thumbnail_url VARCHAR(2048),       -- Representative frame
  duration INTEGER,                  -- Duration in seconds
  aspect_ratio VARCHAR(10),          -- Format: "9:16"

  -- Content Metadata
  title VARCHAR(500),
  description TEXT,
  hive_id VARCHAR(50),               -- Regional content (quebec, montreal, etc.)

  -- Engagement Metrics
  fire_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Remix Support
  remix_type VARCHAR(50),            -- duet, stitch, react
  original_post_id UUID,             -- Reference to original post

  -- Ephemeral Content
  max_views INTEGER,                 -- Max view count before expiration

  -- Visibility
  is_hidden BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for efficient queries
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_region_created (hive_id, created_at),
  INDEX idx_processing_status (processing_status),
  INDEX idx_viral_score (fire_count DESC, created_at DESC)
);
```

### API Response Models

**Feed Response**:

```typescript
interface FeedResponse {
  videos: VideoMetadata[];
  pagination: {
    cursor?: string;
    offset?: number;
    limit: number;
    hasMore: boolean;
  };
  metadata: {
    totalCount: number;
    generatedAt: string;
  };
}
```

**Single Video Response**:

```typescript
interface VideoResponse {
  video: VideoMetadata;
  relatedVideos?: VideoMetadata[];
  metadata: {
    generatedAt: string;
  };
}
```

### Frontend Video State

```typescript
interface VideoPlaybackState {
  videoId: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  error?: PlaybackError;
  metrics: {
    ttff: number; // Time to first frame (ms)
    stallCount: number;
    totalStallDuration: number;
    bufferReadyTime: number;
    sourceType: "hls" | "mse" | "direct";
  };
}
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Acceptance Criteria Testing Prework

Based on the acceptance criteria analysis, the following properties are testable and should be verified through property-based testing:

### Property Reflection and Consolidation

After analyzing all acceptance criteria, I've identified several redundant or overlapping properties that can be consolidated:

**Consolidation Examples:**

- URL fallback properties (3.1-3.4) can be combined into a single "URL resolution priority" property
- Processing status properties (1.9-1.11) can be combined into a "processing status lifecycle" property
- API response properties (2.1-2.10) can be combined into a "complete metadata response" property
- Metrics tracking properties (8.4-8.6, 13.2-13.4) can be combined into a "metrics collection" property
- Caching properties (12.1-12.5) can be combined into a "cache lifecycle" property

This consolidation reduces redundancy while maintaining comprehensive coverage.

---

## Correctness Properties

### Property 1: URL Resolution Priority

_For any_ video with multiple URL variants available, the URL resolution engine should select URLs in priority order: hls_url (if completed) → enhanced_url → media_url → original_url, ensuring the highest-quality available source is selected.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 2: Processing Status Lifecycle

_For any_ video, the processing_status should follow a valid state transition: pending → processing → completed (or failed), and all associated metadata fields should be populated according to the status (e.g., hls_url populated only when status is completed).

**Validates: Requirements 1.9, 1.10, 1.11**

### Property 3: Complete API Metadata Response

_For any_ video returned by the API, the response should include all required fields: media_url, hls_url, enhanced_url, original_url, mux_playback_id, processing_status, thumbnail_url, duration, aspect_ratio, and at least one URL variant should be available for playback.

**Validates: Requirements 2.1, 2.2, 2.6, 2.7, 2.8, 2.9, 2.10**

### Property 4: Fallback URL Availability

_For any_ video in the system, at least one URL variant (hls_url, enhanced_url, media_url, or original_url) must be available and valid, ensuring playback is always possible.

**Validates: Requirements 3.5, 14.12**

### Property 5: External URL Proxy Routing

_For any_ video URL pointing to an external domain (not the primary CDN), the system should route it through media_proxy for optimization and security.

**Validates: Requirements 3.6**

### Property 6: Mux Playback ID Usage

_For any_ video with a mux_playback_id present, the system should use the Mux playback ID for direct streaming instead of constructing URLs manually.

**Validates: Requirements 3.7**

### Property 7: Video URL Validation

_For any_ selected video URL, the system should validate that it points to video content (not image) and supports the required MIME type before initiating playback.

**Validates: Requirements 3.8, 3.9, 3.10**

### Property 8: Exponential Backoff Retry

_For any_ failed video load, the system should retry with exponential backoff intervals (1s, 2s, 4s) and attempt URL fallback after each retry exhaustion, ensuring robust recovery.

**Validates: Requirements 3.11, 7.7**

### Property 9: HLS Adaptive Bitrate

_For any_ video with hls_url available, the HLS.js player should automatically adjust video quality based on network bandwidth changes, maintaining smooth playback across varying connection speeds.

**Validates: Requirements 4.1, 4.3, 4.4**

### Property 10: HLS Configuration

_For any_ HLS stream, the configuration should maintain a 90-second back buffer, enable worker threads for manifest parsing, and cap video level to player dimensions for efficiency.

**Validates: Requirements 4.5, 4.6, 4.7**

### Property 11: MSE Chunk Sequencing

_For any_ video using Media Source Extensions, chunks should be appended sequentially as they arrive, and when SourceBuffer quota is reached, played content should be cleared while maintaining 30 seconds behind the playhead.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 12: MSE MIME Type Validation

_For any_ video source with chunks, the system should validate MIME type support before creating SourceBuffer, and fall back to direct URL playback if the MIME type is not supported.

**Validates: Requirements 5.6, 5.7**

### Property 13: Continuous Feed Viewport Playback

_For any_ video in a continuous feed, playback should automatically start when the video enters the viewport and pause when it leaves, ensuring seamless TikTok-style viewing.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 14: Prefetch Trigger at 70% Progress

_For any_ video in a continuous feed at 70% progress, the system should trigger prefetch of the next video, and cancel prefetch if the user scrolls past the video before it completes.

**Validates: Requirements 6.5, 6.9**

### Property 15: Concurrent Load Limiting

_For any_ continuous feed, the system should limit concurrent video loads to prevent resource exhaustion and prioritize loading the current video over prefetch videos.

**Validates: Requirements 6.7, 6.8**

### Property 16: Stall Detection and Recovery

_For any_ video that stalls for more than 8 seconds, the system should attempt stall recovery by nudging the playback position forward, and if nudge fails, reload the video.

**Validates: Requirements 7.4, 7.5, 7.6**

### Property 17: Error Logging and Metrics

_For any_ playback error, the system should log the error with timestamp and video URL, track error metrics (TTFF, stall count, stall duration), and send metrics to telemetry service.

**Validates: Requirements 7.9, 7.10, 13.1, 13.5, 13.6, 13.7, 13.8, 13.10**

### Property 18: Performance Optimization Prioritization

_For any_ video, the system should apply appropriate fetch priority (high for prioritized videos, low for others), preload strategy (auto for prioritized, metadata for others), and measure Time To First Frame for all videos.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.8, 8.9**

### Property 19: Metadata Rendering with Defaults

_For any_ video rendered in the UI, the system should use aspect_ratio for container dimensions (defaulting to 9:16 if unavailable), use thumbnail_url as poster (defaulting to placeholder if unavailable), and use duration for progress bar calculations.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 20: Playback Control State Synchronization

_For any_ user interaction with playback controls (play/pause, mute, volume, seek, fullscreen, speed), the system should update the video element state and UI display to reflect the change.

**Validates: Requirements 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.11**

### Property 21: Backend Data Flow Filtering and Sorting

_For any_ feed request, the backend should query the publications table with all video fields, apply filters (processing_status, visibility, moderation, hive_id), and sort by the appropriate criteria (created_at for feed, viral_score for trending, distance for nearby).

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8**

### Property 22: Cache Lifecycle Management

_For any_ cached video metadata, the system should maintain a 5-minute TTL, invalidate cache when video is updated or processing completes, and implement LRU eviction for memory-constrained environments.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.8**

### Property 23: Cache-Busting for Retries

_For any_ retry scenario, the system should implement cache-busting tokens to ensure fresh data is fetched, and track cache hit/miss rates for monitoring.

**Validates: Requirements 12.6, 12.7**

### Property 24: Buffer Memory Management

_For any_ video scrolled past in a continuous feed, the system should clear its buffer from memory, and maintain playhead position for seek stability (30 seconds behind playhead).

**Validates: Requirements 12.9, 12.10**

### Property 25: Video Metadata Parser Validation

_For any_ video metadata parsed from the database, the parser should validate all required fields, handle missing optional fields gracefully, and validate enum values (processing_status), format (aspect_ratio), and types (duration as positive integer).

**Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.6**

### Property 26: URL Parsing and Validation

_For any_ URL in video metadata, the parser should validate it is a valid HTTP(S) URL or relative path, and preserve query parameters and fragments during serialization.

**Validates: Requirements 14.5, 14.8**

### Property 27: Metadata Round-Trip Serialization

_For any_ valid video metadata object, parsing then serializing then parsing should produce an equivalent object, ensuring data integrity through the serialization cycle.

**Validates: Requirements 14.9**

### Property 28: Field Name Normalization

_For any_ video metadata, the parser should handle both snake_case (database) and camelCase (frontend) field names, normalizing them appropriately for the target context.

**Validates: Requirements 14.11**

### Property 29: Parser Error Messages

_For any_ invalid video metadata, the parser should return descriptive error messages that identify the specific validation failure and the field that caused it.

**Validates: Requirements 14.10**

---

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeout (>15s)
   - DNS resolution failure
   - HTTP error responses (4xx, 5xx)
   - Partial content delivery

2. **Playback Errors**
   - Unsupported video format
   - Codec not available
   - Media source extension failure
   - HLS manifest parsing error

3. **Data Errors**
   - Missing required metadata fields
   - Invalid URL format
   - Corrupted video chunks
   - Processing pipeline failure

4. **Resource Errors**
   - Memory exhaustion
   - Buffer quota exceeded
   - Concurrent load limit reached

### Recovery Strategies

**Tier 1: Automatic Recovery**

- Stall recovery: nudge playback position forward
- Exponential backoff retry: 1s, 2s, 4s intervals
- URL fallback: try next available URL variant
- MSE fallback: switch to direct URL playback

**Tier 2: User-Initiated Recovery**

- Manual retry button
- Page refresh
- Feed scroll to next video

**Tier 3: Graceful Degradation**

- Display error message with clear explanation
- Show placeholder or thumbnail
- Provide manual retry option
- Log error for debugging

### Error Logging

All errors should be logged with:

- Timestamp
- Video ID and URL
- Error type and code
- Stack trace (if applicable)
- Network conditions (bandwidth, latency)
- Device information (browser, OS)
- User action that triggered error

---

## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests** (specific examples and edge cases):

- Database schema validation (column existence, types, indexes)
- API endpoint response structure and pagination
- Error state UI rendering
- Playback control interactions
- Cache invalidation on video update
- Parser error messages for invalid input

**Property-Based Tests** (universal properties across all inputs):

- URL resolution priority for all video states
- Processing status lifecycle for all videos
- Complete metadata response for all API calls
- Fallback URL availability for all videos
- Exponential backoff retry for all failures
- Adaptive bitrate adjustment for all bandwidth changes
- Viewport-based playback for all feed videos
- Prefetch triggering at 70% progress for all videos
- Stall detection and recovery for all stalls >8s
- Metadata round-trip serialization for all valid objects

### Property-Based Testing Configuration

**Testing Library**: Use language-appropriate PBT library

- JavaScript/TypeScript: fast-check
- Python: Hypothesis
- Java: QuickCheck or jqwik
- Go: gopter

**Test Configuration**:

- Minimum 100 iterations per property test
- Custom generators for video metadata, URLs, and network conditions
- Shrinking enabled for failure analysis
- Timeout: 30 seconds per test

**Test Tagging**:
Each property test must include a comment referencing the design property:

```
// Feature: tiktok-video-playback, Property 1: URL Resolution Priority
// Validates: Requirements 3.1, 3.2, 3.3, 3.4
```

### Test Coverage Goals

- **Database Layer**: 100% schema validation
- **API Layer**: 100% response structure validation
- **URL Resolution**: 100% fallback path coverage
- **Playback**: 80% error recovery coverage
- **Metadata**: 100% parser validation coverage
- **Performance**: 90% metrics collection coverage

### Performance Testing

- Measure Time To First Frame (TTFF) for all videos
- Track buffer ready time and stall duration
- Monitor concurrent load limits
- Verify cache hit/miss rates
- Validate memory usage with LRU eviction

### Integration Testing

- End-to-end feed playback with multiple videos
- Rapid scrolling with prefetch cancellation
- Network condition changes during playback
- Error recovery with fallback URLs
- Cache invalidation on video update

---

## Monitoring and Observability

### Key Metrics

**Playback Metrics**:

- Time To First Frame (TTFF) - target <2s
- Stall count and duration - target 0 stalls
- Buffer ready time - target <1s
- Video source type distribution (HLS, MSE, URL)
- Fallback event frequency

**Error Metrics**:

- Error rate by type (network, playback, data, resource)
- Retry success rate - target >90%
- Recovery mechanism effectiveness
- Processing pipeline status distribution

**Performance Metrics**:

- API response time - target <500ms
- Cache hit rate - target >80%
- Concurrent load count
- Memory usage per video
- Feed scroll frame rate

**User Engagement**:

- View count and duration
- Skip rate
- Interaction rate (fire, comment, share)
- Remix creation rate

### Debug Overlay

When `debug=1` parameter is set, display:

- Current video URL and source type
- TTFF and stall metrics
- Buffer status and playhead position
- Network bandwidth estimate
- Cache hit/miss status
- Error log (last 10 errors)

### Alerting

Alert on:

- TTFF >5s (degradation)
- Error rate >5%
- Stall count >2 per video
- Processing pipeline failure rate >1%
- Cache hit rate <50%
