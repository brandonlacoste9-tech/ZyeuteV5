
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vuanulvyqkfefmjcikfk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzczNDIsImV4cCI6MjA3OTg1MzM0Mn0.73euLyOCo-qbQyLZQkaDpzrq8RI_6G3bN_EKY-_RCq8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('🔍 Fetching posts from Supabase directly...');
  const { data, error } = await supabase
    .from('publications')
    .select('id, content, hive_id')
    .eq('hive_id', 'quebec')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Success! Found posts:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

test();
