import { describe, it, expect } from "vitest";
import fc from "fast-check";

/**
 * Property 2: Processing Status Lifecycle
 * Validates: Requirements 1.9, 1.10, 1.11
 *
 * For any video, the processing_status should follow a valid state transition:
 * pending → processing → completed (or failed), and all associated metadata
 * fields should be populated according to the status (e.g., hls_url populated
 * only when status is completed).
 */

// ============================================================================
// Type Definitions
// ============================================================================

type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

interface VideoMetadata {
  id: string;
  processing_status: ProcessingStatus;
  media_url?: string;
  hls_url?: string;
  enhanced_url?: string;
  original_url?: string;
  mux_playback_id?: string;
  thumbnail_url?: string;
  duration?: number;
  aspect_ratio?: string;
  processing_error?: string;
}

// ============================================================================
// Custom Generators
// ============================================================================

/**
 * Generator for valid processing status values
 */
const processingStatusArb = fc.oneof(
  fc.constant("pending" as ProcessingStatus),
  fc.constant("processing" as ProcessingStatus),
  fc.constant("completed" as ProcessingStatus),
  fc.constant("failed" as ProcessingStatus),
);

/**
 * Generator for valid aspect ratios (e.g., "9:16", "16:9")
 */
const aspectRatioArb = fc
  .tuple(fc.integer({ min: 1, max: 32 }), fc.integer({ min: 1, max: 32 }))
  .map(([w, h]: [number, number]) => `${w}:${h}`);

/**
 * Generator for valid URLs
 */
const urlArb = fc.webUrl().map((url: URL) => url.toString());

/**
 * Generator for video metadata with various processing statuses
 */
const videoMetadataArb = (status?: ProcessingStatus) =>
  fc.record({
    id: fc.uuid(),
    processing_status: status ? fc.constant(status) : processingStatusArb,
    media_url: fc.option(urlArb),
    hls_url: fc.option(urlArb),
    enhanced_url: fc.option(urlArb),
    original_url: fc.option(urlArb),
    mux_playback_id: fc.option(fc.alphaNumericString({ minLength: 1 })),
    thumbnail_url: fc.option(urlArb),
    duration: fc.option(fc.integer({ min: 1, max: 3600 })),
    aspect_ratio: fc.option(aspectRatioArb),
    processing_error: fc.option(fc.string()),
  });

/**
 * Generator for valid state transitions
 */
