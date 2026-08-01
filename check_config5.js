require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  // Find which AppConfig row belongs to the proposal's user_id
  const proposalUserId = '737416f3-f899-4492-a26f-e4e0d97426fe';
  const { data, error } = await supabase
    .from('AppConfig')
    .select('user_id, Company_Name, Business_Logo, Brand_Color, Custom_Domain')
    .eq('user_id', proposalUserId);
  console.log('Matching AppConfig:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
  
  // Also list all user_ids in AppConfig
  const { data: all } = await supabase.from('AppConfig').select('user_id, Company_Name');
  console.log('All AppConfig user_ids:', all?.map(r => `${r.user_id} -> ${r.Company_Name}`));
}
run();
