import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testMode = searchParams.get('test');

    // To process reminders via CRON (without a user session), we must bypass RLS.
    // If SUPABASE_SERVICE_ROLE_KEY is not available, this endpoint will only process reminders for the currently logged-in user (if called from the browser).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // We create a fresh client here (not using the @/utils/supabase/server) so we can pass the service role key if it exists
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If test mode is requested, we need to know WHICH user is testing it.
    // For test mode, we'll try to extract the user from the auth header or assume the first config.
    if (testMode === 'sms') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return NextResponse.json({ success: false, error: 'Unauthorized to test SMS' }, { status: 401 });
      }
      
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

      const { data: config } = await supabase.from('AppConfig').select('*').eq('user_id', user.id).single();
      if (!config || !config.Twilio_Account_SID || !config.Twilio_Auth_Token || !config.Twilio_Phone_Number) {
        return NextResponse.json({ success: false, error: 'Twilio is not configured.' }, { status: 400 });
      }

      const client = twilio(config.Twilio_Account_SID, config.Twilio_Auth_Token);
      try {
        await client.messages.create({
          body: `Test message from ${config.Company_Name || 'Clover'}!`,
          from: config.Twilio_Phone_Number,
          to: config.Twilio_Phone_Number 
        });
        return NextResponse.json({ success: true, message: 'Test SMS sent.' });
      } catch (err: any) {
        console.error("Twilio test error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    // Normal processing mode: Query due reminders for ALL users
    const today = new Date().toISOString().split('T')[0];
    
    const { data: dueReminders, error: remError } = await supabase
      .from('Reminders')
      .select(`
        Reminder_ID, 
        user_id,
        Channel, 
        Notes, 
        Due_Date,
        Inquiries!inner ( Event_Date, Contacts!inner ( Name, Email, Phone ) )
      `)
      .eq('Is_Completed', 0)
      .lte('Due_Date', today);

    if (remError) throw remError;

    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({ success: true, message: 'No reminders due today.' });
    }

    // Since each reminder belongs to a specific user, we need their specific AppConfig to send the email/SMS
    // We'll fetch all unique user_ids from the due reminders and fetch their configs
    const userIds = [...new Set(dueReminders.map(r => r.user_id))];
    const { data: appConfigs, error: confError } = await supabase
      .from('AppConfig')
      .select('*')
      .in('user_id', userIds);

    if (confError) throw confError;

    const configMap = new Map();
    (appConfigs || []).forEach(c => configMap.set(c.user_id, c));

    let processedCount = 0;

    for (const reminder of dueReminders) {
      const config = configMap.get(reminder.user_id);
      if (!config) continue;

      const { Reminder_ID, Channel, Notes } = reminder as any;
      const Event_Date = (reminder as any).Inquiries?.Event_Date;
      const Contact_Name = (reminder as any).Inquiries?.Contacts?.Name;
      const Email = (reminder as any).Inquiries?.Contacts?.Email;
      const Phone = (reminder as any).Inquiries?.Contacts?.Phone;

      const firstName = (Contact_Name || 'there').split(' ')[0];
      const companyName = config.Company_Name || 'Our Studio';

      let emailSettings: any = {};
      try { emailSettings = JSON.parse(config.Email_Settings || '{}'); } catch { emailSettings = {}; }

      const reminderSettings = emailSettings.reminder || {
        subject: 'Friendly Reminder from [Company]',
        headerText: 'You have an upcoming event or follow-up.',
        greeting: 'Hello [Name],',
        body: 'This is a quick reminder regarding your upcoming event or outstanding items. We look forward to working with you soon!',
        ctaText: 'View Details',
        footerText: 'If you have any questions, please reply to this email.',
        accentColor: '#0d9488',
        smsText: 'Hi [Name]! Just a friendly reminder regarding your upcoming event with [Company]. Reply if you have questions!'
      };

      let emailTransporter = null;
      if (config.Email_User && config.Email_Pass) {
        emailTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: config.Email_User, pass: config.Email_Pass }
        });
      }

      let twilioClient = null;
      if (config.Twilio_Account_SID && config.Twilio_Auth_Token && config.Twilio_Phone_Number) {
        twilioClient = twilio(config.Twilio_Account_SID, config.Twilio_Auth_Token);
      }

      let sentEmail = false;
      let sentSms = false;

      // Email
      if ((Channel === 'Email' || Channel === 'Both') && Email && emailTransporter) {
        const esSubject = (reminderSettings.subject || '').replace('[Company]', companyName).replace('[Name]', firstName);
        const esGreeting = (reminderSettings.greeting || '').replace('[Name]', firstName);
        const esBody = (reminderSettings.body || '').replace('[Name]', firstName).replace('[Company]', companyName);
        
        const emailHtml = `<!DOCTYPE html><html><body>
          <div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
            <div style="background:${reminderSettings.accentColor};padding:20px;color:white;">
              <h2>${companyName}</h2>
              <p>${reminderSettings.headerText}</p>
            </div>
            <div style="padding:20px;color:#333;">
              <p><strong>${esGreeting}</strong></p>
              <p>${esBody}</p>
              ${Event_Date ? `<p><strong>Event Date:</strong> ${Event_Date}</p>` : ''}
              ${Notes ? `<p><strong>Notes:</strong> ${Notes}</p>` : ''}
              <br/>
              <p style="font-size:12px;color:#777;">${reminderSettings.footerText}</p>
            </div>
          </div>
        </body></html>`;

        try {
          await emailTransporter.sendMail({
            from: `"${companyName}" <${config.Email_User}>`,
            to: Email,
            subject: esSubject,
            html: emailHtml
          });
          sentEmail = true;
        } catch (e) {
          console.error(`Failed to send email to ${Email}: `, e);
        }
      }

      // SMS
      if ((Channel === 'SMS' || Channel === 'Both') && Phone && twilioClient) {
        const smsBody = (reminderSettings.smsText || 'Reminder from [Company]')
          .replace('[Name]', firstName)
          .replace('[Company]', companyName);

        try {
          await twilioClient.messages.create({
            body: smsBody,
            from: config.Twilio_Phone_Number,
            to: Phone.startsWith('+') ? Phone : '+1' + Phone.replace(/\D/g, '')
          });
          sentSms = true;
        } catch (e) {
          console.error(`Failed to send SMS to ${Phone}: `, e);
        }
      }

      if (sentEmail || sentSms || (!Email && !Phone)) {
        await supabase
          .from('Reminders')
          .update({ Is_Completed: 1, Sent_At: new Date().toISOString() })
          .eq('Reminder_ID', Reminder_ID);
        processedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Processed ${processedCount} reminders.` });
  } catch (error: any) {
    console.error('Process reminders API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
