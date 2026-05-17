'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const dirs = ['Product Hunt', 'BetaList', 'IndieHackers', 'G2', 'Futurepedia', 'SaaSHub', 'Uneed', 'Capterra', 'AlternativeTo', 'Fazier']

function AutofillDemo() {
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  const fields = [
    { label: 'Product name', value: 'Dicrecto', color: '#667eea' },
    { label: 'Tagline', value: 'AI auto-fills 90+ directory forms', color: '#f093fb' },
    { label: 'Category', value: 'SaaS Tools', color: '#10b981' },
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < fields.length) {
        let i = 0
        const interval = setInterval(() => {
          setTyped(fields[step].value.slice(0, i + 1))
          i++
          if (i >= fields[step].value.length) {
            clearInterval(interval)
            setTimeout(() => {
              setStep(s => s + 1)
              setTyped('')
            }, 600)
          }
        }, 40)
        return () => clearInterval(interval)
      } else {
        setTimeout(() => { setStep(0); setTyped('') }, 1500)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [step])

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: 20, boxShadow: '0 30px 80px rgba(102,126,234,0.18)', border: '1px solid #f0f0f0', maxWidth: 340 }}>
      {/* Extension header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 12 }}>
        <div style={{ width: 24, height: 24, background: 'white', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#667eea' }}>D</div>
        <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Dicrecto · BetaList</span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>🤖 AI</span>
      </div>

      {/* Filling for */}
      <div style={{ background: '#f8f7ff', borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12 }}>
        <span style={{ color: '#999' }}>Filling for </span>
        <span style={{ color: '#667eea', fontWeight: 600 }}>Dicrecto</span>
        <span style={{ color: '#10b981', marginLeft: 8, fontSize: 11 }}>✓ connected</span>
      </div>

      {/* Fields being filled */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {fields.map((f, i) => (
          <div key={f.label}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{f.label}</div>
            <div style={{ background: i < step ? '#f8f7ff' : i === step ? 'white' : '#fafafa', border: `1.5px solid ${i < step ? f.color : i === step ? '#667eea' : '#eee'}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#333', minHeight: 36, display: 'flex', alignItems: 'center', transition: 'border-color 0.3s' }}>
              {i < step ? (
                <span style={{ color: f.color, fontWeight: 500 }}>{f.value}</span>
              ) : i === step ? (
                <span>{typed}<span style={{ borderRight: '2px solid #667eea', animation: 'blink 1s infinite' }}>&nbsp;</span></span>
              ) : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ height: 4, background: '#f0f0f0', borderRadius: 999, marginBottom: 12 }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #667eea, #f093fb)', borderRadius: 999, width: `${(step / fields.length) * 100}%`, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
        {step < fields.length ? `⚡ AI filling field ${step + 1} of ${fields.length}...` : '✅ All fields filled! Review & submit.'}
      </div>
    </div>
  )
}

function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const timer = setInterval(() => {
      start += Math.ceil(end / 40)
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(start)
    }, 30)
    return () => clearInterval(timer)
  }, [end])
  return <>{count}{suffix}</>
}

export default function LandingPage() {
  const [activeDir, setActiveDir] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActiveDir(a => (a + 1) % dirs.length), 1200)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fafaf8', minHeight: '100vh', color: '#1a1a1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .float { animation: float 3s ease-in-out infinite }
        .slide-up { animation: slideUp 0.4s ease forwards }
        .gradient-text { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .pill { display: inline-flex; align-items: center; gap: 6px; background: #f0edff; color: #6b46c1; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 500; }
        .card { background: white; border-radius: 20px; padding: 28px; border: 1px solid #f0f0f0; transition: transform 0.2s, box-shadow 0.2s; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
        .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.2s; display: inline-block; text-decoration: none; }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-2px); }
        .dir-tag { padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 500; border: 1.5px solid; transition: all 0.3s; }
      `}</style>

      {/* NAV */}
      <nav style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>D</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>Dicrecto</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: 10, color: '#666', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Sign in</Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>Get started free →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          <div className="pill" style={{ marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            Chrome Extension — Works on 90+ sites
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 50, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            Stop manually<br />
            submitting to<br />
            <span className="gradient-text">directories.</span>
          </h1>
          <p style={{ fontSize: 17, color: '#555', lineHeight: 1.75, marginBottom: 12 }}>
            Install Dicrecto's Chrome extension. Visit any directory. <strong style={{ color: '#1a1a1a' }}>AI fills every form field automatically.</strong>
          </p>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 32 }}>
            You just review, solve CAPTCHA, and click submit. That's it.
          </p>

          {/* Live directory ticker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '12px 16px', background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', width: 'fit-content' }}>
            <span style={{ fontSize: 13, color: '#999' }}>Now filling:</span>
            <span key={activeDir} className="slide-up" style={{ fontSize: 13, fontWeight: 600, color: '#667eea' }}>{dirs[activeDir]}</span>
            <span style={{ fontSize: 11, color: '#10b981', background: '#f0fdf4', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>⚡ Auto</span>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <Link href="/signup" className="btn-primary" style={{ padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700 }}>
              Start free — no card needed →
            </Link>
          </div>

          {/* Trust signals */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {['🔒 No data sold', '✅ Free forever plan', '🧩 Chrome extension'].map(t => (
              <span key={t} style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* AUTOFILL DEMO */}
        <div className="float" style={{ display: 'flex', justifyContent: 'center' }}>
          <AutofillDemo />
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { num: 90, suffix: '+', label: 'Directories supported' },
            { num: 2, suffix: ' min', label: 'Average setup time' },
            { num: 100, suffix: '%', label: 'Form fields filled by AI' },
            { num: 0, suffix: ' ₹', label: 'To get started' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color: 'white' }}>
                <CountUp end={s.num} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="pill" style={{ marginBottom: 16 }}>How it works</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800 }}>From signup to submitted — in minutes</h2>
          <p style={{ color: '#666', fontSize: 16, marginTop: 12, maxWidth: 500, margin: '12px auto 0' }}>No complex setup. No API keys. Just install and launch.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { num: '01', emoji: '📦', title: 'Add your product', desc: 'Name, URL, description — saved once, used everywhere.' },
            { num: '02', emoji: '🧩', title: 'Install extension', desc: 'One-click Chrome install. Connect with your token.' },
            { num: '03', emoji: '⚡', title: 'AI fills forms', desc: 'Visit any directory. Extension auto-fills every field.' },
            { num: '04', emoji: '📊', title: 'Track everything', desc: 'Approvals, backlinks, visibility — live dashboard.' },
          ].map(s => (
            <div key={s.num} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.emoji}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#667eea', marginBottom: 8, letterSpacing: '0.05em' }}>{s.num}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIRECTORIES GRID */}
      <section style={{ background: '#f5f5f3', padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="pill" style={{ marginBottom: 16 }}>Coverage</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Works on every major directory</h2>
          <p style={{ color: '#666', fontSize: 15, marginBottom: 32 }}>90+ sites and growing. Extension auto-detects submit forms.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {['Product Hunt', 'BetaList', 'IndieHackers', 'G2', 'Capterra', 'Futurepedia', 'SaaSHub', 'AlternativeTo', 'Uneed', 'Fazier', 'DevHunt', 'Peerlist', 'ToolPilot', 'OpenTools', 'StartupBase', '+ 75 more'].map((d, i) => (
              <span key={d} className="dir-tag" style={{
                borderColor: i === activeDir % 16 ? '#667eea' : '#e8e8e8',
                color: i === activeDir % 16 ? '#667eea' : '#555',
                background: i === activeDir % 16 ? '#f0edff' : 'white',
              }}>{d}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="pill" style={{ marginBottom: 16 }}>Features</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800 }}>Everything a founder needs to launch</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { emoji: '🤖', title: 'AI Form Autofill', desc: 'Claude AI reads every form field and fills it with product-specific, platform-aware content. Taglines, descriptions, categories — all handled.', tag: 'Core feature' },
            { emoji: '📁', title: '90+ Curated Directories', desc: 'Hand-picked directories sorted by domain rating, traffic, and approval rate. Know which ones are worth your time before you even visit.', tag: 'Database' },
            { emoji: '🚀', title: 'Launch Queue', desc: 'Queue up 50 directories at once. Extension opens each tab automatically, fills the form, and waits for you. Just review and submit.', tag: 'Automation' },
            { emoji: '📊', title: 'Submission Analytics', desc: 'Track every submission — submitted, approved, rejected, backlink live. See your launch score improve in real time.', tag: 'Dashboard' },
            { emoji: '✍️', title: 'AI Social Content', desc: 'Generate platform-specific launch posts for Product Hunt, Reddit, X, LinkedIn, and Hacker News — in 5 different tones.', tag: 'Content' },
            { emoji: '🔍', title: 'Approval Detection', desc: 'Extension passively detects when your listing goes live on any directory — even when you\'re not looking. Auto-updates your dashboard.', tag: 'Smart' },
          ].map(f => (
            <div key={f.title} className="card" style={{ display: 'flex', gap: 16 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{f.emoji}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{f.title}</h3>
                  <span style={{ fontSize: 10, color: '#667eea', background: '#f0edff', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>{f.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF — METRICS */}
      <section style={{ background: '#f5f5f3', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="pill" style={{ marginBottom: 16 }}>Real results</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, marginBottom: 48 }}>What happens after you launch</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
            {[
              { metric: '50+', label: 'Directories submitted', sub: 'in a single afternoon', color: '#667eea' },
              { metric: '3x', label: 'More backlinks', sub: 'vs manual submission', color: '#f093fb' },
              { metric: '20h', label: 'Saved per launch', sub: 'on average per founder', color: '#10b981' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 48, fontWeight: 800, color: s.color, marginBottom: 8 }}>{s.metric}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: '#999' }}>{s.sub}</div>
              </div>
            ))}
          </div>
          {/* Quotes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { text: 'Submitted my SaaS to 47 directories in one session. Got approved on 23 within a week.', attr: 'Indie founder, ProductHunt' },
              { text: 'The AI fill is genuinely magic. It even picks the right dropdown option for category.', attr: 'Solo developer, r/SideProject' },
            ].map((q, i) => (
              <div key={i} className="card" style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>"{q.text}"</p>
                <span style={{ fontSize: 12, color: '#999' }}>— {q.attr}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="pill" style={{ marginBottom: 16 }}>Pricing</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800 }}>Start free. Launch today.</h2>
          <p style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No credit card required to get started.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {[
            { name: 'Free', price: '₹0', period: 'forever', features: ['90+ directory tracker', '5 AI fills/month', 'Manual submission', 'Basic analytics'], cta: 'Start free', highlight: false, tag: '' },
            { name: 'Pro', price: '₹999', period: '/month', features: ['Everything in Free', '100 AI fills/month (Sonnet)', 'Extension autofill', 'Launch Queue', 'Analytics dashboard'], cta: 'Start Pro', highlight: true, tag: 'Most popular' },
            { name: 'Scale', price: '₹2499', period: '/month', features: ['Everything in Pro', '500 AI fills/month', 'Multi-product (5)', 'Priority support', 'White-glove launch call'], cta: 'Start Scale', highlight: false, tag: '' },
          ].map(plan => (
            <div key={plan.name} style={{
              background: plan.highlight ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
              borderRadius: 20,
              padding: 28,
              border: plan.highlight ? 'none' : '1px solid #f0f0f0',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              {plan.tag && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#f093fb', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  {plan.tag}
                </div>
              )}
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: plan.highlight ? 'white' : '#1a1a1a', marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: plan.highlight ? 'white' : '#1a1a1a', fontFamily: 'Syne, sans-serif' }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#999' }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: 24 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.9)' : '#555', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.8)' : '#667eea', flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12,
                background: plan.highlight ? 'white' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: plan.highlight ? '#667eea' : 'white',
                textDecoration: 'none', fontSize: 14, fontWeight: 700,
                transition: 'opacity 0.2s',
              }}>
                {plan.cta} →
              </Link>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#999' }}>
          🔒 Secure payments via Razorpay · Cancel anytime · No hidden fees
        </p>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(135deg, #667eea08, #f093fb08)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 44, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Your SaaS deserves to be{' '}
            <span className="gradient-text">found.</span>
          </h2>
          <p style={{ color: '#666', fontSize: 16, marginBottom: 32, lineHeight: 1.7 }}>
            Stop spending weekends copy-pasting into directory forms.<br />
            Let AI do the boring part.
          </p>
          <Link href="/signup" className="btn-primary" style={{ padding: '16px 40px', borderRadius: 16, fontSize: 16, fontWeight: 700 }}>
            Start free — takes 2 minutes →
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: '#999' }}>No credit card · Free plan available · Install in seconds</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #eee', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 11 }}>D</div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#1a1a1a' }}>Dicrecto</span>
            <span style={{ color: '#ccc', marginLeft: 8 }}>·</span>
            <span style={{ color: '#999', fontSize: 13 }}>© 2025</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ color: '#999', fontSize: 13, textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}