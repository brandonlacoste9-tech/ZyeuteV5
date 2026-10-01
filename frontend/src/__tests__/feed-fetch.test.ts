import { afterEach, describe, expect, it, vi } from "vitest";
import { getInfiniteFeedPosts } from "@/services/api";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
  supabaseCredentialsMissing: true,
  getSessionWithTimeout: vi.fn().mockResolvedValue({ data: { session: null } }),
}));
vi.mock("@/lib/watchTracking", () => ({ getGuestSeenForRequest: () => [] }));
vi.mock("@/lib/qc-street-clips", () => ({
  getQcStreetPosts: () => [{ id: "local-old-clip", type: "video", media_url: "https://example.com/old.mp4" }],
}));

afterEach(() => {
  vi.unstubAllGlobals();
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
