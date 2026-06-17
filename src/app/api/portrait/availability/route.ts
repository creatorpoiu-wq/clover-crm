import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const customDomain = searchParams.get('customDomain');

    let targetUserId = userId;
    if (!targetUserId && customDomain) {
      const { data: appSettings } = await supabase.from('App_Settings').select('user_id').eq('Custom_Domain', customDomain).single();
      if (appSettings) targetUserId = appSettings.user_id;
    }

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'Missing userId or customDomain' }, { status: 400 });
    }

    // Fetch all Inquiries for this vendor that have an Event_Date
    const { data: events, error } = await supabase
      .from('Inquiries')
      .select('Event_Date')
      .eq('user_id', targetUserId)
      .not('Event_Date', 'is', null)
      .neq('Event_Date', '');

    if (error) throw error;

    // Extract just the dates into an array of strings (YYYY-MM-DD)
    const bookedDates = events.map(e => e.Event_Date);

    return NextResponse.json({ success: true, bookedDates });
  } catch (error: any) {
    console.error('Availability fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
