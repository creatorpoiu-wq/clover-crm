import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function setup() {
  const { data, error } = await supabase.from('Gallery_Favorites').select('*').limit(1);
  console.log("Gallery_Favorites:", data, "Error:", error);

  const { data: g, error: gError } = await supabase.from('Galleries').select('Enable_Proofing').limit(1);
  console.log("Galleries Enable_Proofing:", g, "Error:", gError);
}

setup();
