import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { contactId, contractId, questionnaireId } = await req.json();
    
    if (!contactId) {
      return NextResponse.json({ success: false, error: 'Missing contactId' }, { status: 400 });
    }

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // 1. Get contact email
    const { data: contact, error: contactError } = await supabase
      .from('Contacts')
      .select('Name, Email')
      .eq('Contact_ID', contactId)
      .single();

    if (contactError || !contact || !contact.Email) {
      return NextResponse.json({ success: false, error: 'Contact does not have a valid email address.' }, { status: 400 });
    }

    // 2. Get App Config for SMTP credentials + email settings
    const { data: config, error: configError } = await supabase
      .from('AppConfig')
      .select('Email_User, Email_Pass, Company_Name, Email_Settings')
      .eq('user_id', userAuth.user.id)
      .single();

    if (configError || !config || !config.Email_User || !config.Email_Pass) {
      return NextResponse.json({ success: false, error: 'Email configuration is missing. Please set up your SMTP credentials in Settings.' }, { status: 400 });
    }

    // 3. Create the Proposal Link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const proposalLink = `${appUrl}/booking?contractId=${contractId}&questionnaireId=${questionnaireId}`;

    // 4. Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.Email_User, pass: config.Email_Pass }
    });

    const companyName = config.Company_Name || 'Our Studio';
    const clientName = contact.Name.split(' ')[0];

    // 5. Load email design settings
    let emailSettings: any = {};
    try { emailSettings = JSON.parse(config.Email_Settings || '{}'); } catch { emailSettings = {}; }
    const es = emailSettings.proposal || {};

    const subject     = (es.subject    || 'Your Booking Proposal is Ready').replace('[Name]', clientName).replace('[Company]', companyName);
    const headerText  = es.headerText  || 'Your booking proposal is ready for review.';
    const greeting    = (es.greeting   || 'Hello [Name],').replace('[Name]', clientName);
    const body        = (es.body       || 'We are excited to work with you! Your customised booking proposal is ready. Please click the button below to complete your questionnaire, sign your contract, and finalise your booking deposit.').replace('[Name]', clientName).replace('[Company]', companyName);
    const ctaText     = es.ctaText     || 'View Booking Proposal';
    const footerText  = es.footerText  || `Questions? Simply reply to this email and we'll be happy to help.`;
    const accentColor = es.accentColor || '#0d9488';

    // 6. Send the Email
    await transporter.sendMail({
      from: `"${companyName}" <${config.Email_User}>`,
      to: contact.Email,
      subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
          <div style="background: ${accentColor}; padding: 32px 40px; border-radius: 12px 12px 0 0;">
            <div style="color: #fff; font-weight: 800; font-size: 20px; margin-bottom: 6px;">${companyName}</div>
            <div style="color: rgba(255,255,255,0.85); font-size: 14px;">${headerText}</div>
          </div>
          <div style="background: #fff; padding: 36px 40px;">
            <p style="font-size: 16px; font-weight: 700; margin: 0 0 16px; color: #111827;">${greeting}</p>
            <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 32px;">${body}</p>
            <div style="text-align: center; margin: 0 0 32px;">
              <a href="${proposalLink}" style="background: ${accentColor}; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">
                ${ctaText}
              </a>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">Or copy this link:</p>
            <p style="word-break: break-all; color: ${accentColor}; font-size: 13px; margin: 0;">
              <a href="${proposalLink}">${proposalLink}</a>
            </p>
          </div>
          <div style="background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0 0 4px;">${footerText}</p>
            <p style="font-size: 11px; color: #d1d5db; margin: 0;">Sent via ${companyName} CRM</p>
          </div>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: 'Proposal sent successfully via email.' });
  } catch (error: any) {
    console.error('Send Proposal API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
