const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Use RPC or run a raw query if we can, but via JS client we can't easily alter table unless we have an rpc setup for executing sql.
  // We can just log that we need to add the column in Supabase dashboard, or try to insert a test record to see if it exists.
  
  // Let's test if Paypal_Client_Id exists by doing a select
  const { error } = await supabase.from('AppConfig').select('Paypal_Client_Id').limit(1);
  if (error && error.code === '42703') {
    console.log("Column Paypal_Client_Id does not exist. Please run this in SQL Editor:");
    console.log(`ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "Paypal_Client_Id" text;`);
  } else if (error) {
    console.log("Other error:", error);
  } else {
    console.log("Column Paypal_Client_Id exists!");
  }
}

run();
