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

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Public booking API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
