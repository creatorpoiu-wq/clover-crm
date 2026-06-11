import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('Contracts')
    .update({ Type: 'Contract' })
    .eq('Type', 'Proposal')
    .eq('Status', 'Signed')
    .select();
    
  if (error) console.error('Error:', error);
  else console.log('Updated signed proposals to contracts!', data);
}

run();
