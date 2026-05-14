import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// Verify payment after Razorpay checkout success.
// Frontend posts { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

  // 1. Verify HMAC signature
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  if (expected !== razorpay_signature) {
    await supabase.from('billing_payments').update({ status: 'failed' })
      .eq('razorpay_order_id', razorpay_order_id).eq('user_id', user.id)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // 2. Look up the order row we created
  const { data: order } = await supabase
    .from('billing_payments').select('*')
    .eq('razorpay_order_id', razorpay_order_id)
    .eq('user_id', user.id).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // 3. Mark paid
  await supabase.from('billing_payments').update({
    razorpay_payment_id, razorpay_signature,
    status: 'paid', paid_at: new Date().toISOString(),
  }).eq('id', order.id)

  // 4. Upgrade profile
  const renewsAt = order.cycle === 'lifetime'
    ? null
    : new Date(Date.now() + (order.cycle === 'yearly' ? 365 : 30) * 86400000).toISOString()

  await supabase.from('profiles').update({
    plan: order.plan,
    plan_cycle: order.cycle,
    plan_renews_at: renewsAt,
    plan_started_at: new Date().toISOString(),
  }).eq('id', user.id)

  return NextResponse.json({ success: true, plan: order.plan, cycle: order.cycle })
}
