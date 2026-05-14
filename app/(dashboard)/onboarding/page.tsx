'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const categories = [
  'SaaS Tools', 'AI Tools', 'Developer Tools', 'Finance',
  'Marketing', 'Productivity', 'Design', 'Analytics', 'Other'
]

const platforms = [
  { id: 'producthunt', name: 'Product Hunt', icon: '🎯', desc: 'Best for launch day visibility' },
  { id: 'reddit', name: 'Reddit', icon: '🤖', desc: 'Great for community feedback' },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', desc: 'Build in public audience' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', desc: 'B2B and professional reach' },
  { id: 'indiehackers', name: 'IndieHackers', icon: '⚡', desc: 'Indie founder community' },
  { id: 'hackernews', name: 'Hacker News', icon: '🔶', desc: 'Tech audience reach' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '',
    url: '',
    description: '',
    category: '',
    twitter: '',
  })
  const router = useRouter()
  const supabase = createClient()

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Pehle existing product check karo
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', form.name)
        .single()

      if (!existing) {
        const { error: productError } = await supabase
          .from('products')
          .insert({
            user_id: user.id,
            name: form.name,
            url: form.url,
            description: form.description,
            category: form.category,
            twitter: form.twitter,
            launch_status: 'active',
          })
        if (productError) console.error('Product error:', productError)
      }

      // Profile update
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          onboarding_completed: true,
        })
      if (profileError) console.error('Profile error:', profileError)

      router.push('/dashboard')
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-white text-lg">Dicrecto</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step >= s ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-600'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-px transition ${step > s ? 'bg-violet-600' : 'bg-zinc-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-1">What are you launching?</h2>
            <p className="text-zinc-500 text-sm mb-6">Tell us about your product.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dicrecto"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Product URL *</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://yourproduct.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Short Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="One sentence that explains what your product does..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block">Twitter / X Handle</label>
                <input
                  type="text"
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                  placeholder="@yourhandle"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!form.name || !form.url || !form.category || !form.description}
              className="w-full mt-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition text-sm"
            >
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-1">Where do you want visibility?</h2>
            <p className="text-zinc-500 text-sm mb-6">Select platforms for your launch content.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`text-left p-4 rounded-xl border transition ${
                    selectedPlatforms.includes(p.id)
                      ? 'border-violet-500 bg-violet-600/10'
                      : 'border-zinc-800 bg-zinc-800/30 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{p.icon}</span>
                    {selectedPlatforms.includes(p.id) && (
                      <span className="text-violet-400 text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-white text-xs font-medium">{p.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-400 text-sm py-2.5 rounded-lg transition"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedPlatforms.length === 0}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition text-sm"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-white mb-2">Your launch workspace is ready!</h2>
            <p className="text-zinc-500 text-sm mb-6">
              We're setting up <span className="text-white font-medium">{form.name}</span> for distribution across{' '}
              <span className="text-violet-400 font-medium">{selectedPlatforms.length} platforms</span> and 90+ directories.
            </p>
            <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
              {[
                { label: 'Product', val: form.name },
                { label: 'URL', val: form.url },
                { label: 'Category', val: form.category },
                { label: 'Platforms', val: `${selectedPlatforms.length} selected` },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-xs">
                  <span className="text-zinc-500">{s.label}</span>
                  <span className="text-white font-medium">{s.val}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-400 text-sm py-2.5 rounded-lg transition"
              >
                ← Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
              >
                {loading ? 'Setting up...' : 'Launch Workspace →'}
              </button>
            </div>
          </div>
        )}

        {/* Step labels */}
        <div className="flex justify-between mt-4 px-1">
          {['Product Details', 'Platforms', 'Launch!'].map((label, i) => (
            <p key={label} className={`text-xs ${step === i + 1 ? 'text-violet-400' : 'text-zinc-600'}`}>
              {label}
            </p>
          ))}
        </div>

      </div>
    </div>
  )
}