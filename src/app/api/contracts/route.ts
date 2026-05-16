import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const inquiryId = searchParams.get('inquiryId');

    if (inquiryId) {
      const { data: contracts, error } = await supabase
        .from('Contracts')
        .select('*')
        .eq('Inquiry_ID', inquiryId)
        .order('Contract_ID', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, contracts });
    }

    const { data: contractsRaw, error } = await supabase
      .from('Contracts')
      .select(`
        *,
        Inquiries!inner ( Service_Type, Contacts!inner ( Name ) )
      `)
      .order('Contract_ID', { ascending: false });

    if (error) throw error;

    const contracts = (contractsRaw || []).map((c: any) => ({
      ...c,
      Contact_Name: c.Inquiries?.Contacts?.Name,
      Service_Type: c.Inquiries?.Service_Type
    }));

    return NextResponse.json({ success: true, contracts });
  } catch (error: any) {
    console.error('Contracts API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { inquiryId, contractText, status, sentDate } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (!inquiryId || !contractText) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Contracts')
      .insert({
        user_id: userAuth.user.id,
        Inquiry_ID: inquiryId,
        Contract_Text: contractText,
        Status: status || 'Draft',
        Sent_Date: sentDate || '',
        Signed_Date: ''
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, contractId: data.Contract_ID });
  } catch (error: any) {
    console.error('Contracts API POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { contractId, status, signedDate, contractText } = body;

    if (!contractId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const updatePayload: any = { Status: status };
    if (contractText !== undefined) updatePayload.Contract_Text = contractText;
    if (signedDate !== undefined) updatePayload.Signed_Date = signedDate;

    const { error } = await supabase
      .from('Contracts')
      .update(updatePayload)
      .eq('Contract_ID', contractId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contracts API PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const { error } = await supabase.from('Contracts').delete().eq('Contract_ID', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contracts API DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
