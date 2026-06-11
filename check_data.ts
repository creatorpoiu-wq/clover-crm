import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: inquiries, error } = await supabase
    .from('Inquiries')
    .select('Inquiry_ID, Contact_ID, Pipeline_Stage')
    .order('Inquiry_ID', { ascending: false })
    .limit(5);
    
  console.log('Recent Inquiries:', inquiries);
  
  const { data: contacts } = await supabase.from('Contacts').select('Contact_ID, Name').order('Contact_ID', { ascending: false }).limit(5);
  console.log('Recent Contacts:', contacts);
}

run();
