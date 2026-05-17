import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET() {
  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supa.from('profiles')
    .select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: directories } = await supa
    .from('directories')
    .select('slug, name, url')
    .order('domain_rating', { ascending: false })

  if (!directories) return NextResponse.json({ results: [] })

  // Check all URLs in parallel
  const results = await Promise.all(
    directories.map(async (dir) => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        
        const res = await fetch(dir.url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Directo URL Checker)',
          },
          redirect: 'follow',
        })
        
        clearTimeout(timeout)
        
        return {
          slug: dir.slug,
          name: dir.name,
          url: dir.url,
          status: res.status,
          ok: res.status < 400,
          finalUrl: res.url,
          redirected: res.redirected,
        }
      } catch (e: any) {
        return {
          slug: dir.slug,
          name: dir.name,
          url: dir.url,
          status: 0,
          ok: false,
          error: e.name === 'AbortError' ? 'Timeout' : e.message,
        }
      }
    })
  )

  return NextResponse.json({ results })
}