import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: settings } = await supabase.from('Booking_Settings').select('Questionnaire_Template_ID');
  console.log('Booking Settings:', settings);
  
  const { data: qTpls } = await supabase.from('Questionnaire_Templates').select('Template_ID, Title');
  console.log('Questionnaire Templates:', qTpls);
  
  const { data: qFields } = await supabase.from('Questionnaire_Fields').select('Field_ID, Label, Template_ID');
  console.log('Questionnaire Fields:', qFields);
}

run();
