const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vuanulvyqkfefmjcikfk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDI3NzM0MiwiZXhwIjoyMDc5ODUzMzQyfQ.GwIXwDWfdBb14R85wSyWIvwFmGNZruURlNQm8OcPyjY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuery() {
  console.log('Testing infinite feed query...');
  
  const limit = 20;
  const hiveId = 'quebec';

  const { data: posts, error } = await supabase
    .from("publications")
    .select(`
      *,
      user:user_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("visibility", "public")
    .eq("est_masque", false)
    .is("deleted_at", null)
    .eq("hive_id", hiveId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log('Success! Fetched', posts.length, 'posts.');
    if (posts.length > 0) {
      console.log('First post user:', posts[0].user);
    }
  }
}

debugQuery();
