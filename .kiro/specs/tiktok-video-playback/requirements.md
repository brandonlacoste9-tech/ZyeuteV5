# Requirements Document: TikTok-Style Video Playback

## Introduction

This document specifies the requirements for implementing a fully functional TikTok-style video playback system for the Zyeuté social media platform. The feature enables seamless, continuous video streaming with adaptive bitrate delivery, intelligent caching, and robust error handling. Videos are served through multiple delivery mechanisms (HLS, MSE, direct URL) with automatic fallback strategies to ensure reliable playback across diverse network conditions and device capabilities.

The system bridges the gap between the existing sophisticated VideoPlayer component and the backend video infrastructure, ensuring that videos stored in the database are properly retrieved, formatted, and delivered to the frontend with all necessary metadata for optimal playback experience.

## Glossary

- **Publication**: A database record representing user-generated content (video, image, or text) stored in the "publications" table
- **Post**: Synonym for Publication; used interchangeably in the codebase
- **HLS (HTTP Live Streaming)**: Adaptive bitrate streaming protocol using .m3u8 manifest files for video delivery
- **MSE (Media Source Extensions)**: Browser API for constructing media streams from chunks, enabling advanced playback control
- **Mux**: Third-party video processing and streaming service providing asset management and playback IDs
- **Playback ID**: Unique identifier from Mux for accessing processed video streams
- **Processing Status**: State of video in the pipeline (pending, processing, completed, failed)
- **Media Proxy**: Service that handles external video URLs and provides optimized delivery
- **Adaptive Bitrate**: Streaming technique that adjusts video quality based on network conditions
- **Stall Recovery**: Mechanism to resume playback when buffering causes interruption
- **Time To First Frame (TTFF)**: Metric measuring delay from playback start to first frame display
- **Feed**: Continuous scrolling list of videos (explore feed, personalized feed, or user profile feed)
- **Continuous Feed**: TikTok-style vertical scrolling where videos auto-play as user scrolls
- **VideoPlayer Component**: React component handling video rendering, controls, and playback logic
- **Video Source**: Object containing video data (URL, chunks, MIME type) for playback
- **Prefetch**: Loading next video in feed before user scrolls to it
- **Ephemeral Content**: Videos with limited view count or expiration time
- **Remix**: User-generated content based on another video (duet, stitch, react)

## Requirements

### Requirement 1: Database Schema Alignment

**User Story:** As a backend developer, I want the database schema to properly support video metadata, so that all video information is available for retrieval and playback.

#### Acceptance Criteria

1. THE Publications_Table SHALL contain all required video fields: media_url, hls_url, enhanced_url, original_url, mux_playback_id, processing_status, thumbnail_url, duration, aspect_ratio
2. WHEN a video is uploaded, THE System SHALL populate media_url with the original upload location
3. WHEN a video is processed by Mux, THE System SHALL store mux_playback_id for HLS streaming
4. WHEN a video is processed, THE System SHALL store hls_url pointing to the Mux HLS manifest
5. WHEN a video is enhanced (upscaled), THE System SHALL store enhanced_url with the enhanced version
6. WHEN a video is processed, THE System SHALL store thumbnail_url pointing to a representative frame
7. WHEN a video is processed, THE System SHALL store duration in seconds
8. WHEN a video is processed, THE System SHALL store aspect_ratio (e.g., "9:16" for vertical video)
9. WHEN a video is uploaded, THE System SHALL set processing_status to "pending"
10. WHEN video processing completes, THE System SHALL update processing_status to "completed"
11. IF video processing fails, THEN THE System SHALL set processing_status to "failed" and store error details
12. THE Publications_Table SHALL have indexes on (user_id, created_at) for efficient feed queries
13. THE Publications_Table SHALL have indexes on (region_id, created_at) for regional feed queries
14. THE Publications_Table SHALL have indexes on processing_status for finding videos needing processing

### Requirement 2: API Endpoints for Video Data Retrieval

**User Story:** As a frontend developer, I want API endpoints that return complete video metadata, so that I can render videos with all necessary information.

#### Acceptance Criteria

