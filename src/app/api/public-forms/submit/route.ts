import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    // We use service client because the submitter is unauthenticated
    const supabase = getServiceClient();
    const payload = await req.json();

    const { formId, formData } = payload;
    if (!formId || !formData) {
      return NextResponse.json({ success: false, error: 'Missing formId or formData' }, { status: 400 });
    }

    // 1. Fetch form to get user_id and verify it exists
    const { data: form, error: formError } = await supabase
      .from('Forms')
      .select('user_id, title')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    }

    const userId = form.user_id;

    // We expect the form to at least have an 'email' field or a 'Name' field for the contact.
    // Let's try to extract standard fields (case insensitive search)
    const getField = (keys: string[]) => {
      const key = Object.keys(formData).find(k => keys.some(searchKey => k.toLowerCase().includes(searchKey)));
      return key ? formData[key] : '';
    };

    const email = getField(['email']);
    const name = getField(['name', 'first', 'last']) || 'Unknown Lead';
    const phone = getField(['phone', 'mobile', 'cell']) || '';

    if (!email) {
      // It's highly recommended forms have an email field, but if not, we still need a placeholder
      // or we can just reject it. Let's create a placeholder if missing.
    }

    // 2. Find or create Contact
    let contactId: number | null = null;
    let actualEmail = email || `no-email-${Date.now()}@example.com`;

    const { data: existingContact } = await supabase
      .from('Contacts')
      .select('Contact_ID, Phone')
      .eq('user_id', userId)
      .eq('Email', actualEmail)
      .single();

    if (existingContact) {
      contactId = existingContact.Contact_ID;
      if (phone && !existingContact.Phone) {
        await supabase.from('Contacts').update({ Phone: phone }).eq('Contact_ID', contactId);
      }
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('Contacts')
        .insert({
          user_id: userId,
          Name: name,
          Email: actualEmail,
          Phone: phone,
          Lead_Source: `Embedded Form: ${form.title}`,
        })
        .select()
        .single();
      if (contactError) throw contactError;
      contactId = newContact.Contact_ID;
    }

    // 3. Create Inquiry
    const { error: inquiryError } = await supabase
      .from('Inquiries')
      .insert({
        user_id: userId,
        Contact_ID: contactId,
        Service_Type: `Form Submission: ${form.title}`,
        Pipeline_Stage: 'New Inquiry',
        Questionnaire_Data: formData, // Store all form data here
      });

    if (inquiryError) throw inquiryError;

    // 4. Log Communication
    await supabase.from('Communications').insert({
      user_id: userId,
      Contact_ID: contactId,
      Last_Contact_By: name,
      Last_Contact_Date: new Date().toISOString(),
      Method: 'Form',
      Notes: `Submitted form: ${form.title}`
    });

    // 5. Send Email Notification to CRM Owner
    try {
      const { data: config } = await supabase
        .from('AppConfig')
        .select('Email_User, Email_Pass, Company_Name')
        .eq('user_id', userId)
        .single();

      if (config && config.Email_User && config.Email_Pass) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({ 
          service: 'gmail', 
          auth: { user: config.Email_User, pass: config.Email_Pass } 
        });
        
        const companyName = config.Company_Name || 'Your CRM';
        
        let htmlBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">New Form Submission: ${form.title}</h2>
          <p style="font-size: 16px;">You have received a new inquiry from <strong>${name}</strong> (${actualEmail}).</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tbody>`;
        
        for (const [key, value] of Object.entries(formData)) {
          htmlBody += `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 30%; color: #64748b;">${key}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${value}</td>
            </tr>`;
        }
        
        htmlBody += `
            </tbody>
          </table>
          <div style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://clover-crm.vercel.app'}/dashboard/pipeline" style="background-color: #4da685; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in Pipeline</a>
          </div>
        </div>`;

        await transporter.sendMail({
          from: `"${companyName} Notifications" <${config.Email_User}>`,
          to: config.Email_User, // send to self
          subject: `New Inquiry: ${form.title} - ${name}`,
          html: htmlBody
        });
      }
    } catch (emailErr) {
      console.error('Failed to send notification email:', emailErr);
      // Don't throw error to client if email fails, just log it.
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Public Form Submit Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
