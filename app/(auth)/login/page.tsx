'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

 const handleGoogle = async () => {
  setGoogleLoading(true)

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/auth/callback`
    }
  })
}

 const handleGithub = async () => {
  setGithubLoading(true)

  await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${location.origin}/auth/callback`
    }
  })
}
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', display: 'flex', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Syne:wght@800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .input { width:100%; background:white; border:1.5px solid #e8e8e8; border-radius:10px; padding:10px 14px; font-size:14px; color:#1a1a1a; outline:none; transition:border-color 0.2s; font-family:inherit; }
        .input:focus { border-color:#667eea; }
        .input::placeholder { color:#bbb; }
        .oauth-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; background:white; border:1.5px solid #e8e8e8; border-radius:11px; padding:11px; font-size:14px; font-weight:600; color:#333; cursor:pointer; transition:border-color 0.2s,background 0.2s; font-family:inherit; }
        .oauth-btn:hover { border-color:#ccc; background:#fafafa; }
        .oauth-btn:disabled { opacity:0.6; cursor:default; }
        .submit-btn { width:100%; background:linear-gradient(135deg,#667eea,#764ba2); color:white; border:none; border-radius:11px; padding:12px; font-size:15px; font-weight:700; cursor:pointer; transition:opacity 0.2s,transform 0.15s; font-family:inherit; }
        .submit-btn:hover { opacity:0.9; transform:translateY(-1px); }
        .submit-btn:disabled { opacity:0.5; cursor:default; transform:none; }
      `}</style>

      {/* LEFT PANEL */}
      <div style={{ width: '45%', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 60%,#f093fb 100%)', padding: '48px 40px', flexDirection: 'column', justifyContent: 'space-between', display: 'flex' }} className="hidden lg:flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>D</div>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: 'white' }}>Dicrecto</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { val: '90+', label: 'Directories' },
            { val: '2 min', label: 'To launch' },
            { val: 'AI ⚡', label: 'Auto-fill' },
            { val: 'Live', label: 'Tracking' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>
            "Submitted my SaaS to 50 directories in one afternoon. Got 23 approved in week one."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>👤</div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Indie founder, r/SideProject</span>
          </div>
        </div>

        <div>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 8 }}>
            Launch everywhere<br />before lunch.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>One platform. 90+ directories. Zero hassle.</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>D</div>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: '#1a1a1a' }}>Dicrecto</span>
          </div>

          <h1 style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#1a1a1a', marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>Sign in to your launch dashboard</p>

          {/* OAuth */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <button onClick={handleGoogle} disabled={googleLoading} className="oauth-btn">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
              {googleLoading ? 'Redirecting...' : 'Continue with Google'}
            </button>
            <button onClick={handleGithub} disabled={githubLoading} className="oauth-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1a1a">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              {githubLoading ? 'Redirecting...' : 'Continue with GitHub'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#eee' }} />
            <span style={{ fontSize: 12, color: '#bbb' }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: '#eee' }} />
          </div>

          {error && (
            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 6, display: 'block' }}>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="founder@startup.com" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>Password</label>
                <span style={{ fontSize: 12, color: '#667eea', cursor: 'pointer' }}>Forgot password?</span>
              </div>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
          </div>

          <button className="submit-btn" onClick={handleLogin} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>

          <p style={{ fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 14 }}>🔒 Your data is encrypted and private</p>

          <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginTop: 20 }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}