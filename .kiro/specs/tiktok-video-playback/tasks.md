# Implementation Plan: TikTok-Style Video Playback

## Overview

This implementation plan breaks down the TikTok-style video playback feature into discrete, testable tasks ordered by dependency. The approach prioritizes database schema alignment first (blocking all other work), then API endpoints, URL resolution, playback strategies, error handling, and finally monitoring. Each task includes property-based tests to validate correctness properties from the design document.

---

## Tasks

- [-] 1. Database Schema Alignment and Validation
  - [x] 1.1 Create/verify publications table schema with all required fields
    - Ensure table has: media_url, hls_url, enhanced_url, original_url, mux_playback_id, processing_status, thumbnail_url, duration, aspect_ratio
    - Create indexes: (user_id, created_at), (hive_id, created_at), (processing_status)
    - Verify column types and constraints
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.12, 1.13, 1.14_

  - [x]\* 1.2 Write property test for processing status lifecycle
    - **Property 2: Processing Status Lifecycle**
    - **Validates: Requirements 1.9, 1.10, 1.11**
    - Test that processing_status follows valid transitions: pending → processing → completed (or failed)
    - Test that metadata fields are populated according to status

  - [ ] 1.3 Create database migration script
    - Add any missing columns to publications table
    - Create indexes if they don't exist
    - Verify backward compatibility with existing data
    - _Requirements: 1.1, 1.12, 1.13, 1.14_

- [ ] 2. API Endpoints for Video Data Retrieval
  - [ ] 2.1 Implement GET /api/feed endpoint with complete metadata
    - Query publications table with all video fields
    - Apply filters: processing_status (exclude failed), visibility, moderation, hive_id
    - Support pagination (cursor-based or offset-based)
    - Return all URL variants and metadata
    - _Requirements: 2.1, 2.2, 2.6, 2.7, 2.8, 2.9, 2.10, 2.12, 2.13, 2.14, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]\* 2.2 Write property test for complete API metadata response
    - **Property 3: Complete API Metadata Response**
    - **Validates: Requirements 2.1, 2.2, 2.6, 2.7, 2.8, 2.9, 2.10**
    - Test that all required fields are present in response
    - Test that at least one URL variant is available

  - [ ] 2.3 Implement GET /api/videos/:id endpoint
    - Return single video with complete metadata
    - Include all URL variants and processing status
    - Support optional related videos
    - _Requirements: 2.2, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]\* 2.4 Write unit tests for API response structure
    - Test pagination structure and cursor handling
    - Test filtering by hive_id and processing_status
    - Test error responses for invalid requests
    - _Requirements: 2.12, 2.13, 2.14_

  - [ ] 2.5 Implement metadata caching with 5-minute TTL
    - Cache feed and single video responses
    - Implement cache invalidation on video update
    - Implement request deduplication for concurrent identical requests
    - _Requirements: 8.11, 8.12, 12.1, 12.2, 12.3_

  - [ ]\* 2.6 Write property test for cache lifecycle
    - **Property 22: Cache Lifecycle Management**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.8**
    - Test that cached entries expire after 5 minutes
    - Test that cache is invalidated on video update

- [ ] 3. Video Metadata Parser and Serializer
  - [ ] 3.1 Implement metadata parser with validation
    - Parse video metadata from database (snake_case)
    - Validate all required fields present
    - Validate enum values (processing_status)
    - Validate format (aspect_ratio as "W:H")
    - Validate types (duration as positive integer)
    - Handle missing optional fields gracefully
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6_

  - [ ]\* 3.2 Write property test for metadata parser validation
    - **Property 25: Video Metadata Parser Validation**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.6**
    - Test parser with valid metadata
    - Test parser with missing optional fields
    - Test parser with invalid enum values

  - [ ] 3.3 Implement metadata serializer
    - Serialize metadata to JSON for API responses
    - Normalize field names (snake_case to camelCase for frontend)
    - Preserve query parameters and fragments in URLs
    - _Requirements: 14.7, 14.8, 14.11_

  - [ ]\* 3.4 Write property test for round-trip serialization
    - **Property 27: Metadata Round-Trip Serialization**
    - **Validates: Requirements 14.9**
    - Test that parse(serialize(metadata)) == metadata for all valid objects

  - [ ]\* 3.5 Write unit tests for parser error messages
    - Test descriptive error messages for invalid input
    - Test field name normalization (snake_case/camelCase)
    - _Requirements: 14.10, 14.11_

