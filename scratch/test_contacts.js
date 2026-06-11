require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('Contacts')
    .select('*, Packages (Name)')
    .order('Contact_ID', { ascending: false });

  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("SUCCESS. Contacts count:", data.length);
  }
}

test();
