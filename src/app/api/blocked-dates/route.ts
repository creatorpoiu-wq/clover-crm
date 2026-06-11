import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('Blocked_Dates')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet, return empty array to prevent breaking the app before SQL is run
        return NextResponse.json({ success: true, blockedDates: [] });
      }
      throw error;
    }

    return NextResponse.json({ success: true, blockedDates: data });
  } catch (error: any) {
    console.error('Blocked Dates GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { startDate, endDate, isAllDay, startTime, endTime } = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Start and End dates are required.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('Blocked_Dates')
      .insert({
        user_id: user.id,
        Start_Date: startDate,
        End_Date: endDate,
        Is_All_Day: isAllDay,
        Start_Time: startTime || null,
        End_Time: endTime || null
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Blocked Dates POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('Blocked_Dates')
      .delete()
      .eq('Block_ID', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Blocked Dates DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
