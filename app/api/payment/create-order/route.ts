import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(req: NextRequest) {
  const supa = await createClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()

  const prices: Record<string, number> = {
    pro: 99900,      // ₹999 in paise
    scale: 249900,   // ₹2499 in paise
    lifetime: 1499900 // ₹14999 in paise
  }

  if (!prices[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const order = await razorpay.orders.create({
    amount: prices[plan],
    currency: 'INR',
    receipt: `order_${user.id}_${plan}_${Date.now()}`,
    notes: { userId: user.id, plan },
  })

  return NextResponse.json({ orderId: order.id, amount: prices[plan], plan })
}