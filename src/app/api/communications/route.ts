import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const inquiryId = searchParams.get('inquiryId');

    if (!inquiryId) {
      return NextResponse.json({ success: false, error: "Missing inquiryId" }, { status: 400 });
    }

    const { data: communications, error } = await supabase
      .from('Communications')
      .select('*')
      .eq('Inquiry_ID', inquiryId)
      .order('Last_Contact_Date', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, communications });
  } catch (error: any) {
    console.error('Communications API GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { inquiryId, contactDate, contactBy, message } = await req.json();
    
    if (!inquiryId || !contactDate || !contactBy) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('Communications')
      .insert({
        user_id: userAuth.user.id,
        Inquiry_ID: inquiryId,
        Last_Contact_Date: contactDate,
        Last_Contact_By: contactBy,
        Message: message || "",
        Proposal_Link: ""
      });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Communications API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
