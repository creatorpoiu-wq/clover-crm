import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    
    if (!userAuth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('SchedulingSettings')
      .select('*')
      .eq('user_id', userAuth.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the code for 'no rows returned'
      throw error;
    }

    return NextResponse.json({ success: true, settings: data || null });
  } catch (error: any) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.getUser();
    
    if (!userAuth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { timezone, slot_duration, buffer_time, availability } = body;

    // First check if it exists
    const { data: existing } = await supabase
      .from('SchedulingSettings')
      .select('id')
      .eq('user_id', userAuth.user.id)
      .single();

    let result;
    
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('SchedulingSettings')
        .update({ timezone, slot_duration, buffer_time, availability })
        .eq('user_id', userAuth.user.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('SchedulingSettings')
        .insert({
          user_id: userAuth.user.id,
          timezone,
          slot_duration,
          buffer_time,
          availability
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (error: any) {
    console.error('Settings PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
