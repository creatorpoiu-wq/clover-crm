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
    return NextResponse.json({ success: true, deliverable: data });
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