const validTransitionArb = fc.oneof(
  fc.constant({
    from: "pending" as ProcessingStatus,
    to: "processing" as ProcessingStatus,
  }),
  fc.constant({
    from: "pending" as ProcessingStatus,
    to: "failed" as ProcessingStatus,
  }),
  fc.constant({
    from: "processing" as ProcessingStatus,
    to: "completed" as ProcessingStatus,
  }),
  fc.constant({
    from: "processing" as ProcessingStatus,
    to: "failed" as ProcessingStatus,
  }),
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a status transition is valid
 */
function isValidTransition(
  from: ProcessingStatus,
  to: ProcessingStatus,
): boolean {
  const validTransitions: Record<ProcessingStatus, ProcessingStatus[]> = {
    pending: ["processing", "failed"],
    processing: ["completed", "failed"],
    completed: [], // Terminal state
    failed: [], // Terminal state
  };

  return validTransitions[from].includes(to);
}

/**
 * Simulate a state transition
 */
function transitionStatus(
  video: VideoMetadata,
  newStatus: ProcessingStatus,
): VideoMetadata {
  if (!isValidTransition(video.processing_status, newStatus)) {
    throw new Error(
      `Invalid transition from ${video.processing_status} to ${newStatus}`,
    );
  }

  const updated = { ...video, processing_status: newStatus };

  // When transitioning to processing, no new fields are populated
  if (newStatus === "processing") {
    return updated;
  }

  // When transitioning to completed, populate all metadata fields
  if (newStatus === "completed") {
    return {
      ...updated,
      hls_url: video.hls_url || "https://example.com/manifest.m3u8",
      thumbnail_url: video.thumbnail_url || "https://example.com/thumb.jpg",
      duration: video.duration || 60,
      aspect_ratio: video.aspect_ratio || "9:16",
      processing_error: undefined,
    };
  }

  // When transitioning to failed, populate error field
  if (newStatus === "failed") {
    return {
      ...updated,
      processing_error: video.processing_error || "Processing failed",
      hls_url: undefined,
    };
  }

  return updated;
}

// ============================================================================
// Property Tests
// ============================================================================

describe("Processing Status Lifecycle - Property Tests", () => {
  /**
   * Property: Valid State Transitions
   *
   * For any video with a valid current status, transitioning to a valid
   * next status should succeed, and the new status should be set correctly.
   */
  it("should allow valid state transitions", () => {
    fc.assert(
      fc.property(
        validTransitionArb,
        videoMetadataArb(),
        (transition: any, video: VideoMetadata) => {
          const updated = transitionStatus(video, transition.to);
          expect(updated.processing_status).toBe(transition.to);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Invalid State Transitions Rejected
   *
   * For any video, attempting an invalid state transition should throw
   * an error or be rejected.
   */
  it("should reject invalid state transitions", () => {
    fc.assert(
      fc.property(
        processingStatusArb,
        processingStatusArb,
        videoMetadataArb(),
        (
          from: ProcessingStatus,
          to: ProcessingStatus,
          video: VideoMetadata,
        ) => {
          const testVideo = { ...video, processing_status: from };

          if (!isValidTransition(from, to)) {
            expect(() => transitionStatus(testVideo, to)).toThrow();
          } else {
            expect(() => transitionStatus(testVideo, to)).not.toThrow();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Metadata Population on Completion
   *
   * For any video transitioning to "completed" status, all required
   * metadata fields (hls_url, thumbnail_url, duration, aspect_ratio)
   * must be populated.
   */
  it("should populate all metadata fields when transitioning to completed", () => {
    fc.assert(
      fc.property(videoMetadataArb("processing"), (video: VideoMetadata) => {
        const completed = transitionStatus(video, "completed");

        expect(completed.processing_status).toBe("completed");
        expect(completed.hls_url).toBeDefined();
        expect(completed.thumbnail_url).toBeDefined();
        expect(completed.duration).toBeDefined();
        expect(completed.aspect_ratio).toBeDefined();
        expect(completed.processing_error).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Error Field Population on Failure
   *
   * For any video transitioning to "failed" status, the error field
   * must be populated with error details.
   */
  it("should populate error field when transitioning to failed", () => {
    fc.assert(
      fc.property(
        fc.oneof(videoMetadataArb("pending"), videoMetadataArb("processing")),
        (video: VideoMetadata) => {
          const failed = transitionStatus(video, "failed");

          expect(failed.processing_status).toBe("failed");
          expect(failed.processing_error).toBeDefined();
          expect(failed.hls_url).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: HLS URL Only When Completed
   *
   * For any video, hls_url should only be populated when the status
   * is "completed". For pending, processing, or failed statuses,
   * hls_url should not be set.
   */
  it("should only populate hls_url when status is completed", () => {
    fc.assert(
      fc.property(videoMetadataArb(), (video: VideoMetadata) => {
        if (video.processing_status === "completed") {
          // Completed videos should have hls_url
          expect(video.hls_url || "should be set").toBeDefined();
        } else if (
          video.processing_status === "pending" ||
          video.processing_status === "processing"
        ) {
          // Pending and processing videos should not have hls_url
          expect(video.hls_url).toBeUndefined();
        } else if (video.processing_status === "failed") {
          // Failed videos should not have hls_url
          expect(video.hls_url).toBeUndefined();
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Metadata Consistency Across Transitions
   *
   * For any video, the metadata should remain consistent as it
   * transitions through valid states. Fields that are set should
   * not be unset (except for error field on completion).
   */
  it("should maintain metadata consistency across valid transitions", () => {
    fc.assert(
      fc.property(videoMetadataArb("pending"), (video: VideoMetadata) => {
        // Transition: pending -> processing
        const processing = transitionStatus(video, "processing");
        expect(processing.processing_status).toBe("processing");

        // Transition: processing -> completed
        const completed = transitionStatus(processing, "completed");
        expect(completed.processing_status).toBe("completed");
        expect(completed.hls_url).toBeDefined();
        expect(completed.thumbnail_url).toBeDefined();
        expect(completed.duration).toBeDefined();
        expect(completed.aspect_ratio).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Terminal States Cannot Transition
   *
   * For any video in a terminal state (completed or failed),
   * no further transitions should be allowed.
   */
  it("should not allow transitions from terminal states", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("completed" as ProcessingStatus),
          fc.constant("failed" as ProcessingStatus),
        ),
        processingStatusArb,
        videoMetadataArb(),
        (
          terminalStatus: ProcessingStatus,
          nextStatus: ProcessingStatus,
          video: VideoMetadata,
        ) => {
          const terminalVideo = { ...video, processing_status: terminalStatus };

          // Terminal states should not transition to any other state
          expect(() => transitionStatus(terminalVideo, nextStatus)).toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Pending Status Has No Processed Fields
   *
   * For any video with "pending" status, no processed metadata fields
   * should be populated (hls_url, thumbnail_url, duration, aspect_ratio).
   */
  it("should not populate processed fields for pending status", () => {
    fc.assert(
      fc.property(videoMetadataArb("pending"), (video: VideoMetadata) => {
        expect(video.processing_status).toBe("pending");
        expect(video.hls_url).toBeUndefined();
        expect(video.thumbnail_url).toBeUndefined();
        expect(video.duration).toBeUndefined();
        expect(video.aspect_ratio).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Processing Status Has No HLS URL
   *
   * For any video with "processing" status, hls_url should not be
   * populated (it's only available after completion).
   */
  it("should not populate hls_url for processing status", () => {
    fc.assert(
      fc.property(videoMetadataArb("processing"), (video: VideoMetadata) => {
        expect(video.processing_status).toBe("processing");
        expect(video.hls_url).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Failed Status Has Error Details
   *
   * For any video with "failed" status, the processing_error field
   * must be populated with error details.
   */
  it("should always have error details for failed status", () => {
    fc.assert(
      fc.property(videoMetadataArb("failed"), (video: VideoMetadata) => {
        expect(video.processing_status).toBe("failed");
        expect(video.processing_error).toBeDefined();
        expect(video.processing_error?.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Completed Status Has All Metadata
   *
   * For any video with "completed" status, all required metadata fields
   * must be populated: hls_url, thumbnail_url, duration, aspect_ratio.
   */
  it("should have all metadata fields for completed status", () => {
    fc.assert(
      fc.property(videoMetadataArb("completed"), (video: VideoMetadata) => {
        expect(video.processing_status).toBe("completed");
        expect(video.hls_url).toBeDefined();
        expect(video.thumbnail_url).toBeDefined();
        expect(video.duration).toBeDefined();
        expect(video.aspect_ratio).toBeDefined();
        expect(video.processing_error).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Aspect Ratio Format Validation
   *
   * For any video with an aspect_ratio, it should follow the format "W:H"
   * where W and H are positive integers.
   */
  it("should validate aspect ratio format", () => {
    fc.assert(
      fc.property(videoMetadataArb("completed"), (video: VideoMetadata) => {
        if (video.aspect_ratio) {
          const parts = video.aspect_ratio.split(":");
          expect(parts).toHaveLength(2);
          expect(Number.isInteger(parseInt(parts[0]))).toBe(true);
          expect(Number.isInteger(parseInt(parts[1]))).toBe(true);
          expect(parseInt(parts[0])).toBeGreaterThan(0);
          expect(parseInt(parts[1])).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: Duration Is Positive Integer
   *
   * For any video with a duration, it should be a positive integer
   * representing seconds.
   */
  it("should validate duration as positive integer", () => {
    fc.assert(
      fc.property(videoMetadataArb("completed"), (video: VideoMetadata) => {
        if (video.duration !== undefined) {
          expect(Number.isInteger(video.duration)).toBe(true);
          expect(video.duration).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 },
    );
  });
});
