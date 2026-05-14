'use client'

import Link from 'next/link'
import { useState } from 'react'

const features = [
  {
    icon: '🤖',
    title: 'AI Launch Content',
    desc: 'Generate platform-aware copy for Product Hunt, Reddit, X, and LinkedIn in seconds.',
  },
  {
    icon: '📁',
    title: 'Directory Distribution',
    desc: 'Submit to 90+ startup directories from one dashboard. No copy-paste, no tabs.',
  },
  {
    icon: '🔗',
    title: 'Backlink Tracking',
    desc: 'Monitor live and dead links, dofollow status, and indexing — all in real time.',
  },
  {
    icon: '🚀',
    title: 'Launch Workspace',
    desc: 'Organize your entire launch process. No spreadsheets, no chaos.',
  },
]

const painPoints = [
  'Posting everywhere manually',
  'Rewriting the same content for each platform',
  'Tracking dozens of directories in spreadsheets',
  'Forgetting launch opportunities',
  'Wasting hours on repetitive promotion',
]

const steps = [
  { num: '01', title: 'Add your product', desc: 'Name, URL, description — done in 30 seconds.' },
  { num: '02', title: 'AI generates content', desc: 'Launch-ready copy for every platform, instantly.' },
  { num: '03', title: 'Distribute everywhere', desc: 'Submit to 90+ directories and communities.' },
  { num: '04', title: 'Track your visibility', desc: 'Backlinks, approvals, traffic — one dashboard.' },
]

const plans = [
  {
    name: 'Starter',
    price: '$29',
    desc: 'Perfect for your first launch',
    features: ['1 product launch', 'AI launch content', '50+ directory submissions', 'Basic backlink tracking'],
    cta: 'Start Launching',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$49',
    desc: 'For serious founders',
    features: ['3 product Launch', 'Launch workspace', 'Full backlink monitoring', '90+ directories', 'New directory alerts', 'Priority support'],
    cta: 'Get Growth',
    highlight: true,
  },
]

