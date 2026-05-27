export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Service role client — bypasses RLS for public read access
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Public booking API - no authentication required.
 * Clients (unauthenticated) use this to load the booking funnel data.
 * Requires the vendor's user_id passed via query string (from the proposal link).
 * Falls back to the first/only user in the system for direct /booking access.
 *
 * GET /api/public-booking?userId=<uuid>&type=settings|packages|questionnaire&templateId=<id>
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const templateId = searchParams.get('templateId');

    // ── Questionnaire Fields (no userId needed) ──────────────────────────────
    if (type === 'fields' && templateId) {
      const { data: fields, error } = await supabase
        .from('Questionnaire_Fields')
        .select('*')
        .eq('Template_ID', templateId)
        .order('Order_Index', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, fields: fields || [] });
    }

    // ── Contract Fetch (for generated proposals) ───────────────────────────
    if (type === 'contract' && searchParams.get('contractId')) {
      const { data: contract, error } = await supabase
        .from('Contracts')
        .select('*')
        .eq('Contract_ID', searchParams.get('contractId'))
        .single();
        
      if (error) throw error;
      return NextResponse.json({ success: true, contract });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    // ── Booking Settings (includes questionnaire & contract template IDs) ─────
    if (type === 'settings') {
      const { data: row } = await supabase
        .from('Booking_Settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      const DEFAULTS = {
        Step1_Title: 'Choose Your Experience',
        Step1_Subtitle: 'Select the collection that perfectly fits your day.',
        Step2_Title: 'Tell Us About Your Day',
        Step2_Subtitle: 'Help us prepare the perfect agreement for your event.',
        Step3_Title: 'Review & Sign Your Contract',
        Step3_Subtitle: 'Please fill out any required fields and sign the agreement below.',
        Step4_Title: 'Complete Your Booking',
        Step4_Subtitle: 'Secure your date by submitting the 50% retainer.',
      };

      return NextResponse.json({
        success: true,
        settings: {
          steps: [
            { title: row?.Step1_Title || DEFAULTS.Step1_Title, subtitle: row?.Step1_Subtitle || DEFAULTS.Step1_Subtitle },
            { title: row?.Step2_Title || DEFAULTS.Step2_Title, subtitle: row?.Step2_Subtitle || DEFAULTS.Step2_Subtitle },
            { title: row?.Step3_Title || DEFAULTS.Step3_Title, subtitle: row?.Step3_Subtitle || DEFAULTS.Step3_Subtitle },
            { title: row?.Step4_Title || DEFAULTS.Step4_Title, subtitle: row?.Step4_Subtitle || DEFAULTS.Step4_Subtitle },
          ],
          addons: JSON.parse(row?.Addons || '[]'),
          paymentMethods: JSON.parse(row?.Payment_Methods || '[]'),
          confirmationTitle: row?.Confirmation_Title || 'Booking Confirmed!',
          confirmationMessage: row?.Confirmation_Message || 'Your deposit has been received. We are officially locked in!',
          questionnaireTemplateId: row?.Questionnaire_Template_ID || null,
          contractTemplateId: row?.Contract_Template_ID || null,
        }
      });
    }

    // ── Packages ─────────────────────────────────────────────────────────────
    if (type === 'packages') {
      const { data: packages, error } = await supabase
        .from('Packages')
        .select('*, Sessions(*)')
        .eq('user_id', userId)
        .order('Price', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, packages: packages || [] });
    }

    // ── Portrait Settings ────────────────────────────────────────────────────
    if (type === 'portrait_settings') {
      function safeJSON(val: any, fallback: any) {
        try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
      }

      const [{ data: row }, { data: appConfig }] = await Promise.all([
        supabase.from('Portrait_Settings').select('*').eq('user_id', userId).single(),
        supabase.from('AppConfig').select('Company_Name, Brand_Color, Business_Logo, Email_User, Website').eq('user_id', userId).single(),
      ]);

      return NextResponse.json({
        success: true,
        settings: {
          // Brand
          companyName:    appConfig?.Company_Name   || 'Portrait Studio',
          brandColor:     appConfig?.Brand_Color    || '#1e293b',
          businessLogo:   appConfig?.Business_Logo  || null,
          emailUser:      appConfig?.Email_User     || null,
          website:        appConfig?.Website        || '',
          // Hero / intro
          heroHeadline:          row?.Hero_Headline            || "Let's plan your perfect session.",
          heroSubheadline:       row?.Hero_Subheadline         || 'Fill out the details below to start the booking process.',
          // Welcome guide hero
          welcomeHeroHeadline:   row?.Welcome_Hero_Headline    || 'Welcome to the Experience.',
          welcomeHeroSubheadline: row?.Welcome_Hero_Subheadline || 'Thank you for inquiring! This guide outlines our signature style, transparent pricing, and the simple three-step process to secure your session.',
          welcomeHeroPhotoUrl:   row?.Welcome_Hero_Photo_URL   || '',
          aboutText:             row?.About_Text               || '',
          sessionTypes:    safeJSON(row?.Session_Types,    ['Family Portrait','Maternity','Newborn','Couples/Engagement','Senior Portraits','Headshots/Branding']),
          retainerAmount:  row?.Retainer_Amount  || 100,
          // Custom inquiry questions
          customQuestions: safeJSON(row?.Custom_Questions, []),
          // Budget ranges for the inquiry form
          budgetRanges: safeJSON(row?.Budget_Ranges, ['Under $500', '$500 - $1,000', '$1,000 - $2,000', '$2,000+']),
          // Book funnel step headings
          steps: [
            { title: row?.Step1_Title || 'Choose Your Experience',      subtitle: row?.Step1_Subtitle || 'Select the date and time for your portrait session.' },
            { title: row?.Step2_Title || 'Review & Sign Your Contract', subtitle: row?.Step2_Subtitle || 'Please review and sign the agreement below.' },
            { title: row?.Step3_Title || 'Complete Your Booking',       subtitle: row?.Step3_Subtitle || 'Secure your session by submitting the retainer.' },
          ],
          contractTemplateId:   row?.Contract_Template_ID  || null,
          confirmationTitle:    row?.Confirmation_Title     || 'Booking Confirmed!',
          confirmationMessage:  row?.Confirmation_Message   || 'Your deposit has been received and your session is securely booked. We look forward to working with you!',
          // Signature style section
          styleHeading:     row?.Style_Heading     || 'Candid. Timeless. Authentic.',
          styleDescription: row?.Style_Description || 'We specialize in capturing raw, authentic moments rather than stiff poses. Our editing style relies on true-to-life colors with a subtle cinematic warmth.',
          styleBullets:     safeJSON(row?.Style_Bullets,    ['Natural light prioritization','Guided, movement-based posing','True-to-color editing aesthetic','Focus on genuine emotion']),
          stylePhotoUrl:    row?.Style_Photo_URL   || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',
          // Investment packages
          packages: safeJSON(row?.Packages, [
            { name: 'The Mini',     price: 350,  description: 'Perfect for quick updates or headshots.',        features: ['30 Minute Session','15 Edited Images','1 Location'],             featured: false },
            { name: 'The Classic',  price: 650,  description: 'The ideal balance for families and couples.',    features: ['60 Minute Session','50+ Edited Images','Up to 2 Outfits'],      featured: true  },
            { name: 'The Extended', price: 950,  description: 'For editorial or multi-location shoots.',        features: ['2 Hour Session','100+ Edited Images','Multiple Locations'],     featured: false },
          ]),
          // What's Next steps
          whatsNextHeading: row?.Whats_Next_Heading || "What happens next?",
          whatsNextSub:     row?.Whats_Next_Sub     || 'Booking your session is a seamless, 3-step process.',
          whatsNextSteps:   safeJSON(row?.Whats_Next_Steps, [
            { title: 'Pick Your Date',   description: 'View my real-time calendar and select the exact date and time that works for you.' },
            { title: 'Sign Digitally',   description: 'Review and sign your digital contract instantly to secure the legalities.' },
            { title: 'Pay Retainer',     description: 'Submit your non-refundable retainer securely. Your date is officially locked in!' },
          ]),
          // Payment
          paymentMethods:      safeJSON(row?.Payment_Methods, []),
          paymentInstructions: row?.Payment_Instructions || '',
          venmoHandle:         row?.Venmo_Handle         || '',
          paypalLink:          row?.Paypal_Link          || '',
          zelleContact:        row?.Zelle_Contact        || '',
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Public booking API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
