import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: albums } = await supabase.from('Gallery_Albums').select('*').eq('Gallery_ID', 6);
  const { data: media } = await supabase.from('Gallery_Media').select('*').eq('Gallery_ID', 6);
  console.log("Albums:", JSON.stringify(albums, null, 2));
  console.log("Media:", JSON.stringify(media, null, 2));
}
check();
