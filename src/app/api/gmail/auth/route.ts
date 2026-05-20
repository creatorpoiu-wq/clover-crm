import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const { data: config } = await supabase
    .from('AppConfig')
    .select('Google_Client_ID, Google_Client_Secret')
    .eq('user_id', user.id)
    .single();
  
  if (!config || !config.Google_Client_ID || !config.Google_Client_Secret) {
    return NextResponse.json({ error: "Missing Google Client ID or Secret in settings." }, { status: 400 });
  }

  const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  const url = new URL(req.url);
  const REDIRECT_URI = `${url.protocol}//${url.host}/api/gmail/callback`;

  const oAuth2Client = new google.auth.OAuth2(
    config.Google_Client_ID,
    config.Google_Client_Secret,
    REDIRECT_URI
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', 
    scope: SCOPES,
  });

  return NextResponse.redirect(authUrl);
}
