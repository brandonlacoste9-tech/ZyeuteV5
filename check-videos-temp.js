const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://vuanulvyqkfefmjcikfk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI3NzM0MiwiZXhwIjoyMDc5ODUzMzQyfQ.GwIXwDWfdBb14R85wSyWIvwFmGNZruURlNQm8OcPyjY'
);

supabase
  .from('publications')
  .select('id, caption, media_url, mux_playback_id, type')
  .eq('type', 'video')
  .limit(10)
  .then(({ data, error }) => {
    if (error) console.log('Error:', error.message);
    else {
      console.log('Total videos:', data?.length);
      data?.forEach(v => {
        const hasMedia = !!v.media_url;
        const hasMux = !!v.mux_playback_id;
        console.log(`- ${hasMedia ? 'HAS' : 'MISSING'} media_url | ${hasMux ? 'HAS' : 'MISSING'} mux | ${v.caption?.slice(0,40)}`);
      });
    }
  });
