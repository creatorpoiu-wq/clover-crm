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
    const { inquiryId, selectedDate } = payload;

    if (!inquiryId || !selectedDate) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('Inquiries')
      .update({ Event_Date: selectedDate })
      .eq('Inquiry_ID', inquiryId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Availability lock error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
