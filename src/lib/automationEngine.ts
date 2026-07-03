import { createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';

interface AutomationPayload {
  inquiryId: number;
}

export async function runAutomations(triggerEvent: string, payload: AutomationPayload) {
  try {
    const supabase = await createClient();

    // 1. Fetch active automations for this trigger
    const { data: automations, error: autoError } = await supabase
      .from('Automations')
      .select('*, EmailTemplates(*)')
      .eq('Trigger_Event', triggerEvent)
      .eq('Is_Active', true);

    if (autoError || !automations || automations.length === 0) {
      return; // No active automations for this event
    }

    // 2. Fetch required context (Inquiry, Contact, AppConfig)
    const { data: inquiry } = await supabase
      .from('Inquiries')
      .select(`
        *,
        Contacts!inner(Name, Email, Phone)
      `)
      .eq('Inquiry_ID', payload.inquiryId)
      .single();

    if (!inquiry) return;

    // Get user_id from inquiry
    const userId = inquiry.user_id;

    // 3. Process each automation rule
    for (const auto of automations) {
      try {
        if (auto.Action === 'send_email' && auto.EmailTemplates && inquiry.Contacts?.Email) {
          await executeEmailAction(supabase, userId, auto.EmailTemplates, inquiry);
        } else if (auto.Action === 'create_reminder') {
          await executeReminderAction(supabase, userId, auto, inquiry);
        }
      } catch (ruleErr) {
        console.error(`Error executing automation ${auto.Automation_ID}:`, ruleErr);
      }
    }
  } catch (error) {
    console.error('Automation Engine Global Error:', error);
  }
}

async function executeEmailAction(supabase: any, userId: string, template: any, inquiry: any) {
  const { data: config } = await supabase
    .from('AppConfig')
    .select('Email_User, Email_Pass, Company_Name')
    .eq('user_id', userId)
    .single();

  if (!config || !config.Email_User || !config.Email_Pass) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.Email_User, pass: config.Email_Pass }
  });

  const companyName = config.Company_Name || 'Your CRM';
  const contactName = inquiry.Contacts.Name || 'Client';

  // Basic variable substitution
  const subject = template.Subject.replace(/\[Name\]/g, contactName).replace(/\[Company\]/g, companyName);
  const body = template.Body.replace(/\[Name\]/g, contactName).replace(/\[Company\]/g, companyName);

  const htmlBody = `
    <div style="font-family: sans-serif; padding: 20px;">
      ${body.replace(/\n/g, '<br/>')}
    </div>
  `;

  await transporter.sendMail({
    from: `"${companyName}" <${config.Email_User}>`,
    to: inquiry.Contacts.Email,
    subject: subject,
    html: htmlBody
  });
}

async function executeReminderAction(supabase: any, userId: string, automation: any, inquiry: any) {
  const payload = automation.Action_Payload || {};
  const reminderText = payload.reminder_text || `Automated Reminder for ${inquiry.Contacts?.Name}`;
  const dueInDays = payload.due_in_days || 1;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);

  await supabase
    .from('Reminders')
    .insert({
      user_id: userId,
      Inquiry_ID: inquiry.Inquiry_ID,
      Reminder_Type: 'Automation',
      Due_Date: dueDate.toISOString(),
      Notes: reminderText,
      Channel: 'Email',
      Is_Completed: 0
    });
}
