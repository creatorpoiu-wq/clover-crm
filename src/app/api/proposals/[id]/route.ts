import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET /api/proposals/[id] — public read (for the /proposal/[id] client page)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getServiceClient(); // public read — no auth required

    const { data, error } = await supabase
      .from('Proposals')
      .select(`
        Proposal_ID, Title, Status, Custom_Notes, Cover_Image, Addons,
        Sent_At, Accepted_At, Declined_At, Decline_Reason,
        Questionnaire_Template_ID, Contract_Template_ID,
        Contact_ID,
        Contacts ( Name, Email ),
        Packages ( Package_ID, Name, Price, Duration, Items )
      `)
      .eq('Proposal_ID', id)
      .single();

    if (error || !data) return NextResponse.json({ success: false, error: 'Proposal not found' }, { status: 404 });

    // Also fetch the photographer's branding from AppConfig
    const { data: config } = await supabase
      .from('AppConfig')
      .select('Company_Name, Logo_Url, Brand_Color')
      .eq('user_id', data.user_id || '')
      .single()
      .catch(() => ({ data: null }));

    // Fetch funnel settings for fallback cover image / style
    const { data: funnelSettings } = await supabase
      .from('Booking_Settings')
      .select('Cover_Image, Style_Photo_Url, Style_Heading, Style_Description, Style_Bullets')
      .eq('user_id', (data as any).user_id || '')
      .single()
      .catch(() => ({ data: null }));

    return NextResponse.json({
      success: true,
      proposal: data,
      config: config || {},
      funnelSettings: funnelSettings || {},
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT /api/proposals/[id] — update proposal (owner only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      title, contactId, inquiryId, packageId, addons,
      coverImage, customNotes, questionnaireTemplateId,
      contractTemplateId, status, declineReason,
    } = body;

    const updatePayload: any = {};
    if (title !== undefined) updatePayload.Title = title;
    if (contactId !== undefined) updatePayload.Contact_ID = contactId;
    if (inquiryId !== undefined) updatePayload.Inquiry_ID = inquiryId;
    if (packageId !== undefined) updatePayload.Package_ID = packageId;
    if (addons !== undefined) updatePayload.Addons = addons;
    if (coverImage !== undefined) updatePayload.Cover_Image = coverImage;
    if (customNotes !== undefined) updatePayload.Custom_Notes = customNotes;
    if (questionnaireTemplateId !== undefined) updatePayload.Questionnaire_Template_ID = questionnaireTemplateId;
    if (contractTemplateId !== undefined) updatePayload.Contract_Template_ID = contractTemplateId;
    if (status !== undefined) {
      updatePayload.Status = status;
      if (status === 'Sent') updatePayload.Sent_At = new Date().toISOString();
      if (status === 'Accepted') updatePayload.Accepted_At = new Date().toISOString();
      if (status === 'Declined') {
        updatePayload.Declined_At = new Date().toISOString();
        if (declineReason) updatePayload.Decline_Reason = declineReason;
      }
    }

    const { data, error } = await supabase
      .from('Proposals')
      .update(updatePayload)
      .eq('Proposal_ID', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, proposal: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/proposals/[id] — delete proposal (owner only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('Proposals')
      .delete()
      .eq('Proposal_ID', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