- [ ] 4. URL Resolution Engine
  - [ ] 4.1 Implement URL resolution with priority fallback
    - Select hls_url if available and processing_status is "completed"
    - Fallback to enhanced_url if hls_url unavailable
    - Fallback to media_url if enhanced_url unavailable
    - Fallback to original_url if media_url unavailable
    - Return error if all URLs unavailable
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]\* 4.2 Write property test for URL resolution priority
    - **Property 1: URL Resolution Priority**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Test resolution with all URL variants available
    - Test resolution with partial URL variants
    - Test resolution with no URLs available

  - [ ] 4.3 Implement URL validation and type detection
    - Validate URL is valid HTTP(S) or relative path
    - Detect if URL points to video content
    - Support URLs with query parameters and cache-busting tokens
    - _Requirements: 3.8, 3.9, 3.10_

  - [ ]\* 4.4 Write property test for URL validation
    - **Property 7: Video URL Validation**
    - **Validates: Requirements 3.8, 3.9, 3.10**
    - Test validation with valid URLs
    - Test validation with invalid URLs

  - [ ] 4.5 Implement external URL proxy routing
    - Route external URLs through media_proxy
    - Detect external domains vs primary CDN
    - Preserve URL parameters through proxy
    - _Requirements: 3.6_

  - [ ]\* 4.6 Write property test for external URL proxy routing
    - **Property 5: External URL Proxy Routing**
    - **Validates: Requirements 3.6**
    - Test that external URLs are routed through proxy
    - Test that CDN URLs bypass proxy

  - [ ] 4.7 Implement Mux playback ID handling
    - Use Mux playback ID for direct streaming when available
    - Construct Mux HLS URL from playback ID
    - Fallback to hls_url if playback ID unavailable
    - _Requirements: 3.7_

  - [ ]\* 4.8 Write property test for Mux playback ID usage
    - **Property 6: Mux Playback ID Usage**
    - **Validates: Requirements 3.7**
    - Test that playback ID is used when available
    - Test fallback to hls_url when playback ID unavailable

- [ ] 5. HLS Streaming Pipeline
  - [ ] 5.1 Implement HLS.js integration
    - Initialize HLS.js with configuration (90s back buffer, 30s max buffer, worker threads)
    - Attach to video element
    - Handle manifest loading and parsing
    - _Requirements: 4.1, 4.5, 4.6, 4.7_

  - [ ]\* 5.2 Write property test for HLS adaptive bitrate
    - **Property 9: HLS Adaptive Bitrate**
    - **Validates: Requirements 4.1, 4.3, 4.4**
    - Test that quality adjusts based on bandwidth changes
    - Test that playback remains smooth during quality transitions

  - [ ] 5.3 Implement HLS error handling and fallback
    - Detect HLS fatal errors
    - Log error with details
    - Trigger fallback to direct URL playback
    - _Requirements: 4.8_

  - [ ]\* 5.4 Write unit tests for HLS configuration
    - Test back buffer size (90 seconds)
    - Test max buffer length (30 seconds)
    - Test worker thread enablement
    - Test level capping to player size
    - _Requirements: 4.5, 4.6, 4.7_

  - [ ] 5.5 Implement HLS manifest update handling
    - Handle manifest updates for long-duration videos
    - Update playlist as new segments become available
    - _Requirements: 4.9_

  - [ ] 5.6 Implement fallback to native HLS (Safari)
    - Detect HLS.js support
    - Use native HLS support if HLS.js unavailable
    - _Requirements: 4.2_

- [ ] 6. Media Source Extensions (MSE) Pipeline
  - [ ] 6.1 Implement MSE chunk sequencing
    - Create SourceBuffer for video MIME type
    - Append chunks sequentially as they arrive
    - Handle updateend events to process queued chunks
    - _Requirements: 5.1, 5.2, 5.10_

  - [ ]\* 6.2 Write property test for MSE chunk sequencing
    - **Property 11: MSE Chunk Sequencing**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Test that chunks are appended in order
    - Test that buffer quota is managed correctly

  - [ ] 6.3 Implement buffer quota management
    - Monitor SourceBuffer size
    - Clear played content when quota reached (keep 30s behind playhead)
    - Maintain smooth playback during clearing
    - _Requirements: 5.3_

  - [ ]\* 6.4 Write unit tests for buffer management
    - Test buffer clearing when quota exceeded
    - Test playhead position maintenance
    - _Requirements: 5.3_

  - [ ] 6.5 Implement MIME type validation
    - Validate MIME type support before creating SourceBuffer
    - Fallback to direct URL if MIME type not supported
    - _Requirements: 5.6, 5.7_

  - [ ]\* 6.6 Write property test for MIME type validation
    - **Property 12: MSE MIME Type Validation**
    - **Validates: Requirements 5.6, 5.7**
    - Test validation with supported MIME types
    - Test fallback with unsupported MIME types

  - [ ] 6.7 Implement MSE error handling
    - Detect MSE errors (quota exceeded, append error)
    - Log error details
    - Fallback to direct URL playback
    - _Requirements: 5.4_

  - [ ] 6.8 Implement endOfStream signaling
    - Call endOfStream() when all chunks appended
    - Handle endOfStream errors gracefully
    - _Requirements: 5.9_

