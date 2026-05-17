// POST /api/extension/launch/start
// Create a new launch session with a list of directory slugs.
// Body: { directorySlugs: string[] }
// Returns: { sessionId, total, items: [{ slug, name, url, position }] }

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { directorySlugs } = (await req.json()) as { directorySlugs: string[] }
  if (!Array.isArray(directorySlugs) || directorySlugs.length === 0) {
    return NextResponse.json({ error: 'directorySlugs required' }, { status: 400 })
  }

  // Active product
  const { data: prods } = await supa.from('products').select('id, name')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
  const product = prods?.[0]
  if (!product) return NextResponse.json({ error: 'No active product' }, { status: 404 })

  // Resolve slugs → directory rows
  const { data: dirs } = await supa.from('directories')
    .select('id, slug, name, url')
    .in('slug', directorySlugs)
  if (!dirs || dirs.length === 0) {
    return NextResponse.json({ error: 'No matching directories' }, { status: 404 })
  }

  // Preserve user-supplied order
  const slugToDir = new Map(dirs.map(d => [d.slug, d]))
  const ordered = directorySlugs.map(s => slugToDir.get(s)).filter(Boolean) as any[]

  // Cancel any prior running/queued session for same product
  await supa.from('launch_sessions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', user.id).eq('product_id', product.id)
    .in('status', ['queued', 'running', 'paused'])

  // Create session
  const { data: session, error: sErr } = await supa.from('launch_sessions').insert({
    user_id: user.id,
    product_id: product.id,
    status: 'running',
    total: ordered.length,
    completed: 0,
  }).select().single()
  if (sErr || !session) return NextResponse.json({ error: sErr?.message || 'Session error' }, { status: 500 })

  // Insert items
  const items = ordered.map((d, i) => ({
    session_id: session.id,
    directory_id: d.id,
    position: i,
    status: i === 0 ? 'active' : 'pending',
    started_at: i === 0 ? new Date().toISOString() : null,
  }))
  await supa.from('launch_queue_items').insert(items)

  return NextResponse.json({
    sessionId: session.id,
    total: ordered.length,
    items: ordered.map((d, i) => ({ slug: d.slug, name: d.name, url: d.url, position: i })),
  })
}
