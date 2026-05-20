import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: config } = await supabase
      .from('AppConfig')
      .select('Google_Client_ID, Google_Client_Secret, Google_Refresh_Token')
      .eq('user_id', user.id)
      .single();
    
    if (!config || !config.Google_Client_ID || !config.Google_Refresh_Token) {
      return NextResponse.json({ success: false, error: "Google Integration is not fully configured or connected." }, { status: 400 });
    }

    const oAuth2Client = new google.auth.OAuth2(
      config.Google_Client_ID,
      config.Google_Client_Secret
    );
    oAuth2Client.setCredentials({ refresh_token: config.Google_Refresh_Token });

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Fetch CRM Events
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

    // Fetch existing Google Calendar events synced by CRM
    const existingEventsRes = await calendar.events.list({
      calendarId: 'primary',
      privateExtendedProperty: ['crm_source=clover'],
      maxResults: 2500,
    });
    const existingEvents = existingEventsRes.data.items || [];
    
    const eventMap = new Map();
    existingEvents.forEach((ev: any) => {
      if (ev.extendedProperties?.private?.inquiry_id) {
        eventMap.set(ev.extendedProperties.private.inquiry_id, ev.id);
      }
    });

    let syncedCount = 0;

    for (const ev of (rawEvents || [])) {
      const contactName = (ev as any).Contacts?.Name || 'Unknown Contact';
      const eventSummary = `[Clover CRM] - ${contactName} (${ev.Service_Type})`;
      
      const eventDate = ev.Event_Date; // YYYY-MM-DD
      const nextDay = new Date(eventDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];

      const eventBody = {
        summary: eventSummary,
        description: `Pipeline Stage: ${ev.Pipeline_Stage}\nView in CRM: Contact #${(ev as any).Contacts?.Contact_ID || ev.Inquiry_ID}`,
        start: { date: eventDate },
        end: { date: nextDayStr }, // All-day events in Google Calendar require end date to be the day after
        extendedProperties: {
          private: {
            crm_source: 'clover',
            inquiry_id: ev.Inquiry_ID.toString()
          }
        }
      };

      const existingEventId = eventMap.get(ev.Inquiry_ID.toString());

      if (existingEventId) {
        // Update existing event if it changed (optimization: could check if changed, but we'll just force update for simplicity)
        await calendar.events.update({
          calendarId: 'primary',
          eventId: existingEventId,
          requestBody: eventBody
        });
      } else {
        // Create new event
        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody
        });
        syncedCount++;
      }
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error('Google Calendar Sync API Error:', error);
    // If invalid_grant, the token might be expired or revoked, or they lack the calendar scope
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
