require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const userId = '737416f3-f899-4492-a26f-e4e0d97426fe';
  
  // Check AppConfig
  const { data: config, error: configErr } = await supabase
    .from('AppConfig')
    .select('Company_Name, Logo_Url, Brand_Color, Custom_Domain')
    .eq('user_id', userId);
  console.log('AppConfig rows:', JSON.stringify(config, null, 2));
  console.log('AppConfig error:', configErr);

  // Check Booking_Settings
  const { data: bs, error: bsErr } = await supabase
    .from('Booking_Settings')
    .select('Cover_Image, Style_Photo_Url, Style_Heading, Style_Description, Style_Bullets')
    .eq('user_id', userId);
  console.log('Booking_Settings rows:', JSON.stringify(bs, null, 2));
  console.log('Booking_Settings error:', bsErr);
}
run();
