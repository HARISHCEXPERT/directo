import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { priceFor, PlanId, Cycle } from '@/lib/billing/plans'

// Razorpay SDK uses Node-only APIs (crypto, http) — force Node runtime
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, cycle } = (await req.json()) as { plan: PlanId; cycle: Cycle }
  const amount = priceFor(plan, cycle)
  if (!amount) return NextResponse.json({ error: 'Invalid plan/cycle' }, { status: 400 })

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 })
  }

  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
  const order = await rzp.orders.create({
    amount: amount * 100, // paise
    currency: 'INR',
    notes: { userId: user.id, plan, cycle },
  })

  await supabase.from('billing_payments').insert({
    user_id: user.id,
    razorpay_order_id: order.id,
    plan, cycle,
    amount_inr: amount,
    status: 'created',
  })

  return NextResponse.json({
    orderId: order.id,
    amount: amount * 100,
    currency: 'INR',
    keyId,
  })
}
