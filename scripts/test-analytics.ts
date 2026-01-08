import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env from the current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Missing keys in .env. Bee Keeper is blind!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHive() {
  console.log('🐝 Bee Keeper (Ubuntu): Scanning the Hive for honey...');
  
  const { data, error } = await supabase
    .from('view_vibe_distribution')
    .select('*');

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('🍯 Success! The honey is flowing. Hive status:');
    console.table(data);
  }
}

checkHive();
