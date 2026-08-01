require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('Proposals')
    .select(`
      Proposal_ID, user_id, Contact_ID, Title, Status, Package_ID, Addons, 
      Cover_Image, Custom_Notes, Sent_At, Accepted_At, Declined_At, Created_At,
      Contacts ( Name, Email ),
      Packages ( Package_ID, Name, Price, Duration, Items )
    `)
    .or(`Proposal_ID.eq.7,Slug.eq.7`)
    .maybeSingle();
    
  console.log("Data:", data);
  console.log("Error:", error);
}
run();
