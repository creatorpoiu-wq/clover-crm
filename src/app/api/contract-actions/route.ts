import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
import { createClient } from '@/utils/supabase/server';
import { wrapWithGlobalBranding } from '@/lib/email-renderer';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: drafts, error } = await supabase
      .from('Contract_Drafts')
      .select('*')
      .order('Updated_At', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, drafts });
  } catch (error: any) {
    console.error('Contract Drafts GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { action, title, content, signers, draftId, type } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = userAuth.user.id;

    // ── Save Draft ──────────────────────────────────────────────────
    if (action === 'save_draft') {
      const signersJson = JSON.stringify(signers || []);
      if (draftId) {
        const { error } = await supabase
          .from('Contract_Drafts')
          .update({
            Title: title || 'Untitled Contract',
            Content: content,
            Signers: signersJson,
            Type: type || 'Contract',
            Updated_At: new Date().toISOString()
          })
          .eq('Draft_ID', draftId);
        
        if (error) throw error;
        return NextResponse.json({ success: true, draftId });
      } else {
        const { data, error } = await supabase
          .from('Contract_Drafts')
          .insert({
            user_id: userId,
            Title: title || 'Untitled Contract',
            Content: content,
            Signers: signersJson,
            Type: type || 'Contract',
            Status: 'Draft'
          })
          .select()
          .single();
        
        if (error) throw error;
        return NextResponse.json({ success: true, draftId: data.Draft_ID });
      }
    }

    // ── Send Contract by Email ──────────────────────────────────────
    if (action === 'send_contract') {
      const { providerSignatureDataUrl, emailHeader, emailFooter, sendMethod } = body;

      if (!signers || signers.length === 0) {
        return NextResponse.json({ success: false, error: 'No signers added.' }, { status: 400 });
      }

      let emailUser: string | null = process.env.EMAIL_USER || null;
      let emailPass: string | null = process.env.EMAIL_PASS || null;
      let companyName = 'Clover';
      let emailSettings: any = {};

      const { data: config } = await supabase
        .from('AppConfig')
        .select('Email_User, Email_Pass, Company_Name, Email_Settings, Custom_Domain')
        .eq('user_id', userId)
        .single();

      let customDomain = null;
      if (config) {
        if (config.Email_User) emailUser = config.Email_User;
        if (config.Email_Pass) emailPass = config.Email_Pass;
        if (config.Company_Name) companyName = config.Company_Name;
        if (config.Custom_Domain) customDomain = config.Custom_Domain;
        try { emailSettings = JSON.parse(config.Email_Settings || '{}'); } catch { emailSettings = {}; }
      }

      if (!emailUser || !emailPass) {
        return NextResponse.json({ success: false, error: 'Email not configured. Go to Settings → Email Configuration.' }, { status: 503 });
      }

      const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPass } });
      const contractTitle = title || 'Contract for Review';
      const clientSigners = signers as any[];
      const recipientEmails = clientSigners.map((s: any) => s.email).filter(Boolean);

      if (recipientEmails.length === 0) {
        return NextResponse.json({ success: false, error: 'No client email found. Ensure signers have valid emails.' }, { status: 400 });
      }

      const todayString = new Date().toLocaleDateString();
      const firstClientFullName = clientSigners[0]?.name || 'Client Name';
      const firstClientName = firstClientFullName.split(' ')[0] || 'there';

      const replaceVars = (text: string) => {
        if (!text) return '';
        return text
          .replace(/\[Client Name\]|\{Client Name\}/gi, firstClientFullName)
          .replace(/\[Name\]|\{Name\}/gi, firstClientName)
          .replace(/\[Company\]|\{Company\}/gi, companyName)
          .replace(/\[Company Name\]|\{Company Name\}/gi, companyName)
          .replace(/\[Date\]|\{Date\}/gi, todayString)
          .replace(/\[Today's Date\]|\{Today's Date\}/gi, todayString);
      };

      let finalContent = replaceVars(content || '');

      // Generate sign token FIRST so the SAME token is in both the email link and the DB row
      const signToken = randomUUID();
      const host = req.headers.get('host') || '';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = customDomain 
        ? `https://${customDomain}`
        : process.env.NEXT_PUBLIC_BASE_URL 
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) 
          || `${protocol}://${host}`;

      // Auto-save contract to Finance Contracts table with sign token BEFORE generating signUrl
      let actualContractId = null;
      let actualInquiryId = null;

      if (clientSigners.length > 0) {
        const clientEmail = clientSigners[0].email;
        const clientName = clientSigners[0].name || 'Unknown Client';

        let contactId = null;
        const { data: contact } = await supabase
          .from('Contacts')
          .select('Contact_ID')
          .eq('Email', clientEmail)
          .single();

        if (contact) {
          contactId = contact.Contact_ID;
        } else {
          const { data: cRes } = await supabase
            .from('Contacts')
            .insert({ user_id: userId, Name: clientName, Email: clientEmail })
            .select()
            .single();
          contactId = cRes?.Contact_ID;
        }

        if (contactId) {
          const { data: latestInq } = await supabase
            .from('Inquiries')
            .select('Inquiry_ID')
            .eq('Contact_ID', contactId)
            .order('Inquiry_ID', { ascending: false })
            .limit(1)
            .single();

          if (latestInq) {
            actualInquiryId = latestInq.Inquiry_ID;
            // Advance Pipeline Stage
            await supabase
              .from('Inquiries')
              .update({ Pipeline_Stage: 'Sent Contract' })
              .eq('Inquiry_ID', actualInquiryId);
          } else {
            const { data: iRes } = await supabase
              .from('Inquiries')
              .insert({
                user_id: userId,
                Contact_ID: contactId,
                Service_Type: 'General Services',
                Pipeline_Stage: 'Sent Contract'
              })
              .select()
              .single();
            actualInquiryId = iRes?.Inquiry_ID;
          }
        }

        if (actualInquiryId) {
          const today = new Date().toISOString().split('T')[0];
          const { data: cData } = await supabase
            .from('Contracts')
            .insert({
              user_id: userId,
              Inquiry_ID: actualInquiryId,
              Contract_Text: finalContent,
              Contract_Title: contractTitle,
              Status: 'Sent',
              Sent_Date: today,
              Signed_Date: '',
              Sign_Token: signToken,
              Provider_Signature: providerSignatureDataUrl || '',
              Signers: JSON.stringify(signers),
              Type: type || 'Contract'
            })
            .select('Contract_ID')
            .single();
          
          if (cData) actualContractId = cData.Contract_ID;
        }
      }

      // Determine the correct URL based on sendMethod
      let signUrl = `${baseUrl}/sign/${signToken}`;
      let ctaTextBase = 'Review & Sign Contract';

      if (sendMethod === 'WeddingFunnel' && actualInquiryId && actualContractId) {
        signUrl = `${baseUrl}/booking?userId=${userId}&inquiryId=${actualInquiryId}&contractId=${actualContractId}`;
        ctaTextBase = 'Proceed to Booking';
      } else if (sendMethod === 'PortraitFunnel' && actualInquiryId && actualContractId) {
        signUrl = `${baseUrl}/portrait/welcome?userId=${userId}&inquiryId=${actualInquiryId}&contractId=${actualContractId}`;
        ctaTextBase = 'Proceed to Booking';
      }

      // Build signature block HTML for clients
      let signatureRowsHtml = (signers as any[]).map((s: any) => {
        const sigHtml = `<div style="height:60px;border-bottom:2px solid #374151;margin-bottom:6px;"></div>`;
        return `<div style="flex:1;min-width:200px;margin-right:32px;">
          ${sigHtml}
          <div style="font-weight:700;font-size:14px;color:#111827;">${s.name}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">Client</div>
        </div>`;
      }).join('');

      // Explicitly append the Service Provider's signature block if provided
      if (providerSignatureDataUrl) {
        signatureRowsHtml += `<div style="flex:1;min-width:200px;margin-right:32px;">
          <img src="${providerSignatureDataUrl}" alt="Signature" style="max-height:70px;max-width:220px;object-fit:contain;display:block;margin-bottom:6px;" />
          <div style="font-weight:700;font-size:14px;color:#111827;">Service Provider</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">Service Provider</div>
          <div style="font-size:11px;color:#0d9488;margin-top:4px;">&#10003; Pre-signed</div>
        </div>`;
      }

      const es = emailSettings.contract || {};
      const bannerText    = replaceVars(es.headerText || 'Your contract is ready for review and signature.');
      const greeting      = replaceVars(es.greeting   || 'Hello [Name],');
      const bodyText      = replaceVars(es.body       || 'Please review the agreement carefully. Click the button below to read the full contract and add your digital signature to finalise your booking.');
      const ctaText       = replaceVars(es.ctaText    || ctaTextBase);
      const accentColor   = es.accentColor || '#0d9488';
      const emailSubject  = replaceVars(es.subject    || 'Contract Ready for Your Signature');
      const footerLine    = replaceVars(es.footerText || 'Digital signatures are legally binding under ESIGN and UETA. Reply to this email with any questions.');

      // legacy emailHeader / emailFooter from builder UI take precedence if explicitly provided
      const headerText = emailHeader ? replaceVars(emailHeader) : bannerText;
      const footerText = emailFooter ? replaceVars(emailFooter) : bodyText;

      const innerHtml = `
        <p style="font-size:16px;font-weight:700;margin:0 0 12px;color:#111827;">${greeting}</p>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">${footerText}</p>
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:32px 36px;background:#fafafa;margin-bottom:28px;font-family:Georgia,serif;font-size:14px;line-height:1.8;color:#1f2937;">
          ${finalContent}
        </div>
        <div style="border-top:2px solid #e5e7eb;padding-top:28px;">
          <h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#111827;margin:0 0 20px;">Signatures</h3>
          <div style="display:flex;flex-wrap:wrap;">${signatureRowsHtml}</div>
          <p style="margin-top:20px;font-size:10px;color:#9ca3af;line-height:1.6;">Digital signatures are legally binding under ESIGN and UETA.</p>
        </div>
        <!-- Sign CTA -->
        <div style="margin-top:32px;text-align:center;padding:28px;background:#f0fdfa;border-radius:10px;border:1px solid #ccfbf1;">
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">Ready to proceed?</p>
          <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Click the button below to review and sign this contract securely.</p>
          <a href="${signUrl}" class="button" style="display:inline-block;padding:14px 36px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;">${ctaText}</a>
          <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;">Or copy this link: <span style="color:${accentColor};word-break:break-all;">${signUrl}</span></p>
        </div>
      `;

      const emailHtml = wrapWithGlobalBranding(innerHtml, companyName, emailSettings.global, accentColor, headerText);

      const textContent = `${contractTitle}\n\n${headerText}\n\n${footerText}\n\nTo review and sign this contract securely, please visit the following link:\n${signUrl}\n\nSent via ${companyName} CRM`;

      await transporter.sendMail({
        from: `"${companyName}" <${emailUser}>`,
        replyTo: emailUser,
        to: recipientEmails.join(', '),
        subject: emailSubject,
        text: textContent,
        html: emailHtml,
      });

      if (draftId) {
        await supabase
          .from('Contract_Drafts')
          .update({ Status: 'Sent', Updated_At: new Date().toISOString() })
          .eq('Draft_ID', draftId);
      }

      return NextResponse.json({ success: true, sentTo: recipientEmails, signUrl });
    }

    // ── Resend Contract by Email ──────────────────────────────────────
    if (action === 'resend_contract') {
      const { contractId } = body;
      if (!contractId) return NextResponse.json({ success: false, error: 'Missing contractId' }, { status: 400 });

      const { data: contract } = await supabase.from('Contracts').select('*').eq('Contract_ID', contractId).single();
      if (!contract) return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 });

      const signersArr = JSON.parse(contract.Signers || '[]');
      const contractTitle = contract.Contract_Title || 'Document for Review';
      const contentStr = contract.Contract_Text || '';
      const signToken = contract.Sign_Token;
      const docType = contract.Type || 'Contract';
      const providerSignatureDataUrl = contract.Provider_Signature || '';

      if (!signersArr || signersArr.length === 0) {
        return NextResponse.json({ success: false, error: 'No signers found.' }, { status: 400 });
      }

      let emailUser: string | null = process.env.EMAIL_USER || null;
      let emailPass: string | null = process.env.EMAIL_PASS || null;
      let companyName = 'Clover';
      let customDomain = null;
      let emailSettings: any = {};

      const { data: config } = await supabase
        .from('AppConfig')
        .select('Email_User, Email_Pass, Company_Name, Custom_Domain')
        .eq('user_id', contract.user_id)
        .single();

      if (config) {
        if (config.Email_User) emailUser = config.Email_User;
        if (config.Email_Pass) emailPass = config.Email_Pass;
        if (config.Company_Name) companyName = config.Company_Name;
        if (config.Custom_Domain) customDomain = config.Custom_Domain;
      }

      if (!emailUser || !emailPass) {
        return NextResponse.json({ success: false, error: 'Email not configured.' }, { status: 503 });
      }

      const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPass } });
      const clientSigners = signersArr.filter((s: any) =>
        !s.name?.toLowerCase().includes('photography') && !s.name?.toLowerCase().includes('marx')
      );
      const recipientEmails = clientSigners.map((s: any) => s.email).filter(Boolean);

      if (recipientEmails.length === 0) {
        return NextResponse.json({ success: false, error: 'No client email found.' }, { status: 400 });
      }

      const host = req.headers.get('host') || '';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = customDomain 
        ? `https://${customDomain}`
        : process.env.NEXT_PUBLIC_BASE_URL 
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) 
          || `${protocol}://${host}`;
      const signUrl = `${baseUrl}/sign/${signToken}`;

      const signatureRowsHtml = signersArr.map((s: any) => {
        const isOwner = s.name?.toLowerCase().includes('photography') || s.name?.toLowerCase().includes('marx');
        const sigHtml = isOwner && providerSignatureDataUrl
          ? `<img src="${providerSignatureDataUrl}" alt="Signature" style="max-height:70px;max-width:220px;object-fit:contain;display:block;margin-bottom:6px;" />`
          : `<div style="height:60px;border-bottom:2px solid #374151;margin-bottom:6px;"></div>`;
        return `<div style="flex:1;min-width:200px;margin-right:32px;">
          ${sigHtml}
          <div style="font-weight:700;font-size:14px;color:#111827;">${s.name}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">${isOwner ? 'Service Provider' : 'Client'}</div>
          ${isOwner && providerSignatureDataUrl ? `<div style="font-size:11px;color:#0d9488;margin-top:4px;">&#10003; Pre-signed</div>` : ''}
        </div>`;
      }).join('');

      const todayString = new Date().toLocaleDateString();
      const firstClientFullName = clientSigners[0]?.name || 'Client Name';
      const firstClientName = firstClientFullName.split(' ')[0] || 'there';

      const replaceVars = (text: string) => {
        if (!text) return '';
        return text
          .replace(/\[Client Name\]|\{Client Name\}/gi, firstClientFullName)
          .replace(/\[Name\]|\{Name\}/gi, firstClientName)
          .replace(/\[Company\]|\{Company\}/gi, companyName)
          .replace(/\[Company Name\]|\{Company Name\}/gi, companyName)
          .replace(/\[Date\]|\{Date\}/gi, todayString)
          .replace(/\[Today's Date\]|\{Today's Date\}/gi, todayString);
      };

      const es = emailSettings.contract || {};
      const bannerText    = replaceVars(es.headerText || `Your ${docType.toLowerCase()} is ready for review and signature.`);
      const greeting      = replaceVars(es.greeting   || 'Hello [Name],');
      const bodyText      = replaceVars(es.body       || `Please review the agreement carefully. Click the button below to read the full ${docType.toLowerCase()} and add your digital signature to finalise your booking.`);
      const ctaText       = replaceVars(es.ctaText    || `Review & Sign ${docType}`);
      const accentColor   = es.accentColor || '#0d9488';
      const emailSubject  = replaceVars(es.subject    || `Reminder: ${docType} Ready for Your Signature`);
      const footerLine    = replaceVars(es.footerText || 'Digital signatures are legally binding under ESIGN and UETA. Reply to this email with any questions.');

      const headerText = bannerText;
      const footerText = bodyText;

      let finalContentStr = replaceVars(contentStr || '');

      const innerHtml = `
        <p style="font-size:16px;font-weight:700;margin:0 0 12px;color:#111827;">${greeting}</p>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">${footerText}</p>
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:32px 36px;background:#fafafa;margin-bottom:28px;font-family:Georgia,serif;font-size:14px;line-height:1.8;color:#1f2937;">
          ${finalContentStr}
        </div>
        <div style="border-top:2px solid #e5e7eb;padding-top:28px;">
          <h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#111827;margin:0 0 20px;">Signatures</h3>
          <div style="display:flex;flex-wrap:wrap;">${signatureRowsHtml}</div>
          <p style="margin-top:20px;font-size:10px;color:#9ca3af;line-height:1.6;">Digital signatures are legally binding under ESIGN and UETA.</p>
        </div>
        <div style="margin-top:32px;text-align:center;padding:28px;background:#f0fdfa;border-radius:10px;border:1px solid #ccfbf1;">
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">Ready to sign?</p>
          <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Click the button below to review and sign this ${docType.toLowerCase()} securely.</p>
          <a href="${signUrl}" class="button" style="display:inline-block;padding:14px 36px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;">${ctaText}</a>
          <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;">Or copy this link: <span style="color:${accentColor};word-break:break-all;">${signUrl}</span></p>
        </div>
      `;

      const emailHtml = wrapWithGlobalBranding(innerHtml, companyName, emailSettings.global, accentColor, headerText);

      const textContent = `${contractTitle}\n\n${headerText}\n\n${footerText}\n\nTo review and sign this ${docType.toLowerCase()} securely, please visit the following link:\n${signUrl}\n\nSent via ${companyName} CRM`;

      await transporter.sendMail({
        from: `"${companyName}" <${emailUser}>`,
        replyTo: emailUser,
        to: recipientEmails.join(', '),
        subject: emailSubject,
        text: textContent,
        html: emailHtml,
      });

      return NextResponse.json({ success: true, sentTo: recipientEmails });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Contract action error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
    
    const { error } = await supabase
      .from('Contract_Drafts')
      .delete()
      .eq('Draft_ID', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contract actions DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
