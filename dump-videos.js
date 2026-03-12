const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://vuanulvyqkfefmjcikfk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI3NzM0MiwiZXhwIjoyMDc5ODUzMzQyfQ.GwIXwDWfdBb14R85wSyWIvwFmGNZruURlNQm8OcPyjY'
);

async function dumpVideos() {
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('type', 'video')
    .limit(10);

  if (error) {
    console.error('Error fetching videos:', error.message);
    return;
  }

  fs.writeFileSync('videos-dump.json', JSON.stringify(data, null, 2));
  console.log('Dumped 10 videos to videos-dump.json');
}

dumpVideos();
