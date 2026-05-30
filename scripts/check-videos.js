// Check for diagnostic videos
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking for diagnostic videos...');

  // Check for videos with high reaction count (our test videos have 888888, 777777, 666666)
  const { data, error } = await supabase
    .from('publications')
    .select('id, caption, media_url, type, reactions_count')
    .or('reactions_count.gte.500000,caption.ilike.%DIAGNOSTIC%')
    .order('reactions_count', { ascending: false })
    .limit(10);

  if (error) {
    console.log('ERROR:', error.message);
    return;
  }

  console.log('Found', data.length, 'high-reaction or diagnostic posts:');
  data.forEach(d => {
    console.log('  ID:', d.id);
    console.log('  Caption:', d.caption?.substring(0, 60) || 'null');
    console.log('  Type:', d.type);
    console.log('  Media URL:', d.media_url?.substring(0, 60) || 'null');
    console.log('  Reactions:', d.reactions_count);
    console.log('  ---');
  });

  // Also check total video count
  const { data: videoData, error: videoError } = await supabase
    .from('publications')
    .select('id', { count: 'exact' })
    .eq('type', 'video');

  if (!videoError) {
    console.log('\nTotal videos in database:', videoData?.length || 0);
  }
}

check().then(() => process.exit(0));
