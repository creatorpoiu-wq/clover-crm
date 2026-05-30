import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const inquiryId = url.searchParams.get('inquiryId');

    let query = supabase
      .from('Email_Drafts')
      .select('*, Inquiries(Contact_Name, Email), Agents(Name, Role)')
      .eq('Status', 'draft')
      .order('Created_At', { ascending: false });

    if (inquiryId) {
      query = query.eq('Inquiry_ID', inquiryId);
    }

    const { data: drafts, error } = await query;

    if (error) throw error;
    
    return NextResponse.json({ success: true, drafts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { Draft_ID, Subject, Body, Status } = body;

    const { data, error } = await supabase
      .from('Email_Drafts')
      .update({ Subject, Body, Status })
      .eq('Draft_ID', Draft_ID)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, draft: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    const { error } = await supabase
      .from('Email_Drafts')
      .delete()
      .eq('Draft_ID', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
