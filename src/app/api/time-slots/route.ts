import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });

    const { data, error } = await supabase
      .from('Session_Time_Slots')
      .select('*')
      .eq('Session_ID', sessionId)
      .order('Day_Of_Week', { ascending: true })
      .order('Start_Time', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, slots: data });
  } catch (error: any) {
    console.error('Time Slots GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { sessionId, dayOfWeek, startTime, endTime } = await req.json();

    if (sessionId === undefined || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Session_Time_Slots')
      .insert({
        user_id: user.id,
        Session_ID: sessionId,
        Day_Of_Week: dayOfWeek,
        Start_Time: startTime,
        End_Time: endTime
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, slot: data });
  } catch (error: any) {
    console.error('Time Slots POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });

    const { error } = await supabase
      .from('Session_Time_Slots')
      .delete()
      .eq('Slot_ID', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Time Slots DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
