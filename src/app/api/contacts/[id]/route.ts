import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const params = await props.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Contact ID" }, { status: 400 });
    }

    // 1. Fetch Contact
    const { data: contact, error: contactError } = await supabase
      .from('Contacts')
      .select('*')
      .eq('Contact_ID', id)
      .single();

    if (contactError) throw contactError;
    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    // 2. Fetch Inquiries associated with the contact
    const { data: inquiries, error: inqError } = await supabase
      .from('Inquiries')
      .select('*')
      .eq('Contact_ID', id);

    if (inqError) throw inqError;

    const inquiryIds = inquiries ? inquiries.map((i: any) => i.Inquiry_ID) : [];

    let communications: any[] = [];
    let invoices: any[] = [];
    let contracts: any[] = [];

    // 3. Fetch related records if inquiries exist
    if (inquiryIds.length > 0) {
      const commsPromise = supabase.from('Communications').select('*').in('Inquiry_ID', inquiryIds).order('Last_Contact_Date', { ascending: false });
      const invPromise = supabase.from('Invoices').select('*, Invoice_Items(*)').in('Inquiry_ID', inquiryIds);
      const conPromise = supabase.from('Contracts').select('*').in('Inquiry_ID', inquiryIds);

      const [commsRes, invRes, conRes] = await Promise.all([commsPromise, invPromise, conPromise]);

      if (commsRes.error) throw commsRes.error;
      if (invRes.error) throw invRes.error;
      if (conRes.error) throw conRes.error;

      communications = commsRes.data || [];
      invoices = invRes.data || [];
      contracts = conRes.data || [];
    }

    return NextResponse.json({
      success: true,
      contact,
      inquiries: inquiries || [],
      communications,
      invoices,
      contracts
    });

  } catch (error: any) {
    console.error('Contact Detail API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const params = await props.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing Contact ID" }, { status: 400 });
    }

    const updates = await req.json();

    const { error } = await supabase
      .from('Contacts')
      .update({
        Name: updates.Name,
        Email: updates.Email,
        Phone: updates.Phone,
        Company: updates.Company,
        Address: updates.Address,
        Notes: updates.Notes
      })
      .eq('Contact_ID', id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Contact Detail API PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
