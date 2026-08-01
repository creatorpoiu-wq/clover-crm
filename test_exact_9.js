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
        Proposal_ID, Slug, user_id, Title, Status, Custom_Notes, Cover_Image, Addons,
        Sent_At, Accepted_At, Declined_At, Decline_Reason,
        Questionnaire_Template_ID, Contract_Template_ID,
        Contact_ID,
        Contacts ( Name, Email ),
        Packages ( Package_ID, Name, Price, Duration, Items )
    `)
    .or(`Proposal_ID.eq.9,Slug.eq.9`)
    .maybeSingle();
    
  console.log("Data:", data);
  console.log("Error:", error);
}
run();
