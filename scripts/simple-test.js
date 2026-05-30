// Simple test script using CommonJS
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'NOT SET');
console.log('Supabase Key:', supabaseKey ? 'Set (' + supabaseKey.substring(0, 10) + '...)' : 'NOT SET');

if (!supabaseKey) {
  console.log('ERROR: Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing database connection...');

  const { data, error } = await supabase
    .from('publications')
    .select('id, caption')
    .limit(3);

  if (error) {
    console.log('ERROR:', error.message);
  } else {
    console.log('SUCCESS! Found', data.length, 'publications');
    data.forEach(d => console.log('  -', d.id, d.caption?.substring(0, 30)));
  }
}

test().then(() => process.exit(0)).catch(e => {
  console.log('CATCH:', e.message);
  process.exit(1);
});
