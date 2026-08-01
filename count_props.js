const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, count, error } = await supabase.from('Proposals').select('Proposal_ID', { count: 'exact' });
  console.log('Total proposals:', count);
}
run();
