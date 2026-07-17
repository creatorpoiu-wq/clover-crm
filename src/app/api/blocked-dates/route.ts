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

    const parseDate = (dstr: string) => {
      const [y, m, d] = dstr.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    const curr = parseDate(startDate);
    const end = parseDate(endDate);
    
    const inserts = [];
    while (curr <= end) {
      const dStr = `${curr.getFullYear()}-${String(curr.getMonth()+1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      inserts.push({
        user_id: user.id,
        Date: dStr,
        Is_All_Day: isAllDay,
        Start_Time: startTime || null,
        End_Time: endTime || null
      });
      curr.setDate(curr.getDate() + 1);
    }

    const { error } = await supabase
      .from('Blocked_Dates')
      .insert(inserts);

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
