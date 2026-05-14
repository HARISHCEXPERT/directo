'use client'

import { useState, useEffect } from 'react'
import { PLANS, Cycle, PlanId } from '@/lib/billing/plans'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window { Razorpay: any }
}

export default function PricingPage() {
  const [cycle, setCycle] = useState<Cycle>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('free')
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Load Razorpay checkout script
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)

    // Fetch user + plan
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: p } = await supabase.from('profiles')
          .select('plan').eq('id', user.id).single()
        setCurrentPlan(p?.plan || 'free')
      }
    })()
  }, [])

  const handleCheckout = async (plan: PlanId) => {
    if (plan === 'free') return
    if (!user) { window.location.href = '/login?next=/pricing'; return }

    setErr(null); setSuccess(null); setLoadingPlan(plan)

    // Decide cycle for this plan
    const planCycle: Cycle = plan === 'lifetime' ? 'lifetime' : cycle

    try {
      const res = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, cycle: planCycle }),
      })
      const order = await res.json()
      if (!res.ok) throw new Error(order.error || 'Order failed')

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Dicrecto',
        description: `${plan.toUpperCase()} · ${planCycle}`,
        order_id: order.orderId,
        handler: async (response: any) => {
          const v = await fetch('/api/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const j = await v.json()
          if (j.success) {
            setSuccess(`✅ Upgraded to ${j.plan.toUpperCase()}! Refreshing...`)
            setTimeout(() => window.location.href = '/dashboard', 1500)
          } else {
            setErr(j.error || 'Verification failed')
          }
        },
        prefill: { email: user.email },
        theme: { color: '#7c3aed' },
      })
      rzp.open()
      setLoadingPlan(null)
    } catch (e: any) {
      setErr(e.message || 'Checkout failed'); setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Simple, fair pricing 💸</h1>
          <p className="text-zinc-400">Free forever for tracking. Pay for AI &amp; automation when you need it.</p>
        </div>

        {/* Cycle toggle */}
        <div className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit mx-auto mb-10">
          {(['monthly', 'yearly'] as Cycle[]).map(c => (
            <button key={c} onClick={() => setCycle(c)}
              className={`text-sm px-5 py-2 rounded-md transition font-medium ${cycle === c ? 'bg-violet-600 text-white' : 'text-zinc-400'}`}>
              {c === 'monthly' ? 'Monthly' : 'Yearly · 17% off'}
            </button>
          ))}
        </div>

        {err && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg p-4 mb-6 text-center">{err}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg p-4 mb-6 text-center">{success}</div>}

        <div className="grid grid-cols-4 gap-5">
          {PLANS.map(plan => {
            const planCycle: Cycle = plan.id === 'lifetime' ? 'lifetime' : cycle
            const price = plan.id === 'lifetime' ? plan.lifetime : cycle === 'monthly' ? plan.monthly : plan.yearly
            const isCurrent = currentPlan === plan.id
            return (
              <div key={plan.id} className={`relative bg-zinc-900 border rounded-2xl p-6 flex flex-col ${plan.popular ? 'border-violet-500/50 ring-1 ring-violet-500/30' : plan.founding ? 'border-amber-500/40' : 'border-zinc-800'}`}>
                {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs px-3 py-1 rounded-full font-medium">⭐ Most Popular</span>}
                {plan.founding && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 text-xs px-3 py-1 rounded-full font-bold">🔥 First 100 only</span>}

                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-zinc-500 text-xs mb-4">{plan.aiQuotaMonthly} AI gens · {plan.model}</p>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">₹{price?.toLocaleString() || '0'}</span>
                    <span className="text-zinc-500 text-sm">
                      {plan.id === 'lifetime' ? ' once' : cycle === 'monthly' ? '/mo' : '/yr'}
                    </span>
                  </div>
                  {cycle === 'yearly' && plan.monthly && plan.yearly && plan.id !== 'lifetime' && (
                    <p className="text-xs text-green-400 mt-1">Save ₹{(plan.monthly * 12 - plan.yearly).toLocaleString()}/yr</p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="text-xs text-zinc-300 flex gap-2">
                      <span className="text-violet-400">✓</span> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isCurrent || loadingPlan === plan.id || plan.id === 'free'}
                  className={`w-full text-sm font-medium py-2.5 rounded-lg transition ${
                    isCurrent ? 'bg-zinc-800 text-zinc-500 cursor-default' :
                    plan.popular ? 'bg-violet-600 hover:bg-violet-500 text-white' :
                    plan.founding ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950' :
                    plan.id === 'free' ? 'bg-zinc-800 text-zinc-500 cursor-default' :
                    'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {isCurrent ? '✓ Current plan' :
                   loadingPlan === plan.id ? 'Opening checkout...' :
                   plan.id === 'free' ? 'Free forever' :
                   plan.id === 'lifetime' ? 'Claim lifetime →' :
                   'Upgrade →'}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-10">
          Secured by Razorpay · UPI, Cards, Netbanking accepted · GST invoices available
        </p>
      </div>
    </div>
  )
}
