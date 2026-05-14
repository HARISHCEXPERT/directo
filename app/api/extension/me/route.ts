// GET /api/extension/me — returns product info + plan + stats
// Auth: Bearer directo_tok_... (extension token)

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromExtToken, getServiceSupabase } from '@/lib/ext-auth'

export async function GET(req: NextRequest) {
  const auth = await getUserFromExtToken(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supa = getServiceSupabase()

  const [{ data: products }, { data: profile }, { data: subs }] = await Promise.all([
    supa.from('products').select('*').eq('user_id', auth.userId)
      .order('created_at', { ascending: false }).limit(1),
    supa.from('profiles').select('plan').eq('id', auth.userId).single(),
    supa.from('submissions').select('id, status').limit(500),
  ])

  const product = products?.[0]
  if (!product) {
    return NextResponse.json({ error: 'No active product' }, { status: 404 })
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    url: product.url,
    description: product.description,
    category: product.category,
    twitter: product.twitter,
    plan: profile?.plan || 'free',
    submissionsCount: subs?.length || 0,
    approvedCount: subs?.filter((s: any) => s.status === 'approved').length || 0,
  })
}
