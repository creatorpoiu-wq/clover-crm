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
  Welcome_Hero_Headline: 'Welcome to the Experience.',
  Cover_Image: '',
  Style_Heading: 'Candid. Timeless. Authentic.',
  Style_Description: 'We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth, ensuring your photos look beautiful decades from now.',
  Style_Photo_Url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',
  Style_Bullets: '["Natural light prioritization", "Guided, movement-based posing", "True-to-color editing aesthetic", "Focus on genuine emotion"]',
  Style_Media_Type: 'image',
  Style_Video1_Url: '',
  Style_Video2_Url: '',
  Investment_Headline: 'Transparent, all-inclusive pricing.',
  Investment_Description: 'No hidden fees. Select the collection that best suits your vision for the big day.',
  Whats_Next_Heading: 'What happens next?',
  Whats_Next_Sub: 'Booking your session is a seamless, 3-step process.',
  Whats_Next_Steps: '[{"title":"Tell Us About Your Day","description":"Fill out your contact and event details to start the process."},{"title":"Sign Digitally","description":"Review and sign your digital contract instantly to secure the legalities."},{"title":"Pay Retainer","description":"Submit your non-refundable retainer securely. Your date is officially locked in!"}]',
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
      welcomeHeroHeadline: row?.Welcome_Hero_Headline || DEFAULTS.Welcome_Hero_Headline,
      coverImage: row?.Cover_Image || DEFAULTS.Cover_Image,
      styleHeading: row?.Style_Heading || DEFAULTS.Style_Heading,
      styleDescription: row?.Style_Description || DEFAULTS.Style_Description,
      stylePhotoUrl: row?.Style_Photo_Url || DEFAULTS.Style_Photo_Url,
      styleBullets: row?.Style_Bullets ? JSON.parse(row.Style_Bullets) : JSON.parse(DEFAULTS.Style_Bullets),
      styleMediaType: row?.Style_Media_Type || DEFAULTS.Style_Media_Type,
      styleVideo1Url: row?.Style_Video1_Url || DEFAULTS.Style_Video1_Url,
      styleVideo2Url: row?.Style_Video2_Url || DEFAULTS.Style_Video2_Url,
      investmentHeadline: row?.Investment_Headline || DEFAULTS.Investment_Headline,
      investmentDescription: row?.Investment_Description || DEFAULTS.Investment_Description,
      whatsNextHeading: row?.Whats_Next_Heading || DEFAULTS.Whats_Next_Heading,
      whatsNextSub: row?.Whats_Next_Sub || DEFAULTS.Whats_Next_Sub,
      whatsNextSteps: row?.Whats_Next_Steps ? JSON.parse(row.Whats_Next_Steps) : JSON.parse(DEFAULTS.Whats_Next_Steps),
      userId: userAuth.user.id,
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
    const { 
      steps, addons, paymentMethods, confirmationTitle, confirmationMessage,
      welcomeHeroHeadline, coverImage, styleHeading, styleDescription, stylePhotoUrl, 
      styleBullets, styleMediaType, styleVideo1Url, styleVideo2Url,
      investmentHeadline, investmentDescription,
      whatsNextHeading, whatsNextSub, whatsNextSteps
    } = body;

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
        Welcome_Hero_Headline: welcomeHeroHeadline || DEFAULTS.Welcome_Hero_Headline,
        Cover_Image: coverImage || DEFAULTS.Cover_Image,
        Style_Heading: styleHeading || DEFAULTS.Style_Heading,
        Style_Description: styleDescription || DEFAULTS.Style_Description,
        Style_Photo_Url: stylePhotoUrl || DEFAULTS.Style_Photo_Url,
        Style_Bullets: JSON.stringify(styleBullets || JSON.parse(DEFAULTS.Style_Bullets)),
        Style_Media_Type: styleMediaType || DEFAULTS.Style_Media_Type,
        Style_Video1_Url: styleVideo1Url || DEFAULTS.Style_Video1_Url,
        Style_Video2_Url: styleVideo2Url || DEFAULTS.Style_Video2_Url,
        Investment_Headline: investmentHeadline || DEFAULTS.Investment_Headline,
        Investment_Description: investmentDescription || DEFAULTS.Investment_Description,
        Whats_Next_Heading: whatsNextHeading || DEFAULTS.Whats_Next_Heading,
        Whats_Next_Sub: whatsNextSub || DEFAULTS.Whats_Next_Sub,
        Whats_Next_Steps: JSON.stringify(whatsNextSteps || JSON.parse(DEFAULTS.Whats_Next_Steps)),
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
