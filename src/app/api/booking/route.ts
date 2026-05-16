import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { name, email, phone, serviceType, eventDate, notes, leadSource, estimatedValue } = body;

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const userId = userAuth.user.id;

    if (!name || !serviceType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create the Contact
    const { data: contact, error: contactError } = await supabase
      .from('Contacts')
      .insert({
        user_id: userId,
        Name: name,
        Email: email || "",
        Phone: phone || "",
        Lead_Source: leadSource || "Booking Form"
      })
      .select()
      .single();

    if (contactError) throw contactError;
    const contactId = contact.Contact_ID;

    // 2. Create the Inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from('Inquiries')
      .insert({
        user_id: userId,
        Contact_ID: contactId,
        Service_Type: serviceType,
        Event_Date: eventDate || "",
        Pipeline_Stage: "New Inquiry",
        Estimated_Value: estimatedValue ? parseFloat(estimatedValue) : 0.0
      })
      .select()
      .single();

    if (inquiryError) throw inquiryError;
    const inquiryId = inquiry.Inquiry_ID;

    // 3. Log the Initial Message (if provided)
    if (notes && notes.trim() !== "") {
      const now = new Date().toISOString();
      const { error: commError } = await supabase
        .from('Communications')
        .insert({
          user_id: userId,
          Inquiry_ID: inquiryId,
          Last_Contact_Date: now,
          Last_Contact_By: "Client",
          Message: notes,
          Proposal_Link: ""
        });

      if (commError) throw commError;
    }

    return NextResponse.json({ success: true, contactId, inquiryId });
  } catch (error: any) {
    console.error('Booking API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
