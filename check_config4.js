require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('AppConfig')
    .select('*')
    .limit(1);
  // print column names only
  if (data && data[0]) {
    console.log('Columns:', Object.keys(data[0]).join('\n'));
    console.log('\nCompany_Name:', data[0].Company_Name);
    console.log('user_id:', data[0].user_id);
  }
  console.log('Error:', error);
}
run();
