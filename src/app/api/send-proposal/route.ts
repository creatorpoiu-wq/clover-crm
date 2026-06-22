import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';
import { wrapWithGlobalBranding } from '@/lib/email-renderer';

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
      .select('Email_User, Email_Pass, Company_Name, Email_Settings, Custom_Domain')
      .eq('user_id', userAuth.user.id)
      .single();

    if (configError || !config || !config.Email_User || !config.Email_Pass) {
      return NextResponse.json({ success: false, error: 'Email configuration is missing. Please set up your SMTP credentials in Settings.' }, { status: 400 });
    }

    // 3. Get the Contract Template and Create a Contract Record
    let realContractId = contractId;
    const today = new Date().toISOString().split('T')[0];
    
    if (contractId) {
      // Find the latest Inquiry for this contact to attach the Contract to
      const { data: latestInq } = await supabase
        .from('Inquiries')
        .select('Inquiry_ID')
        .eq('Contact_ID', contactId)
        .order('Inquiry_ID', { ascending: false })
        .limit(1)
        .single();
        
      const inquiryId = latestInq?.Inquiry_ID || null;

      // Fetch template
      const { data: template } = await supabase
        .from('Contract_Templates')
        .select('Name, Content')
        .eq('Template_ID', contractId)
        .single();
        
      if (template) {
        const clientNameForVars = contact?.Name || 'Client Name';
        const clientFirstName = clientNameForVars.split(' ')[0] || 'there';
        const companyName = config?.Company_Name || 'Your Photographer';
        const todayString = new Date().toLocaleDateString();

        const replaceVars = (text: string) => {
          if (!text) return '';
          return text
            .replace(/\[Client Name\]|\{Client Name\}/gi, clientNameForVars)
            .replace(/\[Name\]|\{Name\}/gi, clientFirstName)
            .replace(/\[Company\]|\{Company\}/gi, companyName)
            .replace(/\[Company Name\]|\{Company Name\}/gi, companyName)
            .replace(/\[Date\]|\{Date\}/gi, todayString)
            .replace(/\[Today's Date\]|\{Today's Date\}/gi, todayString);
        };

        let finalContent = replaceVars(template.Content || '');

        // Create Contract
        const { data: newContract, error: insertError } = await supabase
          .from('Contracts')
          .insert({
            user_id: userAuth.user.id,
            Inquiry_ID: inquiryId,
            Contract_Title: template.Name || 'Booking Proposal',
            Contract_Text: finalContent,
            Status: 'Sent',
            Sent_Date: today,
            Type: 'Proposal'
          })
          .select()
          .single();
          
        if (newContract && !insertError) {
          realContractId = newContract.Contract_ID.toString();
        }
      }
    }

    // 4. Create the Proposal Link
    // Use the incoming request host as the most reliable source of the app URL
    const userId = userAuth.user.id;
    const host = req.headers.get('host') || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const appUrl = config.Custom_Domain 
      ? `https://${config.Custom_Domain}`
      : process.env.NEXT_PUBLIC_BASE_URL 
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) 
        || `${protocol}://${host}`;
    const proposalLink = `${appUrl}/booking?userId=${userId}&contractId=${realContractId}&questionnaireId=${questionnaireId}`;

    // 5. Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.Email_User, pass: config.Email_Pass }
    });

    const companyName = config.Company_Name || 'Your Photographer';
    const clientName = (contact.Name || 'there').split(' ')[0];
    const clientFullName = contact.Name || 'Client Name';
    const todayString = new Date().toLocaleDateString();

    const replaceVarsEmail = (text: string) => {
      if (!text) return '';
      return text
        .replace(/\[Client Name\]|\{Client Name\}/gi, clientFullName)
        .replace(/\[Name\]|\{Name\}/gi, clientName)
        .replace(/\[Company\]|\{Company\}/gi, companyName)
        .replace(/\[Company Name\]|\{Company Name\}/gi, companyName)
        .replace(/\[Date\]|\{Date\}/gi, todayString)
        .replace(/\[Today's Date\]|\{Today's Date\}/gi, todayString);
    };

    // 5. Load email design settings
    let emailSettings: any = {};
    try { emailSettings = JSON.parse(config.Email_Settings || '{}'); } catch { emailSettings = {}; }
    const es = emailSettings.proposal || {};

    const subject     = replaceVarsEmail(es.subject    || 'Your Booking Proposal is Ready');
    const headerText  = replaceVarsEmail(es.headerText || 'Your booking proposal is ready for review.');
    const greeting    = replaceVarsEmail(es.greeting   || 'Hello [Name],');
    const body        = replaceVarsEmail(es.body       || 'We are excited to work with you! Your customised booking proposal is ready. Please click the button below to complete your questionnaire, sign your contract, and finalise your booking deposit.');
    const ctaText     = replaceVarsEmail(es.ctaText    || 'View Booking Proposal');
    const footerText  = replaceVarsEmail(es.footerText || `Questions? Simply reply to this email and we'll be happy to help.`);
    const accentColor = es.accentColor || '#0d9488';

    // HTML-encode & as &amp; for email href attributes (required by strict email clients like Outlook)
    const proposalLinkHtml = proposalLink.replace(/&/g, '&amp;');

    const innerHtml = `
      <p style="font-size: 16px; font-weight: 700; margin: 0 0 16px; color: #111827;">${greeting}</p>
      <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 32px;">${body}</p>
      <div style="text-align: center; margin: 0 0 32px;">
        <a href="${proposalLinkHtml}" class="button">
          ${ctaText}
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">Or copy this link into your browser:</p>
      <p style="word-break: break-all; color: #374151; font-size: 12px; margin: 0; background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
        ${proposalLink}
      </p>
    `;

    const finalHtml = wrapWithGlobalBranding(innerHtml, companyName, emailSettings.global, accentColor, headerText);

    // 6. Send the Email
    await transporter.sendMail({
      from: `"${companyName}" <${config.Email_User}>`,
      to: contact.Email,
      subject,
      html: finalHtml,
      text: `${greeting}\n\n${body}\n\nClick here to view your booking proposal:\n${proposalLink}\n\n${footerText}`
    });

    // 7. Update CRM Statuses
    // 7. Update CRM Statuses
    if (contactId) {
      // Find the latest Inquiry for this contact to update Pipeline
      const { data: latestInq } = await supabase
        .from('Inquiries')
        .select('Inquiry_ID')
        .eq('Contact_ID', contactId)
        .order('Inquiry_ID', { ascending: false })
        .limit(1)
        .single();
        
      if (latestInq?.Inquiry_ID) {
        await supabase
          .from('Inquiries')
          .update({ Pipeline_Stage: 'Sent Proposal' })
          .eq('Inquiry_ID', latestInq.Inquiry_ID);
      }
    }

    return NextResponse.json({ success: true, message: 'Proposal sent successfully via email.' });
  } catch (error: any) {
    console.error('Send Proposal API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