- [ ] 7. Continuous Feed Playback Manager
  - [ ] 7.1 Implement viewport-based auto-play
    - Detect when video enters viewport (Intersection Observer)
    - Auto-start playback when video visible
    - Pause playback when video leaves viewport
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 7.2 Write property test for viewport playback
    - **Property 13: Continuous Feed Viewport Playback**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - Test auto-play on viewport entry
    - Test pause on viewport exit
    - Test smooth transitions between videos

  - [ ] 7.3 Implement prefetch trigger at 70% progress
    - Monitor video progress
    - Trigger prefetch of next video at 70% progress
    - Cancel prefetch if user scrolls past video
    - _Requirements: 6.5, 6.9_

  - [ ]\* 7.4 Write property test for prefetch triggering
    - **Property 14: Prefetch Trigger at 70% Progress**
    - **Validates: Requirements 6.5, 6.9**
    - Test prefetch triggered at 70% progress
    - Test prefetch cancelled on rapid scroll

  - [ ] 7.5 Implement concurrent load limiting
    - Limit concurrent video loads to 2
    - Prioritize current video over prefetch videos
    - Queue additional loads
    - _Requirements: 6.7, 6.8_

  - [ ]\* 7.6 Write property test for concurrent load limiting
    - **Property 15: Concurrent Load Limiting**
    - **Validates: Requirements 6.7, 6.8**
    - Test that concurrent loads don't exceed limit
    - Test that current video is prioritized

  - [ ] 7.7 Implement buffer cleanup on scroll
    - Clear buffer from memory when video scrolled past
    - Maintain playhead position for seek stability
    - _Requirements: 12.9, 12.10_

  - [ ]\* 7.8 Write unit tests for feed playback
    - Test smooth scrolling without jank
    - Test user interaction tracking (view, skip, fire, comment)
    - _Requirements: 6.6, 6.10_

- [ ] 8. Error Handling and Recovery
  - [ ] 8.1 Implement stall detection and recovery
    - Monitor for stalls >8 seconds
    - Nudge playback position forward by 1 second
    - If nudge fails, reload video
    - Log stall event with duration
    - _Requirements: 7.4, 7.5, 7.6_

  - [ ]\* 8.2 Write property test for stall detection
    - **Property 16: Stall Detection and Recovery**
    - **Validates: Requirements 7.4, 7.5, 7.6**
    - Test stall detection at >8 seconds
    - Test recovery mechanisms (nudge, reload)

  - [ ] 8.3 Implement exponential backoff retry
    - Retry with intervals: 1s, 2s, 4s
    - Attempt URL fallback after each retry exhaustion
    - Reset retry counter on successful fallback
    - _Requirements: 3.11, 7.7_

  - [ ]\* 8.4 Write property test for exponential backoff
    - **Property 8: Exponential Backoff Retry**
    - **Validates: Requirements 3.11, 7.7**
    - Test retry intervals (1s, 2s, 4s)
    - Test URL fallback after retry exhaustion

  - [ ] 8.5 Implement timeout detection (>15s loading)
    - Detect when video loading exceeds 15 seconds
    - Trigger exponential backoff retry
    - _Requirements: 7.7_

  - [ ] 8.6 Implement error state UI
    - Display error message with clear explanation
    - Show "Retry" button for manual retry
    - Show "Refresh" button to reload page
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]\* 8.7 Write unit tests for error handling
    - Test error state rendering
    - Test retry button functionality
    - Test processing_status "failed" display
    - _Requirements: 7.1, 7.2, 7.3, 7.11, 7.12_

  - [ ] 8.8 Implement error logging
    - Log all errors with timestamp and video URL
    - Include error type, code, and stack trace
    - Include network conditions and device info
    - _Requirements: 7.9_

  - [ ]\* 8.9 Write unit tests for error logging
    - Test error log format and completeness
    - Test error categorization
    - _Requirements: 7.9_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Performance Optimization
  - [ ] 10.1 Implement fetch priority optimization
    - Use fetchPriority="high" for prioritized videos
    - Use fetchPriority="low" for non-prioritized videos
    - _Requirements: 8.1, 8.2_

  - [ ] 10.2 Implement preload strategy
    - Preload poster images for prioritized videos
    - Use preload="auto" for prioritized videos
    - Use preload="metadata" for non-prioritized videos
    - _Requirements: 8.3, 8.8, 8.9_

  - [ ] 10.3 Implement lazy loading for feed videos
    - Lazy load videos outside viewport
    - Reduce initial page load time
    - _Requirements: 8.10_

  - [ ] 10.4 Implement metrics collection
    - Measure Time To First Frame (TTFF) for all videos
    - Record buffer ready time
    - Track stall count and total stall duration
    - Track video source type (HLS, MSE, URL)
    - _Requirements: 8.4, 8.5, 8.6, 8.7_

  - [ ]\* 10.5 Write property test for performance metrics
    - **Property 18: Performance Optimization Prioritization**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.8, 8.9**
    - Test that fetch priority is applied correctly
    - Test that preload strategy is applied correctly

  - [ ] 10.6 Implement buffer progress tracking
    - Track buffer fill percentage
    - Display loading UI based on buffer progress
    - _Requirements: 8.7_