1. WHEN a client requests the feed, THE API SHALL return publications with all video fields populated
2. WHEN a client requests a single video, THE API SHALL return complete video metadata including all URL variants
3. WHEN a video is in "pending" or "processing" status, THE API SHALL return the original_url as fallback
4. WHEN a video is in "completed" status, THE API SHALL prioritize hls_url for adaptive streaming
5. WHEN hls_url is unavailable, THE API SHALL return enhanced_url or media_url as fallback
6. THE API SHALL include thumbnail_url for feed preview rendering
7. THE API SHALL include duration for progress bar and seek functionality
8. THE API SHALL include aspect_ratio for proper video container sizing
9. THE API SHALL include processing_status so frontend can show loading states
10. THE API SHALL include mux_playback_id for Mux player integration (if applicable)
11. WHEN a video has remix_type set, THE API SHALL include original_post_id for remix context
12. THE API SHALL support pagination for feed endpoints with cursor-based or offset-based pagination
13. THE API SHALL support filtering by hive_id (quebec, montreal, etc.) for regional feeds
14. THE API SHALL support filtering by processing_status for debugging and monitoring

### Requirement 3: Video URL Resolution and Fallback Strategy

**User Story:** As a video playback system, I want to intelligently select video URLs based on availability and network conditions, so that videos play reliably.

#### Acceptance Criteria

1. WHEN selecting a video source, THE System SHALL prefer hls_url if available and processing_status is "completed"
2. WHEN hls_url is unavailable, THE System SHALL fall back to enhanced_url if available
3. WHEN enhanced_url is unavailable, THE System SHALL fall back to media_url
4. WHEN media_url is unavailable, THE System SHALL fall back to original_url
5. IF all URLs are unavailable, THEN THE System SHALL display an error state with retry option
6. WHEN a URL points to an external domain, THE System SHALL route through media_proxy for optimization
7. WHEN a URL is from Mux, THE System SHALL use the Mux playback ID for direct streaming
8. THE System SHALL validate that selected URL is a video (not an image) before playback
9. THE System SHALL support both absolute URLs and relative paths
10. THE System SHALL handle URLs with query parameters and cache-busting tokens
11. WHEN a video fails to load, THE System SHALL attempt retry with exponential backoff (1s, 2s, 4s)
12. WHEN all retries are exhausted, THE System SHALL display error message with manual retry button

### Requirement 4: HLS Streaming and Adaptive Bitrate

**User Story:** As a user on a variable network, I want videos to adapt quality automatically, so that playback is smooth regardless of connection speed.

#### Acceptance Criteria

1. WHEN a video has hls_url available, THE VideoPlayer SHALL use HLS.js for adaptive streaming
2. WHEN HLS.js is not supported, THE VideoPlayer SHALL fall back to native HLS support (Safari)
3. WHEN network bandwidth decreases, THE HLS Stream SHALL automatically reduce quality
4. WHEN network bandwidth increases, THE HLS Stream SHALL automatically increase quality
5. THE HLS Stream SHALL maintain a back buffer of 90 seconds for smooth playback
6. THE HLS Stream SHALL enable worker threads for manifest parsing
7. THE HLS Stream SHALL cap video level to player size for efficiency
8. WHEN an HLS fatal error occurs, THE System SHALL log the error and attempt fallback
9. THE System SHALL handle HLS manifest updates for live or long-duration videos
10. THE System SHALL support both .m3u8 manifest URLs and direct video URLs

### Requirement 5: Media Source Extensions (MSE) for Advanced Playback

**User Story:** As a video system, I want to support chunked video delivery, so that I can optimize bandwidth and enable advanced features like seeking and buffer management.

#### Acceptance Criteria

1. WHEN a video source provides chunks, THE System SHALL use MSE for playback
2. THE MSE Pipeline SHALL append chunks sequentially as they become available
3. WHEN a SourceBuffer reaches quota, THE System SHALL clear played content (keeping 30s behind playhead)
4. WHEN MSE fails, THE System SHALL fall back to direct URL playback
5. THE System SHALL handle "sequence" mode for concatenated segments with possible discontinuities
6. THE System SHALL validate MIME type support before creating SourceBuffer
7. WHEN MIME type is not supported, THE System SHALL fall back to URL-based playback
8. THE System SHALL process pending chunks asynchronously without blocking playback
9. WHEN all chunks are appended, THE System SHALL call endOfStream() to signal completion
10. THE System SHALL handle updateend events to process queued chunks

### Requirement 6: Continuous Feed Playback

**User Story:** As a user, I want to scroll through videos TikTok-style with automatic playback, so that I can discover content seamlessly.

#### Acceptance Criteria

