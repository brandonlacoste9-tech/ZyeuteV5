import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vuanulvyqkfefmjcikfk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1YW51bHZ5cWtmZWZtamNpa2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzczNDIsImV4cCI6MjA3OTg1MzM0Mn0.73euLyOCo-qbQyLZQkaDpzrq8RI_6G3bN_EKY-_RCq8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
  // Try to get a user
  const { data: users, error: userError } = await supabase
    .from('user_profiles')
    .select('id, username')
    .limit(1);
    
  if (userError) {
    console.error('Failed to get users:', userError.message);
    return;
  }
  
  console.log('Users:', users);
  
  if (!users || users.length === 0) {
    console.log('No users found to test with.');
    return;
  }
  
  const userId = users[0].id;
  
  // Try to insert a post
  const { data, error } = await supabase
    .from('publications')
    .insert([{
      user_id: userId,
      content: 'Test post from anon key',
      media_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      visibility: 'public',
      hive_id: 'quebec'
    }])
    .select();
  
  if (error) {
    console.error('Insert failed:', error.message);
  } else {
    console.log('Insert succeeded:', data);
  }
}

testQuery();
