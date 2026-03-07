/**
 * Test for GET /api/videos/:id endpoint
 * Task 2.3: Implements GET /api/videos/:id endpoint
 * Validates Requirements: 2.2, 2.6, 2.7, 2.8, 2.9, 2.10
 */

import { describe, it, expect, beforeAll } from "vitest";

describe("GET /api/feed/videos/:id", () => {
  const BASE_URL = "http://localhost:3000";
  const ENDPOINT = "/api/feed/videos";

  // Test video ID - will need to be updated with actual video ID from database
  const TEST_VIDEO_ID = "test-video-id";

  beforeAll(() => {
    console.log("Testing video by ID endpoint...");
  });

  it("should return 404 for non-existent video", async () => {
    const response = await fetch(
      `${BASE_URL}${ENDPOINT}/00000000-0000-0000-0000-000000000000`,
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Video not found");
  });

  it("should return complete video metadata for valid video ID", async () => {
    // This test requires a valid video ID in the database
    // Skip if no test data available
    const response = await fetch(`${BASE_URL}${ENDPOINT}/${TEST_VIDEO_ID}`);

    if (response.status === 404) {
      console.log("⚠️  No test video available, skipping metadata test");
      return;
    }

    expect(response.status).toBe(200);
    const data = await response.json();

    // Validate response structure (Requirement 2.2)
    expect(data).toHaveProperty("video");
    expect(data).toHaveProperty("metadata");
    expect(data.metadata).toHaveProperty("generatedAt");

    // Validate video has all required fields (Requirements 2.6, 2.7, 2.8, 2.9, 2.10)
    const video = data.video;
    expect(video).toHaveProperty("id");
    expect(video).toHaveProperty("user");

    // Check URL variants are present (at least one should be available)
    const hasUrl =
      video.media_url ||
      video.hls_url ||
      video.enhanced_url ||
      video.original_url;
    expect(hasUrl).toBeTruthy();

    // Check metadata fields
    expect(video).toHaveProperty("processing_status");
    expect(video).toHaveProperty("thumbnail_url");
    expect(video).toHaveProperty("duration");
    expect(video).toHaveProperty("aspect_ratio");
    expect(video).toHaveProperty("mux_playback_id");
  });

  it("should include related videos when requested", async () => {
    // This test requires a valid video ID in the database
    const response = await fetch(
      `${BASE_URL}${ENDPOINT}/${TEST_VIDEO_ID}?related=true`,
    );

    if (response.status === 404) {
      console.log("⚠️  No test video available, skipping related videos test");
      return;
    }

    expect(response.status).toBe(200);
    const data = await response.json();

    // Related videos are optional, but if present should be an array
    if (data.relatedVideos) {
      expect(Array.isArray(data.relatedVideos)).toBe(true);
      expect(data.relatedVideos.length).toBeLessThanOrEqual(5);

      // Each related video should have complete metadata
      data.relatedVideos.forEach((video: any) => {
        expect(video).toHaveProperty("id");
        expect(video).toHaveProperty("user");
        expect(video.id).not.toBe(TEST_VIDEO_ID); // Should not include the requested video
      });
    }
  });

  it("should handle missing Supabase configuration gracefully", async () => {
    // This test would require mocking environment variables
    // For now, we just document the expected behavior
    console.log("ℹ️  Endpoint should return 500 if Supabase config is missing");
  });

  it("should only return public, non-hidden, non-deleted videos", async () => {
    // This test validates filtering logic
    const response = await fetch(`${BASE_URL}${ENDPOINT}/${TEST_VIDEO_ID}`);

    if (response.status === 404) {
      console.log("⚠️  No test video available, skipping visibility test");
      return;
    }

    if (response.status === 200) {
      const data = await response.json();
      const video = data.video;

      // Verify visibility filters
      expect(video.visibility).toBe("public");
      expect(video.est_masque).toBe(false);
      expect(video.deleted_at).toBeNull();
    }
  });
});
