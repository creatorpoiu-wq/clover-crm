// Run with: node test-portal2.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const vars = {};
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) vars[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
}

const supabase = createClient(vars['NEXT_PUBLIC_SUPABASE_URL'], vars['SUPABASE_SERVICE_ROLE_KEY'] || vars['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

// Test EXACT query from portal route
console.log('--- Exact portal query ---');
const { data: inquiry, error: inquiryError } = await supabase
  .from('Inquiries')
  .select(`
    user_id,
    Contact_ID,
    Service_Type,
    Event_Date,
    Pipeline_Stage,
    Estimated_Value,
    Questionnaire_Data,
    Deliverable_Milestones,
    Contacts ( Name, Email, Phone )
  `)
  .eq('Inquiry_ID', 34)
  .single();

console.log('Error:', JSON.stringify(inquiryError));
console.log('Data:', inquiry ? 'FOUND' : 'NULL');
if (inquiryError) console.log('Error detail:', inquiryError.message, inquiryError.details, inquiryError.hint);

// Test 2: Does Deliverable_Milestones column exist?
console.log('\n--- Test without Deliverable_Milestones ---');
const { data: inq2, error: err2 } = await supabase
  .from('Inquiries')
  .select(`user_id, Contact_ID, Service_Type, Event_Date, Pipeline_Stage, Estimated_Value, Questionnaire_Data, Contacts ( Name, Email, Phone )`)
  .eq('Inquiry_ID', 34)
  .single();
console.log('Error:', JSON.stringify(err2));
console.log('Data:', inq2 ? 'FOUND' : 'NULL');

// Test 3: get column info
console.log('\n--- Check columns via direct REST ---');
const resp = await fetch(`${vars['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/Inquiries?Inquiry_ID=eq.34&limit=1`, {
  headers: { apikey: vars['SUPABASE_SERVICE_ROLE_KEY'], Authorization: `Bearer ${vars['SUPABASE_SERVICE_ROLE_KEY']}` }
});
const raw = await resp.json();
if (raw[0]) console.log('Columns:', Object.keys(raw[0]).join(', '));
else console.log('Response:', JSON.stringify(raw));
