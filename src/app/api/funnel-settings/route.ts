import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const DEFAULTS = {
  Step1_Title: 'Choose Your Experience',
  Step1_Subtitle: 'Select the collection that perfectly fits your day.',
  Step2_Title: 'Tell Us About Your Day',
  Step2_Subtitle: 'Help us prepare the perfect agreement for your event.',
  Step3_Title: 'Review & Sign Your Contract',
  Step3_Subtitle: 'Please fill out any required fields and sign the agreement below.',
  Step4_Title: 'Complete Your Booking',
  Step4_Subtitle: 'Secure your date by submitting the 50% retainer.',
  Addons: '[]',
  Payment_Methods: '[]',
  Confirmation_Title: 'Booking Confirmed!',
  Confirmation_Message: 'Your deposit has been received and your contract is securely signed. We are officially locked in!',
};

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Auth is not required for GET if this is accessed by public funnel, but wait:
    // If it's the public funnel, we need the user_id.
    // For now, assume this API is used by the admin dashboard to configure settings.
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: row, error } = await supabase
      .from('Booking_Settings')
      .select('*')
      .eq('user_id', userAuth.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const settings = {
      steps: [
        { title: row?.Step1_Title || DEFAULTS.Step1_Title, subtitle: row?.Step1_Subtitle || DEFAULTS.Step1_Subtitle },
        { title: row?.Step2_Title || DEFAULTS.Step2_Title, subtitle: row?.Step2_Subtitle || DEFAULTS.Step2_Subtitle },
        { title: row?.Step3_Title || DEFAULTS.Step3_Title, subtitle: row?.Step3_Subtitle || DEFAULTS.Step3_Subtitle },
        { title: row?.Step4_Title || DEFAULTS.Step4_Title, subtitle: row?.Step4_Subtitle || DEFAULTS.Step4_Subtitle },
      ],
      addons: JSON.parse(row?.Addons || '[]'),
      paymentMethods: JSON.parse(row?.Payment_Methods || '[]'),
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
    const { steps, addons, paymentMethods, confirmationTitle, confirmationMessage } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = userAuth.user.id;

    const [s1, s2, s3, s4] = steps || [{}, {}, {}, {}];

    const { error } = await supabase
      .from('Booking_Settings')
      .upsert({
        user_id: userId,
        Step1_Title: s1?.title || DEFAULTS.Step1_Title,
        Step1_Subtitle: s1?.subtitle || DEFAULTS.Step1_Subtitle,
        Step2_Title: s2?.title || DEFAULTS.Step2_Title,
        Step2_Subtitle: s2?.subtitle || DEFAULTS.Step2_Subtitle,
        Step3_Title: s3?.title || DEFAULTS.Step3_Title,
        Step3_Subtitle: s3?.subtitle || DEFAULTS.Step3_Subtitle,
        Step4_Title: s4?.title || DEFAULTS.Step4_Title,
        Step4_Subtitle: s4?.subtitle || DEFAULTS.Step4_Subtitle,
        Addons: JSON.stringify(addons || []),
        Payment_Methods: JSON.stringify(paymentMethods || []),
        Confirmation_Title: confirmationTitle || DEFAULTS.Confirmation_Title,
        Confirmation_Message: confirmationMessage || DEFAULTS.Confirmation_Message,
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
