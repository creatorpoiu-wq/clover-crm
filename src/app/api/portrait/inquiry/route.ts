import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const payload = await req.json();

    const {
      userId,
      // Contact info
      name, email, phone,
      // Session preferences
      sessionType, preferredDates, numberOfPeople, locationPreference,
      // Budget / timeline
      budget, timeline,
      // Message
      message,
      // Source
      referral,
      // Custom Answers
      customAnswers,
      // Honeypot
      _hp,
    } = payload;

    if (!userId || !name || !email || !sessionType) {
      return NextResponse.json({ success: false, error: 'Missing required fields (name, email, sessionType)' }, { status: 400 });
    }

    // Honeypot check - silently ignore spam
    if (_hp) {
      console.log('Spam trapped via honeypot (Portrait Inquiry)');
      return NextResponse.json({ success: true, inquiryId: -1, contactId: -1 });
    }

    // 1. Create or find Contact
    let contactId: number | null = null;
    const { data: existingContact } = await supabase
      .from('Contacts')
      .select('Contact_ID, Phone')
      .eq('user_id', userId)
      .eq('Email', email)
      .single();

    if (existingContact) {
      contactId = existingContact.Contact_ID;
      // Update phone if provided and previously empty
      if (phone && !existingContact.Phone) {
        await supabase.from('Contacts').update({ Phone: phone }).eq('Contact_ID', contactId);
      }
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('Contacts')
        .insert({
          user_id: userId,
          Name: name,
          Email: email,
          Phone: phone || '',
          Lead_Source: referral || 'Portrait Booking Page',
        })
        .select()
        .single();
      if (contactError) throw contactError;
      contactId = newContact.Contact_ID;
    }

    // 2. Create Inquiry with all session data
    const questionnaireData = {
      preferredDates: preferredDates || '',
      numberOfPeople: numberOfPeople || '',
      locationPreference: locationPreference || '',
      budget: budget || '',
      timeline: timeline || '',
      message: message || '',
      referral: referral || '',
      customAnswers: customAnswers || {},
    };

    const { data: inquiry, error: inquiryError } = await supabase
      .from('Inquiries')
      .insert({
        user_id: userId,
        Contact_ID: contactId,
        Service_Type: sessionType,
        Event_Date: null, // Selected in later funnel step
        Estimated_Value: null,
        Pipeline_Stage: 'New Inquiry',
        Questionnaire_Data: questionnaireData,
      })
      .select()
      .single();

    if (inquiryError) throw inquiryError;

    // 3. Log a communication record
    try {
      await supabase.from('Communications').insert({
        user_id: userId,
        Contact_ID: contactId,
        Last_Contact_By: name,
        Last_Contact_Date: new Date().toISOString(),
        Message: `<strong>New booking inquiry submitted via Portrait Booking Page</strong><br/>
Session Type: ${sessionType}<br/>
${preferredDates ? `Preferred Dates: ${preferredDates}<br/>` : ''}
${numberOfPeople ? `Number of People: ${numberOfPeople}<br/>` : ''}
${locationPreference ? `Location Preference: ${locationPreference}<br/>` : ''}
${budget ? `Budget Range: ${budget}<br/>` : ''}
${message ? `Message: ${message}` : ''}`.trim(),
      });
    } catch (e) {
      // Non-critical — don't fail the inquiry if comms insert fails
    }

    // 4. Notify photographer via email (non-blocking)
    try {
      const { data: appConfig } = await supabase
        .from('AppConfig')
        .select('Email_User, Email_Pass, Company_Name')
        .eq('user_id', userId)
        .single();

      if (appConfig?.Email_User && appConfig?.Email_Pass) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: appConfig.Email_User, pass: appConfig.Email_Pass },
        });

        await transporter.sendMail({
          from: `"${appConfig.Company_Name || 'Portrait Studio'}" <${appConfig.Email_User}>`,
          to: appConfig.Email_User,
          subject: `📸 New Booking Inquiry from ${name}`,
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
              <div style="background:#1e293b;padding:32px 40px;">
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">New Portrait Inquiry</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Someone just submitted a booking request through your Portrait Booking Page</p>
              </div>
              <div style="padding:32px 40px;">
                <table style="width:100%;border-collapse:collapse;font-size:15px;">
                  <tr><td style="padding:10px 0;color:#64748b;font-weight:600;width:140px;">Name</td><td style="padding:10px 0;color:#0f172a;font-weight:700;">${name}</td></tr>
                  <tr style="background:#f8fafc;"><td style="padding:10px 8px;color:#64748b;font-weight:600;">Email</td><td style="padding:10px 8px;color:#0f172a;"><a href="mailto:${email}" style="color:#0d9488;">${email}</a></td></tr>
                  ${phone ? `<tr><td style="padding:10px 0;color:#64748b;font-weight:600;">Phone</td><td style="padding:10px 0;color:#0f172a;">${phone}</td></tr>` : ''}
                  <tr style="background:#f8fafc;"><td style="padding:10px 8px;color:#64748b;font-weight:600;">Session Type</td><td style="padding:10px 8px;color:#0f172a;font-weight:700;">${sessionType}</td></tr>
                  ${preferredDates ? `<tr><td style="padding:10px 0;color:#64748b;font-weight:600;">Preferred Dates</td><td style="padding:10px 0;color:#0f172a;">${preferredDates}</td></tr>` : ''}
                  ${numberOfPeople ? `<tr style="background:#f8fafc;"><td style="padding:10px 8px;color:#64748b;font-weight:600;">People</td><td style="padding:10px 8px;color:#0f172a;">${numberOfPeople}</td></tr>` : ''}
                  ${locationPreference ? `<tr><td style="padding:10px 0;color:#64748b;font-weight:600;">Location</td><td style="padding:10px 0;color:#0f172a;">${locationPreference}</td></tr>` : ''}
                  ${budget ? `<tr style="background:#f8fafc;"><td style="padding:10px 8px;color:#64748b;font-weight:600;">Budget</td><td style="padding:10px 8px;color:#0f172a;">${budget}</td></tr>` : ''}
                  ${message ? `<tr><td style="padding:10px 0;color:#64748b;font-weight:600;vertical-align:top;">Message</td><td style="padding:10px 0;color:#0f172a;">${message}</td></tr>` : ''}
                  ${referral ? `<tr style="background:#f8fafc;"><td style="padding:10px 8px;color:#64748b;font-weight:600;">How they heard</td><td style="padding:10px 8px;color:#0f172a;">${referral}</td></tr>` : ''}
                </table>
                <div style="margin-top:28px;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;text-align:center;">
                  <p style="margin:0;color:#166534;font-size:13px;font-weight:600;">✅ Contact & inquiry have been automatically created in your CRM</p>
                </div>
              </div>
            </div>`,
        }).catch(() => {}); // Don't fail if email errors
      }
    } catch (_) { /* email notification is non-critical */ }

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.Inquiry_ID,
      contactId,
    });

  } catch (error: any) {
    console.error('Portrait inquiry submit error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
