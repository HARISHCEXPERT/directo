// Token CRUD for the extension pairing UI in /dashboard/extension
// Uses the user's Supabase session (cookie-auth), NOT the ext token.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

function makeToken() {
  return 'directo_tok_' + crypto.randomBytes(24).toString('hex')
}

// GET — list tokens
export async function GET() {
  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supa.from('ext_tokens')
    .select('id, label, token, created_at, last_used_at, revoked_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ tokens: data || [] })
}

// POST — create a token
export async function POST(req: NextRequest) {
  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { label } = await req.json().catch(() => ({}))
  const token = makeToken()
  const { data, error } = await supa.from('ext_tokens').insert({
    user_id: user.id,
    token,
    label: label || 'Browser extension',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ token: data })
}

// DELETE — revoke a token
export async function DELETE(req: NextRequest) {
  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await supa.from('ext_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
