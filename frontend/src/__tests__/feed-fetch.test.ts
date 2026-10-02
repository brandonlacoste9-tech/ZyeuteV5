import { afterEach, describe, expect, it, vi } from "vitest";
import { getInfiniteFeedPosts } from "@/services/api";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
  supabaseCredentialsMissing: true,
  getSessionWithTimeout: vi.fn().mockResolvedValue({ data: { session: null } }),
}));
vi.mock("@/lib/qc-street-clips", () => ({
  getQcStreetPosts: () => [{ id: "local-old-clip", type: "video", media_url: "https://example.com/old.mp4" }],
}));

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("main video feed requests", () => {
  it("requests a session shuffle and keeps real uploads ahead of fallback clips", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        posts: [{ id: "new-upload", type: "video", media_url: "https://example.com/new.mp4" }],
        hasMore: true,
        nextCursor: "30-123",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await getInfiniteFeedPosts("explore", { sessionId: "fresh-session" });
    const [url, init] = fetchMock.mock.calls[0];
    const params = new URL(url, "https://example.com").searchParams;
    expect(params.get("sort")).toBe("shuffle");
    expect(params.get("session")).toBe("fresh-session");
    expect(init.cache).toBe("no-store");
    expect(result.posts.map(p => p.id)).toEqual(["new-upload"]);
    expect(result.nextCursor).toBe("30-123");
  });

  it("allows an explicit newest view", async () => {
    window.history.replaceState({}, "", "/?sort=newest");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [], hasMore: false }) });
    vi.stubGlobal("fetch", fetchMock);
    await getInfiniteFeedPosts("explore");
    expect(new URL(fetchMock.mock.calls[0][0], "https://example.com").searchParams.get("sort")).toBe("newest");
  });
});


  it("sends recent and previous-session opening ids as exclusions", async () => {
    localStorage.setItem(
      "zyeute_recent_video_ids_v2",
      JSON.stringify(["11111111-1111-4111-8111-111111111111"]),
    );
    localStorage.setItem(
      "zyeute_feed_session_start_v1",
      JSON.stringify({
        sessionId: "old-session",
        videoIds: ["22222222-2222-4222-8222-222222222222"],
        savedAt: Date.now(),
      }),
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        posts: [{ id: "fresh", type: "video", media_url: "https://example.com/fresh.mp4" }],
        hasMore: false,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getInfiniteFeedPosts("explore", { sessionId: "new-session" });

    const [, init] = fetchMock.mock.calls[0];
    const seenHeader = String(init.headers["x-seen-ids"] || "");
    expect(seenHeader).toContain("11111111-1111-4111-8111-111111111111");
    expect(seenHeader).toContain("22222222-2222-4222-8222-222222222222");
  });
