export const dynamic = 'force-dynamic';
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

    let cleanInquiryId = inquiryId;
    if (cleanInquiryId.includes('-')) {
      const parts = cleanInquiryId.split('-');
      cleanInquiryId = parts[parts.length - 1];
    }
    const parsedInquiryId = parseInt(cleanInquiryId);
    if (isNaN(parsedInquiryId)) {
      return NextResponse.json({ success: false, error: 'Invalid inquiryId' }, { status: 400 });
    }

    // 1. Fetch Inquiry details
    const { data: inquiry, error: inquiryError } = await supabase
      .from('Inquiries')
      .select(`
        user_id,
        Contact_ID,
        Service_Type,
        Event_Date,
        Pipeline_Stage,
        Estimated_Value,
        Questionnaire_Data,
        Contacts ( Name, Email, Phone )
      `)
      .eq('Inquiry_ID', parsedInquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ success: false, error: 'Portal not found or invalid link.' }, { status: 404 });
    }

    const userId = inquiry.user_id;

    // 2. Fetch Contracts linked to Inquiry
    const { data: contracts } = await supabase
      .from('Contracts')
      .select('Contract_ID, Contract_Title, Status, Sign_Token, Sent_Date, Signed_Date, Type, Contract_Text')
      .eq('Inquiry_ID', parsedInquiryId)
      .order('Contract_ID', { ascending: false });

    // 3. Fetch Invoices linked to Inquiry
    const { data: invoices } = await supabase
      .from('Invoices')
      .select('Invoice_ID, Issue_Date, Due_Date, Status, Total_Amount')
      .eq('Inquiry_ID', parsedInquiryId)
      .order('Issue_Date', { ascending: false });

    // 4. Fetch Deliverables linked to Inquiry
    const { data: deliverables } = await supabase
      .from('Deliverables')
      .select('Deliverable_ID, Title, Link_URL, Description, Added_Date, Client_Status, Client_Notes')
      .eq('Inquiry_ID', parsedInquiryId)
      .order('Added_Date', { ascending: false });

    // 5. Fetch Communications (Messages) linked to Inquiry
    const { data: communications } = await supabase
      .from('Communications')
      .select('Comm_ID, Last_Contact_Date, Last_Contact_By, Message, Proposal_Link')
      .eq('Inquiry_ID', parsedInquiryId)
      .order('Last_Contact_Date', { ascending: true });

    // 6. Fetch Vendor Branding (AppConfig)
    const { data: config } = await supabase
      .from('AppConfig')
      .select('Company_Name, Business_Logo, Brand_Color, Paypal_Client_Id')
      .eq('user_id', userId)
      .single();

    // 7. Fetch Uploaded Documents
    const { data: uploadedDocs } = await supabase
      .from('Contact_Documents')
      .select('Document_ID, Title, Type, File_Data, Upload_Date')
      .eq('Contact_ID', inquiry.Contact_ID)
      .order('Upload_Date', { ascending: false });

    return NextResponse.json({
      success: true,
      portal: {
        vendor: {
          id: inquiry.user_id,
          companyName: config?.Company_Name || 'Your Photographer',
          businessLogo: config?.Business_Logo || null,
          brandColor: config?.Brand_Color || '#0f172a',
          paypalClientId: config?.Paypal_Client_Id || null
        },
        client: {
          name: Array.isArray((inquiry as any).Contacts) ? (inquiry as any).Contacts[0]?.Name : (inquiry as any).Contacts?.Name,
          email: Array.isArray((inquiry as any).Contacts) ? (inquiry as any).Contacts[0]?.Email : (inquiry as any).Contacts?.Email,
          phone: Array.isArray((inquiry as any).Contacts) ? (inquiry as any).Contacts[0]?.Phone : (inquiry as any).Contacts?.Phone,
        },
        event: {
          serviceType: inquiry.Service_Type,
          eventDate: inquiry.Event_Date,
          stage: inquiry.Pipeline_Stage,
          estimatedValue: inquiry.Estimated_Value,
          questionnaireData: inquiry.Questionnaire_Data,
          deliverableMilestones: []
        },
        contracts: contracts || [],
        invoices: invoices || [],
        deliverables: deliverables || [],
        communications: communications || [],
        uploadedDocs: uploadedDocs || []
      }
    });

  } catch (error: any) {
    console.error('Portal API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const body = await req.json();
    const { action, inquiryId, payload } = body;

    if (!inquiryId || !action) {
      return NextResponse.json({ success: false, error: 'Missing inquiryId or action' }, { status: 400 });
    }

    let cleanInquiryId = String(inquiryId);
    if (cleanInquiryId.includes('-')) {
      const parts = cleanInquiryId.split('-');
      cleanInquiryId = parts[parts.length - 1];
    }
    const parsedInquiryId = parseInt(cleanInquiryId);
    if (isNaN(parsedInquiryId)) {
      return NextResponse.json({ success: false, error: 'Invalid inquiryId' }, { status: 400 });
    }

    // First fetch the inquiry to get user_id (needed for some tables)
    const { data: inquiry, error: inqErr } = await supabase.from('Inquiries').select('user_id').eq('Inquiry_ID', parsedInquiryId).single();
    if (inqErr || !inquiry) return NextResponse.json({ success: false, error: 'Invalid portal link' }, { status: 404 });

    if (action === 'send_message') {
      const { message, clientName } = payload;
      const { error } = await supabase.from('Communications').insert({
        user_id: inquiry.user_id,
        Inquiry_ID: parsedInquiryId,
        Last_Contact_Date: new Date().toISOString(),
        Last_Contact_By: clientName || 'Client',
        Message: message,
        Proposal_Link: ""
      });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'save_questionnaire') {
      const { questionnaireData } = payload;
      const { error } = await supabase.from('Inquiries').update({
        Questionnaire_Data: questionnaireData
      }).eq('Inquiry_ID', parsedInquiryId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_paid') {
      const { invoiceId } = payload;
      if (!invoiceId) return NextResponse.json({ success: false, error: 'Missing invoiceId' }, { status: 400 });

      // Verify the invoice belongs to this inquiry to prevent unauthorized updates
      const { data: invoiceCheck, error: checkError } = await supabase
        .from('Invoices')
        .select('Invoice_ID')
        .eq('Invoice_ID', invoiceId)
        .eq('Inquiry_ID', parsedInquiryId)
        .single();
        
      if (checkError || !invoiceCheck) {
        return NextResponse.json({ success: false, error: 'Invalid invoice or unauthorized' }, { status: 403 });
      }

      const { error } = await supabase
        .from('Invoices')
        .update({ Status: 'Paid' })
        .eq('Invoice_ID', invoiceId);
        
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  } catch (error: any) {
    console.error('Portal API Action Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
