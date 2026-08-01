import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
      }
    }
  );
}

// GET /api/proposals/[id] — public read (for the /proposal/[id] client page)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getServiceClient(); // public read — no auth required

    let query = supabase.from('Proposals').select(`
        Proposal_ID, Slug, user_id, Title, Status, Custom_Notes, Cover_Image, Addons,
        Sent_At, Accepted_At, Declined_At, Decline_Reason,
        Questionnaire_Template_ID, Contract_Template_ID,
        Contact_ID,
        Contacts ( Name, Email ),
        Packages ( Package_ID, Name, Price, Duration, Items )
      `);

    if (/^\d+$/.test(id)) {
      query = query.eq('Proposal_ID', id);
    } else {
      query = query.eq('Slug', id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Supabase Proposal query error (multiple rows?):", error);
      return NextResponse.json({ success: false, error: `Proposal query failed for ID "${id}": Multiple rows found or database error. ${error.message} (Code: ${error.code})` }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: `Proposal with ID or Slug "${id}" not found in the database. DB URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}. URL: ${req.url}. Data: ${JSON.stringify(data)}. Error: ${JSON.stringify(error)}`
      }, { status: 404 });
    }

    // Also fetch the photographer's branding from AppConfig
    const { data: config } = await supabase
      .from('AppConfig')
      .select('Company_Name, Logo_Url, Brand_Color, Custom_Domain')
      .eq('user_id', (data as any).user_id || '')
      .single();

    // Fetch funnel settings for fallback cover image / style
    const { data: funnelSettings } = await supabase
      .from('Booking_Settings')
      .select('Cover_Image, Style_Photo_Url, Style_Heading, Style_Description, Style_Bullets')
      .eq('user_id', (data as any).user_id || '')
      .single();

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

// PUT /api/proposals/[id] — update proposal (owner or public for accept/decline)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Resolve slug/id to actual Proposal_ID using service client (since public needs to accept)
    const serviceClient = getServiceClient();
    let resolveQuery = serviceClient.from('Proposals').select('Proposal_ID, user_id');
    if (/^\d+$/.test(id)) resolveQuery = resolveQuery.eq('Proposal_ID', id);
    else resolveQuery = resolveQuery.eq('Slug', id);
    
    const { data: existing } = await resolveQuery.single();
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const realId = existing.Proposal_ID;
    const ownerId = existing.user_id;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await req.json();
    const {
      title, contactId, inquiryId, packageId, addons,
      coverImage, customNotes, questionnaireTemplateId,
      contractTemplateId, status, declineReason,
    } = body;

    const isPublicUpdate = !user && status && Object.keys(body).every(k => ['status', 'declineReason'].includes(k));
    if (!user && !isPublicUpdate) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const updatePayload: any = {};
    if (user) {
      // Owner-only fields
      if (title !== undefined) updatePayload.Title = title;
      if (contactId !== undefined) updatePayload.Contact_ID = contactId || null;
      if (inquiryId !== undefined) updatePayload.Inquiry_ID = inquiryId || null;
      if (packageId !== undefined) updatePayload.Package_ID = packageId || null;
      if (addons !== undefined) updatePayload.Addons = addons;
      if (coverImage !== undefined) updatePayload.Cover_Image = coverImage || null;
      if (customNotes !== undefined) updatePayload.Custom_Notes = customNotes;
      if (questionnaireTemplateId !== undefined) updatePayload.Questionnaire_Template_ID = questionnaireTemplateId || null;
      if (contractTemplateId !== undefined) updatePayload.Contract_Template_ID = contractTemplateId || null;
    }

    // Status can be updated by owner or public
    if (status !== undefined) {
      updatePayload.Status = status;
      if (status === 'Sent') updatePayload.Sent_At = new Date().toISOString();
      if (status === 'Accepted') updatePayload.Accepted_At = new Date().toISOString();
      if (status === 'Declined') {
        updatePayload.Declined_At = new Date().toISOString();
        if (declineReason) updatePayload.Decline_Reason = declineReason;
      }
    }

    // Use service client if public, otherwise normal client
    const clientToUse = isPublicUpdate ? serviceClient : supabase;

    const { data, error } = await clientToUse
      .from('Proposals')
      .update(updatePayload)
      .eq('Proposal_ID', realId)
      .eq('user_id', ownerId)
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
