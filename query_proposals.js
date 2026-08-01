require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const id = '5';
  let query = supabase.from('Proposals').select(`
        Proposal_ID, Slug, user_id, Title, Status, Custom_Notes, Cover_Image, Addons,
        Sent_At, Accepted_At, Declined_At, Decline_Reason,
        Questionnaire_Template_ID, Contract_Template_ID,
        Contact_ID,
        Contacts ( Name, Email ),
        Packages ( Package_ID, Name, Price, Duration, Items )
      `);

  if (/^\d+$/.test(id)) {
    query = query.or(`Proposal_ID.eq.${id},Slug.eq.${id}`);
  } else {
    query = query.eq('Slug', id);
  }

  const { data, error } = await query.single();
  if (error) {
     console.log("Supabase error:", error);
     return;
  }
  if (!data) {
     console.log("No data");
     return;
  }

  const { data: config, error: cErr } = await supabase
    .from('AppConfig')
    .select('Company_Name, Logo_Url, Brand_Color, Custom_Domain')
    .eq('user_id', data.user_id || '')
    .single();

  if (cErr) console.log("Config Error:", cErr);

  const { data: funnelSettings, error: fErr } = await supabase
    .from('Booking_Settings')
    .select('Cover_Image, Style_Photo_Url, Style_Heading, Style_Description, Style_Bullets')
    .eq('user_id', data.user_id || '')
    .single();
    
  if (fErr) console.log("Funnel Error:", fErr);

  console.log("Result:", JSON.stringify({
    success: true,
    proposal: data,
    config: config || {},
    funnelSettings: funnelSettings || {},
  }, null, 2));
}
run();
