import { beforeEach, describe, expect, it } from "vitest";
import {
  addRecentVideoId,
  getFeedExclusionIds,
  getPreviousSessionStartingVideoIds,
  getRecentVideoIds,
  saveSessionStartingVideoIds,
  setLastViewedVideoId,
} from "@/lib/feedSessionMemory";

describe("feedSessionMemory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps a rolling deduped history of the last 100 viewed videos", () => {
    for (let i = 0; i < 105; i++) addRecentVideoId(`video-${i}`);
    const recent = getRecentVideoIds();

    expect(recent).toHaveLength(100);
    expect(recent[0]).toBe("video-104");
    expect(recent).not.toContain("video-0");

    addRecentVideoId("video-100");
    expect(getRecentVideoIds()[0]).toBe("video-100");
    expect(new Set(getRecentVideoIds()).size).toBe(100);
  });

  it("protects the previous session opening batch but not the current one", () => {
    saveSessionStartingVideoIds("session-a", ["a", "b", "c"]);
    expect(getPreviousSessionStartingVideoIds("session-b")).toEqual([
      "a",
      "b",
      "c",
    ]);

    saveSessionStartingVideoIds("session-b", ["d", "e"]);
    expect(getPreviousSessionStartingVideoIds("session-b")).toEqual([]);
  });

  it("combines previous opening, last viewed, and recent ids without duplicates", () => {
    saveSessionStartingVideoIds("old-session", ["start-1", "shared"]);
    addRecentVideoId("recent-1");
    addRecentVideoId("shared");
    setLastViewedVideoId("last-1");

    const exclusions = getFeedExclusionIds("new-session");
    expect(exclusions.slice(0, 2)).toEqual(["start-1", "shared"]);
    expect(exclusions).toContain("last-1");
    expect(exclusions).toContain("recent-1");
    expect(exclusions.filter((id) => id === "shared")).toHaveLength(1);
  });
});
