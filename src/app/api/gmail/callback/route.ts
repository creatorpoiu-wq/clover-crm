import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=NoCode', req.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  const { data: config } = await supabase
    .from('AppConfig')
    .select('Google_Client_ID, Google_Client_Secret')
    .eq('user_id', user.id)
    .single();
  
  if (!config || !config.Google_Client_ID || !config.Google_Client_Secret) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=NoConfig', req.url));
  }

  const REDIRECT_URI = `${url.protocol}//${url.host}/api/gmail/callback`;

  const oAuth2Client = new google.auth.OAuth2(
    config.Google_Client_ID,
    config.Google_Client_Secret,
    REDIRECT_URI
  );

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      const { error } = await supabase
        .from('AppConfig')
        .update({ Google_Refresh_Token: tokens.refresh_token })
        .eq('user_id', user.id);

      if (error) throw error;
    }
    
    return NextResponse.redirect(new URL('/dashboard/settings?success=connected', req.url));
  } catch (error) {
    console.error("Error retrieving token", error);
    return NextResponse.redirect(new URL('/dashboard/settings?error=TokenError', req.url));
  }
}
