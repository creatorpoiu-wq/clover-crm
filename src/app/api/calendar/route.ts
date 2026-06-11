import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: rawEvents, error: eventsError } = await supabase
      .from('Inquiries')
      .select(`
        Inquiry_ID,
        Event_Date,
        Pipeline_Stage,
        Service_Type,
        Contacts!inner ( Name )
      `)
      .not('Event_Date', 'is', null)
      .neq('Event_Date', '');

    if (eventsError) throw eventsError;

    const events = (rawEvents || []).map((ev: any) => ({
      Inquiry_ID: ev.Inquiry_ID,
      Contact_Name: ev.Contacts?.Name,
      Event_Date: ev.Event_Date,
      Pipeline_Stage: ev.Pipeline_Stage,
      Service_Type: ev.Service_Type
    }));

    const { data: rawReminders, error: remindersError } = await supabase
      .from('Reminders')
      .select(`
        Reminder_ID,
        Inquiry_ID,
        Reminder_Type,
        Due_Date,
        Notes,
        Is_Completed,
        Channel,
        Inquiries!inner ( Contacts!inner ( Name ) )
      `)
      .eq('Is_Completed', 0)
      .order('Due_Date', { ascending: true });

    if (remindersError) throw remindersError;

    const reminders = (rawReminders || []).map((rem: any) => ({
      Reminder_ID: rem.Reminder_ID,
      Inquiry_ID: rem.Inquiry_ID,
      Contact_Name: rem.Inquiries?.Contacts?.Name,
      Reminder_Type: rem.Reminder_Type,
      Due_Date: rem.Due_Date,
      Notes: rem.Notes,
      Is_Completed: rem.Is_Completed,
      Channel: rem.Channel
    }));

    const { data: rawBlockedDates, error: blockedDatesError } = await supabase
      .from('Blocked_Dates')
      .select('*')
      .order('Start_Date', { ascending: true });

    if (blockedDatesError && blockedDatesError.code !== '42P01') {
      throw blockedDatesError;
    }

    return NextResponse.json({
      success: true,
      events,
      reminders,
      blockedDates: rawBlockedDates || []
    });
  } catch (error: any) {
    console.error('Calendar API Error:', error);
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
      .update({ Event_Date: null })
      .eq('Inquiry_ID', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Calendar DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { inquiryId, reminderType, dueDate, notes, channel } = await req.json();
    if (!inquiryId || !dueDate) {
      return NextResponse.json({ success: false, error: 'Inquiry ID and Due Date are required.' }, { status: 400 });
    }

    // Since Reminders has a user_id, we need to fetch the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('Reminders')
      .insert({
        user_id: user.id,
        Inquiry_ID: inquiryId,
        Reminder_Type: reminderType || 'Event Reminder',
        Due_Date: dueDate,
        Notes: notes || '',
        Channel: channel || 'Email',
        Is_Completed: 0
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Calendar POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { reminderId, isCompleted } = await req.json();
    if (!reminderId) return NextResponse.json({ success: false, error: 'Missing Reminder ID' }, { status: 400 });

    const { error } = await supabase
      .from('Reminders')
      .update({ Is_Completed: isCompleted ? 1 : 0 })
      .eq('Reminder_ID', reminderId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Calendar PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
