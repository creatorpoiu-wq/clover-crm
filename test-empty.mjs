import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: gal } = await supabase.from('Galleries').insert([{ Title: 'Empty Test', Slug: 'empty-test', User_ID: '737416f3-f899-4492-a26f-e4e0d97426fe', Gallery_Type: 'photos', Is_Published: true }]).select();
  
  const res = await fetch(`https://clover-crm.vercel.app/api/galleries/empty-test?public=true`);
  const json = await res.json();
  console.log("Empty Gallery JSON:", JSON.stringify(json, null, 2));
}
check();
