import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, clientName, clientEmail, clientPhone, bookedDate, bookedTime, notes } = await req.json();

    if (!sessionId || !clientName || !bookedDate || !bookedTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Session_Bookings')
      .insert({
        user_id: user.id,
        Session_ID: sessionId,
        Client_Name: clientName,
        Client_Email: clientEmail || '',
        Client_Phone: clientPhone || '',
        Booked_Date: bookedDate,
        Booked_Time: bookedTime,
        Notes: notes || '',
        Status: 'Approved' // Manually created bookings are automatically approved
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, booking: data });
  } catch (error: any) {
    console.error('Manual Session Booking Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
