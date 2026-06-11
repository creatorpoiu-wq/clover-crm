export const dynamic = 'force-dynamic';
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
        firstName: config.First_Name || '',
        lastName: config.Last_Name || '',
        contactEmail: config.Contact_Email || '',
        website: config.Website || '',
        phone: config.Phone || '',
        timeZone: config.Time_Zone || '',
        dateFormat: config.Date_Format || '',
        hasRefreshToken: !!config.Google_Refresh_Token,
        emailUser: config.Email_User || '',
        hasEmailPass: !!(config.Email_Pass && config.Email_Pass.length > 0),
        businessLogo: config.Business_Logo || '',
        businessAddress: config.Business_Address || '',
        brandColor: config.Brand_Color || '#0f172a',
        twilioSid: config.Twilio_Account_SID || '',
        twilioAuthToken: config.Twilio_Auth_Token || '',
        twilioPhone: config.Twilio_Phone_Number || '',
        businessSlug: config.Business_Slug || '',
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
    const { companyName, firstName, lastName, contactEmail, website, phone, timeZone, dateFormat, emailUser, emailPass, businessLogo, businessAddress, brandColor, twilioSid, twilioAuthToken, twilioPhone, businessSlug } = await req.json();
    
    // Check if the user has an AppConfig row
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: existing } = await supabase.from('AppConfig').select('Config_ID').single();

    const payload: any = {
      user_id: userAuth.user.id,
      Company_Name: companyName,
      First_Name: firstName,
      Last_Name: lastName,
      Contact_Email: contactEmail,
      Website: website,
      Phone: phone,
      Time_Zone: timeZone,
      Date_Format: dateFormat,
      Email_User: emailUser,
      Business_Logo: businessLogo,
      Business_Address: businessAddress,
      Brand_Color: brandColor,
      Twilio_Account_SID: twilioSid,
      Twilio_Auth_Token: twilioAuthToken,
      Twilio_Phone_Number: twilioPhone,
      Business_Slug: businessSlug
    };

    if (emailPass && emailPass.trim() !== '') {
      payload.Email_Pass = emailPass;
    }

    let error;
    if (existing) {
      ({ error } = await supabase.from('AppConfig').update(payload).eq('Config_ID', existing.Config_ID));
    } else {
      ({ error } = await supabase.from('AppConfig').insert(payload));
    }

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Settings API POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
