import { describe, it, expect } from "vitest";
import {
  seededTierShuffle,
  unseenFirst,
} from "../../../shared/utils/feedDedup.js";

/** Ranked fixture pool (already sorted best-first, like the feed query). */
function makePool(n: number): { id: string; viral_score: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `post-${i}`,
    viral_score: n - i,
  }));
}

/**
 * Mirrors the block-pagination slicing in getPostsViaSupabase: a single ranked
 * block is tier-shuffled once with the (seed, blockIndex) pair, then pages are
 * sliced out of that shuffled block.
 */
function pageFromBlock<T>(
  block: T[],
  seed: number,
  blockIndex: number,
  offsetInBlock: number,
  limit: number,
): T[] {
  const shuffled = seededTierShuffle(
    block,
    (seed + blockIndex * 2654435761) >>> 0,
  );
  return shuffled.slice(offsetInBlock, offsetInBlock + limit);
}

describe("seededTierShuffle", () => {
  it("returns the same order for the same seed", () => {
    const pool = makePool(60);
    const a = seededTierShuffle(pool, 12345);
    const b = seededTierShuffle(pool, 12345);
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id));
  });

  it("returns a different order for different seeds", () => {
    const pool = makePool(60);
    const a = seededTierShuffle(pool, 12345);
    const b = seededTierShuffle(pool, 67890);
    expect(a.map((p) => p.id)).not.toEqual(b.map((p) => p.id));
  });

  it("is a permutation — no items added, dropped, or duplicated", () => {
    const pool = makePool(60);
    const shuffled = seededTierShuffle(pool, 42);
    expect(shuffled).toHaveLength(pool.length);
    expect(new Set(shuffled.map((p) => p.id)).size).toBe(pool.length);
    expect([...shuffled.map((p) => p.id)].sort()).toEqual(
      [...pool.map((p) => p.id)].sort(),
    );
  });

  it("preserves quality bias: top-ranked items stay in the top region", () => {
    const pool = makePool(100);
    const shuffled = seededTierShuffle(pool, 999, 10);
    // With tierSize 10, the highest-ranked 10 items only permute within slots
    // 0–9, so every one of them stays in the first tier.
    const topTenIds = new Set(pool.slice(0, 10).map((p) => p.id));
    const firstTierIds = new Set(shuffled.slice(0, 10).map((p) => p.id));
    expect(firstTierIds).toEqual(topTenIds);
  });

  it("handles empty and single-element pools", () => {
    expect(seededTierShuffle([], 1)).toEqual([]);
    expect(seededTierShuffle([{ id: "x" }], 1)).toEqual([{ id: "x" }]);
  });
});

describe("seeded feed pagination", () => {
  it("has no duplicates across pages within one block + seed", () => {
    const seed = 555;
    const limit = 20;
    const block = makePool(120); // == FEED_BLOCK_SIZE
    const seen = new Set<string>();
    for (let page = 0; page < 6; page++) {
      const offsetInBlock = (page * limit) % 120;
      const pageItems = pageFromBlock(block, seed, 0, offsetInBlock, limit);
      for (const item of pageItems) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
    }
    // All 120 block items surfaced exactly once across the 6 pages.
    expect(seen.size).toBe(120);
  });

  it("returns identical pages when the same seed is replayed", () => {
    const block = makePool(120);
    const first = pageFromBlock(block, 777, 0, 0, 20);
    const replay = pageFromBlock(block, 777, 0, 0, 20);
    expect(first.map((p) => p.id)).toEqual(replay.map((p) => p.id));
  });

  it("yields a different first page for a different seed", () => {
    const block = makePool(120);
    const a = pageFromBlock(block, 111, 0, 0, 20);
    const b = pageFromBlock(block, 222, 0, 0, 20);
    expect(a.map((p) => p.id)).not.toEqual(b.map((p) => p.id));
  });
});

describe("unseenFirst", () => {
  const pool = makePool(10);

  it("returns the original order when nothing is watched", () => {
    const out = unseenFirst(pool, new Set());
    expect(out.map((p) => p.id)).toEqual(pool.map((p) => p.id));
  });

  it("moves watched posts after unseen ones, stable within each group", () => {
    // Mark a few mid-list posts as watched.
    const seen = new Set(["post-1", "post-4", "post-7"]);
    const out = unseenFirst(pool, seen).map((p) => p.id);

    const unseen = pool.map((p) => p.id).filter((id) => !seen.has(id));
    const watched = pool.map((p) => p.id).filter((id) => seen.has(id));

    // Unseen come first in their original relative order…
    expect(out.slice(0, unseen.length)).toEqual(unseen);
    // …then the watched ones, also in original relative order.
    expect(out.slice(unseen.length)).toEqual(watched);
  });

  it("never drops, adds, or duplicates posts", () => {
    const seen = new Set(["post-2", "post-3", "post-9"]);
    const out = unseenFirst(pool, seen);
    expect(out).toHaveLength(pool.length);
    expect([...out.map((p) => p.id)].sort()).toEqual(
      [...pool.map((p) => p.id)].sort(),
    );
  });

  it("falls back to the full ranked list when every post is watched", () => {
    const seen = new Set(pool.map((p) => p.id));
    const out = unseenFirst(pool, seen);
    // No empty feed — original order is preserved untouched.
    expect(out.map((p) => p.id)).toEqual(pool.map((p) => p.id));
  });

  it("composes with the tier shuffle: unseen-first over a shuffled block", () => {
    const block = makePool(120);
    const shuffled = seededTierShuffle(block, 4242);
    const seen = new Set(
      shuffled.slice(0, 30).map((p) => p.id), // pretend the first 30 were watched
    );
    const out = unseenFirst(shuffled, seen);
    const splitAt = shuffled.length - seen.size;
    // Everything before the split is unseen, everything after is watched.
    expect(out.slice(0, splitAt).every((p) => !seen.has(p.id))).toBe(true);
    expect(out.slice(splitAt).every((p) => seen.has(p.id))).toBe(true);
    // Still a permutation of the block.
    expect(new Set(out.map((p) => p.id)).size).toBe(block.length);
  });
});
