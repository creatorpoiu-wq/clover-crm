import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Use service role to bypass RLS since this is a public endpoint
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServiceClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get('userId');

    if (!userId) {
      // Try to get from auth session
      const authClient = await createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const authHeader = req.headers.get('cookie') || req.headers.get('authorization');
      
      // If we are calling from the dashboard, we should use standard createClient from utils to get the session
      const { createClient } = require('@/utils/supabase/server');
      const standardSupabase = await createClient();
      const { data: { user } } = await standardSupabase.auth.getUser();
      
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
    }

    // 1. Fetch Inquiries with an Event_Date
    const { data: inquiries, error: inquiriesError } = await supabase
      .from('Inquiries')
      .select('Event_Date')
      .eq('user_id', userId)
      .not('Event_Date', 'is', null)
      .neq('Event_Date', '');

    if (inquiriesError) throw inquiriesError;

    // 2. Fetch Meetings with a Start_Time
    const { data: meetings, error: meetingsError } = await supabase
      .from('Meetings')
      .select('Start_Time')
      .eq('user_id', userId)
      .not('Start_Time', 'is', null);

    if (meetingsError) throw meetingsError;

    const blockedDatesSet = new Set<string>();

    // Add Inquiry Dates
    inquiries?.forEach(inquiry => {
      if (inquiry.Event_Date) {
        // Assume Event_Date is stored as YYYY-MM-DD or parseable string
        const dateStr = new Date(inquiry.Event_Date).toISOString().split('T')[0];
        blockedDatesSet.add(dateStr);
      }
    });

    // Add Meeting Dates
    meetings?.forEach(meeting => {
      if (meeting.Start_Time) {
        const dateStr = new Date(meeting.Start_Time).toISOString().split('T')[0];
        blockedDatesSet.add(dateStr);
      }
    });

    // 3. Fetch explicit Blocked Dates
    const { data: rawBlocked, error: blockedError } = await supabase
      .from('Blocked_Dates')
      .select('Start_Date, End_Date')
      .eq('user_id', userId);

    if (blockedError && blockedError.code !== '42P01') {
      console.error('Error fetching Blocked_Dates:', blockedError);
    } else if (rawBlocked) {
      rawBlocked.forEach(block => {
        // Simple logic to add Start_Date and End_Date, can be expanded to full ranges later
        if (block.Start_Date) blockedDatesSet.add(block.Start_Date);
        if (block.End_Date) blockedDatesSet.add(block.End_Date);
      });
    }

    const blockedDates = Array.from(blockedDatesSet);

    return NextResponse.json({ success: true, blockedDates });
  } catch (error: any) {
    console.error('Availability API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
