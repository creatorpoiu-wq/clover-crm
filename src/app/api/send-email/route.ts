import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';
import { wrapWithGlobalBranding } from '@/lib/email-renderer';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { contactId, templateId, subject, body } = await req.json();
    
    if (!contactId) {
      return NextResponse.json({ success: false, error: 'Missing contactId' }, { status: 400 });
    }

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    // 1. Get contact email and name
    const { data: contact, error: contactError } = await supabase
      .from('Contacts')
      .select('Name, Email')
      .eq('Contact_ID', contactId)
      .single();

    if (contactError || !contact || !contact.Email) {
      return NextResponse.json({ success: false, error: 'Contact does not have a valid email address.' }, { status: 400 });
    }

    // 2. Handle template or free-form content
    let parsedSubject = '';
    let parsedBody = '';
    const clientName = contact.Name.split(' ')[0];

    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('EmailTemplates')
        .select('Subject, Body')
        .eq('Template_ID', templateId)
        .single();

      if (templateError || !template) {
        return NextResponse.json({ success: false, error: 'Selected template not found.' }, { status: 400 });
      }

      parsedBody = template.Body
        .replace(/\[Name\]/gi, clientName)
        .replace(/\[Client Name\]/gi, contact.Name)
        .replace(/\{Name\}/gi, clientName)
        .replace(/\{Client Name\}/gi, contact.Name)
        .replace(/\n/g, '<br/>');

      parsedSubject = template.Subject
        .replace(/\[Name\]/gi, clientName)
        .replace(/\[Client Name\]/gi, contact.Name)
        .replace(/\{Name\}/gi, clientName)
        .replace(/\{Client Name\}/gi, contact.Name);
    } else {
      if (!subject || !body) {
        return NextResponse.json({ success: false, error: 'Subject and body are required for free-form emails.' }, { status: 400 });
      }
      parsedSubject = subject;
      parsedBody = body.replace(/\n/g, '<br/>');
    }

    // 3. Get App Config for SMTP credentials
    const { data: config, error: configError } = await supabase
      .from('AppConfig')
      .select('Email_User, Email_Pass, Company_Name, Email_Settings')
      .eq('user_id', userAuth.user.id)
      .single();

    if (configError || !config || !config.Email_User || !config.Email_Pass) {
      return NextResponse.json({ success: false, error: 'Email configuration is missing. Please set up your SMTP credentials in Settings.' }, { status: 400 });
    }

    // 4. Configure Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: config.Email_User, pass: config.Email_Pass }
    });

    const companyName = config.Company_Name || '';
    
    let emailSettings: any = {};
    try { emailSettings = JSON.parse(config.Email_Settings || '{}'); } catch { emailSettings = {}; }

    const innerHtml = `
      <div style="font-size: 16px; line-height: 1.6;">
        ${parsedBody}
      </div>
    `;

    const emailHtml = wrapWithGlobalBranding(innerHtml, companyName, emailSettings.global, undefined, parsedSubject);

    // 5. Send the Email
    await transporter.sendMail({
      from: `"${companyName}" <${config.Email_User}>`,
      to: contact.Email,
      subject: parsedSubject,
      html: emailHtml
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully.' });
  } catch (error: any) {
    console.error('Send Email API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
