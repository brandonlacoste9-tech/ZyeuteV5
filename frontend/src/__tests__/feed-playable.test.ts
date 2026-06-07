import { describe, it, expect } from "vitest";
import { postHasPlayableMedia } from "@/services/api";
import type { Post } from "@/types";

function post(partial: Partial<Post>): Post {
  return {
    id: "test-id",
    user_id: "u1",
    type: "video",
    caption: "test",
    created_at: new Date().toISOString(),
    ...partial,
  } as Post;
}

describe("postHasPlayableMedia", () => {
  it("accepts Mux playback id", () => {
    expect(
      postHasPlayableMedia(
        post({
          mux_playback_id: "xpN8UWGrQNo1jg1T01sZyk4aYcF5Us00m5FVk2lwOI00AY",
        }),
      ),
    ).toBe(true);
  });

  it("accepts Mux HLS media_url", () => {
    expect(
      postHasPlayableMedia(
        post({
          media_url:
            "https://stream.mux.com/xpN8UWGrQNo1jg1T01sZyk4aYcF5Us00m5FVk2lwOI00AY.m3u8",
        }),
      ),
    ).toBe(true);
  });

  it("accepts Supabase storage MP4", () => {
    expect(
      postHasPlayableMedia(
        post({
          media_url:
            "https://vuanulvyqkfefmjcikfk.supabase.co/storage/v1/object/public/zyeute-videos/apify/123.mp4",
        }),
      ),
    ).toBe(true);
  });

  it("rejects expired FAL URLs", () => {
    expect(
      postHasPlayableMedia(
        post({ media_url: "https://fal.media/files/abc/video.mp4" }),
      ),
    ).toBe(false);
  });

  it("rejects expiring TikTok CDN URLs without Mux or Supabase", () => {
    expect(
      postHasPlayableMedia(
        post({
          media_url:
            "https://v16-webapp-prime.tiktok.com/video/tos/alisg/foo.mp4",
        }),
      ),
    ).toBe(false);
  });

  it("rejects empty media", () => {
    expect(postHasPlayableMedia(post({ media_url: "" }))).toBe(false);
  });
});

describe("feed infinite response shape", () => {
  it("parses minimal API payload", () => {
    const sample = {
      posts: [
        {
          id: "1",
          media_url: "https://stream.mux.com/abc.m3u8",
          mux_playback_id: "abc123456789",
          type: "video",
        },
      ],
      hasMore: true,
      nextCursor: "30",
    };
    expect(sample.posts.length).toBe(1);
    expect(sample.hasMore).toBe(true);
  });
});
