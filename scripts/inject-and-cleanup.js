// Inject test videos and clean up null URL posts
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Minimal fields matching what inject-stock-videos.ts uses
const TEST_VIDEOS = [
  {
    caption: '⚜️ DIAGNOSTIC: Big Buck Bunny (Google Sample)',
    media_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'video',
    reactions_count: 888888,
    hive_id: 'quebec',
    user_id: '27e6a0ec-4b73-45d7-b391-9e831a210524',
    content: 'DIAGNOSTIC TEST - Native HTML5 Video Player',
  },
  {
    caption: '🔥 DIAGNOSTIC: For Bigger Blazes (Short Clip)',
    media_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video',
    reactions_count: 777777,
    hive_id: 'quebec',
    user_id: '27e6a0ec-4b73-45d7-b391-9e831a210524',
    content: 'DIAGNOSTIC TEST - Shorter video for quick validation',
  },
];

async function run() {
  console.log('🔧 VIDEO DIAGNOSTIC: Inject & Cleanup\n');

  // 1. Delete posts with NULL media_url that are type=video
  console.log('1️⃣ Cleaning up NULL URL video posts...');
  const { data: nullPosts, error: fetchError } = await supabase
    .from('publications')
    .select('id')
    .eq('type', 'video')
    .is('media_url', null);

  if (fetchError) {
    console.log('   Error fetching:', fetchError.message);
  } else if (nullPosts && nullPosts.length > 0) {
    console.log(`   Found ${nullPosts.length} posts with NULL URLs`);
    for (const post of nullPosts) {
      const { error: delError } = await supabase
        .from('publications')
        .delete()
        .eq('id', post.id);
      if (!delError) {
        console.log(`   ✅ Deleted: ${post.id}`);
      }
    }
  } else {
    console.log('   ✅ No NULL URL posts found');
  }

  // 2. Remove old diagnostic posts
  console.log('\n2️⃣ Removing old diagnostic posts...');
  const { error: diagError } = await supabase
    .from('publications')
    .delete()
    .ilike('caption', '%DIAGNOSTIC%');

  if (diagError) {
    console.log('   Error:', diagError.message);
  } else {
    console.log('   ✅ Old diagnostic posts removed');
  }

  // 3. Insert new test videos
  console.log('\n3️⃣ Injecting Google sample videos...');
  for (const video of TEST_VIDEOS) {
    const { data, error } = await supabase
      .from('publications')
      .insert([video])
      .select();

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Inserted: ${data[0].id}`);
      console.log(`      Caption: ${video.caption}`);
      console.log(`      URL: ${video.media_url.substring(0, 60)}...`);
    }
  }

  // 4. Final count
  console.log('\n4️⃣ Final video count...');
  const { data: videos, error: countError } = await supabase
    .from('publications')
    .select('id, caption, media_url')
    .eq('type', 'video');

  if (!countError) {
    console.log(`   📊 Total videos: ${videos.length}`);
    console.log('\n   Video list:');
    videos.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.caption?.substring(0, 40) || 'No caption'}`);
      console.log(`      ${v.media_url?.substring(0, 60) || 'No URL'}...`);
    });
  }

  console.log('\n✨ DONE! Navigate to /feed to test videos.');
}

run().then(() => process.exit(0));
