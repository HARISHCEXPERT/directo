import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (e) {
              console.error('Cookie set error:', e)
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      const response = NextResponse.redirect(`${origin}/dashboard`)
      
      // Manually set cookies on response
      const { access_token, refresh_token, expires_in } = data.session
      
      response.cookies.set('sb-access-token', access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: expires_in,
        path: '/',
      })
      response.cookies.set('sb-refresh-token', refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })
      
      return response
    }
    
    console.error('Exchange error:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}