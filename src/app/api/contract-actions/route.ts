import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
import { createClient } from '@/utils/supabase/server';

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
    const { action, title, content, signers, draftId } = body;

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
      const { providerSignatureDataUrl, emailHeader, emailFooter } = body;

      if (!signers || signers.length === 0) {
        return NextResponse.json({ success: false, error: 'No signers added.' }, { status: 400 });
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

      const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPass } });
      const contractTitle = title || 'Contract for Review';
      const clientSigners = (signers as any[]).filter((s: any) =>
        !s.name?.toLowerCase().includes('photography') && !s.name?.toLowerCase().includes('marx')
      );
      const recipientEmails = clientSigners.map((s: any) => s.email).filter(Boolean);

      if (recipientEmails.length === 0) {
        return NextResponse.json({ success: false, error: 'No client email found. Ensure signers have valid emails.' }, { status: 400 });
      }

      // Generate sign token FIRST so the SAME token is in both the email link and the DB row
      const signToken = randomUUID();
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
        || 'http://localhost:3000';
      const signUrl = `${baseUrl}/sign/${signToken}`;

      // Build signature block HTML
      const signatureRowsHtml = (signers as any[]).map((s: any) => {
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

      const es = emailSettings.contract || {};
      const firstClientName = clientSigners[0]?.name?.split(' ')[0] || 'there';
      const bannerText    = (es.headerText || 'Your contract is ready for review and signature.');
      const greeting      = (es.greeting   || 'Hello [Name],').replace('[Name]', firstClientName);
      const bodyText      = (es.body       || 'Please review the agreement carefully. Click the button below to read the full contract and add your digital signature to finalise your booking.').replace('[Name]', firstClientName).replace('[Company]', companyName);
      const ctaText       = es.ctaText     || 'Review & Sign Contract';
      const accentColor   = es.accentColor || '#0d9488';
      const emailSubject  = (es.subject    || 'Contract Ready for Your Signature').replace('[Company]', companyName);
      const footerLine    = es.footerText  || 'Digital signatures are legally binding under ESIGN and UETA. Reply to this email with any questions.';

      // legacy emailHeader / emailFooter from builder UI take precedence if explicitly provided
      const headerText = emailHeader || bannerText;
      const footerText = emailFooter || bodyText;

      const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
        <body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:680px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="background:${accentColor};padding:36px 40px;">
              <div style="color:#fff;font-weight:800;font-size:20px;margin-bottom:4px;">${companyName}</div>
              <h1 style="margin:4px 0 0;color:#fff;font-size:20px;font-weight:700;">${contractTitle}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${headerText}</p>
            </div>
            <div style="padding:36px 40px;">
              <p style="font-size:16px;font-weight:700;margin:0 0 12px;color:#111827;">${greeting}</p>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">${footerText}</p>
              <div style="border:1px solid #e5e7eb;border-radius:8px;padding:32px 36px;background:#fafafa;margin-bottom:28px;font-family:Georgia,serif;font-size:14px;line-height:1.8;color:#1f2937;">
                ${content}
              </div>
              <div style="border-top:2px solid #e5e7eb;padding-top:28px;">
                <h3 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#111827;margin:0 0 20px;">Signatures</h3>
                <div style="display:flex;flex-wrap:wrap;">${signatureRowsHtml}</div>
                <p style="margin-top:20px;font-size:10px;color:#9ca3af;line-height:1.6;">Digital signatures are legally binding under ESIGN and UETA.</p>
              </div>
              <!-- Sign CTA -->
              <div style="margin-top:32px;text-align:center;padding:28px;background:#f0fdfa;border-radius:10px;border:1px solid #ccfbf1;">
                <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">Ready to sign?</p>
                <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Click the button below to review and sign this contract securely.</p>
                <a href="${signUrl}" style="display:inline-block;padding:14px 36px;background:${accentColor};color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;box-shadow:0 4px 12px rgba(13,148,136,0.35);">${ctaText}</a>
                <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;">Or copy this link: <span style="color:${accentColor};word-break:break-all;">${signUrl}</span></p>
              </div>
            </div>
            <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">${footerLine}</p>
              <p style="margin:0;color:#d1d5db;font-size:11px;">Sent via ${companyName} CRM &middot; ${new Date().getFullYear()}</p>
            </div>
          </div>
        </body></html>`;

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

      // Auto-save contract to Finance Contracts table with sign token
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

        let inquiryId = null;
        if (contactId) {
          const { data: latestInq } = await supabase
            .from('Inquiries')
            .select('Inquiry_ID')
            .eq('Contact_ID', contactId)
            .order('Inquiry_ID', { ascending: false })
            .limit(1)
            .single();

          if (latestInq) {
            inquiryId = latestInq.Inquiry_ID;
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
            inquiryId = iRes?.Inquiry_ID;
          }
        }

        if (inquiryId) {
          const today = new Date().toISOString().split('T')[0];
          await supabase
            .from('Contracts')
            .insert({
              user_id: userId,
              Inquiry_ID: inquiryId,
              Contract_Text: content,
              Contract_Title: contractTitle,
              Status: 'Sent',
              Sent_Date: today,
              Signed_Date: '',
              Sign_Token: signToken,
              Provider_Signature: providerSignatureDataUrl || '',
              Signers: JSON.stringify(signers)
            });
        }
      }

      return NextResponse.json({ success: true, sentTo: recipientEmails, signUrl });
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
