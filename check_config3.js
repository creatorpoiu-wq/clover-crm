require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  // Get ALL rows in AppConfig — no filter
  const { data, error } = await supabase
    .from('AppConfig')
    .select('*')
    .limit(5);
  console.log('AppConfig all rows:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}
run();
