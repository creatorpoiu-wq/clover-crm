import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Handle Custom Domains
  // If the host is not localhost and not our vercel app domain
  if (
    hostname !== 'localhost:3000' && 
    !hostname.includes('vercel.app') && 
    !hostname.includes('localhost')
  ) {
    // If they hit the root of the custom domain, redirect to their configured business Website
    if (url.pathname === '/') {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const res = await fetch(`${supabaseUrl}/rest/v1/AppConfig?Custom_Domain=eq.${hostname}&select=Website`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0 && data[0].Website) {
              let targetUrl = data[0].Website;
              if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;
              return NextResponse.redirect(targetUrl);
            }
          }
        }
      } catch (e) {
        console.error('Middleware Custom Domain Error:', e);
      }
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
