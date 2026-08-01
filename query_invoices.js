const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('Invoices').select('Invoice_ID, Invoice_Items(Description, Price, Quantity)').limit(1);
  console.log(JSON.stringify({ data, error }, null, 2));
}
run();