- [ ] 11. Video Metadata and Presentation
  - [ ] 11.1 Implement aspect ratio container sizing
    - Use aspect_ratio to set container dimensions
    - Default to 9:16 if aspect_ratio unavailable
    - _Requirements: 9.1, 9.2_

  - [ ]\* 11.2 Write property test for metadata rendering
    - **Property 19: Metadata Rendering with Defaults**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
    - Test aspect ratio container sizing
    - Test default values for missing metadata

  - [ ] 11.3 Implement poster image handling
    - Use thumbnail_url as poster image
    - Use placeholder if thumbnail_url unavailable
    - _Requirements: 9.3, 9.4_

  - [ ] 11.4 Implement duration display
    - Use duration for progress bar calculations
    - Hide duration display if unavailable
    - _Requirements: 9.5, 9.6_

  - [ ] 11.5 Implement engagement metrics display
    - Display fire_count, comment_count, shares_count
    - Display view count and max_views for ephemeral content
    - _Requirements: 9.7, 9.11_

  - [ ] 11.6 Implement remix context display
    - Display remix_type (duet, stitch, react)
    - Provide link to original_post_id
    - _Requirements: 9.8, 9.9_

  - [ ] 11.7 Implement processing status indicator
    - Display loading indicator during processing
    - Display error message if processing failed
    - _Requirements: 9.10_

  - [ ]\* 11.8 Write unit tests for metadata rendering
    - Test aspect ratio defaults
    - Test poster image fallback
    - Test engagement metrics display
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11_

- [ ] 12. Playback Controls and User Interaction
  - [ ] 12.1 Implement play/pause control
    - Display pause button when playing
    - Display play button when paused
    - Toggle playback state on click
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 12.2 Implement mute control
    - Toggle audio on/off on mute click
    - Display mute/unmute icon
    - _Requirements: 10.4_

  - [ ] 12.3 Implement volume control
    - Update audio level on volume slider change
    - Display current volume level
    - _Requirements: 10.5_

  - [ ] 12.4 Implement seek functionality
    - Jump to position on progress bar click
    - Update progress bar on playback progress
    - Display current time and total duration
    - _Requirements: 10.6, 10.9_

  - [ ] 12.5 Implement fullscreen control
    - Enter fullscreen mode on fullscreen click
    - Exit fullscreen mode on exit click
    - _Requirements: 10.7, 10.8_

  - [ ] 12.6 Implement playback speed control
    - Support speed options: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
    - Apply speed to video element
    - _Requirements: 10.10, 10.11_

  - [ ] 12.7 Implement control visibility toggle
    - Show/hide controls on mouse hover (desktop)
    - Show/hide controls on tap (mobile)
    - _Requirements: 10.12_

  - [ ]\* 12.8 Write property test for playback control state
    - **Property 20: Playback Control State Synchronization**
    - **Validates: Requirements 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.11**
    - Test that UI reflects video element state
    - Test that user interactions update state correctly

  - [ ]\* 12.9 Write unit tests for playback controls
    - Test play/pause toggle
    - Test mute/unmute toggle
    - Test volume slider
    - Test seek functionality
    - Test fullscreen toggle
    - Test speed control
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12_

