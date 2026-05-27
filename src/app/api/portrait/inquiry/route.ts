import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const payload = await req.json();
    
    // Validate required fields
    const { userId, name, email, phone, budget, sessionType, timeline, referral } = payload;

    if (!userId || !name || !email) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Create or Find Contact
    let contactId = null;
    const { data: existingContact } = await supabase
      .from('Contacts')
      .select('Contact_ID')
      .eq('user_id', userId)
      .eq('Email', email)
      .single();

    if (existingContact) {
      contactId = existingContact.Contact_ID;
      // Optionally update phone if it was empty before
      if (phone) {
        await supabase.from('Contacts').update({ Phone: phone }).eq('Contact_ID', contactId);
      }
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('Contacts')
        .insert({
          user_id: userId,
          Name: name,
          Email: email,
          Phone: phone || '',
          Lead_Source: referral || 'Portrait Funnel'
        })
        .select()
        .single();
      if (contactError) throw contactError;
      contactId = newContact.Contact_ID;
    }

    // 2. Create Inquiry
    // Store extra questionnaire data in Questionnaire_Data JSONB field
    const questionnaireData = {
      budget,
      timeline,
      referral
    };

    const { data: inquiry, error: inquiryError } = await supabase
      .from('Inquiries')
      .insert({
        user_id: userId,
        Contact_ID: contactId,
        Service_Type: sessionType || 'Portrait Session',
        Event_Date: null, // To be selected in step 2
        Estimated_Value: null,
        Pipeline_Stage: 'New Inquiry',
        Questionnaire_Data: questionnaireData
      })
      .select()
      .single();

    if (inquiryError) throw inquiryError;

    // Return the Inquiry_ID and Contact_ID so the welcome guide can link to the booking funnel properly
    return NextResponse.json({ 
      success: true, 
      inquiryId: inquiry.Inquiry_ID,
      contactId: contactId
    });

  } catch (error: any) {
    console.error('Portrait inquiry submit error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
