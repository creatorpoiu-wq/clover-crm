import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// The sign page is PUBLIC — clients access it without a login session.
// We use the service role key to bypass RLS for reading/writing the contract.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

// GET /api/sign?token=xxx  — load contract for signing page
export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const token = new URL(req.url).searchParams.get('token');
    if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });

    const { data: contract, error } = await supabase
      .from('Contracts')
      .select(`
        Contract_ID,
        Contract_Text,
        Contract_Title,
        Status,
        Sign_Token,
        Provider_Signature,
        Client_Signature,
        Signers,
        user_id,
        Inquiries!inner (
          Service_Type,
          Contacts!inner ( Name )
        )
      `)
      .eq('Sign_Token', token)
      .single();

    if (error || !contract) {
      return NextResponse.json({ success: false, error: 'Contract not found or link expired.' }, { status: 404 });
    }

    // Fetch the company name for the contract owner
    const { data: config } = await supabase
      .from('AppConfig')
      .select('Company_Name')
      .eq('user_id', contract.user_id)
      .single();

    const companyName = config?.Company_Name || 'Clover';

    const mappedContract = {
      ...contract,
      Contact_Name: (contract as any).Inquiries?.Contacts?.Name,
      Service_Type: (contract as any).Inquiries?.Service_Type,
    };

    if (contract.Status === 'Signed') {
      return NextResponse.json({ success: true, alreadySigned: true, contract: mappedContract, companyName });
    }

    return NextResponse.json({ success: true, contract: mappedContract, companyName });
  } catch (error: any) {
    console.error('Sign GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/sign — submit client signature
export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { token, signatureDataUrl } = await req.json();
    if (!token || !signatureDataUrl) {
      return NextResponse.json({ success: false, error: 'Missing token or signature.' }, { status: 400 });
    }

    const { data: contract, error: findError } = await supabase
      .from('Contracts')
      .select('Contract_ID, Status')
      .eq('Sign_Token', token)
      .single();

    if (findError || !contract) {
      return NextResponse.json({ success: false, error: 'Invalid or expired signing link.' }, { status: 404 });
    }
    if (contract.Status === 'Signed') {
      return NextResponse.json({ success: false, error: 'Contract has already been signed.' }, { status: 409 });
    }

    const today = new Date().toISOString().split('T')[0];
    const { error: updateError } = await supabase
      .from('Contracts')
      .update({
        Status: 'Signed',
        Signed_Date: today,
        Client_Signature: signatureDataUrl
      })
      .eq('Contract_ID', contract.Contract_ID);

    if (updateError) throw updateError;

    // Advance Pipeline Stage to Contract Signed
    const { data: contractDetails } = await supabase
      .from('Contracts')
      .select('Inquiry_ID')
      .eq('Contract_ID', contract.Contract_ID)
      .single();

    if (contractDetails?.Inquiry_ID) {
      await supabase
        .from('Inquiries')
        .update({ Pipeline_Stage: 'Contract Signed' })
        .eq('Inquiry_ID', contractDetails.Inquiry_ID);
    }

    // --- AUTOMATIONS TRIGGER ---
    try {
      const { data: contractDetails } = await supabase
        .from('Contracts')
        .select(`user_id, Inquiries!inner ( Contact_ID )`)
        .eq('Contract_ID', contract.Contract_ID)
        .single();

      if (contractDetails) {
        const contactId = (contractDetails as any).Inquiries?.Contact_ID;
        const userId = contractDetails.user_id;

        const { data: automations } = await supabase
          .from('Automations')
          .select('Action, Template_ID')
          .eq('Trigger_Event', 'contract_signed')
          .eq('Is_Active', true);

        if (automations && automations.length > 0 && contactId) {
          const emailAuto = automations.find(a => a.Action === 'send_email');
          if (emailAuto && emailAuto.Template_ID) {
            const [{ data: tpl }, { data: contactRow }, { data: config }] = await Promise.all([
              supabase.from('EmailTemplates').select('Subject, Body').eq('Template_ID', emailAuto.Template_ID).single(),
              supabase.from('Contacts').select('Name, Email').eq('Contact_ID', contactId).single(),
              supabase.from('AppConfig').select('Email_User, Email_Pass, Company_Name').eq('user_id', userId).single()
            ]);

            if (tpl && contactRow && config?.Email_User && config?.Email_Pass) {
              const nodemailer = require('nodemailer');
              const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: config.Email_User, pass: config.Email_Pass } });
              const clientName = contactRow.Name.split(' ')[0];
              const companyName = config.Company_Name || 'Clover';

              let parsedBody = tpl.Body.replace(/\[Name\]|\{Name\}/gi, clientName).replace(/\[Client Name\]|\{Client Name\}/gi, contactRow.Name).replace(/\n/g, '<br/>');
              let parsedSubject = tpl.Subject.replace(/\[Name\]|\{Name\}/gi, clientName).replace(/\[Client Name\]|\{Client Name\}/gi, contactRow.Name);

              await transporter.sendMail({
                from: `"${companyName}" <${config.Email_User}>`,
                to: contactRow.Email,
                subject: parsedSubject,
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                         <div style="font-size: 16px; line-height: 1.6;">${parsedBody}</div>
                         <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                         <p style="font-size: 12px; color: #9ca3af; text-align: center;">Sent securely via ${companyName} CRM</p>
                       </div>`
              });
            }
          }
        }
      }
    } catch (autoErr) {
      console.error('Automation execution failed:', autoErr);
    }
    // ---------------------------

    return NextResponse.json({ success: true, signedDate: today });
  } catch (error: any) {
    console.error('Sign POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
