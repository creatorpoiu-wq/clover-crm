import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { contactId, templateId } = await req.json();
    
    if (!contactId || !templateId) {
      return NextResponse.json({ success: false, error: 'Missing contactId or templateId' }, { status: 400 });
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

    // 2. Get the template
    const { data: template, error: templateError } = await supabase
      .from('EmailTemplates')
      .select('Subject, Body')
      .eq('Template_ID', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: 'Selected template not found.' }, { status: 400 });
    }

    // 3. Get App Config for SMTP credentials
    const { data: config, error: configError } = await supabase
      .from('AppConfig')
      .select('Email_User, Email_Pass, Company_Name')
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

    const companyName = config.Company_Name || 'Clover';
    const clientName = contact.Name.split(' ')[0];

    // Replace variables in the template
    let parsedBody = template.Body
      .replace(/\[Name\]/gi, clientName)
      .replace(/\[Client Name\]/gi, contact.Name)
      .replace(/\{Name\}/gi, clientName)
      .replace(/\{Client Name\}/gi, contact.Name)
      .replace(/\n/g, '<br/>');

    let parsedSubject = template.Subject
      .replace(/\[Name\]/gi, clientName)
      .replace(/\[Client Name\]/gi, contact.Name)
      .replace(/\{Name\}/gi, clientName)
      .replace(/\{Client Name\}/gi, contact.Name);

    // 5. Send the Email
    await transporter.sendMail({
      from: `"${companyName}" <${config.Email_User}>`,
      to: contact.Email,
      subject: parsedSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="font-size: 16px; line-height: 1.6;">
            ${parsedBody}
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Sent securely via ${companyName} CRM
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully.' });
  } catch (error: any) {
    console.error('Send Email API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
