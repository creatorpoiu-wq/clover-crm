import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'templates') {
      const { data: templates, error } = await supabase
        .from('Invoice_Templates')
        .select('*')
        .order('Created_At', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, templates });
    }

    const { data: drafts, error } = await supabase
      .from('Invoice_Drafts')
      .select('*')
      .order('Updated_At', { ascending: false });
    if (error) throw error;
    
    return NextResponse.json({ success: true, drafts });
  } catch (error: any) {
    console.error('Invoice Actions GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { action } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = userAuth.user.id;

    // ── Save Draft ──────────────────────────────────────────────────
    if (action === 'save_draft') {
      const { title, content, lineItems, draftId, clientName, clientEmail, dueDate } = body;
      const lineItemsJson = JSON.stringify(lineItems || []);

      if (draftId) {
        const { error } = await supabase
          .from('Invoice_Drafts')
          .update({
            Title: title || 'Untitled Invoice',
            Content: content,
            Line_Items: lineItemsJson,
            Client_Name: clientName || '',
            Client_Email: clientEmail || '',
            Due_Date: dueDate || '',
            Updated_At: new Date().toISOString()
          })
          .eq('Draft_ID', draftId);
          
        if (error) throw error;
        return NextResponse.json({ success: true, draftId });
      } else {
        const { data, error } = await supabase
          .from('Invoice_Drafts')
          .insert({
            user_id: userId,
            Title: title || 'Untitled Invoice',
            Content: content,
            Line_Items: lineItemsJson,
            Status: 'Draft',
            Client_Name: clientName || '',
            Client_Email: clientEmail || '',
            Due_Date: dueDate || ''
          })
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, draftId: data.Draft_ID });
      }
    }

    // ── Save Template ───────────────────────────────────────────────
    if (action === 'save_template') {
      const { name, content } = body;
      const { error } = await supabase
        .from('Invoice_Templates')
        .insert({
          user_id: userId,
          Name: name,
          Content: content
        });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'update_template') {
      const { id, name, content } = body;
      const { error } = await supabase
        .from('Invoice_Templates')
        .update({ Name: name, Content: content })
        .eq('Template_ID', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // ── Send Invoice Email ───────────────────────────────────────────
    if (action === 'send_invoice') {
      const { title, content, lineItems, clientName, clientEmail, dueDate, draftId, emailHeader, emailFooter, themeColor, paymentMethods, businessLogo, businessAddress } = body;
      
      if (!clientEmail) {
        return NextResponse.json({ success: false, error: 'Client email is required to send.' }, { status: 400 });
      }

      let emailUser: string | null = process.env.EMAIL_USER || null;
      let emailPass: string | null = process.env.EMAIL_PASS || null;
      let companyName = 'Clover';
      let emailSettings: any = {};

      const { data: config } = await supabase
        .from('AppConfig')
        .select('Email_User, Email_Pass, Company_Name, Email_Settings')
        .eq('user_id', userId)
        .single();

      if (config) {
        if (config.Email_User) emailUser = config.Email_User;
        if (config.Email_Pass) emailPass = config.Email_Pass;
        if (config.Company_Name) companyName = config.Company_Name;
        try { emailSettings = JSON.parse(config.Email_Settings || '{}'); } catch { emailSettings = {}; }
      }

      if (!emailUser || !emailPass) {
        return NextResponse.json({ success: false, error: 'Email not configured. Go to Settings → Email Configuration.' }, { status: 503 });
      }

      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPass } });

      const invoiceTitle = title || 'Invoice';

      // Apply email design settings (builder-provided values override saved settings)
      const todayString = new Date().toLocaleDateString();
      const firstClientFullName = clientName || 'Client Name';
      const clientFirstName = firstClientFullName.split(' ')[0] || 'there';

      const replaceVars = (text: string) => {
        if (!text) return '';
        return text
          .replace(/\[Client Name\]|\{Client Name\}/gi, firstClientFullName)
          .replace(/\[Name\]|\{Name\}/gi, clientFirstName)
          .replace(/\[Company\]|\{Company\}/gi, companyName)
          .replace(/\[Company Name\]|\{Company Name\}/gi, companyName)
          .replace(/\[Date\]|\{Date\}/gi, todayString)
          .replace(/\[Today's Date\]|\{Today's Date\}/gi, todayString);
      };

      const es = emailSettings.invoice || {};
      const esSubject    = replaceVars(es.subject    || 'Invoice from [Company]');
      const esGreeting   = replaceVars(es.greeting   || 'Hello [Name],');
      const esHeaderText = replaceVars(es.headerText  || `You have received a new invoice.`);
      const esBody       = replaceVars(es.body       || 'Please review the invoice and use the payment options provided to complete your payment.');
      const esFooterText = replaceVars(es.footerText  || 'Thank you for your business! Please contact us if you have any questions.');
      const accentColor  = es.accentColor || themeColor || '#1e40af';

      // Builder UI fields override saved settings if explicitly set
      const header = emailHeader ? replaceVars(emailHeader) : esHeaderText;
      const footer = emailFooter ? replaceVars(emailFooter) : esBody;
      const theme  = accentColor;

      let finalContent = replaceVars(content || '');

      // Build line items table HTML
      const items: { description: string; quantity: number; price: number }[] = lineItems || [];
      const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.price), 0);
      const lineItemsHtml = items.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <thead>
            <tr style="background:${theme};color:#fff;">
              <th style="text-align:left;padding:12px 16px;font-weight:700;">Description</th>
              <th style="text-align:center;padding:12px 16px;font-weight:700;">Qty</th>
              <th style="text-align:right;padding:12px 16px;font-weight:700;">Price</th>
              <th style="text-align:right;padding:12px 16px;font-weight:700;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, i) => `
              <tr style="background:${i%2===0?'#fff':'#f8fafc'};border-bottom:1px solid #e5e7eb;">
                <td style="padding:12px 16px;color:#374151;">${item.description}</td>
                <td style="padding:12px 16px;text-align:center;color:#374151;">${item.quantity}</td>
                <td style="padding:12px 16px;text-align:right;color:#374151;">$${Number(item.price).toFixed(2)}</td>
                <td style="padding:12px 16px;text-align:right;font-weight:700;color:#111827;">$${(item.quantity * item.price).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top:2px solid ${theme};">
              <td colspan="3" style="padding:16px;text-align:right;font-weight:800;font-size:15px;color:#111827;">Total Due:</td>
              <td style="padding:16px;text-align:right;font-weight:800;font-size:20px;color:${theme};">$${subtotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      ` : '';

      // Build payment methods HTML
      const activePayments: {name: string, details: string, qrCode?: string, paymentLink?: string}[] = (paymentMethods || []).filter((m:any) => m.enabled);
      const paymentMethodsHtml = activePayments.length > 0 ? `
        <div style="margin-top:40px;padding-top:20px;border-top:2px solid #e5e7eb;">
          <div style="font-size:14px;font-weight:800;color:${theme};margin-bottom:12px;text-transform:uppercase;">Payment Options</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${activePayments.map(m => `
              <div style="background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:16px;">
                <div style="font-size:12px;font-weight:800;color:#374151;margin-bottom:4px;">${m.name}</div>
                <div style="font-size:13px;color:#6b7280;white-space:pre-wrap;">${m.details}</div>
                ${m.qrCode ? `<img src="${m.qrCode}" alt="${m.name} QR Code" style="width:80px;height:80px;object-fit:contain;margin-top:12px;display:block;border-radius:4px;" />` : ''}
                ${m.paymentLink ? `<div style="margin-top:12px;"><a href="${m.paymentLink}" target="_blank" rel="noreferrer" style="color:${theme};text-decoration:underline;font-size:13px;font-weight:700;">Pay via ${m.name}</a></div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : '';

      const logoHtml = businessLogo ? `<img src="${businessLogo}" alt="Logo" style="max-width:200px;max-height:80px;object-fit:contain;margin-bottom:16px;"/>` : '';
      const addressHtml = businessAddress ? `<div style="font-size:12px;color:#6b7280;margin-top:4px;white-space:pre-wrap;">${businessAddress}</div>` : '';

      const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
        <body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:680px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:${theme};padding:36px 40px;">
              <div style="color:#fff;font-weight:800;font-size:18px;margin-bottom:4px;">${companyName}</div>
              <h1 style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:700;">${invoiceTitle}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${esHeaderText}</p>
            </div>
            <div style="padding:36px 40px;">
              <p style="font-size:16px;font-weight:700;margin:0 0 12px;color:#111827;">${esGreeting}</p>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">${header}</p>
              
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
                <div style="width:50%;">
                  ${logoHtml}
                  <div style="font-size:32px;font-weight:900;color:${theme};letter-spacing:-0.02em;text-transform:uppercase;">INVOICE</div>
                  <div style="font-size:14px;color:#6b7280;margin-top:4px;">#${draftId ? String(draftId).padStart(4,'0') : '0001'}</div>
                </div>
                <div style="text-align:right;width:50%;">
                  <div style="font-weight:800;font-size:14px;color:#111827;">${companyName}</div>
                  ${addressHtml}
                  <div style="margin-top:16px;">
                    ${clientName ? `<div style="font-size:13px;color:#6b7280;font-weight:600;">Bill To: ${clientName}</div>` : ''}
                    ${clientEmail ? `<div style="font-size:13px;color:#6b7280;">${clientEmail}</div>` : ''}
                    ${dueDate ? `<div style="font-size:13px;color:${theme};font-weight:700;margin-top:4px;">Due: ${dueDate}</div>` : ''}
                  </div>
                </div>
              </div>

              <div style="border:1px solid #e5e7eb;border-radius:8px;padding:32px 36px;background:#fafafa;margin-bottom:28px;font-family:Georgia,serif;font-size:14px;line-height:1.8;color:#1f2937;">
                ${finalContent}
              </div>
              
              ${lineItemsHtml}
              ${paymentMethodsHtml}

            </div>
            <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">${footer}</p>
              <p style="margin:0;color:#d1d5db;font-size:11px;">Sent via ${companyName} CRM &middot; ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body></html>`;

      const textContent = `${invoiceTitle}\n\n${header}\n\n${footer}\n\n${dueDate ? `Due Date: ${dueDate}\n` : ''}Total: $${subtotal.toFixed(2)}\n\nSent via ${companyName} CRM`;

      await transporter.sendMail({
        from: `"${companyName}" <${emailUser}>`,
        replyTo: emailUser,
        to: clientEmail,
        subject: esSubject,
        text: textContent,
        html: emailHtml,
      });

      if (draftId) {
        await supabase
          .from('Invoice_Drafts')
          .update({ Status: 'Sent', Updated_At: new Date().toISOString() })
          .eq('Draft_ID', draftId);
      }

      // Also save to Invoices table for the finance list
      try {
        const { data: contact } = await supabase
          .from('Contacts')
          .select('Contact_ID')
          .eq('Email', clientEmail)
          .single();

        let contactId = contact?.Contact_ID;
        if (!contactId) {
          const { data: cRes } = await supabase
            .from('Contacts')
            .insert({ user_id: userId, Name: clientName || 'Unknown', Email: clientEmail })
            .select()
            .single();
          contactId = cRes?.Contact_ID;
        }

        let inqId = null;
        if (contactId) {
          const { data: latestInq } = await supabase
            .from('Inquiries')
            .select('Inquiry_ID')
            .eq('Contact_ID', contactId)
            .order('Inquiry_ID', { ascending: false })
            .limit(1)
            .single();

          if (latestInq) {
            inqId = latestInq.Inquiry_ID;

            // Advance Pipeline Stage
            await supabase
              .from('Inquiries')
              .update({ Pipeline_Stage: 'Sent Invoice' })
              .eq('Inquiry_ID', inqId);
          } else {
            const { data: inqRes } = await supabase
              .from('Inquiries')
              .insert({ user_id: userId, Contact_ID: contactId, Pipeline_Stage: 'New Inquiry' })
              .select()
              .single();
            inqId = inqRes?.Inquiry_ID;
          }
        }

        if (inqId) {
          const today = new Date().toISOString().split('T')[0];
          await supabase
            .from('Invoices')
            .insert({
              user_id: userId,
              Inquiry_ID: inqId,
              Issue_Date: today,
              Due_Date: dueDate || '',
              Status: 'Sent',
              Total_Amount: subtotal
            });
        }
      } catch (err) { console.error('Failed to save to Invoices table', err); }

      return NextResponse.json({ success: true, sentTo: clientEmail });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Invoice Actions POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    if (type === 'template') {
      const { error } = await supabase.from('Invoice_Templates').delete().eq('Template_ID', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('Invoice_Drafts').delete().eq('Draft_ID', id);
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoice Actions DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
