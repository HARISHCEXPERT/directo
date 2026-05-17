// POST /api/extension/check-approval
// Extension reports it saw what looks like a live listing for the user's product.
// Backend confirms the directory exists, marks submission as 'approved'.

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromExtToken, getServiceSupabase } from '@/lib/ext-auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await getUserFromExtToken(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { directorySlug, directoryName, listingUrl, signals, confidence } = await req.json()
  const supa = getServiceSupabase()

  // Find product
  const { data: prods } = await supa.from('products').select('id, name')
    .eq('user_id', auth.userId).order('created_at', { ascending: false }).limit(1)
  const product = prods?.[0]
  if (!product) return NextResponse.json({ ok: false, error: 'no_product' }, { status: 404 })

  // Find directory in our DB
  let directory: any = null
  if (directorySlug) {
    const { data: dirs } = await supa.from('directories').select('id, slug, url')
      .or(`slug.eq.${directorySlug},url.ilike.%${directorySlug}%`).limit(1)
    directory = dirs?.[0]
  }
  if (!directory) {
    // unknown directory — still acknowledge but don't fail
    return NextResponse.json({ ok: true, newlyApproved: false, note: 'directory_not_in_db' })
  }

  // Find existing submission row
  const { data: existing } = await supa.from('submissions')
    .select('id, status, verified')
    .eq('product_id', product.id)
    .eq('directory_id', directory.id)
    .maybeSingle()

  const wasAlreadyApproved = existing?.status === 'approved'

  const update = {
    status: 'approved',
    verified: true,
    verification_method: 'extension_passive',
    verified_at: new Date().toISOString(),
    success_url: listingUrl,
    submitted_via: 'extension',
    notes: `Auto-detected · signals: ${(signals || []).join(', ')} · confidence: ${confidence || 'medium'}`,
  }

  if (existing) {
    await supa.from('submissions').update(update).eq('id', existing.id)
  } else {
    // No prior submission — create one as approved (user may have submitted before installing extension)
    await supa.from('submissions').insert({
      product_id: product.id,
      directory_id: directory.id,
      submitted_at: new Date().toISOString(),
      ...update,
    })
  }

  return NextResponse.json({
    ok: true,
    newlyApproved: !wasAlreadyApproved,
    directorySlug: directory.slug,
    listingUrl,
  })
}
