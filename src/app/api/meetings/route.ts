import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { google } from 'googleapis';

// Helper: push a meeting to Google Calendar
async function pushToGoogleCalendar(oAuth2Client: any, meeting: any, contactEmail?: string) {
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const startDt = new Date(meeting.Start_Time);
  const endDt = new Date(startDt.getTime() + (meeting.Duration_Minutes || 30) * 60000);

  const attendees: { email: string }[] = [];
  if (contactEmail) attendees.push({ email: contactEmail });

  const event = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: contactEmail ? 'all' : 'none',
    requestBody: {
      summary: meeting.Title,
      description: meeting.Notes || '',
      start: { dateTime: startDt.toISOString() },
      end: { dateTime: endDt.toISOString() },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
      extendedProperties: {
        private: { crm_source: 'clover', meeting_id: String(meeting.Meeting_ID || '') },
      },
    },
  });

  return event.data.id;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('Meetings')
      .select(`
        *,
        Contacts ( Name, Email )
      `)
      .eq('user_id', user.id)
      .order('Start_Time', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, meetings: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, contactId, startTime, durationMinutes, meetingType, notes, syncToGoogle } = body;

    if (!title || !startTime) {
      return NextResponse.json({ success: false, error: 'Title and start time are required.' }, { status: 400 });
    }

    const { data: meeting, error } = await supabase
      .from('Meetings')
      .insert({
        user_id: user.id,
        Title: title,
        Contact_ID: contactId || null,
        Start_Time: startTime,
        Duration_Minutes: durationMinutes || 30,
        Meeting_Type: meetingType || 'Call',
        Notes: notes || '',
        Status: 'Scheduled',
      })
      .select()
      .single();

    if (error) throw error;

    // Push to Google Calendar if requested and connected
    if (syncToGoogle) {
      try {
        const { data: config } = await supabase
          .from('AppConfig')
          .select('Google_Refresh_Token')
          .eq('user_id', user.id)
          .single();

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (clientId && clientSecret && config?.Google_Refresh_Token) {
          const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
          oAuth2Client.setCredentials({ refresh_token: config.Google_Refresh_Token });

          // Fetch contact email if linked
          let contactEmail: string | undefined;
          if (contactId) {
            const { data: contact } = await supabase
              .from('Contacts')
              .select('Email')
              .eq('Contact_ID', contactId)
              .single();
            contactEmail = contact?.Email;
          }

          const googleEventId = await pushToGoogleCalendar(oAuth2Client, meeting, contactEmail);

          // Save the Google Calendar event ID for future updates/deletes
          await supabase
            .from('Meetings')
            .update({ Google_Event_ID: googleEventId })
            .eq('Meeting_ID', meeting.Meeting_ID);
        }
      } catch (gcalErr: any) {
        console.error('Google Calendar push failed:', gcalErr.message);
        // Don't fail the whole request — meeting is saved, calendar sync is best-effort
      }
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { meetingId, status, title, startTime, durationMinutes, notes } = body;

    const { error } = await supabase
      .from('Meetings')
      .update({
        ...(title !== undefined && { Title: title }),
        ...(startTime !== undefined && { Start_Time: startTime }),
        ...(durationMinutes !== undefined && { Duration_Minutes: durationMinutes }),
        ...(notes !== undefined && { Notes: notes }),
        ...(status !== undefined && { Status: status }),
      })
      .eq('Meeting_ID', meetingId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    // Try to delete from Google Calendar too
    const { data: meeting } = await supabase
      .from('Meetings')
      .select('Google_Event_ID')
      .eq('Meeting_ID', id)
      .single();

    if (meeting?.Google_Event_ID) {
      try {
        const { data: config } = await supabase
          .from('AppConfig')
          .select('Google_Refresh_Token')
          .eq('user_id', user.id)
          .single();

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (clientId && clientSecret && config?.Google_Refresh_Token) {
          const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
          oAuth2Client.setCredentials({ refresh_token: config.Google_Refresh_Token });
          const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
          await calendar.events.delete({ calendarId: 'primary', eventId: meeting.Google_Event_ID });
        }
      } catch (e) {
        console.error('Failed to delete Google Calendar event:', e);
      }
    }

    const { error } = await supabase.from('Meetings').delete().eq('Meeting_ID', id).eq('user_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
