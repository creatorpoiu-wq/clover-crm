import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const inquiryId = searchParams.get('inquiryId');

    if (!inquiryId) return NextResponse.json({ success: false, error: 'Missing inquiryId' }, { status: 400 });

    const { data, error } = await supabase
      .from('Deliverables')
      .select('*')
      .eq('Inquiry_ID', inquiryId)
      .order('Added_Date', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, deliverables: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { inquiryId, title, linkUrl, description } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('Deliverables').insert({
      user_id: userAuth.user.id,
      Inquiry_ID: inquiryId,
      Title: title,
      Link_URL: linkUrl || null,
      Description: description || null
    }).select().single();

    if (error) throw error;

    // Send email to client
    try {
      const { data: config } = await supabase.from('AppConfig').select('Email_User, Email_Pass, Company_Name').eq('user_id', userAuth.user.id).single();
      const { data: inquiry } = await supabase.from('Inquiries').select('Contact_ID').eq('Inquiry_ID', inquiryId).single();
      if (config?.Email_User && config?.Email_Pass && inquiry?.Contact_ID) {
        const { data: contact } = await supabase.from('Contacts').select('Email, Name').eq('Contact_ID', inquiry.Contact_ID).single();
        if (contact?.Email) {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: config.Email_User, pass: config.Email_Pass } });
          const portalLink = `${req.nextUrl.origin}/portal/${inquiryId}`;
          await transporter.sendMail({
            from: `"${config.Company_Name || 'Studio'}" <${config.Email_User}>`,
            to: contact.Email,
            subject: `New Deliverable Ready: ${title}`,
            html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>Your deliverable is ready!</h2>
              <p>Hi ${contact.Name.split(' ')[0]},</p>
              <p>We've uploaded a new deliverable: <strong>${title}</strong></p>
              ${description ? `<p>${description}</p>` : ''}
              <p><a href="${portalLink}" style="display:inline-block; padding:10px 20px; background:#0f172a; color:#fff; text-decoration:none; border-radius:5px;">View in Client Portal</a></p>
            </div>`
          });
        }
      }
    } catch (e) {
      console.error("Failed to send deliverable email", e);
    }

    return NextResponse.json({ success: true, deliverable: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { id, clientStatus, clientNotes, inquiryId } = body;

    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const { error } = await supabase.from('Deliverables').update({
      Client_Status: clientStatus,
      Client_Notes: clientNotes
    }).eq('Deliverable_ID', id);

    if (error) throw error;

    // Send email to admin if it's a revision or approved
    try {
      // Find admin config using inquiry to find user_id
      const { data: deliverable } = await supabase.from('Deliverables').select('user_id, Title').eq('Deliverable_ID', id).single();
      if (deliverable?.user_id) {
        const { data: config } = await supabase.from('AppConfig').select('Email_User, Email_Pass, Company_Name').eq('user_id', deliverable.user_id).single();
        if (config?.Email_User && config?.Email_Pass) {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: config.Email_User, pass: config.Email_Pass } });
          const subject = clientStatus === 'approved' ? `Deliverable Approved: ${deliverable.Title}` : `Revision Requested: ${deliverable.Title}`;
          await transporter.sendMail({
            from: `"${config.Company_Name || 'System'}" <${config.Email_User}>`,
            to: config.Email_User, // Send to admin
            subject: subject,
            html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>Client Feedback Received</h2>
              <p><strong>Deliverable:</strong> ${deliverable.Title}</p>
              <p><strong>Status:</strong> ${clientStatus}</p>
              <p><strong>Notes:</strong><br/>${clientNotes || 'No notes provided.'}</p>
            </div>`
          });
        }
      }
    } catch (e) {
      console.error("Failed to send feedback email", e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const { error } = await supabase.from('Deliverables').delete().eq('Deliverable_ID', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
