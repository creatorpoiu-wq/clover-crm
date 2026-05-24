import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Inline status flag calculation (replaces deleted statusFlags module)
function calculateStatusFlag(inquiry: any): string {
  const { Pipeline_Stage, Last_Contact_Date, Event_Date } = inquiry;
  if (Pipeline_Stage === 'Booked') return 'booked';
  if (Pipeline_Stage === 'Lost/Archived') return 'lost';
  if (!Last_Contact_Date) return 'no-contact';
  const daysSinceContact = (Date.now() - new Date(Last_Contact_Date).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceContact > 7) return 'overdue';
  if (Event_Date && new Date(Event_Date) < new Date()) return 'past-event';
  return 'active';
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // We fetch Inquiries, joined with Contacts and Communications
    const { data: rawInquiries, error } = await supabase
      .from('Inquiries')
      .select(`
        Inquiry_ID,
        Contact_ID,
        Service_Type,
        Event_Date,
        Pipeline_Stage,
        Estimated_Value,
        Contacts!inner ( Name, Email, Phone, Lead_Source, Package_ID ),
        Communications ( Last_Contact_Date, Last_Contact_By, Proposal_Link )
      `)
      .neq('Pipeline_Stage', 'Lost/Archived')
      .order('Inquiry_ID', { ascending: false });

    if (error) throw error;

    const inquiriesWithFlags = (rawInquiries || []).map((inq: any) => {
      // Map the nested Contacts object to flat properties
      const contact = inq.Contacts || {};
      
      // Get the most recent communication (if any)
      // Supabase returns an array for Communications because it's a one-to-many relationship
      let latestComm = null;
      if (inq.Communications && inq.Communications.length > 0) {
        // Sort by Last_Contact_Date descending
        const sortedComms = inq.Communications.sort((a: any, b: any) => {
          return new Date(b.Last_Contact_Date).getTime() - new Date(a.Last_Contact_Date).getTime();
        });
        latestComm = sortedComms[0];
      }

      const mappedInquiry = {
        Inquiry_ID: inq.Inquiry_ID,
        Contact_ID: inq.Contact_ID,
        Package_ID: contact.Package_ID || null,
        Contact_Name: contact.Name,
        Email: contact.Email,
        Phone: contact.Phone,
        Lead_Source: contact.Lead_Source,
        Service_Type: inq.Service_Type,
        Event_Date: inq.Event_Date,
        Pipeline_Stage: inq.Pipeline_Stage,
        Estimated_Value: inq.Estimated_Value,
        Last_Contact_Date: latestComm?.Last_Contact_Date || null,
        Last_Contact_By: latestComm?.Last_Contact_By || null,
        Proposal_Link: latestComm?.Proposal_Link || null,
      };

      return {
        ...mappedInquiry,
        Status_Flag: calculateStatusFlag(mappedInquiry)
      };
    });

    return NextResponse.json({ success: true, inquiries: inquiriesWithFlags });
  } catch (error: any) {
    console.error('Inquiries API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { id, Contact_ID, Package_ID, Service_Type, Pipeline_Stage, Estimated_Value, Event_Date, Deliverable_Milestones } = body;
    
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const updatePayload: any = {
      Service_Type,
      Pipeline_Stage,
      Estimated_Value,
      Event_Date
    };

    if (Deliverable_Milestones !== undefined) {
      updatePayload.Deliverable_Milestones = Deliverable_Milestones;
    }

    const { error } = await supabase
      .from('Inquiries')
      .update(updatePayload)
      .eq('Inquiry_ID', id);

    if (error) throw error;

    // Update Package_ID on the associated Contact if provided
    if (Contact_ID && Package_ID !== undefined) {
      const { error: contactError } = await supabase
        .from('Contacts')
        .update({ Package_ID: Package_ID })
        .eq('Contact_ID', Contact_ID);
        
      if (contactError) throw contactError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Inquiries API PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { contactId, serviceType, eventDate, estimatedValue, pipelineStage } = body;
    
    if (!contactId || !serviceType) {
      return NextResponse.json({ success: false, error: "Missing required fields (contactId, serviceType)" }, { status: 400 });
    }

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('Inquiries')
      .insert({
        user_id: userAuth.user.id,
        Contact_ID: contactId,
        Service_Type: serviceType,
        Event_Date: eventDate || null,
        Estimated_Value: estimatedValue ? parseFloat(estimatedValue) : 0,
        Pipeline_Stage: pipelineStage || "New Inquiry"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, inquiry: data });
  } catch (error: any) {
    console.error('Inquiries API POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const { error } = await supabase
      .from('Inquiries')
      .delete()
      .eq('Inquiry_ID', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Inquiries DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