export default function LandingPage() {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* NAV */}
      <nav className="border-b border-zinc-900 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="font-semibold text-white">Dicrecto</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#how" className="hover:text-white transition">How it works</a>
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition">Sign in</Link>
          <Link href="/signup" className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition">
            Get started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
            AI-assisted launch infrastructure for founders
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Launch your SaaS<br />
            <span className="text-violet-400">everywhere</span> from one dashboard.
          </h1>

          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
            Generate launch content, submit to 90+ startup directories, and track your visibility — in minutes, not weeks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link href="/signup" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white font-medium px-8 py-3 rounded-lg transition text-sm">
              Start Launching →
            </Link>
            <a href="#how" className="w-full sm:w-auto border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-medium px-8 py-3 rounded-lg transition text-sm">
              See how it works
            </a>
          </div>

          {/* Dashboard preview */}
          <div className="relative mx-auto max-w-3xl">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700" />
                </div>
                <div className="flex-1 bg-zinc-800 rounded-md h-5 text-xs text-zinc-600 flex items-center px-3">
                  app.dicrecto.com/dashboard
                </div>
              </div>

              {/* Fake dashboard grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Submitted', val: '47', color: 'text-violet-400' },
                  { label: 'Approved', val: '23', color: 'text-green-400' },
                  { label: 'Pending', val: '19', color: 'text-yellow-400' },
                  { label: 'Backlinks', val: '18', color: 'text-blue-400' },
                ].map((s) => (
                  <div key={s.label} className="bg-zinc-800/60 rounded-xl p-3">
                    <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Fake directory list */}
              <div className="space-y-2">
                {[
                  { name: 'Product Hunt', status: 'Approved', color: 'text-green-400 bg-green-400/10' },
                  { name: 'BetaList', status: 'Pending', color: 'text-yellow-400 bg-yellow-400/10' },
                  { name: 'IndieHackers', status: 'Submitted', color: 'text-blue-400 bg-blue-400/10' },
                  { name: 'Launching Next', status: 'Approved', color: 'text-green-400 bg-green-400/10' },
                ].map((d) => (
                  <div key={d.name} className="flex items-center justify-between bg-zinc-800/40 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-zinc-700 rounded-md" />
                      <span className="text-sm text-zinc-300">{d.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.color}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Glow */}
            <div className="absolute -inset-1 bg-violet-600/10 rounded-2xl blur-xl -z-10" />
          </div>
        </div>
      </section>

      {/* PAIN SECTION */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-4">The problem</p>
            <h2 className="text-3xl font-bold mb-6">Launching a SaaS today means...</h2>
            <ul className="space-y-3">
              {painPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-zinc-400 text-sm">
                  <span className="text-red-500 mt-0.5">✗</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-zinc-500 text-sm mb-4">With Dicrecto</p>
            <ul className="space-y-3">
              {[
                'One dashboard for all platforms',
                'AI writes launch copy for you',
                'Auto-submit to 90+ directories',
                'Real-time backlink monitoring',
                'Never miss a launch opportunity',
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-zinc-300 text-sm">
                  <span className="text-violet-400 mt-0.5">✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <p className="text-zinc-400 text-sm italic">"Organized, accelerated distribution for modern founders."</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl font-bold">Launch in 4 steps</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-full w-full h-px bg-zinc-800 z-0" />
              )}
              <div className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-violet-500/50 transition">
                <span className="text-violet-500 font-mono text-sm font-bold">{s.num}</span>
                <h3 className="text-white font-semibold mt-2 mb-1">{s.title}</h3>
                <p className="text-zinc-500 text-xs">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl font-bold">Everything you need to launch</h2>
          <p className="text-zinc-500 mt-3 text-sm">Built specifically for SaaS founders. Not generic social tools.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-zinc-900 border border-zinc-800 hover:border-violet-500/30 rounded-xl p-6 transition">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-zinc-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NOT A SCHEDULER */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-violet-950/30 to-blue-950/30 border border-violet-500/20 rounded-2xl p-8 text-center">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3">Our positioning</p>
          <h2 className="text-2xl font-bold mb-4">Not another social scheduler.</h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm">
            Dicrecto is designed specifically for SaaS product launches — not generic content management.
            We help founders get discovered by the right audiences, in the right directories, at the right time.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl font-bold">Simple, founder-friendly pricing</h2>
          <p className="text-zinc-500 mt-3 text-sm">One-time launch fee. No hidden costs.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl p-6 border ${plan.highlight ? 'bg-violet-600/10 border-violet-500/50' : 'bg-zinc-900 border-zinc-800'}`}>
              {plan.highlight && (
                <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full font-medium mb-3 inline-block">Most popular</span>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-zinc-500 text-sm mt-1 mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-zinc-500 text-sm ml-1">one-time</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="text-violet-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`block text-center py-2.5 rounded-lg text-sm font-medium transition ${plan.highlight ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'border border-zinc-700 hover:border-zinc-500 text-white'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { stat: '90+', label: 'Directories covered' },
            { stat: '2 min', label: 'Average setup time' },
            { stat: '100%', label: 'Built for founders' },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-3xl font-bold text-violet-400">{s.stat}</p>
              <p className="text-zinc-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-violet-600/5 rounded-3xl" />
          <div className="relative border border-zinc-800 rounded-3xl p-12">
            <h2 className="text-4xl font-bold mb-4">
              Your SaaS deserves<br />
              <span className="text-violet-400">to be discovered.</span>
            </h2>
            <p className="text-zinc-400 mb-8 text-sm">Join founders already launching with Dicrecto.</p>
            <Link href="/signup" className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-medium px-10 py-3 rounded-lg transition">
              Start Launching Free →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 px-6 py-8 max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="text-zinc-500 text-sm">Dicrecto © 2025</span>
        </div>
        <div className="flex gap-6 text-xs text-zinc-600">
          <a href="#" className="hover:text-zinc-400 transition">Privacy</a>
          <a href="#" className="hover:text-zinc-400 transition">Terms</a>
          <Link href="/login" className="hover:text-zinc-400 transition">Login</Link>
        </div>
      </footer>

    </div>
  )
}