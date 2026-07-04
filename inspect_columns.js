require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Fetching Invoices and Invoice_Items from DB (one row each)...");
    const { data: inv, error: invErr } = await supabase.from('Invoices').select('*').limit(1);
    console.log('Invoices columns:', inv ? Object.keys(inv[0] || {}) : invErr);
    
    const { data: items, error: itemsErr } = await supabase.from('Invoice_Items').select('*').limit(1);
    console.log('Invoice_Items columns:', items ? Object.keys(items[0] || {}) : itemsErr);
}
run();
