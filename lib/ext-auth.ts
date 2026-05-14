// Server-side helper to authenticate extension requests via Bearer token.
// Usage in API routes:
//   const user = await getUserFromExtToken(req)
//   if (!user) return NextResponse.json({error:'Unauthorized'}, {status:401})

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Service-role client — bypasses RLS for token lookup.
// SERVICE_ROLE_KEY is required in env; never expose to client.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) throw new Error('Supabase service env missing')
  return createServiceClient(url, key, { auth: { persistSession: false } })
}

export async function getUserFromExtToken(req: NextRequest): Promise<{
  userId: string
  tokenId: string
} | null> {
  const auth = req.headers.get('authorization') || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) return null
  const token = m[1].trim()
  if (!token.startsWith('directo_tok_')) return null

  const supa = getServiceClient()
  const { data } = await supa
    .from('ext_tokens')
    .select('id, user_id, revoked_at')
    .eq('token', token)
    .single()

  if (!data || data.revoked_at) return null

  // Bump last_used_at (fire-and-forget)
  supa.from('ext_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return { userId: data.user_id, tokenId: data.id }
}

export function getServiceSupabase() {
  return getServiceClient()
}
