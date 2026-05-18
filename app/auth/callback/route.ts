import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')

  // Agar OAuth code nahi mila
  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=no_code`
    )
  }

  // Cookie store
  const cookieStore = await cookies()

  // Response object
  const response = NextResponse.redirect(
    `${requestUrl.origin}/dashboard`
  )

  // Supabase SSR client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // OAuth code exchange
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth exchange error:', error)

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=auth_failed`
    )
  }

  return response
}