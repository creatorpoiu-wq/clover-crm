import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Get a user
  const { data: users } = await supabase.from('Booking_Settings').select('user_id').limit(1);
  if (!users || users.length === 0) return console.log("No users found");
  const userId = users[0].user_id;

  // 2. Create a Contact & Inquiry & Contract to simulate a Proposal
  const { data: contact } = await supabase.from('Contacts').insert({ user_id: userId, Name: 'Test Client', Email: 'test@example.com' }).select().single();
  const { data: inquiry } = await supabase.from('Inquiries').insert({ user_id: userId, Contact_ID: contact.Contact_ID, Service_Type: 'Wedding' }).select().single();
  const { data: contract } = await supabase.from('Contracts').insert({ user_id: userId, Inquiry_ID: inquiry.Inquiry_ID, Contract_Title: 'Test', Status: 'Draft' }).select().single();

  console.log("Created contract:", contract.Contract_ID);

  // 3. Simulate the submission
  const payload = {
    userId,
    contractId: contract.Contract_ID,
    questionnaire: { 'Full Name': 'Tested Client', 'Phone': '123456' },
    signature: 'data:image/png;base64,123',
    contractHtml: '<p>Signed contract</p>',
    totalAmount: 1000,
    depositAmount: 500
  };

  const res = await fetch('http://localhost:3000/api/public-booking/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log("Response:", res.status, text);
}

run();
