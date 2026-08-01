require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidkey.invalid" // invalid key format
);

async function run() {
  const { data, error } = await supabase.from('Proposals').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}
run();
