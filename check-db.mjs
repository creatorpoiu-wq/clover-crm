import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: g } = await supabase.from('Galleries').select('*').ilike('Slug', 'chris-emily').single();
  if (!g) return console.log('no gallery');
  const { data } = await supabase.from('Gallery_Media').select('*').eq('Gallery_ID', g.Gallery_ID).eq('Type', 'video');
  console.log("Videos:", data);
}
check();
