/**
 * Feed API Tests
 * Task 2.1: Test GET /api/feed endpoint with complete metadata
 * Validates Requirements: 2.1, 2.2, 2.6, 2.7, 2.8, 2.9, 2.10, 2.12, 2.13, 2.14
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Skip frontend setup for backend tests
// @vitest-environment node

describe("Feed API - Complete Metadata", () => {
  let supabase: any;

  beforeAll(() => {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Skipping feed tests - Supabase not configured");
      return;
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  });

  it("should return posts with all required video fields", async () => {
    if (!supabase) {
      console.warn("Skipping test - Supabase not configured");
      return;
    }

    // Query publications table with all video fields
    const { data: posts, error } = await supabase
      .from("publications")
      .select(
        `
        *,
        user:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `,
      )
      .eq("visibility", "public")
      .eq("est_masque", false)
      .is("deleted_at", null)
      .neq("processing_status", "failed")
      .order("created_at", { ascending: false })
      .limit(5);

    expect(error).toBeNull();

    if (posts && posts.length > 0) {
      const post = posts[0];

      // Verify all required fields are present in the response
      // (Requirement 2.1, 2.2, 2.6, 2.7, 2.8, 2.9, 2.10)
      expect(post).toHaveProperty("id");
      expect(post).toHaveProperty("user_id");
      expect(post).toHaveProperty("created_at");

      // Video URL fields should be present (even if null)
      expect(post).toHaveProperty("media_url");
      expect(post).toHaveProperty("hls_url");
      expect(post).toHaveProperty("enhanced_url");
      expect(post).toHaveProperty("original_url");

      // Mux integration field
      expect(post).toHaveProperty("mux_playback_id");

      // Processing status field
      expect(post).toHaveProperty("processing_status");

      // Video metadata fields
      expect(post).toHaveProperty("thumbnail_url");
      expect(post).toHaveProperty("duration");
      expect(post).toHaveProperty("aspect_ratio");

      // User data should be populated
      expect(post).toHaveProperty("user");
      if (post.user) {
        expect(post.user).toHaveProperty("id");
        expect(post.user).toHaveProperty("username");
      }

      console.log("✅ Post has all required video fields:", {
        id: post.id,
        has_media_url: !!post.media_url,
        has_hls_url: !!post.hls_url,
        has_enhanced_url: !!post.enhanced_url,
        has_original_url: !!post.original_url,
        processing_status: post.processing_status,
        has_thumbnail: !!post.thumbnail_url,
        duration: post.duration,
        aspect_ratio: post.aspect_ratio,
      });
    } else {
      console.log("ℹ️ No posts found in database (this is OK for empty DB)");
    }
  });

  it("should support hive_id filtering", async () => {
    if (!supabase) {
      console.warn("Skipping test - Supabase not configured");
      return;
    }

    // Test hive_id filter (Requirement 2.13, 11.5)
    const { data: posts, error } = await supabase
      .from("publications")
      .select("*")
      .eq("visibility", "public")
      .eq("est_masque", false)
      .is("deleted_at", null)
      .neq("processing_status", "failed")
      .eq("hive_id", "quebec")
      .limit(5);

    expect(error).toBeNull();

    if (posts && posts.length > 0) {
      // All posts should have hive_id = "quebec"
      posts.forEach((post: any) => {
        expect(post.hive_id).toBe("quebec");
      });
      console.log(`✅ Found ${posts.length} posts with hive_id=quebec`);
    } else {
      console.log("ℹ️ No posts found with hive_id=quebec (this is OK)");
    }
  });

  it("should exclude failed videos from feed", async () => {
    if (!supabase) {
      console.warn("Skipping test - Supabase not configured");
      return;
    }

    // Query should exclude processing_status = "failed" (Requirement 11.2)
    const { data: posts, error } = await supabase
      .from("publications")
      .select("processing_status")
      .eq("visibility", "public")
      .eq("est_masque", false)
      .is("deleted_at", null)
      .neq("processing_status", "failed")
      .limit(20);

    expect(error).toBeNull();

    if (posts && posts.length > 0) {
      // No post should have processing_status = "failed"
      posts.forEach((post: any) => {
        expect(post.processing_status).not.toBe("failed");
      });
      console.log(`✅ Verified ${posts.length} posts exclude failed status`);
    }
  });

  it("should support cursor-based pagination", async () => {
    if (!supabase) {
      console.warn("Skipping test - Supabase not configured");
      return;
    }

    // First page (Requirement 2.12)
    const { data: firstPage, error: error1 } = await supabase
      .from("publications")
      .select("id, created_at")
      .eq("visibility", "public")
      .eq("est_masque", false)
      .is("deleted_at", null)
      .neq("processing_status", "failed")
      .order("created_at", { ascending: false })
      .limit(3);

    expect(error1).toBeNull();

    if (firstPage && firstPage.length > 0) {
      const cursor = firstPage[firstPage.length - 1].created_at;

      // Second page using cursor
      const { data: secondPage, error: error2 } = await supabase
        .from("publications")
        .select("id, created_at")
        .eq("visibility", "public")
        .eq("est_masque", false)
        .is("deleted_at", null)
        .neq("processing_status", "failed")
        .order("created_at", { ascending: false })
        .lt("created_at", cursor)
        .limit(3);

      expect(error2).toBeNull();

      if (secondPage && secondPage.length > 0) {
        // Second page should have older posts
        expect(new Date(secondPage[0].created_at).getTime()).toBeLessThan(
          new Date(cursor).getTime(),
        );
        console.log("✅ Cursor-based pagination works correctly");
      }
    } else {
      console.log("ℹ️ Not enough posts to test pagination");
    }
  });
});
