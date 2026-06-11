import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute = request.nextUrl.pathname.startsWith('/login') || 
                        request.nextUrl.pathname.startsWith('/signup') ||
                        request.nextUrl.pathname.startsWith('/proposal') || 
                        request.nextUrl.pathname.startsWith('/invoice') || 
                        request.nextUrl.pathname.startsWith('/contract') ||
                        request.nextUrl.pathname.startsWith('/sign') ||
                        request.nextUrl.pathname.startsWith('/booking') ||
                        request.nextUrl.pathname.startsWith('/book') ||
                        request.nextUrl.pathname.startsWith('/portrait') ||
                        request.nextUrl.pathname.startsWith('/embed') ||
                        request.nextUrl.pathname.startsWith('/api/public-forms') ||
                        request.nextUrl.pathname.startsWith('/auth') ||
                        request.nextUrl.pathname === '/';

  // If there's no user and trying to access a protected route
  if (!user && !isPublicRoute && !request.nextUrl.pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If there's a user and trying to access login/signup
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
