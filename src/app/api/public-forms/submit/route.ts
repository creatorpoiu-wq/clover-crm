import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { runAutomations } from '@/lib/automationEngine';

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

    // 1. Fetch form to get user_id, title, and fields array
    const { data: form, error: formError } = await supabase
      .from('Forms')
      .select('user_id, title, fields, auto_reply_message, questionnaire_link, questionnaire_button_text')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    }

    const userId = form.user_id;

    // We expect the form to at least have an 'email' field or a 'Name' field for the contact.
    // Let's try to extract standard fields by mapping the form data IDs to their actual labels (case insensitive search)
    const getFieldByLabel = (searchKeys: string[]) => {
      const fieldDef = (form.fields || []).find((f: any) => 
        searchKeys.some(searchKey => f.label.toLowerCase().includes(searchKey))
      );
      if (fieldDef && formData[fieldDef.id]) {
        return formData[fieldDef.id];
      }
      return '';
    };

    const email = getFieldByLabel(['email']);
    const name = getFieldByLabel(['name', 'first', 'last']) || 'Unknown Lead';
    const phone = getFieldByLabel(['phone', 'mobile', 'cell']) || '';
    const packageSelection = getFieldByLabel(['package', 'service', 'tier', 'plan']) || '';

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
    const { data: newInquiry, error: inquiryError } = await supabase
      .from('Inquiries')
      .insert({
        user_id: userId,
        Contact_ID: contactId,
        Service_Type: packageSelection || `Form Submission: ${form.title}`,
        Pipeline_Stage: 'New Inquiry',
        Questionnaire_Data: formData, // Store all form data here
      })
      .select()
      .single();

    if (inquiryError) throw inquiryError;

    // Trigger automations for form submission
    runAutomations('form_submitted', { inquiryId: newInquiry.Inquiry_ID }).catch(console.error);

    // Auto-trigger AI draft so Kasey drafts a warm welcome reply (fire and forget)
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inquiryId: newInquiry.Inquiry_ID }),
    }).catch((e) => console.error('AI draft auto-trigger (form) failed:', e));

    // Map field IDs to their actual labels for readable output
    const fieldMap: Record<string, string> = {};
    if (form.fields) {
      form.fields.forEach((f: any) => {
        fieldMap[f.id] = f.label;
      });
    }

    let formSummaryText = `Submitted form: ${form.title}\n\n`;
    for (const [key, value] of Object.entries(formData)) {
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      const label = fieldMap[key] || key;
      formSummaryText += `${label}:\n${displayValue}\n\n`;
    }

    // 4. Log Communication
    await supabase.from('Communications').insert({
      user_id: userId,
      Contact_ID: contactId,
      Last_Contact_By: name,
      Last_Contact_Date: new Date().toISOString(),
      Method: 'Form',
      Notes: formSummaryText.trim()
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
        
        let htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <!-- Header -->
            <div style="background-color: #0f172a; padding: 30px; text-align: center;">
              <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">New Form Submission</h2>
              <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 15px;">${form.title}</p>
            </div>

            <!-- Body -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; margin-top: 0; margin-bottom: 24px; line-height: 1.5;">
                You have received a new inquiry from <strong>${name}</strong> (<a href="mailto:${actualEmail}" style="color: #3b82f6; text-decoration: none;">${actualEmail}</a>).
              </p>
              
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tbody>`;
        
        // (fieldMap already generated above)
        
        let isEven = false;
        for (const [key, value] of Object.entries(formData)) {
          const displayValue = Array.isArray(value) ? value.join(', ') : value;
          const label = fieldMap[key] || key;
          const bg = isEven ? '#f8fafc' : '#ffffff';
          
          htmlBody += `
                    <tr style="background-color: ${bg};">
                      <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; width: 35%; color: #475569; vertical-align: top; font-size: 14px;">${label}</td>
                      <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; vertical-align: top; font-size: 15px;">${displayValue}</td>
                    </tr>`;
          isEven = !isEven;
        }
        
        htmlBody += `
                  </tbody>
                </table>
              </div>

              <!-- Action -->
              <div style="margin-top: 36px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://clover-crm.vercel.app'}/dashboard/pipeline" 
                   style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                  View in Pipeline
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 13px; color: #64748b; margin: 0;">Sent securely via ${companyName} CRM</p>
            </div>

          </div>
        </div>`;

        await transporter.sendMail({
          from: `"${companyName} Notifications" <${config.Email_User}>`,
          to: config.Email_User, // send to self
          subject: `New Inquiry: ${form.title} - ${name}`,
          html: htmlBody
        });

        // 6. Send Auto-Reply to Client
        if (email) {
          const autoReplyBody = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="padding: 40px 30px;">
                  <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Hi ${name},</h2>
                  <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #475569; white-space: pre-wrap;">${form.auto_reply_message || `Thank you for reaching out to <strong>${companyName}</strong>! We have successfully received your submission for <em>${form.title}</em>.\n\nOur team will review your information and get back to you shortly.`}</p>
                  
                  ${form.questionnaire_link ? `
                  <div style="margin: 32px 0; text-align: center;">
                    <a href="${form.questionnaire_link}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                      ${form.questionnaire_button_text || 'Complete Intake Questionnaire'}
                    </a>
                  </div>
                  ` : ''}
                  
                  <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 32px;">
                    <p style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 12px;">Your Submission details:</p>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tbody>
                        ${Object.entries(formData).map(([key, value]) => {
                          const displayValue = Array.isArray(value) ? value.join(', ') : value;
                          const label = fieldMap[key] || key;
                          return `<tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 40%; vertical-align: top;">${label}</td>
                            <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 500; vertical-align: top;">${displayValue}</td>
                          </tr>`;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="font-size: 13px; color: #64748b; margin: 0;">${companyName}</p>
                </div>
              </div>
            </div>`;

          await transporter.sendMail({
            from: `"${companyName}" <${config.Email_User}>`,
            to: actualEmail,
            subject: `We've received your submission: ${form.title}`,
            html: autoReplyBody
          });
        }
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
