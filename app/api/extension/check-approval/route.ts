import { NextRequest, NextResponse } from 'next/server'
import { getUserFromExtToken, getServiceSupabase } from '@/lib/ext-auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await getUserFromExtToken(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { directorySlug, directoryName, listingUrl, signals, confidence } = await req.json()

  const supa = getServiceSupabase()

  // Get user's product
  const { data: products } = await supa
    .from('products')
    .select('id')
    .eq('user_id', auth.userId)
    .limit(1)

  const product = products?.[0]
  if (!product) return NextResponse.json({ ok: false })

  // Get directory
  const { data: dirs } = await supa
    .from('directories')
    .select('id')
    .ilike('name', `%${directoryName}%`)
    .limit(1)

  const dir = dirs?.[0]
  if (!dir) return NextResponse.json({ ok: false })

  // Check existing submission
  const { data: existing } = await supa
    .from('submissions')
    .select('id, status')
    .eq('product_id', product.id)
    .eq('directory_id', dir.id)
    .single()

  // Already approved — skip
  if (existing?.status === 'approved') {
    return NextResponse.json({ ok: true, newlyApproved: false })
  }

  // Update or insert as approved
  if (existing) {
    await supa.from('submissions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        backlink_url: listingUrl,
      })
      .eq('id', existing.id)
  } else {
    await supa.from('submissions').insert({
      product_id: product.id,
      directory_id: dir.id,
      status: 'approved',
      submitted_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      backlink_url: listingUrl,
    })
  }

  return NextResponse.json({ ok: true, newlyApproved: true })
}