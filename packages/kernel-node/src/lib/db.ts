
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️ [Synapse] Warning: Database credentials missing. The Hive Mind will be unable to remember.');
}

// The Kernel uses the Service Role key to bypass RLS for background tasks
export const db = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
