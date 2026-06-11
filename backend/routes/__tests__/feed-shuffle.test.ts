import { describe, it, expect } from "vitest";
import { seededTierShuffle } from "../../../shared/utils/feedDedup.js";

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
