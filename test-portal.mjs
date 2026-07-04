// Run with: node test-portal.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env.local
const env = readFileSync('.env.local', 'utf8');
const vars = {};
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) vars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
}

const supabaseUrl = vars['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = vars['SUPABASE_SERVICE_ROLE_KEY'] || vars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const anonKey = vars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('URL:', supabaseUrl);
console.log('Using service key:', !!vars['SUPABASE_SERVICE_ROLE_KEY']);

const supabase = createClient(supabaseUrl, serviceKey);

// Test 1: Basic inquiry fetch
console.log('\n--- Test 1: Fetch inquiry 34 ---');
const { data: inq, error: inqErr } = await supabase
  .from('Inquiries')
  .select('Inquiry_ID, user_id, Contact_ID, Service_Type, Event_Date, Pipeline_Stage, Estimated_Value, Contacts ( Name, Email, Phone )')
  .eq('Inquiry_ID', 34)
  .single();

console.log('Error:', JSON.stringify(inqErr));
console.log('Data:', JSON.stringify(inq));

// Test 2: Try without the join
console.log('\n--- Test 2: Fetch inquiry without join ---');
const { data: inq2, error: inqErr2 } = await supabase
  .from('Inquiries')
  .select('Inquiry_ID, user_id, Contact_ID, Service_Type')
  .eq('Inquiry_ID', 34)
  .single();

console.log('Error:', JSON.stringify(inqErr2));
console.log('Data:', JSON.stringify(inq2));

// Test 3: Check what inquiry IDs exist
console.log('\n--- Test 3: All inquiry IDs ---');
const { data: all, error: allErr } = await supabase
  .from('Inquiries')
  .select('Inquiry_ID, user_id')
  .limit(5);
console.log('Error:', JSON.stringify(allErr));
console.log('IDs:', all?.map(i => i.Inquiry_ID));
