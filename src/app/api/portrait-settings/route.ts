import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const DEFAULTS = {
  Step1_Title: 'Choose Your Experience',
  Step1_Subtitle: 'Select the date and time for your portrait session.',
  Step2_Title: 'Review & Sign Your Contract',
  Step2_Subtitle: 'Please review and sign the agreement below.',
  Step3_Title: 'Complete Your Booking',
  Step3_Subtitle: 'Secure your session by submitting the retainer.',
  Confirmation_Title: 'Booking Confirmed!',
  Confirmation_Message: 'Your deposit has been received and your session is securely booked. We look forward to working with you!',
};

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Auth is required to fetch settings for the dashboard.
    // (For the public funnel, we'll fetch via /api/public-booking?type=portrait_settings)
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: row, error } = await supabase
      .from('Portrait_Settings')
      .select('*')
      .eq('user_id', userAuth.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const settings = {
      steps: [
        { title: row?.Step1_Title || DEFAULTS.Step1_Title, subtitle: row?.Step1_Subtitle || DEFAULTS.Step1_Subtitle },
        { title: row?.Step2_Title || DEFAULTS.Step2_Title, subtitle: row?.Step2_Subtitle || DEFAULTS.Step2_Subtitle },
        { title: row?.Step3_Title || DEFAULTS.Step3_Title, subtitle: row?.Step3_Subtitle || DEFAULTS.Step3_Subtitle },
      ],
      contractTemplateId: row?.Contract_Template_ID || null,
      confirmationTitle: row?.Confirmation_Title || DEFAULTS.Confirmation_Title,
      confirmationMessage: row?.Confirmation_Message || DEFAULTS.Confirmation_Message,
    };

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { steps, contractTemplateId, confirmationTitle, confirmationMessage } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = userAuth.user.id;

    const [s1, s2, s3] = steps || [{}, {}, {}];

    const { error } = await supabase
      .from('Portrait_Settings')
      .upsert({
        user_id: userId,
        Step1_Title: s1?.title || DEFAULTS.Step1_Title,
        Step1_Subtitle: s1?.subtitle || DEFAULTS.Step1_Subtitle,
        Step2_Title: s2?.title || DEFAULTS.Step2_Title,
        Step2_Subtitle: s2?.subtitle || DEFAULTS.Step2_Subtitle,
        Step3_Title: s3?.title || DEFAULTS.Step3_Title,
        Step3_Subtitle: s3?.subtitle || DEFAULTS.Step3_Subtitle,
        Contract_Template_ID: contractTemplateId || null,
        Confirmation_Title: confirmationTitle || DEFAULTS.Confirmation_Title,
        Confirmation_Message: confirmationMessage || DEFAULTS.Confirmation_Message,
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