- [ ] 13. Backend Data Flow and Filtering
  - [ ] 13.1 Implement feed query with filtering
    - Query publications table with all video fields
    - Apply processing_status filter (exclude failed unless debugging)
    - Apply visibility filter (exclude hidden/deleted)
    - Apply moderation filter (exclude unapproved)
    - Apply hive_id filter for regional content
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]\* 13.2 Write property test for backend data flow
    - **Property 21: Backend Data Flow Filtering and Sorting**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8**
    - Test filtering by processing_status
    - Test filtering by visibility and moderation
    - Test sorting by created_at, viral_score, distance

  - [ ] 13.3 Implement feed sorting
    - Sort by created_at (newest first) for feed
    - Sort by viral_score for trending feed
    - Sort by distance for nearby feed
    - _Requirements: 11.6, 11.7, 11.8_

  - [ ]\* 13.4 Write unit tests for backend filtering
    - Test filtering combinations
    - Test sorting order
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ] 14. Monitoring and Observability
  - [ ] 14.1 Implement metrics collection and logging
    - Log all playback events (start, pause, resume, end, error)
    - Record TTFF, stall count, stall duration, buffer ready time
    - Record error codes and messages
    - Record retry attempts and success/failure
    - Record video source type and fallback events
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

  - [ ]\* 14.2 Write property test for error logging and metrics
    - **Property 17: Error Logging and Metrics**
    - **Validates: Requirements 7.9, 7.10, 13.1, 13.5, 13.6, 13.7, 13.8, 13.10**
    - Test that all errors are logged with required fields
    - Test that metrics are collected for all videos

  - [ ] 14.3 Implement telemetry service integration
    - Send metrics to telemetry service for aggregation
    - Include video ID, user ID, timestamp, and metrics
    - _Requirements: 13.10_

  - [ ] 14.4 Implement debug overlay
    - Display when debug=1 parameter set
    - Show current video URL and source type
    - Show TTFF, stall metrics, buffer status
    - Show network bandwidth estimate
    - Show cache hit/miss status
    - Show error log (last 10 errors)
    - _Requirements: 13.9_

  - [ ] 14.5 Implement processing pipeline monitoring
    - Track processing_status distribution
    - Alert on high failure rates
    - _Requirements: 13.11_

  - [ ] 14.6 Implement performance alerting
    - Alert on TTFF >5s (degradation)
    - Alert on error rate >5%
    - Alert on stall count >2 per video
    - Alert on processing failure rate >1%
    - Alert on cache hit rate <50%
    - _Requirements: 13.12_

  - [ ]\* 14.7 Write unit tests for monitoring
    - Test metrics collection format
    - Test debug overlay rendering
    - Test alert conditions
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.11, 13.12_

- [ ] 15. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Implementation Notes

### Critical Path

The critical path for this feature is:

1. **Database Schema** (Task 1) - Blocks all other work
2. **API Endpoints** (Task 2) - Blocks frontend development
3. **Metadata Parser** (Task 3) - Blocks URL resolution
4. **URL Resolution** (Task 4) - Blocks playback strategies
5. **Playback Strategies** (Tasks 5-6) - Blocks error handling
6. **Error Handling** (Task 8) - Enables robust playback
7. **Feed Manager** (Task 7) - Enables TikTok-style experience
8. **Performance & Monitoring** (Tasks 10, 14) - Enables production readiness

### Property-Based Testing Strategy

Each property test validates a universal correctness property across all valid inputs:

- **Property 1-8**: URL resolution and validation
- **Property 9-12**: Playback strategies (HLS, MSE)
- **Property 13-15**: Continuous feed management
- **Property 16-17**: Error handling and recovery
- **Property 18-20**: Performance and controls
- **Property 21-29**: Data flow, caching, and parsing

Property tests use custom generators for:

- Video metadata with various URL combinations
- Network conditions (fast, slow, offline)
- Processing statuses (pending, processing, completed, failed)
- Aspect ratios and durations
- Error scenarios

### Optional Tasks

Tasks marked with `*` are optional property-based tests. Core implementation tasks (without `*`) must be completed. Optional tests can be skipped for faster MVP but should be included for production quality.

### Testing Configuration

All property tests should use:

- **Minimum 100 iterations** per test
- **Custom generators** for domain-specific data
- **Shrinking enabled** for failure analysis
- **30-second timeout** per test
- **fast-check** for TypeScript/JavaScript implementation

### Dependency Management

- Tasks 1-3 have no dependencies (can start immediately)
- Tasks 4-6 depend on Task 3 (metadata parser)
- Task 7 depends on Tasks 4-6 (URL resolution and playback)
- Task 8 depends on Tasks 4-6 (error handling for playback)
- Tasks 10-14 depend on Tasks 1-8 (optimization and monitoring)
