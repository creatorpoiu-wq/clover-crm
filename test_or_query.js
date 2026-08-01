require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('Proposals').select('*').or(`Proposal_ID.eq.5,Slug.eq.5`).single();
  console.log("Data:", data);
  console.log("Error:", error);
}
run();
