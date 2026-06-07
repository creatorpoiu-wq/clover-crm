import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
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

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { userId, name, email, phone, date, time, durationMinutes, meetingType, title, notes, _hp } = payload;

    // Honeypot check - if a bot filled this out, silently accept but do nothing
    if (_hp) {
      console.log('Spam trapped via honeypot:', { type: 'meeting' });
      return NextResponse.json({ success: true });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServiceClient(url, key);

    if (!userId || !name || !email || !date || !time) {
      return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
    }

    // Combine date and time
    const startTime = new Date(`${date}T${time}`).toISOString();

    // 1. Find or Create Contact
    let contactId = null;
    const { data: existingContacts } = await supabase
      .from('Contacts')
      .select('Contact_ID')
      .eq('user_id', userId)
      .eq('Email', email)
      .limit(1);

    if (existingContacts && existingContacts.length > 0) {
      contactId = existingContacts[0].Contact_ID;
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('Contacts')
        .insert({
          user_id: userId,
          Name: name,
          Email: email,
          Phone: phone || null,
          Lead_Source: 'Public Scheduler'
        })
        .select('Contact_ID')
        .single();
      
      if (contactError) throw contactError;
      contactId = newContact.Contact_ID;
    }

    // 2. Create Meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('Meetings')
      .insert({
        user_id: userId,
        Title: title || `Meeting with ${name}`,
        Contact_ID: contactId,
        Start_Time: startTime,
        Duration_Minutes: durationMinutes || 30,
        Meeting_Type: meetingType || 'Video Call',
        Notes: notes || '',
        Status: 'Scheduled',
      })
      .select()
      .single();

    if (meetingError) throw meetingError;

    // 3. Attempt Google Calendar Sync (best effort)
    try {
      const { data: config } = await supabase
        .from('AppConfig')
        .select('Google_Refresh_Token')
        .eq('user_id', userId)
        .single();

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (clientId && clientSecret && config?.Google_Refresh_Token) {
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oAuth2Client.setCredentials({ refresh_token: config.Google_Refresh_Token });

        const googleEventId = await pushToGoogleCalendar(oAuth2Client, meeting, email);

        await supabase
          .from('Meetings')
          .update({ Google_Event_ID: googleEventId })
          .eq('Meeting_ID', meeting.Meeting_ID);
      }
    } catch (gcalErr: any) {
      console.error('Google Calendar push failed in public scheduler:', gcalErr.message);
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error: any) {
    console.error('Public Meeting Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
