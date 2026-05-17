'use client'

import Link from 'next/link'

const features = [
  { emoji: '🤖', title: 'AI Launch Content', desc: 'Platform-aware copy for Product Hunt, Reddit, X, LinkedIn — generated instantly.' },
  { emoji: '📁', title: '90+ Directories', desc: 'Submit to every major startup directory from one place. No tabs, no copy-paste.' },
  { emoji: '🧩', title: 'Chrome Extension', desc: 'AI auto-fills any directory form. Just review, solve CAPTCHA, and submit.' },
  { emoji: '🔗', title: 'Backlink Tracking', desc: 'Monitor live listings, dofollow status, and approval — all in real time.' },
]

const steps = [
  { num: '01', title: 'Add your product', desc: 'Name, URL, description — done in 30 seconds.' },
  { num: '02', title: 'Pick directories', desc: 'Choose from 90+ curated directories.' },
  { num: '03', title: 'Extension fills forms', desc: 'AI auto-fills every form field on every site.' },
  { num: '04', title: 'Track everything', desc: 'Approvals, backlinks, visibility — one dashboard.' },
]

const testimonials = [
  { text: 'Submitted my SaaS to 50 directories in one afternoon. Got 3 backlinks on day one.', name: 'Indie founder', handle: '@buildinpublic' },
  { text: 'Finally a tool that does the boring part of launching. The AI fill is genuinely magic.', name: 'Solo developer', handle: '@solodev' },
  { text: 'Saved me 20+ hours of copy-pasting. Worth every rupee.', name: 'SaaS builder', handle: '@saasbuilder' },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#fafaf8', minHeight: '100vh', color: '#1a1a1a' }}>
      
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .hero-grad { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
        .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.12); }
        .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; cursor: pointer; transition: opacity 0.2s, transform 0.2s; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .pill { display: inline-flex; align-items: center; gap: 6px; background: #f0edff; color: #6b46c1; padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 500; }
        .feature-card { background: white; border-radius: 20px; padding: 28px; border: 1px solid #f0f0f0; }
        .step-num { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #667eea, #f093fb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; }
        .gradient-text { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .noise { position: relative; }
        .noise::before { content: ''; position: absolute; inset: 0; opacity: 0.03; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); pointer-events: none; border-radius: inherit; }
        @keyframes float { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
        .float { animation: float 4s ease-in-out infinite; }
        .float-delay { animation: float 4s ease-in-out infinite 1s; }
      `}</style>

      {/* NAV */}
      <nav style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>D</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#1a1a1a' }}>Dicrecto</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/login" style={{ padding: '8px 16px', borderRadius: 10, color: '#666', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Sign in</Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Get started free →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          <div className="pill" style={{ marginBottom: 20 }}>
            <span>🚀</span> Used by indie founders worldwide
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 52, fontWeight: 800, lineHeight: 1.1, marginBottom: 20, color: '#1a1a1a' }}>
            Launch your SaaS on{' '}
            <span className="gradient-text">90+ directories</span>{' '}
            — automatically.
          </h1>
          <p style={{ fontSize: 18, color: '#666', lineHeight: 1.7, marginBottom: 32 }}>
            Dicrecto's AI Chrome extension auto-fills every directory form. You click submit. We track everything.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn-primary" style={{ padding: '14px 28px', borderRadius: 14, textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>
              Start for free →
            </Link>
            <a href="#how" style={{ padding: '14px 28px', borderRadius: 14, border: '2px solid #e8e8e8', color: '#333', textDecoration: 'none', fontSize: 15, fontWeight: 600, background: 'white', transition: 'border-color 0.2s' }}>
              See how it works
            </a>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 24 }}>
            {[
              { num: '90+', label: 'Directories' },
              { num: '2 min', label: 'Setup time' },
              { num: 'Free', label: 'To start' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#1a1a1a' }}>{s.num}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div style={{ position: 'relative' }}>
          <div className="float" style={{ background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 40px 100px rgba(102,126,234,0.15)', border: '1px solid #f0f0f0' }}>
            {/* Fake browser */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '6px 12px', fontSize: 11, color: '#999', marginBottom: 16 }}>
              app.dicrecto.com/dashboard/launch
            </div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Submitted', val: '47', color: '#667eea' },
                { label: 'Approved', val: '23', color: '#10b981' },
                { label: 'Pending', val: '19', color: '#f59e0b' },
                { label: 'Backlinks', val: '18', color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fafaf8', borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Syne, sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Directory list */}
            {[
              { name: 'Product Hunt', status: 'Approved', color: '#10b981', bg: '#f0fdf4' },
              { name: 'BetaList', status: 'Pending', color: '#f59e0b', bg: '#fffbeb' },
              { name: 'IndieHackers', status: 'Submitted', color: '#667eea', bg: '#f0edff' },
            ].map(d => (
              <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{d.name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: d.color, background: d.bg, padding: '3px 10px', borderRadius: 999 }}>{d.status}</span>
              </div>
            ))}
          </div>

          {/* Floating extension card */}
          <div className="float-delay" style={{ position: 'absolute', bottom: -20, right: -20, background: 'white', borderRadius: 16, padding: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #f0f0f0', minWidth: 200 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>🧩 Extension active</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>AI filling BetaList...</div>
            <div style={{ height: 4, background: '#f0f0f0', borderRadius: 999 }}>
              <div style={{ height: 4, width: '70%', background: 'linear-gradient(90deg, #667eea, #f093fb)', borderRadius: 999 }} />
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS BAR */}
      <section style={{ background: '#f5f5f3', padding: '24px', textAlign: 'center', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
        <p style={{ fontSize: 12, color: '#999', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Submits to directories like</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          {['Product Hunt', 'BetaList', 'IndieHackers', 'G2', 'Capterra', 'SaaSHub', 'Futurepedia', 'Uneed'].map(name => (
            <span key={name} style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>{name}</span>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="pill" style={{ marginBottom: 16 }}>How it works</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, color: '#1a1a1a' }}>Launch in 4 simple steps</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {steps.map(s => (
            <div key={s.num} className="feature-card card-hover">
              <div className="step-num">{s.num}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '12px 0 8px' }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: '#f5f5f3', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="pill" style={{ marginBottom: 16 }}>Features</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, color: '#1a1a1a' }}>Everything you need to launch</h2>
            <p style={{ color: '#666', fontSize: 16, marginTop: 12 }}>Built specifically for SaaS founders — not generic social tools.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} className="feature-card card-hover" style={{ display: 'flex', gap: 20 }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>{f.emoji}</div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="pill" style={{ marginBottom: 16 }}>Social proof</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, color: '#1a1a1a' }}>Founders love Dicrecto</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {testimonials.map((t, i) => (
            <div key={i} className="feature-card card-hover">
              <div style={{ fontSize: 32, marginBottom: 16 }}>⭐⭐⭐⭐⭐</div>
              <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{t.handle}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: '#f5f5f3', padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="pill" style={{ marginBottom: 16 }}>Pricing</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 40, fontWeight: 800, color: '#1a1a1a' }}>Simple, founder-friendly pricing</h2>
            <p style={{ color: '#666', fontSize: 16, marginTop: 12 }}>Start free. Upgrade when you're ready.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            {[
              { name: 'Free', price: '₹0', desc: 'Forever', features: ['90+ directory tracker', '5 AI fills/month', 'Manual submission', 'Lifetime tracking'], cta: 'Get started', highlight: false },
              { name: 'Pro', price: '₹999', desc: '/month', features: ['Everything in Free', '100 AI fills/month', 'Extension autofill', 'Analytics dashboard', 'Launch calendar'], cta: 'Start Pro', highlight: true },
              { name: 'Scale', price: '₹2499', desc: '/month', features: ['Everything in Pro', '500 AI fills/month', 'Multi-product (5)', 'Priority support', 'White-glove launch'], cta: 'Start Scale', highlight: false },
            ].map(plan => (
              <div key={plan.name} className="card-hover" style={{
                background: plan.highlight ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'white',
                borderRadius: 20,
                padding: 28,
                border: plan.highlight ? 'none' : '1px solid #f0f0f0',
                position: 'relative',
              }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#f093fb', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 999 }}>
                    MOST POPULAR
                  </div>
                )}
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: plan.highlight ? 'white' : '#1a1a1a', marginBottom: 4 }}>{plan.name}</h3>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: plan.highlight ? 'white' : '#1a1a1a', fontFamily: 'Syne, sans-serif' }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#999' }}>{plan.desc}</span>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: 24 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.9)' : '#555', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: plan.highlight ? '#fff' : '#667eea' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: 12,
                  background: plan.highlight ? 'white' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: plan.highlight ? '#667eea' : 'white',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                  {plan.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 44, fontWeight: 800, color: '#1a1a1a', marginBottom: 16, lineHeight: 1.2 }}>
            Your SaaS deserves to be{' '}
            <span className="gradient-text">discovered.</span>
          </h2>
          <p style={{ color: '#666', fontSize: 16, marginBottom: 32 }}>
            Join founders already launching with Dicrecto. Free to start.
          </p>
          <Link href="/signup" className="btn-primary" style={{ padding: '16px 40px', borderRadius: 16, textDecoration: 'none', fontSize: 16, fontWeight: 700 }}>
            Start launching for free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #eee', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 11 }}>D</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#1a1a1a' }}>Dicrecto</span>
        </div>
        <p style={{ color: '#999', fontSize: 13 }}>© 2025 Dicrecto. Built for founders, by founders.</p>
      </footer>

    </div>
  )
}