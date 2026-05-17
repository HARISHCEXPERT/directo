// POST /api/extension/launch/advance
// Body: { sessionId, itemId, action: 'submitted'|'skipped'|'failed'|'pause'|'resume'|'cancel', reason? }
// Marks the current item, picks the next, returns it.
// Supports BOTH extension (Bearer) AND dashboard (cookie) callers.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserFromExtToken, getServiceSupabase } from '@/lib/ext-auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
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

  const { sessionId, itemId, action, reason } = await req.json()

  // Verify session ownership
  const { data: session } = await supa.from('launch_sessions')
    .select('*').eq('id', sessionId).eq('user_id', userId).single()
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  if (action === 'cancel') {
    await supa.from('launch_sessions').update({
      status: 'cancelled', updated_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    }).eq('id', sessionId)
    return NextResponse.json({ ok: true, session: { ...session, status: 'cancelled' } })
  }

  if (action === 'pause') {
    await supa.from('launch_sessions').update({
      status: 'paused',
      pause_reason: reason || 'user',
      pause_directory_slug: null,
      updated_at: new Date().toISOString(),
    }).eq('id', sessionId)
    return NextResponse.json({ ok: true, paused: true })
  }

  if (action === 'resume') {
    await supa.from('launch_sessions').update({
      status: 'running',
      pause_reason: null,
      pause_directory_slug: null,
      updated_at: new Date().toISOString(),
    }).eq('id', sessionId)
    return NextResponse.json({ ok: true, resumed: true })
  }

  // submitted / skipped / failed → mark current, pick next
  if (itemId && ['submitted', 'skipped', 'failed'].includes(action)) {
    await supa.from('launch_queue_items').update({
      status: action,
      finished_at: new Date().toISOString(),
      fail_reason: action === 'failed' ? (reason || null) : null,
    }).eq('id', itemId).eq('session_id', sessionId)

    await supa.from('launch_sessions').update({
      completed: session.completed + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', sessionId)
  }

  // Pick the next pending item
  const { data: next } = await supa.from('launch_queue_items')
    .select('*, directory:directory_id ( id, slug, name, url )')
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .order('position', { ascending: true })
    .limit(1)

  if (!next || next.length === 0) {
    // All done
    await supa.from('launch_sessions').update({
      status: 'done',
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', sessionId)
    return NextResponse.json({ ok: true, done: true })
  }

  const nextItem = next[0]
  await supa.from('launch_queue_items').update({
    status: 'active',
    started_at: new Date().toISOString(),
  }).eq('id', nextItem.id)

  return NextResponse.json({
    ok: true,
    done: false,
    next: {
      itemId: nextItem.id,
      position: nextItem.position,
      directory: nextItem.directory,
    },
  })
}
