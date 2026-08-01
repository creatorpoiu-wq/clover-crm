require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('Proposals')
    .select('Proposal_ID, Slug')
    .order('Proposal_ID', { ascending: false })
    .limit(5);
    
  console.log("Data:", data);
}
run();
