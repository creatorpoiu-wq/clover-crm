import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const EMAIL_DEFAULTS = {
  proposal: {
    subject: 'Your Booking Proposal is Ready',
    headerText: 'Your booking proposal is ready for review.',
    greeting: 'Hello [Name],',
    body: 'We are excited to work with you! Your customised booking proposal is ready. Please click the button below to complete your questionnaire, sign your contract, and finalise your booking deposit.',
    ctaText: 'View Booking Proposal',
    footerText: 'Questions? Simply reply to this email and we\'ll be happy to help.',
    accentColor: '#0d9488',
  },
  contract: {
    subject: 'Contract Ready for Your Signature',
    headerText: 'Your contract is ready for review and signature.',
    greeting: 'Hello [Name],',
    body: 'Please review the agreement carefully. Click the button below to read the full contract and add your digital signature to finalise your booking.',
    ctaText: 'Review & Sign Contract',
    footerText: 'Digital signatures are legally binding under ESIGN and UETA. Reply to this email with any questions.',
    accentColor: '#0d9488',
  },
  invoice: {
    subject: 'Invoice from [Company]',
    headerText: 'You have received a new invoice.',
    greeting: 'Hello [Name],',
    body: 'Please find your invoice attached. Review the details below and use the payment options provided to complete your payment.',
    ctaText: 'View Invoice',
    footerText: 'Thank you for your business! Please contact us if you have any questions.',
    accentColor: '#1e40af',
  },
  reminder: {
    subject: 'Friendly Reminder from [Company]',
    headerText: 'You have an upcoming event or follow-up.',
    greeting: 'Hello [Name],',
    body: 'This is a quick reminder regarding your upcoming event or outstanding items. We look forward to working with you soon!',
    ctaText: 'View Details',
    footerText: 'If you have any questions, please reply to this email.',
    accentColor: '#0d9488',
    smsText: 'Hi [Name]! Just a friendly reminder regarding your upcoming event with [Company]. Reply if you have questions!'
  },
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: config, error } = await supabase
      .from('AppConfig')
      .select('Email_Settings')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    let stored: any = {};
    try { stored = JSON.parse(config?.Email_Settings || '{}'); } catch { stored = {}; }

    const settings = {
      proposal: { ...EMAIL_DEFAULTS.proposal, ...(stored.proposal || {}) },
      contract: { ...EMAIL_DEFAULTS.contract, ...(stored.contract || {}) },
      invoice:  { ...EMAIL_DEFAULTS.invoice,  ...(stored.invoice  || {}) },
      reminder: { ...EMAIL_DEFAULTS.reminder, ...(stored.reminder || {}) },
    };

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Email Settings API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { proposal, contract, invoice, reminder } = body;

    const settings = {
      proposal: { ...EMAIL_DEFAULTS.proposal, ...(proposal || {}) },
      contract: { ...EMAIL_DEFAULTS.contract, ...(contract || {}) },
      invoice:  { ...EMAIL_DEFAULTS.invoice,  ...(invoice  || {}) },
      reminder: { ...EMAIL_DEFAULTS.reminder, ...(reminder || {}) },
    };

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('AppConfig')
      .update({ Email_Settings: JSON.stringify(settings) })
      .eq('user_id', userAuth.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email Settings API PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
