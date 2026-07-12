import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/proposals — list all proposals for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('Proposals')
      .select(`
        Proposal_ID, Title, Status, Sent_At, Accepted_At, Declined_At, Created_At, Custom_Notes, Cover_Image,
        Contacts ( Contact_ID, Name, Email ),
        Packages ( Package_ID, Name, Price )
      `)
      .eq('user_id', user.id)
      .order('Created_At', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, proposals: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/proposals — create a new proposal
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      title, contactId, inquiryId, packageId,
      addons, coverImage, customNotes,
      questionnaireTemplateId, contractTemplateId,
    } = body;

    // Allow creating draft proposals without a contact linked initially
    // if (!contactId) return NextResponse.json({ success: false, error: 'contactId is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('Proposals')
      .insert({
        user_id: user.id,
        Title: title || 'Wedding Proposal',
        Contact_ID: contactId,
        Inquiry_ID: inquiryId || null,
        Package_ID: packageId || null,
        Addons: addons || [],
        Cover_Image: coverImage || null,
        Custom_Notes: customNotes || null,
        Questionnaire_Template_ID: questionnaireTemplateId || null,
        Contract_Template_ID: contractTemplateId || null,
        Status: 'Draft',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, proposal: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
