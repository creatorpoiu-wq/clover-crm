import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Service role client — bypasses RLS for public read access
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    const inquiryId = searchParams.get('inquiryId');

    if (!inquiryId) {
      return NextResponse.json({ success: false, error: 'Missing inquiryId' }, { status: 400 });
    }

    // 1. Fetch Inquiry details
    const { data: inquiry, error: inquiryError } = await supabase
      .from('Inquiries')
      .select(`
        user_id,
        Service_Type,
        Event_Date,
        Pipeline_Stage,
        Estimated_Value,
        Contacts!inner ( Name, Email, Phone )
      `)
      .eq('Inquiry_ID', inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ success: false, error: 'Portal not found or invalid link.' }, { status: 404 });
    }

    const userId = inquiry.user_id;

    // 2. Fetch Contracts linked to Inquiry
    const { data: contracts } = await supabase
      .from('Contracts')
      .select('Contract_ID, Contract_Title, Status, Sign_Token, Sent_Date, Signed_Date')
      .eq('Inquiry_ID', inquiryId)
      .order('Contract_ID', { ascending: false });

    // 3. Fetch Invoices linked to Inquiry
    const { data: invoices } = await supabase
      .from('Invoices')
      .select('Invoice_ID, Issue_Date, Due_Date, Status, Total_Amount')
      .eq('Inquiry_ID', inquiryId)
      .order('Issue_Date', { ascending: false });

    // 4. Fetch Vendor Branding (AppConfig)
    const { data: config } = await supabase
      .from('AppConfig')
      .select('Company_Name, Business_Logo')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      success: true,
      portal: {
        vendor: {
          companyName: config?.Company_Name || 'Studio',
          businessLogo: config?.Business_Logo || null
        },
        client: {
          name: (inquiry as any).Contacts?.Name,
          email: (inquiry as any).Contacts?.Email,
          phone: (inquiry as any).Contacts?.Phone,
        },
        event: {
          serviceType: inquiry.Service_Type,
          eventDate: inquiry.Event_Date,
          stage: inquiry.Pipeline_Stage,
          estimatedValue: inquiry.Estimated_Value
        },
        contracts: contracts || [],
        invoices: invoices || []
      }
    });

  } catch (error: any) {
    console.error('Portal API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
