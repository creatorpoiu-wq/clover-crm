import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const inquiryId = searchParams.get('inquiryId');

    if (inquiryId) {
      const { data: invoices, error } = await supabase
        .from('Invoices')
        .select('*')
        .eq('Inquiry_ID', inquiryId)
        .order('Issue_Date', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, invoices });
    }

    const { data: invoicesRaw, error } = await supabase
      .from('Invoices')
      .select(`
        *,
        Inquiries!inner ( Service_Type, Contacts!inner ( Name ) )
      `)
      .order('Issue_Date', { ascending: false });

    if (error) throw error;

    const invoices = (invoicesRaw || []).map((inv: any) => ({
      ...inv,
      Contact_Name: inv.Inquiries?.Contacts?.Name,
      Service_Type: inv.Inquiries?.Service_Type
    }));

    return NextResponse.json({ success: true, invoices });
  } catch (error: any) {
    console.error('Invoices API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { inquiryId, issueDate, dueDate, totalAmount, status } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    if (!inquiryId || !issueDate || !dueDate) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Invoices')
      .insert({
        user_id: userAuth.user.id,
        Inquiry_ID: inquiryId,
        Issue_Date: issueDate,
        Due_Date: dueDate,
        Status: status || 'Draft',
        Total_Amount: totalAmount || 0.0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, invoiceId: data.Invoice_ID });
  } catch (error: any) {
    console.error('Invoices API POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { invoiceId, status } = body;

    if (!invoiceId || !status) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from('Invoices')
      .update({ Status: status })
      .eq('Invoice_ID', invoiceId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoices API PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    const { error } = await supabase.from('Invoices').delete().eq('Invoice_ID', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoices API DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
