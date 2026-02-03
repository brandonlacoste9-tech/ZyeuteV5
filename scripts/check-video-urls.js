// Check video URLs for validity
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Analyzing video URLs...\n');

  const { data, error } = await supabase
    .from('publications')
    .select('id, caption, media_url, type')
    .eq('type', 'video')
    .order('reactions_count', { ascending: false })
    .limit(20);

  if (error) {
    console.log('ERROR:', error.message);
    return;
  }

  let validCount = 0;
  let invalidCount = 0;
  let imageUrlCount = 0;
  let nullUrlCount = 0;

  console.log('Video URL Analysis:');
  console.log('='.repeat(60));

  data.forEach(d => {
    const url = d.media_url;
    let status = '❓';

    if (!url) {
      nullUrlCount++;
      status = '❌ NULL URL';
    } else if (url.includes('unsplash.com') || url.includes('.jpg') || url.includes('.png') || url.includes('.webp')) {
      imageUrlCount++;
      status = '🖼️ IMAGE (not video!)';
    } else if (url.includes('.mp4') || url.includes('vimeo') || url.includes('mux.com') || url.includes('youtube')) {
      validCount++;
      status = '✅ VALID VIDEO';
    } else {
      invalidCount++;
      status = '⚠️ UNKNOWN FORMAT';
    }

    console.log(`${status}`);
    console.log(`   Caption: ${d.caption?.substring(0, 50) || 'null'}`);
    console.log(`   URL: ${url?.substring(0, 70) || 'null'}`);
    console.log('');
  });

  console.log('='.repeat(60));
  console.log('SUMMARY:');
  console.log(`  ✅ Valid video URLs: ${validCount}`);
  console.log(`  🖼️ Image URLs (wrong!): ${imageUrlCount}`);
  console.log(`  ❌ Null URLs: ${nullUrlCount}`);
  console.log(`  ⚠️ Unknown format: ${invalidCount}`);
  console.log('');

  if (imageUrlCount > 0) {
    console.log('⚠️ PROBLEM FOUND: Some "video" posts have IMAGE URLs!');
    console.log('   This will cause the video player to fail.');
    console.log('   Fix: Update these posts to have proper video URLs or change type to "photo"');
  }
}

check().then(() => process.exit(0));
