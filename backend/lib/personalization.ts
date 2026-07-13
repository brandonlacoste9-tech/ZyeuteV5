/**
 * Feed personalization helpers — affinity tags, region, theme matching.
 */

export const AFFINITY_TAG_CATALOG = [
  "hockey",
  "canadiens",
  "humour",
  "musique",
  "food",
  "poutine",
  "montreal",
  "quebec",
  "nature",
  "hiver",
  "voyage",
  "mode",
  "sports",
  "gaming",
  "culture",
  "festival",
  "animaux",
  "beaute",
  "auto",
  "techno",
  "nouvelles",
  "famille",
  "fitness",
  "art",
  "cinema",
] as const;

export type AffinityTag = (typeof AFFINITY_TAG_CATALOG)[number] | string;

export function normalizeTag(tag: string): string {
  return String(tag || "")
    .toLowerCase()
    .replace(/^#/, "")
    .trim()
    .slice(0, 40);
}

/** Merge new tags into existing, most-recent first, capped. */
export function mergeAffinityTags(
  existing: string[] | null | undefined,
  incoming: string[],
  cap = 30,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...incoming, ...(existing || [])]) {
    const t = normalizeTag(raw);
    if (!t || t.length < 2 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= cap) break;
  }
  return out;
}

export function extractTagsFromPost(post: {
  hashtags?: string[] | null;
  detected_themes?: string[] | null;
  detectedThemes?: string[] | null;
  caption?: string | null;
  content?: string | null;
  city?: string | null;
  region?: string | null;
  region_id?: string | null;
}): string[] {
  const tags: string[] = [];
  for (const h of post.hashtags || []) tags.push(normalizeTag(h));
  for (const t of post.detected_themes || post.detectedThemes || []) {
    tags.push(normalizeTag(t));
  }
  // Pull catalog matches from caption
  const text = `${post.caption || ""} ${post.content || ""}`.toLowerCase();
  for (const cat of AFFINITY_TAG_CATALOG) {
    if (text.includes(cat)) tags.push(cat);
  }
  if (post.city) tags.push(normalizeTag(post.city));
  if (post.region) tags.push(normalizeTag(post.region));
  if (post.region_id) tags.push(normalizeTag(post.region_id));
  return mergeAffinityTags([], tags, 40);
}

/**
 * Soft re-rank posts: viral base + affinity overlap + region match.
 * Preserves diversity when affinities empty (returns original order).
 */
export function personalizePostOrder(
  posts: Record<string, unknown>[],
  opts: {
    affinityTags?: string[];
    region?: string | null;
  },
): Record<string, unknown>[] {
  const aff = new Set(
    (opts.affinityTags || []).map(normalizeTag).filter(Boolean),
  );
  const region = normalizeTag(opts.region || "");

  if (aff.size === 0 && !region) return posts;

  const scored = posts.map((p, index) => {
    const viral = Number(p.viral_score) || 0;
    const tags = extractTagsFromPost(p as any);
    let affinityHits = 0;
    for (const t of tags) {
      if (aff.has(t)) affinityHits += 1;
    }
    // Partial caption token hits
    const caption = `${p.caption || ""} ${p.content || ""}`.toLowerCase();
    for (const a of aff) {
      if (a.length >= 3 && caption.includes(a)) affinityHits += 0.5;
    }

    let regionBoost = 0;
    if (region) {
      const hive = String(p.hive_id || "").toLowerCase();
      const pr = normalizeTag(String(p.region || p.region_id || ""));
      const city = normalizeTag(String(p.city || ""));
      if (hive === region || pr === region || city === region) regionBoost = 20;
      if (hive === "quebec" && (region === "quebec" || region === "montreal"))
        regionBoost = Math.max(regionBoost, 10);
    }

    // Blend: keep viral as main signal, affinity as strong nudge
    const personal =
      viral + affinityHits * 8000 + regionBoost * 500 - index * 0.01;

    return { p, personal, affinityHits };
  });

  scored.sort((a, b) => b.personal - a.personal);
  return scored.map((s) => ({
    ...s.p,
    _affinity_hits: s.affinityHits,
  }));
}
