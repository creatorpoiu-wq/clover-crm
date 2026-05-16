import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // We only need to query without filters because RLS handles user isolation
    const { data: config, error } = await supabase
      .from('AppConfig')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned"
      throw error;
    }

    if (!config) {
      return NextResponse.json({ success: true, config: {} });
    }
    
    return NextResponse.json({ 
      success: true, 
      config: {
        companyName: config.Company_Name || '',
        googleClientId: config.Google_Client_ID || '',
        googleClientSecret: config.Google_Client_Secret || '',
        hasRefreshToken: !!config.Google_Refresh_Token,
        emailUser: config.Email_User || '',
        hasEmailPass: !!(config.Email_Pass && config.Email_Pass.length > 0),
        businessLogo: config.Business_Logo || '',
        businessAddress: config.Business_Address || '',
        twilioSid: config.Twilio_Account_SID || '',
        twilioAuthToken: config.Twilio_Auth_Token || '',
        twilioPhone: config.Twilio_Phone_Number || '',
      }
    });
  } catch (error: any) {
    console.error('Settings API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { companyName, googleClientId, googleClientSecret, emailUser, emailPass, businessLogo, businessAddress, twilioSid, twilioAuthToken, twilioPhone } = await req.json();
    
    // Check if the user has an AppConfig row
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const updatePayload: any = {
      Company_Name: companyName || '',
      Google_Client_ID: googleClientId || '',
      Google_Client_Secret: googleClientSecret || '',
      Email_User: emailUser || '',
      Business_Logo: businessLogo !== undefined ? businessLogo : '',
      Business_Address: businessAddress !== undefined ? businessAddress : '',
      Twilio_Account_SID: twilioSid || '',
      Twilio_Auth_Token: twilioAuthToken || '',
      Twilio_Phone_Number: twilioPhone || ''
    };

    if (emailPass && emailPass.trim()) {
      updatePayload.Email_Pass = emailPass.trim();
    }

    const { error } = await supabase
      .from('AppConfig')
      .update(updatePayload)
      .eq('user_id', userAuth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Settings POST API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
