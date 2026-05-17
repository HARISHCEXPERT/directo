// GET /api/extension/launch/status
// Returns the user's currently-active launch session + the active item details.
// Supports BOTH dashboard (cookie auth) AND extension (Bearer token).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromExtToken, getServiceSupabase } from '@/lib/ext-auth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Try extension token first
  let userId: string | null = null
  let supa: any
  const extAuth = await getUserFromExtToken(req)
  if (extAuth) {
    userId = extAuth.userId
    supa = getServiceSupabase()
  } else {
    const cookieClient = await createClient()
    const { data: { user } } = await cookieClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
    supa = cookieClient
  }

  // Most recent non-terminal session
  const { data: sessions } = await supa.from('launch_sessions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['running', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)

  const session = sessions?.[0]
  if (!session) {
    return NextResponse.json({ session: null, active: null })
  }

  // All items + directories
  const { data: items } = await supa.from('launch_queue_items')
    .select('*, directory:directory_id ( id, slug, name, url )')
    .eq('session_id', session.id)
    .order('position', { ascending: true })

  const active = (items || []).find((i: any) => i.status === 'active') || null

  return NextResponse.json({
    session,
    active: active && {
      itemId: active.id,
      position: active.position,
      directory: active.directory,
    },
    items: (items || []).map((i: any) => ({
      itemId: i.id,
      position: i.position,
      status: i.status,
      directory: i.directory,
    })),
  })
}
