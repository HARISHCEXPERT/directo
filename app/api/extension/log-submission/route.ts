// POST /api/extension/log-submission
// Extension reports a submission attempt back to Directo.

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromExtToken, getServiceSupabase } from '@/lib/ext-auth'

export async function POST(req: NextRequest) {
  const auth = await getUserFromExtToken(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { directorySlug, directoryUrl, status, verified, verificationMethod, successUrl } = await req.json()
  const supa = getServiceSupabase()

  // Find product
  const { data: prods } = await supa.from('products').select('id')
    .eq('user_id', auth.userId).order('created_at', { ascending: false }).limit(1)
  const product = prods?.[0]
  if (!product) return NextResponse.json({ error: 'No product' }, { status: 404 })

  // Find directory row by slug (or create a synthetic match by URL)
  const { data: dirs } = await supa.from('directories').select('id, url')
    .or(`slug.eq.${directorySlug},url.ilike.%${directorySlug}%`).limit(1)
  const directory = dirs?.[0]

  if (!directory) {
    // Just log it as a free-text submission — don't fail
    return NextResponse.json({ ok: true, note: 'directory_not_in_db' })
  }

  const isVerified = !!verified
  const verifyAt = isVerified ? new Date().toISOString() : null
  const finalStatus = status || (isVerified ? 'submitted' : 'visited')

  // Upsert submission
  const { data: existing } = await supa.from('submissions').select('id, verified, status')
    .eq('product_id', product.id).eq('directory_id', directory.id).single()

  if (existing) {
    // Don't downgrade a verified=true row to verified=false
    const keepVerified = existing.verified && !isVerified
    await supa.from('submissions').update({
      status: keepVerified ? existing.status : finalStatus,
      submitted_via: 'extension',
      submitted_at: new Date().toISOString(),
      verified: existing.verified || isVerified,
      verification_method: keepVerified ? undefined : (verificationMethod || 'none'),
      verified_at: existing.verified ? undefined : verifyAt,
      success_url: successUrl || undefined,
    }).eq('id', existing.id)
  } else {
    await supa.from('submissions').insert({
      product_id: product.id,
      directory_id: directory.id,
      status: finalStatus,
      submitted_via: 'extension',
      submitted_at: new Date().toISOString(),
      verified: isVerified,
      verification_method: verificationMethod || 'none',
      verified_at: verifyAt,
      success_url: successUrl || null,
    })
  }

  return NextResponse.json({ ok: true, verified: isVerified, status: finalStatus })
}
