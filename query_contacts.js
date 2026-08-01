const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('Contacts').select('*').ilike('Name', '%Kasey%');
  console.log('Contacts:', JSON.stringify(data, null, 2));
  
  if (data && data.length > 0) {
    const contactId = data[0].Contact_ID;
    const { data: props } = await supabase.from('Proposals').select('*').eq('Contact_ID', contactId);
    console.log('Proposals:', JSON.stringify(props, null, 2));
  }
}
run();
