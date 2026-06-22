import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { wrapWithGlobalBranding } from '@/lib/email-renderer';

// The booking submission is PUBLIC — clients access it without a login session.
// We use the service role key to bypass RLS for reading/writing the CRM data.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const payload = await req.json();
    const { userId, contractId, questionnaire, pkg, addons, signature, contractHtml, totalAmount, depositAmount, _hp } = payload;

    // Honeypot check - silently ignore spam
    if (_hp) {
      console.log('Spam trapped via honeypot (Public Booking)');
      return NextResponse.json({ success: true });
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    
    const clientName = questionnaire['Full Name'] || questionnaire['Name'] || questionnaire.name || 'Client';
    const clientEmail = questionnaire['Email'] || questionnaire['Email Address'] || questionnaire.email || '';
    const phone = questionnaire['Phone'] || questionnaire['Phone Number'] || '';
    const eventDate = questionnaire['Event Date'] || questionnaire.eventDate || null;
    const serviceType = pkg?.Name || 'General Services';

    let finalInquiryId = null;

    if (contractId) {
      // PROPOSAL FLOW: Contract already exists.
      // 1. Update the Contract
      const { error: contractUpdateError } = await supabase
        .from('Contracts')
        .update({
          Status: 'Signed',
          Signed_Date: today,
          Client_Signature: signature,
          Contract_Text: contractHtml || undefined,
          Type: 'Contract'
        })
        .eq('Contract_ID', contractId);

      if (contractUpdateError) throw contractUpdateError;

      // 2. Fetch the associated Inquiry_ID
      const { data: contractData } = await supabase
        .from('Contracts')
        .select('Inquiry_ID')
        .eq('Contract_ID', contractId)
        .single();

      finalInquiryId = contractData?.Inquiry_ID;

      // 3. Update Inquiry Pipeline Stage, Event Date, and Questionnaire Data
      if (finalInquiryId) {
        // Fetch Inquiry to get Contact_ID
        const { data: inq } = await supabase.from('Inquiries').select('Contact_ID').eq('Inquiry_ID', finalInquiryId).single();
        
        await supabase
          .from('Inquiries')
          .update({ 
            Pipeline_Stage: 'Contract Signed',
            Event_Date: eventDate || undefined,
            Questionnaire_Data: questionnaire
          })
          .eq('Inquiry_ID', finalInquiryId);

        if (inq?.Contact_ID) {
          await supabase
            .from('Contacts')
            .update({
              Name: clientName,
              Email: clientEmail,
              Phone: phone || undefined,
              Package_ID: pkg?.Package_ID || pkg?.id || null,
              Status: 'Client'
            })
            .eq('Contact_ID', inq.Contact_ID);
        }
      }

    } else {
      // COLD LEAD FLOW: Direct booking from public link without a pre-existing contract.
      // 1. Get or Create Contact
      let contactId;
      const { data: existingContact } = await supabase
        .from('Contacts')
        .select('Contact_ID')
        .eq('Email', clientEmail)
        .eq('user_id', userId)
        .single();

      if (existingContact) {
        contactId = existingContact.Contact_ID;
        await supabase.from('Contacts').update({ Status: 'Client' }).eq('Contact_ID', contactId);
      } else {
        const { data: newContact, error: contactError } = await supabase
          .from('Contacts')
          .insert({
            user_id: userId,
            Name: clientName,
            Email: clientEmail,
            Phone: phone,
            Lead_Source: 'Booking Funnel',
            Package_ID: pkg?.Package_ID || pkg?.id || null,
            Status: 'Client'
          })
          .select()
          .single();
        if (contactError) throw contactError;
        contactId = newContact.Contact_ID;
      }

      // 2. Create Inquiry
      const { data: inquiry, error: inquiryError } = await supabase
        .from('Inquiries')
        .insert({
          user_id: userId,
          Contact_ID: contactId,
          Service_Type: serviceType,
          Event_Date: eventDate,
          Estimated_Value: totalAmount,
          Pipeline_Stage: 'Contract Signed',
          Questionnaire_Data: questionnaire
        })
        .select()
        .single();
      if (inquiryError) throw inquiryError;
      finalInquiryId = inquiry.Inquiry_ID;

      // 3. Create Contract
      const { error: contractInsertError } = await supabase
        .from('Contracts')
        .insert({
          user_id: userId,
          Inquiry_ID: finalInquiryId,
          Contract_Title: `${serviceType} Agreement`,
          Contract_Text: contractHtml || '',
          Status: 'Signed',
          Signed_Date: today,
          Client_Signature: signature,
          Type: 'Contract'
        });
      if (contractInsertError) throw contractInsertError;
    }

    // CREATE INVOICE
    if (finalInquiryId) {
      // Combine package and addons into line items
      const lineItems = [];
      if (pkg) {
        lineItems.push({ description: pkg.Name, amount: pkg.Price, quantity: 1 });
      }
      if (addons && addons.length > 0) {
        addons.forEach((a: any) => {
          lineItems.push({ description: a.name, amount: a.price, quantity: 1 });
        });
      }

      await supabase
        .from('Invoices')
        .insert({
          user_id: userId,
          Inquiry_ID: finalInquiryId,
          Invoice_Title: `${serviceType} Invoice`,
          Total_Amount: totalAmount,
          Status: 'Unpaid', // You can change to 'Partial Paid' if you add payment gateway integration
          Due_Date: today,
          Line_Items: JSON.stringify(lineItems)
        });
    }

    // AUTOMATION HOOK (optional)
    try {
      if (finalInquiryId) {
        const { data: inquiryDetails } = await supabase
          .from('Inquiries')
          .select('Contact_ID')
          .eq('Inquiry_ID', finalInquiryId)
          .single();

        if (inquiryDetails?.Contact_ID) {
          const { data: automations } = await supabase
            .from('Automations')
            .select('Action, Template_ID')
            .eq('Trigger_Event', 'contract_signed')
            .eq('Is_Active', true);

          if (automations && automations.length > 0) {
            const emailAuto = automations.find(a => a.Action === 'send_email');
            if (emailAuto && emailAuto.Template_ID) {
              const [{ data: tpl }, { data: contactRow }, { data: config }] = await Promise.all([
                supabase.from('EmailTemplates').select('Subject, Body').eq('Template_ID', emailAuto.Template_ID).single(),
                supabase.from('Contacts').select('Name, Email').eq('Contact_ID', inquiryDetails.Contact_ID).single(),
                supabase.from('AppConfig').select('Email_User, Email_Pass, Company_Name, Email_Settings').eq('user_id', userId).single()
              ]);

              if (tpl && contactRow && config?.Email_User && config?.Email_Pass) {
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: config.Email_User, pass: config.Email_Pass } });
                const fName = contactRow.Name.split(' ')[0];
                const companyName = config.Company_Name || 'Clover';
                
                let emailSettings: any = {};
                try { emailSettings = JSON.parse(config.Email_Settings || '{}'); } catch { emailSettings = {}; }

                let parsedBody = tpl.Body.replace(/\[Name\]|\{Name\}/gi, fName).replace(/\[Client Name\]|\{Client Name\}/gi, contactRow.Name).replace(/\n/g, '<br/>');
                let parsedSubject = tpl.Subject.replace(/\[Name\]|\{Name\}/gi, fName).replace(/\[Client Name\]|\{Client Name\}/gi, contactRow.Name);
                
                const clientInnerHtml = `
                  <div style="font-size: 16px; line-height: 1.6;">${parsedBody}</div>
                `;
                const clientEmailHtml = wrapWithGlobalBranding(clientInnerHtml, companyName, emailSettings.global, undefined, parsedSubject);

                await transporter.sendMail({
                  from: `"${companyName}" <${config.Email_User}>`,
                  to: contactRow.Email,
                  subject: parsedSubject,
                  html: clientEmailHtml
                });

                // Notify the CRM Owner (Vendor)
                const vendorInnerHtml = `
                  <h2 style="color: #0d9488; margin-top: 0;">New Booking Received!</h2>
                  <p style="font-size: 16px;">Great news! <strong>${contactRow.Name}</strong> just completed their booking proposal.</p>
                  <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="margin: 0 0 8px;"><strong>Service:</strong> ${serviceType}</p>
                    <p style="margin: 0 0 8px;"><strong>Total Value:</strong> $${totalAmount}</p>
                    <p style="margin: 0;"><strong>Date:</strong> ${eventDate || 'Not specified'}</p>
                  </div>
                  <p>The client has successfully signed the contract. You can view their full questionnaire answers and the signed contract in your CRM dashboard.</p>
                `;
                const vendorEmailHtml = wrapWithGlobalBranding(vendorInnerHtml, companyName, emailSettings.global, undefined, 'New Booking Received');

                await transporter.sendMail({
                  from: `"${companyName} CRM" <${config.Email_User}>`,
                  to: config.Email_User,
                  subject: `New Booking/Signed Proposal: ${contactRow.Name}`,
                  html: vendorEmailHtml
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Automation error:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Public booking submit error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
