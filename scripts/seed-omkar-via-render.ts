/**
 * Pull popular TikToks from Omkar (trending + most_liked search) → Render Mux pipeline.
 *
 *   npx tsx scripts/seed-omkar-via-render.ts --limit=15
 *   npx tsx scripts/seed-omkar-via-render.ts --query=#montreal --no-trending --limit=15
 *
 * Optional: CRON_SECRET in .env.local for POST /api/seed/custom on production.
 */
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import {
  mapOmkarItemToVideo,
  type TikTokVideo,
} from "../backend/services/tiktok-scraper-service.js";
import type { FeedSeedCandidate } from "../backend/services/tikapi-hashtag.js";

const API_BASE = process.env.SEED_API_BASE || "https://zyeutev5-1.onrender.com";
const OMKAR = "https://tiktok-scraper.omkar.cloud";
const KEY = process.env.TIKTOK_SCRAPER_API_KEY?.trim();
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://vuanulvyqkfezmjcikfk.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzczNDIsImV4cCI6MjA3OTg1MzM0Mn0.73euLyOCo-qbQyLZQkaDpzrq8RI_6G3bN_EKY-_RCq8";

function parseArg(name: string, fallback: number): number {
  const arg = process.argv.find((x) => x.startsWith(`--${name}=`));
  const n = arg ? Number(arg.split("=")[1]) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseStringArg(name: string): string | undefined {
  const arg = process.argv.find((x) => x.startsWith(`--${name}=`));
  if (!arg) return undefined;
  const val = arg.slice(name.length + 3).trim();
  return val || undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function fetchPopular(options: {
  queries: string[];
  includeTrending: boolean;
  maxPerQuery: number;
}): Promise<TikTokVideo[]> {
  if (!KEY) throw new Error("TIKTOK_SCRAPER_API_KEY missing in .env.local");

  const seen = new Set<string>();
  const out: TikTokVideo[] = [];
  const push = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const raw of list) {
      const v = mapOmkarItemToVideo(raw as Record<string, unknown>);
      if (!v || seen.has(v.video_id)) continue;
      seen.add(v.video_id);
      out.push(v);
    }
  };

  if (options.includeTrending) {
    console.log("📈 Omkar trending (CA)…");
    const trending = await axios.get(`${OMKAR}/tiktok/videos/trending`, {
      params: { market: "ca", max_results: 20 },
      headers: omkarHeaders(),
      timeout: 45000,
    });
    push(trending.data?.videos);
  }

  for (const q of options.queries) {
    console.log(`🔍 Omkar search "${q}" (most_liked)…`);
    const search = await axios.get(`${OMKAR}/tiktok/videos/search`, {
      params: {
        search_query: q,
        market: "ca",
        max_results: options.maxPerQuery,
        sort_by: "most_liked",
      },
      headers: omkarHeaders(),
      timeout: 45000,
    });
    push(search.data?.videos);
  }

  out.sort((a, b) => (b.stats?.views ?? 0) - (a.stats?.views ?? 0));
  return out;
}

function omkarHeaders() {
  return { "API-Key": KEY || "" };
}

const DEFAULT_QUERIES = [
  "#montreal",
  "#laval",
  "#vaudreuil",
  "#sherbrooke",
  "quebec city",
  "#quebec",
  "viral",
  "fyp",
  "funny",
  "comedy",
];

function toCandidate(v: TikTokVideo): FeedSeedCandidate {
  return {
    video: { ...v, provider: "omkar" },
    region: "montreal",
    source: "omkar-popular",
  };
}

async function main() {
  const limit = parseArg("limit", 15);
  const cron = process.env.CRON_SECRET?.trim().replace(/^["']+|["']+$/g, "");
  const focusQuery = parseStringArg("query");
  const queries = focusQuery ? [focusQuery] : DEFAULT_QUERIES;
  const includeTrending = focusQuery ? false : !hasFlag("no-trending");
  const maxPerQuery = focusQuery ? parseArg("max", 25) : 10;

  console.log(`🌐 Remote seed via ${API_BASE}/api/seed/custom\n`);
  if (focusQuery) {
    console.log(`🎯 Focus query: ${focusQuery}\n`);
  }

  const popular = await fetchPopular({
    queries,
    includeTrending,
    maxPerQuery,
  });
  console.log(`   ${popular.length} unique candidates`);
  popular
    .slice(0, 5)
    .forEach((v) =>
      console.log(
        `   • ${(v.stats?.views ?? 0).toLocaleString()} views @${v.author.handle}`,
      ),
    );

  const candidates = popular.slice(0, limit).map(toCandidate);
  if (!candidates.length) {
    console.error("❌ No importable videos from Omkar");
    process.exit(1);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cron) {
    headers["x-cron-secret"] = cron;
  }

  const batchSize = 1;
  const delayMs = parseArg("delay", 8000);
  let totalImported = 0;
  let totalMux = 0;

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const res = await fetch(`${API_BASE}/api/seed/custom`, {
      method: "POST",
      headers,
      body: JSON.stringify({ candidates: batch }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(
        `❌ Video ${i + 1} failed (${res.status}):`,
        text.slice(0, 400),
      );
      if (res.status === 401 && !cron) {
        console.error(
          "\nAdd CRON_SECRET to .env.local (Render → Environment) and re-run.",
        );
      }
      if (i + batchSize < candidates.length && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
      continue;
    }

    const json = JSON.parse(text) as {
      imported?: number;
      muxIngested?: number;
      message?: string;
    };
    totalImported += json.imported ?? 0;
    totalMux += json.muxIngested ?? 0;
    console.log(
      `✅ ${i + 1}/${candidates.length}: +${json.imported ?? 0} — @${batch[0]?.video.author.handle}`,
    );
    if (i + batchSize < candidates.length && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  if (totalImported === 0) process.exit(1);

  console.log(`\n✅ Total imported=${totalImported} mux=${totalMux}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { count } = await supabase
    .from("publications")
    .select("id", { count: "exact", head: true })
    .eq("visibility", "public");
  console.log(`\n📊 Public posts (anon count): ${count ?? "?"}`);
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