1. WHEN a video enters the viewport, THE System SHALL automatically start playback
2. WHEN a video leaves the viewport, THE System SHALL pause playback
3. WHEN a user scrolls to the next video, THE System SHALL pause the previous video
4. WHEN a user scrolls to the next video, THE System SHALL start playback of the new video
5. WHEN a video is at 70% progress, THE System SHALL trigger prefetch of the next video
6. THE System SHALL maintain smooth scrolling without jank or frame drops
7. THE System SHALL limit concurrent video loads to prevent resource exhaustion
8. THE System SHALL prioritize loading the current video over prefetch videos
9. WHEN a user scrolls rapidly, THE System SHALL cancel prefetch of skipped videos
10. THE System SHALL track user interactions (view, skip, fire, comment) for analytics

### Requirement 7: Error Handling and Recovery

**User Story:** As a user, I want videos to handle errors gracefully, so that I can retry or move to another video.

#### Acceptance Criteria

1. WHEN a video fails to load, THE System SHALL display an error state with clear messaging
2. WHEN a video fails to load, THE System SHALL provide a "Retry" button for manual retry
3. WHEN a video fails to load, THE System SHALL provide a "Refresh" button to reload the page
4. WHEN a video stalls for more than 8 seconds, THE System SHALL attempt stall recovery
5. WHEN stall recovery is triggered, THE System SHALL nudge the playback position forward
6. IF nudge fails, THEN THE System SHALL reload the video
7. WHEN a video loading timeout occurs (15 seconds), THE System SHALL trigger retry mechanism
8. WHEN all retries are exhausted, THE System SHALL display permanent error state
9. THE System SHALL log all errors with timestamp and video URL for debugging
10. THE System SHALL track error metrics (TTFF, stall count, stall duration) for monitoring
11. WHEN a video has processing_status "failed", THE System SHALL display appropriate error message
12. WHEN a video has processing_status "pending" or "processing", THE System SHALL show loading state

### Requirement 8: Performance Optimization

**User Story:** As a platform, I want video playback to be fast and efficient, so that users have a smooth experience.

#### Acceptance Criteria

1. WHEN a video is prioritized, THE System SHALL use fetchPriority="high" for faster loading
2. WHEN a video is not prioritized, THE System SHALL use fetchPriority="low" to save bandwidth
3. THE System SHALL preload poster images for prioritized videos
4. THE System SHALL measure Time To First Frame (TTFF) for all videos
5. THE System SHALL record buffer ready time for performance monitoring
6. THE System SHALL track stall count and total stall duration
7. THE System SHALL implement buffer progress tracking for loading UI
8. THE System SHALL limit preload strategy to "metadata" for non-prioritized videos
9. THE System SHALL use "auto" preload for prioritized videos
10. THE System SHALL implement lazy loading for feed videos outside viewport
11. THE System SHALL cache video metadata to reduce API calls
12. THE System SHALL implement request deduplication for concurrent identical requests

### Requirement 9: Video Metadata and Presentation

**User Story:** As a frontend component, I want complete video metadata, so that I can render videos with proper dimensions and styling.

#### Acceptance Criteria

1. WHEN rendering a video, THE System SHALL use aspect_ratio to set container dimensions
2. WHEN aspect_ratio is unavailable, THE System SHALL default to 9:16 (vertical video)
3. WHEN rendering a video, THE System SHALL use thumbnail_url as poster image
4. WHEN thumbnail_url is unavailable, THE System SHALL use a placeholder image
5. WHEN rendering a video, THE System SHALL use duration for progress bar calculations
6. WHEN duration is unavailable, THE System SHALL hide duration display
7. WHEN a video is ephemeral, THE System SHALL display view count and max_views
8. WHEN a video is a remix, THE System SHALL display remix_type (duet, stitch, react)
9. WHEN a video is a remix, THE System SHALL provide link to original_post_id
10. THE System SHALL display processing_status as loading indicator during processing
11. THE System SHALL display fire_count, comment_count, shares_count for engagement metrics
12. THE System SHALL display user avatar and username for video attribution

### Requirement 10: Playback Controls and User Interaction

**User Story:** As a user, I want intuitive playback controls, so that I can manage video playback.

#### Acceptance Criteria

1. WHEN a video is playing, THE System SHALL display pause button
2. WHEN a video is paused, THE System SHALL display play button
3. WHEN a user clicks play/pause, THE System SHALL toggle playback state
4. WHEN a user clicks mute, THE System SHALL toggle audio on/off
5. WHEN a user adjusts volume slider, THE System SHALL update audio level
6. WHEN a user seeks on progress bar, THE System SHALL jump to that position
7. WHEN a user clicks fullscreen, THE System SHALL enter fullscreen mode
8. WHEN a user exits fullscreen, THE System SHALL return to normal mode
9. THE System SHALL display current time and total duration on progress bar
10. THE System SHALL support playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
11. WHEN a user changes playback speed, THE System SHALL apply speed to video element
12. THE System SHALL show/hide controls on mouse hover (desktop) or tap (mobile)

