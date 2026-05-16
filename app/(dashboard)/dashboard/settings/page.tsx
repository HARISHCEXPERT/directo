'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('Profile')
  const [form, setForm] = useState({
    full_name: '',
    twitter: '',
    website: '',
  })
  const supabase = createClient()
  const [currentPlan, setCurrentPlan] = useState('free')

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

  const handleDeleteAccount = async () => {
    const confirm = window.confirm('Are you sure? This cannot be undone.')
    if (!confirm) return
    await supabase.auth.signOut()
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

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings ⚙️</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account and preferences.</p>
      </div>

      {/* Tabs */}
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

            {/* Avatar */}
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
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Your name"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-500 text-sm cursor-not-allowed"
                />
                <p className="text-zinc-600 text-xs mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Twitter / X</label>
                <input
                  type="text"
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  placeholder="@yourhandle"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition"
              >
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 text-sm">Sign out everywhere</p>
                <p className="text-zinc-600 text-xs mt-0.5">Sign out from all devices</p>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-xs border border-red-500/30 hover:border-red-500/60 text-red-400 px-4 py-2 rounded-lg transition"
              >
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
          <p className="text-white font-semibold capitalize">
            {currentPlan === 'free' ? 'Free Plan' : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) + ' Plan'}
          </p>
          <p className="text-zinc-400 text-xs mt-1">
            {currentPlan === 'free' && '1 product · 10 directory submissions'}
            {currentPlan === 'starter' && '1 launch · 50 directories · AI content'}
            {currentPlan === 'growth' && 'Unlimited products · 90+ directories · Backlink monitoring'}
          </p>
        </div>
        <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full">Current</span>
      </div>
      {currentPlan === 'free' && (
<div className="space-y-3">
  {[
    { name: 'Starter', price: '$29', desc: '1 launch · 50 directories · AI content', highlight: false },
    { name: 'Growth', price: '$49', desc: 'Unlimited products · 90+ directories · Backlink monitoring', highlight: true },
  ].map(plan => (
    <div key={plan.name} className={`flex items-center justify-between p-4 rounded-xl border ${plan.highlight ? 'border-violet-500/40 bg-violet-600/5' : 'border-zinc-800 bg-zinc-800/30'}`}>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold text-sm">{plan.name}</p>
          {plan.highlight && <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full">Popular</span>}
        </div>
        <p className="text-zinc-500 text-xs mt-0.5">{plan.desc}</p>
      </div>
      <div className="text-right">
        <p className="text-white font-bold">{plan.price}</p>
        <button className={`text-xs mt-1 px-4 py-1.5 rounded-lg transition ${plan.highlight ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'border border-zinc-700 hover:border-zinc-500 text-zinc-300'}`}>
          Upgrade
        </button>
      </div>
    </div>
  ))}
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
            <p className="text-zinc-500 text-xs mb-5">Available on Growth plan.</p>
            <div className="bg-zinc-900 border border-violet-500/20 rounded-xl p-5 text-center">
              <p className="text-3xl mb-3">🔒</p>
              <p className="text-zinc-300 text-sm font-medium mb-1">Upgrade to access API</p>
              <p className="text-zinc-600 text-xs mb-4">Get full API access and webhooks on Growth plan</p>
              <button className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition">
                Upgrade to Growth →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}