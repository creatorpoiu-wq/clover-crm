import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  heroHeadline: "Let's plan your perfect session.",
  heroSubheadline: "Fill out the details below to start the booking process.",
  // Welcome guide hero
  welcomeHeroHeadline: 'Welcome to the Experience.',
  welcomeHeroSubheadline: 'Thank you for inquiring! This guide outlines our signature style, transparent pricing, and the simple three-step process to secure your session.',
  welcomeHeroPhotoUrl: '',
  aboutText: '',
  sessionTypes: ['Family Portrait', 'Maternity', 'Newborn', 'Couples/Engagement', 'Senior Portraits', 'Headshots/Branding'],
  retainerAmount: 100,
  // Custom inquiry form questions
  customQuestions: [] as any[],
  // Budget ranges
  budgetRanges: ['Under $500', '$500 - $1,000', '$1,000 - $2,000', '$2,000+'] as string[],
  // Step headings (for /portrait/book funnel)
  steps: [
    { title: 'Choose Your Experience', subtitle: 'Select the date and time for your portrait session.' },
    { title: 'Review & Sign Your Contract', subtitle: 'Please review and sign the agreement below.' },
    { title: 'Complete Your Booking', subtitle: 'Secure your session by submitting the retainer.' },
  ],
  contractTemplateId: null as number | null,
  confirmationTitle: 'Booking Confirmed!',
  confirmationMessage: 'Your deposit has been received and your session is securely booked. We look forward to working with you!',
  // Signature style section
  styleHeading: 'Candid. Timeless. Authentic.',
  styleDescription: 'We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth, ensuring your portraits look beautiful decades from now.',
  styleBullets: ['Natural light prioritization', 'Guided, movement-based posing', 'True-to-color editing aesthetic', 'Focus on genuine emotion'],
  stylePhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',
  // Investment / packages section
  packages: [
    { name: 'The Mini', price: 350, description: 'Perfect for quick updates or headshots.', features: ['30 Minute Session', '15 Edited Images', '1 Location'], featured: false },
    { name: 'The Classic', price: 650, description: 'The ideal balance for families and couples.', features: ['60 Minute Session', '50+ Edited Images', 'Up to 2 Outfits'], featured: true },
    { name: 'The Extended', price: 950, description: 'For editorial or multi-location shoots.', features: ['2 Hour Session', '100+ Edited Images', 'Multiple Locations'], featured: false },
  ],
  // What's Next section
  whatsNextHeading: 'What happens next?',
  whatsNextSub: 'Booking your session is a seamless, 3-step process.',
  whatsNextSteps: [
    { title: 'Pick Your Date', description: 'View my real-time calendar and select the exact date and time that works for you.' },
    { title: 'Sign Digitally', description: 'Review and sign your digital contract instantly to secure the legalities.' },
    { title: 'Pay Retainer', description: 'Submit your non-refundable retainer securely. Your date is officially locked in!' },
  ],
  // Payment details
  paymentMethods: [] as string[],
  paymentInstructions: '',
  venmoHandle: '',
  paypalLink: '',
  zelleContact: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseJSON(val: string | null | undefined, fallback: any) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: row, error } = await supabase
      .from('Portrait_Settings')
      .select('*')
      .eq('user_id', userAuth.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const settings = {
      userId:            userAuth.user.id,
      heroHeadline:            row?.Hero_Headline            || DEFAULTS.heroHeadline,
      heroSubheadline:         row?.Hero_Subheadline         || DEFAULTS.heroSubheadline,
      welcomeHeroHeadline:     row?.Welcome_Hero_Headline    || DEFAULTS.welcomeHeroHeadline,
      welcomeHeroSubheadline:  row?.Welcome_Hero_Subheadline || DEFAULTS.welcomeHeroSubheadline,
      welcomeHeroPhotoUrl:     row?.Welcome_Hero_Photo_URL   || DEFAULTS.welcomeHeroPhotoUrl,
      sessionTypes:      parseJSON(row?.Session_Types,      DEFAULTS.sessionTypes),
      retainerAmount:    row?.Retainer_Amount    || DEFAULTS.retainerAmount,
      customQuestions:   parseJSON(row?.Custom_Questions,   DEFAULTS.customQuestions),
      budgetRanges:      parseJSON(row?.Budget_Ranges,       DEFAULTS.budgetRanges),
      steps: [
        { title: row?.Step1_Title || DEFAULTS.steps[0].title, subtitle: row?.Step1_Subtitle || DEFAULTS.steps[0].subtitle },
        { title: row?.Step2_Title || DEFAULTS.steps[1].title, subtitle: row?.Step2_Subtitle || DEFAULTS.steps[1].subtitle },
        { title: row?.Step3_Title || DEFAULTS.steps[2].title, subtitle: row?.Step3_Subtitle || DEFAULTS.steps[2].subtitle },
      ],
      contractTemplateId: row?.Contract_Template_ID || null,
      confirmationTitle:  row?.Confirmation_Title   || DEFAULTS.confirmationTitle,
      confirmationMessage: row?.Confirmation_Message || DEFAULTS.confirmationMessage,
      styleHeading:      row?.Style_Heading      || DEFAULTS.styleHeading,
      styleDescription:  row?.Style_Description  || DEFAULTS.styleDescription,
      styleBullets:      parseJSON(row?.Style_Bullets,      DEFAULTS.styleBullets),
      stylePhotoUrl:     row?.Style_Photo_URL    || DEFAULTS.stylePhotoUrl,
      packages:          parseJSON(row?.Packages,           DEFAULTS.packages),
      whatsNextHeading:  row?.Whats_Next_Heading || DEFAULTS.whatsNextHeading,
      whatsNextSub:      row?.Whats_Next_Sub     || DEFAULTS.whatsNextSub,
      whatsNextSteps:    parseJSON(row?.Whats_Next_Steps,   DEFAULTS.whatsNextSteps),
      paymentMethods:    parseJSON(row?.Payment_Methods,    DEFAULTS.paymentMethods),
      paymentInstructions: row?.Payment_Instructions || DEFAULTS.paymentInstructions,
      venmoHandle:       row?.Venmo_Handle       || DEFAULTS.venmoHandle,
      paypalLink:        row?.Paypal_Link        || DEFAULTS.paypalLink,
      zelleContact:      row?.Zelle_Contact      || DEFAULTS.zelleContact,
    };

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      heroHeadline, heroSubheadline, welcomeHeroHeadline, welcomeHeroSubheadline, welcomeHeroPhotoUrl, sessionTypes, retainerAmount,
      customQuestions, budgetRanges, steps, contractTemplateId, confirmationTitle, confirmationMessage,
      styleHeading, styleDescription, styleBullets, stylePhotoUrl,
      packages, whatsNextHeading, whatsNextSub, whatsNextSteps,
      paymentMethods, paymentInstructions, venmoHandle, paypalLink, zelleContact,
    } = body;

    const [s1, s2, s3] = steps || [{}, {}, {}];

    const { error } = await supabase.from('Portrait_Settings').upsert({
      user_id: userAuth.user.id,
      Hero_Headline:            heroHeadline           || DEFAULTS.heroHeadline,
      Hero_Subheadline:         heroSubheadline        || DEFAULTS.heroSubheadline,
      Welcome_Hero_Headline:    welcomeHeroHeadline    || DEFAULTS.welcomeHeroHeadline,
      Welcome_Hero_Subheadline: welcomeHeroSubheadline || DEFAULTS.welcomeHeroSubheadline,
      Welcome_Hero_Photo_URL:   welcomeHeroPhotoUrl    ?? DEFAULTS.welcomeHeroPhotoUrl,
      Session_Types:      JSON.stringify(sessionTypes      ?? DEFAULTS.sessionTypes),
      Retainer_Amount:    retainerAmount    ?? DEFAULTS.retainerAmount,
      Custom_Questions:   JSON.stringify(customQuestions   ?? DEFAULTS.customQuestions),
      Budget_Ranges:      JSON.stringify(budgetRanges      ?? DEFAULTS.budgetRanges),
      Step1_Title:        s1?.title         || DEFAULTS.steps[0].title,
      Step1_Subtitle:     s1?.subtitle      || DEFAULTS.steps[0].subtitle,
      Step2_Title:        s2?.title         || DEFAULTS.steps[1].title,
      Step2_Subtitle:     s2?.subtitle      || DEFAULTS.steps[1].subtitle,
      Step3_Title:        s3?.title         || DEFAULTS.steps[2].title,
      Step3_Subtitle:     s3?.subtitle      || DEFAULTS.steps[2].subtitle,
      Contract_Template_ID: contractTemplateId || null,
      Confirmation_Title:   confirmationTitle  || DEFAULTS.confirmationTitle,
      Confirmation_Message: confirmationMessage || DEFAULTS.confirmationMessage,
      Style_Heading:      styleHeading      || DEFAULTS.styleHeading,
      Style_Description:  styleDescription  || DEFAULTS.styleDescription,
      Style_Bullets:      JSON.stringify(styleBullets      ?? DEFAULTS.styleBullets),
      Style_Photo_URL:    stylePhotoUrl     ?? DEFAULTS.stylePhotoUrl,
      Packages:           JSON.stringify(packages          ?? DEFAULTS.packages),
      Whats_Next_Heading: whatsNextHeading  || DEFAULTS.whatsNextHeading,
      Whats_Next_Sub:     whatsNextSub      || DEFAULTS.whatsNextSub,
      Whats_Next_Steps:   JSON.stringify(whatsNextSteps    ?? DEFAULTS.whatsNextSteps),
      Payment_Methods:    JSON.stringify(paymentMethods    ?? DEFAULTS.paymentMethods),
      Payment_Instructions: paymentInstructions ?? DEFAULTS.paymentInstructions,
      Venmo_Handle:       venmoHandle       ?? DEFAULTS.venmoHandle,
      Paypal_Link:        paypalLink        ?? DEFAULTS.paypalLink,
      Zelle_Contact:      zelleContact      ?? DEFAULTS.zelleContact,
    }, { onConflict: 'user_id' });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
