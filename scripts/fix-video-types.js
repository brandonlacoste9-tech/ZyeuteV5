// Fix video posts that have image URLs - change their type to "photo"
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVideoTypes() {
  console.log('🔧 Fixing mismatched video/image types...\n');

  // Find all "video" posts that have image URLs
  const { data: videos, error } = await supabase
    .from('publications')
    .select('id, caption, media_url, type')
    .eq('type', 'video');

  if (error) {
    console.log('ERROR:', error.message);
    return;
  }

  let fixCount = 0;

  for (const post of videos) {
    const url = post.media_url || '';

    // Check if this is an image URL, not a video
    const isImageUrl =
      url.includes('unsplash.com') ||
      url.includes('pexels.com') ||
      url.endsWith('.jpg') ||
      url.endsWith('.jpeg') ||
      url.endsWith('.png') ||
      url.endsWith('.webp') ||
      url.endsWith('.gif');

    if (isImageUrl) {
      console.log(`🔧 Fixing: ${post.id}`);
      console.log(`   Caption: ${post.caption?.substring(0, 40) || 'null'}`);
      console.log(`   URL: ${url.substring(0, 50)}...`);
      console.log(`   Changing type: video -> photo`);
      console.log('');

      const { error: updateError } = await supabase
        .from('publications')
        .update({ type: 'photo' })
        .eq('id', post.id);

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`);
      } else {
        fixCount++;
        console.log(`   ✅ Fixed!`);
      }
    }
  }

  console.log('='.repeat(60));
  console.log(`\n✨ Fixed ${fixCount} posts (changed type from video to photo)`);

  // Verify the fix
  const { data: remaining, error: countError } = await supabase
    .from('publications')
    .select('id', { count: 'exact' })
    .eq('type', 'video');

  if (!countError) {
    console.log(`\n📊 Remaining video posts: ${remaining.length}`);
  }
}

fixVideoTypes().then(() => process.exit(0));
