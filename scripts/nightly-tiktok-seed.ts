/**
 * TikTok Feed Seeder — pulls real Quebec TikTok content via TIKAPI
 * and inserts into Supabase publications table
 */
import TikAPI from '/home/user/workspace/ZyeuteV5/node_modules/tikapi/index.js';

const SUPABASE_URL = 'https://vuanulvyqkfefmjcikfk.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI3NzM0MiwiZXhwIjoyMDc5ODUzMzQyfQ.GwIXwDWfdBb14R85wSyWIvwFmGNZruURlNQm8OcPyjY';

const api = (TikAPI as any)('yXLCoviSdnsjASe0N2aso6kmdnGPeZt8Ud9vJlRIPKKVtfUf');

// Quebec-focused hashtags with known IDs
const HASHTAGS = [
  { name: 'montreal',  id: '36966',   region: 'montreal' },
  { name: 'quebec',    id: '13725',   region: 'quebec' },
  { name: 'quebecois', id: '4764129', region: 'quebec' },
  { name: 'mtl',       id: '84124',   region: 'montreal' },
  { name: 'canada',    id: '2703',    region: 'other' },
  { name: 'hiver',     id: null,      region: 'quebec' },
  { name: 'neige',     id: null,      region: 'quebec' },
  { name: 'foodtiktok',id: null,      region: 'montreal' },
  { name: 'dance',     id: null,      region: 'montreal' },
  { name: 'viral',     id: null,      region: 'montreal' },
];

async function getHashtagId(name: string): Promise<string | null> {
  try {
    const res = await api.public.hashtag({ name });
    return res?.json?.challengeInfo?.challenge?.id || null;
  } catch { return null; }
}

async function fetchHashtagVideos(id: string, count = 15): Promise<any[]> {
  try {
    const res = await api.public.hashtag({ id, count });
    return res?.json?.itemList || res?.json?.item_list || [];
  } catch { return []; }
}

async function getUserId(): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id&limit=1`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, apikey: SERVICE_ROLE }
  });
  const rows = await res.json() as any[];
  return rows[0]?.id || null;
}

async function insertBatch(posts: any[]): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/publications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(posts),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('\n  ❌ Insert error:', err.slice(0, 200));
    return 0;
  }
  return posts.length;
}

async function main() {
  console.log('🎵 TikTok Feed Seeder\n');

  const userId = await getUserId();
  if (!userId) { console.error('❌ No user found'); process.exit(1); }
  console.log(`✅ User: ${userId}\n`);

  const allVideos: any[] = [];
  const seenIds = new Set<string>();

  for (const tag of HASHTAGS) {
    // Get ID if not hardcoded
    const id = tag.id || await getHashtagId(tag.name);
    if (!id) { console.log(`  #${tag.name}: no ID found, skipping`); continue; }

    const items = await fetchHashtagVideos(id, 20);
    let added = 0;

    for (const item of items) {
      const tiktokId = item.id as string;
      if (!tiktokId || seenIds.has(tiktokId)) continue;

      const v = item.video || {};
      const author = item.author || {};
      const stats = item.stats || item.statistics || {};

      // Get best play URL (with TikTok CDN headers needed, store as tiktok_url for embed)
      const playUrls: string[] = v.playAddr?.urlList || v.bitrateInfo?.[0]?.PlayAddr?.UrlList || [];
      const coverUrl: string = v.cover || v.dynamicCover || v.originCover || '';
      const tiktokUrl = `https://www.tiktok.com/@${author.uniqueId || author.nickname || 'user'}/video/${tiktokId}`;

      // Only take videos with decent engagement
      const plays = stats.playCount || stats.play_count || 0;
      if (plays < 5000) continue;

      seenIds.add(tiktokId);
      allVideos.push({
        user_id: userId,
        caption: (item.desc || `#${tag.name} 🍁`).slice(0, 500),
        content: (item.desc || `#${tag.name} 🍁`).slice(0, 500),
        type: 'video',
        // Use the play URL directly — works for embedding with proper headers
        media_url: playUrls[0] || tiktokUrl,
        thumbnail_url: coverUrl || null,
        tiktok_url: tiktokUrl,
        video_source: 'tiktok',
        hls_url: null,
        duration: v.duration || null,
        processing_status: 'completed',
        is_moderated: true,
        moderation_approved: true,
        est_masque: false,
        hive_id: 'quebec',
        region: tag.region,
        visibility: 'public',
        visibilite: 'public',
        reactions_count: stats.diggCount || stats.digg_count || 0,
        view_count: plays,
        comments_count: stats.commentCount || stats.comment_count || 0,
        shares_count: stats.shareCount || stats.share_count || 0,
        viral_score: Math.min(100, Math.floor(plays / 10000)),
      });
      added++;
    }

    console.log(`  #${tag.name} (${id}): +${added} videos (total: ${allVideos.length})`);
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n📊 Total TikTok videos: ${allVideos.length}\n`);
  if (!allVideos.length) { console.log('No TikTok videos found.'); return; }

  // Sort by viral score (most popular first)
  allVideos.sort((a, b) => b.view_count - a.view_count);

  console.log('💾 Inserting into Supabase...');
  let total = 0;
  for (let i = 0; i < allVideos.length; i += 20) {
    const n = await insertBatch(allVideos.slice(i, i + 20));
    total += n;
    process.stdout.write(`\r  Progress: ${total}/${allVideos.length}`);
  }
  console.log('\n');

  const r = await fetch(`${SUPABASE_URL}/rest/v1/publications?select=count`, {
    headers: { Authorization: `Bearer ${SERVICE_ROLE}`, apikey: SERVICE_ROLE, Prefer: 'count=exact', Range: '0-0' }
  });
  const totalPosts = r.headers.get('content-range')?.split('/')[1] || '?';
  console.log(`✅ Feed now has ${totalPosts} total posts (Pexels + TikTok)`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

// This file is run nightly via cron to refresh the TikTok feed
// Run: npx tsx scripts/nightly-tiktok-seed.ts
