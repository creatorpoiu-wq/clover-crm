require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const userId = '737416f3-f899-4492-a26f-e4e0d97426fe';
  
  // Get all columns in AppConfig for this user
  const { data, error } = await supabase
    .from('AppConfig')
    .select('*')
    .eq('user_id', userId);
  console.log('AppConfig all columns:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}
run();
