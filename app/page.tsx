'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

// ---- LIVE DEMO COMPONENT ----
function LiveDemo() {
  const [phase, setPhase] = useState<'idle'|'scanning'|'filling'|'done'>('idle')
  const [cursorX, setCursorX] = useState(60)
  const [cursorY, setCursorY] = useState(60)
  const [fields, setFields] = useState([
    { label: 'Product name', value: '', target: 'Dicrecto', filled: false },
    { label: 'Tagline', value: '', target: 'AI fills 90+ directory forms', filled: false },
    { label: 'Category', value: '', target: 'SaaS Tools', filled: false },
    { label: 'Website URL', value: '', target: 'https://dicrecto.app', filled: false },
  ])
  const [activeField, setActiveField] = useState(-1)
  const [showOverlay, setShowOverlay] = useState(false)

  const runDemo = () => {
    if (phase !== 'idle' && phase !== 'done') return
    setPhase('scanning')
    setFields(f => f.map(x => ({ ...x, value: '', filled: false })))
    setActiveField(-1)
    setShowOverlay(false)

    // Show overlay after 600ms
    setTimeout(() => setShowOverlay(true), 600)

    // Start filling fields
    setTimeout(() => {
      setPhase('filling')
      fillField(0)
    }, 1400)
  }

  const fillField = (idx: number) => {
    if (idx >= 4) {
      setPhase('done')
      setActiveField(-1)
      return
    }
    setActiveField(idx)
    // Animate cursor to field position
    const yPositions = [120, 180, 240, 300]
    setCursorX(80)
    setCursorY(yPositions[idx])

    setTimeout(() => {
      const target = ['Dicrecto', 'AI fills 90+ directory forms', 'SaaS Tools', 'https://dicrecto.app'][idx]
      let i = 0
      const interval = setInterval(() => {
        setFields(prev => prev.map((f, fi) =>
          fi === idx ? { ...f, value: target.slice(0, i + 1) } : f
        ))
        i++
        if (i >= target.length) {
          clearInterval(interval)
          setFields(prev => prev.map((f, fi) =>
            fi === idx ? { ...f, filled: true } : f
          ))
          setTimeout(() => fillField(idx + 1), 300)
        }
      }, 35)
    }, 400)
  }

  return (
    <div style={{ position: 'relative', maxWidth: 380 }}>
      {/* Browser mockup */}
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 40px 100px rgba(102,126,234,0.2)', border: '1px solid #eee', overflow: 'hidden' }}>
        {/* Browser bar */}
        <div style={{ background: '#f5f5f5', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ flex: 1, background: 'white', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#999', border: '1px solid #eee' }}>
            betalist.com/submit
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: 24, position: 'relative' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Submit your startup</div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>Tell us about your product</div>

          {fields.map((f, i) => (
            <div key={f.label} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#666', marginBottom: 5, fontWeight: 500 }}>{f.label}</div>
              <div style={{
                border: `1.5px solid ${i === activeField ? '#667eea' : f.filled ? '#10b981' : '#e8e8e8'}`,
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 13,
                color: f.filled ? '#1a1a1a' : '#667eea',
                minHeight: 38,
                background: f.filled ? '#f8fff8' : i === activeField ? '#f8f7ff' : 'white',
                transition: 'border-color 0.2s, background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                {f.filled && <span style={{ color: '#10b981', fontSize: 11 }}>✓</span>}
                {f.value}
                {i === activeField && f.value.length < (f.target?.length || 0) && (
                  <span style={{ borderRight: '2px solid #667eea', height: 14, animation: 'blink 0.8s infinite' }} />
                )}
              </div>
            </div>
          ))}

          {/* Cursor */}
          {phase !== 'idle' && phase !== 'done' && (
            <div style={{
              position: 'absolute',
              left: cursorX,
              top: cursorY,
              width: 16,
              height: 16,
              pointerEvents: 'none',
              transition: 'top 0.4s cubic-bezier(0.4,0,0.2,1), left 0.4s',
              zIndex: 10,
            }}>
              <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                <path d="M0 0L0 16L4 12L7 19L9 18L6 11L11 11L0 0Z" fill="#667eea" stroke="white" strokeWidth="1"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Extension overlay */}
      {showOverlay && (
        <div style={{
          position: 'absolute',
          bottom: -16,
          right: -16,
          background: 'white',
          borderRadius: 16,
          padding: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          border: '1px solid #eee',
          width: 200,
          animation: 'slideUp 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ width: 20, height: 20, background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 10 }}>D</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>Dicrecto</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#10b981' }}>● Live</span>
          </div>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
            {phase === 'filling' ? `⚡ AI filling fields...` : phase === 'done' ? '✅ All done! Hit submit.' : '🔍 Scanning form...'}
          </div>
          <div style={{ height: 3, background: '#f0f0f0', borderRadius: 999 }}>
            <div style={{
              height: 3,
              background: 'linear-gradient(90deg, #667eea, #f093fb)',
              borderRadius: 999,
              width: phase === 'done' ? '100%' : `${(fields.filter(f => f.filled).length / 4) * 100}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* CTA button */}
      <button onClick={runDemo} style={{
        position: 'absolute',
        top: -16,
        left: '50%',
        transform: 'translateX(-50%)',
        background: phase === 'idle' || phase === 'done' ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
        color: phase === 'idle' || phase === 'done' ? 'white' : '#999',
        border: 'none',
        borderRadius: 999,
        padding: '8px 20px',
        fontSize: 13,
        fontWeight: 600,
        cursor: phase === 'idle' || phase === 'done' ? 'pointer' : 'default',
        boxShadow: '0 4px 20px rgba(102,126,234,0.3)',
        whiteSpace: 'nowrap',
        zIndex: 20,
      }}>
        {phase === 'idle' ? '▶ Watch AI fill this form' : phase === 'done' ? '↻ Replay demo' : '⚡ Filling...'}
      </button>
    </div>
  )
}

// ---- TICKER ----
const dirs = ['Product Hunt','BetaList','IndieHackers','G2','Futurepedia','SaaSHub','Uneed','Capterra','Fazier','DevHunt','Peerlist','AlternativeTo']

export default function LandingPage() {
  const [tickerIdx, setTickerIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % dirs.length), 1400)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fafaf8', color: '#1a1a1a', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700;9..40,800&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes ticker { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        .pill { display:inline-flex;align-items:center;gap:6px;background:#f0edff;color:#6b46c1;padding:5px 13px;border-radius:999px;font-size:13px;font-weight:500; }
        .card { background:white;border-radius:18px;padding:24px;border:1px solid #f0f0f0;transition:transform 0.2s,box-shadow 0.2s; }
        .card:hover { transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,0.08); }
        .gtext { background:linear-gradient(135deg,#667eea,#f093fb);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
        .btn { background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;cursor:pointer;transition:transform 0.15s,opacity 0.15s;display:inline-block;text-decoration:none;font-weight:700; }
        .btn:hover { transform:translateY(-2px);opacity:0.9; }
        .ticker-item { animation: ticker 0.35s ease; }
      `}</style>

      {/* NAV */}
      <nav style={{ maxWidth: 1100, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>D</div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17 }}>Dicrecto</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="#pricing" style={{ padding: '7px 14px', color: '#666', textDecoration: 'none', fontSize: 14 }}>Pricing</a>
          <Link href="/login" style={{ padding: '7px 14px', color: '#666', textDecoration: 'none', fontSize: 14 }}>Sign in</Link>
          <Link href="/signup" className="btn" style={{ padding: '9px 18px', borderRadius: 11, fontSize: 14 }}>Get started free →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px 80px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div className="pill" style={{ marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
            Chrome Extension — Free to install
          </div>
          
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 54, fontWeight: 800, lineHeight: 1.08, marginBottom: 22, letterSpacing: '-0.02em' }}>
            Launch everywhere<br />
            before <span className="gtext">lunch.</span>
          </h1>

          <p style={{ fontSize: 17, color: '#555', lineHeight: 1.72, marginBottom: 10, fontWeight: 400 }}>
            Dicrecto's AI extension auto-fills every directory submission form.
          </p>
          <p style={{ fontSize: 17, color: '#333', lineHeight: 1.72, marginBottom: 32, fontWeight: 500 }}>
            90+ directories. Zero copy-paste. One afternoon.
          </p>

          {/* Live ticker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '10px 16px', background: 'white', borderRadius: 12, border: '1px solid #eee', width: 'fit-content' }}>
            <span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>Now submitting to</span>
            <span key={tickerIdx} className="ticker-item" style={{ fontSize: 13, fontWeight: 700, color: '#667eea' }}>{dirs[tickerIdx]}</span>
            <span style={{ fontSize: 11, background: '#f0fdf4', color: '#10b981', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>AI ⚡</span>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
            <Link href="/signup" className="btn" style={{ padding: '14px 28px', borderRadius: 14, fontSize: 15 }}>
              Start free — no card →
            </Link>
            <a href="#demo" style={{ padding: '14px 22px', borderRadius: 14, border: '1.5px solid #e8e8e8', color: '#333', textDecoration: 'none', fontSize: 15, fontWeight: 600, background: 'white' }}>
              Watch demo ↓
            </a>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            {['🔒 No data sold ever', '✅ Free plan forever', '⚡ Works in 2 minutes'].map(t => (
              <span key={t} style={{ fontSize: 12, color: '#999' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* LIVE DEMO */}
        <div id="demo" style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
          <LiveDemo />
        </div>
      </section>

      {/* BOLD STATEMENT */}
      <section style={{ background: '#1a1a1a', padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: 28, fontWeight: 400, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, fontStyle: 'italic' }}>
            "Founders spend{' '}
            <span style={{ color: 'white', fontWeight: 700, fontStyle: 'normal' }}>40+ hours</span>
            {' '}manually submitting to directories on launch week.
            <br />
            <span style={{ color: '#f093fb', fontWeight: 600, fontStyle: 'normal' }}>That's a full work week. Gone.</span>"
          </p>
          <p style={{ marginTop: 20, fontSize: 15, color: 'rgba(255,255,255,0.3)' }}>Dicrecto gives it back.</p>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {[
            { val: '90+', label: 'Directories' },
            { val: '2 min', label: 'To set up' },
            { val: '100%', label: 'AI filled' },
            { val: '₹0', label: 'To start' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 34, fontWeight: 800, color: 'white' }}>{s.val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="pill" style={{ marginBottom: 14 }}>How it works</div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Simple. Fast. Automatic.</h2>
          <p style={{ color: '#777', fontSize: 16, maxWidth: 440, margin: '0 auto' }}>No complex setup. No API keys. No learning curve.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {[
            { n: '1', emoji: '📦', title: 'Add product', desc: 'Name, URL, description — saved once.' },
            { n: '2', emoji: '🧩', title: 'Install extension', desc: 'Chrome extension, one click.' },
            { n: '3', emoji: '⚡', title: 'AI fills forms', desc: 'Visit any directory. AI does the rest.' },
            { n: '4', emoji: '📊', title: 'Track results', desc: 'Approvals, backlinks, live.' },
          ].map(s => (
            <div key={s.n} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{s.emoji}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#667eea', letterSpacing: '0.06em', marginBottom: 8 }}>STEP {s.n}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#1a1a1a' }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIRECTORIES */}
      <section style={{ background: '#f5f5f3', padding: '60px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Works on every major directory</h2>
          <p style={{ color: '#777', fontSize: 15, marginBottom: 32 }}>Extension auto-detects submit forms. No configuration needed.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {['Product Hunt','BetaList','IndieHackers','G2','Capterra','Futurepedia','SaaSHub','AlternativeTo','Uneed','Fazier','DevHunt','Peerlist','ToolPilot','OpenTools','StartupBase','Toolify','AllThingsAI','FutureTools','+ 72 more'].map((d, i) => (
              <span key={d} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, border: `1.5px solid ${i === tickerIdx % 18 ? '#667eea' : '#e8e8e8'}`, color: i === tickerIdx % 18 ? '#667eea' : '#555', background: i === tickerIdx % 18 ? '#f0edff' : 'white', transition: 'all 0.3s' }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="pill" style={{ marginBottom: 14 }}>Features</div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800 }}>Built for the launch grind</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {[
            { e: '🤖', t: 'AI Form Autofill', d: 'Claude AI reads every field and fills it with product-aware content. Taglines, descriptions, categories — all handled perfectly.', tag: 'Core' },
            { e: '🚀', t: 'Launch Queue', d: 'Queue 50 directories at once. Extension opens each tab automatically and fills it. You just review and click submit.', tag: 'Automation' },
            { e: '✍️', t: 'AI Social Content', d: 'Platform-specific launch posts for Product Hunt, Reddit, X, LinkedIn, HN — in 5 tones. Generated in seconds.', tag: 'Content' },
            { e: '🔍', t: 'Approval Detection', d: 'Extension passively detects when your listing goes live — even when you\'re not watching. Dashboard updates automatically.', tag: 'Smart' },
            { e: '📊', t: 'Submission Analytics', d: 'Track every submission — submitted, approved, rejected, backlink live. See your launch score grow in real time.', tag: 'Dashboard' },
            { e: '🗂️', t: '90+ Curated Directories', d: 'Hand-picked, sorted by domain rating and approval rate. Know which ones are worth your time before you visit.', tag: 'Database' },
          ].map(f => (
            <div key={f.t} className="card" style={{ display: 'flex', gap: 16 }}>
              <div style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>{f.e}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{f.t}</h3>
                  <span style={{ fontSize: 10, color: '#667eea', background: '#f0edff', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>{f.tag}</span>
                </div>
                <p style={{ fontSize: 14, color: '#777', lineHeight: 1.65, fontWeight: 400 }}>{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF */}
      <section style={{ background: '#f5f5f3', padding: '72px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="pill" style={{ marginBottom: 14 }}>Results</div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 34, fontWeight: 800 }}>Numbers don't lie</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, marginBottom: 24 }}>
            {[
              { val: '50+', label: 'Directories per session', sub: 'submitted in one afternoon', c: '#667eea' },
              { val: '20h', label: 'Saved per launch', sub: 'vs doing it manually', c: '#f093fb' },
              { val: '3x', label: 'More backlinks', sub: 'compared to manual submit', c: '#10b981' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 44, fontWeight: 800, color: s.c, marginBottom: 6 }}>{s.val}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: '#999' }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { t: 'Submitted 47 directories in one afternoon. Got 23 approved in week one. Would have taken me a month manually.', a: 'Indie founder, r/SideProject' },
              { t: 'The AI fill is genuinely impressive. It picks the right category dropdown, writes a platform-specific tagline, everything.', a: 'Solo developer, ProductHunt' },
            ].map((q, i) => (
              <div key={i} className="card">
                <div style={{ fontSize: 22, marginBottom: 12 }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 14, fontStyle: 'italic', fontWeight: 400 }}>"{q.t}"</p>
                <span style={{ fontSize: 12, color: '#aaa' }}>— {q.a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ maxWidth: 860, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="pill" style={{ marginBottom: 14 }}>Pricing</div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800 }}>Start free. Launch today.</h2>
          <p style={{ color: '#777', fontSize: 15, marginTop: 10 }}>No credit card required.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
          {[
            { name: 'Free', price: '₹0', period: 'forever', features: ['90+ directory tracker','5 AI fills/month','Manual submission','Basic analytics'], cta: 'Start free', hi: false, tag: '' },
            { name: 'Pro', price: '₹999', period: '/month', features: ['Everything in Free','100 AI fills/month','Extension autofill','Launch Queue','Analytics'], cta: 'Start Pro', hi: true, tag: 'Most popular' },
            { name: 'Scale', price: '₹2499', period: '/month', features: ['Everything in Pro','500 AI fills/month','Multi-product (5)','Priority support','White-glove launch'], cta: 'Start Scale', hi: false, tag: '' },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.hi ? 'linear-gradient(135deg,#667eea,#764ba2)' : 'white', borderRadius: 20, padding: 26, border: plan.hi ? 'none' : '1px solid #f0f0f0', position: 'relative', transition: 'transform 0.2s', }}>
              {plan.tag && <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: '#f093fb', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>{plan.tag}</div>}
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: plan.hi ? 'white' : '#1a1a1a', marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: plan.hi ? 'white' : '#1a1a1a', fontFamily: 'Syne,sans-serif' }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: plan.hi ? 'rgba(255,255,255,0.65)' : '#aaa' }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', marginBottom: 22 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: plan.hi ? 'rgba(255,255,255,0.88)' : '#666', marginBottom: 9, display: 'flex', gap: 7, fontWeight: 400 }}>
                    <span style={{ color: plan.hi ? 'rgba(255,255,255,0.7)' : '#667eea', flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: 11, background: plan.hi ? 'white' : 'linear-gradient(135deg,#667eea,#764ba2)', color: plan.hi ? '#667eea' : 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                {plan.cta} →
              </Link>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#aaa' }}>🔒 Razorpay payments · Cancel anytime · No hidden fees</p>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '72px 24px', textAlign: 'center', background: '#fafaf8' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginBottom: 14 }}>
            Your SaaS deserves to be <span className="gtext">found.</span>
          </h2>
          <p style={{ color: '#777', fontSize: 16, marginBottom: 32, lineHeight: 1.7, fontWeight: 400 }}>
            Stop spending weekends on directory forms. Start getting discovered.
          </p>
          <Link href="/signup" className="btn" style={{ padding: '15px 36px', borderRadius: 15, fontSize: 16 }}>
            Start free — 2 minutes to launch →
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: '#bbb' }}>Free plan · No card · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #eee', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 10 }}>D</div>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15 }}>Dicrecto</span>
            <span style={{ color: '#ddd' }}>·</span>
            <span style={{ color: '#bbb', fontSize: 13 }}>© 2025</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy','Terms','Contact'].map(l => <a key={l} href="#" style={{ color: '#aaa', fontSize: 13, textDecoration: 'none' }}>{l}</a>)}
          </div>
        </div>
      </footer>
    </div>
  )
}