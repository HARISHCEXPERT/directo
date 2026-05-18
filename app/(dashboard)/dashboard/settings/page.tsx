'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('Profile')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [form, setForm] = useState({
    full_name: '',
    twitter: '',
    website: '',
  })
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      setForm({
        full_name: user.user_metadata?.full_name || '',
        twitter: user.user_metadata?.twitter || '',
        website: user.user_metadata?.website || '',
      })
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      if (profile?.plan) setCurrentPlan(profile.plan)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await supabase.auth.updateUser({
      data: {
        full_name: form.full_name,
        twitter: form.twitter,
        website: form.website,
      }
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleUpgrade = async (plan: string) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(script)

    script.onload = async () => {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { orderId, amount } = await res.json()

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency: 'INR',
        name: 'Dicrecto',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        order_id: orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
            }),
          })
          const data = await verifyRes.json()
          if (data.ok) {
            setCurrentPlan(plan)
            alert(`🎉 Successfully upgraded to ${plan} plan!`)
          }
        },
        prefill: { email: user?.email },
        theme: { color: '#667eea' },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    }
  }

  const tabs = ['Profile', 'Billing', 'Notifications', 'API Keys']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const firstName = form.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'F'

  const planLabel: Record<string, string> = {
    free: 'Free Plan',
    pro: 'Pro Plan',
    scale: 'Scale Plan',
    lifetime: 'Lifetime Plan',
  }

  const planDesc: Record<string, string> = {
    free: '5 AI fills/month · Manual submission',
    pro: '100 AI fills/month · Extension autofill · Analytics',
    scale: '500 AI fills/month · Multi-product · Priority support',
    lifetime: 'Pro features forever · Founding Member',
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings ⚙️</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account and preferences.</p>
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`text-sm px-4 py-2 rounded-lg transition ${activeTab === t ? 'bg-violet-600 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* PROFILE */}
      {activeTab === 'Profile' && (
        <div className="max-w-xl space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-5">Profile Information</h3>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
              <div className="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
                {firstName[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{form.full_name || 'Founder'}</p>
                <p className="text-zinc-500 text-xs">{user?.email}</p>
                <p className="text-zinc-600 text-xs mt-1">
                  Member since {new Date(user?.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Full Name</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your name" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Email</label>
                <input type="email" value={user?.email} disabled className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-500 text-sm cursor-not-allowed" />
                <p className="text-zinc-600 text-xs mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Twitter / X</label>
                <input type="text" value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="@yourhandle" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Website</label>
                <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yourwebsite.com" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm" />
              </div>
              <button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition">
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 text-sm">Sign out everywhere</p>
                <p className="text-zinc-600 text-xs mt-0.5">Sign out from all devices</p>
              </div>
              <button onClick={() => supabase.auth.signOut()} className="text-xs border border-red-500/30 hover:border-red-500/60 text-red-400 px-4 py-2 rounded-lg transition">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILLING */}
      {activeTab === 'Billing' && (
        <div className="max-w-xl space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-5">Current Plan</h3>
            <div className="flex items-center justify-between p-4 bg-violet-600/10 border border-violet-500/20 rounded-xl mb-5">
              <div>
                <p className="text-white font-semibold capitalize">{planLabel[currentPlan] || currentPlan}</p>
                <p className="text-zinc-400 text-xs mt-1">{planDesc[currentPlan]}</p>
              </div>
              <span className="text-xs bg-violet-600 text-white px-3 py-1 rounded-full">Current</span>
            </div>

            {currentPlan === 'free' && (
              <div className="space-y-3">
                {[
                  { name: 'pro', label: 'Pro', price: '₹999', period: '/month', desc: '100 AI fills · Extension autofill · Analytics', highlight: false },
                  { name: 'scale', label: 'Scale', price: '₹2499', period: '/month', desc: '500 AI fills · Multi-product · Priority support', highlight: true },
                  { name: 'lifetime', label: 'Lifetime', price: '₹14999', period: ' one-time', desc: 'Pro forever · Founding Member badge', highlight: false },
                ].map(plan => (
                  <div key={plan.name} className={`flex items-center justify-between p-4 rounded-xl border ${plan.highlight ? 'border-violet-500/40 bg-violet-600/5' : 'border-zinc-800 bg-zinc-800/30'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">{plan.label}</p>
                        {plan.highlight && <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full">Popular</span>}
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5">{plan.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{plan.price}<span className="text-zinc-500 text-xs">{plan.period}</span></p>
                      <button
                        onClick={() => handleUpgrade(plan.name)}
                        className={`text-xs mt-1 px-4 py-1.5 rounded-lg transition ${plan.highlight ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'border border-zinc-700 hover:border-zinc-500 text-zinc-300'}`}
                      >
                        Upgrade →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentPlan !== 'free' && (
              <div className="text-center py-4">
                <p className="text-zinc-400 text-sm">🎉 You're on the <span className="text-violet-400 font-semibold capitalize">{currentPlan}</span> plan!</p>
                <p className="text-zinc-600 text-xs mt-1">Enjoy unlimited access to all features.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {activeTab === 'Notifications' && (
        <div className="max-w-xl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-5">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { label: 'Submission approved', desc: 'When a directory approves your listing', on: true },
                { label: 'New backlink detected', desc: 'When a new backlink goes live', on: true },
                { label: 'Dead link alert', desc: 'When a backlink goes down', on: true },
                { label: 'Weekly launch report', desc: 'Weekly summary of your launch stats', on: false },
                { label: 'New directory added', desc: 'When new directories are added', on: false },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                  <div>
                    <p className="text-zinc-200 text-sm">{n.label}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{n.desc}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full cursor-pointer relative ${n.on ? 'bg-violet-600' : 'bg-zinc-700'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${n.on ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API KEYS */}
      {activeTab === 'API Keys' && (
        <div className="max-w-xl space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-2">API Keys</h3>
            {currentPlan === 'free' ? (
              <>
                <p className="text-zinc-500 text-xs mb-5">Available on Pro plan and above.</p>
                <div className="bg-zinc-900 border border-violet-500/20 rounded-xl p-5 text-center">
                  <p className="text-3xl mb-3">🔒</p>
                  <p className="text-zinc-300 text-sm font-medium mb-1">Upgrade to access API</p>
                  <p className="text-zinc-600 text-xs mb-4">Get full API access and webhooks on Pro plan</p>
                  <button onClick={() => { setActiveTab('Billing') }} className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition">
                    Upgrade to Pro →
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-zinc-500 text-xs mb-5">Your {currentPlan} plan includes API access.</p>
                <div className="bg-zinc-800/40 rounded-lg p-4 text-center">
                  <p className="text-xs text-zinc-400 font-medium mb-2">🚀 Coming soon</p>
                  <p className="text-zinc-500 text-xs">API keys will be available here shortly. You'll be notified!</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}