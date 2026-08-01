const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('Proposals').select('Proposal_ID, Custom_Package');
  if (data) {
    for (const p of data) {
      if (p.Custom_Package && p.Custom_Package.price === 0) {
        console.log(`Fixing Proposal ${p.Proposal_ID}`);
        p.Custom_Package.price = 2200;
        await supabase.from('Proposals').update({ Custom_Package: p.Custom_Package }).eq('Proposal_ID', p.Proposal_ID);
      }
    }
  }
}
run();