### Requirement 11: Data Flow from Backend to Frontend

**User Story:** As a system architect, I want clear data flow from database to video player, so that the system is maintainable.

#### Acceptance Criteria

1. WHEN a user requests feed, THE Backend SHALL query publications table with all video fields
2. THE Backend SHALL apply processing_status filter to exclude failed videos (unless debugging)
3. THE Backend SHALL apply visibility filter to exclude hidden/deleted videos
4. THE Backend SHALL apply moderation filter to exclude unapproved content
5. THE Backend SHALL apply hive_id filter for regional content isolation
6. THE Backend SHALL return videos sorted by created_at (newest first) for feed
7. THE Backend SHALL return videos sorted by viral_score for trending feed
8. THE Backend SHALL return videos sorted by distance for nearby feed
9. THE Frontend SHALL receive complete video metadata in API response
10. THE Frontend SHALL pass video data to VideoPlayer component
11. THE VideoPlayer SHALL extract URLs and select appropriate source
12. THE VideoPlayer SHALL render video with all metadata (thumbnail, duration, etc.)

### Requirement 12: Caching and Cache Invalidation

**User Story:** As a system, I want to cache video data efficiently, so that repeated requests are fast.

#### Acceptance Criteria

1. THE System SHALL cache video metadata for 5 minutes
2. WHEN a video is updated, THE System SHALL invalidate its cache entry
3. WHEN a video processing completes, THE System SHALL invalidate its cache entry
4. THE System SHALL cache HLS manifests for 1 minute
5. WHEN a video URL changes, THE System SHALL invalidate URL cache
6. THE System SHALL implement cache-busting tokens for retry scenarios
7. THE System SHALL track cache hit/miss rates for monitoring
8. THE System SHALL implement LRU eviction for memory-constrained environments
9. WHEN a user scrolls past a video, THE System SHALL clear its buffer from memory
10. THE System SHALL maintain playhead position for seek stability (30s behind playhead)

### Requirement 13: Monitoring and Observability

**User Story:** As an operator, I want visibility into video playback performance, so that I can identify and fix issues.

#### Acceptance Criteria

1. THE System SHALL log all video playback events (start, pause, resume, end, error)
2. THE System SHALL record Time To First Frame (TTFF) for all videos
3. THE System SHALL record stall count and total stall duration
4. THE System SHALL record buffer ready time
5. THE System SHALL record error codes and messages
6. THE System SHALL record retry attempts and success/failure
7. THE System SHALL record video source type (HLS, MSE, URL)
8. THE System SHALL record fallback events (HLS -> URL, MSE -> URL)
9. THE System SHALL expose metrics via debug overlay (when debug=1 parameter set)
10. THE System SHALL send metrics to telemetry service for aggregation
11. THE System SHALL track processing_status distribution for pipeline health
12. THE System SHALL alert on high error rates or TTFF degradation

### Requirement 14: Parser and Serializer for Video Metadata

**User Story:** As a system, I want to parse and serialize video metadata reliably, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN parsing video metadata from database, THE Parser SHALL validate all required fields
2. WHEN parsing video metadata, THE Parser SHALL handle missing optional fields gracefully
3. WHEN parsing processing_status, THE Parser SHALL validate against enum (pending, processing, completed, failed)
4. WHEN parsing aspect_ratio, THE Parser SHALL validate format (e.g., "9:16")
5. WHEN parsing URLs, THE Parser SHALL validate they are valid HTTP(S) URLs or relative paths
6. WHEN parsing duration, THE Parser SHALL validate it is a positive integer
7. WHEN serializing video metadata to JSON, THE Pretty_Printer SHALL format all fields consistently
8. WHEN serializing URLs, THE Pretty_Printer SHALL preserve query parameters and fragments
9. FOR ALL valid video metadata objects, parsing then printing then parsing SHALL produce an equivalent object (round-trip property)
10. WHEN parsing invalid metadata, THE Parser SHALL return descriptive error messages
11. THE Parser SHALL handle both snake_case (database) and camelCase (frontend) field names
12. THE Parser SHALL validate that at least one URL variant is available for playback
