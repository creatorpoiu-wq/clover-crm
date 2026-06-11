require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('Meetings').select('*').limit(1);
  console.log("Meetings:", error ? error.message : data);
  
  const { data: d2, error: e2 } = await supabase.from('Blocked_Dates').select('*').limit(1);
  console.log("Blocked_Dates:", e2 ? e2.message : d2);
}
run();
