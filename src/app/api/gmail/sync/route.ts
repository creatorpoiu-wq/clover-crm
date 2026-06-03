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
      .select('Google_Refresh_Token')
      .eq('user_id', user.id)
      .single();
    
    if (!config || !config.Google_Refresh_Token) {
      return NextResponse.json({ success: false, error: 'Google Account not connected' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ success: false, error: 'Google OAuth not configured on server' });
    }

    const oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );
    oAuth2Client.setCredentials({ refresh_token: config.Google_Refresh_Token });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Fetch all active inquiries with their contact emails
    const { data: inquiries, error: inqError } = await supabase
      .from('Inquiries')
      .select(`
        Inquiry_ID,
        Contacts!inner ( Email )
      `)
      .neq('Pipeline_Stage', 'Lost/Archived');

    if (inqError) throw inqError;

    let syncedCount = 0;

    for (const inq of (inquiries || [])) {
      const email = (inq as any).Contacts?.Email?.trim();
      if (!email) continue;

      const res = await gmail.users.messages.list({
        userId: 'me',
        q: `from:${email} newer_than:7d`,
        maxResults: 5
      });

      const messages = res.data.messages || [];
      
      for (const msg of messages) {
        const msgDetails = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id as string,
          format: 'metadata',
          metadataHeaders: ['Date', 'Subject']
        });

        const dateHeader = msgDetails.data.payload?.headers?.find(h => h.name === 'Date')?.value;
        const subjectHeader = msgDetails.data.payload?.headers?.find(h => h.name === 'Subject')?.value;
        const snippet = msgDetails.data.snippet;

        if (!dateHeader) continue;

        const isoDate = new Date(dateHeader).toISOString();

        // Check if this communication already exists (basic deduplication)
        const { data: existing } = await supabase
          .from('Communications')
          .select('Comm_ID')
          .eq('Inquiry_ID', inq.Inquiry_ID)
          .eq('Last_Contact_Date', isoDate)
          .eq('Last_Contact_By', 'Client')
          .single();

        if (!existing) {
          await supabase
            .from('Communications')
            .insert({
              user_id: user.id,
              Inquiry_ID: inq.Inquiry_ID,
              Last_Contact_Date: isoDate,
              Last_Contact_By: 'Client',
              Message: `[Email] ${subjectHeader || 'No Subject'}\n${snippet || ''}`,
              Proposal_Link: ''
            });
          syncedCount++;

          // Auto-trigger AI draft for this new client message (fire and forget)
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai-draft`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inquiryId: inq.Inquiry_ID }),
          }).catch((e) => console.error('AI draft auto-trigger failed:', e));
        }
      }
    }

    return NextResponse.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error('Gmail Sync API Error:', error);
    return NextResponse.json({ success: false, error: error?.message || String(error) || "Internal Server Error during sync" }, { status: 500 });
  }
}
